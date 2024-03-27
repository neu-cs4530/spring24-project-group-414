import { BombPartyGameState, GameStatus } from "../../types/CoveyTownSocket";
import GameAreaController, { GameEventTypes } from "./GameAreaController";

export const GAME_ALREADY_IN_PROGRESS = 'The game is already in progress';
export type BombPartyEvents=GameEventTypes &{

}

export default class BombPartyAreaController extends GameAreaController<BombPartyGameState, BombPartyEvents>{
    public isActive(): boolean {
        return true;
    }

    get status(): GameStatus {
        console.log('Checking Status')
        const status = this._model.game?.state.status; // could be null
        if (!status) {//there is no status, game hasnt been intialized
          return 'WAITING_TO_START';} else {
          return status;}}

    public async startGame() {
        const instanceID = this._instanceID;
        if (!instanceID || this._model.game?.state.status !== 'WAITING_TO_START') {
          throw new Error(GAME_ALREADY_IN_PROGRESS); //discuss about this
        }
        await this._townController.sendInteractableCommand(this.id, {
          type: 'StartGame',
          gameID: instanceID,
        });
      }

}