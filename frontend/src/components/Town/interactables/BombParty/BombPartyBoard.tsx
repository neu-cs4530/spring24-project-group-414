import { chakra, Container, Input, VStack } from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import BombPartyAreaController from '../../../../classes/interactable/BombPartyAreaController';
import { InteractableID } from '../../../../types/CoveyTownSocket';
import { TextBox } from './Components/TextBox';
export type BombPartyGameProps = {
  gameAreaController: BombPartyAreaController;
};

//TODO: add style
const StyledBombPartyBoard = chakra(Container, {});

export default function BombPartyBoard({ gameAreaController }: BombPartyGameProps): JSX.Element {
  // const checkWord = (word: string): boolean => {
  //   return word == 'car';
  // };

  const [whoseTurnText, setWhoseTurnText] = useState(gameAreaController.whoseTurn?.userName);
  const [currentPromptText, setCurrentPromptText] = useState(gameAreaController.currentPrompt);
  const [inputText, setinputText] = useState('');

  useEffect(() => {
    const updateBoardState = () => {
      setWhoseTurnText(gameAreaController.whoseTurn?.userName);
      setCurrentPromptText(gameAreaController.currentPrompt);
    };
    gameAreaController.addListener('stateUpdated', updateBoardState);
    gameAreaController.addListener('turnChanged', updateBoardState);
    // TODO: Listen on more events?
    return () => {
      gameAreaController.removeListener('stateUpdated', updateBoardState);
      gameAreaController.removeListener('turnChanged', updateBoardState);
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

  return (
    <StyledBombPartyBoard>
      <h1>{whoseTurnText}'s turn</h1>
      <h1>{currentPromptText}</h1>
      <Input value={inputText} onChange={handleChange} onKeyPress={handleKeyPress} />
    </StyledBombPartyBoard>
  );
}
