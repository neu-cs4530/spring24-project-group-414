import BombPartyTimer from './BombPartyTimer';

jest.useFakeTimers();

describe('BombPartyTimer', () => {
  let timer: BombPartyTimer;
  let endTurnCallback: jest.Mock<void, []>;

  beforeEach(() => {
    timer = new BombPartyTimer();
    endTurnCallback = jest.fn();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.clearAllMocks();
  });

  describe('startTurn', () => {
    it('should start the turn and call the endTurnCallBack after the specified time', () => {
      timer.startTurn(500, endTurnCallback);
      jest.runAllTimers();
      expect(endTurnCallback).toHaveBeenCalled();
    });

    it('should not call the endTurnCallBack if turn is ended prematurely', () => {
      timer.startTurn(500, endTurnCallback);
      timer.endTurn();
      jest.runAllTimers();
      expect(endTurnCallback).not.toHaveBeenCalled();
    });

    it('should not start the turn if there is already a turn in progress', () => {
      timer.startTurn(500, endTurnCallback);
      const secondEndTurnCallback = jest.fn();
      timer.startTurn(500, secondEndTurnCallback);
      jest.runAllTimers();
      expect(secondEndTurnCallback).not.toHaveBeenCalled();
    });
  });

  describe('endTurn', () => {
    it('should end the current turn', () => {
      timer.startTurn(500, endTurnCallback);
      timer.endTurn();
      jest.runAllTimers();
      expect(endTurnCallback).not.toHaveBeenCalled();
    });
  });

  describe('turnLength', () => {
    it('should return the length of the current turn', () => {
      timer.startTurn(1000, endTurnCallback);
      expect(timer.turnLength).toBe(1000);
    });

    it('should return 0 if there is no turn in progress', () => {
      expect(timer.turnLength).toBe(0);
    });
  });
});
