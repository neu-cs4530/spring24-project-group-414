import { createPlayerForTesting } from '../../TestUtils';
import {
  GAME_FULL_MESSAGE,
  GAME_NOT_IN_PROGRESS_MESSAGE,
  GAME_NOT_STARTABLE_MESSAGE,
  GAME_SETTINGS_NOT_MODIFIABLE_MESSAGE,
  MOVE_NOT_YOUR_TURN_MESSAGE,
  PLAYER_ALREADY_IN_GAME_MESSAGE,
  PLAYER_NOT_GAME_HOST_MESSAGE,
  PLAYER_NOT_IN_GAME_MESSAGE,
} from '../../lib/InvalidParametersError';
import Player from '../../lib/Player';
import BombPartyDictionary from './BombPartyDictionary';
import BombPartyGame from './BombPartyGame';
import BombPartyTimer from './BombPartyTimer';

/**
 * A helper function for applying a list of moves to a game.
 * Each of the lists is in order of appearance in the game.
 *
 * The first player in the players list will be the first player to take their turn, with the rest following in order.
 * The first prompt in the prompts list will be the first prompt, with the rest following in order.
 * The first word in the words list will be the first word submitted, with the rest following in order.
 *
 * If a word is bad, it will not progress to the next player's turn or change the prompt.
 * If a word is good, it will progress to the next player's turn and change the prompt.
 * If a word is empty, it will time out the turn.
 * @param game Game to apply the moves to
 * @param dictionary the dictionary to use for generating substrings
 * @param players the players in the game
 * @param prompts the prompts to use
 * @param words the words to submit
 */
function createMovesFromList(
  game: BombPartyGame,
  dictionary: BombPartyDictionary,
  players: Player[],
  prompts: string[],
  words: string[],
) {
  let currentPromptIndex = 0;
  let currentPlayerIndex = 0;
  let currentWordIndex = 0;
  const prepareNextPrompt = () => {
    jest.spyOn(dictionary, 'generateSubstring').mockReturnValue(prompts[currentPromptIndex]);
    currentPromptIndex++;
  };
  const turnTimeOut = () => {
    jest.advanceTimersByTime(game.state.settings.turnLength + 1);
  };
  const submitWord = (player: Player, word: string, firstTurn: boolean) => {
    if (!firstTurn) {
      prepareNextPrompt();
    }
    game.applyMove({
      gameID: game.id,
      playerID: player.id,
      move: {
        word,
        playerID: player.id,
      },
    });
  };
  const gameOver = () => game.state.status === 'OVER';

  // Join Players to the game and start the game
  players.forEach((player, index) => {
    game.join(player);
  });
  prepareNextPrompt();
  jest.spyOn(Math, 'random').mockReturnValue(0);
  game.startGame(players[0]);

  while (currentWordIndex < words.length && !gameOver()) {
    const word = words[currentWordIndex];
    if (word.length === 0) {
      turnTimeOut();
      currentPlayerIndex = game.state.currentPlayerIndex;
    } else {
      submitWord(players[currentPlayerIndex], word, currentWordIndex === 0);
      currentPlayerIndex = game.state.currentPlayerIndex;
    }
    if (gameOver()) {
      return;
    }
    currentWordIndex++;
  }
}
describe('BombPartyGame', () => {
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
          expect(game.state.lives[player1.id]).toBe(game.state.settings.maxLives);
          expect(game.state.lives[player2.id]).toBe(game.state.settings.maxLives);
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
  describe('changeSettings', () => {
    it('should throw an error if the game is in progress', () => {
      jest.spyOn(dictionary, 'generateSubstring').mockReturnValue('test');
      const player1 = createPlayerForTesting();
      const player2 = createPlayerForTesting();
      game.join(player1);
      game.join(player2);
      game.startGame(player1);
      expect(() =>
        game.changeSettings({
          playerID: player1.id,
          gameID: game.id,
          settings: {
            maxLives: 5,
            turnLength: 30000,
            decreasingTurnLength: false,
          },
        }),
      ).toThrowError(GAME_SETTINGS_NOT_MODIFIABLE_MESSAGE);
    });
    it('should throw an error if the player is not the game host', () => {
      const player1 = createPlayerForTesting();
      const player2 = createPlayerForTesting();
      game.join(player1);
      game.join(player2);
      expect(() =>
        game.changeSettings({
          playerID: player2.id,
          gameID: game.id,
          settings: {
            maxLives: 5,
            turnLength: 30000,
            decreasingTurnLength: false,
          },
        }),
      ).toThrowError(PLAYER_NOT_GAME_HOST_MESSAGE);
    });
    it('should update the game settings if the game is not in progress and the player is the host', () => {
      const player1 = createPlayerForTesting();
      game.join(player1);
      game.changeSettings({
        playerID: player1.id,
        gameID: game.id,
        settings: {
          maxLives: 5,
          turnLength: 30000,
          decreasingTurnLength: false,
        },
      });
      expect(game.state.settings).toEqual({
        maxLives: 5,
        turnLength: 30000,
        decreasingTurnLength: false,
      });
    });
  });
  describe('[T1.4] turnTimeOut', () => {
    const player1 = createPlayerForTesting();
    const player2 = createPlayerForTesting();
    beforeEach(() => {
      game.join(player1);
      game.join(player2);
    });
    describe('when a turn ends prematurely', () => {
      it('should not execute the areaChange callback', () => {
        jest.spyOn(dictionary, 'generateSubstring').mockReturnValue('test');
        jest.spyOn(Math, 'random').mockReturnValue(0);
        game.startGame(player1);
        expect(game.state.currentPlayerIndex).toBe(0);
        game.applyMove({
          gameID: game.id,
          playerID: player1.id,
          move: {
            word: 'test',
            playerID: player1.id,
          },
        });
        expect(game.state.currentPlayerIndex).toBe(1);
        expect(stateUpdateCallback).not.toHaveBeenCalled();
      });
      it('should not decrease the player life count or end the game', () => {
        jest.spyOn(dictionary, 'generateSubstring').mockReturnValue('test');
        jest.spyOn(Math, 'random').mockReturnValue(0);
        game.startGame(player1);
        expect(game.state.currentPlayerIndex).toBe(0);
        game.applyMove({
          gameID: game.id,
          playerID: player1.id,
          move: {
            word: 'test',
            playerID: player1.id,
          },
        });
        expect(game.state.currentPlayerIndex).toBe(1);
        expect(game.state.lives[player1.id]).toBe(3);
        expect(game.state.status).toBe('IN_PROGRESS');
      });
    });
    describe('when a turn times out', () => {
      it('should execute the areaChange callback', () => {
        jest.spyOn(dictionary, 'generateSubstring').mockReturnValue('test');
        jest.spyOn(Math, 'random').mockReturnValue(0);
        game.startGame(player1);
        expect(game.state.currentPlayerIndex).toBe(0);
        jest.advanceTimersByTime(25001);
        expect(stateUpdateCallback).toHaveBeenCalled();
        expect(game.state.currentPlayerIndex).toBe(1);
      });
      it('should decrease the player life count', () => {
        jest.spyOn(dictionary, 'generateSubstring').mockReturnValue('test');
        jest.spyOn(Math, 'random').mockReturnValue(0);
        game.startGame(player1);
        expect(game.state.currentPlayerIndex).toBe(0);
        expect(game.state.lives[player1.id]).toBe(3);
        jest.advanceTimersByTime(25001);
        expect(game.state.lives[player1.id]).toBe(2);
        expect(game.state.currentPlayerIndex).toBe(1);
      });
      it('should not end the game if multiple players have lives left', () => {
        jest.spyOn(dictionary, 'generateSubstring').mockReturnValue('test');
        jest.spyOn(Math, 'random').mockReturnValue(0);
        game.startGame(player1);
        expect(game.state.currentPlayerIndex).toBe(0);
        expect(game.state.lives[player1.id]).toBe(3);
        jest.advanceTimersByTime(25001);
        expect(game.state.lives[player1.id]).toBe(2);
        expect(game.state.status).toBe('IN_PROGRESS');
        expect(game.state.currentPlayerIndex).toBe(1);
      });
      it('should not change the word prompt', () => {
        jest.spyOn(dictionary, 'generateSubstring').mockReturnValue('test');
        jest.spyOn(Math, 'random').mockReturnValue(0);
        game.startGame(player1);
        expect(game.state.currentPlayerIndex).toBe(0);
        expect(game.state.currentSubstring).toBe('test');
        jest.advanceTimersByTime(25001);
        expect(game.state.lives[player1.id]).toBe(2);
        expect(game.state.currentSubstring).toBe('test');
        expect(game.state.currentPlayerIndex).toBe(1);
      });
      it('should end the game if only one player has lives left', () => {
        jest.spyOn(dictionary, 'generateSubstring').mockReturnValue('test');
        jest.spyOn(Math, 'random').mockReturnValue(0);
        game.startGame(player1);
        expect(game.state.currentPlayerIndex).toBe(0);
        expect(game.state.lives[player1.id]).toBe(3);
        expect(game.state.lives[player2.id]).toBe(3);
        jest.advanceTimersByTime(25001);
        expect(game.state.currentPlayerIndex).toBe(1);
        expect(game.state.lives[player1.id]).toBe(2);
        expect(game.state.lives[player2.id]).toBe(3);
        jest.advanceTimersByTime(25001);
        expect(game.state.currentPlayerIndex).toBe(0);
        expect(game.state.lives[player1.id]).toBe(2);
        expect(game.state.lives[player2.id]).toBe(2);
        jest.advanceTimersByTime(25001);
        expect(game.state.currentPlayerIndex).toBe(1);
        expect(game.state.lives[player1.id]).toBe(1);
        expect(game.state.lives[player2.id]).toBe(2);
        jest.advanceTimersByTime(25001);
        expect(game.state.currentPlayerIndex).toBe(0);
        expect(game.state.lives[player1.id]).toBe(1);
        expect(game.state.lives[player2.id]).toBe(1);
        jest.advanceTimersByTime(25001);
        expect(game.state.currentPlayerIndex).toBe(0);
        expect(game.state.lives[player1.id]).toBe(0);
        expect(game.state.lives[player2.id]).toBe(1);
        expect(game.state.status).toBe('OVER');
        expect(game.state.winner).toBe(player2.id);
      });
    });
  });
  describe('applyMove', () => {
    const player1 = createPlayerForTesting();
    const player2 = createPlayerForTesting();
    const player3 = createPlayerForTesting();
    const player4 = createPlayerForTesting();
    beforeEach(() => {
      game.join(player1);
      game.join(player2);
      game.join(player3);
      game.join(player4);
    });
    describe('[T2.2] when given a valid move', () => {
      it('should accept the word and progress to the next player', () => {
        jest.spyOn(dictionary, 'generateSubstring').mockReturnValue('test');
        jest.spyOn(Math, 'random').mockReturnValue(0);
        game.startGame(player1);
        expect(game.state.currentPlayerIndex).toBe(0);
        expect(game.state.currentSubstring).toBe('test');
        jest.spyOn(dictionary, 'generateSubstring').mockReturnValue('second');
        game.applyMove({
          gameID: game.id,
          playerID: player1.id,
          move: {
            word: 'test',
            playerID: player1.id,
          },
        });
        expect(game.state.currentPlayerIndex).toBe(1);
        expect(game.state.currentSubstring).toBe('second');
        expect(game.state.moves).toHaveLength(1);
      });
      it('should choose the next living player if a player has no lives left', () => {
        jest.spyOn(dictionary, 'generateSubstring').mockReturnValue('test');
        jest.spyOn(Math, 'random').mockReturnValue(0);
        game.startGame(player1);
        game.leave(player2);
        expect(game.state.lives[player2.id]).toBe(0);
        expect(game.state.currentPlayerIndex).toBe(0);
        expect(game.state.currentSubstring).toBe('test');
        jest.spyOn(dictionary, 'generateSubstring').mockReturnValue('second');
        game.applyMove({
          gameID: game.id,
          playerID: player1.id,
          move: {
            word: 'test',
            playerID: player1.id,
          },
        });
        expect(game.state.currentPlayerIndex).toBe(2);
        expect(game.state.currentSubstring).toBe('second');
        expect(game.state.moves).toHaveLength(1);
      });
    });
    describe('first player wins when the other players give bad answers and timeout', () => {
      const newTimer = new BombPartyTimer();
      const newDictionary = new BombPartyDictionary();
      const newUpdateCallback = jest.fn();
      const newGame = new BombPartyGame(newTimer, newDictionary, newUpdateCallback);
      createMovesFromList(
        newGame,
        newDictionary,
        [player1, player2, player3, player4],
        ['test', 'test', 'test', 'test'],
        [
          'test',
          'test',
          'random',
          '',
          '',
          '',
          'testing',
          '',
          '',
          '',
          'tested',
          '',
          '',
          '',
          'detest',
        ],
      );
      expect(newGame.state.moves).toHaveLength(5);
      expect(newGame.state.status).toBe('OVER');
    });
    describe('[T2.4] when given an invalid move', () => {
      it('throws an error if the game is not in progress', () => {
        expect(() =>
          game.applyMove({
            gameID: game.id,
            playerID: player1.id,
            move: { word: 'test', playerID: player1.id },
          }),
        ).toThrowError(GAME_NOT_IN_PROGRESS_MESSAGE);
      });
      describe('when the game is in progress', () => {
        it('should throw an error if the player is not in the game', () => {
          jest.spyOn(dictionary, 'generateSubstring').mockReturnValue('test');
          jest.spyOn(Math, 'random').mockReturnValue(0);
          game.startGame(player1);
          const playerNotInGame = createPlayerForTesting();
          expect(() =>
            game.applyMove({
              gameID: game.id,
              playerID: playerNotInGame.id,
              move: { word: 'test', playerID: playerNotInGame.id },
            }),
          ).toThrowError(PLAYER_NOT_IN_GAME_MESSAGE);
        });
        describe('when the player is in the game', () => {
          it('should throw an error if the player is not the active player', () => {
            jest.spyOn(dictionary, 'generateSubstring').mockReturnValue('test');
            jest.spyOn(Math, 'random').mockReturnValue(0);
            game.startGame(player1);
            expect(() =>
              game.applyMove({
                gameID: game.id,
                playerID: player2.id,
                move: { word: 'test', playerID: player2.id },
              }),
            ).toThrowError(MOVE_NOT_YOUR_TURN_MESSAGE);
            expect(() =>
              game.applyMove({
                gameID: game.id,
                playerID: player3.id,
                move: { word: 'test', playerID: player3.id },
              }),
            ).toThrowError(MOVE_NOT_YOUR_TURN_MESSAGE);
          });
          it('should not progress the game if the word is not in the dictionary', () => {
            jest.spyOn(dictionary, 'generateSubstring').mockReturnValue('test');
            jest.spyOn(Math, 'random').mockReturnValue(0);
            game.startGame(player1);
            expect(game.state.currentPlayerIndex).toBe(0);
            expect(game.state.currentSubstring).toBe('test');
            game.applyMove({
              gameID: game.id,
              playerID: player1.id,
              move: { word: 'notaword', playerID: player1.id },
            });
            expect(game.state.currentPlayerIndex).toBe(0);
            expect(game.state.currentSubstring).toBe('test');
            expect(game.state.moves).toContainEqual({
              word: 'notaword',
              playerID: player1.id,
              valid: false,
            });
          });
        });
        it('should not progress the game if the word does not contain the substring', () => {
          jest.spyOn(dictionary, 'generateSubstring').mockReturnValue('test');
          jest.spyOn(Math, 'random').mockReturnValue(0);
          game.startGame(player1);
          expect(game.state.currentPlayerIndex).toBe(0);
          expect(game.state.currentSubstring).toBe('test');
          game.applyMove({
            gameID: game.id,
            playerID: player1.id,
            move: { word: 'word', playerID: player1.id },
          });
          expect(game.state.currentPlayerIndex).toBe(0);
          expect(game.state.currentSubstring).toBe('test');
          expect(game.state.moves).toContainEqual({
            word: 'word',
            playerID: player1.id,
            valid: false,
          });
        });
        it('should not progress the game if the word has been submitted before', () => {
          jest.spyOn(dictionary, 'generateSubstring').mockReturnValue('test');
          jest.spyOn(Math, 'random').mockReturnValue(0);
          game.startGame(player1);
          expect(game.state.currentPlayerIndex).toBe(0);
          expect(game.state.currentSubstring).toBe('test');
          jest.spyOn(dictionary, 'generateSubstring').mockReturnValue('sti');
          game.applyMove({
            gameID: game.id,
            playerID: player1.id,
            move: { word: 'testing', playerID: player1.id },
          });
          expect(game.state.currentPlayerIndex).toBe(1);
          expect(game.state.currentSubstring).toBe('sti');
          expect(game.state.moves).toContainEqual({
            word: 'testing',
            playerID: player1.id,
            valid: true,
          });
          game.applyMove({
            gameID: game.id,
            playerID: player2.id,
            move: { word: 'testing', playerID: player2.id },
          });
          expect(game.state.currentPlayerIndex).toBe(1);
          expect(game.state.currentSubstring).toBe('sti');
          expect(game.state.moves).toHaveLength(2);
          expect(game.state.moves).toContainEqual({
            word: 'testing',
            playerID: player2.id,
            valid: false,
          });
        });
      });
    });
  });
});
