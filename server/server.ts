import express from "express";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { SarvamAIClient } from "sarvamai";

dotenv.config();

const app = express();

const allowedOrigins = new Set(
  [
    "https://neuropathshala.vercel.app",
    "http://localhost:3000",
    "http://localhost:5173",
    ...(process.env.ALLOWED_ORIGINS || "").split(",")
  ]
    .map((origin) => origin.trim())
    .filter(Boolean)
);

const requestCounts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 60;

function getClientAddress(remoteAddress?: string): string {
  return remoteAddress || "unknown";
}

function isStringWithin(value: unknown, maxLength: number): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= maxLength;
}

/* =========================
   CORS
========================= */

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.has(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Vary", "Origin");
  }
  res.header(
    "Access-Control-Allow-Methods",
    "GET,POST,OPTIONS"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type"
  );
  res.header("X-Content-Type-Options", "nosniff");
  res.header("X-Frame-Options", "DENY");
  res.header("Referrer-Policy", "no-referrer");
  res.header("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'");

  const address = getClientAddress(req.socket.remoteAddress);
  const now = Date.now();
  const current = requestCounts.get(address);
  if (!current || current.resetAt <= now) {
    requestCounts.set(address, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
  } else {
    current.count += 1;
    if (current.count > RATE_LIMIT_MAX_REQUESTS) {
      return res.status(429).json({ success: false, error: "Too many requests. Try again shortly." });
    }
  }

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

app.use(express.json({ limit: "32kb" }));

app.post("/api/sync", async (req, res) => {
  const { queue } = req.body;
  if (!Array.isArray(queue)) {
    return res.status(400).json({ success: false, error: "Invalid sync queue" });
  }
  return res.json({
    success: true,
    accepted: queue.length,
    syncedAt: new Date().toISOString()
  });
});

app.post("/api/language-pack/review", async (req, res) => {
  const { targetLanguage, items } = req.body;
  if (!isStringWithin(targetLanguage, 32) || !Array.isArray(items) || items.length > 100) {
    return res.status(400).json({ success: false, error: "Invalid language-pack review" });
  }
  return res.json({ success: true, targetLanguage, accepted: items.length, reviewedAt: new Date().toISOString() });
});

/* =========================
   API KEYS
========================= */

const geminiKey = process.env.GEMINI_API_KEY;
const sarvamKey = process.env.SARVAM_API_KEY;
const nvidiaKey = process.env.NVIDIA_API_KEY;

/* =========================
   AI CLIENTS
========================= */

const gemini = geminiKey ? new GoogleGenAI({ apiKey: geminiKey }) : null;

const sarvam = sarvamKey ? new SarvamAIClient({ apiSubscriptionKey: sarvamKey }) : null;

function requireProvider<T>(provider: T | null, name: string): T {
  if (!provider) {
    throw new Error(`${name} is not configured. Local/offline resources remain available.`);
  }
  return provider;
}

/* =========================
   PROVIDER RETRY / RESILIENCE
========================= */

function getProviderStatus(error: unknown): number | undefined {
  if (!error || typeof error !== "object") return undefined;

  const candidate = error as {
    status?: unknown;
    statusCode?: unknown;
    response?: { status?: unknown };
    cause?: { status?: unknown; statusCode?: unknown };
  };

  const values = [
    candidate.status,
    candidate.statusCode,
    candidate.response?.status,
    candidate.cause?.status,
    candidate.cause?.statusCode
  ];

  for (const value of values) {
    if (typeof value === "number" && Number.isInteger(value)) {
      return value;
    }
  }

  return undefined;
}

function isRetryableProviderError(error: unknown): boolean {
  const status = getProviderStatus(error);

  if (status !== undefined) {
    return [408, 425, 429, 500, 502, 503, 504].includes(status);
  }

  const message = error instanceof Error ? error.message : String(error);

  return /timeout|timed out|temporar|overload|resource exhausted|rate limit|too many requests|fetch failed|ECONNRESET|ECONNREFUSED|ETIMEDOUT|503/i.test(
    message
  );
}

function getRetryDelayMs(attempt: number): number {
  // 600ms, 1200ms, 2400ms + small jitter.
  return 600 * 2 ** attempt + Math.floor(Math.random() * 250);
}

async function withProviderRetry<T>(
  operation: () => Promise<T>,
  providerName: string,
  maxAttempts = 3
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      const retryable = isRetryableProviderError(error);

      if (!retryable || attempt === maxAttempts) {
        throw error;
      }

      const delay = getRetryDelayMs(attempt - 1);
      const status = getProviderStatus(error);

      console.warn(
        `[provider-retry] ${providerName} attempt ${attempt}/${maxAttempts} failed` +
          `${status ? ` (HTTP ${status})` : ""}; retrying in ${delay}ms`
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error(`${providerName} request failed after retries`);
}

/* =========================
   NVIDIA NIM HELPER
========================= */

async function generateWithNvidia(
  prompt: string
): Promise<string> {
  if (!nvidiaKey) {
    throw new Error("NVIDIA_API_KEY is missing");
  }

  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, 30000);

  try {
    const response = await fetch(
      "https://integrate.api.nvidia.com/v1/chat/completions",
      {
        method: "POST",

        headers: {
          Authorization: `Bearer ${nvidiaKey}`,
          "Content-Type": "application/json",
          Accept: "application/json"
        },

        body: JSON.stringify({
          model:
            "deepseek-ai/deepseek-v4-pro-0813",

          messages: [
            {
              role: "user",
              content: prompt
            }
          ],

          temperature: 0.2,
          max_tokens: 4000
        }),

        signal: controller.signal
      }
    );

    if (!response.ok) {
      const errorText =
        await response.text();

      throw new Error(
        `NVIDIA API HTTP ${response.status}: ${errorText}`
      );
    }

    const data =
      await response.json();

    const text =
      data?.choices?.[0]?.message?.content?.trim();

    if (!text) {
      throw new Error(
        "NVIDIA returned empty content"
      );
    }

    return text;

  } finally {
    clearTimeout(timeout);
  }
}

/* =========================
   HINDI ↔ TRIBAL LANGUAGE TRANSLATION
========================= */

function toSarvamLanguageCode(language: string): "hi-IN" | "sat-IN" {
  const normalized = language.toLowerCase().trim();

  if (normalized === "hindi" || normalized === "hi" || normalized === "hi-in") {
    return "hi-IN";
  }

  if (normalized === "santhali" || normalized === "santali" || normalized === "sat" || normalized === "sat-in") {
    return "sat-IN";
  }

  throw new Error(`Sarvam does not support this language: ${language}`);
}

function displayLanguageName(language: string): string {
  const normalized = language.toLowerCase().trim();
  if (normalized === "ho" || normalized === "ho-in") return "Ho";
  if (normalized === "mundari" || normalized === "unr" || normalized === "unr-in") return "Mundari";
  if (normalized === "santhali" || normalized === "santali" || normalized === "sat" || normalized === "sat-in") return "Santhali";
  return "Hindi";
}

app.post("/api/translate", async (req, res) => {
  const startedAt = Date.now();
  let provider = "unknown";
  let sourceLanguage = "unknown";
  let targetLanguage = "unknown";

  try {
    const {
      text,
      sourceLanguage: requestedSourceLanguage,
      targetLanguage: requestedTargetLanguage
    } = req.body;
    sourceLanguage = requestedSourceLanguage;
    targetLanguage = requestedTargetLanguage;

    const allowedLanguages = new Set(["Hindi", "Santhali", "Ho", "Mundari", "hi", "sat", "ho", "unr", "hi-IN", "sat-IN", "ho-IN", "unr-IN"]);
    if (
      !isStringWithin(text, 4000) ||
      !isStringWithin(sourceLanguage, 32) ||
      !isStringWithin(targetLanguage, 32) ||
      !allowedLanguages.has(sourceLanguage) ||
      !allowedLanguages.has(targetLanguage)
    ) {
      return res.status(400).json({
        success: false,
        error: "Missing translation fields"
      });
    }

    const sourceName = displayLanguageName(sourceLanguage);
    const targetName = displayLanguageName(targetLanguage);

    // Ho and Mundari are routed through the configured AI model because the
    // installed Sarvam SDK currently exposes Hindi and Santhali translation codes only.
    if (sourceName === "Ho" || sourceName === "Mundari" || targetName === "Ho" || targetName === "Mundari") {
      provider = "Gemini";
      const response = await withProviderRetry(
        () =>
          requireProvider(gemini, "Gemini").models.generateContent({
            model: "gemini-3.6-flash",
            contents: `Translate this primary-school FLN classroom phrase from ${sourceName} to ${targetName}. Preserve the meaning and return only the translation. If the language is unsupported, return UNSUPPORTED. Text: ${text}`
          }),
        "Gemini translation"
      );
      const translatedText = response.text?.trim();

      if (!translatedText || translatedText === "UNSUPPORTED") {
        throw new Error(`${targetName} translation is unavailable from the configured AI provider`);
      }

      return res.json({
        success: true,
        translatedText,
        sourceLanguage,
        targetLanguage,
        provider: "Gemini language bridge",
        statusNote: "AI-generated prototype translation — verify with a native speaker."
      });
    }

    provider = "Sarvam";
    const response = await withProviderRetry(
      () =>
        requireProvider(sarvam, "Sarvam").text.translate({
          input: text,

          source_language_code: toSarvamLanguageCode(sourceLanguage),
          target_language_code: toSarvamLanguageCode(targetLanguage),

          model: "sarvam-translate:v1"
        }),
      "Sarvam translation"
    );

    res.json({
      success: true,
      translatedText:
        response.translated_text,
      sourceLanguage,
      targetLanguage,
      provider: "Sarvam"
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const duration = Date.now() - startedAt;
    console.error("[translate] provider failure", {
      provider,
      sourceLanguage,
      targetLanguage,
      error: errorMessage,
      duration
    });

    const status = getProviderStatus(error);
    const responseStatus =
      status === 429
        ? 429
        : status !== undefined && status >= 500 && status <= 599
          ? 503
          : 500;

    res.status(responseStatus).json({
      success: false,
      error:
        responseStatus === 429
          ? "Translation provider is rate-limited. Please retry shortly."
          : responseStatus === 503
            ? "Translation provider is temporarily unavailable. Please retry."
            : "Translation service unavailable",
      provider,
      retryable: responseStatus === 429 || responseStatus === 503
    });
  } finally {
    console.log(`[translate] ${sourceLanguage} -> ${targetLanguage}: ${Date.now() - startedAt}ms`);
  }
});

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    service: "neuropathshala-backend"
  });
});

/* =========================
   TEXT TO SPEECH
========================= */

app.post("/api/speech", async (req, res) => {
  try {
    const { text, languageCode = "hi-IN" } = req.body;

    if (!isStringWithin(text, 1500) || !isStringWithin(languageCode, 16)) {
      return res.status(400).json({ success: false, error: "Missing speech text" });
    }

    // Do not return Hindi audio while presenting it as a tribal-language voice.
    if (languageCode !== "hi-IN") {
      return res.status(501).json({
        success: false,
        error: "Verified native-language audio is not configured for this language.",
        requestedLanguage: languageCode,
        capability: "text-only"
      });
    }

    const response = await requireProvider(sarvam, "Sarvam").textToSpeech.convert({
      text: text.slice(0, 1500),
      language_code: "hi-IN",
      speaker: "anushka",
      model: "bulbul:v3",
      output_audio_codec: "wav"
    });

    const audioBase64 = response.audios?.[0];
    if (!audioBase64) {
      throw new Error("Sarvam returned no audio");
    }

    return res.json({
      success: true,
      audioBase64,
      mimeType: "audio/wav",
      requestedLanguage: languageCode,
      spokenLanguage: "hi-IN",
      provider: "Sarvam Bulbul TTS"
    });
  } catch (error) {
    console.error("Speech generation error:", error);
    return res.status(500).json({ success: false, error: "Speech generation failed" });
  }
});

/* =========================
   GEMINI TEST
========================= */

app.get("/api/gemini-test", async (_req, res) => {
  try {
    const response =
      await gemini.models.generateContent({
        model: "gemini-3.6-flash",
        contents:
          "Reply with exactly: Gemini OK"
      });

    res.json({
      success: true,
      message: response.text
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error: "Gemini request failed"
    });
  }
});

/* =========================
   AI LESSON GENERATOR
========================= */

app.post(
  "/api/generate-lesson",
  async (req, res) => {
    try {
      const {
        grade,
        subject,
        topic,
        difficulty,
        durationMinutes,
        localContext,
        targetLanguage = "Santhali"
      } = req.body;

      if (
        !isStringWithin(grade, 32) ||
        !isStringWithin(subject, 64) ||
        !isStringWithin(topic, 500) ||
        !Number.isInteger(durationMinutes) || durationMinutes < 5 || durationMinutes > 180 ||
        !isStringWithin(localContext, 300) ||
        !isStringWithin(targetLanguage, 32)
      ) {
        return res.status(400).json({
          success: false,
          error:
            "Missing lesson generation fields"
        });
      }

      const prompt = `
You are NeuroPathshala, an AI teaching assistant for the Jharkhand PALASH MTB-MLE program.

Create a classroom-ready foundational lesson plan for a Hindi-medium primary teacher teaching children through a ${targetLanguage} mother-tongue bridge.

INPUT:
Grade: ${grade}
Subject: ${subject}
Topic: ${topic}
Difficulty: ${difficulty || "Beginner"}
Duration: ${durationMinutes} minutes
Jharkhand Local Context: ${localContext}
Target Mother Tongue: ${targetLanguage}
NIPUN Bharat Outcome: State the specific foundational literacy or numeracy competency this lesson develops.

IMPORTANT:
- Keep the lesson appropriate for the specified grade.
- Align with foundational literacy/numeracy (FLN) principles.
- Use concrete, child-friendly activities.
- Ground examples in the supplied Jharkhand local context.
- Do NOT invent claims about official curriculum certification.
- All ${targetLanguage} phrases must be presented as AI-generated suggestions that require native-speaker verification.
- Return ONLY valid JSON.
- Do not use markdown.
- Do not use code fences.

Return exactly this structure:

{
  "title": "string",
  "objective": "string",
  "materials": ["string"],
  "warmUp": "string",
  "teacherExplanation": "string",
  "localContextExample": "string",
  "classroomActivity": "string",
  "practice": "string",
  "assessment": "string",
  "motherTongueSupport": {
    "language": "${targetLanguage}",
    "keyPhrases": [
      {
        "hindi": "string",
        "translatedText": "string",
        "phonetic": "string"
      }
    ]
  }
}

Generate 3 to 5 useful classroom support phrases in ${targetLanguage}.
`;

      const response =
        await gemini.models.generateContent({
          model: "gemini-3.6-flash",
          contents: prompt
        });

      const rawText =
        response.text?.trim();

      if (!rawText) {
        throw new Error(
          "Gemini returned an empty lesson"
        );
      }

      const cleanedText =
        rawText
          .replace(
            /^```json\s*/i,
            ""
          )
          .replace(
            /^```\s*/i,
            ""
          )
          .replace(
            /\s*```$/i,
            ""
          )
          .trim();

      const lesson =
        JSON.parse(cleanedText);

      res.json({
        success: true,
        lesson,
        provider: "Gemini"
      });

    } catch (error) {
      console.error(
        "Lesson generation error:",
        error
      );

      res.status(500).json({
        success: false,
        error:
          "Gemini lesson generation failed"
      });
    }
  }
);

/* =========================
   AI WORKSHEET GENERATOR
========================= */

app.post(
  "/api/generate-worksheet",
  async (req, res) => {
    try {
      const {
        grade,
        subject,
        topic,
        questionType,
        itemCount,
        localContext,
        targetLanguage = "Santhali"
      } = req.body;

      if (
        !isStringWithin(grade, 32) ||
        !isStringWithin(subject, 64) ||
        !isStringWithin(topic, 500) ||
        !Number.isInteger(itemCount) || itemCount < 1 || itemCount > 20 ||
        !isStringWithin(localContext, 300) ||
        !isStringWithin(targetLanguage, 32)
      ) {
        return res.status(400).json({
          success: false,
          error:
            "Missing worksheet generation fields"
        });
      }

      const prompt = `
You are NeuroPathshala, an AI teaching assistant for the Jharkhand PALASH MTB-MLE program.

Create a Grade ${grade} foundational ${subject} worksheet for a Hindi-medium teacher using a ${targetLanguage} mother-tongue bridge.

PRIMARY LEARNING TOPIC:
${topic}

QUESTION TYPE:
${questionType}

NUMBER OF QUESTIONS:
${itemCount}

LOCAL REALIA CONTEXT:
${localContext}

TARGET MOTHER TONGUE: ${targetLanguage}
NIPUN BHARAT ALIGNMENT: Include a short foundational literacy or numeracy learning outcome in the activity instructions.

==================================================
CRITICAL CONTENT RULE
==================================================

The PRIMARY LEARNING TOPIC is the most important instruction.

Every question MUST directly teach or assess the PRIMARY LEARNING TOPIC.

The LOCAL REALIA CONTEXT is ONLY a supporting real-life setting.

The local context MUST NOT replace, change, or override the topic.

==================================================
EXAMPLE OF CORRECT BEHAVIOUR
==================================================

If:

PRIMARY LEARNING TOPIC:
"Counting Forest Seeds 1 to 5"

LOCAL REALIA CONTEXT:
"Village Haat & Vegetables"

Then the worksheet MUST remain about:

- Forest seeds
- Natural seeds
- Nuts
- Berries
- Other clearly forest-related natural counting objects

The questions MUST NOT become questions about:

- Tomatoes
- Eggplants
- Chillies
- Vegetables
- Other market products

just because the local context is a village haat.

The topic determines WHAT the child learns.

The local context determines WHERE or HOW the concept can be presented.

Never allow the local context to override the learning topic.

==================================================
STRICT TOPIC ALIGNMENT
==================================================

- Follow the topic literally and precisely.
- Do not introduce unrelated learning concepts.
- Do not replace the topic with the local context.
- Every question must be directly connected to the topic.
- Keep the questions appropriate for Grade ${grade}.
- Use simple, child-friendly language.
- Keep questions classroom-printable and unambiguous.
- For counting topics, use the exact objects specified by the topic whenever possible.
- For "Counting ... 1 to 5", quantities MUST be between 1 and 5.
- Make all counting quantities and answers mathematically correct.
- Use visual symbols/emojis when useful.
- Include Hindi and ${targetLanguage} prompts.
- ${targetLanguage} text is AI-generated and MUST be treated as requiring native-speaker verification.
- Generate EXACTLY ${itemCount} questions.
- Do not add extra questions.
- Return ONLY valid JSON.
- Do not use markdown.
- Do not use code fences.

==================================================
QUESTION QUALITY
==================================================

Each question should:

1. Directly assess the specified topic.
2. Be suitable for the specified grade.
3. Use a clear visual when appropriate.
4. Have one unambiguous correct answer.
5. Use simple Hindi.
6. Provide a corresponding Santhali prompt.
7. Keep the learning objective unchanged.

==================================================
OUTPUT FORMAT
==================================================

Return exactly this JSON structure:

{
  "instructionsHindi": "string",
  "instructionsTargetLanguage": "string",
  "activityInstructions": "string",
  "answerKeyNotes": "string",
  "questions": [
    {
      "questionNumber": 1,
      "type": "${questionType}",
      "promptHindi": "string",
      "promptTargetLanguage": "string",
      "visualSymbol": "string",
      "options": ["string"],
      "answer": "string"
    }
  ]
}

Generate exactly ${itemCount} questions.
`;

      const response =
        await gemini.models.generateContent({
          model: "gemini-3.6-flash",
          contents: prompt
        });

      const rawText =
        response.text?.trim();

      if (!rawText) {
        throw new Error(
          "Gemini returned an empty worksheet"
        );
      }

      const cleanedText =
        rawText
          .replace(
            /^```json\s*/i,
            ""
          )
          .replace(
            /^```\s*/i,
            ""
          )
          .replace(
            /\s*```$/i,
            ""
          )
          .trim();

      const worksheet =
        JSON.parse(cleanedText);

      res.json({
        success: true,
        worksheet,
        provider: "Gemini"
      });

    } catch (error) {
      console.error(
        "Worksheet generation error:",
        error
      );

      res.status(500).json({
        success: false,
        error:
          "Gemini worksheet generation failed"
      });
    }
  }
);

/* =========================
   AI FLASHCARD GENERATOR
========================= */

app.post(
  "/api/generate-flashcards",
  async (req, res) => {
    try {
      const {
        category,
        topic,
        count,
        targetLanguage = "Santhali"
      } = req.body;

      if (
        !isStringWithin(category, 64) ||
        !isStringWithin(topic, 500) ||
        !Number.isInteger(count) || count < 1 || count > 30 ||
        !isStringWithin(targetLanguage, 32)
      ) {
        return res.status(400).json({
          success: false,
          error:
            "Missing flashcard generation fields"
        });
      }

      const prompt = `
You are NeuroPathshala, an AI teaching assistant for the Jharkhand PALASH MTB-MLE program.

Create exactly ${count} bilingual foundational flashcards for Hindi and ${targetLanguage}.

CATEGORY:
${category}

TARGET MOTHER TONGUE: ${targetLanguage}
NIPUN BHARAT ALIGNMENT: Keep the cards focused on a clear foundational literacy or numeracy outcome.

PRIMARY LEARNING TOPIC:
${topic}

CRITICAL RULE:
The PRIMARY LEARNING TOPIC is the main learning objective.

Every flashcard MUST directly represent and teach the specified topic.

Do NOT replace the topic with unrelated objects or concepts.

For example:
If the topic is "Forest Seeds 1 to 5", use forest seeds,
Mahua seeds, Sal seeds, Karanj seeds, nuts, or similar
forest/natural objects.

Do NOT use vegetables, toys, fruits, or unrelated objects
unless they are directly required by the topic.

The topic determines WHAT the child learns.

Use:
- Simple Hindi
- Simple ${targetLanguage}
- Child-friendly vocabulary
- Appropriate visual emoji
- English meaning
- Phonetic pronunciation
- Jharkhand-relevant classroom context

${targetLanguage} text is AI-generated and MUST be treated as requiring
native-speaker verification before classroom use.

Generate exactly ${count} flashcards.

Return ONLY valid JSON.
Do not use markdown.
Do not use code fences.

Return exactly:

{
  "flashcards": [
    {
      "category": "${category}",
      "frontHindi": "string",
      "backTranslation": "string",
      "phonetic": "string",
      "englishMeaning": "string",
      "visualIcon": "string",
      "localContextHint": "string"
    }
  ]
}
`;

      const response =
        await gemini.models.generateContent({
          model: "gemini-3.6-flash",
          contents: prompt
        });

      const rawText =
        response.text?.trim();

      if (!rawText) {
        throw new Error(
          "Gemini returned an empty flashcard set"
        );
      }

      const cleanedText =
        rawText
          .replace(
            /^```json\s*/i,
            ""
          )
          .replace(
            /^```\s*/i,
            ""
          )
          .replace(
            /\s*```$/i,
            ""
          )
          .trim();

      const result =
        JSON.parse(cleanedText);

      if (
        !Array.isArray(
          result.flashcards
        )
      ) {
        throw new Error(
          "Invalid flashcard response"
        );
      }

      res.json({
        success: true,
        flashcards:
          result.flashcards,
        provider: "Gemini"
      });

    } catch (error) {
      console.error(
        "Flashcard generation error:",
        error
      );

      res.status(500).json({
        success: false,
        error:
          "Gemini flashcard generation failed"
      });
    }
  }
);

/* =========================
   AI LANGUAGE LAB GENERATOR
   Gemini → NVIDIA FALLBACK
========================= */

app.post(
  "/api/generate-language-practice",
  async (req, res) => {
    const {
      category,
      topic,
      count
    } = req.body;

    if (!category || !topic || !count) {
      return res.status(400).json({
        success: false,
        error:
          "Missing language practice fields"
      });
    }

    const prompt = `
You are NeuroPathshala, an AI teaching assistant for the Jharkhand PALASH MTB-MLE program.

Generate exactly ${count} useful teacher language-practice phrases.

CATEGORY:
${category}

PRIMARY TOPIC:
${topic}

CRITICAL RULE:
The PRIMARY TOPIC is the main learning objective.

Every phrase MUST directly relate to the topic.

Do not replace the topic with unrelated phrases.

These phrases are for Hindi-medium primary teachers learning to use
Santhali classroom language with children.

Requirements:
- Simple Hindi.
- Natural, child-friendly Santhali.
- Suitable for primary classrooms in Jharkhand.
- Useful for actual teacher-child interaction.
- Include pronunciation/phonetic support.
- Include a short explanation of when the teacher should use the phrase.
- Santhali is AI-generated and MUST be treated as requiring native-speaker verification.
- Do not claim that the Santhali has been officially verified.
- Return exactly ${count} items.
- Return ONLY valid JSON.
- No markdown.
- No code fences.

Return exactly:

{
  "items": [
    {
      "category": "${category}",
      "phraseHindi": "string",
      "phraseSanthali": "string",
      "phonetic": "string",
      "meaningContext": "string"
    }
  ]
}
`;

    /* =========================
       TRY GEMINI FIRST
    ========================= */

    try {
      console.log(
        "Language Lab: trying Gemini..."
      );

      const response =
        await gemini.models.generateContent({
          model: "gemini-3.6-flash",
          contents: prompt
        });

      const rawText =
        response.text?.trim();

      if (!rawText) {
        throw new Error(
          "Gemini returned empty content"
        );
      }

      const cleanedText =
        rawText
          .replace(
            /^```json\s*/i,
            ""
          )
          .replace(
            /^```\s*/i,
            ""
          )
          .replace(
            /\s*```$/i,
            ""
          )
          .trim();

      const result =
        JSON.parse(cleanedText);

      if (!Array.isArray(result.items)) {
        throw new Error(
          "Invalid Gemini language practice response"
        );
      }

      console.log(
        "Language Lab: Gemini succeeded"
      );

      return res.json({
        success: true,
        items: result.items,
        provider: "Gemini"
      });

    } catch (geminiError) {

      console.error(
        "Language Lab Gemini failed. Trying NVIDIA fallback..."
      );

      console.error(
        geminiError
      );
    }

    /* =========================
       NVIDIA FALLBACK
    ========================= */

    if (!nvidiaKey) {
      return res.status(500).json({
        success: false,
        error:
          "Gemini generation failed and NVIDIA_API_KEY is not configured"
      });
    }

    try {
      console.log(
        "Language Lab: trying NVIDIA NIM..."
      );

      const rawText =
        await generateWithNvidia(
          prompt
        );

      const cleanedText =
        rawText
          .replace(
            /^```json\s*/i,
            ""
          )
          .replace(
            /^```\s*/i,
            ""
          )
          .replace(
            /\s*```$/i,
            ""
          )
          .trim();

      const result =
        JSON.parse(cleanedText);

      if (!Array.isArray(result.items)) {
        throw new Error(
          "Invalid NVIDIA language practice response"
        );
      }

      console.log(
        "Language Lab: NVIDIA succeeded"
      );

      return res.json({
        success: true,
        items: result.items,
        provider: "NVIDIA"
      });

    } catch (nvidiaError) {

      console.error(
        "Language Lab NVIDIA fallback failed:"
      );

      console.error(
        nvidiaError
      );

      return res.status(500).json({
        success: false,
        error:
          "Gemini and NVIDIA language practice generation failed"
      });
    }
  }
);

/* =========================
   START SERVER
========================= */

const PORT = Number(process.env.PORT) || 3001;

app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `NeuroPathshala backend running on port ${PORT}`
  );
});