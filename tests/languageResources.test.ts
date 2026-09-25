import test from 'node:test';
import assert from 'node:assert/strict';
import { LANGUAGE_RESOURCES } from '../src/data/languageResources';
import { importLanguagePack, validateLanguagePack } from '../src/data/languagePack';
import { findResourceIdByHindi, resolveResourceReference } from '../src/data/resourceAdapters';
import { translateText, translateTextWithBackend } from '../src/services/translationService';
import { toLiveClassPhrase } from '../src/data/resourceAdapters';
import { isAudioAvailable } from '../src/services/audioService';
import { apiUrl } from '../src/services/apiClient';

test('bundled resource IDs are unique and verified entries have provenance', () => {
  const entries = Object.values(LANGUAGE_RESOURCES).flatMap((resource) => resource.classroomPhrases);
  const santhaliEntries = LANGUAGE_RESOURCES.Santhali.classroomPhrases;
  assert.equal(santhaliEntries.length, 49);
  assert.equal(new Set(santhaliEntries.map((entry) => entry.hindi)).size, santhaliEntries.length);
  assert.equal(new Set(santhaliEntries.map((entry) => entry.translation)).size, santhaliEntries.length);
  const ids = entries.map((entry) => entry.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const entry of entries.filter((item) => item.verificationStatus === 'verified')) {
    assert.ok(entry.hindi);
    assert.ok(entry.tribalText || entry.translation);
    assert.ok(entry.source.name);
    assert.ok(entry.source.reference);
    assert.ok(['Santhali', 'Ho', 'Mundari'].includes(entry.language));
  }
});

test('bundled language cores expose truthful local capability', () => {
  const santhali = LANGUAGE_RESOURCES.Santhali;
  assert.deepEqual(santhali.scripts, ['Ol Chiki']);
  assert.ok(santhali.classroomPhrases.every((entry) => entry.script && /[\u1c50-\u1c7f]/u.test(entry.script)));
  assert.ok(LANGUAGE_RESOURCES.Ho.classroomPhrases.length > 0);
  assert.ok(LANGUAGE_RESOURCES.Ho.classroomPhrases.every((entry) => entry.source.reference.includes('659748601-ho-hindi-dictionary.pdf')));
  assert.ok(LANGUAGE_RESOURCES.Mundari.classroomPhrases.length > 0);
  assert.ok(LANGUAGE_RESOURCES.Mundari.classroomPhrases.every((entry) => entry.source.name === 'Karya Hindi-Mundari Translation Dataset'));
  assert.equal(LANGUAGE_RESOURCES.Santhali.offlineAvailable, true);
  assert.equal(LANGUAGE_RESOURCES.Ho.offlineAvailable, true);
  assert.equal(LANGUAGE_RESOURCES.Mundari.offlineAvailable, true);
});

test('resource references resolve consistently for shared consumers', () => {
  const resourceId = findResourceIdByHindi('किताब खोलो');
  assert.ok(resourceId);
  const resource = resolveResourceReference(resourceId);
  assert.equal(resource?.hindi, 'किताब खोलो');
  assert.equal(resource?.translation, 'ᱯᱩᱛᱷᱤ ᱡᱷᱤᱡᱽ ᱯᱮ');
  assert.equal(toLiveClassPhrase(resource!).resourceId, resourceId);
  assert.equal(isAudioAvailable('Santhali'), false);
});

test('offline local lookup does not claim unknown remote translation succeeded', () => {
  const result = translateText('यह वाक्य स्थानीय पैक में नहीं है', 'hi', 'sat');
  assert.equal(result.found, false);
  assert.equal(result.statusNote, 'This phrase is not available in the verified offline vocabulary yet.');
});

test('Santali exact and normalized phrase lookup stays verified and local', () => {
  const exact = translateText('किताब खोलो', 'hi', 'sat');
  assert.equal(exact.found, true);
  assert.equal(exact.translatedText, 'ᱯᱩᱛᱷᱤ ᱡᱷᱤᱡᱽ ᱯᱮ (Puthi jhij pe)');
  assert.equal(exact.statusNote, 'Translated using the verified offline Santali phrase pack.');

  const normalized = translateText('  किताब खोलो।  ', 'hi', 'sat');
  assert.equal(normalized.found, true);
  assert.equal(normalized.translatedText, exact.translatedText);
});

test('Santali composes only verified single-word entries', () => {
  const result = translateText('पानी पेड़', 'hi', 'sat');
  assert.equal(result.found, true);
  assert.equal(result.translatedText, 'ᱫᱟᱜ ᱫᱟᱨᱮ');
  assert.equal(result.verificationStatus, 'verified');
  assert.equal(result.statusNote, 'Translated using the verified offline Santali phrase pack.');

  const unsupported = translateText('प्रशासनिक भाषा का सरलीकरण', 'hi', 'sat');
  assert.equal(unsupported.found, false);
  assert.equal(unsupported.translatedText, '');
  assert.equal(unsupported.statusNote, 'This phrase is not available in the verified offline vocabulary yet.');
});

test('Santali offline mode does not call the network for a supported phrase', async () => {
  const originalFetch = globalThis.fetch;
  let fetchCalls = 0;
  globalThis.fetch = (async () => {
    fetchCalls += 1;
    throw new Error('network should not be called');
  }) as typeof fetch;

  const originalNavigator = globalThis.navigator;
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: { onLine: false }
  });

  try {
    const result = await translateTextWithBackend('किताब खोलो', 'hi', 'sat');
    assert.equal(result.found, true);
    assert.equal(result.verificationStatus, 'verified');
    assert.equal(fetchCalls, 0);
  } finally {
    globalThis.fetch = originalFetch;
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: originalNavigator
    });
  }
});

test('Santali offline mode reports unsupported phrases honestly', async () => {
  const originalNavigator = globalThis.navigator;
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: { onLine: false }
  });

  try {
    const result = await translateTextWithBackend('प्रशासनिक भाषा का सरलीकरण', 'hi', 'sat');
    assert.equal(result.found, false);
    assert.equal(result.statusNote, 'This phrase is not available in the verified offline vocabulary yet.');
  } finally {
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: originalNavigator
    });
  }
});

test('Ho vocabulary translates locally in both directions', () => {
  const toHo = translateText('पानी', 'hi', 'ho');
  assert.equal(toHo.found, true);
  assert.equal(toHo.translatedText, 'दः');
  assert.equal(toHo.verificationStatus, 'verified');

  const toHindi = translateText('दः', 'ho', 'hi');
  assert.equal(toHindi.found, true);
  assert.equal(toHindi.translatedText, 'पानी');
});

test('Mundari corpus supports exact and normalized Hindi lookup', () => {
  const exact = translateText('आप का क्या ख्याल है', 'hi', 'unr');
  assert.equal(exact.found, true);
  assert.equal(exact.translatedText, 'अमा: चिकन ख्याल मेना:');
  assert.equal(exact.verificationStatus, 'verified');

  const normalized = translateText('  आप का क्या ख्याल है?  ', 'hi', 'unr');
  assert.equal(normalized.found, true);
  assert.equal(normalized.translatedText, exact.translatedText);
});

test('Mundari corpus preserves multiple possible translations', () => {
  const result = translateText('आप का क्या ख्याल है', 'hi', 'unr');
  assert.deepEqual(result.alternatives, ['अमा: चिलका उड़ु: मेना:।']);
});

test('Mundari unknown and empty input remain honest', () => {
  const unknown = translateText('यह वाक्य स्थानीय पैक में नहीं है', 'hi', 'unr');
  assert.equal(unknown.found, false);
  assert.equal(unknown.verificationStatus, 'unavailable');
  assert.match(unknown.statusNote, /offline core has no verified entry/i);

  const empty = translateText('   ', 'hi', 'unr');
  assert.equal(empty.found, false);
  assert.equal(empty.translatedText, '');
  assert.equal(empty.statusNote, 'Empty input.');
});

test('Mundari offline mode does not call the network', async () => {
  const originalFetch = globalThis.fetch;
  let fetchCalls = 0;
  globalThis.fetch = (async () => {
    fetchCalls += 1;
    throw new Error('network should not be called');
  }) as typeof fetch;

  const originalNavigator = globalThis.navigator;
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: { onLine: false }
  });

  try {
    const result = await translateTextWithBackend('आप का क्या ख्याल है', 'hi', 'unr');
    assert.equal(result.found, true);
    assert.equal(result.translatedText, 'अमा: चिकन ख्याल मेना:');
    assert.equal(fetchCalls, 0);
  } finally {
    globalThis.fetch = originalFetch;
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: originalNavigator
    });
  }
});

test('existing Santali and Ho local translations remain available', () => {
  assert.equal(translateText('किताब खोलो', 'hi', 'sat').found, true);
  assert.equal(translateText('पानी', 'hi', 'ho').translatedText, 'दः');
});

test('required verified phrases never call the backend', async () => {
  const originalFetch = globalThis.fetch;
  let fetchCalls = 0;
  globalThis.fetch = (async () => {
    fetchCalls += 1;
    throw new Error('verified local translation should not call the backend');
  }) as typeof fetch;

  try {
    for (const [text, targetLanguage] of [
      ['किताब खोलो', 'sat'],
      ['पानी', 'ho'],
      ['आप का क्या ख्याल है', 'unr']
    ] as const) {
      const result = await translateTextWithBackend(text, 'hi', targetLanguage);
      assert.equal(result.found, true);
      assert.equal(result.verificationStatus, 'verified');
    }
    assert.equal(fetchCalls, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('online translation posts to the configured API path', async () => {
  const originalFetch = globalThis.fetch;
  const originalNavigator = globalThis.navigator;
  let requestedUrl = '';
  let requestedInit: RequestInit | undefined;
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: { onLine: true }
  });
  globalThis.fetch = (async (input, init) => {
    requestedUrl = String(input);
    requestedInit = init;
    return new Response(JSON.stringify({
      success: true,
      translatedText: 'connected result',
      provider: 'Gemini'
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }) as typeof fetch;

  try {
    const result = await translateTextWithBackend('अज्ञात वाक्य', 'hi', 'ho');
    assert.equal(result.translatedText, 'connected result');
    assert.equal(requestedUrl, apiUrl('translate'));
    assert.equal((requestedInit?.signal as AbortSignal).aborted, false);
    assert.deepEqual(JSON.parse(String(requestedInit?.body)), {
      text: 'अज्ञात वाक्य',
      sourceLanguage: 'Hindi',
      targetLanguage: 'Ho'
    });
  } finally {
    globalThis.fetch = originalFetch;
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: originalNavigator
    });
  }
});

test('online translation aborts after three seconds without fabricating output', async () => {
  const originalFetch = globalThis.fetch;
  const originalNavigator = globalThis.navigator;
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: { onLine: true }
  });
  globalThis.fetch = ((_, init) => new Promise<Response>((_resolve, reject) => {
    init?.signal?.addEventListener('abort', () => {
      reject(Object.assign(new Error('aborted'), { name: 'AbortError' }));
    });
  })) as typeof fetch;

  try {
    const startedAt = Date.now();
    const result = await translateTextWithBackend('अज्ञात वाक्य', 'hi', 'ho');
    const elapsed = Date.now() - startedAt;
    assert.ok(elapsed >= 2900 && elapsed < 3800, `timeout elapsed ${elapsed}ms`);
    assert.equal(result.found, false);
    assert.equal(result.translatedText, '');
    assert.equal(result.statusNote, 'Online translation is taking too long. Try a supported offline classroom phrase.');
  } finally {
    globalThis.fetch = originalFetch;
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: originalNavigator
    });
  }
});

test('language-pack importer rejects missing provenance, duplicates, and fake audio', () => {
  const base = {
    language: 'Ho' as const,
    nativeName: 'Ho',
    scripts: ['Warang Citi'],
    categories: ['Greetings'],
    source: { name: '', reference: '', reviewed: false },
    offlineAvailable: true,
    entries: [
      {
        id: 'ho-greeting',
        hindi: 'नमस्ते',
        translation: 'placeholder',
        tribalText: 'placeholder',
        category: 'Greetings',
        verificationStatus: 'verified' as const,
        source: { name: '', reference: '', reviewed: false },
        audio: { type: 'native_recording' as const, url: 'https://example.com/fake.mp3', verified: true }
      }
    ]
  };
  const result = validateLanguagePack(base);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.includes('source')));
  assert.ok(result.errors.some((error) => error.includes('audio')));
  assert.throws(() => importLanguagePack(base));

  const duplicate = {
    ...base,
    source: { name: 'Verified Ho source', reference: 'https://source.invalid/ho', reviewed: true },
    entries: [
      { ...base.entries[0], translation: 'एक', tribalText: 'एक', source: { name: 'Verified Ho source', reference: 'https://source.invalid/ho', reviewed: true }, audio: undefined },
      { ...base.entries[0], translation: 'दो', tribalText: 'दो', source: { name: 'Verified Ho source', reference: 'https://source.invalid/ho', reviewed: true }, audio: undefined }
    ]
  };
  assert.equal(validateLanguagePack(duplicate).valid, false);
  assert.ok(validateLanguagePack(duplicate).errors.some((error) => error.includes('Duplicate resource ID')));
});
