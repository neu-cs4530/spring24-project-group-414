import * as fs from 'fs';
import * as path from 'path';

// Hash collection to hold the dictionary of english words
type BombPartyWordMap = {
  [key in string]: boolean;
};

function loadEnglishDictionaryFromJSON(): BombPartyWordMap {
  const jsonData = fs.readFileSync(
    path.join(path.resolve(), 'src/town/games/data/words_dictionary.json'),
    'utf-8',
  );
  const parsedData = JSON.parse(jsonData);
  return parsedData;
}

/**
 * A class that checks the validity of words and generates substrings for the game Bomb Party.
 */
export default class BombPartyDictionary {
  // The list of words that have already been used in the game.
  private _wordHistory: string[];

  // The list of substrings that have been used in the game.
  private _substringHistory: string[];

  // Hash collection used to lookup valid words
  private _dict: BombPartyWordMap;

  constructor(lang = 'en') {
    this._wordHistory = [];
    this._substringHistory = [];
    if (lang === 'en') {
      this._dict = loadEnglishDictionaryFromJSON();
    } else {
      throw new Error('Unrecognized language!');
    }
  }

  /**
   * Generates a substring to be used in the game.
   *
   * The returned substring should be added to the history of substrings used in the game.
   */
  public generateSubstring(): string {
    const words = Object.keys(this._dict);
    const sz = Math.random() < 0.5 ? 2 : 3;
    const w = words[Math.floor(Math.random() * words.length)];
    const start = Math.floor(Math.random() * (w.length - sz));
    return w.substring(start, start + sz);
  }

  /**
   * Checks if the provided word is valid.
   *
   * A word is valid if it is found in the dictionary, and if it hasn't been added to the history yet.
   * @param word the word to validate.
   */
  public validateWord(word: string): boolean {
    return !this._wordHistory.includes(word) && this._dict[word];
  }

  /**
   * Adds the word provided to the history of words used in the game.
   *
   * Words are added to the history to prevent players from using the same word multiple times.
   *
   * Checks if the word is valid before adding it to the history.
   * @param word the word to be added to history.
   */
  public addWordToHistory(word: string): void {
    if (this.validateWord(word)) {
      this._wordHistory = [...this._wordHistory, word];
    }
  }

  /**
   * Clears the history of words and substrings used in the game.
   *
   * Should be used to reset the game.
   */
  public clearHistory(): void {
    this._wordHistory = [];
    this._substringHistory = [];
  }
}
