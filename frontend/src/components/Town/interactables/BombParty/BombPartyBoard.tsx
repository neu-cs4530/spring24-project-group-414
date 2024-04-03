import React, { useState } from 'react';
import BombPartyAreaController from '../../../../classes/interactable/BombPartyAreaController';
import { InvalidParametersError, PlayerID } from '../../../../generated/client';
import { BombPartyMove, InteractableID } from '../../../../types/CoveyTownSocket';
import { TextBox } from './Components/TextBox';
import WarningLabel from './Components/WarningLabel';
import _ from 'lodash';

export type BombPartyGameProps = {
  gameAreaController: BombPartyAreaController;
};

export default function BombPartyBoard({ gameAreaController }: BombPartyGameProps): JSX.Element {
  const checkWord = async (word: string): Promise<string> => {
    try {
      await gameAreaController.makeMove(word);
      return '';
    } catch (e) {
      if (e instanceof Error) {
        return e.message;
      }
      return '';
    }
  };

  const [textBoxText, setTextBoxText] = useState('');
  const [warningLabel, setWarningLabel] = useState('');

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTextBoxText(event.currentTarget.value);
    event.stopPropagation();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setWarningLabel(await checkWord(textBoxText));
    setTextBoxText('');
  };

  return (
    <div>
      {' '}
      <TextBox value={textBoxText} handleChange={handleChange} handleSubmit={handleSubmit} />
      <WarningLabel>{warningLabel}</WarningLabel>
    </div>
  );
}
