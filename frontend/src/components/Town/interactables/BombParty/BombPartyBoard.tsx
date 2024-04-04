import { chakra, Container, Input, VStack } from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import BombPartyAreaController from '../../../../classes/interactable/BombPartyAreaController';
import { InteractableID } from '../../../../types/CoveyTownSocket';
import { TextBox } from './Components/TextBox';
import CSS from 'csstype';
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

  const prompStyles: CSS.Properties = {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    position: 'static',
    right: 0,
    bottom: '2px',
    padding: '2px',
    fontFamily: 'sans-serif',
    fontSize: '24px',
    textAlign: 'center',
  };

  return (
    <StyledBombPartyBoard>
      <h1>{whoseTurnText}&apos;s turn</h1>
      <b>
        <p style={prompStyles}>{'prompt:  ' + currentPromptText}</p>
      </b>
      <Input value={inputText} onChange={handleChange} onKeyPress={handleKeyPress} />
    </StyledBombPartyBoard>
  );
}
