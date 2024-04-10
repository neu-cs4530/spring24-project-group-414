import { ChakraProvider } from '@chakra-ui/react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { mock, mockReset } from 'jest-mock-extended';
import { nanoid } from 'nanoid';
import { act } from 'react-dom/test-utils';
import React from 'react';
import BombPartyAreaController, {
  BombPartySeat,
} from '../../../../classes/interactable/BombPartyAreaController';
import PlayerController from '../../../../classes/PlayerController';
import TownController, * as TownControllerHooks from '../../../../classes/TownController';
import TownControllerContext from '../../../../contexts/TownControllerContext';
import { randomLocation } from '../../../../TestUtils';
import {
  BombPartyGameState,
  BombPartySettings,
  GameArea,
  GameStatus,
} from '../../../../types/CoveyTownSocket';
import PhaserGameArea from '../GameArea';
import BombPartyArea from './BombPartyArea';
import * as BombPartyBoard from './BombPartyBoard';
const mockToast = jest.fn();
jest.mock('@chakra-ui/react', () => {
  const ui = jest.requireActual('@chakra-ui/react');
  const mockUseToast = () => mockToast;
  return {
    ...ui,
    useToast: mockUseToast,
  };
});
const mockGameArea = mock<PhaserGameArea>();
mockGameArea.getData.mockReturnValue('BombParty');
jest.spyOn(TownControllerHooks, 'useInteractable').mockReturnValue(mockGameArea);
const useInteractableAreaControllerSpy = jest.spyOn(
  TownControllerHooks,
  'useInteractableAreaController',
);

const boardComponentSpy = jest.spyOn(BombPartyBoard, 'default');
boardComponentSpy.mockReturnValue(<div data-testid='board' />);
class MockBombPartyAreaController extends BombPartyAreaController {
  mockIsOurTurn = false;

  mockIsPlayer = false;

  mockIsHost = false;

  mockWhoseTurn: PlayerController | undefined = undefined;

  mockCurrentTimeLeft = 25000;

  mockCurrentPrompt = 'can';

  makeMove = jest.fn();

  joinGame = jest.fn();

  startGame = jest.fn();

  mockPlayers: PlayerController[] = [];

  mockWinner: PlayerController | undefined = undefined;

  mockStatus: GameStatus = 'WAITING_TO_START';

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
    return this.mockPlayers;
  }

  getPlayer(seatNumber: BombPartySeat): PlayerController | undefined {
    const item = this.mockPlayers[seatNumber];
    if (item) {
      return item;
    } else {
      return undefined;
    }
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
    return this.mockIsHost;
  }

  get playerIndex(): number {
    throw new Error('Method should not be called within this component');
  }

  get status(): GameStatus {
    return this.mockStatus;
  }

  get settings(): BombPartySettings {
    return {
      maxLives: 3,
      turnLength: 30,
      decreasingTurnLength: true,
    };
  }

  isEmpty(): boolean {
    throw new Error('Method should not be called within this component');
  }

  public isActive(): boolean {
    throw new Error('Method should not be called within this component');
  }

  public getPlayerLives(): number {
    return 3;
  }

  public getPlayerPoints(): number {
    return 100;
  }
}

describe('ConnectFourArea', () => {
  let consoleErrorSpy: jest.SpyInstance<void, [message?: any, ...optionalParms: any[]]>;
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

  let ourPlayer: PlayerController;
  const townController = mock<TownController>();
  Object.defineProperty(townController, 'ourPlayer', { get: () => ourPlayer });
  const gameAreaController = new MockBombPartyAreaController();
  let joinGameReject: (err: Error) => void;
  let startGameReject: (err: Error) => void;

  function renderBombPartyArea() {
    return render(
      <ChakraProvider>
        <TownControllerContext.Provider value={townController}>
          <BombPartyArea interactableID={nanoid()} />
        </TownControllerContext.Provider>
      </ChakraProvider>,
    );
  }

  beforeEach(() => {
    ourPlayer = new PlayerController('player 0', 'player 0', randomLocation());
    mockGameArea.name = nanoid();
    mockReset(townController);
    gameAreaController.mockClear();
    useInteractableAreaControllerSpy.mockReturnValue(gameAreaController);
    mockToast.mockClear();
    gameAreaController.joinGame.mockReset();
    gameAreaController.makeMove.mockReset();

    gameAreaController.joinGame.mockImplementation(
      () =>
        new Promise<void>((resolve, reject) => {
          joinGameReject = reject;
        }),
    );
    gameAreaController.startGame.mockImplementation(
      () =>
        new Promise<void>((resolve, reject) => {
          startGameReject = reject;
        }),
    );
  });
  describe('[T3.1] Game Update Listeners', () => {
    it('Registers exactly one listener for gameUpdated and gameEnd events', () => {
      const addListenerSpy = jest.spyOn(gameAreaController, 'addListener');
      addListenerSpy.mockClear();
      renderBombPartyArea();
      expect(addListenerSpy).toBeCalledTimes(2);
      expect(addListenerSpy).toHaveBeenCalledWith('gameUpdated', expect.any(Function));
      expect(addListenerSpy).toHaveBeenCalledWith('gameEnd', expect.any(Function));
    });
  });
  describe('[T3.2] Join game button', () => {
    it('Is not shown if the game status is IN_PROGRESS', () => {
      gameAreaController.mockStatus = 'IN_PROGRESS';
      renderBombPartyArea();

      gameAreaController.mockIsPlayer = true;
      expect(screen.queryByText('Join New Game')).not.toBeInTheDocument();

      gameAreaController.mockIsPlayer = false;
      expect(screen.queryByText('Join New Game')).not.toBeInTheDocument();
    });

    it('Is not shown if the game status is WAITING_TO_START', () => {
      gameAreaController.mockStatus = 'WAITING_TO_START';
      gameAreaController.mockIsPlayer = true;
      renderBombPartyArea();
      expect(screen.queryByText('Join New Game')).not.toBeInTheDocument();
    });
    it('Is shown if the game status is WAITING_FOR_PLAYERS and the player is not in the game', () => {
      gameAreaController.mockStatus = 'WAITING_FOR_PLAYERS';
      gameAreaController.mockIsPlayer = false;
      renderBombPartyArea();
      expect(screen.queryByText('Join New Game')).toBeInTheDocument();
    });
    it('Is shown if the game status is OVER', () => {
      gameAreaController.mockStatus = 'OVER';
      gameAreaController.mockIsPlayer = false;
      renderBombPartyArea();
      expect(screen.queryByText('Join New Game')).toBeInTheDocument();
    });
    describe('When clicked', () => {
      it('Calls the gameAreaController.joinGame method', () => {
        gameAreaController.mockStatus = 'WAITING_FOR_PLAYERS';
        gameAreaController.mockIsPlayer = false;
        renderBombPartyArea();
        const button = screen.getByText('Join New Game');
        fireEvent.click(button);
        expect(gameAreaController.joinGame).toBeCalled();
      });
      it('Displays a toast with the error message if the joinGame method throws an error', async () => {
        gameAreaController.mockStatus = 'WAITING_FOR_PLAYERS';
        gameAreaController.mockIsPlayer = false;
        renderBombPartyArea();
        const button = screen.getByText('Join New Game');
        fireEvent.click(button);
        expect(gameAreaController.joinGame).toBeCalled();
        const errorMessage = `Testing error message ${nanoid()}`;
        act(() => {
          joinGameReject(new Error(errorMessage));
        });
        await waitFor(() => {
          expect(mockToast).toBeCalledWith(
            expect.objectContaining({
              description: `Error: ${errorMessage}`,
              status: 'error',
            }),
          );
        });
      });
      it('Removes the button after the player has joined the game', () => {
        renderBombPartyArea();
        gameAreaController.mockStatus = 'WAITING_FOR_PLAYERS';
        gameAreaController.mockIsPlayer = false;

        expect(screen.queryByText('Join New Game')).toBeInTheDocument();
        act(() => {
          gameAreaController.mockStatus = 'WAITING_TO_START';
          gameAreaController.mockIsPlayer = true;
          gameAreaController.emit('gameUpdated');
        });
        expect(screen.queryByText('Join New Game')).not.toBeInTheDocument();
      });
    });
  });
  describe('[T3.3] Start game button', () => {
    it('Is not shown if the game status is IN_PROGRESS', () => {
      gameAreaController.mockStatus = 'IN_PROGRESS';
      gameAreaController.mockIsPlayer = true;
      renderBombPartyArea();
      expect(screen.queryByText('Start Game')).not.toBeInTheDocument();
    });
    it('Is not shown if the game status is WAITING_FOR_PLAYERS', () => {
      gameAreaController.mockStatus = 'WAITING_FOR_PLAYERS';
      gameAreaController.mockIsPlayer = true;
      renderBombPartyArea();
      expect(screen.queryByText('Start Game')).not.toBeInTheDocument();
    });

    it('Is not shown if the game status is WAITING_TO_START and the player is not the host', () => {
      gameAreaController.mockStatus = 'WAITING_TO_START';
      gameAreaController.mockIsPlayer = true;
      gameAreaController.mockIsHost = false;
      renderBombPartyArea();
      expect(screen.queryByText('Start Game')).not.toBeInTheDocument();
    });

    it('Is shown if the game status is WAITING_TO_START and the player is the host', () => {
      gameAreaController.mockStatus = 'WAITING_TO_START';
      gameAreaController.mockIsPlayer = true;
      gameAreaController.mockIsHost = true;
      renderBombPartyArea();
      expect(screen.queryByText('Start Game')).toBeInTheDocument();
    });

    describe('When clicked', () => {
      it('Calls the gameAreaController.startGame method', () => {
        gameAreaController.mockStatus = 'WAITING_TO_START';
        gameAreaController.mockIsPlayer = true;
        gameAreaController.mockIsHost = true;
        renderBombPartyArea();
        const button = screen.getByText('Start Game');
        fireEvent.click(button);
        expect(gameAreaController.startGame).toBeCalled();
      });

      it('Displays a toast with the error message if the startGame method throws an error', async () => {
        gameAreaController.mockStatus = 'WAITING_TO_START';
        gameAreaController.mockIsPlayer = true;
        gameAreaController.mockIsHost = true;
        renderBombPartyArea();
        const button = screen.getByText('Start Game');
        fireEvent.click(button);
        expect(gameAreaController.startGame).toBeCalled();
        const errorMessage = `Testing error message ${nanoid()}`;
        act(() => {
          startGameReject(new Error(errorMessage));
        });
        await waitFor(() => {
          expect(mockToast).toBeCalledWith(
            expect.objectContaining({
              description: `Error: ${errorMessage}`,
              status: 'error',
            }),
          );
        });
      });
      it('Adds the button when a game becomes possible to start', () => {
        gameAreaController.mockStatus = 'WAITING_FOR_PLAYERS';
        gameAreaController.mockIsPlayer = true;
        gameAreaController.mockIsHost = true;
        renderBombPartyArea();
        expect(screen.queryByText('Start Game')).not.toBeInTheDocument();
        act(() => {
          gameAreaController.mockStatus = 'WAITING_TO_START';
          gameAreaController.emit('gameUpdated');
        });
        expect(screen.queryByText('Start Game')).toBeInTheDocument();
      });

      it('Removes the button once the game is in progress', () => {
        gameAreaController.mockStatus = 'WAITING_TO_START';
        gameAreaController.mockIsPlayer = true;
        gameAreaController.mockIsHost = true;
        renderBombPartyArea();
        expect(screen.queryByText('Start Game')).toBeInTheDocument();
        act(() => {
          gameAreaController.mockStatus = 'IN_PROGRESS';
          gameAreaController.emit('gameUpdated');
        });
        expect(screen.queryByText('Start Game')).not.toBeInTheDocument();
      });
    });
  });
});
