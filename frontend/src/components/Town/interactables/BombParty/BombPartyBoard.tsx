import React from 'react';
import BombPartyAreaController from '../../../../classes/interactable/BombPartyAreaController';
import { InteractableID } from '../../../../types/CoveyTownSocket';

export type BombPartyGameProps = {
    gameAreaController: BombPartyAreaController;
  };

export default function BombPartyBoard({ gameAreaController }: BombPartyGameProps): JSX.Element 
{
    return <label> Hello World </label>
};

