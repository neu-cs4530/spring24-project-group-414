import { Center, chakra, Image, Container, Input, VStack } from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import BombPartyAreaController from '../../../../classes/interactable/BombPartyAreaController';
export type BombPartyGameProps = {
  gameAreaController: BombPartyAreaController;
};

/**
 * A component that will render the BombPartyBoard, styled
 */
const StyledBombPartyBoard = chakra(Container, {
  baseStyle: {
    width: '500px',
    height: '400px',
    minW: 'full',
    border: 'solid',
    borderWidth: '5px',
    borderRadius: '5px',
  },
});

/**
 * A component that renders the Bombparty board
 *
 * Renders the Bombparty board as a "StyledBombPartyBoard", which consists of a display showing the current players turn,
 * an input box to make guesses, and a timer to show the current time left. This box will be outlined in black for the player whose turn it is currently.
 *
 * The board is re-rendered whenever the board changes.
 *
 * If the current player is in the game and it is their turn, the input box is enabled and the player may make guesses. If it is not the current player's turn, then the Input element will be disabled
 *
 * @param gameAreaController the controller for the BombPartyGame
 */
export default function BombPartyBoard({ gameAreaController }: BombPartyGameProps): JSX.Element {
  const [whoseTurnText, setWhoseTurnText] = useState(gameAreaController.whoseTurn?.userName);
  const [currentPromptText, setCurrentPromptText] = useState(gameAreaController.currentPrompt);
  const [attemptText] = useState('');
  const [inputText, setinputText] = useState('');

  useEffect(() => {
    const updateBoardState = () => {
      setWhoseTurnText(gameAreaController.whoseTurn?.userName);
      setCurrentPromptText(gameAreaController.currentPrompt);
    };
    gameAreaController.addListener('gameUpdated', updateBoardState);
    gameAreaController.addListener('turnChanged', updateBoardState);
    return () => {
      gameAreaController.removeListener('gameUpdated', updateBoardState);
      gameAreaController.removeListener('turnChanged', updateBoardState);
    };
  }, [gameAreaController]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setinputText(event.currentTarget.value);
  };

  const handleKeyPress = async (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      try {
        setinputText('');
        await gameAreaController.makeMove(inputText);
        return '';
      } catch ({ name, message }) {
        return message;
      }
    }
  };

  const promptStyles: React.CSSProperties = {
    position: 'static',
    right: 0,
    bottom: '2px',
    padding: '2px',
    fontFamily: 'sans-serif',
    fontSize: '36px',
    textAlign: 'center',
  };

  return (
    <StyledBombPartyBoard borderColor={gameAreaController.isOurTurn ? 'black' : 'white'}>
      <Center>
        <VStack>
          <h1>{whoseTurnText}&apos;s turn</h1>
          <p>
            <span style={promptStyles}>{currentPromptText}</span>
          </p>
          <Input
            value={inputText}
            onChange={handleChange}
            onKeyPress={handleKeyPress}
            isDisabled={!gameAreaController.isOurTurn}
            textColor='black'
          />
          <p>{attemptText}</p>
          <Image padding='20px' boxSize='120px' src='/assets/bomb2.gif' />
          <p>{(gameAreaController.currentTimeLeft ?? 0) / 1000}s</p>
        </VStack>
      </Center>
    </StyledBombPartyBoard>
  );
}
