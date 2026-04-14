export interface Season {
  id: string;
  name: string;
  activityId: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'upcoming' | 'completed';
}

export const seasons: Season[] = [
  { id: 'sea-001', name: 'Football-Season-2025/26', activityId: 'act-football', startDate: '2025-08-01', endDate: '2026-05-31', status: 'active' },
  { id: 'sea-002', name: 'Football-Season-2026/27', activityId: 'act-football', startDate: '2026-08-01', endDate: '2027-05-31', status: 'upcoming' },
];
