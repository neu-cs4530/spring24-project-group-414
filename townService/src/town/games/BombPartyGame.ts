import Player from '../../lib/Player';
import { BombPartyGameState, BombPartyMove, GameMove } from '../../types/CoveyTownSocket';
import Game from './Game';

/**
 * A BombPartyGame is a Game that implements the rules of the game BombParty.
 */
export default class BombPartyGame extends Game<BombPartyGameState, BombPartyMove> {
  /**
   * Creates a new BombPartyGame.
   */
  constructor() {
    super({
      moves: [],
      status: 'WAITING_FOR_PLAYERS',
      lives: [],
    });
  }

  public applyMove(move: GameMove<BombPartyMove>): void {
    throw new Error('Method not implemented.');
  }

  protected _join(player: Player): void {
    throw new Error('Method not implemented.');
  }

  protected _leave(_player: Player): void {
    throw new Error('Method not implemented.');
  }
}
