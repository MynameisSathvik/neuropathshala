export interface DictionaryEntry {
  hindi: string;
  santhali: string;
  olChiki?: string;
  phonetic: string;
  english: string;
  category: 'Greetings' | 'Classroom Management' | 'Foundational Literacy' | 'Foundational Numeracy' | 'Activities' | 'Assessment' | 'Encouragement' | 'Objects' | 'Numbers';
  isVerified: boolean;
  notes?: string;
}

// Normalizer: trims, removes extra whitespace, lowercases, removes standard punctuation (.,?!।:;"')
export function normalizePhrase(text: string): string {
  return text
    .toLowerCase()
    .replace(/[।.,?!;:'"“”‘’_()\-–—]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export const SANTHALI_DICTIONARY: DictionaryEntry[] = [
  // Greetings
  {
    hindi: 'नमस्ते',
    santhali: 'ᱡᱚᱦᱟᱨ',
    olChiki: 'ᱡᱚᱦᱟᱨ',
    phonetic: 'Johar',
    english: 'Hello / Greetings',
    category: 'Greetings',
    isVerified: true,
    notes: 'Standard respectful Santhali greeting across all Jharkhand blocks'
  },
  {
    hindi: 'सुप्रभात',
    santhali: 'ᱥᱟᱹᱜᱩᱱ ᱥᱮᱛᱟᱜ',
    olChiki: 'ᱥᱟᱹᱜᱩᱱ ᱥᱮᱛᱟᱜ',
    phonetic: 'Sagun Setag',
    english: 'Good morning',
    category: 'Greetings',
    isVerified: true,
    notes: 'Common morning greeting in Santhali MTB-MLE classrooms'
  },
  {
    hindi: 'आप कैसे हैं',
    santhali: 'ᱪᱮᱛ ᱞᱮᱠᱟ ᱢᱮᱱᱟᱢᱟ?',
    olChiki: 'ᱪᱮᱛ ᱞᱮᱠᱟ ᱢᱮᱱᱟᱢᱟ?',
    phonetic: 'Chet leka menama?',
    english: 'How are you?',
    category: 'Greetings',
    isVerified: true
  },
  {
    hindi: 'मैं ठीक हूँ',
    santhali: 'ᱤᱧ ᱵᱮᱥ ᱜᱮ ᱢᱮᱱᱟᱹᱧᱟ',
    olChiki: 'ᱤᱧ ᱵᱮᱥ ᱜᱮ ᱢᱮᱱᱟᱹᱧᱟ',
    phonetic: 'Iny bes ge menanya',
    english: 'I am fine',
    category: 'Greetings',
    isVerified: true
  },
  {
    hindi: 'आपका नाम क्या है',
    santhali: 'ᱟᱢᱟᱜ ᱧᱩᱛᱩᱢ ᱫᱚ ᱪᱮᱛ?',
    olChiki: 'ᱟᱢᱟᱜ ᱧᱩᱛᱩᱢ ᱫᱚ ᱪᱮᱛ?',
    phonetic: 'Amag nyutum do chet?',
    english: 'What is your name?',
    category: 'Greetings',
    isVerified: true
  },
  {
    hindi: 'मेरा नाम रोहन है',
    santhali: 'ᱤᱧᱟᱜ ᱧᱩᱛᱩᱢ ᱫᱚ ᱨᱚᱦᱚᱱ',
    olChiki: 'ᱤᱧᱟᱜ ᱧᱩᱛᱩᱢ ᱫᱚ ᱨᱚᱦᱚᱱ',
    phonetic: 'Inyag nyutum do Rohan',
    english: 'My name is Rohan',
    category: 'Greetings',
    isVerified: true
  },

  // Classroom Management
  {
    hindi: 'बच्चों बैठ जाओ',
    santhali: 'ᱜᱤᱫᱽᱨᱟᱹ ᱠᱚ, ᱫᱩᱲᱩᱵ ᱯᱮ',
    olChiki: 'ᱜᱤᱫᱽᱨᱟᱹ ᱠᱚ, ᱫᱩᱲᱩᱵ ᱯᱮ',
    phonetic: 'Gidra ko, durup pe',
    english: 'Children, please sit down',
    category: 'Classroom Management',
    isVerified: true
  },
  {
    hindi: 'किताब खोलो',
    santhali: 'ᱯᱩᱛᱷᱤ ᱡᱷᱤᱡᱽ ᱯᱮ',
    olChiki: 'ᱯᱩᱛᱷᱤ ᱡᱷᱤᱡᱽ ᱯᱮ',
    phonetic: 'Puthi jhij pe',
    english: 'Open the book',
    category: 'Classroom Management',
    isVerified: true
  },
  {
    hindi: 'किताब बंद करो',
    santhali: 'ᱯᱩᱛᱷᱤ ᱵᱚᱸᱫᱽ ᱯᱮ',
    olChiki: 'ᱯᱩᱛᱷᱤ ᱵᱚᱸᱫᱽ ᱯᱮ',
    phonetic: 'Puthi bond pe',
    english: 'Close the book',
    category: 'Classroom Management',
    isVerified: true
  },
  {
    hindi: 'ध्यान से सुनो',
    santhali: 'ᱟᱸᱡᱚᱢ ᱢᱮ',
    olChiki: 'ᱟᱸᱡᱚᱢ ᱢᱮ',
    phonetic: 'Anjom me',
    english: 'Listen carefully',
    category: 'Classroom Management',
    isVerified: true
  },
  {
    hindi: 'यहाँ देखो',
    santhali: 'ᱱᱚᱰᱮ ᱧᱮᱞ ᱢᱮ',
    olChiki: 'ᱱᱚᱰᱮ ᱧᱮᱞ ᱢᱮ',
    phonetic: 'Node nel me',
    english: 'Look here',
    category: 'Classroom Management',
    isVerified: true
  },
  {
    hindi: 'शांत रहो',
    santhali: 'ᱛᱷᱤᱨ ᱛᱟᱦᱮᱸᱱ ᱯᱮ',
    olChiki: 'ᱛᱷᱤᱨ ᱛᱟᱦᱮᱸᱱ ᱯᱮ',
    phonetic: 'Thir tahen pe',
    english: 'Stay quiet',
    category: 'Classroom Management',
    isVerified: true
  },
  {
    hindi: 'हाथ उठाओ',
    santhali: 'ᱛᱤ ᱛᱩᱞ ᱯᱮ',
    olChiki: 'ᱛᱤ ᱛᱩᱞ ᱯᱮ',
    phonetic: 'Ti tul pe',
    english: 'Raise your hand',
    category: 'Classroom Management',
    isVerified: true
  },

  // Foundational Literacy
  {
    hindi: 'वर्णमाला दोहराओ',
    santhali: 'ᱚᱞ ᱪᱤᱠᱤ ᱫᱚᱦᱲᱟᱭ ᱯᱮ',
    olChiki: 'ᱚᱞ ᱪᱤᱠᱤ ᱫᱚᱦᱲᱟᱭ ᱯᱮ',
    phonetic: 'Ol Chiki dohrae pe',
    english: 'Repeat the alphabet / script',
    category: 'Foundational Literacy',
    isVerified: true
  },
  {
    hindi: 'कहानी सुनो',
    santhali: 'ᱠᱟᱹᱦᱱᱤ ᱟᱸᱡᱚᱢ ᱯᱮ',
    olChiki: 'ᱠᱟᱹᱦᱱᱤ ᱟᱸᱡᱚᱢ ᱯᱮ',
    phonetic: 'Kahni anjom pe',
    english: 'Listen to the story',
    category: 'Foundational Literacy',
    isVerified: true
  },
  {
    hindi: 'शब्द पढ़ो',
    santhali: 'ᱥᱟᱵᱟᱫ ᱯᱟᱲᱦᱟᱣ ᱢᱮ',
    olChiki: 'ᱥᱟᱵᱟᱫ ᱯᱟᱲᱦᱟᱣ ᱢᱮ',
    phonetic: 'Sabad padhao me',
    english: 'Read the word',
    category: 'Foundational Literacy',
    isVerified: true
  },
  {
    hindi: 'यह कौन सा अक्षर है',
    santhali: 'ᱱᱚᱶᱟ ᱫᱚ ᱪᱮᱛ ᱪᱤᱠᱤ ᱠᱟᱱᱟ?',
    olChiki: 'ᱱᱚᱶᱟ ᱫᱚ ᱪᱮᱛ ᱪᱤᱠᱤ ᱠᱟᱱᱟ?',
    phonetic: 'Nowa do chet chiki kana?',
    english: 'Which letter is this?',
    category: 'Foundational Literacy',
    isVerified: true
  },
  {
    hindi: 'अपनी कॉपी में लिखो',
    santhali: 'ᱟᱢᱟᱜ ᱠᱷᱟᱛᱟ ᱨᱮ ᱚᱞ ᱢᱮ',
    olChiki: 'ᱟᱢᱟᱜ ᱠᱷᱟᱛᱟ ᱨᱮ ᱚᱞ ᱢᱮ',
    phonetic: 'Amag khata re ol me',
    english: 'Write in your notebook',
    category: 'Foundational Literacy',
    isVerified: true
  },

  // Foundational Numeracy
  {
    hindi: 'बच्चों इन वस्तुओं को गिनो',
    santhali: 'ᱜᱤᱫᱽᱨᱟᱹ ᱠᱚ, ᱱᱚᱶᱟ ᱡᱤᱱᱤᱥ ᱠᱚ ᱞᱮᱠᱷᱟᱭ ᱯᱮ',
    olChiki: 'ᱜᱤᱫᱽᱨᱟᱹ ᱠᱚ, ᱱᱚᱶᱟ ᱡᱤᱱᱤᱥ ᱠᱚ ᱞᱮᱠᱷᱟᱭ ᱯᱮ',
    phonetic: 'Gidra ko, nowa jinis ko lekhae pe',
    english: 'Children, count these objects',
    category: 'Foundational Numeracy',
    isVerified: true
  },
  {
    hindi: 'कितने आम हैं',
    santhali: 'ᱛᱤᱱᱟᱹᱜ ᱩᱞ ᱢᱮᱱᱟᱜᱼᱟ?',
    olChiki: 'ᱛᱤᱱᱟᱹᱜ ᱩᱞ ᱢᱮᱱᱟᱜᱼᱟ?',
    phonetic: 'Tinaq ul menaq-a?',
    english: 'How many mangoes are there?',
    category: 'Foundational Numeracy',
    isVerified: true
  },
  {
    hindi: 'जोड़ो',
    santhali: 'ᱡᱚᱲᱟᱣ ᱢᱮ',
    olChiki: 'ᱡᱚᱲᱟᱣ ᱢᱮ',
    phonetic: 'Joraw me',
    english: 'Add / Join',
    category: 'Foundational Numeracy',
    isVerified: true
  },
  {
    hindi: 'घटाओ',
    santhali: 'ᱜᱷᱟᱴᱟᱣ ᱢᱮ',
    olChiki: 'ᱜᱷᱟᱴᱟᱣ ᱢᱮ',
    phonetic: 'Ghataw me',
    english: 'Subtract / Reduce',
    category: 'Foundational Numeracy',
    isVerified: true
  },
  {
    hindi: 'बड़ा कौन सा है',
    santhali: 'ᱢᱟᱨᱟᱝ ᱫᱚ ᱚᱠᱟᱴᱟᱜ?',
    olChiki: 'ᱢᱟᱨᱟᱝ ᱫᱚ ᱚᱠᱟᱴᱟᱜ?',
    phonetic: 'Marang do okatag?',
    english: 'Which one is bigger?',
    category: 'Foundational Numeracy',
    isVerified: true
  },
  {
    hindi: 'छोटा कौन सा है',
    santhali: 'ᱦᱩᱰᱤᱧ ᱫᱚ ᱚᱠᱟᱴᱟᱜ?',
    olChiki: 'ᱦᱩᱰᱤᱧ ᱫᱚ ᱚᱠᱟᱴᱟᱜ?',
    phonetic: 'Hudiny do okatag?',
    english: 'Which one is smaller?',
    category: 'Foundational Numeracy',
    isVerified: true
  },

  // Numbers (1 to 10)
  {
    hindi: 'एक',
    santhali: 'ᱢᱤᱫ',
    olChiki: 'ᱢᱤᱫ',
    phonetic: 'Mit\'',
    english: 'One (1)',
    category: 'Numbers',
    isVerified: true
  },
  {
    hindi: 'दो',
    santhali: 'ᱵᱟᱨ',
    olChiki: 'ᱵᱟᱨ',
    phonetic: 'Bar',
    english: 'Two (2)',
    category: 'Numbers',
    isVerified: true
  },
  {
    hindi: 'तीन',
    santhali: 'ᱯᱮ',
    olChiki: 'ᱯᱮ',
    phonetic: 'Pe',
    english: 'Three (3)',
    category: 'Numbers',
    isVerified: true
  },
  {
    hindi: 'चार',
    santhali: 'ᱯᱩᱱ',
    olChiki: 'ᱯᱩᱱ',
    phonetic: 'Pun',
    english: 'Four (4)',
    category: 'Numbers',
    isVerified: true
  },
  {
    hindi: 'पांच',
    santhali: 'ᱢᱚᱬᱮ',
    olChiki: 'ᱢᱚᱬᱮ',
    phonetic: 'More',
    english: 'Five (5)',
    category: 'Numbers',
    isVerified: true
  },
  {
    hindi: 'छह',
    santhali: 'ᱛᱩᱨᱩᱭ',
    olChiki: 'ᱛᱩᱨᱩᱭ',
    phonetic: 'Turuy',
    english: 'Six (6)',
    category: 'Numbers',
    isVerified: true
  },
  {
    hindi: 'सात',
    santhali: 'ᱮᱭᱟᱭ',
    olChiki: 'ᱮᱭᱟᱭ',
    phonetic: 'Eyay',
    english: 'Seven (7)',
    category: 'Numbers',
    isVerified: true
  },
  {
    hindi: 'आठ',
    santhali: 'ᱤᱨᱟᱹᱞ',
    olChiki: 'ᱤᱨᱟᱹᱞ',
    phonetic: 'Iral',
    english: 'Eight (8)',
    category: 'Numbers',
    isVerified: true
  },
  {
    hindi: 'नौ',
    santhali: 'ᱟᱨᱮ',
    olChiki: 'ᱟᱨᱮ',
    phonetic: 'Are',
    english: 'Nine (9)',
    category: 'Numbers',
    isVerified: true
  },
  {
    hindi: 'दस',
    santhali: 'ᱜᱮᱞ',
    olChiki: 'ᱜᱮᱞ',
    phonetic: 'Gel',
    english: 'Ten (10)',
    category: 'Numbers',
    isVerified: true
  },

  // Everyday Objects & Local Community Words
  {
    hindi: 'पानी',
    santhali: 'ᱫᱟᱜ',
    olChiki: 'ᱫᱟᱜ',
    phonetic: 'Daq',
    english: 'Water',
    category: 'Objects',
    isVerified: true
  },
  {
    hindi: 'पेड़',
    santhali: 'ᱫᱟᱨᱮ',
    olChiki: 'ᱫᱟᱨᱮ',
    phonetic: 'Dare',
    english: 'Tree',
    category: 'Objects',
    isVerified: true
  },
  {
    hindi: 'पत्ता',
    santhali: 'ᱥᱟᱠᱟᱢ',
    olChiki: 'ᱥᱟᱠᱟᱢ',
    phonetic: 'Sakam',
    english: 'Leaf (e.g. Sal leaf)',
    category: 'Objects',
    isVerified: true
  },
  {
    hindi: 'चिड़िया',
    santhali: 'ᱪᱮᱬᱮ',
    olChiki: 'ᱪᱮᱬᱮ',
    phonetic: 'Chene',
    english: 'Bird',
    category: 'Objects',
    isVerified: true
  },
  {
    hindi: 'घर',
    santhali: 'ᱚᱲᱟᱜ',
    olChiki: 'ᱚᱲᱟᱜ',
    phonetic: 'Oraq',
    english: 'Home / House',
    category: 'Objects',
    isVerified: true
  },
  {
    hindi: 'फूल',
    santhali: 'ᱵᱟᱦᱟ',
    olChiki: 'ᱵᱟᱦᱟ',
    phonetic: 'Baha',
    english: 'Flower',
    category: 'Objects',
    isVerified: true
  },
  {
    hindi: 'फल',
    santhali: 'ᱡᱚ',
    olChiki: 'ᱡᱚ',
    phonetic: 'Jo',
    english: 'Fruit',
    category: 'Objects',
    isVerified: true
  },
  {
    hindi: 'महुआ',
    santhali: 'ᱢᱟᱹᱛᱠᱚᱢ',
    olChiki: 'ᱢᱟᱹᱛᱠᱚᱢ',
    phonetic: 'Matkom',
    english: 'Mahua flower/tree',
    category: 'Objects',
    isVerified: true
  },
  {
    hindi: 'बाजार',
    santhali: 'ᱦᱟᱴ',
    olChiki: 'ᱦᱟᱴ',
    phonetic: 'Haat',
    english: 'Village market / Haat',
    category: 'Objects',
    isVerified: true
  },

  // Activities & Encouragement
  {
    hindi: 'बहुत अच्छा',
    santhali: 'ᱟᱹᱰᱤ ᱵᱮᱥ',
    olChiki: 'ᱟᱹᱰᱤ ᱵᱮᱥ',
    phonetic: 'Adi bes',
    english: 'Very good!',
    category: 'Encouragement',
    isVerified: true
  },
  {
    hindi: 'शाबाश',
    santhali: 'ᱥᱟᱵᱟᱥ',
    olChiki: 'ᱥᱟᱵᱟᱥ',
    phonetic: 'Shabas',
    english: 'Well done!',
    category: 'Encouragement',
    isVerified: true
  },
  {
    hindi: 'फिर से कोशिश करो',
    santhali: 'ᱟᱨᱦᱚᱸ ᱪᱮᱥᱴᱟᱭ ᱢᱮ',
    olChiki: 'ᱟᱨᱦᱚᱸ ᱪᱮᱥᱴᱟᱭ ᱢᱮ',
    phonetic: 'Arho chestae me',
    english: 'Try again',
    category: 'Encouragement',
    isVerified: true
  },
  {
    hindi: 'क्या आपको समझ आया',
    santhali: 'ᱟᱢ ᱵᱩᱡᱷᱟᱹᱣ ᱠᱮᱫᱟ?',
    olChiki: 'ᱟᱢ ᱵᱩᱡᱷᱟᱹᱣ ᱠᱮᱫᱟ?',
    phonetic: 'Am bujhaw keda?',
    english: 'Did you understand?',
    category: 'Assessment',
    isVerified: true
  },
  {
    hindi: 'साथ मिलकर गाओ',
    santhali: 'ᱢᱤᱫ ᱥᱟᱶᱛᱮ ᱥᱮᱨᱮᱧ ᱯᱮ',
    olChiki: 'ᱢᱤᱫ ᱥᱟᱶᱛᱮ ᱥᱮᱨᱮᱧ ᱯᱮ',
    phonetic: 'Mit sawte serenj pe',
    english: 'Sing together',
    category: 'Activities',
    isVerified: true
  },
  {
    hindi: 'चित्र बनाओ',
    santhali: 'ᱪᱤᱛᱟᱹᱨ ᱵᱮᱱᱟᱣ ᱢᱮ',
    olChiki: 'ᱪᱤᱛᱟᱹᱨ ᱵᱮᱱᱟᱣ ᱢᱮ',
    phonetic: 'Chitar benaw me',
    english: 'Draw a picture',
    category: 'Activities',
    isVerified: true
  }
];

// Student simulated responses for Live Classroom
export interface StudentResponseOption {
  santhali: string;
  hindi: string;
  label: string;
  topicTag: string;
}

export const STUDENT_SIMULATION_RESPONSES: StudentResponseOption[] = [
  {
    santhali: 'ᱦᱮᱸ ᱢᱟᱪᱮᱛ, ᱵᱩᱡᱷᱟᱹᱣ ᱠᱮᱫᱟᱹᱧ (He machet, bujhaw kedan)',
    hindi: 'हाँ शिक्षक, मैं समझ गया।',
    label: 'हाँ समझ गया (He machet)',
    topicTag: 'General'
  },
  {
    santhali: 'ᱯᱮᱭᱟ ᱩᱞ ᱢᱮᱱᱟᱜᱼᱟ (Peya ul menaq-a)',
    hindi: 'तीन आम हैं।',
    label: 'तीन आम हैं (Numbers)',
    topicTag: 'Numbers'
  },
  {
    santhali: 'ᱢᱚᱬᱮ ᱜᱚᱴᱟᱝ ᱢᱟᱹᱛᱠᱚᱢ (More gotang matkom)',
    hindi: 'पाँच महुआ के बीज हैं।',
    label: 'पाँच महुआ बीज (Counting)',
    topicTag: 'Counting'
  },
  {
    santhali: 'ᱟᱨ ᱢᱤᱫ ᱫᱷᱟᱣ ᱞᱟᱹᱭ ᱢᱮ (Ar mit dhaw lae me)',
    hindi: 'कृपया एक बार फिर बोलिए।',
    label: 'एक बार फिर बोलिए (Clarification)',
    topicTag: 'General'
  },
  {
    santhali: 'ᱱᱚᱶᱟ ᱫᱚ ᱢᱟᱨᱟᱝ ᱫᱟᱨᱮ ᱠᱟᱱᱟ (Nowa do marang dare kana)',
    hindi: 'यह बड़ा पेड़ है।',
    label: 'यह बड़ा पेड़ है (Nature)',
    topicTag: 'Shapes'
  }
];

export interface TranslationLookupResult {
  found: boolean;
  translatedText: string;
  olChiki?: string;
  phonetic?: string;
  sourceText: string;
  direction: 'hi-to-sat' | 'sat-to-hi';
  isVerified: boolean;
  statusNote: string;
}

export function lookupTranslation(
  input: string,
  direction: 'hi-to-sat' | 'sat-to-hi'
): TranslationLookupResult {
  const norm = normalizePhrase(input);
  if (!norm) {
    return {
      found: false,
      translatedText: '',
      sourceText: input,
      direction,
      isVerified: false,
      statusNote: 'Empty input'
    };
  }

  if (direction === 'hi-to-sat') {
    // Check direct Hindi match
    for (const entry of SANTHALI_DICTIONARY) {
      if (normalizePhrase(entry.hindi) === norm) {
        return {
          found: true,
          translatedText: `${entry.santhali} (${entry.phonetic})`,
          olChiki: entry.olChiki,
          phonetic: entry.phonetic,
          sourceText: input,
          direction,
          isVerified: entry.isVerified,
          statusNote: entry.isVerified
            ? 'Verified PALASH MTB-MLE classroom vocabulary'
            : 'Unreviewed translation — verify with a native speaker'
        };
      }
    }

    // Check partial phrase inclusion
    for (const entry of SANTHALI_DICTIONARY) {
      const entryNorm = normalizePhrase(entry.hindi);
      if (norm.includes(entryNorm) && entryNorm.length > 3) {
        return {
          found: true,
          translatedText: `${entry.santhali} (${entry.phonetic})`,
          olChiki: entry.olChiki,
          phonetic: entry.phonetic,
          sourceText: input,
          direction,
          isVerified: false,
          statusNote: 'Partial phrase match — verify with a native speaker'
        };
      }
    }

    return {
      found: false,
      translatedText: '',
      sourceText: input,
      direction,
      isVerified: false,
      statusNote: 'Translation unavailable for this phrase. Showing supported classroom phrases.'
    };
  } else {
    // Santhali to Hindi
    for (const entry of SANTHALI_DICTIONARY) {
      if (
        normalizePhrase(entry.santhali) === norm ||
        normalizePhrase(entry.phonetic) === norm ||
        (entry.olChiki && normalizePhrase(entry.olChiki) === norm)
      ) {
        return {
          found: true,
          translatedText: entry.hindi,
          sourceText: input,
          direction,
          isVerified: entry.isVerified,
          statusNote: entry.isVerified
            ? 'Verified PALASH MTB-MLE classroom vocabulary'
            : 'Unreviewed translation — verify with a native speaker'
        };
      }
    }

    // Check student simulation list
    for (const res of STUDENT_SIMULATION_RESPONSES) {
      if (normalizePhrase(res.santhali).includes(norm) || norm.includes(normalizePhrase(res.santhali))) {
        return {
          found: true,
          translatedText: res.hindi,
          sourceText: input,
          direction,
          isVerified: true,
          statusNote: 'Classroom dialogue response match'
        };
      }
    }

    return {
      found: false,
      translatedText: '',
      sourceText: input,
      direction,
      isVerified: false,
      statusNote: 'Translation unavailable for this phrase.'
    };
  }
}
