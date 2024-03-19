import InvalidParametersError, {
  GAME_FULL_MESSAGE,
  GAME_NOT_STARTABLE_MESSAGE,
  PLAYER_ALREADY_IN_GAME_MESSAGE,
  PLAYER_NOT_GAME_HOST_MESSAGE,
  PLAYER_NOT_IN_GAME_MESSAGE,
} from '../../lib/InvalidParametersError';
import Player from '../../lib/Player';
import {
  BombPartyGameState,
  BombPartyMove,
  GameMove,
  PlayerID,
  BombPartyWordMap,
  BombPartyStats,
} from '../../types/CoveyTownSocket';
import Game from './Game';
import * as fs from 'fs';
import * as path from 'path';

/**
 * A BombPartyGame is a Game that implements the rules of the game BombParty.
 */
export default class BombPartyGame extends Game<BombPartyGameState, BombPartyMove> {
  MAX_PLAYERS = 8;

  MIN_PLAYERS = 2;

  /**
   * Creates a new BombPartyGame.
   */
  constructor() {
    super({
      moves: [],
      currentPrompt: '',
      status: 'WAITING_FOR_PLAYERS',
      players: [],
      playerStats: {},
      wordsDict: BombPartyGame._getEnglishWordsDictFromJSON(),
      maxLives: 3,
    });
  }

  // gets the english dictionary from the JSON file
  // (credit to https://github.com/dwyl/english-words/blob/master/words_dictionary.json)
  static _getEnglishWordsDictFromJSON(): BombPartyWordMap {
    const jsonData = fs.readFileSync(
      path.join(path.resolve(), 'src/town/games/data/words_dictionary.json'),
      'utf-8',
    );
    const parsedData = JSON.parse(jsonData);
    return parsedData;
  }

  /**
   * Indicates that the host player is ready to start the game.
   *
   * Updates the game state to indicate that the host player is ready to start the game.
   *
   * If the player is the host player, and the player count meets the minimum player count, the game will start.
   *
   * @throws InvalidParametersError if the game is not in the WAITING_TO_START state (GAME_NOT_STARTABLE_MESSAGE)
   * @throws InvalidParametersError if the player is not in the game (PLAYER_NOT_IN_GAME_MESSAGE)
   * @throws InvalidParametersError if the player is not the host player. (PLAYER_NOT_GAME_HOST_MESSAGE)
   *
   * @param player the player who is ready to start the game
   */
  public startGame(player: Player): void {
    if (this.state.status !== 'WAITING_TO_START') {
      throw new InvalidParametersError(GAME_NOT_STARTABLE_MESSAGE);
    }
    if (!this.state.players.some(p => p === player.id)) {
      throw new InvalidParametersError(PLAYER_NOT_IN_GAME_MESSAGE);
    }
    if (this.state.players[0] !== player.id) {
      throw new InvalidParametersError(PLAYER_NOT_GAME_HOST_MESSAGE);
    }
    this.state = {
      ...this.state,
      status: 'IN_PROGRESS',
    };
    this._iniializeGame();
  }

  /**
   * Joins a player to the game.
   * - Assigns the player to the first available seat.
   * - If at least 2 players are now assigned, update the game state to WAITING_TO_START.
   *
   * @throws InvalidParametersError if the player is already in the game (PLAYER_ALREADY_IN_GAME_MESSAGE)
   * @throws InvalidParametersError if the game is full (GAME_FULL_MESSAGE)
   *
   * @param player the player to join the game
   */
  protected _join(player: Player): void {
    if (this.state.players.some(p => p === player.id)) {
      throw new InvalidParametersError(PLAYER_ALREADY_IN_GAME_MESSAGE);
    }
    if (this.state.players.length >= this.MAX_PLAYERS) {
      throw new InvalidParametersError(GAME_FULL_MESSAGE);
    }
    this.state = {
      ...this.state,
      players: [...this.state.players, player.id],
    };
    if (this.state.players.length >= this.MIN_PLAYERS) {
      this.state = {
        ...this.state,
        status: 'WAITING_TO_START',
      };
    }
  }

  /**
   * Removes a player from the game.
   * Updates the game's state to reflect the player leaving.
   *
   * If the game is in progress, the player's life count will be set to 0, and the game will end if there is only one player left.
   *
   * If the player count drops below the minimum player count, the game will return to the WAITING_FOR_PLAYERS state.
   *
   * If the game state is currently "WAITING_FOR_PLAYERS" or "OVER", the game state is unchanged.
   *
   * @param player The player to remove from the game
   * @throws InvalidParametersError if the player is not in the game (PLAYER_NOT_IN_GAME_MESSAGE)
   */
  protected _leave(player: Player): void {
    if (this.state.status === 'OVER') {
      return;
    }
    if (!this.state.players.some(p => p === player.id)) {
      throw new InvalidParametersError(PLAYER_NOT_IN_GAME_MESSAGE);
    }
    switch (this.state.status) {
      case 'WAITING_TO_START':
      case 'WAITING_FOR_PLAYERS':
        this.state = {
          ...this.state,
          players: this.state.players.filter(p => p !== player.id),
          status:
            this.state.players.filter(p => p !== player.id).length >= this.MIN_PLAYERS
              ? 'WAITING_TO_START'
              : 'WAITING_FOR_PLAYERS',
        };
        break;
      case 'IN_PROGRESS':
        // Implement deduction of lives for removed player here, then check if the game is over
        this._decreaseLife(player.id, this.state.maxLives);
        if (this._isGameOver()) {
          this.state = {
            ...this.state,
            status: 'OVER',
            winner: this.state.players.filter(p => this.state.playerStats[p].lives > 0)[0],
          };
        }
        break;
      default:
        // This behavior can be undefined :)
        throw new Error(`Unexpected game status: ${this.state.status}`);
    }
  }

  // checks if the word is valid english word, and if it includes the prompt
  protected _wordIsValid(word: string): boolean {
    // if (!this.state.wordsDict) throw new Error('No dictionary defined');
    if (this.state.wordsDict[word]) return false;
    if (!word.includes(this.state.currentPrompt)) return false;
    return true;
  }

  // randomly generates a prompt string for the player to complete
  protected _getPrompt(): string {
    const alph: string = 'abcdefghijklmnopqrstuvwxyz';
    const twoChar = Math.random() < 0.5;
    if (twoChar) {
      return (
        alph.charAt(Math.floor(Math.random() * 26)) + alph.charAt(Math.floor(Math.random() * 26))
      );
    } else {
      // three chars
      return (
        alph.charAt(Math.floor(Math.random() * 26)) +
        alph.charAt(Math.floor(Math.random() * 26)) +
        alph.charAt(Math.floor(Math.random() * 26))
      );
    }
  }

  protected _isPlayerTurn(move: GameMove<BombPartyMove>): boolean {
    return this.state.moves.length % this._players.length == move.move.playerSeat;
  }

  protected _validateMove(move: GameMove<BombPartyMove>): void {
    if (!this._isPlayerTurn(move)) {
      throw new Error('Invalid turn order!');
    }
    if (move.move.word.length < 1) {
      throw new Error('Empty move entry');
    }
  }

  public applyMove(move: GameMove<BombPartyMove>): void {
    // throw new Error('Not Implemented');
    // prototype:

    this._validateMove(move);
    if (this._wordIsValid(move.move.word)) {
        // increment current player
        // add some points
    } else {
        // decrease lives
    }
  }

  protected _decreaseLife(player: PlayerID, lifeDecrease: number): void {
    if (lifeDecrease < 0) {
      throw new Error('Life decrease cannot be negative');
    }
    if (this.state.playerStats[player] === undefined) {
      throw new InvalidParametersError(PLAYER_NOT_IN_GAME_MESSAGE);
    }
    this.state = {
      ...this.state,
      playerStats: {
        ...this.state.playerStats,
        [player]: {
          lives: Math.max(this.state.playerStats[player].lives - lifeDecrease, 0),
          points: this.state.playerStats[player].points,
        },
      },
    };
  }

  /**
   * Initializes the game state variables.
   *
   * Sets all players to have the maximum number of lives.
   */
  protected _iniializeGame(): void {
    this.state.players.forEach(player => {
      this.state = {
        ...this.state,
        playerStats: {
          ...this.state.playerStats,
          [player]: { lives: this.state.maxLives, points: 0 },
        },
      };
    });
  }

  /**
   * Checks if the game is over.
   * @returns returns true if there is only one player left with lives remaining, false otherwise
   */
  protected _isGameOver(): boolean {
    return this.state.players.filter(p => this.state.playerStats[p].lives > 0).length <= 1;
  }
}
