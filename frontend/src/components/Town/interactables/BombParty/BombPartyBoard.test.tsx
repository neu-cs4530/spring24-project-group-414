import { mock } from 'jest-mock-extended';
import { nanoid } from 'nanoid';
import BombPartyAreaController from '../../../../classes/interactable/BombPartyAreaController';
import TownController from '../../../../classes/TownController';
import { BombPartyGameState } from '../../../../types/CoveyTownSocket';
import BombPartyBoard from './BombPartyBoard';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import PlayerController from '../../../../classes/PlayerController';
import { GameArea, GameStatus, BombPartySettings } from '../../../../types/CoveyTownSocket';
import { act } from 'react-dom/test-utils';

const mockToast = jest.fn();
jest.mock('@chakra-ui/react', () => {
  const ui = jest.requireActual('@chakra-ui/react');
  const mockUseToast = () => mockToast;
  return {
    ...ui,
    useToast: mockUseToast,
  };
});
class MockBombPartyAreaController extends BombPartyAreaController {
  mockIsOurTurn = false;

  mockIsPlayer = false;

  mockWhoseTurn = undefined;

  mockCurrentTimeLeft = 25000;

  mockCurrentPrompt = 'can';

  makeMove = jest.fn();

  public constructor() {
    super(nanoid(), mock<GameArea<BombPartyGameState>>(), mock<TownController>());
    this.mockClear();
  }

  get isOurTurn() {
    return this.mockIsOurTurn;
  }

  get isPlayer() {
    return this.mockIsPlayer;
  }

  get whoseTurn() {
    return this.mockWhoseTurn;
  }

  get currentPrompt(): string | undefined {
    return this.mockCurrentPrompt;
  }

  get currentTimeLeft() {
    return this.mockCurrentTimeLeft;
  }

  mockClear() {
    //TODO
    this.makeMove.mockClear();
  }

  //throw new Error('Method should not be called within this component');
  get players(): PlayerController[] {
    throw new Error('Method should not be called within this component');
  }

  getPlayer(): PlayerController {
    throw new Error('Method should not be called within this component');
  }

  get playerID(): string {
    throw new Error('Method should not be called within this component');
  }

  get winner(): PlayerController {
    throw new Error('Method should not be called within this component');
  }

  get moveCount(): number {
    throw new Error('Method should not be called within this component');
  }

  get isHost(): boolean {
    throw new Error('Method should not be called within this component');
  }

  get playerIndex(): number {
    throw new Error('Method should not be called within this component');
  }

  get status(): GameStatus {
    throw new Error('Method should not be called within this component');
  }

  get settings(): BombPartySettings {
    throw new Error('Method should not be called within this component');
  }

  isEmpty(): boolean {
    throw new Error('Method should not be called within this component');
  }

  public isActive(): boolean {
    throw new Error('Method should not be called within this component');
  }

  public getPlayerLives(playerID: string): number {
    throw new Error('Method should not be called within this component');
  }

  public getPlayerPoints(playerID: string): number {
    throw new Error('Method should not be called within this component');
  }
}

//No other method should be callable

describe('BombPartyBoard', () => {
  // Spy on console.error and intercept react key warnings to fail test
  let consoleErrorSpy: jest.SpyInstance<void, [message?: any, ...optionalParams: any[]]>;
  beforeAll(() => {
    // Spy on console.error and intercept react key warnings to fail test
    consoleErrorSpy = jest.spyOn(global.console, 'error');
    consoleErrorSpy.mockImplementation((message?, ...optionalParams) => {
      const stringMessage = message as string;
      if (stringMessage.includes && stringMessage.includes('children with the same key,')) {
        throw new Error(stringMessage.replace('%s', optionalParams[0]));
      } else if (stringMessage.includes && stringMessage.includes('warning-keys')) {
        throw new Error(stringMessage.replace('%s', optionalParams[0]));
      }
      // eslint-disable-next-line no-console -- we are wrapping the console with a spy to find react warnings
      console.warn(message, ...optionalParams);
    });
  });
  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });
  const gameAreaController = new MockBombPartyAreaController();
  beforeEach(() => {
    gameAreaController.mockClear();
    mockToast.mockClear();
  });
  async function checkBoard({
    inputEnabled,
    checkMakeMove,
    checkToast,
  }: {
    inputEnabled?: boolean;
    checkMakeMove?: boolean;
    checkToast?: boolean;
  }) {
    const textBoxes = screen.getAllByRole('textbox');
    expect(textBoxes.length).toBe(1);
    const inputBox = textBoxes[0];
    if (inputEnabled) {
      expect(inputBox).toHaveDisplayValue('');
      expect(inputBox).toBeEnabled();
      fireEvent.change(inputBox, { target: { value: 'testing' } });
      expect(inputBox).toHaveDisplayValue('testing');
    } else {
      expect(inputBox).toBeDisabled();
      fireEvent.change(inputBox, { target: { value: '' } });
      fireEvent.keyPress(inputBox, { key: 'A', code: 'KeyA' });
      expect(inputBox).toHaveDisplayValue('');
      expect(gameAreaController.makeMove).not.toHaveBeenCalled();
    }
    /*
    if (checkMakeMove) {
      console.log('Currently focused element:', document.activeElement);

      expect(inputBox).toBeEnabled();
      fireEvent.change(inputBox, { target: { value: 'cans' } }); // Set the value to 'cans' before key press
      inputBox.focus();
      console.log('Currently focused element:', document.activeElement);

      expect(inputBox).toHaveFocus();

      inputBox.addEventListener('keypress', function (event) {
        console.log('Key pressed:', event.key);
      });

      console.log('Before key press event');
      await fireEvent.keyPress(inputBox, { key: 'Enter', code: 'Enter' });
      console.log('After key press event');

      expect(gameAreaController.makeMove).toHaveBeenCalledWith('cans'); // Ensure makeMove is called with the correct value
      expect(gameAreaController.makeMove).toHaveBeenCalled(); // Check if makeMove was called
    }*/

    gameAreaController.makeMove.mockClear();
  }

  describe('When playing a game', () => {
    beforeEach(() => {
      gameAreaController.mockIsOurTurn = true;
      gameAreaController.mockIsPlayer = true;
    });
    it('enables the input box when it is our turn', async () => {
      render(<BombPartyBoard gameAreaController={gameAreaController} />);
      await checkBoard({ inputEnabled: true });
      gameAreaController.mockIsOurTurn = false;
    });
    it('disables the input box when it is not our turn', async () => {
      gameAreaController.mockIsOurTurn = false;
      gameAreaController.mockIsPlayer = true;
      render(<BombPartyBoard gameAreaController={gameAreaController} />);
      await checkBoard({ inputEnabled: false });
    });
    /*
    it('changes the turn when a prompt is correctly answered', async () => {
      render(<BombPartyBoard gameAreaController={gameAreaController} />);
      await checkBoard({ inputEnabled: true, checkMakeMove: true });
    });
    */
  });
});
