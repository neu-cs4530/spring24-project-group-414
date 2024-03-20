import { createPlayerForTesting } from '../../TestUtils';
import {
  GAME_FULL_MESSAGE,
  GAME_NOT_STARTABLE_MESSAGE,
  PLAYER_ALREADY_IN_GAME_MESSAGE,
  PLAYER_NOT_GAME_HOST_MESSAGE,
  PLAYER_NOT_IN_GAME_MESSAGE,
} from '../../lib/InvalidParametersError';
import BombPartyDictionary from './BombPartyDictionary';
import BombPartyGame from './BombPartyGame';
import BombPartyTimer from './BombPartyTimer';

describe('BombPartGame', () => {
  jest.useFakeTimers();
  let game: BombPartyGame;
  let timer: BombPartyTimer;
  let dictionary: BombPartyDictionary;
  let stateUpdateCallback: jest.Mock<void, []>;
  beforeEach(() => {
    timer = new BombPartyTimer();
    dictionary = new BombPartyDictionary();
    stateUpdateCallback = jest.fn();
    game = new BombPartyGame(timer, dictionary, stateUpdateCallback);
  });
  afterEach(() => {
    jest.clearAllTimers();
    jest.restoreAllMocks();
  });
  describe('[T1.1] _join', () => {
    it('should throw an error if the player is already in the game', () => {
      const player = createPlayerForTesting();
      game.join(player);
      expect(() => game.join(player)).toThrowError(PLAYER_ALREADY_IN_GAME_MESSAGE);
      const player2 = createPlayerForTesting();
      game.join(player2);
      expect(() => game.join(player2)).toThrowError(PLAYER_ALREADY_IN_GAME_MESSAGE);
    });
    it('should throw an error if the player is not in the game and the game is full', () => {
      const player1 = createPlayerForTesting();
      const player2 = createPlayerForTesting();
      const player3 = createPlayerForTesting();
      const player4 = createPlayerForTesting();
      const player5 = createPlayerForTesting();
      const player6 = createPlayerForTesting();
      const player7 = createPlayerForTesting();
      const player8 = createPlayerForTesting();
      const player9 = createPlayerForTesting();
      game.join(player1);
      game.join(player2);
      game.join(player3);
      game.join(player4);
      game.join(player5);
      game.join(player6);
      game.join(player7);
      game.join(player8);
      expect(() => game.join(player9)).toThrowError(GAME_FULL_MESSAGE);
    });
    it('should add the player to the game if the player is not in the game and the game is not full', () => {
      const player1 = createPlayerForTesting();
      const player2 = createPlayerForTesting();
      const player3 = createPlayerForTesting();
      game.join(player1);
      game.join(player2);
      game.join(player3);
      expect(game.state.players).toEqual([player1.id, player2.id, player3.id]);
    });
    it('should set the status to WAITING_TO_START if the minimum number of players have joined', () => {
      const player1 = createPlayerForTesting();
      const player2 = createPlayerForTesting();
      game.join(player1);
      expect(game.state.status).toBe('WAITING_FOR_PLAYERS');
      game.join(player2);
      expect(game.state.status).toBe('WAITING_TO_START');
    });
    it('should set the status to WAITING_TO_START if the maximum number of players have joined', () => {
      const player1 = createPlayerForTesting();
      const player2 = createPlayerForTesting();
      const player3 = createPlayerForTesting();
      const player4 = createPlayerForTesting();
      const player5 = createPlayerForTesting();
      const player6 = createPlayerForTesting();
      const player7 = createPlayerForTesting();
      const player8 = createPlayerForTesting();
      game.join(player1);
      game.join(player2);
      game.join(player3);
      game.join(player4);
      game.join(player5);
      game.join(player6);
      game.join(player7);
      game.join(player8);
      expect(game.state.status).toBe('WAITING_TO_START');
    });
  });
  describe('[T1.2] _startGame', () => {
    test('if the status is not WAITING_TO_START, it should throw an error', () => {
      const player = createPlayerForTesting();
      game.join(player);
      expect(() => game.startGame(player)).toThrowError(GAME_NOT_STARTABLE_MESSAGE);
    });
    test('if the player is not in the game, it should throw an error', () => {
      game.join(createPlayerForTesting());
      game.join(createPlayerForTesting());
      expect(() => game.startGame(createPlayerForTesting())).toThrowError(
        PLAYER_NOT_IN_GAME_MESSAGE,
      );
    });
    test('if the player is not the game host, it should throw an error', () => {
      const player1 = createPlayerForTesting();
      const player2 = createPlayerForTesting();
      game.join(player1);
      game.join(player2);
      expect(() => game.startGame(player2)).toThrowError(PLAYER_NOT_GAME_HOST_MESSAGE);
    });
    describe('if the player is the game host and the game is in the WAITING_TO_START state', () => {
      it('should start the game', () => {
        jest.spyOn(dictionary, 'generateSubstring').mockReturnValue('test');
        const player1 = createPlayerForTesting();
        const player2 = createPlayerForTesting();
        game.join(player1);
        game.join(player2);
        game.startGame(player1);
        expect(game.state.status).toBe('IN_PROGRESS');
      });
      it('should set all players to have max lives', () => {
        jest.spyOn(dictionary, 'generateSubstring').mockReturnValue('test');
        const player1 = createPlayerForTesting();
        const player2 = createPlayerForTesting();
        game.join(player1);
        game.join(player2);
        game.startGame(player1);
        expect(game.state.lives[player1.id]).toBe(3);
        expect(game.state.lives[player2.id]).toBe(3);
      });
      it('should set the turn of the first player and generate a substring', () => {
        jest.spyOn(dictionary, 'generateSubstring').mockReturnValue('test');
        jest.spyOn(Math, 'random').mockReturnValue(0);
        const player1 = createPlayerForTesting();
        const player2 = createPlayerForTesting();
        game.join(player1);
        game.join(player2);
        game.startGame(player1);
        expect(game.state.currentPlayerIndex).toBe(0);
        expect(game.state.currentSubstring).toBe('test');
      });
      // TODO: Expand startGame tests to cover the changes caused by the game starting
    });
  });
  describe('[T1.3] _leave', () => {
    it('should throw an error if the player is not in the game', () => {
      const player = createPlayerForTesting();
      expect(() => game.leave(player)).toThrowError(PLAYER_NOT_IN_GAME_MESSAGE);
      game.join(player);
      expect(() => game.leave(createPlayerForTesting())).toThrowError(PLAYER_NOT_IN_GAME_MESSAGE);
    });
    describe('when the player is in the game', () => {
      describe('when the game is in progress', () => {
        it('should set the life count of that player to 0', () => {
          jest.spyOn(dictionary, 'generateSubstring').mockReturnValue('test');
          const player1 = createPlayerForTesting();
          const player2 = createPlayerForTesting();
          game.join(player1);
          game.join(player2);
          game.startGame(player1);
          game.leave(player2);
          expect(game.state.lives[player2.id]).toBe(0);
        });
        it('should end the game if the player leaving is the last player', () => {
          jest.spyOn(dictionary, 'generateSubstring').mockReturnValue('test');
          const player1 = createPlayerForTesting();
          game.join(player1);
          const player2 = createPlayerForTesting();
          game.join(player2);
          game.startGame(player1);
          expect(game.state.lives[player1.id]).toBe(game.state.maxLives);
          expect(game.state.lives[player2.id]).toBe(game.state.maxLives);
          expect(game.state.status).toBe('IN_PROGRESS');
          game.leave(player1);
          expect(game.state.lives[player1.id]).toBe(0);
          expect(game.state.status).toBe('OVER');
          expect(game.state.winner).toBe(player2.id);
        });
        it('should not end the game if the player leaving is not the last player', () => {
          jest.spyOn(dictionary, 'generateSubstring').mockReturnValue('test');
          const player1 = createPlayerForTesting();
          const player2 = createPlayerForTesting();
          const player3 = createPlayerForTesting();
          game.join(player1);
          game.join(player2);
          game.join(player3);
          game.startGame(player1);
          game.leave(player2);
          expect(game.state.lives[player2.id]).toBe(0);
          expect(game.state.status).toBe('IN_PROGRESS');
        });
      });
      test('when the game is over, it should not change the game state', () => {
        jest.spyOn(dictionary, 'generateSubstring').mockReturnValue('test');
        const player1 = createPlayerForTesting();
        game.join(player1);
        const player2 = createPlayerForTesting();
        game.join(player2);
        game.startGame(player1);
        game.leave(player1);
        expect(game.state.lives[player1.id]).toBe(0);
        expect(game.state.status).toBe('OVER');
        expect(game.state.winner).toBe(player2.id);
        const stateBeforeLeaving = { ...game.state };
        game.leave(player2);
        expect(game.state).toEqual(stateBeforeLeaving);
      });
      describe('when the game is waiting to start', () => {
        test('if a player leaves when there are only two players, it should set the status to WAITING_FOR_PLAYERS', () => {
          const player1 = createPlayerForTesting();
          const player2 = createPlayerForTesting();
          game.join(player1);
          game.join(player2);
          game.leave(player1);
          expect(game.state.status).toBe('WAITING_FOR_PLAYERS');
        });
        test('if a player leaves when there are more than two players, it should not change the status', () => {
          const player1 = createPlayerForTesting();
          const player2 = createPlayerForTesting();
          const player3 = createPlayerForTesting();
          game.join(player1);
          game.join(player2);
          game.join(player3);
          game.leave(player1);
          expect(game.state.status).toBe('WAITING_TO_START');
        });
        test('if the host leaves, the next oldest player should become the host', () => {
          jest.spyOn(dictionary, 'generateSubstring').mockReturnValue('test');
          const player1 = createPlayerForTesting();
          const player2 = createPlayerForTesting();
          const player3 = createPlayerForTesting();
          game.join(player1);
          game.join(player2);
          game.join(player3);
          expect(() => game.startGame(player2)).toThrowError(PLAYER_NOT_GAME_HOST_MESSAGE);
          game.leave(player1);
          game.startGame(player2);
          expect(game.state.status).toBe('IN_PROGRESS');
        });
      });
      describe('when the game is waiting for players', () => {
        test('if a player leaves, the status should stay WAITING_FOR_PLAYERS', () => {
          const player1 = createPlayerForTesting();
          game.join(player1);
          expect(game.state.status).toBe('WAITING_FOR_PLAYERS');
          game.leave(player1);
          expect(game.state.status).toBe('WAITING_FOR_PLAYERS');
        });
      });
    });
  });
  describe('[T1.4] applyMove', () => {
    // TODO: Add tests for applyMove
  });
});
