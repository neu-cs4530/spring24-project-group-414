/**
 * A class that checks the validity of words and generates substrings for the game Bomb Party.
 */
export default class BombPartyDictionary {
  // The list of words that have already been used in the game.
  private _wordHistory: string[];

  // The list of substrings that have been used in the game.
  private _substringHistory: string[];

  constructor() {
    this._wordHistory = [];
    this._substringHistory = [];
  }

  /**
   * Generates a substring to be used in the game.
   *
   * The returned substring should be added to the history of substrings used in the game.
   */
  public genrateSubstring(): string {
    throw new Error('Not implemented');
  }

  /**
   * Checks if the provided word is valid.
   *
   * A word is valid if it is found in the dictionary, and if it hasn't been added to the history yet.
   * @param word the word to validate.
   */
  public validateWord(word: string): boolean {
    if (this._wordHistory.includes(word)) {
      return false;
    }
    throw new Error('Not implemented');
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
