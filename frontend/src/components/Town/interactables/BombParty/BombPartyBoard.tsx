import { Center, chakra, Image, Container, Input, VStack } from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import BombPartyAreaController from '../../../../classes/interactable/BombPartyAreaController';
import { BombPartyMove } from '../../../../types/CoveyTownSocket';
export type BombPartyGameProps = {
  gameAreaController: BombPartyAreaController;
};

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

// type PlayerColors = 'orange' | 'lightblue' | 'green' | 'purple' | 'yellow'

export default function BombPartyBoard({ gameAreaController }: BombPartyGameProps): JSX.Element {
  const [whoseTurnText, setWhoseTurnText] = useState(gameAreaController.whoseTurn?.userName);
  const [currentPromptText, setCurrentPromptText] = useState(gameAreaController.currentPrompt);
  const [attemptText, setAttemptText] = useState('');
  const [inputText, setinputText] = useState('');

  useEffect(() => {
    const updateBoardState = () => {
      setWhoseTurnText(gameAreaController.whoseTurn?.userName);
      setCurrentPromptText(gameAreaController.currentPrompt);
    };
    const displayAttemptText = (move: BombPartyMove) => {
      setAttemptText(move.word);
    };
    gameAreaController.addListener('stateUpdated', updateBoardState);
    gameAreaController.addListener('turnChanged', updateBoardState);
    // gameAreaController.addListener('moveAttempt', (move: BombPartyMove) => console.log(`move attempt: ${move}`));
    return () => {
      gameAreaController.removeListener('stateUpdated', updateBoardState);
      gameAreaController.removeListener('turnChanged', updateBoardState);
      // gameAreaController.removeListener('moveAttempt', displayAttemptText);
    };
  }, [gameAreaController]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setinputText(event.currentTarget.value);
  };

  const handleKeyPress = async (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      try {
        await gameAreaController.makeMove(inputText);
        console.log(`entered: ${inputText}`);
        setinputText('');
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
    <StyledBombPartyBoard borderColor={gameAreaController.isOurTurn ? '' : 'white'}>
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
          />
          <p>{attemptText}</p>
          <Image padding='20px' boxSize='120px' src='/assets/bomb2.gif' />
          <p>{gameAreaController.currentTimeLeft / 1000}s</p>
        </VStack>
      </Center>
    </StyledBombPartyBoard>
  );
}
