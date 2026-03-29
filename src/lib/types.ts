export type TeamSide = 'CT' | 'T';

export type GamePhase = 'input' | 'spinning' | 'results';

export type AnimationType = 'wheel' | 'case';

export interface Player {
  id: string;
  name: string;
  team: TeamSide | null;
  pickOrder: number | null;
}

export interface GameState {
  phase: GamePhase;
  animationType: AnimationType;
  players: Player[];
  availablePlayers: Player[];
  teamCT: Player[];
  teamT: Player[];
  currentTurn: TeamSide;
  pickNumber: number;
  isSpinning: boolean;
  selectedForSwap: string | null;
}

export type GameAction =
  | { type: 'SET_PLAYERS'; payload: { names: string[]; animationType: AnimationType } }
  | { type: 'START_SPIN' }
  | { type: 'SPIN_COMPLETE'; payload: { playerId: string } }
  | { type: 'SWAP_PLAYERS'; payload: { playerA: string; playerB: string } }
  | { type: 'REORDER_TEAM'; payload: { team: TeamSide; playerIds: string[] } }
  | { type: 'MOVE_PLAYER'; payload: { playerId: string; fromTeam: TeamSide; toTeam: TeamSide; toIndex: number } }
  | { type: 'SELECT_FOR_SWAP'; payload: string }
  | { type: 'CLEAR_SWAP_SELECTION' }
  | { type: 'RESET' };
