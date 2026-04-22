// ── Planner Data Model ─────────────────────────────────

export interface PlannerCycle {
  id: string;
  seasonId: string;
  name: string;
  startDate: string;
  endDate: string;
  color: string;
}

export interface PlannerBlock {
  id: string;
  cycleId: string;
  trackId: string;
  name: string;
  startDate: string;
  endDate: string;
  color: string;
  attributeIds: string[];
}

export interface TrackGroup {
  id: string;
  seasonId: string;
  name: string;
  color: string;
}

export interface Track {
  id: string;
  trackGroupId: string;
  name: string;
  attributeIds: string[];
  userIds: string[];
  teamIds: string[];
}

export interface DayPlan {
  id: string;
  trackId: string;
  date: string;
  cycleId: string;
  blockId: string;
  drillIds: string[];
  notes?: string;
  userIds: string[];
  teamIds: string[];
  inheritUsersFromTrack: boolean;
  durationMinutes: number;
}

// ── Mock Data ─────────────────────────────────────────

export const plannerCycles: PlannerCycle[] = [
  { id: 'cyc-01', seasonId: 'sea-001', name: 'Pre-season', startDate: '2025-08-01', endDate: '2025-09-14', color: '#C8E6C9' },
  { id: 'cyc-02', seasonId: 'sea-001', name: 'In season', startDate: '2025-09-15', endDate: '2026-04-15', color: '#FFF9C4' },
  { id: 'cyc-03', seasonId: 'sea-001', name: 'Vacations', startDate: '2026-04-16', endDate: '2026-05-31', color: '#FFE0B2' },
];

export const trackGroups: TrackGroup[] = [
  { id: 'tg-01', seasonId: 'sea-001', name: 'Mid-fielders', color: '#8E33FF' },
  { id: 'tg-02', seasonId: 'sea-001', name: 'Bowlers', color: '#00A76F' },
  { id: 'tg-03', seasonId: 'sea-001', name: 'Batters', color: '#FF5630' },
  { id: 'tg-04', seasonId: 'sea-001', name: 'Defenders', color: '#00B8D9' },
];

export const tracks: Track[] = [
  // Mid-fielders
  { id: 'tr-01', trackGroupId: 'tg-01', name: 'Dribbling', attributeIds: ['attr-01', 'attr-12'], userIds: ['usr-06', 'usr-07'], teamIds: ['team-first'] },
  { id: 'tr-02', trackGroupId: 'tg-01', name: 'Shooting', attributeIds: ['attr-02', 'attr-09'], userIds: ['usr-06', 'usr-08'], teamIds: [] },
  // Bowlers
  { id: 'tr-03', trackGroupId: 'tg-02', name: 'Fast', attributeIds: ['attr-07', 'attr-05'], userIds: ['usr-09', 'usr-10'], teamIds: [] },
  { id: 'tr-04', trackGroupId: 'tg-02', name: 'Spin', attributeIds: ['attr-03', 'attr-08'], userIds: ['usr-11'], teamIds: [] },
  // Batters
  { id: 'tr-05', trackGroupId: 'tg-03', name: 'Power Hitting', attributeIds: ['attr-02', 'attr-07'], userIds: ['usr-12', 'usr-13'], teamIds: [] },
  { id: 'tr-06', trackGroupId: 'tg-03', name: 'Technique', attributeIds: ['attr-12', 'attr-09'], userIds: ['usr-14'], teamIds: [] },
  // Defenders
  { id: 'tr-07', trackGroupId: 'tg-04', name: 'Aerial Duels', attributeIds: ['attr-11', 'attr-04'], userIds: ['usr-15', 'usr-16'], teamIds: [] },
  { id: 'tr-08', trackGroupId: 'tg-04', name: 'Tackling', attributeIds: ['attr-05', 'attr-04'], userIds: ['usr-15'], teamIds: [] },
];

export const plannerBlocks: PlannerBlock[] = [
  // Mid-fielders — Dribbling
  { id: 'blk-01', cycleId: 'cyc-01', trackId: 'tr-01', name: 'Block 2 title', startDate: '2025-08-01', endDate: '2025-09-05', color: '#C8E6C9', attributeIds: ['attr-01'] },
  { id: 'blk-02', cycleId: 'cyc-01', trackId: 'tr-01', name: 'Block', startDate: '2025-09-06', endDate: '2025-09-14', color: '#FFCDD2', attributeIds: ['attr-12'] },
  { id: 'blk-03', cycleId: 'cyc-02', trackId: 'tr-01', name: 'Block 3 title', startDate: '2025-11-01', endDate: '2026-01-15', color: '#E1BEE7', attributeIds: ['attr-01', 'attr-12'] },
  // Mid-fielders — Shooting
  { id: 'blk-04', cycleId: 'cyc-01', trackId: 'tr-02', name: 'Block 2 title', startDate: '2025-08-01', endDate: '2025-08-31', color: '#B3E5FC', attributeIds: ['attr-02'] },
  { id: 'blk-05', cycleId: 'cyc-02', trackId: 'tr-02', name: 'Overall block', startDate: '2025-09-15', endDate: '2025-11-15', color: '#C8E6C9', attributeIds: ['attr-09'] },
  { id: 'blk-06', cycleId: 'cyc-02', trackId: 'tr-02', name: 'Block 3 title', startDate: '2025-12-01', endDate: '2026-01-31', color: '#FFE0B2', attributeIds: ['attr-02', 'attr-09'] },
  // Mid-fielders (main row)
  { id: 'blk-07', cycleId: 'cyc-01', trackId: 'tr-01', name: 'Training', startDate: '2025-08-01', endDate: '2025-09-14', color: '#C8E6C9', attributeIds: ['attr-01', 'attr-03'] },
  // Bowlers
  { id: 'blk-08', cycleId: 'cyc-01', trackId: 'tr-03', name: 'Overall block', startDate: '2025-08-01', endDate: '2025-10-15', color: '#C8E6C9', attributeIds: ['attr-07'] },
  { id: 'blk-09', cycleId: 'cyc-02', trackId: 'tr-03', name: 'Block 2 title', startDate: '2025-10-16', endDate: '2025-12-31', color: '#FFF9C4', attributeIds: ['attr-05'] },
  { id: 'blk-10', cycleId: 'cyc-02', trackId: 'tr-03', name: 'Block', startDate: '2026-01-01', endDate: '2026-02-28', color: '#FFCDD2', attributeIds: ['attr-07', 'attr-05'] },
  // Bowlers — Fast
  { id: 'blk-11', cycleId: 'cyc-01', trackId: 'tr-03', name: 'Block 3 title', startDate: '2025-08-01', endDate: '2025-09-14', color: '#B3E5FC', attributeIds: ['attr-07'] },
  { id: 'blk-12', cycleId: 'cyc-02', trackId: 'tr-03', name: 'Block 2 title', startDate: '2025-10-01', endDate: '2025-12-15', color: '#FFE0B2', attributeIds: ['attr-05'] },
  // Bowlers — Spin
  { id: 'blk-13', cycleId: 'cyc-01', trackId: 'tr-04', name: 'Overall block', startDate: '2025-08-01', endDate: '2025-10-31', color: '#C8E6C9', attributeIds: ['attr-03', 'attr-08'] },
  { id: 'blk-14', cycleId: 'cyc-02', trackId: 'tr-04', name: 'Block 2 title', startDate: '2025-11-01', endDate: '2026-01-15', color: '#E1BEE7', attributeIds: ['attr-08'] },
  { id: 'blk-15', cycleId: 'cyc-03', trackId: 'tr-04', name: 'Block 3 title', startDate: '2026-04-16', endDate: '2026-05-31', color: '#FFE0B2', attributeIds: ['attr-03'] },
];

export const dayPlans: DayPlan[] = [
  { id: 'dp-01', trackId: 'tr-01', date: '2025-08-04', cycleId: 'cyc-01', blockId: 'blk-01', drillIds: ['drill-03', 'drill-07'], notes: 'Focus on close control', userIds: ['usr-06', 'usr-07'], teamIds: [], inheritUsersFromTrack: true, durationMinutes: 60 },
  { id: 'dp-02', trackId: 'tr-01', date: '2025-08-05', cycleId: 'cyc-01', blockId: 'blk-01', drillIds: ['drill-01', 'drill-13'], userIds: ['usr-06', 'usr-07'], teamIds: [], inheritUsersFromTrack: true, durationMinutes: 45 },
  { id: 'dp-03', trackId: 'tr-02', date: '2025-08-04', cycleId: 'cyc-01', blockId: 'blk-04', drillIds: ['drill-02', 'drill-16'], notes: 'Work on weak foot finishing', userIds: ['usr-06', 'usr-08'], teamIds: [], inheritUsersFromTrack: true, durationMinutes: 50 },
  { id: 'dp-04', trackId: 'tr-03', date: '2025-08-06', cycleId: 'cyc-01', blockId: 'blk-08', drillIds: ['drill-08', 'drill-11'], userIds: ['usr-09', 'usr-10'], teamIds: [], inheritUsersFromTrack: true, durationMinutes: 55 },
  { id: 'dp-05', trackId: 'tr-04', date: '2025-08-04', cycleId: 'cyc-01', blockId: 'blk-13', drillIds: ['drill-10', 'drill-12'], userIds: ['usr-11'], teamIds: [], inheritUsersFromTrack: true, durationMinutes: 40 },
  { id: 'dp-06', trackId: 'tr-07', date: '2025-08-05', cycleId: 'cyc-01', blockId: 'blk-01', drillIds: ['drill-05', 'drill-09'], notes: 'Headers from set pieces', userIds: ['usr-15', 'usr-16'], teamIds: [], inheritUsersFromTrack: true, durationMinutes: 45 },
];
