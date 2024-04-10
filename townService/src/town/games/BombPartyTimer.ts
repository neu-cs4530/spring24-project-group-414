/**
 * A timer designed to end turns in a Bomb Party game.
 */
export default class BombPartyTimer {
  // The ID of the timer for ending the turn.
  private _timeoutTimerId: NodeJS.Timeout | undefined;

  private _intervalTimerId: NodeJS.Timeout | undefined;

  private _turnLength = 0;

  private _remainingTime = 0;

  /**
   * Starts the timer for a player's turn.
   *
   * The provided callback will be executed if the turn is not ended before the turnLength time has passed.
   *
   * @param turnLength the length of the turn in milliseconds
   * @param endTurnCallBack the callback to execute if the turn is not ended before the turnLength time has passed
   * @param tickCallBack the callback to execute every second while the turn is active
   */
  public startTurn(
    turnLength: number,
    endTurnCallBack: () => void,
    tickCallBack: () => void,
  ): void {
    if (this._intervalTimerId === undefined && this._timeoutTimerId === undefined) {
      this._turnLength = turnLength;
      this._remainingTime = turnLength;

      this._timeoutTimerId = setTimeout(() => {
        this.endTurn();
        endTurnCallBack();
        tickCallBack();
      }, turnLength);

      this._intervalTimerId = setInterval(() => {
        this._remainingTime -= 1000;
        tickCallBack();
      }, 1000);
    }
  }

  /**
   * Ends the current turn without executing the endTurnCallBack.
   */
  public endTurn(): void {
    if (this._intervalTimerId !== undefined && this._timeoutTimerId !== undefined) {
      clearTimeout(this._timeoutTimerId);
      clearInterval(this._intervalTimerId);
      this._timeoutTimerId = undefined;
      this._intervalTimerId = undefined;
      this._turnLength = 0;
      this._remainingTime = 0;
    }
  }

  /**
   * Returns the length of the current turn.
   */
  public get turnLength(): number {
    return this._turnLength;
  }

  /**
   * Returns the remaining time in the current turn.
   */
  public get remainingTime(): number {
    return this._remainingTime;
  }
}
