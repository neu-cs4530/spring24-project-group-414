import InvalidParametersError, {
  GAME_FULL_MESSAGE,
  GAME_NOT_IN_PROGRESS_MESSAGE,
  GAME_NOT_STARTABLE_MESSAGE,
  GAME_SETTINGS_NOT_MODIFIABLE_MESSAGE,
  GAME_SETTINGS_NOT_VALID_MESSAGE,
  MOVE_NOT_YOUR_TURN_MESSAGE,
  PLAYER_ALREADY_IN_GAME_MESSAGE,
  PLAYER_NOT_GAME_HOST_MESSAGE,
  PLAYER_NOT_IN_GAME_MESSAGE,
} from '../../lib/InvalidParametersError';
import Player from '../../lib/Player';
import {
  BombPartyGameState,
  BombPartyMove,
  BombPartySettings,
  GameInstance,
  GameMove,
  GameSettingsChange,
  PlayerID,
} from '../../types/CoveyTownSocket';
import BombPartyDictionary from './BombPartyDictionary';
import BombPartyTimer from './BombPartyTimer';
import Game from './Game';

/**
 * A BombPartyGame is a Game that implements the rules of the game BombParty.
 */
export default class BombPartyGame extends Game<BombPartyGameState, BombPartyMove> {
  // The maximum number of players that can join the game.
  static readonly MAX_PLAYERS = 8;

  // The minimum number of players required to start the game.
  static readonly MIN_PLAYERS = 2;

  // The timer used to keep track of the time remaining for each player's turn, and ends the turn if the time runs out.
  private _turnTimer: BombPartyTimer;

  // The dictionary used to validate words and generate substrings for the game.
  private _dictionary: BombPartyDictionary;

  // The function used to update the game area when the game state changes due to the timer.
  private _areaUpdateFn: (model: GameInstance<BombPartyGameState>) => void;

  // The max turn length of the current turn. Used for decreasing turn length with consecutive successful turns.
  private _currentTurnLength: number;

  /**
   * Creates a new BombPartyGame.
   */
  public constructor(
    turnTimer: BombPartyTimer,
    dictionary: BombPartyDictionary,
    areaUpdateFn: (model: GameInstance<BombPartyGameState>) => void,
    priorGame?: BombPartyGame,
  ) {
    super({
      moves: [],
      status: 'WAITING_FOR_PLAYERS',
      players: [],
      lives: {},
      points: {},
      currentPlayerIndex: 0,
      currentSubstring: '',
      currentTimeLeft: 0,
      settings: {
        maxLives: 3,
        turnLength: 25000,
        decreasingTurnLength: false,
      },
    });
    this._turnTimer = turnTimer;
    this._dictionary = dictionary;
    this._currentTurnLength = this.state.settings.turnLength;
    if (priorGame) {
      this._changeSettings(priorGame.state.settings);
    }
    this._areaUpdateFn = areaUpdateFn;
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
    if (this.state.players.length >= BombPartyGame.MAX_PLAYERS) {
      throw new InvalidParametersError(GAME_FULL_MESSAGE);
    }
    this.state = {
      ...this.state,
      players: [...this.state.players, player.id],
      lives: {
        ...this.state.lives,
        [player.id]: this.state.settings.maxLives,
      },
      points: {
        ...this.state.points,
        [player.id]: 0,
      },
    };
    if (this.state.players.length >= BombPartyGame.MIN_PLAYERS) {
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
            this.state.players.filter(p => p !== player.id).length >= BombPartyGame.MIN_PLAYERS
              ? 'WAITING_TO_START'
              : 'WAITING_FOR_PLAYERS',
        };
        break;
      case 'IN_PROGRESS':
        // Implement deduction of lives for removed player here, then check if the game is over
        this._decreaseLife(player.id, this.state.settings.maxLives);
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
    const newMove = {
      playerID: move.playerID,
      word: move.move.word,
      valid: undefined,
    };
    this._validateMove(newMove);
    this._applyMove(newMove);
  }

  /**
   * Applies a change to the game settings.
   * The host player can change the game settings before the game starts.
   *
   * Validates the settings, and if they are valid, applies the settings to the game.
   * @param settings The settings to apply to the game
   *
   * @throws InvalidParametersError if the player is not the host player (PLAYER_NOT_GAME_HOST_MESSAGE)
   * @throws InvalidParametersError if the game is not in the WAITING_FOR_PLAYERS or WAITING_TO_START state (GAME_SETTINGS_NOT_MODIFIABLE_MESSAGE)
   * @throws InvalidParametersError if the settings are not valid (GAME_SETTINGS_NOT_VALID_MESSAGE)
   */
  public changeSettings(settings: GameSettingsChange<BombPartySettings>): void {
    if (settings.playerID !== this.state.players[0]) {
      throw new InvalidParametersError(PLAYER_NOT_GAME_HOST_MESSAGE);
    }
    this._changeSettings(settings.settings);
  }

  /**
   * Applies a settings change to the game state.
   * The host player can change the game settings before the game starts.
   *
   * Validates the settings, and if they are valid, applies the settings to the game state.
   * @param settings The settings to apply to the game state
   *
   * @throws InvalidParametersError if the game is not in the WAITING_FOR_PLAYERS or WAITING_TO_START state (GAME_SETTINGS_NOT_MODIFIABLE_MESSAGE)
   * @throws InvalidParametersError if the settings are not valid (GAME_SETTINGS_NOT_VALID_MESSAGE)
   */
  protected _changeSettings(settings: BombPartySettings): void {
    if (this.state.status !== 'WAITING_FOR_PLAYERS' && this.state.status !== 'WAITING_TO_START') {
      throw new InvalidParametersError(GAME_SETTINGS_NOT_MODIFIABLE_MESSAGE);
    }
    if (settings.maxLives < 1 || settings.turnLength < 5000) {
      throw new InvalidParametersError(GAME_SETTINGS_NOT_VALID_MESSAGE);
    }
    this.state = {
      ...this.state,
      settings,
    };
  }

  /**
   * Ensures that the move is valid in the current game state.
   *
   * @param move the move to validate
   */
  protected _validateMove(move: BombPartyMove): void {
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
  protected _applyMove(move: BombPartyMove): void {
    if (
      this._dictionary.validateWord(move.word) &&
      move.word.includes(this.state.currentSubstring)
    ) {
      this._turnTimer.endTurn();
      this._increasePoints(move.playerID, move.word);
      move.valid = true;
      this._dictionary.addWordToHistory(move.word);
      let nextPlayerIndex = (this.state.currentPlayerIndex + 1) % this.state.players.length;
      while (this.state.lives[this.state.players[nextPlayerIndex]] <= 0) {
        nextPlayerIndex = (nextPlayerIndex + 1) % this.state.players.length;
      }
      this.state = {
        ...this.state,
        moves: [...this.state.moves, move],
        currentSubstring: this._dictionary.generateSubstring(),
        currentPlayerIndex: nextPlayerIndex,
      };
      // Start the turn timer
      this._turnTimer.startTurn(
        this.state.settings.decreasingTurnLength
          ? Math.max(this._currentTurnLength - 5000, 5000)
          : this.state.settings.turnLength,
        () => this._endPlayerTurnFailure(this.state.currentPlayerIndex),
        () => {
          this.state = {
            ...this.state,
            currentTimeLeft: this._turnTimer.remainingTime,
          };
          this._areaUpdateFn(this.toModel());
        },
      );
      this._currentTurnLength -= 5000;
    } else {
      move.valid = false;
      this.state = {
        ...this.state,
        moves: [...this.state.moves, move],
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
   * Increment points for a player who has found a successful word
   *
   * @param player - the player who has earned points
   * @param word - the word chosen
   * @param speed - the amount of time remaining
   */
  protected _increasePoints(player: PlayerID, word: string, speed = 0) {
    const pointGain = 10 * word.length + ((speed / this.state.settings.turnLength) % 0.1) * 10;
    this.state.points[player] += pointGain;
  }

  /**
   * Initializes the game state variables.
   *
   * Sets all players to have the maximum number of lives.
   */
  protected _iniializeGame(): void {
    this.state = {
      ...this.state,
      currentPlayerIndex: Math.floor(Math.random() * this.state.players.length),
      currentSubstring: this._dictionary.generateSubstring(),
    };
    this._currentTurnLength = this.state.settings.turnLength;
    // Start the turn timer
    this._turnTimer.startTurn(
      this.state.settings.turnLength,
      () => this._endPlayerTurnFailure(this.state.currentPlayerIndex),
      () => {
        this.state = {
          ...this.state,
          currentTimeLeft: this._turnTimer.remainingTime,
        };
        this._areaUpdateFn(this.toModel());
      },
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
      this._areaUpdateFn(this.toModel());
      return;
    }
    this._turnTimer.endTurn();
    this._currentTurnLength = this.state.settings.turnLength;
    // Find the next alive player
    let nextPlayerIndex = (playerIndex + 1) % this.state.players.length;
    while (this.state.lives[this.state.players[nextPlayerIndex]] <= 0) {
      nextPlayerIndex = (nextPlayerIndex + 1) % this.state.players.length;
    }
    // Select next player without changing the current substring
    this.state = {
      ...this.state,
      currentPlayerIndex: nextPlayerIndex,
    };
    // Start the turn timer
    this._turnTimer.startTurn(
      this.state.settings.turnLength,
      () => this._endPlayerTurnFailure(this.state.currentPlayerIndex),
      () => {
        this.state = {
          ...this.state,
          currentTimeLeft: this._turnTimer.remainingTime,
        };
        this._areaUpdateFn(this.toModel());
      },
    );
    this._areaUpdateFn(this.toModel());
  }
}
