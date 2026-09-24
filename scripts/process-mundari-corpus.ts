import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

type CorpusPair = {
  hindi: string;
  mundari: string;
};

type IndexedPair = CorpusPair & { category: string };

const root = process.cwd();
const sourcePath = path.join(root, 'data/mundari/source/translation-hi-unr.tsv');
const outputDirectory = path.join(root, 'data/mundari/processed');

const provenance = {
  source: 'Karya Hindi-Mundari Translation Dataset',
  repository: 'https://github.com/karya-inc/dataset-hindi-mundari-translation',
  language_pair: 'Hindi-Mundari',
  source_format: 'TSV'
};

const classroomCategories: Array<[string, RegExp]> = [
  ['Greetings', /नमस्ते|जोहार|सुप्रभात|शुभ प्रभात|कैसे हैं|कैसी हैं|स्वागत/iu],
  ['Classroom Management', /कक्षा|स्कूल|विद्यालय|बैठ|खड़े|शांत|ध्यान|सुनो|सुनिए|देखो|देखिए|खोलो|बंद करो|पढ़ो|लिखो|दोहर|बोलो|बताओ|उठो/iu],
  ['Foundational Numeracy', /एक|दो|तीन|चार|पाँच|छह|सात|आठ|नौ|दस|गिन|संख्या|जोड़|घटाव|गिनती/iu],
  ['Objects', /किताब|पुस्तक|कलम|पेंसिल|कागज|बस्ता|बोर्ड|चॉक|मेज|कुर्सी|घर|पानी/iu],
  ['Family', /माँ|माता|पिता|बच्चा|बच्चे|भाई|बहन|परिवार|दादा|दादी/iu],
  ['Body Parts', /आँख|आंख|कान|नाक|मुँह|मुंह|हाथ|पैर|सिर|शरीर/iu],
  ['Basic Questions', /क्या|कौन|कहाँ|कहां|कब|क्यों|किसका|कैसे/iu],
  ['Basic Actions', /आओ|जाओ|बैठो|चलो|खाओ|पीओ|दो|लो|करो|आना|जाना|खाना|पीना|खेलो|नाचो/iu],
  ['FLN Vocabulary', /अक्षर|शब्द|वाक्य|कहानी|पढ़ना|लिखना|अंक|गणित|आकार|रंग|लाल|हरा|नीला|पीला|काला|सफेद/iu]
];

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/gu, ' ').trim();
}

function normalizeKey(value: string): string {
  return normalizeWhitespace(value)
    .toLocaleLowerCase('hi')
    .replace(/[।.,?!;:'"“”‘’_()\-–—]/gu, '');
}

function classify(hindi: string): string | undefined {
  return classroomCategories.find(([, pattern]) => pattern.test(hindi))?.[0];
}

function addToLookup(lookup: Record<string, string[]>, hindi: string, mundari: string): void {
  const key = normalizeKey(hindi);
  const translations = lookup[key] || [];
  if (!translations.includes(mundari)) translations.push(mundari);
  lookup[key] = translations;
}

async function main(): Promise<void> {
  const raw = await readFile(sourcePath, 'utf8');
  const lines = raw.split(/\r?\n/gu).filter((line) => line.length > 0);
  const pairs: CorpusPair[] = [];
  let malformedRecordCount = 0;

  for (const line of lines) {
    const columns = line.split('\t');
    if (columns.length !== 2) {
      malformedRecordCount += 1;
      continue;
    }

    const hindi = normalizeWhitespace(columns[0]);
    const mundari = normalizeWhitespace(columns[1]);
    if (!hindi || !mundari) {
      malformedRecordCount += 1;
      continue;
    }
    pairs.push({ hindi, mundari });
  }

  const uniquePairs = [...new Map(pairs.map((pair) => [`${pair.hindi}\u0000${pair.mundari}`, pair])).values()]
    .sort((left, right) => `${left.hindi}\u0000${left.mundari}`.localeCompare(`${right.hindi}\u0000${right.mundari}`, 'hi'));
  const classroomPairs: IndexedPair[] = uniquePairs
    .map((pair) => ({ ...pair, category: classify(pair.hindi) }))
    .filter((pair): pair is IndexedPair => Boolean(pair.category));

  const lookup: Record<string, string[]> = {};
  for (const pair of uniquePairs) addToLookup(lookup, pair.hindi, pair.mundari);

  await mkdir(outputDirectory, { recursive: true });
  await writeFile(path.join(outputDirectory, 'mundari_translation_index.json'), `${JSON.stringify({
    metadata: {
      ...provenance,
      rawRecordCount: lines.length,
      validRecordCount: pairs.length,
      malformedRecordCount,
      uniquePairCount: uniquePairs.length,
      classroomRecordCount: classroomPairs.length
    },
    lookup
  })}\n`, 'utf8');
  await writeFile(path.join(outputDirectory, 'mundari_classroom_phrases.json'), `${JSON.stringify({
    metadata: provenance,
    entries: classroomPairs
  })}\n`, 'utf8');

  console.log(JSON.stringify({
    rawRecordCount: lines.length,
    validRecordCount: pairs.length,
    malformedRecordCount,
    uniquePairCount: uniquePairs.length,
    classroomRecordCount: classroomPairs.length
  }));
}

await main();