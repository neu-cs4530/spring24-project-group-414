import InvalidParametersError, {
  GAME_FULL_MESSAGE,
  GAME_NOT_IN_PROGRESS_MESSAGE,
  GAME_NOT_STARTABLE_MESSAGE,
  MOVE_NOT_YOUR_TURN_MESSAGE,
  PLAYER_ALREADY_IN_GAME_MESSAGE,
  PLAYER_NOT_GAME_HOST_MESSAGE,
  PLAYER_NOT_IN_GAME_MESSAGE,
} from '../../lib/InvalidParametersError';
import Player from '../../lib/Player';
import { BombPartyGameState, BombPartyMove, GameMove, PlayerID } from '../../types/CoveyTownSocket';
import BombPartyDictionary from './BombPartyDictionary';
import BombPartyTimer from './BombPartyTimer';
import Game from './Game';

/**
 * A BombPartyGame is a Game that implements the rules of the game BombParty.
 */
export default class BombPartyGame extends Game<BombPartyGameState, BombPartyMove> {
  // The maximum number of players that can join the game.
  MAX_PLAYERS = 8;

  // The minimum number of players required to start the game.
  MIN_PLAYERS = 2;

  // The time limit for each player's turn, in milliseconds.
  private _turnTimeLimit = 25000;

  // The timer used to keep track of the time remaining for each player's turn, and ends the turn if the time runs out.
  private _turnTimer: BombPartyTimer;

  // The dictionary used to validate words and generate substrings for the game.
  private _dictionary: BombPartyDictionary;

  /**
   * Creates a new BombPartyGame.
   */
  public constructor(turnTimer: BombPartyTimer, dictionary: BombPartyDictionary) {
    super({
      moves: [],
      status: 'WAITING_FOR_PLAYERS',
      lives: {},
      players: [],
      currentPlayerIndex: 0,
      currentSubstring: '',
      maxLives: 3,
    });
    this._turnTimer = turnTimer;
    this._dictionary = dictionary;
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
            winner: this.state.players.filter(p => this.state.lives[p] > 0)[0],
          };
        }
        break;
      default:
        // This behavior can be undefined :)
        throw new Error(`Unexpected game status: ${this.state.status}`);
    }
  }

  /**
   * Applies a move to the game.
   * Uses the player's ID to determube which seat the player is in.
   *
   * Validates the move, and if it is valid, applies the move to the game state.
   *
   * If the move is successful, it progresses the game state to the next player's turn.
   * @param move The mopve to attempt to apply
   *
   * @throws InvalidParametersError if the player is not in the game (PLAYER_NOT_IN_GAME_MESSAGE)
   * @throws InvalidParametersError if the game is not in progress (GAME_NOT_IN_PROGRESS_MESSAGE)
   * @throws InvalidParametersError if the move is not the player's turn (MOVE_NOT_YOUR_TURN_MESSAGE)
   */
  public applyMove(move: GameMove<BombPartyMove>): void {
    if (this.state.status !== 'IN_PROGRESS') {
      throw new InvalidParametersError(GAME_NOT_IN_PROGRESS_MESSAGE);
    }
    if (!this.state.players.some(p => p === move.playerID)) {
      throw new InvalidParametersError(PLAYER_NOT_IN_GAME_MESSAGE);
    }
    this._validateMove(move);
    this._applyMove(move);
    throw new Error('Method not implemented.');
  }

  /**
   * Ensures that the move is valid in the current game state.
   *
   * @param move the move to validate
   */
  protected _validateMove(move: GameMove<BombPartyMove>): void {
    if (this.state.players[this.state.currentPlayerIndex] !== move.playerID) {
      throw new InvalidParametersError(MOVE_NOT_YOUR_TURN_MESSAGE);
    }
  }

  /**
   * Applies the move to the game state.
   *
   * If the word is valid and contains the current substring, the word is added to the history of words used in the game,
   * and the turn progresses with a new substring.
   *
   * The turn will not progress if the word is invalid or does not contain the current substring.
   * @param move the move to apply
   */
  protected _applyMove(move: GameMove<BombPartyMove>): void {
    if (
      this._dictionary.validateWord(move.move.word) &&
      move.move.word.includes(this.state.currentSubstring)
    ) {
      this._dictionary.addWordToHistory(move.move.word);
      this.state = {
        ...this.state,
        moves: [...this.state.moves, move.move],
        currentSubstring: this._dictionary.genrateSubstring(),
        currentPlayerIndex: (this.state.currentPlayerIndex + 1) % this.state.players.length,
      };
    }
  }

  /**
   * Decreases the life points of a player to a minimum of 0.
   *
   * @param player the player whose life points will be decreased
   * @param lifeDecrease the amount to decrease the player's life points by
   */
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
  protected _iniializeGame(): void {
    // Initialize lives for all players
    this.state.players.forEach(player => {
      this.state = {
        ...this.state,
        lives: {
          ...this.state.lives,
          [player]: this.state.maxLives,
        },
      };
    });
    // Randomly select the first player
    this.state = {
      ...this.state,
      currentPlayerIndex: Math.floor(Math.random() * (this.state.players.length - 1)),
      currentSubstring: this._dictionary.genrateSubstring(),
    };
    // Start the turn timer
    this._turnTimer.startTurn(this._turnTimeLimit, () =>
      this._endPlayerTurnFailure(this.state.currentPlayerIndex),
    );
  }

  /**
   * Checks if the game is over.
   * @returns returns true if there is only one player left with lives remaining, false otherwise
   */
  protected _isGameOver(): boolean {
    return this.state.players.filter(p => this.state.lives[p] > 0).length <= 1;
  }

  /**
   * Ends the current player's turn as a failure.
   *
   * If this ends the game, the game state is updated to reflect the game being over.
   *
   * The player loses one life, and the next player with more than 0 lives is chosen in order of the player list.
   * @param playerIndex the index of the player who failed their turn
   */
  protected _endPlayerTurnFailure(playerIndex: number): void {
    this._decreaseLife(this.state.players[playerIndex], 1);
    if (this._isGameOver()) {
      this.state = {
        ...this.state,
        status: 'OVER',
        winner: this.state.players.filter(p => this.state.lives[p] > 0)[0],
      };
      return;
    }
    // Select next player without changing the current substring
    this.state = {
      ...this.state,
      currentPlayerIndex: (this.state.currentPlayerIndex + 1) % this.state.players.length,
    };
  }
}
