export interface Team {
  id: string;
  name: string;
  shortName: string;
  color: string;
  memberCount: number;
  coachName: string;
}

export const teams: Team[] = [
  { id: 'first-team', name: 'First Team', shortName: 'FT', color: '#00A76F', memberCount: 25, coachName: 'James Carter' },
  { id: 'u21', name: 'Under-21', shortName: 'U21', color: '#007867', memberCount: 22, coachName: 'Elena Vasquez' },
  { id: 'u17', name: 'Under-17', shortName: 'U17', color: '#22C55E', memberCount: 20, coachName: 'Tom Fletcher' },
  { id: 'u15', name: 'Under-15', shortName: 'U15', color: '#4BC78C', memberCount: 18, coachName: 'Mike Reynolds' },
  { id: 'women-first', name: 'Women\'s First Team', shortName: 'WFT', color: '#8E33FF', memberCount: 24, coachName: 'Lisa Morgan' },
  { id: 'women-u21', name: 'Women\'s U-21', shortName: 'WU21', color: '#C684FF', memberCount: 20, coachName: 'Kate Bennett' },
];
