// ══════════════════════════════════════════════════════
// STAT DEFINITIONS — configurable in Settings > Resources
// ══════════════════════════════════════════════════════

export type StatScope = 'team' | 'individual';
export type StatType = 'manual' | 'computed';
export type ComputeOp = 'sum_individual' | 'divide' | 'multiply' | 'subtract' | 'percentage';
// sum_individual = sum of an individual stat across all players → team stat
// divide = numerator / denominator
// percentage = (numerator / denominator) * 100

export interface StatFormula {
  op: ComputeOp;
  // For sum_individual: sourceStatKey is the individual stat key to sum
  sourceStatKey?: string;
  // For divide / percentage: numerator and denominator keys
  numeratorKey?: string;
  denominatorKey?: string;
  // Which scope the source keys come from
  sourceScope?: StatScope;
}

export interface StatDefinition {
  id: string;
  key: string;
  label: string;
  short: string;
  group: string;
  scope: StatScope;
  type: StatType;
  formula?: StatFormula;
  unit?: string; // e.g. '%' for percentages
}

export interface StatGroupDef {
  key: string;
  label: string;
  color: string;
  scope: StatScope;
}

// ── Groups ────────────────────────────────────────────
export const statGroups: StatGroupDef[] = [
  // Team groups
  { key: 'team_attack', label: 'Attack', color: '#FF5630', scope: 'team' },
  { key: 'team_passing', label: 'Passing', color: '#00A76F', scope: 'team' },
  { key: 'team_defence', label: 'Defence', color: '#8E33FF', scope: 'team' },
  { key: 'team_discipline', label: 'Discipline', color: '#FFAB00', scope: 'team' },
  { key: 'team_general', label: 'General', color: '#00B8D9', scope: 'team' },
  // Individual groups
  { key: 'ind_attack', label: 'Attack', color: '#FF5630', scope: 'individual' },
  { key: 'ind_passing', label: 'Passing', color: '#00A76F', scope: 'individual' },
  { key: 'ind_defence', label: 'Defence', color: '#8E33FF', scope: 'individual' },
  { key: 'ind_discipline', label: 'Discipline & General', color: '#FFAB00', scope: 'individual' },
];

// ── Definitions ───────────────────────────────────────
export const statDefinitions: StatDefinition[] = [
  // ── TEAM STATS ────────────────────────────────────
  // Attack
  { id: 'ts-01', key: 'team_goals', label: 'Goals', short: 'G', group: 'team_attack', scope: 'team', type: 'computed',
    formula: { op: 'sum_individual', sourceStatKey: 'goals', sourceScope: 'individual' } },
  { id: 'ts-02', key: 'team_shots', label: 'Shots', short: 'SH', group: 'team_attack', scope: 'team', type: 'computed',
    formula: { op: 'sum_individual', sourceStatKey: 'shots', sourceScope: 'individual' } },
  { id: 'ts-03', key: 'team_shots_on_target', label: 'Shots on Target', short: 'SOT', group: 'team_attack', scope: 'team', type: 'computed',
    formula: { op: 'sum_individual', sourceStatKey: 'shots_on_target', sourceScope: 'individual' } },
  { id: 'ts-04', key: 'team_shot_accuracy', label: 'Shot Accuracy', short: 'SA%', group: 'team_attack', scope: 'team', type: 'computed', unit: '%',
    formula: { op: 'percentage', numeratorKey: 'team_shots_on_target', denominatorKey: 'team_shots', sourceScope: 'team' } },
  { id: 'ts-05', key: 'team_corners', label: 'Corners', short: 'CRN', group: 'team_attack', scope: 'team', type: 'manual' },
  { id: 'ts-06', key: 'team_offsides', label: 'Offsides', short: 'OFF', group: 'team_attack', scope: 'team', type: 'manual' },
  // Passing
  { id: 'ts-07', key: 'team_passes', label: 'Passes', short: 'PAS', group: 'team_passing', scope: 'team', type: 'computed',
    formula: { op: 'sum_individual', sourceStatKey: 'passes', sourceScope: 'individual' } },
  { id: 'ts-08', key: 'team_pass_accuracy', label: 'Pass Accuracy', short: 'PA%', group: 'team_passing', scope: 'team', type: 'manual', unit: '%' },
  { id: 'ts-09', key: 'team_crosses', label: 'Crosses', short: 'CRS', group: 'team_passing', scope: 'team', type: 'computed',
    formula: { op: 'sum_individual', sourceStatKey: 'crosses', sourceScope: 'individual' } },
  // Defence
  { id: 'ts-10', key: 'team_tackles', label: 'Tackles', short: 'TKL', group: 'team_defence', scope: 'team', type: 'computed',
    formula: { op: 'sum_individual', sourceStatKey: 'tackles', sourceScope: 'individual' } },
  { id: 'ts-11', key: 'team_blocks', label: 'Blocks', short: 'BLK', group: 'team_defence', scope: 'team', type: 'computed',
    formula: { op: 'sum_individual', sourceStatKey: 'blocks', sourceScope: 'individual' } },
  { id: 'ts-12', key: 'team_interceptions', label: 'Interceptions', short: 'INT', group: 'team_defence', scope: 'team', type: 'computed',
    formula: { op: 'sum_individual', sourceStatKey: 'interceptions', sourceScope: 'individual' } },
  // Discipline
  { id: 'ts-13', key: 'team_fouls', label: 'Fouls', short: 'FLS', group: 'team_discipline', scope: 'team', type: 'computed',
    formula: { op: 'sum_individual', sourceStatKey: 'fouls', sourceScope: 'individual' } },
  { id: 'ts-14', key: 'team_yellow_cards', label: 'Yellow Cards', short: 'YC', group: 'team_discipline', scope: 'team', type: 'computed',
    formula: { op: 'sum_individual', sourceStatKey: 'yellow_cards', sourceScope: 'individual' } },
  { id: 'ts-15', key: 'team_red_cards', label: 'Red Cards', short: 'RC', group: 'team_discipline', scope: 'team', type: 'computed',
    formula: { op: 'sum_individual', sourceStatKey: 'red_cards', sourceScope: 'individual' } },
  // General
  { id: 'ts-16', key: 'team_possession', label: 'Possession', short: 'POS', group: 'team_general', scope: 'team', type: 'manual', unit: '%' },
  { id: 'ts-17', key: 'team_duels_won', label: 'Duels Won', short: 'DW', group: 'team_general', scope: 'team', type: 'computed',
    formula: { op: 'sum_individual', sourceStatKey: 'duels_won', sourceScope: 'individual' } },

  // ── INDIVIDUAL STATS ──────────────────────────────
  // Attack
  { id: 'is-01', key: 'goals', label: 'Goals', short: 'G', group: 'ind_attack', scope: 'individual', type: 'manual' },
  { id: 'is-02', key: 'assists', label: 'Assists', short: 'A', group: 'ind_attack', scope: 'individual', type: 'manual' },
  { id: 'is-03', key: 'shots', label: 'Shots', short: 'SH', group: 'ind_attack', scope: 'individual', type: 'manual' },
  { id: 'is-04', key: 'shots_on_target', label: 'Shots on Target', short: 'SOT', group: 'ind_attack', scope: 'individual', type: 'manual' },
  { id: 'is-05', key: 'shot_accuracy', label: 'Shot Accuracy', short: 'SA%', group: 'ind_attack', scope: 'individual', type: 'computed', unit: '%',
    formula: { op: 'percentage', numeratorKey: 'shots_on_target', denominatorKey: 'shots', sourceScope: 'individual' } },
  { id: 'is-06', key: 'chances_created', label: 'Chances Created', short: 'CC', group: 'ind_attack', scope: 'individual', type: 'manual' },
  { id: 'is-07', key: 'dribbles', label: 'Successful Dribbles', short: 'DRB', group: 'ind_attack', scope: 'individual', type: 'manual' },
  // Passing
  { id: 'is-08', key: 'passes', label: 'Passes', short: 'PAS', group: 'ind_passing', scope: 'individual', type: 'manual' },
  { id: 'is-09', key: 'pass_accuracy', label: 'Pass Accuracy', short: 'PA%', group: 'ind_passing', scope: 'individual', type: 'manual', unit: '%' },
  { id: 'is-10', key: 'key_passes', label: 'Key Passes', short: 'KP', group: 'ind_passing', scope: 'individual', type: 'manual' },
  { id: 'is-11', key: 'crosses', label: 'Crosses', short: 'CRS', group: 'ind_passing', scope: 'individual', type: 'manual' },
  // Defence
  { id: 'is-12', key: 'tackles', label: 'Tackles', short: 'TKL', group: 'ind_defence', scope: 'individual', type: 'manual' },
  { id: 'is-13', key: 'tackles_won', label: 'Tackles Won', short: 'TW', group: 'ind_defence', scope: 'individual', type: 'manual' },
  { id: 'is-14', key: 'tackle_success', label: 'Tackle Success', short: 'TS%', group: 'ind_defence', scope: 'individual', type: 'computed', unit: '%',
    formula: { op: 'percentage', numeratorKey: 'tackles_won', denominatorKey: 'tackles', sourceScope: 'individual' } },
  { id: 'is-15', key: 'blocks', label: 'Blocks', short: 'BLK', group: 'ind_defence', scope: 'individual', type: 'manual' },
  { id: 'is-16', key: 'interceptions', label: 'Interceptions', short: 'INT', group: 'ind_defence', scope: 'individual', type: 'manual' },
  { id: 'is-17', key: 'clearances', label: 'Clearances', short: 'CLR', group: 'ind_defence', scope: 'individual', type: 'manual' },
  // Discipline & General
  { id: 'is-18', key: 'minutes_played', label: 'Minutes Played', short: 'MIN', group: 'ind_discipline', scope: 'individual', type: 'manual' },
  { id: 'is-19', key: 'fouls', label: 'Fouls', short: 'FLS', group: 'ind_discipline', scope: 'individual', type: 'manual' },
  { id: 'is-20', key: 'fouls_won', label: 'Fouls Won', short: 'FW', group: 'ind_discipline', scope: 'individual', type: 'manual' },
  { id: 'is-21', key: 'yellow_cards', label: 'Yellow Cards', short: 'YC', group: 'ind_discipline', scope: 'individual', type: 'manual' },
  { id: 'is-22', key: 'red_cards', label: 'Red Cards', short: 'RC', group: 'ind_discipline', scope: 'individual', type: 'manual' },
  { id: 'is-23', key: 'duels_won', label: 'Duels Won', short: 'DW', group: 'ind_discipline', scope: 'individual', type: 'manual' },
  { id: 'is-24', key: 'aerial_won', label: 'Aerials Won', short: 'AW', group: 'ind_discipline', scope: 'individual', type: 'manual' },
];

// Helper: get formula display string
export function getFormulaDisplay(def: StatDefinition): string {
  if (def.type !== 'computed' || !def.formula) return 'Manual entry';
  const f = def.formula;
  switch (f.op) {
    case 'sum_individual': {
      const source = statDefinitions.find(d => d.key === f.sourceStatKey && d.scope === 'individual');
      return `SUM of individual "${source?.label || f.sourceStatKey}"`;
    }
    case 'percentage': {
      const num = statDefinitions.find(d => d.key === f.numeratorKey);
      const den = statDefinitions.find(d => d.key === f.denominatorKey);
      return `(${num?.label || f.numeratorKey} / ${den?.label || f.denominatorKey}) × 100`;
    }
    case 'divide': {
      const num = statDefinitions.find(d => d.key === f.numeratorKey);
      const den = statDefinitions.find(d => d.key === f.denominatorKey);
      return `${num?.label || f.numeratorKey} / ${den?.label || f.denominatorKey}`;
    }
    default: return 'Manual entry';
  }
}
