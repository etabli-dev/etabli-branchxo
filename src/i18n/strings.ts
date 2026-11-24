/**
 * Every user-facing string of the game, in English and German. `short*` entries are the visible
 * labels of controls that must fit on one line down to a 375-pt-wide iPhone SE; the matching full
 * text stays the accessibility label. Pure TypeScript, so tests can compare both catalogues.
 */
import type { Language } from '../settings/appearance';

type MarkName = 'X' | 'O';

const en = {
  brandSubtitle: 'multiverse tic-tac-toe',
  loading: 'loading…',
  engineLoading: 'Loading game…',
  engineFailed: 'The drawing engine could not be loaded. Reload the page or check the installation.',
  settingsTitle: 'Settings',
  saveFailed: 'Could not save the game. Keep the app open and free some storage.',
  loadFailed: 'The saved game could not be loaded and has been preserved. New game replaces it.',

  views: {
    board: { short: 'Board', full: 'Board' },
    timeline: { short: 'Timeline', full: 'Timeline' },
    tree: { short: 'Multiverse', full: 'Multiverse' },
    heat: { short: 'Heat', full: 'Heat' },
  },

  summaryA11y: (x: number, o: number, d: number, open: number, total: number) =>
    `Multiverse summary: ${x} X wins, ${o} O wins, ${d} draws, ${open} open of ${total} universes`,
  chipDraw: 'draw',
  chipOpen: 'open',
  universes: (n: number) => `${n} universe${n === 1 ? '' : 's'}`,

  boardA11y: 'Tic-tac-toe board',
  cellA11y: (n: number, mark: MarkName | null) => `Cell ${n}, ${mark ?? 'empty'}`,
  statusScrubbed: (ply: number) => `viewing ply ${ply} (scrubbed)`,
  wins: (mark: MarkName) => `${mark} wins`,
  draw: 'Draw',
  drawLower: 'draw',
  toMove: (mark: MarkName) => `${mark} to move`,
  thinking: ' • thinking…',

  branchTitle: 'Fork a new universe?',
  branchBody: (ply: number | string) =>
    `You scrubbed back to ply ${ply} and tapped a different cell. This will create a new universe branching from the current one. The original universe is preserved.`,
  cancel: 'Cancel',
  cancelBranchA11y: 'Cancel branch',
  branch: 'Branch',
  confirmBranchA11y: 'Confirm branch',

  timelineTitle: (ply: number, last: number) => `Timeline (ply ${ply}/${last})`,
  goToPly: (ply: number) => `Go to ply ${ply}`,

  multiverseTitle: 'Multiverse',
  badgeXWins: (n: number) => `X wins ${n}`,
  badgeOWins: (n: number) => `O wins ${n}`,
  badgeDraws: (n: number) => `draws ${n}`,
  badgeOpen: (n: number) => `open ${n}`,
  universeA11y: (label: string, status: string) => `Universe ${label}, ${status}`,

  heatTitle: 'Strength heat (active board)',
  heatLegend: 'viridis · darker = weaker · ★ = immediate win · ◆ = immediate block',

  probTitle: (perfect: boolean) => `Win probability (${perfect ? 'vs perfect play' : 'vs random play'})`,
  probDraw: 'P(draw)',
  turningPoint: (ply: number) => `turning point: ply ${ply}`,

  modeLabel: 'Mode',
  hotseat: { short: 'Hotseat', full: 'Hotseat' },
  vsComputer: { short: 'vs Computer', full: 'vs Computer' },
  aiLevelLabel: 'AI level',
  aiEasy: 'Easy',
  aiMedium: 'Medium',
  aiPerfect: 'Perfect',
  aiPlaysAs: 'AI plays as',
  probModeLabel: 'Probability mode',
  probPerfect: { short: 'vs Perfect', full: 'vs Perfect' },
  probRandom: { short: 'vs Random', full: 'vs Random' },
  hintsYouPlay: (mark: MarkName) => `Hint overlay (you play ${mark})`,
  hintsPerPlayer: 'Hint overlay (per-player)',
  hints: (mark: MarkName) => `${mark} hints`,
  newGame: 'New game (reset multiverse)',
  newGameA11y: 'New game',

  appearanceTitle: 'Appearance',
  languageLabel: 'App language',
  languageSystem: 'System',
  appearanceModeLabel: 'Mode',
  modeSystem: 'System',
  modeLight: 'Light',
  modeDark: 'Dark',
  accentLabel: 'Accent colour',
  accentNames: {
    coderBlue: 'Coder blue',
    green: 'Green',
    yellow: 'Yellow',
    orange: 'Orange',
    red: 'Red',
    purple: 'Purple',
    graphite: 'Graphite',
  },
  appearanceNote: 'Language, mode and accent apply at once. The board keeps the game palette.',
};

export type Strings = typeof en;

const de: Strings = {
  brandSubtitle: 'Multiversum-Tic-Tac-Toe',
  loading: 'Lädt…',
  engineLoading: 'Spiel wird geladen…',
  engineFailed: 'Die Grafik-Engine konnte nicht geladen werden. Seite neu laden oder die Installation prüfen.',
  settingsTitle: 'Einstellungen',
  saveFailed: 'Das Spiel konnte nicht gespeichert werden. App geöffnet lassen und Speicherplatz freigeben.',
  loadFailed:
    'Das gespeicherte Spiel konnte nicht geladen werden und bleibt erhalten. „Neues Spiel“ ersetzt es.',

  views: {
    board: { short: 'Brett', full: 'Brett' },
    timeline: { short: 'Verlauf', full: 'Zeitverlauf' },
    tree: { short: 'Universen', full: 'Multiversum' },
    heat: { short: 'Heatmap', full: 'Heatmap' },
  },

  summaryA11y: (x, o, d, open, total) =>
    `Multiversum: ${x} Siege X, ${o} Siege O, ${d} unentschieden, ${open} offen von ${total} Universen`,
  chipDraw: 'remis',
  chipOpen: 'offen',
  universes: (n) => `${n} ${n === 1 ? 'Universum' : 'Universen'}`,

  boardA11y: 'Tic-Tac-Toe-Brett',
  cellA11y: (n, mark) => `Feld ${n}, ${mark ?? 'leer'}`,
  statusScrubbed: (ply) => `Ansicht Zug ${ply} (zurückgespult)`,
  wins: (mark) => `${mark} gewinnt`,
  draw: 'Unentschieden',
  drawLower: 'unentschieden',
  toMove: (mark) => `${mark} am Zug`,
  thinking: ' • denkt nach…',

  branchTitle: 'Neues Universum abzweigen?',
  branchBody: (ply) =>
    `Zurückgespult auf Zug ${ply} und ein anderes Feld gewählt. Damit zweigt ein neues Universum vom aktuellen ab. Das ursprüngliche Universum bleibt erhalten.`,
  cancel: 'Abbrechen',
  cancelBranchA11y: 'Abzweigung abbrechen',
  branch: 'Abzweigen',
  confirmBranchA11y: 'Abzweigung bestätigen',

  timelineTitle: (ply, last) => `Zeitverlauf (Zug ${ply}/${last})`,
  goToPly: (ply) => `Zu Zug ${ply}`,

  multiverseTitle: 'Multiversum',
  badgeXWins: (n) => `Siege X ${n}`,
  badgeOWins: (n) => `Siege O ${n}`,
  badgeDraws: (n) => `remis ${n}`,
  badgeOpen: (n) => `offen ${n}`,
  universeA11y: (label, status) => `Universum ${label}, ${status}`,

  heatTitle: 'Zugstärke (aktives Brett)',
  heatLegend: 'Viridis · dunkler = schwächer · ★ = sofortiger Sieg · ◆ = sofortige Abwehr',

  probTitle: (perfect) => `Gewinnchance (${perfect ? 'gegen perfektes Spiel' : 'gegen Zufallsspiel'})`,
  probDraw: 'P(remis)',
  turningPoint: (ply) => `Wendepunkt: Zug ${ply}`,

  modeLabel: 'Spielmodus',
  hotseat: { short: 'Zu zweit', full: 'Zu zweit an einem Gerät' },
  vsComputer: { short: 'Gegen Computer', full: 'Gegen den Computer' },
  aiLevelLabel: 'Computerstärke',
  aiEasy: 'Leicht',
  aiMedium: 'Mittel',
  aiPerfect: 'Perfekt',
  aiPlaysAs: 'Computer spielt',
  probModeLabel: 'Wahrscheinlichkeit',
  probPerfect: { short: 'Perfektes Spiel', full: 'Gegen perfektes Spiel' },
  probRandom: { short: 'Zufallsspiel', full: 'Gegen Zufallsspiel' },
  hintsYouPlay: (mark) => `Zughilfe für ${mark}`,
  hintsPerPlayer: 'Zughilfe (je Spieler)',
  hints: (mark) => `Tipps ${mark}`,
  newGame: 'Neues Spiel (Multiversum leeren)',
  newGameA11y: 'Neues Spiel',

  appearanceTitle: 'Darstellung',
  languageLabel: 'App-Sprache',
  languageSystem: 'System',
  appearanceModeLabel: 'Modus',
  modeSystem: 'System',
  modeLight: 'Hell',
  modeDark: 'Dunkel',
  accentLabel: 'Akzentfarbe',
  accentNames: {
    coderBlue: 'Coder-Blau',
    green: 'Grün',
    yellow: 'Gelb',
    orange: 'Orange',
    red: 'Rot',
    purple: 'Violett',
    graphite: 'Graphit',
  },
  appearanceNote: 'Sprache, Modus und Akzentfarbe gelten sofort. Das Brett behält die Spielfarben.',
};

export const STRINGS: Readonly<Record<Language, Strings>> = { en, de };
