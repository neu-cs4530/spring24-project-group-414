import React, { useState } from 'react';
import BombPartyAreaController from '../../../../classes/interactable/BombPartyAreaController';
import { InteractableID } from '../../../../types/CoveyTownSocket';
import { TextBox } from './Components/TextBox';
export type BombPartyGameProps = {
  gameAreaController: BombPartyAreaController;
};

export default function BombPartyBoard({ gameAreaController }: BombPartyGameProps): JSX.Element {
  const checkWord = (word: string): boolean => {
    return word == 'car';
  };

  const [textBoxText, setTextBoxText] = useState('');
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTextBoxText(event.currentTarget.value);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (checkWord(textBoxText)) {
      console.log("That's a valid word!");
    } else {
      console.log('Not correct.');
    }

    setTextBoxText('');
  };

  return <TextBox value={textBoxText} handleChange={handleChange} handleSubmit={handleSubmit} />;
}
