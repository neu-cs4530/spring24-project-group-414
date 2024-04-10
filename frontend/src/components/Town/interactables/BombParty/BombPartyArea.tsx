import {
  Flex,
  Box,
  Button,
  Container,
  Divider,
  useToast,
  VStack,
  HStack,
  Center,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import BombPartyAreaController from '../../../../classes/interactable/BombPartyAreaController';
import { useInteractableAreaController } from '../../../../classes/TownController';
import useTownController from '../../../../hooks/useTownController';
import { InteractableID, GameResult, GameStatus } from '../../../../types/CoveyTownSocket';
import BombPartyBoard from './BombPartyBoard';
import React from 'react';
import PlayerController from '../../../../classes/PlayerController';

/**
 * Overall BombParty frontend area that allows for the player to join a game,
 * @returns
 */
export default function BombPartyArea({
  interactableID,
}: {
  interactableID: InteractableID;
}): JSX.Element {
  const [inGame, setInGame] = useState(true); // NOTE: what is this for?
  const gameAreaController = useInteractableAreaController<BombPartyAreaController>(interactableID);
  const townController = useTownController();
  // states to hold BombPartyAreaValues
  //const [players, setPlayers] = useState<PlayerController[]>(gameAreaController.players);
  const [player1, setPlayer1] = useState<PlayerController | undefined>(
    gameAreaController.getPlayer(0),
  );
  const [player2, setPlayer2] = useState<PlayerController | undefined>(
    gameAreaController.getPlayer(1),
  );
  const [player3, setPlayer3] = useState<PlayerController | undefined>(
    gameAreaController.getPlayer(2),
  );
  const [player4, setPlayer4] = useState<PlayerController | undefined>(
    gameAreaController.getPlayer(3),
  );
  const [player5, setPlayer5] = useState<PlayerController | undefined>(
    gameAreaController.getPlayer(4),
  );
  const [player6, setPlayer6] = useState<PlayerController | undefined>(
    gameAreaController.getPlayer(5),
  );
  const [player7, setPlayer7] = useState<PlayerController | undefined>(
    gameAreaController.getPlayer(6),
  );
  const [player8, setPlayer8] = useState<PlayerController | undefined>(
    gameAreaController.getPlayer(7),
  );
  const [isJoining, setIsJoining] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [status, setGameStatus] = useState<GameStatus>(gameAreaController.status);
  // states to hold game values from controller
  const [, setHistory] = useState<GameResult[]>(gameAreaController.history);
  //const [observers, setObservers] = useState<PlayerController[]>(gameAreaController.observers);

  // toast to provide info to user (game over, connection issue)
  const toast = useToast();

  useEffect(() => {
    console.log('Player List: ' + gameAreaController.players);
    if (gameAreaController) {
      console.log('Pausing');
      townController.pause();
    } else {
      console.log('unPause');
      townController.unPause();
    }
    //functions to update states
    const updateGameState = () => {
      // setPlayers(gameAreaController.players);
      setGameStatus(gameAreaController.status || 'WAITING_FOR_PLAYERS');
      setPlayer1(gameAreaController.getPlayer(0));
      setPlayer2(gameAreaController.getPlayer(1));
      setPlayer3(gameAreaController.getPlayer(2));
      setPlayer4(gameAreaController.getPlayer(3));
      setPlayer5(gameAreaController.getPlayer(4));
      setPlayer6(gameAreaController.getPlayer(5));
      setPlayer7(gameAreaController.getPlayer(6));
      setPlayer8(gameAreaController.getPlayer(7));
    };
    const onGameEnd = () => {
      const winner = gameAreaController.winner;
      if (winner === townController.ourPlayer) {
        toast({
          title: 'Game over',
          description: 'You won!',
          status: 'success',
        });
      } else {
        toast({
          title: 'Game over',
          description: `${winner?.userName} won!`,
          status: 'error',
        });
      }
    };
    gameAreaController.addListener('gameUpdated', updateGameState);
    gameAreaController.addListener('gameEnd', onGameEnd);
    return () => {
      gameAreaController.removeListener('gameUpdated', updateGameState);
      gameAreaController.removeListener('gameEnd', onGameEnd);
    };
  }, [gameAreaController, townController, toast]);

  const joinGameButton =
    status === 'WAITING_FOR_PLAYERS' || !gameAreaController.isPlayer || status === 'OVER' ? (
      <Button
        flex='1'
        onClick={async () => {
          setIsJoining(true);
          try {
            await gameAreaController.joinGame();
          } catch (err) {
            toast({
              title: 'Error joining game',
              description: (err as Error).toString(),
              status: 'error',
            });
          }
          setIsJoining(false);
        }}
        disabled={gameAreaController.isPlayer && status === 'WAITING_FOR_PLAYERS'}
        isLoading={isJoining}>
        {gameAreaController.isPlayer && status === 'WAITING_FOR_PLAYERS'
          ? 'Waiting for more players...'
          : 'Join New Game'}
      </Button>
    ) : (
      <></>
    );

  const startGameButton =
    inGame && status === 'WAITING_TO_START' ? (
      <Button
        flex='1'
        onClick={async () => {
          setIsStarting(true);
          try {
            await gameAreaController.startGame();
          } catch (err) {
            toast({
              title: 'Error starting game',
              description: (err as Error).toString(),
              status: 'error',
            });
          }
          setIsStarting(false);
        }}
        disabled={isStarting || !gameAreaController.isHost}
        isLoading={isStarting}>
        {gameAreaController.isHost ? 'Start Game' : 'Waiting for host to start...'}
      </Button>
    ) : (
      <></>
    );

  const playerIcon = (player: PlayerController, idx: number) => {
    const lives = gameAreaController.getPlayerLives(player.id);
    const maxlives = gameAreaController.settings.maxLives;
    const points = gameAreaController.getPlayerPoints(player.id);
    return (
      <Box
        minW='50px'
        border='solid'
        borderRadius='md'
        borderColor={townController.ourPlayer === player ? 'blueviolet' : 'white'}
        backgroundColor='whitesmoke'
        padding='4px'
        key={idx}>
        {player.userName}
        {idx === 0 && ' (host)'}
        <Divider />
        {Array(lives).fill(<>&#10084;</>)}
        {Array(maxlives - lives).fill(<>&#9760;</>)}
        <Divider />
        &#11088; {points}
      </Box>
    );
  };

  const listPlayers = (
    <Container width='500px' paddingY='10px'>
      <VStack alignItems='stretch' borderY='-1'>
        {status !== 'IN_PROGRESS' ? (
          <Flex paddingTop='5px'>
            {joinGameButton}
            {startGameButton}
          </Flex>
        ) : (
          <></>
        )}
        <Center>
          <HStack>
            {player1 && playerIcon(player1, 0)}
            {player2 && playerIcon(player2, 1)}
            {player3 && playerIcon(player3, 2)}
            {player4 && playerIcon(player4, 3)}
            {player5 && playerIcon(player5, 4)}
            {player6 && playerIcon(player6, 5)}
            {player7 && playerIcon(player7, 6)}
            {player8 && playerIcon(player8, 7)}
          </HStack>
        </Center>
      </VStack>
    </Container>
  );

  return (
    <Container minW='full' paddingX='0px'>
      {listPlayers}
      <Divider />
      {status === 'IN_PROGRESS' && (
        <Container marginY='10px'>
          <BombPartyBoard gameAreaController={gameAreaController} />
        </Container>
      )}
    </Container>
  );
}
