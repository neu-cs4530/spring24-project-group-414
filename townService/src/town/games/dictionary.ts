import * as fs from 'fs';

function loadDictionary(filePath: string): ReadonlyArray<string> {
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    const words = data.trim().split(' ');
    return words;
  } catch (e) {
    console.error(`Error reading file: ${e}`);
    return [];
  }
}

const DICTIONARY = loadDictionary('enable1.txt');
const POPULAR = loadDictionary('popular.txt');

export default { DICTIONARY, POPULAR };
