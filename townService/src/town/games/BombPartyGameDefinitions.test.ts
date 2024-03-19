// test
import { createPlayerForTesting } from '../../TestUtils';
import {
  GAME_FULL_MESSAGE,
  GAME_NOT_IN_PROGRESS_MESSAGE,
  BOARD_POSITION_NOT_EMPTY_MESSAGE,
  MOVE_NOT_YOUR_TURN_MESSAGE,
  PLAYER_ALREADY_IN_GAME_MESSAGE,
  PLAYER_NOT_IN_GAME_MESSAGE,
} from '../../lib/InvalidParametersError';
import BombPartyGame from './BombPartyGame';
import Player from '../../lib/Player';

describe('BombPartyGameDefintions', () => {
  //test data structures and interfaces
  let game: BombPartyGame;
  beforeEach(() => {
    game = new BombPartyGame();
  });
  describe('BombPartyGame definitions', () => {
    test('BombPartyGameState struct definition', () => {
      expect(() => game.state).toBeDefined();
      expect(() => game.state.moves).toBeDefined();
      expect(() => game.state.currentPrompt).toBeDefined();
      expect(() => game.state.lives).toBeDefined();
      expect(() => game.state.wordsDict).toBeDefined();
    });
  });

  describe('english word dictionary', () => {
    test('test that the dictionary can be retrieved', () => {
      const wordlist = BombPartyGame._getEnglishWordsDictFromJSON();
      expect(wordlist['abnormality']).toBe(1);
    });
  });
});
