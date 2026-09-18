import test from 'node:test';
import assert from 'node:assert/strict';
import { LANGUAGE_RESOURCES } from '../src/data/languageResources';
import { importLanguagePack, validateLanguagePack } from '../src/data/languagePack';
import { findResourceIdByHindi, resolveResourceReference } from '../src/data/resourceAdapters';
import { translateText } from '../src/services/translationService';
import { toLiveClassPhrase } from '../src/data/resourceAdapters';
import { isAudioAvailable } from '../src/services/audioService';

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
    assert.ok(['Santhali', 'Ho'].includes(entry.language));
  }
});

test('bundled language cores expose truthful local capability', () => {
  const santhali = LANGUAGE_RESOURCES.Santhali;
  assert.deepEqual(santhali.scripts, ['Ol Chiki']);
  assert.ok(santhali.classroomPhrases.every((entry) => entry.script && /[\u1c50-\u1c7f]/u.test(entry.script)));
  assert.ok(LANGUAGE_RESOURCES.Ho.classroomPhrases.length > 0);
  assert.ok(LANGUAGE_RESOURCES.Ho.classroomPhrases.every((entry) => entry.source.reference.includes('659748601-ho-hindi-dictionary.pdf')));
  assert.equal(LANGUAGE_RESOURCES.Mundari.classroomPhrases.length, 0);
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

test('Mundari grammar core does not invent lexical translations', () => {
  const result = translateText('पानी', 'hi', 'unr');
  assert.equal(result.found, false);
  assert.equal(result.verificationStatus, 'unavailable');
  assert.match(result.statusNote, /offline core has no verified entry/i);
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
