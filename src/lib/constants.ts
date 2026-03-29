export const TEAM_CT = 'CT' as const;
export const TEAM_T = 'T' as const;

export const COLORS = {
  bg: '#0a0a0f',
  bgCard: 'rgba(255, 255, 255, 0.05)',
  ctPrimary: '#4fc3f7',
  ctDark: '#0288d1',
  ctGlow: 'rgba(79, 195, 247, 0.5)',
  tPrimary: '#ffb300',
  tDark: '#ff6f00',
  tGlow: 'rgba(255, 179, 0, 0.5)',
  neonGreen: '#00e676',
  textPrimary: '#e0e0e0',
  textSecondary: '#9e9e9e',
} as const;

export const WHEEL_COLORS = [
  '#1a237e', '#283593', '#1565c0', '#0277bd',
  '#00838f', '#00695c', '#2e7d32', '#558b2f',
  '#9e9d24', '#f9a825',
] as const;

export const TOTAL_PLAYERS = 10;
export const TEAM_SIZE = 5;

export const DEFAULT_NAMES = [
  'Player 1', 'Player 2', 'Player 3', 'Player 4', 'Player 5',
  'Player 6', 'Player 7', 'Player 8', 'Player 9', 'Player 10',
];

export const CS2_MAPS = [
  'Mirage', 'Inferno', 'Nuke', 'Overpass', 'Ancient', 'Anubis', 'Dust2',
] as const;
