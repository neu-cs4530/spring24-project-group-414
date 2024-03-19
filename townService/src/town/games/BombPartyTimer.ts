export default class BombPartyTimer {
  private _timerId: NodeJS.Timeout | undefined;

  private _turnLength = 0;

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

  public endTurn(): void {
    if (this._timerId !== undefined) {
      clearTimeout(this._timerId);
      this._timerId = undefined;
      this._turnLength = 0;
    }
  }

  public get turnLength(): number {
    return this._turnLength;
  }
}
