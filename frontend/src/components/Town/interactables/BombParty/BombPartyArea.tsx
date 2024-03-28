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
  const [isJoining, setIsJoining] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isLBModalOpen, setIsLBModalOpen] = useState(false);
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [status, setGameStatus] = useState<GameStatus>(gameAreaController.status);
  // states to hold game values from controller
  const [, setHistory] = useState<GameResult[]>(gameAreaController.history);
  //const [observers, setObservers] = useState<PlayerController[]>(gameAreaController.observers);

  // toast to provide info to user (game over, connection issue)
  const toast = useToast();

  useEffect(() => {
    //functions to update states
    const updateGame = () => {};
  }, [gameAreaController, townController]);

  const joinGameButton =
    (inGame && status === 'WAITING_TO_START') || status === 'IN_PROGRESS' ? (
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

  const listPlayers =
    status !== 'IN_PROGRESS' ? (
      <SimpleGrid columns={3} gap={6}>
        <GridItem colSpan={2} alignContent='center'>
          <List aria-label='list of players in the game'>
            <VStack alignItems='stretch'></VStack>
          </List>
        </GridItem>
        <GridItem>
          <VStack paddingTop='5px'>
            {joinGameButton}
            {startGameButton}
          </VStack>
        </GridItem>
      </SimpleGrid>
    ) : (
      <List aria-label='list of players in the game'>
        <VStack alignItems='stretch' borderY={-1}></VStack>
      </List>
    );
  console.log('list Players');

  return (
    <Container minW='full' paddingX='0px'>
      <VStack minW='max' bgColor='white' align='center' paddingBottom='5'>
        <Divider />
        {listPlayers}
        <Divider />
      </VStack>
      <Container
        bgColor='tomato'
        minW='full'
        border='solid'
        borderWidth='5px'
        borderRadius='5px'
        borderColor='black'>
        {status !== 'WAITING_TO_START' && (
          <BombPartyBoard gameAreaController={gameAreaController} />
        )}
      </Container>
    </Container>
  );
}