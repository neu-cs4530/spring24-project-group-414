import { chakra, Container, VStack } from '@chakra-ui/react';
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
  const [textBoxText, setTextBoxText] = useState('');

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
    setTextBoxText(event.currentTarget.value);
  };

  return (
    <StyledBombPartyBoard>
      <h1>{whoseTurnText}'s turn</h1>
      <h1>{currentPromptText}</h1>
      <TextBox
        value={textBoxText}
        handleChange={handleChange}
        handleSubmit={async () => {
          try {
            await gameAreaController.makeMove(textBoxText);
            return '';
          } catch ({ name, message }) {
            return message;
          }
        }}
      />
    </StyledBombPartyBoard>
  );
}
