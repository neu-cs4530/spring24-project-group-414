import {
  Flex,
  Box,
  Button,
  Container,
  Divider,
  GridItem,
  List,
  ListItem,
  SimpleGrid,
  useToast,
  VStack,
  WrapItem,
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
  const [players, setPlayers] = useState<PlayerController[]>(gameAreaController.players);
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
      setPlayers(gameAreaController.players);
      setGameStatus(gameAreaController.status || 'WAITING_FOR_PLAYERS');
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
    status === 'IN_PROGRESS' || gameAreaController.isPlayer ? (
      <></>
    ) : (
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
        disabled={isJoining}
        isLoading={isJoining}>
        Join New Game
      </Button>
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
    console.log(player.id);
    return (
      <Box
        minW='50px'
        border='solid'
        borderRadius='md'
        borderColor={townController.ourPlayer === player ? 'blueviolet' : 'white'}
        backgroundColor='black'
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
          <HStack>{players && players.map((player, idx) => playerIcon(player, idx))}</HStack>
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
