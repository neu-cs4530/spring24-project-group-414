import Player from '../../lib/Player';
import {
  InteractableCommand,
  InteractableCommandReturnType,
  InteractableType,
} from '../../types/CoveyTownSocket';
import BombPartyGame from './BombPartyGame';
import GameArea from './GameArea';

/**
 * The BombPartyGameArea class is responsible for managing the state of a single game area for Bomb Party.
 * Responsibilty for managing the state of the game itself is delegated to the BombPartyGame class.
 *
 * @see BombPartyGame
 * @see GameArea
 */
export default class BombPartyGameArea extends GameArea<BombPartyGame> {
  protected getType(): InteractableType {
    return 'BombPartyArea';
  }

  /**
   * Handle a command from a player in this game area.
   * Supported commands:
   * - JoinGame (joins the game `this._game`, or creates a new one if none is in progress)
   * - StartGame (indicates that the player is ready to start the game)
   * - GameMove (applies a move to the game)
   * - LeaveGame (leaves the game)
   *
   * If the command ended the game, records the outcome in this._history
   * If the command is successful (does not throw an error), calls this._emitAreaChanged (necessary
   * to notify any listeners of a state update, including any change to history)
   * If the command is unsuccessful (throws an error), the error is propagated to the caller
   *
   * @see InteractableCommand
   *
   * @param command command to handle
   * @param player player making the request
   * @returns response to the command, @see InteractableCommandResponse
   * @throws InvalidParametersError if the command is not supported or is invalid.
   * Invalid commands:
   * - GameMove, StartGame and LeaveGame: if the game is not in progress (GAME_NOT_IN_PROGRESS_MESSAGE) or if the game ID does not match the game in progress (GAME_ID_MISSMATCH_MESSAGE)
   * - Any command besides JoinGame, GameMove, StartGame and LeaveGame: INVALID_COMMAND_MESSAGE
   */
  public handleCommand<CommandType extends InteractableCommand>(
    command: CommandType,
    player: Player,
  ): InteractableCommandReturnType<CommandType> {
    throw new Error('Method not implemented.');
  }
}
