import BombPartyDictionary from './BombPartyDictionary';

describe('BombPartyDictionary', () => {
  let dictionary: BombPartyDictionary;
  const somewords = ['hello', 'world', 'albatross', 'motorcycle', 'quantify', 'capricious'];
  const somemorewords = ['holy', 'cow', 'this', 'dictionary', 'is', 'amazing'];
  const notsomewords = ['hackscalope', 'bifolograph', 'pildarbism', 'winstaplory'];
  beforeEach(() => {
    dictionary = new BombPartyDictionary();
  });
  test('should be able to validate and invalidate if a word is in the english language', () => {
    somewords.forEach(word => {
      expect(dictionary.validateWord(word)).toBeTruthy();
    });
    somemorewords.forEach(word => {
      expect(dictionary.validateWord(word)).toBeTruthy();
    });
    notsomewords.forEach(word => {
      expect(dictionary.validateWord(word)).toBeFalsy();
    });
  });
  test('should invalidate otherwise valid words if they have been used before', () => {
    somewords.forEach(word => {
      dictionary.addWordToHistory(word);
    });
    somewords.forEach(word => {
      expect(dictionary.validateWord(word)).toBeFalsy();
    });
    somemorewords.forEach(word => {
      expect(dictionary.validateWord(word)).toBeTruthy();
    });
  });
  test('should validate words with case-insensitivity', () => {
    somewords.forEach(word => {
      expect(dictionary.validateWord(word.toUpperCase())).toBeTruthy();
      expect(dictionary.validateWord(word.toLowerCase())).toBeTruthy();
    });
  });
  test('should be able to generate a random substring derived from an english word', () => {
    const unlikelyPrompts = [
      'cj',
      'fq',
      'gx',
      'hx',
      'jf',
      'jq',
      'jx',
      'jz',
      'qb',
      'qc',
      'qj',
      'qk',
      'qx',
      'qz',
      'sx',
      'vf',
      'vj',
      'vq',
      'vx',
      'wx',
      'xj',
      'zx',
    ];
    for (let i = 0; i < 100; i++) {
      const prompt = dictionary.generateSubstring();
      expect(prompt.length === 2 || prompt.length === 3).toBeTruthy();
      expect(unlikelyPrompts).not.toContain(prompt);
    }
  });
});
