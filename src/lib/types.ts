export type TeamSide = 'CT' | 'T';

export type GamePhase = 'input' | 'spinning' | 'results';

export type AnimationType = 'wheel' | 'case';

export type CS2Map = 'Mirage' | 'Inferno' | 'Nuke' | 'Overpass' | 'Ancient' | 'Anubis' | 'Dust2';

// Player profile (persistent, stored in Supabase)
export interface PlayerProfile {
  id: string;
  name: string;
  photoUrl: string | null;
  soundUrl: string | null;
  createdAt?: string;
  updatedAt?: string;
}

// Player in an active draft (extends profile with team assignment)
export interface Player {
  id: string;
  name: string;
  team: TeamSide | null;
  pickOrder: number | null;
  profileId: string | null;
  photoUrl: string | null;
  soundUrl: string | null;
}

// Draft pick stored in history
export interface DraftPick {
  profileId: string;
  pickOrder: number;
}

// Saved draft
export interface Draft {
  id: string;
  date: string;
  animationType: AnimationType;
  teamCT: DraftPick[];
  teamT: DraftPick[];
}

// Match result linked to a draft
export interface Match {
  id: string;
  draftId: string;
  mapName: CS2Map;
  winningTeam: TeamSide;
  screenshotUrl: string | null;
  playedAt: string;
}

// Computed player stats
export interface PlayerStats {
  profileId: string;
  profileName: string;
  mapName: string;
  wins: number;
  losses: number;
  totalGames: number;
  winRate: number;
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
  draftId: string | null;
}

export type GameAction =
  | { type: 'SET_PLAYERS'; payload: { profiles: PlayerProfile[]; animationType: AnimationType } }
  | { type: 'SET_PLAYERS_LEGACY'; payload: { names: string[]; animationType: AnimationType } }
  | { type: 'START_SPIN' }
  | { type: 'SPIN_COMPLETE'; payload: { playerId: string } }
  | { type: 'SWAP_PLAYERS'; payload: { playerA: string; playerB: string } }
  | { type: 'REORDER_TEAM'; payload: { team: TeamSide; playerIds: string[] } }
  | { type: 'MOVE_PLAYER'; payload: { playerId: string; fromTeam: TeamSide; toTeam: TeamSide; toIndex: number } }
  | { type: 'SELECT_FOR_SWAP'; payload: string }
  | { type: 'CLEAR_SWAP_SELECTION' }
  | { type: 'SET_DRAFT_ID'; payload: string }
  | { type: 'RESET' };
