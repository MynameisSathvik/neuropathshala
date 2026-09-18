import { LanguageResourceItem, Lesson, Worksheet } from '../types';
import { getLanguageResource } from './languageResources';
import { normalizePhrase } from './dictionary';

export function resolveResourceReference(resourceId: string): LanguageResourceItem | undefined {
  return Object.values({
    Santhali: getLanguageResource('Santhali'),
    Ho: getLanguageResource('Ho'),
    Mundari: getLanguageResource('Mundari')
  }).flatMap((resource) => resource.classroomPhrases).find((item) => item.id === resourceId);
}

export function findResourceIdByHindi(hindi: string, language: 'Santhali' | 'Ho' | 'Mundari' = 'Santhali'): string | undefined {
  return getLanguageResource(language).classroomPhrases.find((item) => normalizePhrase(item.hindi) === normalizePhrase(hindi))?.id;
}

export function toLiveClassPhrase(item: LanguageResourceItem) {
  return {
    language: item.language,
    hindi: item.hindi,
    translatedText: item.translation,
    pronunciation: item.pronunciation,
    audioUrl: item.audio?.verified ? item.audio.url : undefined,
    resourceId: item.id,
    statusNote: `Verified source: ${item.source.name}`,
    isVerified: item.verificationStatus === 'verified'
  };
}

export function attachLessonResourceReferences(lesson: Lesson): Lesson {
  const resourceIds = lesson.motherTongueSupport.keyPhrases
    .map((phrase) => findResourceIdByHindi(phrase.hindi, lesson.targetLanguage || 'Santhali'))
    .filter((id): id is string => Boolean(id));
  return resourceIds.length ? { ...lesson, resourceIds: [...new Set(resourceIds)] } : lesson;
}

export function attachWorksheetResourceReferences(worksheet: Worksheet): Worksheet {
  const texts = worksheet.questions.flatMap((question) => [question.promptHindi]);
  const resourceIds = texts
    .map((text) => findResourceIdByHindi(text, worksheet.targetLanguage || 'Santhali'))
    .filter((id): id is string => Boolean(id));
  return resourceIds.length ? { ...worksheet, resourceIds: [...new Set(resourceIds)] } : worksheet;
}