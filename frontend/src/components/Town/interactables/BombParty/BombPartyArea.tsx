import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  Button,
  Container,
  Divider,
  GridItem,
  HStack,
  List,
  ListItem,
  Select,
  SimpleGrid,
  useToast,
  VStack,
} from '@chakra-ui/react';
import { useCallback, useEffect, useState } from 'react';
import BombPartyAreaController from '../../../../classes/interactable/BombPartyAreaController';
import { useInteractable, useInteractableAreaController } from '../../../../classes/TownController';
import useTownController from '../../../../hooks/useTownController';
import { InteractableID, GameResult, GameStatus } from '../../../../types/CoveyTownSocket';
import GameArea from '../GameArea';
import BombPartyBoard from './BombPartyBoard';
import React from 'react';
import PlayerController from '../../../../classes/PlayerController';

// TESTING WHAT COMMIT
/**
 * Overall BombParty frontend area that allows for the player to join a game,
 * @returns
 */
export default function BombPartyArea({
  interactableID,
}: {
  interactableID: InteractableID;
}): JSX.Element {
  const [inGame, setInGame] = useState(true);
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
    status === 'IN_PROGRESS' ? (
      <></>
    ) : (
      <Button
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
  console.log('Join Game');

  const startGameButton =
    inGame && status === 'WAITING_TO_START' ? (
      <Button
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
        disabled={isStarting}
        isLoading={isStarting}>
        Start Game
      </Button>
    ) : (
      <></>
    );
  console.log('start game');

  const listPlayersItems =
    players &&
    players.map((player, index) => (
      <ListItem key={index}>
        {townController.ourPlayer === player
          ? player.userName + ' (you)'
          : player
          ? player.userName
          : ''}
        {index === 0 && ' (host) '}
        lives: {gameAreaController.getPlayerLives(player.id)}
      </ListItem>
    ));

  const listPlayers = (
    <SimpleGrid columns={3} gap={6}>
      <GridItem colSpan={2} alignContent='center'>
        <List aria-label='list of players in the game'>
          <VStack alignItems='stretch'>{listPlayersItems}</VStack>
        </List>
      </GridItem>
      <GridItem>
        <VStack paddingTop='5px'>
          {joinGameButton}
          {startGameButton}
        </VStack>
      </GridItem>
    </SimpleGrid>
  );
  console.log('list Players');

  return (
    <Container minW='full' paddingX='0px'>
      <VStack bgColor='white' align='center' paddingBottom='5'>
        <Divider />
        {listPlayers}
        <Divider />
      </VStack>
      {status === 'IN_PROGRESS' && (
        <Container
          bgColor='salmon'
          width='500px'
          height='400px'
          minW='full'
          border='solid'
          borderWidth='5px'
          borderRadius='5px'
          borderColor='black'>
          <BombPartyBoard gameAreaController={gameAreaController} />
        </Container>
      )}
    </Container>
  );
}
