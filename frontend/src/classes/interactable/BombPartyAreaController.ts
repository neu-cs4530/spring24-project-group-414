import {
  BombPartyGameState,
  BombPartyMove,
  BombPartySettings,
  GameArea,
  GameStatus,
  PlayerID,
} from '../../types/CoveyTownSocket';
import PlayerController from '../PlayerController';
import GameAreaController, {
  GameEventTypes,
  NO_GAME_IN_PROGRESS_ERROR,
  NO_GAME_STARTABLE,
  PLAYER_NOT_IN_GAME_ERROR,
} from './GameAreaController';

export type BombPartyEvents = GameEventTypes & {
  turnChanged: (isOurTurn: boolean) => void;
  timerChanged: (secondsLeft: number) => void;
};

export default class BombPartyAreaController extends GameAreaController<
  BombPartyGameState,
  BombPartyEvents
> {
  /**
   * Returns the list of players in the game.
   */
  get players(): PlayerController[] {
    const players = this._model.game?.state.players;
    if (players && players.length > 0) {
      return players.map(
        playerId =>
          this.occupants.find(eachOccupant => eachOccupant.id === playerId) as PlayerController,
      );
    }
    return [];
  }

  get playerID(): string {
    return this._townController.ourPlayer.id;
  }

  /**
   * Returns the player who won the game, if there is one, or undefined otherwise
   */
  get winner(): PlayerController | undefined {
    const winner = this._model.game?.state.winner;
    if (winner) {
      return this.occupants.find(eachOccupant => eachOccupant.id === winner);
    }
    return undefined;
  }

  /**
   * Returns the number of valid moves that have been made in the game
   */
  get moveCount(): number {
    return this._model.game?.state.moves.filter(m => m.valid).length || 0;
  }

  /**
   * Returns true if it is our turn to make a move, false otherwise
   */
  get isOurTurn(): boolean {
    return this.whoseTurn?.id === this._townController.ourPlayer.id;
  }

  /**
   * Returns true if our player is in the game, false otherwise
   */
  get isPlayer(): boolean {
    return this._model.game?.state.players.includes(this._townController.ourPlayer.id) ?? false;
  }

  /**
   * Returns true if our player is the host of the game
   */
  get isHost(): boolean {
    return this.players[0] === this._townController.ourPlayer
  }

  /**
   * Returns the number of the current player's index in the game
   * @throws an error with message PLAYER_NOT_IN_GAME_ERROR if the current player is not in the game
   */
  get playerIndex(): number {
    const playerIndex = this._model.game?.state.players.indexOf(this._townController.ourPlayer.id);
    if (playerIndex) {
      return playerIndex;
    }
    throw new Error(PLAYER_NOT_IN_GAME_ERROR);
  }

  /**
   * Returns the status of the game
   * If there is no game, returns 'WAITING_FOR_PLAYERS'
   */
  get status(): GameStatus {
    const status = this._model.game?.state.status;
    if (!status) {
      return 'WAITING_FOR_PLAYERS';
    }
    return status;
  }
  /**
   * returns the settings data 
   */
  get settings(): BombPartySettings {
    if (!this._model.game) {
      throw new Error(NO_GAME_IN_PROGRESS_ERROR)
    }
    return this._model.game?.state.settings
  }


  /**
   * Returns the player whose turn it is, if the game is in progress
   * Returns undefined if the game is not in progress
   */
  get whoseTurn(): PlayerController | undefined {
    if (!this._model.game || this._model.game?.state.status !== 'IN_PROGRESS') {
      return undefined;
    }
    const playerID = this._model.game.state.players[this._model.game.state.currentPlayerIndex];
    return this.occupants.find(eachOccupant => eachOccupant.id === playerID);
  }

  /**
   * Gets the current substring prompt for the player to complete with a word
   */
  get currentPrompt(): string | undefined {
    if (!this._model.game || this._model.game?.state.status !== 'IN_PROGRESS') {
      return undefined;
    }
    return this._model.game.state.currentSubstring;
  }

  get currentTimeLeft(): number | undefined {
    if (!this._model.game || this._model.game?.state.status !== 'IN_PROGRESS') {
      return undefined;
    }
    return this._model.game.state.currentTimeLeft;
  }

  /**
   * Returns true if the game is empty - no players AND no occupants in the area
   *
   */
  isEmpty(): boolean {
    return this.players.length === 0 && this.occupants.length === 0;
  }

  /**
   * Returns true if the game is not empty and the game is not waiting for players
   */
  public isActive(): boolean {
    return !this.isEmpty() && this.status !== 'WAITING_FOR_PLAYERS';
  }

  /**
   * Returns the number of lives for a given player
   */
  public getPlayerLives(playerID: PlayerID): number {
    return this._model.game?.state.lives[playerID] ?? 0;
  }

  /**
   * Updates the internal state of this BombPartyAreaController based on the new model.
   *
   * Calls super._updateFrom, which updates the occupants of this game area and other
   * common properties (including this._model)
   *
   * If the turn has changed, emits a turnChanged event with the new turn (true if our turn, false otherwise)
   * If the turn has not changed, does not emit a turnChanged event.
   */
  protected _updateFrom(newModel: GameArea<BombPartyGameState>): void {
    const wasOurTurn = this.isOurTurn;
    super._updateFrom(newModel);
    const isOurTurn = this.isOurTurn;
    if (wasOurTurn !== isOurTurn) this.emit('turnChanged', isOurTurn);
  }

  /**
   * Sends a request to the server to start the game.
   *
   * If the game is not in the WAITING_TO_START state, throws an error.
   *
   * @throws an error with message NO_GAME_STARTABLE if there is no game waiting to start
   */
  public async startGame(): Promise<void> {
    const instanceID = this._instanceID;
    if (!instanceID || this._model.game?.state.status !== 'WAITING_TO_START') {
      throw new Error(NO_GAME_STARTABLE);
    }
    await this._townController.sendInteractableCommand(this.id, {
      gameID: instanceID,
      type: 'StartGame',
    });
    this.emit('gameStart');
  }

  /**
   * Sends a request to the server to submit this player's given word.
   * Does not check if the word is valid.
   *
   * @throws an error with message NO_GAME_IN_PROGRESS_ERROR if there is no game in progress
   *
   * @param word The word to submit
   */
  public async makeMove(word: string): Promise<void> {
    const instanceID = this._instanceID;
    if (!instanceID || this._model.game?.state.status !== 'IN_PROGRESS') {
      throw new Error(NO_GAME_IN_PROGRESS_ERROR);
    }
    const move: BombPartyMove = {
      playerID: this._townController.ourPlayer.id,
      word,
    };
    await this._townController.sendInteractableCommand(this.id, {
      gameID: instanceID,
      type: 'GameMove',
      move,
    });
    this.emit('gameUpdated');
  }
}
