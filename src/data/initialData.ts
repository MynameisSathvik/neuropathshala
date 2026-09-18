import {
  Lesson,
  Worksheet,
  ClassroomSession,
  TranslationRecord,
  Flashcard,
  LanguagePracticeItem,
  TeacherSettings,
  NotificationItem
} from '../types';
import { attachLessonResourceReferences, attachWorksheetResourceReferences } from './resourceAdapters';

export const INITIAL_TEACHER_SETTINGS: TeacherSettings = {
  teacherName: 'Anita Marandi',
  schoolName: 'Govt. Primary School, Dumka',
  district: 'Dumka',
  state: 'Jharkhand',
  primaryGrade: 'Grade 2',
  targetLanguage: 'Santhali (Santali)',
  offlineMode: true,
  syncState: 'ready',
  lastSyncedAt: '2026-09-05 08:30 AM',
  notificationsEnabled: true,
  textSize: 'normal',
  onboardingCompleted: false
};

const INITIAL_LESSONS_BASE: Lesson[] = [
  {
    id: 'les-001',
    title: 'गिनती और स्थानीय फल (Counting 1 to 5 with Forest Fruits)',
    grade: 'Grade 2',
    subject: 'Foundational Numeracy',
    topic: 'Numbers & Counting',
    difficulty: 'Beginner',
    durationMinutes: 35,
    localContext: 'Village Haat & Forest Mahua',
    objective:
      'Students will identify numerals 1 to 5 in Hindi and Santhali (Mit, Bar, Pe, Pun, More) using concrete local objects.',
    materials: [
      'Mahua tree seeds or pebbles (20 pieces)',
      'Slate and chalk',
      'Flashcards of numbers 1-5 with Ol Chiki script'
    ],
    warmUp:
      'Begin with Santhali greeting "Sagun Setag" and a counting rhythm clap in pairs using fingers.',
    teacherExplanation:
      'Explain that every number represents real objects around us. Hold up 1 leaf and say "Ek" (Hindi) then "Mit\'" (Santhali). Then 2 pebbles: "Do" (Hindi) and "Bar" (Santhali).',
    localContextExample:
      'Ask children: In Dumka weekly haat, how many clay bowls or mangoes did you see on the mat? Count 1 to 5 together.',
    classroomActivity:
      'Divide students into small groups of 4. Give each group 5 Mahua seeds. Call out "Pe" (three) in Santhali; children count out 3 seeds and place them in a circle.',
    practice:
      'Students write numbers 1 to 5 on their slate and draw matching dots beside each number.',
    assessment:
      'Hold up 4 fingers. Ask: "Tinaq?" (How many?). Assess if children respond with "Pun" or "Chaar".',
    motherTongueSupport: {
      language: 'Santhali',
      keyPhrases: [
        { hindi: 'वस्तुओं को गिनो', santhali: 'ᱡᱤᱱᱤᱥ ᱠᱚ ᱞᱮᱠᱷᱟᱭ ᱯᱮ', phonetic: 'Jinis ko lekhae pe' },
        { hindi: 'कितने हैं?', santhali: 'ᱛᱤᱱᱟᱹᱜ ᱢᱮᱱᱟᱜᱼᱟ?', phonetic: 'Tinaq menaq-a?' },
        { hindi: 'शाबाश, बहुत अच्छा!', santhali: 'ᱟᱹᱰᱤ ᱵᱮᱥ!', phonetic: 'Adi bes!' }
      ]
    },
    createdAt: '2026-09-04T10:15:00Z',
    updatedAt: '2026-09-04T10:15:00Z'
  },
  {
    id: 'les-002',
    title: 'जंगल के पेड़ और प्रकृति (Sounds & Words of Nature)',
    grade: 'Grade 1',
    subject: 'Foundational Literacy',
    topic: 'Basic Words & Sounds',
    difficulty: 'Beginner',
    durationMinutes: 30,
    localContext: 'Sal Trees & Birds of Jharkhand',
    objective:
      'Develop phonemic awareness by linking familiar nature words in Hindi and Santhali (Dare, Sakam, Chene).',
    materials: ['Green Sal leaves', 'Picture charts of local birds', 'Word flashcards'],
    warmUp:
      'Sing the bird call song together while making wing movements.',
    teacherExplanation:
      'Introduce the sound /d/ with "Dare" (पेड़) and /s/ with "Sakam" (पत्ता). Contrast Hindi word with Santhali word.',
    localContextExample:
      'Point to the big Sal tree in the school courtyard: "Nowa do Dare kana" (यह पेड़ है).',
    classroomActivity:
      'Leaf matching game: Children match fallen Sal leaves to numbered spots on a woven bamboo mat.',
    practice:
      'Draw a tree and leaf on the slate; trace initial sound symbol.',
    assessment:
      'Show a picture of a bird and ask child to say the word in their mother tongue ("Chene") and Hindi ("Chidiya").',
    motherTongueSupport: {
      language: 'Santhali',
      keyPhrases: [
        { hindi: 'यहाँ देखो', santhali: 'ᱱᱚᱰᱮ ᱧᱮᱞ ᱢᱮ', phonetic: 'Node nel me' },
        { hindi: 'शब्द पढ़ो', santhali: 'ᱥᱟᱵᱟᱫ ᱯᱟᱲᱦᱟᱣ ᱢᱮ', phonetic: 'Sabad padhao me' }
      ]
    },
    createdAt: '2026-09-03T11:00:00Z',
    updatedAt: '2026-09-03T11:00:00Z'
  },
  {
    id: 'les-003',
    title: 'सरल जोड़ — हाट की सब्जियां (Simple Addition at the Haat)',
    grade: 'Grade 3',
    subject: 'Foundational Numeracy',
    topic: 'Simple Addition',
    difficulty: 'Intermediate',
    durationMinutes: 40,
    localContext: 'Village Vegetable Market',
    objective:
      'Understand addition as putting quantities together (up to 10) through simulated market barter.',
    materials: ['Clay play-potatoes or tamarind seeds', 'Mini pretend-weighing scale'],
    warmUp:
      'Market role-play call: "Haat laga hai! Kise sabzi chahiye?"',
    teacherExplanation:
      'Put 2 seeds on left, 3 seeds on right. Introduce "Joraw me" (जोड़ो). Put them together: 2 + 3 = 5 ("More").',
    localContextExample:
      'If your mother buys 2 brinjals and your aunt gives 3 more, how many brinjals in the basket?',
    classroomActivity:
      'Pair work: Partner A puts down Bar (2) seeds, Partner B puts down Pe (3) seeds, both count the sum together.',
    practice:
      'Solve 4 pictorial addition problems on the blackboard.',
    assessment:
      'Teacher asks 3 individual students to solve 3 + 2 using pebbles on the mat.',
    motherTongueSupport: {
      language: 'Santhali',
      keyPhrases: [
        { hindi: 'जोड़ो', santhali: 'ᱡᱚᱲᱟᱣ ᱢᱮ', phonetic: 'Joraw me' },
        { hindi: 'कुल कितना हुआ?', santhali: 'ᱡᱚᱛᱚ ᱛᱮ ᱛᱤᱱᱟᱹᱜ ᱦᱩᱭᱮᱱᱟ?', phonetic: 'Joto te tinaq huyena?' }
      ]
    },
    createdAt: '2026-09-02T09:30:00Z',
    updatedAt: '2026-09-02T09:30:00Z'
  }
];

export const INITIAL_LESSONS: Lesson[] = INITIAL_LESSONS_BASE.map(attachLessonResourceReferences);

const INITIAL_WORKSHEETS_BASE: Worksheet[] = [
  {
    id: 'ws-001',
    title: 'गिनती और मिलान (Counting & Matching Haat Objects)',
    grade: 'Grade 2',
    subject: 'Foundational Numeracy',
    topic: 'Numbers 1 to 5',
    difficulty: 'Beginner',
    localContext: 'Village Haat & Forest Seeds',
    instructionsHindi: 'वस्तुओं को गिनें और सही संख्या तथा संथाली शब्द से मिलान करें।',
    instructionsSanthali: 'ᱡᱤᱱᱤᱥ ᱠᱚ ᱞᱮᱠᱷᱟᱭ ᱯᱮ ᱟᱨ ᱥᱟᱹᱨᱤ ᱞᱮᱠᱷᱟ ᱥᱟᱶ ᱡᱚᱲᱟᱣ ᱯᱮ।',
    questions: [
      {
        id: 'q-1',
        questionNumber: 1,
        type: 'count',
        promptHindi: 'कितने आम (Ul) दिखाई दे रहे हैं?',
        promptSanthali: 'ᱛᱤᱱᱟᱹᱜ ᱩᱞ ᱢᱮᱱᱟᱜᱼᱟ?',
        visualSymbol: '🥭 🥭 🥭',
        subtext: 'गिनो: 1, 2, 3...',
        options: ['2 (Bar)', '3 (Pe)', '4 (Pun)'],
        answer: '3 (Pe)'
      },
      {
        id: 'q-2',
        questionNumber: 2,
        type: 'match',
        promptHindi: 'साल के पत्तों (Sakam) को सही संख्या से मिलाएँ:',
        promptSanthali: 'ᱥᱟᱠᱟᱢ ᱞᱮᱠᱷᱟ ᱥᱟᱶ ᱡᱚᱲᱟᱣ ᱯᱮ:',
        visualSymbol: '🍃 🍃',
        subtext: '2 पत्ते = Bar (ᱵᱟᱨ)',
        options: ['1 (Mit)', '2 (Bar)', '5 (More)'],
        answer: '2 (Bar)'
      },
      {
        id: 'q-3',
        questionNumber: 3,
        type: 'fill',
        promptHindi: 'खाली जगह भरें: 1 (Mit), 2 (Bar), ___ (Pe), 4 (Pun)',
        promptSanthali: 'ᱠᱷᱟᱹᱞᱤ ᱴᱷᱟᱶ ᱯᱮᱨᱮᱡ ᱯᱮ: ᱑, ᱒, ___, ᱔',
        visualSymbol: '✏️',
        subtext: 'संथाली में 3 को क्या कहते हैं?',
        options: ['Pe (ᱯᱮ)', 'More (ᱢᱚᱬᱮ)', 'Gel (ᱜᱮᱞ)'],
        answer: 'Pe (ᱯᱮ)'
      },
      {
        id: 'q-4',
        questionNumber: 4,
        type: 'wordPair',
        promptHindi: 'शब्द मिलान करें: "महुआ बीज" (Matkom)',
        promptSanthali: 'ᱥᱟᱵᱟᱫ ᱡᱚᱲᱟᱣ: ᱢᱟᱹᱛᱠᱚᱢ',
        visualSymbol: '🌰 🌰 🌰 🌰 🌰',
        subtext: '5 बीज = More (ᱢᱚᱬᱮ)',
        options: ['4 (Pun)', '5 (More)', '6 (Turuy)'],
        answer: '5 (More)'
      }
    ],
    activityInstructions:
      'घर से 5 इमली के बीज या कंकड़ लाएँ और अपनी कॉपी पर 1 से 5 तक चित्र बनाएँ।',
    answerKeyNotes: 'Q1: 3 (Pe); Q2: 2 (Bar); Q3: Pe (ᱯᱮ); Q4: 5 (More)',
    createdAt: '2026-09-04T14:30:00Z',
    updatedAt: '2026-09-04T14:30:00Z'
  },
  {
    id: 'ws-002',
    title: 'हमारे आस-पास के शब्द (Nature Words & Vocabulary)',
    grade: 'Grade 1',
    subject: 'Foundational Literacy',
    topic: 'Basic Nature Words',
    difficulty: 'Beginner',
    localContext: 'Sal Forests & Village Life',
    instructionsHindi: 'चित्र देखकर हिंदी और संथाली शब्दों को पहचानें।',
    instructionsSanthali: 'ᱪᱤᱛᱟᱹᱨ ᱧᱮᱞ ᱠᱟᱛᱮ ᱥᱟᱵᱟᱫ ᱪᱤᱱᱦᱟᱹᱣ ᱯᱮ।',
    questions: [
      {
        id: 'q-201',
        questionNumber: 1,
        type: 'match',
        promptHindi: 'पेड़ (Tree) को संथाली में क्या कहते हैं?',
        promptSanthali: 'ᱫᱟᱨᱮ (Dare) ᱫᱚ ᱦᱤᱱᱫᱤ ᱛᱮ ᱪᱮᱛ?',
        visualSymbol: '🌳',
        options: ['ᱫᱟᱨᱮ (Dare)', 'ᱫᱟᱜ (Daq)', 'ᱚᱲᱟᱜ (Oraq)'],
        answer: 'ᱫᱟᱨᱮ (Dare)'
      },
      {
        id: 'q-202',
        questionNumber: 2,
        type: 'match',
        promptHindi: 'पानी (Water) का सही संथाली शब्द चुनें:',
        promptSanthali: 'ᱫᱟᱜ (Daq) - ᱫᱟᱜ ᱟᱹᱲᱟᱹ ᱵᱟᱪᱷᱟᱣ ᱯᱮ:',
        visualSymbol: '💧',
        options: ['ᱫᱟᱜ (Daq)', 'ᱵᱟᱦᱟ (Baha)', 'ᱥᱟᱠᱟᱢ (Sakam)'],
        answer: 'ᱫᱟᱜ (Daq)'
      },
      {
        id: 'q-203',
        questionNumber: 3,
        type: 'wordPair',
        promptHindi: 'चिड़िया (Bird) का संथाली रूप:',
        promptSanthali: 'ᱪᱮᱬᱮ (Chene) - ᱪᱤᱛᱟᱹᱨ ᱧᱮᱞ ᱯᱮ:',
        visualSymbol: '🐦',
        options: ['ᱪᱮᱬᱮ (Chene)', 'ᱡᱚ (Jo)', 'ᱦᱟᱴ (Haat)'],
        answer: 'ᱪᱮᱬᱮ (Chene)'
      }
    ],
    activityInstructions: 'कक्षा के बाहर जाकर 2 अलग-अलग पेड़ों के पत्ते अपनी स्लेट पर रखकर रूपरेखा खींचें।',
    answerKeyNotes: 'Q1: Dare; Q2: Daq; Q3: Chene',
    createdAt: '2026-09-03T16:00:00Z',
    updatedAt: '2026-09-03T16:00:00Z'
  }
];

export const INITIAL_WORKSHEETS: Worksheet[] = INITIAL_WORKSHEETS_BASE.map(attachWorksheetResourceReferences);

export const INITIAL_CLASSROOM_SESSIONS: ClassroomSession[] = [
  {
    id: 'ses-001',
    grade: 'Grade 2',
    subject: 'Foundational Numeracy',
    topic: 'Numbers 1 to 5 with Forest Fruits',
    language: 'Santhali',
    startedAt: '2026-09-04T09:10:00Z',
    endedAt: '2026-09-04T09:28:00Z',
    durationSeconds: 1080,
    exchanges: [
      {
        id: 'ex-1',
        speaker: 'teacher',
        text: 'सुप्रभात बच्चों, बैठ जाओ।',
        translatedText: 'ᱥᱟᱹᱜᱩᱱ ᱥᱮᱛᱟᱜ, ᱜᱤᱫᱽᱨᱟᱹ ᱠᱚ, ᱫᱩᱲᱩᱵ ᱯᱮ (Sagun Setag, Gidra ko, durup pe)',
        direction: 'hi-to-sat',
        timestamp: '09:10',
        isVerified: true
      },
      {
        id: 'ex-2',
        speaker: 'student',
        text: 'ᱦᱮᱸ ᱢᱟᱪᱮᱛ, ᱡᱚᱦᱟᱨ (He machet, Johar)',
        translatedText: 'हाँ शिक्षक, नमस्ते।',
        direction: 'sat-to-hi',
        timestamp: '09:11',
        isVerified: true
      },
      {
        id: 'ex-3',
        speaker: 'teacher',
        text: 'बच्चों, इन वस्तुओं को गिनो।',
        translatedText: 'ᱜᱤᱫᱽᱨᱟᱹ ᱠᱚ, ᱱᱚᱶᱟ ᱡᱤᱱᱤᱥ ᱠᱚ ᱞᱮᱠᱷᱟᱭ ᱯᱮ (Gidra ko, nowa jinis ko lekhae pe)',
        direction: 'hi-to-sat',
        timestamp: '09:13',
        isVerified: true
      },
      {
        id: 'ex-4',
        speaker: 'student',
        text: 'ᱯᱮᱭᱟ ᱩᱞ ᱢᱮᱱᱟᱜᱼᱟ (Peya ul menaq-a)',
        translatedText: 'तीन आम हैं।',
        direction: 'sat-to-hi',
        timestamp: '09:15',
        isVerified: true
      },
      {
        id: 'ex-5',
        speaker: 'teacher',
        text: 'शाबाश, बहुत अच्छा!',
        translatedText: 'ᱟᱹᱰᱤ ᱵᱮᱥ! (Adi bes!)',
        direction: 'hi-to-sat',
        timestamp: '09:16',
        isVerified: true
      }
    ],
    translationCount: 5,
    teacherPromptsCount: 3,
    studentResponsesCount: 2,
    comprehension: 'High',
    suggestedNextAction: 'Reinforce number 3 and 4 with concrete worksheet practice.',
    createdAt: '2026-09-04T09:28:00Z'
  },
  {
    id: 'ses-002',
    grade: 'Grade 1',
    subject: 'Foundational Literacy',
    topic: 'Sounds of Trees & Water',
    language: 'Santhali',
    startedAt: '2026-09-03T11:00:00Z',
    endedAt: '2026-09-03T11:15:00Z',
    durationSeconds: 900,
    exchanges: [
      {
        id: 'ex-201',
        speaker: 'teacher',
        text: 'ध्यान से सुनो और यहाँ देखो।',
        translatedText: 'ᱟᱸᱡᱚᱢ ᱢᱮ ᱟᱨ ᱱᱚᱰᱮ ᱧᱮᱞ ᱢᱮ (Anjom me ar node nel me)',
        direction: 'hi-to-sat',
        timestamp: '11:02',
        isVerified: true
      },
      {
        id: 'ex-202',
        speaker: 'student',
        text: 'ᱦᱮᱸ ᱢᱟᱪᱮᱛ (He machet)',
        translatedText: 'हाँ शिक्षक।',
        direction: 'sat-to-hi',
        timestamp: '11:03',
        isVerified: true
      },
      {
        id: 'ex-203',
        speaker: 'teacher',
        text: 'यह कौन सा अक्षर है?',
        translatedText: 'ᱱᱚᱶᱟ ᱫᱚ ᱪᱮᱛ ᱪᱤᱠᱤ ᱠᱟᱱᱟ? (Nowa do chet chiki kana?)',
        direction: 'hi-to-sat',
        timestamp: '11:06',
        isVerified: true
      },
      {
        id: 'ex-204',
        speaker: 'student',
        text: 'ᱱᱚᱶᱟ ᱫᱚ ᱢᱟᱨᱟᱝ ᱫᱟᱨᱮ ᱠᱟᱱᱟ (Nowa do marang dare kana)',
        translatedText: 'यह बड़ा पेड़ है।',
        direction: 'sat-to-hi',
        timestamp: '11:08',
        isVerified: true
      }
    ],
    translationCount: 4,
    teacherPromptsCount: 2,
    studentResponsesCount: 2,
    comprehension: 'Moderate',
    suggestedNextAction: 'Review initial sounds using physical leaves and visual flashcards.',
    createdAt: '2026-09-03T11:15:00Z'
  }
];

export const INITIAL_TRANSLATIONS: TranslationRecord[] = [
  {
    id: 'tr-1',
    sourceLanguage: 'Hindi',
    targetLanguage: 'Santhali',
    sourceText: 'बच्चों इन वस्तुओं को गिनो',
    translatedText: 'ᱜᱤᱫᱽᱨᱟᱹ ᱠᱚ, ᱱᱚᱶᱟ ᱡᱤᱱᱤᱥ ᱠᱚ ᱞᱮᱠᱷᱟᱭ ᱯᱮ (Gidra ko, nowa jinis ko lekhae pe)',
    isVerified: true,
    statusNote: 'Verified PALASH MTB-MLE classroom vocabulary',
    timestamp: '2026-09-04 09:13 AM'
  },
  {
    id: 'tr-2',
    sourceLanguage: 'Hindi',
    targetLanguage: 'Santhali',
    sourceText: 'कितने आम हैं',
    translatedText: 'ᱛᱤᱱᱟᱹᱜ ᱩᱞ ᱢᱮᱱᱟᱜᱼᱟ? (Tinaq ul menaq-a?)',
    isVerified: true,
    statusNote: 'Verified PALASH MTB-MLE classroom vocabulary',
    timestamp: '2026-09-04 09:14 AM'
  },
  {
    id: 'tr-3',
    sourceLanguage: 'Santhali',
    targetLanguage: 'Hindi',
    sourceText: 'ᱯᱮᱭᱟ ᱩᱞ ᱢᱮᱱᱟᱜᱼᱟ (Peya ul menaq-a)',
    translatedText: 'तीन आम हैं।',
    isVerified: true,
    statusNote: 'Classroom dialogue response match',
    timestamp: '2026-09-04 09:15 AM'
  },
  {
    id: 'tr-4',
    sourceLanguage: 'Hindi',
    targetLanguage: 'Santhali',
    sourceText: 'बहुत अच्छा',
    translatedText: 'ᱟᱹᱰᱤ ᱵᱮᱥ (Adi bes)',
    isVerified: true,
    statusNote: 'Verified PALASH MTB-MLE classroom vocabulary',
    timestamp: '2026-09-04 09:16 AM'
  }
];

export const INITIAL_FLASHCARDS: Flashcard[] = [
  // Numbers
  {
    id: 'fc-1',
    category: 'Numbers',
    frontHindi: 'एक (1)',
    backSanthali: 'ᱢᱤᱫ',
    olChikiScript: 'ᱢᱤᱫ',
    phonetic: 'Mit\'',
    englishMeaning: 'One (1)',
    localContextHint: 'एक सूर्य / ᱢᱤᱫ ᱪᱟᱸᱫᱚ',
    learned: true,
    visualIcon: '☀️'
  },
  {
    id: 'fc-2',
    category: 'Numbers',
    frontHindi: 'दो (2)',
    backSanthali: 'ᱵᱟᱨ',
    olChikiScript: 'ᱵᱟᱨ',
    phonetic: 'Bar',
    englishMeaning: 'Two (2)',
    localContextHint: 'दो आँखें / ᱵᱟᱨ ᱢᱮᱫ',
    learned: true,
    visualIcon: '👀'
  },
  {
    id: 'fc-3',
    category: 'Numbers',
    frontHindi: 'तीन (3)',
    backSanthali: 'ᱯᱮ',
    olChikiScript: 'ᱯᱮ',
    phonetic: 'Pe',
    englishMeaning: 'Three (3)',
    localContextHint: 'तीन आम / ᱯᱮᱭᱟ ᱩᱞ',
    learned: true,
    visualIcon: '🥭'
  },
  {
    id: 'fc-4',
    category: 'Numbers',
    frontHindi: 'चार (4)',
    backSanthali: 'ᱯᱩᱱ',
    olChikiScript: 'ᱯᱩᱱ',
    phonetic: 'Pun',
    englishMeaning: 'Four (4)',
    localContextHint: 'चार पैर / ᱯᱩᱱ ᱡᱟᱝᱜᱟ',
    learned: true,
    visualIcon: '🦌'
  },
  {
    id: 'fc-5',
    category: 'Numbers',
    frontHindi: 'पांच (5)',
    backSanthali: 'ᱢᱚᱬᱮ',
    olChikiScript: 'ᱢᱚᱬᱮ',
    phonetic: 'More',
    englishMeaning: 'Five (5)',
    localContextHint: 'हाथ की पाँच अंगुलियाँ',
    learned: true,
    visualIcon: '✋'
  },
  {
    id: 'fc-6',
    category: 'Numbers',
    frontHindi: 'छह (6)',
    backSanthali: 'ᱛᱩᱨᱩᱭ',
    olChikiScript: 'ᱛᱩᱨᱩᱭ',
    phonetic: 'Turuy',
    englishMeaning: 'Six (6)',
    localContextHint: 'छह कंकड़',
    learned: false,
    visualIcon: '🪨'
  },

  // Words & Objects
  {
    id: 'fc-7',
    category: 'Objects',
    frontHindi: 'पानी',
    backSanthali: 'ᱫᱟᱜ',
    olChikiScript: 'ᱫᱟᱜ',
    phonetic: 'Daq',
    englishMeaning: 'Water',
    localContextHint: 'कुएँ का साफ़ पानी',
    learned: true,
    visualIcon: '💧'
  },
  {
    id: 'fc-8',
    category: 'Objects',
    frontHindi: 'पेड़',
    backSanthali: 'ᱫᱟᱨᱮ',
    olChikiScript: 'ᱫᱟᱨᱮ',
    phonetic: 'Dare',
    englishMeaning: 'Tree',
    localContextHint: 'स्कूल प्रांगण का साल पेड़',
    learned: false,
    visualIcon: '🌳'
  },
  {
    id: 'fc-9',
    category: 'Objects',
    frontHindi: 'पत्ता',
    backSanthali: 'ᱥᱟᱠᱟᱢ',
    olChikiScript: 'ᱥᱟᱠᱟᱢ',
    phonetic: 'Sakam',
    englishMeaning: 'Leaf',
    localContextHint: 'हरे साल के पत्ते',
    learned: false,
    visualIcon: '🍃'
  },
  {
    id: 'fc-10',
    category: 'Objects',
    frontHindi: 'चिड़िया',
    backSanthali: 'ᱪᱮᱬᱮ',
    olChikiScript: 'ᱪᱮᱬᱮ',
    phonetic: 'Chene',
    englishMeaning: 'Bird',
    localContextHint: 'डाल पर बैठी चिड़िया',
    learned: false,
    visualIcon: '🐦'
  },
  {
    id: 'fc-11',
    category: 'Objects',
    frontHindi: 'घर',
    backSanthali: 'ᱚᱲᱟᱜ',
    olChikiScript: 'ᱚᱲᱟᱜ',
    phonetic: 'Oraq',
    englishMeaning: 'Home',
    localContextHint: 'मिट्टी की सुंदर दीवारें',
    learned: false,
    visualIcon: '🏠'
  },
  {
    id: 'fc-12',
    category: 'Objects',
    frontHindi: 'फूल',
    backSanthali: 'ᱵᱟᱦᱟ',
    olChikiScript: 'ᱵᱟᱦᱟ',
    phonetic: 'Baha',
    englishMeaning: 'Flower',
    localContextHint: 'सरहुल का बहार फूल',
    learned: false,
    visualIcon: '🌸'
  },

  // Shapes
  {
    id: 'fc-13',
    category: 'Shapes',
    frontHindi: 'गोल (Circle)',
    backSanthali: 'ᱜᱩᱞᱟᱹᱭ',
    olChikiScript: 'ᱜᱩᱞᱟᱹᱭ',
    phonetic: 'Gulae',
    englishMeaning: 'Round / Circle',
    localContextHint: 'रोटी या थाली जैसा गोल',
    learned: false,
    visualIcon: '⚪'
  },
  {
    id: 'fc-14',
    category: 'Shapes',
    frontHindi: 'चौकोर (Square)',
    backSanthali: 'ᱯᱩᱱ ᱠᱳᱬ',
    olChikiScript: 'ᱯᱩᱱ ᱠᱳᱬ',
    phonetic: 'Pun kon',
    englishMeaning: 'Four cornered / Square',
    localContextHint: 'स्लेट जैसी आकृति',
    learned: false,
    visualIcon: '⬛'
  },

  // Letters (Ol Chiki Script sounds)
  {
    id: 'fc-15',
    category: 'Letters',
    frontHindi: 'अ (La sound letter)',
    backSanthali: 'ᱚ (La)',
    olChikiScript: 'ᱚ',
    phonetic: 'La',
    englishMeaning: 'First Ol Chiki letter (O)',
    localContextHint: 'पहला स्वर वर्ण',
    learned: false,
    visualIcon: '🔤'
  },
  {
    id: 'fc-16',
    category: 'Letters',
    frontHindi: 'त (At letter)',
    backSanthali: 'ᱛ (At)',
    olChikiScript: 'ᱛ',
    phonetic: 'At',
    englishMeaning: 'Consonant At (Earth/place sound)',
    localContextHint: 'व्यंजन वर्ण',
    learned: false,
    visualIcon: '🔤'
  }
];

export const INITIAL_LANGUAGE_PRACTICE: LanguagePracticeItem[] = [
  {
    id: 'lp-1',
    category: 'Greetings',
    phraseHindi: 'सुप्रभात बच्चों',
    phraseSanthali: 'ᱥᱟᱹᱜᱩᱱ ᱥᱮᱛᱟᱜ, ᱜᱤᱫᱽᱨᱟᱹ ᱠᱚ',
    olChikiScript: 'ᱥᱟᱹᱜᱩᱱ ᱥᱮᱛᱟᱜ, ᱜᱤᱫᱽᱨᱟᱹ ᱠᱚ',
    phonetic: 'Sagun setag, gidra ko',
    meaningContext: 'Morning classroom opening greeting',
    learned: true,
    isVerified: true
  },
  {
    id: 'lp-2',
    category: 'Classroom Phrases',
    phraseHindi: 'अपनी किताब खोलो',
    phraseSanthali: 'ᱟᱢᱟᱜ ᱯᱩᱛᱷᱤ ᱡᱷᱤᱡᱽ ᱢᱮ',
    olChikiScript: 'ᱟᱢᱟᱜ ᱯᱩᱛᱷᱤ ᱡᱷᱤᱡᱽ ᱢᱮ',
    phonetic: 'Amag puthi jhij me',
    meaningContext: 'Instruction to open workbook / textbook',
    learned: true,
    isVerified: true
  },
  {
    id: 'lp-3',
    category: 'Numbers',
    phraseHindi: 'तीन आम गिनो',
    phraseSanthali: 'ᱯᱮᱭᱟ ᱩᱞ ᱞᱮᱠᱷᱟᱭ ᱢᱮ',
    olChikiScript: 'ᱯᱮᱭᱟ ᱩᱞ ᱞᱮᱠᱷᱟᱭ ᱢᱮ',
    phonetic: 'Peya ul lekhae me',
    meaningContext: 'Direct numeracy task prompt',
    learned: true,
    isVerified: true
  },
  {
    id: 'lp-4',
    category: 'Encouragement',
    phraseHindi: 'शाबाश, बहुत अच्छा किया!',
    phraseSanthali: 'ᱟᱹᱰᱤ ᱵᱮᱥ ᱮᱢ ᱠᱟᱹᱢᱤ ᱠᱮᱫᱟ!',
    olChikiScript: 'ᱟᱹᱰᱤ ᱵᱮᱥ ᱮᱢ ᱠᱟᱹᱢᱤ ᱠᱮᱫᱟ!',
    phonetic: 'Adi bes em kami keda!',
    meaningContext: 'Praising correct student answers',
    learned: true,
    isVerified: true
  },
  {
    id: 'lp-5',
    category: 'Classroom Phrases',
    phraseHindi: 'यहाँ देखो और ध्यान से सुनो',
    phraseSanthali: 'ᱱᱚᱰᱮ ᱧᱮᱞ ᱢᱮ ᱟᱨ ᱟᱸᱡᱚᱢ ᱢᱮ',
    olChikiScript: 'ᱱᱚᱰᱮ ᱧᱮᱞ ᱢᱮ ᱟᱨ ᱟᱸᱡᱚᱢ ᱢᱮ',
    phonetic: 'Node nel me ar anjom me',
    meaningContext: 'Focus command before demonstration',
    learned: true,
    isVerified: true
  },
  {
    id: 'lp-6',
    category: 'Activities',
    phraseHindi: 'साथ मिलकर गाओ',
    phraseSanthali: 'ᱢᱤᱫ ᱥᱟᱶᱛᱮ ᱥᱮᱨᱮᱧ ᱯᱮ',
    olChikiScript: 'ᱢᱤᱫ ᱥᱟᱶᱛᱮ ᱥᱮᱨᱮᱧ ᱯᱮ',
    phonetic: 'Mit sawte serenj pe',
    meaningContext: 'Group song or rhythm warm-up activity',
    learned: false,
    isVerified: true
  },
  {
    id: 'lp-7',
    category: 'Assessment',
    phraseHindi: 'क्या आपको समझ आया?',
    phraseSanthali: 'ᱟᱢ ᱵᱩᱡᱷᱟᱹᱣ ᱠᱮᱫᱟ?',
    olChikiScript: 'ᱟᱢ ᱵᱩᱡᱷᱟᱹᱣ ᱠᱮᱫᱟ?',
    phonetic: 'Am bujhaw keda?',
    meaningContext: 'Comprehension verification prompt',
    learned: false,
    isVerified: true
  },
  {
    id: 'lp-8',
    category: 'Objects',
    phraseHindi: 'यह पानी है',
    phraseSanthali: 'ᱱᱚᱶᱟ ᱫᱚ ᱫᱟᱜ ᱠᱟᱱᱟ',
    olChikiScript: 'ᱱᱚᱶᱟ ᱫᱚ ᱫᱟᱜ ᱠᱟᱱᱟ',
    phonetic: 'Nowa do daq kana',
    meaningContext: 'Object identification sentence',
    learned: false,
    isVerified: true
  }
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Classroom Session Saved',
    message: 'Grade 2 Numeracy session saved with 5 language exchanges.',
    timestamp: 'Yesterday, 09:28 AM',
    read: false,
    type: 'classroom'
  },
  {
    id: 'notif-2',
    title: 'Worksheet Ready',
    message: 'Counting & Matching Haat Objects worksheet is ready to print.',
    timestamp: 'Yesterday, 02:30 PM',
    read: false,
    type: 'worksheet'
  },
  {
    id: 'notif-3',
    title: 'Offline Database Ready',
    message: 'All PALASH MTB-MLE lesson templates cached for offline use.',
    timestamp: '2 days ago',
    read: true,
    type: 'system'
  }
];
