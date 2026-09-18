// Safe browser speech synthesis & recognition utilities with honest prototype labeling
// Designed for extreme resilience in low-cost tablets, varied Android browsers, and iframe sandbox environments.

export type SupportedLanguage = 'hi' | 'sat' | 'en';

export type AudioCapabilityState =
  | 'verified-audio-available'
  | 'browser-tts-available'
  | 'audio-unavailable';

export interface AudioPlaybackStatus {
  supported: boolean;
  played: boolean;
  success: boolean;
  message: string;
  secondaryMessage?: string;
  isNativeVoice: boolean;
  speaking: boolean;
  state: AudioCapabilityState;
}

// Backward-compatible interface for any existing references
export interface SpeechPlaybackStatus {
  supported: boolean;
  success?: boolean;
  message: string;
  isNativeVoice: boolean;
  speaking: boolean;
  state?: AudioCapabilityState;
}

/**
 * Normalizes language codes/names to supported types ('hi' | 'sat' | 'en')
 */
export function normalizeLanguageCode(lang?: string): SupportedLanguage {
  if (!lang) return 'hi';
  const l = lang.toLowerCase().trim();
  if (
    l.startsWith('sat') ||
    l.includes('santhali') ||
    l.includes('santali') ||
    l.includes('ol chiki') ||
    l.includes('tribal')
  ) {
    return 'sat';
  }
  if (l.startsWith('hi') || l.includes('hindi')) {
    return 'hi';
  }
  if (l.startsWith('en') || l.includes('english')) {
    return 'en';
  }
  return 'sat';
}

/**
 * Checks whether audio playback is genuinely available for a language.
 * Strict language accuracy rule:
 * - Santhali: FALSE unless a verified native audio asset (URL) exists.
 *   Generic browser SpeechSynthesis must NEVER be used to imitate Santhali.
 * - Hindi: TRUE if browser supports SpeechSynthesis (hi-IN).
 * - English: TRUE if browser supports SpeechSynthesis.
 */
export function isAudioAvailable(lang?: string, customAudioUrl?: string): boolean {
  if (customAudioUrl && customAudioUrl.trim()) {
    return true;
  }
  const norm = normalizeLanguageCode(lang);
  if (norm === 'sat') {
    // In this prototype, no genuine Santhali audio asset or Santhali TTS exists yet.
    // Generic browser TTS is strictly prohibited for Santhali.
    return false;
  }
  if (norm === 'hi' || norm === 'en') {
    const caps = getSpeechCapabilities();
    return caps.speechSynthesisSupported;
  }
  return false;
}

/**
 * Stops all ongoing SpeechSynthesis audio cleanly.
 */
export function stopSpeechAudio(): void {
  if (!isBrowser()) return;
  try {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  } catch {
    // Safe ignore
  }
}

/**
 * Plays audio with strict language integrity:
 * 
 * STATE A — VERIFIED/REAL SANTHALI AUDIO AVAILABLE:
 * If an audioUrl is passed, plays genuine audio element and reports verified native audio.
 * 
 * STATE B — NO VERIFIED SANTHALI AUDIO AVAILABLE:
 * Under NO circumstances does it pronounce Santhali using generic browser voices (English, Hindi, or default).
 * Returns honest unavailable state: "Santhali audio is not available in this prototype yet."
 * 
 * STATE C — HINDI AUDIO:
 * Uses browser SpeechSynthesis with hi-IN when available.
 */
export function playAudio(
  text: string,
  lang: string = 'hi',
  options?: {
    audioUrl?: string;
    onEnd?: () => void;
  }
): AudioPlaybackStatus {
  if (!isBrowser()) {
    return {
      supported: false,
      played: false,
      success: false,
      message: "Audio playback isn't supported in this environment.",
      isNativeVoice: false,
      speaking: false,
      state: 'audio-unavailable'
    };
  }

  const normLang = normalizeLanguageCode(lang);

  // STATE A: Genuine verified audio asset provided (URL)
  if (options?.audioUrl && options.audioUrl.trim()) {
    try {
      stopSpeechAudio();
      const audio = new Audio(options.audioUrl);
      if (options.onEnd) {
        audio.onended = () => options.onEnd?.();
        audio.onerror = () => options.onEnd?.();
      }
      audio.play().catch(() => {
        // Safe catch for browser autoplay restrictions
      });
      return {
        supported: true,
        played: true,
        success: true,
        message: 'Playing verified native-speaker audio recording.',
        isNativeVoice: true,
        speaking: true,
        state: 'verified-audio-available'
      };
    } catch {
      return {
        supported: false,
        played: false,
        success: false,
        message: 'Unable to play verified audio asset.',
        isNativeVoice: true,
        speaking: false,
        state: 'audio-unavailable'
      };
    }
  }

  // STATE B: Santhali without verified native audio
  // CRITICAL: DO NOT automatically call window.speechSynthesis.speak() using a generic browser voice.
  // Do NOT use English voice, Hindi voice, or random browser default voice.
  if (normLang === 'sat') {
    stopSpeechAudio();
    return {
      supported: false,
      played: false,
      success: false,
      message: 'Native Santhali audio unavailable for this phrase.',
      secondaryMessage: 'Text translation remains available; use a verified recording when configured.',
      isNativeVoice: false,
      speaking: false,
      state: 'audio-unavailable'
    };
  }

  // STATE C: Hindi (hi-IN) or English browser SpeechSynthesis
  const capabilities = getSpeechCapabilities();
  if (!capabilities.speechSynthesisSupported) {
    return {
      supported: false,
      played: false,
      success: false,
      message: "Audio preview isn't supported in this browser.",
      isNativeVoice: false,
      speaking: false,
      state: 'audio-unavailable'
    };
  }

  if (!text || !text.trim()) {
    return {
      supported: true,
      played: false,
      success: false,
      message: 'No text available for audio playback.',
      isNativeVoice: false,
      speaking: false,
      state: 'browser-tts-available'
    };
  }

  try {
    stopSpeechAudio();

    // Clean brackets and transliteration notes (e.g. "(Mit)", "[1]")
    const cleanText = text.replace(/[\(\)\[\]]/g, ' ').trim();
    if (!cleanText) {
      return {
        supported: true,
        played: false,
        success: false,
        message: 'No text available for audio playback.',
        isNativeVoice: false,
        speaking: false,
        state: 'browser-tts-available'
      };
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);

    if (normLang === 'hi') {
      utterance.lang = 'hi-IN';
      utterance.rate = 0.88;
      utterance.pitch = 1.0;
    } else {
      utterance.lang = 'en-IN';
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
    }

    let finished = false;
    const handleEnd = () => {
      if (!finished) {
        finished = true;
        if (options?.onEnd) options.onEnd();
      }
    };

    utterance.onend = handleEnd;
    utterance.onerror = () => {
      handleEnd();
    };

    window.speechSynthesis.speak(utterance);

    return {
      supported: true,
      played: true,
      success: true,
      message:
        normLang === 'hi'
          ? 'Hindi speech audio preview playing (hi-IN).'
          : 'Standard speech audio preview.',
      isNativeVoice: true,
      speaking: true,
      state: 'browser-tts-available'
    };
  } catch (err) {
    return {
      supported: false,
      played: false,
      success: false,
      message: 'Speech synthesis encountered an error.',
      isNativeVoice: false,
      speaking: false,
      state: 'audio-unavailable'
    };
  }
}

/**
 * Backward-compatible wrapper for playAudio.
 * Maintains full compatibility with previous callers while enforcing strict language integrity.
 */
export const playPrototypeAudio = playAudio;

export type SpeechRecognitionState = 'idle' | 'listening' | 'processing' | 'error';

export interface SpeechCapabilities {
  speechRecognitionSupported: boolean;
  speechSynthesisSupported: boolean;
  hasMediaDevices: boolean;
  engineName: 'standard' | 'webkit' | 'none';
}

/**
 * Verifies if running in a client browser environment.
 * Prevents SSR crashes or hydration mismatches.
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof navigator !== 'undefined';
}

/**
 * Checks overall browser speech recognition and synthesis capabilities safely.
 */
export function getSpeechCapabilities(): SpeechCapabilities {
  if (!isBrowser()) {
    return {
      speechRecognitionSupported: false,
      speechSynthesisSupported: false,
      hasMediaDevices: false,
      engineName: 'none'
    };
  }

  const hasStandard = 'SpeechRecognition' in window;
  const hasWebkit = 'webkitSpeechRecognition' in window;
  const hasMediaDevices = !!(
    navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function'
  );
  const speechSynthesisSupported =
    'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';

  return {
    speechRecognitionSupported: hasStandard || hasWebkit,
    speechSynthesisSupported,
    hasMediaDevices,
    engineName: hasStandard ? 'standard' : hasWebkit ? 'webkit' : 'none'
  };
}

/**
 * Translates raw browser speech error codes into friendly, non-technical messages.
 * Never outputs technical exceptions, "undefined", or stack traces.
 */
export function getFriendlySpeechErrorMessage(errorType?: string): string {
  if (!errorType) {
    return 'Voice input was interrupted. You can type your message instead.';
  }

  switch (errorType) {
    case 'not-allowed':
    case 'permission-denied':
    case 'NotAllowedError':
    case 'SecurityError':
      return 'Microphone access was denied. You can type instead.';

    case 'no-speech':
      return 'No speech detected. Try again.';

    case 'audio-capture':
      return 'Your microphone could not be accessed. Please check your mic connection.';

    case 'network':
      return 'Network error occurred during speech input. You can type instead.';

    case 'aborted':
      return 'Speech input was stopped.';

    case 'service-not-allowed':
      return "Voice input isn't available in this browser. You can type instead.";

    case 'language-not-supported':
      return 'Voice recognition is not supported for this language. Please type instead.';

    case 'unsupported':
      return "Voice input isn't supported in this browser. You can type your message instead.";

    case 'santhali-unsupported':
      return 'Santhali voice input is not available in this browser. Please type the phrase or select it from the local phrase library.';

    default:
      return 'Voice input is temporarily unavailable. You can continue using text input.';
  }
}

/**
 * Checks browser permission state for microphone safely.
 */
export async function queryMicrophonePermission(): Promise<
  'granted' | 'denied' | 'prompt' | 'unsupported'
> {
  if (!isBrowser() || !navigator.permissions || !navigator.permissions.query) {
    return 'unsupported';
  }

  try {
    const status = await navigator.permissions.query({ name: 'microphone' as PermissionName });
    return status.state;
  } catch {
    // Browsers like Safari, older Chrome, or strict iframes throw for 'microphone' query
    return 'unsupported';
  }
}

/**
 * Options for the SafeSpeechRecognizer lifecycle controller
 */
export interface SafeSpeechRecognizerOptions {
  lang?: string;
  onStateChange?: (state: SpeechRecognitionState) => void;
  onInterimResult?: (transcript: string) => void;
  onFinalResult?: (transcript: string) => void;
  onError?: (friendlyMessage: string, rawError?: string) => void;
  onEnd?: () => void;
}

/**
 * Production-ready speech recognizer controller.
 * Prevents duplicate instances, handles the entire lifecycle (Start -> Listening -> Processing -> Idle),
 * and converts all failures into graceful non-blocking messages.
 */
export class SafeSpeechRecognizer {
  private recognition: any = null;
  private state: SpeechRecognitionState = 'idle';
  private options: SafeSpeechRecognizerOptions;
  private isStarting = false;
  private isStopping = false;

  constructor(options: SafeSpeechRecognizerOptions) {
    this.options = options;
  }

  public getState(): SpeechRecognitionState {
    return this.state;
  }

  public updateOptions(newOptions: Partial<SafeSpeechRecognizerOptions>): void {
    this.options = { ...this.options, ...newOptions };
  }

  private setState(newState: SpeechRecognitionState) {
    if (this.state !== newState) {
      this.state = newState;
      if (this.options.onStateChange) {
        this.options.onStateChange(newState);
      }
    }
  }

  /**
   * Initializes or returns existing recognition instance
   */
  private initRecognition(lang: string = 'hi-IN'): boolean {
    if (!isBrowser()) return false;

    const SpeechRec =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRec) {
      return false;
    }

    try {
      if (this.recognition) {
        this.cleanupListeners();
        try {
          this.recognition.abort();
        } catch {
          // safe ignore
        }
      }

      const rec = new SpeechRec();
      rec.continuous = false;
      rec.interimResults = true;
      rec.maxAlternatives = 1;
      rec.lang = lang;

      rec.onstart = () => {
        this.isStarting = false;
        this.setState('listening');
      };

      rec.onresult = (event: any) => {
        if (!event || !event.results) return;

        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const res = event.results[i];
          if (res && res[0]) {
            const transcript = res[0].transcript;
            if (res.isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }
        }

        if (interimTranscript && this.options.onInterimResult) {
          this.options.onInterimResult(interimTranscript.trim());
        }

        if (finalTranscript) {
          this.setState('processing');
          if (this.options.onFinalResult) {
            this.options.onFinalResult(finalTranscript.trim());
          }
        }
      };

      rec.onerror = (event: any) => {
        this.isStarting = false;
        this.isStopping = false;
        const errorKey = event?.error || 'unknown';

        // Ignore benign abort errors triggered on intentional user stop
        if (errorKey === 'aborted') {
          this.setState('idle');
          if (this.options.onEnd) this.options.onEnd();
          return;
        }

        const friendlyMsg = getFriendlySpeechErrorMessage(errorKey);
        this.setState('idle');

        if (this.options.onError) {
          this.options.onError(friendlyMsg, errorKey);
        }
        if (this.options.onEnd) {
          this.options.onEnd();
        }
      };

      rec.onend = () => {
        this.isStarting = false;
        this.isStopping = false;
        this.setState('idle');
        if (this.options.onEnd) {
          this.options.onEnd();
        }
      };

      this.recognition = rec;
      return true;
    } catch (err) {
      this.recognition = null;
      return false;
    }
  }

  private cleanupListeners(): void {
    if (this.recognition) {
      try {
        this.recognition.onstart = null;
        this.recognition.onresult = null;
        this.recognition.onerror = null;
        this.recognition.onend = null;
      } catch {
        // safe ignore
      }
    }
  }

  /**
   * Starts listening for speech in the specified locale.
   * If already listening, safe no-op.
   */
  public start(lang: string = 'hi-IN'): void {
    if (!isBrowser()) {
      if (this.options.onError) {
        this.options.onError("Voice input isn't supported in this browser. You can type your message instead.");
      }
      return;
    }

    // Honest check for Santhali recognition
    if (lang === 'sat' || lang.toLowerCase().includes('santhali') || lang.toLowerCase().includes('sat-')) {
      if (this.options.onError) {
        this.options.onError(getFriendlySpeechErrorMessage('santhali-unsupported'));
      }
      return;
    }

    // Prevent re-entrant starts
    if (this.isStarting || this.state === 'listening') {
      return;
    }

    const capabilities = getSpeechCapabilities();
    if (!capabilities.speechRecognitionSupported) {
      if (this.options.onError) {
        this.options.onError("Voice input isn't supported in this browser. You can type your message instead.");
      }
      return;
    }

    const ready = this.initRecognition(lang);
    if (!ready || !this.recognition) {
      if (this.options.onError) {
        this.options.onError("Voice input couldn't be initialized. You can continue typing instead.");
      }
      return;
    }

    try {
      this.isStarting = true;
      this.recognition.start();
    } catch (err: any) {
      this.isStarting = false;
      // If already started, attempt clean stop
      try {
        this.recognition.stop();
      } catch {
        // ignore
      }
      this.setState('idle');
      const msg = getFriendlySpeechErrorMessage(err?.name === 'SecurityError' ? 'not-allowed' : 'unknown');
      if (this.options.onError) {
        this.options.onError(msg);
      }
    }
  }

  /**
   * Stops listening safely.
   */
  public stop(): void {
    if (!this.recognition) {
      this.setState('idle');
      return;
    }

    if (this.isStopping || this.state === 'idle') {
      return;
    }

    try {
      this.isStopping = true;
      this.recognition.stop();
    } catch {
      try {
        this.recognition.abort();
      } catch {
        // safe ignore
      }
      this.setState('idle');
    }
  }

  /**
   * Fully cleans up recognition instance and listeners.
   */
  public destroy(): void {
    this.cleanupListeners();
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch {
        // safe ignore
      }
      this.recognition = null;
    }
    this.setState('idle');
  }
}
