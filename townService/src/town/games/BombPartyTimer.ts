/**
 * A timer designed to end turns in a Bomb Party game.
 */
export default class BombPartyTimer {
  // The ID of the timer. Used to cancel the timer.
  private _timerId: NodeJS.Timeout | undefined;

  private _turnLength = 0;

  /**
   * Starts the timer for a player's turn.
   *
   * The provided callback will be executed if the turn is not ended before the turnLength time has passed.
   *
   * @param turnLength the length of the turn in milliseconds
   * @param endTurnCallBack the callback to execute if the turn is not ended before the turnLength time has passed
   */
  public startTurn(turnLength: number, endTurnCallBack: () => void): void {
    if (this._timerId === undefined) {
      this._turnLength = turnLength;
      this._timerId = setTimeout(() => {
        endTurnCallBack();
        this._timerId = undefined;
        this._turnLength = 0;
      }, turnLength);
    }
  }

  /**
   * Ends the current turn without executing the endTurnCallBack.
   */
  public endTurn(): void {
    if (this._timerId !== undefined) {
      clearTimeout(this._timerId);
      this._timerId = undefined;
      this._turnLength = 0;
    }
  }

  /**
   * Returns the length of the current turn.
   */
  public get turnLength(): number {
    return this._turnLength;
  }
}
