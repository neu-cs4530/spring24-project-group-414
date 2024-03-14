import { error } from 'console';
import InvalidParametersError, {
  GAME_FULL_MESSAGE,
  GAME_NOT_IN_PROGRESS_MESSAGE,
  GAME_NOT_STARTABLE_MESSAGE,
  MOVE_NOT_YOUR_TURN_MESSAGE,
  PLAYER_ALREADY_IN_GAME_MESSAGE,
  PLAYER_NOT_GAME_HOST_MESSAGE,
  PLAYER_NOT_IN_GAME_MESSAGE,
  WORD_ALREADY_USED_MESSAGE,
  WORD_NOT_VALID_MESSAGE,
} from '../../lib/InvalidParametersError';
import Player from '../../lib/Player';
import {
  BombPartyGameState,
  BombPartyMove,
  BombPartySeat,
  GameMove,
  PlayerID,
} from '../../types/CoveyTownSocket';
import Game from './Game';
import DICTIONARY from './dictionary';

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
      status: 'WAITING_FOR_PLAYERS',
      lives: {},
      players: [],
      maxLives: 3,
    });
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
    this._initializeGame();
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
            winner: this.state.players.filter(p => this.state.lives[p] > 0)[0],
          };
        }
        break;
      default:
        // This behavior can be undefined :)
        throw new Error(`Unexpected game status: ${this.state.status}`);
    }
  }

  // Find the last seat behind the current one, which is still alive.
  protected _lastLivingSeat(currentSeat: BombPartySeat): BombPartySeat {
    for (let i = currentSeat + 1; i < this.MAX_PLAYERS; i++) {
      if (this.state.lives[this.state.players[i]] > 0) {
        // Since i < this.MAX_PLAYERS and i > 0, it will always be a BombPartySeat
        return i as BombPartySeat;
      }
    }
    for (let i = currentSeat - 1; i > -1; i--) {
      if (this.state.lives[this.state.players[i]] > 0) {
        // Since i > -1 and i < this.MAX_PLAYERS - 1, it will always be a BombPartySeat
        return i as BombPartySeat;
      }
    }
    throw new Error('No other living players');
  }

  protected _validateMove(move: BombPartyMove): void {
    const currentSeat = move.playerSeat;
    const lastMoveSeat = this.state.moves[this.state.moves.length - 1].playerSeat;
    const lastLivingSeat = this._lastLivingSeat(currentSeat);
    if (lastMoveSeat !== lastLivingSeat) {
      throw new InvalidParametersError(MOVE_NOT_YOUR_TURN_MESSAGE);
    }
    if (!DICTIONARY.includes(move.word)) {
      throw new InvalidParametersError(WORD_NOT_VALID_MESSAGE);
    }
    if (this.state.moves.filter(existingMove => existingMove.word === move.word)) {
      throw new InvalidParametersError(WORD_ALREADY_USED_MESSAGE);
    }
  }

  protected _applyMove(move: BombPartyMove): void {
    const checkForWin = this._isGameOver();
    const newMoves = [...this.state.moves, move];
    const newState: BombPartyGameState = {
      ...this.state,
      moves: newMoves,
    };
    if (checkForWin) {
      newState.status = 'OVER';
      newState.winner = this.state.players[move.playerSeat];
    }
    this.state = newState;
  }

  public applyMove(move: GameMove<BombPartyMove>): void {
    if (this.state.status !== 'IN_PROGRESS') {
      throw new InvalidParametersError(GAME_NOT_IN_PROGRESS_MESSAGE);
    }
    const playerSeat = this.state.players.indexOf(move.playerID);
    if (playerSeat === -1 || move.move.playerSeat !== playerSeat) {
      throw new InvalidParametersError(PLAYER_NOT_IN_GAME_MESSAGE);
    }

    this._validateMove(move.move);
    this._applyMove(move.move);
  }

  protected _decreaseLife(player: PlayerID, lifeDecrease: number): void {
    if (lifeDecrease < 0) {
      throw new Error('Life decrease cannot be negative');
    }
    if (this.state.lives[player] === undefined) {
      throw new InvalidParametersError(PLAYER_NOT_IN_GAME_MESSAGE);
    }
    this.state = {
      ...this.state,
      lives: {
        ...this.state.lives,
        [player]: Math.max(this.state.lives[player] - lifeDecrease, 0),
      },
    };
  }

  /**
   * Initializes the game state variables.
   *
   * Sets all players to have the maximum number of lives.
   */
  protected _initializeGame(): void {
    this.state.players.forEach(player => {
      this.state = {
        ...this.state,
        lives: {
          ...this.state.lives,
          [player]: this.state.maxLives,
        },
      };
    });
  }

  /**
   * Checks if the game is over.
   * @returns returns true if there is only one player left with lives remaining, false otherwise
   */
  protected _isGameOver(): boolean {
    return this.state.players.filter(p => this.state.lives[p] > 0).length <= 1;
  }
}
