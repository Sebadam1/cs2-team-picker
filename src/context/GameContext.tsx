'use client';

import { createContext, useContext, useReducer, type ReactNode } from 'react';
import type { GameState, GameAction, Player, PlayerProfile } from '@/lib/types';
import { generateId, shuffleArray } from '@/lib/utils';

const initialState: GameState = {
  phase: 'input',
  animationType: 'wheel',
  players: [],
  availablePlayers: [],
  teamCT: [],
  teamT: [],
  currentTurn: 'CT',
  pickNumber: 0,
  isSpinning: false,
  selectedForSwap: null,
  draftId: null,
};

function profileToPlayer(profile: PlayerProfile): Player {
  return {
    id: generateId(),
    name: profile.name,
    team: null,
    pickOrder: null,
    profileId: profile.id,
    photoUrl: profile.photoUrl,
    soundUrl: profile.soundUrl,
  };
}

function nameToPlayer(name: string): Player {
  return {
    id: generateId(),
    name,
    team: null,
    pickOrder: null,
    profileId: null,
    photoUrl: null,
    soundUrl: null,
  };
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_PLAYERS': {
      const players: Player[] = action.payload.profiles.map(profileToPlayer);
      return {
        ...state,
        phase: 'spinning',
        animationType: action.payload.animationType,
        players,
        availablePlayers: shuffleArray(players),
        teamCT: [],
        teamT: [],
        currentTurn: 'CT',
        pickNumber: 0,
        isSpinning: false,
        draftId: null,
      };
    }

    case 'SET_PLAYERS_LEGACY': {
      const players: Player[] = action.payload.names.map(nameToPlayer);
      return {
        ...state,
        phase: 'spinning',
        animationType: action.payload.animationType,
        players,
        availablePlayers: shuffleArray(players),
        teamCT: [],
        teamT: [],
        currentTurn: 'CT',
        pickNumber: 0,
        isSpinning: false,
        draftId: null,
      };
    }

    case 'START_SPIN':
      return { ...state, isSpinning: true };

    case 'SPIN_COMPLETE': {
      const { playerId } = action.payload;
      const player = state.availablePlayers.find((p) => p.id === playerId);
      if (!player) return state;

      const newPickNumber = state.pickNumber + 1;
      const assignedPlayer: Player = {
        ...player,
        team: state.currentTurn,
        pickOrder: newPickNumber,
      };

      const newAvailable = state.availablePlayers.filter((p) => p.id !== playerId);
      const newCT = state.currentTurn === 'CT' ? [...state.teamCT, assignedPlayer] : state.teamCT;
      const newT = state.currentTurn === 'T' ? [...state.teamT, assignedPlayer] : state.teamT;

      const allPicked = newAvailable.length === 0;

      return {
        ...state,
        availablePlayers: newAvailable,
        teamCT: newCT,
        teamT: newT,
        currentTurn: state.currentTurn === 'CT' ? 'T' : 'CT',
        pickNumber: newPickNumber,
        isSpinning: false,
        phase: allPicked ? 'results' : 'spinning',
      };
    }

    case 'SKIP_DRAFT': {
      // Instantly assign all remaining available players alternating CT/T
      let ct = [...state.teamCT];
      let t = [...state.teamT];
      let turn = state.currentTurn;
      let pickNum = state.pickNumber;

      const remaining = shuffleArray(state.availablePlayers);
      for (const player of remaining) {
        pickNum += 1;
        const assigned: Player = { ...player, team: turn, pickOrder: pickNum };
        if (turn === 'CT') {
          ct = [...ct, assigned];
        } else {
          t = [...t, assigned];
        }
        turn = turn === 'CT' ? 'T' : 'CT';
      }

      return {
        ...state,
        availablePlayers: [],
        teamCT: ct,
        teamT: t,
        currentTurn: turn,
        pickNumber: pickNum,
        isSpinning: false,
        phase: 'results',
      };
    }

    case 'SWAP_PLAYERS': {
      const { playerA, playerB } = action.payload;
      const pA = [...state.teamCT, ...state.teamT].find((p) => p.id === playerA);
      const pB = [...state.teamCT, ...state.teamT].find((p) => p.id === playerB);
      if (!pA || !pB || pA.team === pB.team) return state;

      const swapped = (team: Player[], out: Player, incoming: Player) =>
        team.map((p) => (p.id === out.id ? { ...incoming, team: out.team } : p));

      return {
        ...state,
        teamCT: pA.team === 'CT' ? swapped(state.teamCT, pA, pB) : swapped(state.teamCT, pB, pA),
        teamT: pA.team === 'T' ? swapped(state.teamT, pA, pB) : swapped(state.teamT, pB, pA),
        selectedForSwap: null,
      };
    }

    case 'REORDER_TEAM': {
      const { team, playerIds } = action.payload;
      const source = team === 'CT' ? state.teamCT : state.teamT;
      const reordered = playerIds
        .map((id) => source.find((p) => p.id === id))
        .filter(Boolean) as Player[];

      return {
        ...state,
        teamCT: team === 'CT' ? reordered : state.teamCT,
        teamT: team === 'T' ? reordered : state.teamT,
      };
    }

    case 'MOVE_PLAYER': {
      const { playerId, fromTeam, toTeam, toIndex } = action.payload;
      if (fromTeam === toTeam) return state;

      const fromList = fromTeam === 'CT' ? [...state.teamCT] : [...state.teamT];
      const toList = toTeam === 'CT' ? [...state.teamCT] : [...state.teamT];

      const playerIndex = fromList.findIndex((p) => p.id === playerId);
      if (playerIndex === -1) return state;

      const [player] = fromList.splice(playerIndex, 1);
      const movedPlayer = { ...player, team: toTeam };
      toList.splice(toIndex, 0, movedPlayer);

      return {
        ...state,
        teamCT: fromTeam === 'CT' ? fromList : toList,
        teamT: fromTeam === 'T' ? fromList : toList,
      };
    }

    case 'SELECT_FOR_SWAP':
      return { ...state, selectedForSwap: action.payload };

    case 'CLEAR_SWAP_SELECTION':
      return { ...state, selectedForSwap: null };

    case 'SET_DRAFT_ID':
      return { ...state, draftId: action.payload };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

const GameContext = createContext<{
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
} | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within GameProvider');
  return context;
}
