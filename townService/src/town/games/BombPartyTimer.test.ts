import BombPartyTimer from './BombPartyTimer';

jest.useFakeTimers();

describe('BombPartyTimer', () => {
  let timer: BombPartyTimer;
  let endTurnCallback: jest.Mock<void, []>;
  let tickCallback: jest.Mock<void, []>;

  beforeEach(() => {
    timer = new BombPartyTimer();
    endTurnCallback = jest.fn();
    tickCallback = jest.fn();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.clearAllMocks();
  });

  describe('startTurn', () => {
    it('should start the turn and call the endTurnCallBack after the specified time', () => {
      timer.startTurn(1000, endTurnCallback, tickCallback);
      jest.advanceTimersByTime(1000);
      expect(endTurnCallback).toHaveBeenCalled();
    });

    it('should not call the endTurnCallBack if turn is ended prematurely', () => {
      timer.startTurn(1000, endTurnCallback, tickCallback);
      timer.endTurn();
      jest.advanceTimersByTime(1000);
      expect(endTurnCallback).not.toHaveBeenCalled();
    });

    it('should not start the turn if there is already a turn in progress', () => {
      timer.startTurn(1000, endTurnCallback, tickCallback);
      const secondEndTurnCallback = jest.fn();
      timer.startTurn(1000, secondEndTurnCallback, tickCallback);
      jest.advanceTimersByTime(1000);
      expect(secondEndTurnCallback).not.toHaveBeenCalled();
    });
    it('should start after being stopped and started again', () => {
      timer.startTurn(1000, endTurnCallback, tickCallback);
      timer.endTurn();
      timer.startTurn(1000, endTurnCallback, tickCallback);
      jest.advanceTimersByTime(1000);
      expect(endTurnCallback).toHaveBeenCalled();
    });
    it('should call the tickCallBack every second while the turn is active', () => {
      timer.startTurn(3000, endTurnCallback, tickCallback);
      jest.advanceTimersByTime(1000);
      expect(tickCallback).toHaveBeenCalledTimes(1);
      jest.advanceTimersByTime(2001);
      expect(tickCallback).toHaveBeenCalledTimes(3);
    });
    it('should start after timing out and started again', () => {
      timer.startTurn(1000, endTurnCallback, tickCallback);
      jest.advanceTimersByTime(1001);
      expect(endTurnCallback).toHaveBeenCalled();
      timer.startTurn(1000, endTurnCallback, tickCallback);
      jest.advanceTimersByTime(1001);
      expect(endTurnCallback).toHaveBeenCalledTimes(2);
    });
  });

  describe('endTurn', () => {
    it('should end the current turn', () => {
      timer.startTurn(1000, endTurnCallback, tickCallback);
      timer.endTurn();
      jest.advanceTimersByTime(1000);
      expect(endTurnCallback).not.toHaveBeenCalled();
    });
  });

  describe('turnLength', () => {
    it('should return the length of the current turn', () => {
      timer.startTurn(1000, endTurnCallback, tickCallback);
      expect(timer.turnLength).toBe(1000);
    });

    it('should return 0 if there is no turn in progress', () => {
      expect(timer.turnLength).toBe(0);
    });
  });

  describe('remainingTime', () => {
    it('should return the remaining time in the current turn', () => {
      timer.startTurn(3000, endTurnCallback, tickCallback);
      jest.advanceTimersByTime(1000);
      expect(timer.remainingTime).toBe(2000);
      jest.advanceTimersByTime(1000);
      expect(timer.remainingTime).toBe(1000);
    });

    it('should return 0 if turn has ended or not started', () => {
      expect(timer.remainingTime).toBe(0);
      timer.startTurn(1000, endTurnCallback, tickCallback);
      jest.advanceTimersByTime(1000);
      expect(timer.remainingTime).toBe(0);
    });
  });
});
