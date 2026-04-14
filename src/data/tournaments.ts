import { format, addDays, subDays } from 'date-fns';
import { teams } from '@/data/teams';
import { MatchStatus } from '@/data/events';

// ── Types ────────────────────────────────────────────────
export type TournamentStatus = 'draft' | 'registration' | 'active' | 'completed';
export type RegistrationType = 'invite_only' | 'open_signup' | 'hybrid';
export type BracketFormat = 'round_robin' | 'knockout' | 'group_playoffs';
export type HousingStatus = 'compliant' | 'pending' | 'exempt' | 'non_compliant';
export type TeamRegistrationStatus = 'confirmed' | 'pending' | 'waitlisted' | 'rejected';

export interface TournamentDivision {
  id: string;
  name: string;
  ageGroup: string;
  gender: 'boys' | 'girls' | 'mixed';
  teamLimit: number;
  registeredCount: number;
}

export interface TournamentTeam {
  id: string;
  teamId?: string;          // ref to teams.ts for local club teams
  externalName?: string;    // for visiting/external teams
  divisionId: string;
  registrationStatus: TeamRegistrationStatus;
  housingStatus: HousingStatus;
  isLocal: boolean;
  hotelId?: string;
  contactName: string;
  contactEmail: string;
  playerCount: number;
  remindersSent: number;
}

export interface TournamentHotel {
  id: string;
  name: string;
  distance: string;
  distanceKm: number;
  rate: string;
  rateValue: number;
  amenities: string[];
  bookingDeadline: string;
  bookingLink: string;
  roomsBooked: number;
  roomsTotal: number;
}

export interface TournamentMatch {
  id: string;
  divisionId: string;
  groupName?: string;
  round: string;
  roundNumber: number;
  homeTeamId: string;
  awayTeamId: string;
  venueId: string;
  venueName: string;
  dateTime: string;
  matchStatus: MatchStatus;
  scoreDisplay?: string;
  homeGoals?: number;
  awayGoals?: number;
  winnerId?: string;
}

export interface GroupStanding {
  teamId: string;
  teamName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export interface TournamentGroup {
  name: string;
  teamIds: string[];
  standings: GroupStanding[];
}

export interface TournamentBracket {
  divisionId: string;
  format: BracketFormat;
  groups?: TournamentGroup[];
}

export interface TournamentCompliance {
  totalTeams: number;
  compliant: number;
  pending: number;
  exempt: number;
  nonCompliant: number;
}

export interface TournamentRevenue {
  totalRoomNights: number;
  totalValue: number;
  commissionRate: number;
  commissionEarned: number;
  courtsideSplit: number;
  tournamentSplit: number;
  courtsideAmount: number;
  tournamentAmount: number;
}

export interface Tournament {
  id: string;
  name: string;
  description: string;
  sport: string;
  location: { city: string; venue: string; address: string };
  startDate: string;
  endDate: string;
  registrationType: RegistrationType;
  status: TournamentStatus;
  localRadius: number;
  divisions: TournamentDivision[];
  teams: TournamentTeam[];
  hotels: TournamentHotel[];
  brackets: TournamentBracket[];
  matches: TournamentMatch[];
  compliance: TournamentCompliance;
  revenue: TournamentRevenue;
}

// ── Status configs ───────────────────────────────────────
export const tournamentStatusConfig: Record<TournamentStatus, { label: string; bg: string; text: string }> = {
  draft:        { label: 'Draft',        bg: 'bg-dark-100',   text: 'text-dark-500' },
  registration: { label: 'Registration', bg: 'bg-blue-50',    text: 'text-blue-600' },
  active:       { label: 'Active',       bg: 'bg-green-50',   text: 'text-green-600' },
  completed:    { label: 'Completed',    bg: 'bg-dark-50',    text: 'text-dark-400' },
};

export const housingStatusConfig: Record<HousingStatus, { label: string; bg: string; text: string }> = {
  compliant:     { label: 'Compliant',     bg: 'bg-green-50',  text: 'text-green-600' },
  pending:       { label: 'Pending',       bg: 'bg-yellow-50', text: 'text-yellow-600' },
  exempt:        { label: 'Exempt',        bg: 'bg-blue-50',   text: 'text-blue-600' },
  non_compliant: { label: 'Non-Compliant', bg: 'bg-red-50',    text: 'text-red-600' },
};

export const teamRegStatusConfig: Record<TeamRegistrationStatus, { label: string; bg: string; text: string }> = {
  confirmed:  { label: 'Confirmed',  bg: 'bg-green-50',  text: 'text-green-600' },
  pending:    { label: 'Pending',    bg: 'bg-yellow-50', text: 'text-yellow-600' },
  waitlisted: { label: 'Waitlisted', bg: 'bg-blue-50',   text: 'text-blue-600' },
  rejected:   { label: 'Rejected',   bg: 'bg-red-50',    text: 'text-red-600' },
};

export const matchStatusConfig: Record<MatchStatus, { label: string; bg: string; text: string; dot: string }> = {
  not_entered: { label: 'Not Entered', bg: 'bg-dark-100',   text: 'text-dark-500',   dot: 'bg-dark-400' },
  scheduled:   { label: 'Scheduled',   bg: 'bg-blue-50',    text: 'text-blue-600',   dot: 'bg-blue-500' },
  live:        { label: 'Live',        bg: 'bg-red-50',     text: 'text-red-600',    dot: 'bg-red-500' },
  final:       { label: 'Full Time',   bg: 'bg-green-50',   text: 'text-green-600',  dot: 'bg-green-500' },
  postponed:   { label: 'Postponed',   bg: 'bg-yellow-50',  text: 'text-yellow-600', dot: 'bg-yellow-500' },
  cancelled:   { label: 'Cancelled',   bg: 'bg-dark-100',   text: 'text-dark-500',   dot: 'bg-dark-400' },
  abandoned:   { label: 'Abandoned',   bg: 'bg-orange-50',  text: 'text-orange-600', dot: 'bg-orange-500' },
};

// ── Helpers ──────────────────────────────────────────────
export function getTournamentTeamName(team: TournamentTeam): string {
  if (team.teamId) {
    const club = teams.find(t => t.id === team.teamId);
    return club ? club.name : team.externalName || 'Unknown';
  }
  return team.externalName || 'Unknown';
}

export function getTeamColor(team: TournamentTeam): string {
  if (team.teamId) {
    const club = teams.find(t => t.id === team.teamId);
    if (club) return club.color;
  }
  // Hash-based color for external teams
  const colors = ['#FF5630', '#FFAB00', '#36B37E', '#00B8D9', '#6554C0', '#FF6C40', '#8E33FF'];
  let hash = 0;
  const name = team.externalName || team.id;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export function getMatchTeamName(teamId: string, tournament: Tournament): string {
  const tt = tournament.teams.find(t => t.id === teamId);
  return tt ? getTournamentTeamName(tt) : 'TBD';
}

export function getDivisionTeams(divisionId: string, tournament: Tournament): TournamentTeam[] {
  return tournament.teams.filter(t => t.divisionId === divisionId);
}

export function getDivisionMatches(divisionId: string, tournament: Tournament): TournamentMatch[] {
  return tournament.matches.filter(m => m.divisionId === divisionId);
}

// ── Dummy Data ───────────────────────────────────────────
const now = new Date();

export const tournaments: Tournament[] = [
  {
    id: 'tour-001',
    name: 'Courtside Premier Cup 2026',
    description: 'Annual youth football tournament bringing together the best academy teams from across the country. Group stage followed by knockout rounds across three age divisions.',
    sport: 'football',
    location: { city: 'London', venue: 'Courtside Stadium & Training Ground', address: 'Courtside Way, London, SE1 2AB' },
    startDate: format(subDays(now, 3), 'yyyy-MM-dd'),
    endDate: format(addDays(now, 11), 'yyyy-MM-dd'),
    registrationType: 'hybrid',
    status: 'active',
    localRadius: 50,

    divisions: [
      { id: 'div-u12', name: 'U-12 Boys', ageGroup: 'Under 12', gender: 'boys', teamLimit: 8, registeredCount: 6 },
      { id: 'div-u14', name: 'U-14 Boys', ageGroup: 'Under 14', gender: 'boys', teamLimit: 8, registeredCount: 8 },
      { id: 'div-u17', name: 'U-17 Mixed', ageGroup: 'Under 17', gender: 'mixed', teamLimit: 8, registeredCount: 6 },
    ],

    teams: [
      // Local teams (from teams.ts)
      { id: 'tt-01', teamId: 'u17',        divisionId: 'div-u17', registrationStatus: 'confirmed', housingStatus: 'exempt',  isLocal: true,  contactName: 'Elena Vasquez',  contactEmail: 'elena@fccourtside.com', playerCount: 18, remindersSent: 0 },
      { id: 'tt-02', teamId: 'u15',        divisionId: 'div-u12', registrationStatus: 'confirmed', housingStatus: 'exempt',  isLocal: true,  contactName: 'Elena Vasquez',  contactEmail: 'elena@fccourtside.com', playerCount: 16, remindersSent: 0 },
      { id: 'tt-03', teamId: 'women-u21',  divisionId: 'div-u17', registrationStatus: 'confirmed', housingStatus: 'exempt',  isLocal: true,  contactName: 'Lisa Morgan',    contactEmail: 'lisa@fccourtside.com',  playerCount: 20, remindersSent: 0 },
      // Non-local teams (external)
      { id: 'tt-04', externalName: 'Riverside Youth FC',  divisionId: 'div-u14', registrationStatus: 'confirmed', housingStatus: 'compliant',     isLocal: false, hotelId: 'hotel-01', contactName: 'Mark Thompson',  contactEmail: 'mark@riverside-fc.com',   playerCount: 18, remindersSent: 0 },
      { id: 'tt-05', externalName: 'Northgate Academy',   divisionId: 'div-u14', registrationStatus: 'confirmed', housingStatus: 'compliant',     isLocal: false, hotelId: 'hotel-02', contactName: 'Sarah Jones',    contactEmail: 'sarah@northgateacad.com', playerCount: 16, remindersSent: 0 },
      { id: 'tt-06', externalName: 'Metro City Juniors',  divisionId: 'div-u14', registrationStatus: 'pending',   housingStatus: 'pending',       isLocal: false, contactName: 'David Lee',      contactEmail: 'david@metrocity-fc.com',  playerCount: 17, remindersSent: 1 },
      { id: 'tt-07', externalName: 'Hillcrest Rangers',   divisionId: 'div-u12', registrationStatus: 'confirmed', housingStatus: 'non_compliant', isLocal: false, contactName: 'Tom Williams',   contactEmail: 'tom@hillcrest.org',       playerCount: 15, remindersSent: 3 },
      { id: 'tt-08', externalName: 'Valley United',       divisionId: 'div-u12', registrationStatus: 'confirmed', housingStatus: 'compliant',     isLocal: false, hotelId: 'hotel-03', contactName: 'James Brown',    contactEmail: 'james@valleyunited.com',  playerCount: 16, remindersSent: 0 },
      { id: 'tt-09', externalName: 'Brighton Colts',      divisionId: 'div-u14', registrationStatus: 'confirmed', housingStatus: 'compliant',     isLocal: false, hotelId: 'hotel-01', contactName: 'Amy Davis',      contactEmail: 'amy@brightoncolts.com',   playerCount: 18, remindersSent: 0 },
      { id: 'tt-10', externalName: 'Manchester Storm',    divisionId: 'div-u17', registrationStatus: 'confirmed', housingStatus: 'compliant',     isLocal: false, hotelId: 'hotel-02', contactName: 'Chris Taylor',   contactEmail: 'chris@manstorm.com',      playerCount: 19, remindersSent: 0 },
      { id: 'tt-11', externalName: 'Leeds Phoenix',       divisionId: 'div-u17', registrationStatus: 'confirmed', housingStatus: 'pending',       isLocal: false, contactName: 'Rachel Green',   contactEmail: 'rachel@leedsphoenix.com', playerCount: 17, remindersSent: 2 },
      { id: 'tt-12', externalName: 'Sheffield Blades U12',divisionId: 'div-u12', registrationStatus: 'confirmed', housingStatus: 'compliant',     isLocal: false, hotelId: 'hotel-03', contactName: 'Mike Clark',     contactEmail: 'mike@sheffblades.com',    playerCount: 15, remindersSent: 0 },
      { id: 'tt-13', externalName: 'Liverpool Stars',     divisionId: 'div-u14', registrationStatus: 'confirmed', housingStatus: 'compliant',     isLocal: false, hotelId: 'hotel-01', contactName: 'Kate Wilson',    contactEmail: 'kate@livstars.com',       playerCount: 17, remindersSent: 0 },
      { id: 'tt-14', externalName: 'Birmingham Lions',    divisionId: 'div-u14', registrationStatus: 'confirmed', housingStatus: 'compliant',     isLocal: false, hotelId: 'hotel-02', contactName: 'Dan Martin',     contactEmail: 'dan@birmlions.com',       playerCount: 16, remindersSent: 0 },
      { id: 'tt-15', externalName: 'Cardiff Dragons',     divisionId: 'div-u17', registrationStatus: 'confirmed', housingStatus: 'compliant',     isLocal: false, hotelId: 'hotel-01', contactName: 'Owen Roberts',   contactEmail: 'owen@cardiffdragons.com', playerCount: 18, remindersSent: 0 },
      { id: 'tt-16', externalName: 'Nottingham Forest U12', divisionId: 'div-u12', registrationStatus: 'waitlisted', housingStatus: 'pending',   isLocal: false, contactName: 'Gary Hill',     contactEmail: 'gary@nottmforest-u12.com', playerCount: 14, remindersSent: 0 },
      { id: 'tt-17', externalName: 'Plymouth Argyle Youth', divisionId: 'div-u12', registrationStatus: 'confirmed', housingStatus: 'compliant',   isLocal: false, hotelId: 'hotel-03', contactName: 'Ben White', contactEmail: 'ben@plymouthyouth.com', playerCount: 15, remindersSent: 0 },
    ],

    hotels: [
      { id: 'hotel-01', name: 'Courtside Grand Hotel', distance: '0.5 km', distanceKm: 0.5, rate: '$130/night', rateValue: 130, amenities: ['Pool', 'Gym', 'Breakfast', 'Wi-Fi', 'Parking'], bookingDeadline: format(addDays(now, 5), 'yyyy-MM-dd'), bookingLink: 'https://courtsidegrand.com/book?group=PREMIER-CUP-2026', roomsBooked: 42, roomsTotal: 60 },
      { id: 'hotel-02', name: 'Stadium View Inn', distance: '1.2 km', distanceKm: 1.2, rate: '$95/night', rateValue: 95, amenities: ['Breakfast', 'Wi-Fi', 'Parking'], bookingDeadline: format(addDays(now, 5), 'yyyy-MM-dd'), bookingLink: 'https://stadiumview.com/groups/CPC2026', roomsBooked: 35, roomsTotal: 50 },
      { id: 'hotel-03', name: 'City Center Suites', distance: '3.8 km', distanceKm: 3.8, rate: '$110/night', rateValue: 110, amenities: ['Pool', 'Gym', 'Restaurant', 'Wi-Fi', 'Shuttle'], bookingDeadline: format(addDays(now, 3), 'yyyy-MM-dd'), bookingLink: 'https://citycenter.com/group-booking/CPC26', roomsBooked: 28, roomsTotal: 40 },
    ],

    brackets: [
      {
        divisionId: 'div-u14',
        format: 'group_playoffs',
        groups: [
          {
            name: 'Group A',
            teamIds: ['tt-04', 'tt-05', 'tt-09', 'tt-13'],
            standings: [
              { teamId: 'tt-04', teamName: 'Riverside Youth FC',  played: 3, won: 2, drawn: 1, lost: 0, goalsFor: 7, goalsAgainst: 2, goalDifference: 5,  points: 7 },
              { teamId: 'tt-09', teamName: 'Brighton Colts',      played: 3, won: 2, drawn: 0, lost: 1, goalsFor: 5, goalsAgainst: 3, goalDifference: 2,  points: 6 },
              { teamId: 'tt-13', teamName: 'Liverpool Stars',     played: 3, won: 1, drawn: 1, lost: 1, goalsFor: 4, goalsAgainst: 4, goalDifference: 0,  points: 4 },
              { teamId: 'tt-05', teamName: 'Northgate Academy',   played: 3, won: 0, drawn: 0, lost: 3, goalsFor: 1, goalsAgainst: 8, goalDifference: -7, points: 0 },
            ],
          },
          {
            name: 'Group B',
            teamIds: ['tt-06', 'tt-14', 'tt-04', 'tt-05'],
            standings: [
              { teamId: 'tt-14', teamName: 'Birmingham Lions',    played: 2, won: 2, drawn: 0, lost: 0, goalsFor: 5, goalsAgainst: 1, goalDifference: 4, points: 6 },
              { teamId: 'tt-06', teamName: 'Metro City Juniors',  played: 2, won: 1, drawn: 0, lost: 1, goalsFor: 3, goalsAgainst: 3, goalDifference: 0, points: 3 },
            ],
          },
        ],
      },
      {
        divisionId: 'div-u12',
        format: 'round_robin',
        groups: [
          {
            name: 'League',
            teamIds: ['tt-02', 'tt-07', 'tt-08', 'tt-12', 'tt-17'],
            standings: [
              { teamId: 'tt-08', teamName: 'Valley United',        played: 3, won: 2, drawn: 1, lost: 0, goalsFor: 6, goalsAgainst: 2, goalDifference: 4, points: 7 },
              { teamId: 'tt-02', teamName: 'FC Courtside U-15',    played: 3, won: 2, drawn: 0, lost: 1, goalsFor: 5, goalsAgainst: 3, goalDifference: 2, points: 6 },
              { teamId: 'tt-12', teamName: 'Sheffield Blades U12', played: 3, won: 1, drawn: 1, lost: 1, goalsFor: 4, goalsAgainst: 4, goalDifference: 0, points: 4 },
              { teamId: 'tt-17', teamName: 'Plymouth Argyle Youth',played: 2, won: 1, drawn: 0, lost: 1, goalsFor: 3, goalsAgainst: 3, goalDifference: 0, points: 3 },
              { teamId: 'tt-07', teamName: 'Hillcrest Rangers',    played: 3, won: 0, drawn: 0, lost: 3, goalsFor: 1, goalsAgainst: 7, goalDifference: -6, points: 0 },
            ],
          },
        ],
      },
      {
        divisionId: 'div-u17',
        format: 'round_robin',
        groups: [
          {
            name: 'League',
            teamIds: ['tt-01', 'tt-03', 'tt-10', 'tt-11', 'tt-15'],
            standings: [
              { teamId: 'tt-10', teamName: 'Manchester Storm',    played: 2, won: 2, drawn: 0, lost: 0, goalsFor: 5, goalsAgainst: 1, goalDifference: 4, points: 6 },
              { teamId: 'tt-01', teamName: 'FC Courtside U-17',   played: 2, won: 1, drawn: 1, lost: 0, goalsFor: 4, goalsAgainst: 2, goalDifference: 2, points: 4 },
              { teamId: 'tt-15', teamName: 'Cardiff Dragons',     played: 2, won: 1, drawn: 0, lost: 1, goalsFor: 3, goalsAgainst: 3, goalDifference: 0, points: 3 },
              { teamId: 'tt-03', teamName: 'FC Courtside Women U-21', played: 2, won: 0, drawn: 1, lost: 1, goalsFor: 2, goalsAgainst: 4, goalDifference: -2, points: 1 },
              { teamId: 'tt-11', teamName: 'Leeds Phoenix',       played: 2, won: 0, drawn: 0, lost: 2, goalsFor: 1, goalsAgainst: 5, goalDifference: -4, points: 0 },
            ],
          },
        ],
      },
    ],

    matches: [
      // U-14 Group A — played
      { id: 'tm-01', divisionId: 'div-u14', groupName: 'Group A', round: 'Matchday 1', roundNumber: 1, homeTeamId: 'tt-04', awayTeamId: 'tt-05', venueId: 'f-04', venueName: 'Training Pitch A', dateTime: format(subDays(now, 3), 'yyyy-MM-dd') + 'T10:00', matchStatus: 'final', scoreDisplay: '3-0', homeGoals: 3, awayGoals: 0, winnerId: 'tt-04' },
      { id: 'tm-02', divisionId: 'div-u14', groupName: 'Group A', round: 'Matchday 1', roundNumber: 1, homeTeamId: 'tt-09', awayTeamId: 'tt-13', venueId: 'f-05', venueName: 'Training Pitch B', dateTime: format(subDays(now, 3), 'yyyy-MM-dd') + 'T12:00', matchStatus: 'final', scoreDisplay: '2-1', homeGoals: 2, awayGoals: 1, winnerId: 'tt-09' },
      { id: 'tm-03', divisionId: 'div-u14', groupName: 'Group A', round: 'Matchday 2', roundNumber: 2, homeTeamId: 'tt-04', awayTeamId: 'tt-09', venueId: 'f-04', venueName: 'Training Pitch A', dateTime: format(subDays(now, 1), 'yyyy-MM-dd') + 'T10:00', matchStatus: 'final', scoreDisplay: '1-1', homeGoals: 1, awayGoals: 1 },
      { id: 'tm-04', divisionId: 'div-u14', groupName: 'Group A', round: 'Matchday 2', roundNumber: 2, homeTeamId: 'tt-13', awayTeamId: 'tt-05', venueId: 'f-05', venueName: 'Training Pitch B', dateTime: format(subDays(now, 1), 'yyyy-MM-dd') + 'T12:00', matchStatus: 'final', scoreDisplay: '2-0', homeGoals: 2, awayGoals: 0, winnerId: 'tt-13' },
      { id: 'tm-05', divisionId: 'div-u14', groupName: 'Group A', round: 'Matchday 3', roundNumber: 3, homeTeamId: 'tt-04', awayTeamId: 'tt-13', venueId: 'f-01', venueName: 'Main Pitch', dateTime: format(addDays(now, 1), 'yyyy-MM-dd') + 'T10:00', matchStatus: 'scheduled' },
      { id: 'tm-06', divisionId: 'div-u14', groupName: 'Group A', round: 'Matchday 3', roundNumber: 3, homeTeamId: 'tt-09', awayTeamId: 'tt-05', venueId: 'f-04', venueName: 'Training Pitch A', dateTime: format(addDays(now, 1), 'yyyy-MM-dd') + 'T12:00', matchStatus: 'scheduled' },
      // U-12 League — mixed played/upcoming
      { id: 'tm-07', divisionId: 'div-u12', groupName: 'League', round: 'Matchday 1', roundNumber: 1, homeTeamId: 'tt-08', awayTeamId: 'tt-07', venueId: 'f-10', venueName: 'Academy Pitch 1', dateTime: format(subDays(now, 2), 'yyyy-MM-dd') + 'T09:00', matchStatus: 'final', scoreDisplay: '3-0', homeGoals: 3, awayGoals: 0, winnerId: 'tt-08' },
      { id: 'tm-08', divisionId: 'div-u12', groupName: 'League', round: 'Matchday 1', roundNumber: 1, homeTeamId: 'tt-02', awayTeamId: 'tt-12', venueId: 'f-11', venueName: 'Academy Pitch 2', dateTime: format(subDays(now, 2), 'yyyy-MM-dd') + 'T11:00', matchStatus: 'final', scoreDisplay: '2-1', homeGoals: 2, awayGoals: 1, winnerId: 'tt-02' },
      { id: 'tm-09', divisionId: 'div-u12', groupName: 'League', round: 'Matchday 2', roundNumber: 2, homeTeamId: 'tt-08', awayTeamId: 'tt-02', venueId: 'f-10', venueName: 'Academy Pitch 1', dateTime: format(addDays(now, 2), 'yyyy-MM-dd') + 'T09:00', matchStatus: 'scheduled' },
      { id: 'tm-10', divisionId: 'div-u12', groupName: 'League', round: 'Matchday 2', roundNumber: 2, homeTeamId: 'tt-12', awayTeamId: 'tt-07', venueId: 'f-11', venueName: 'Academy Pitch 2', dateTime: format(addDays(now, 2), 'yyyy-MM-dd') + 'T11:00', matchStatus: 'scheduled' },
      // U-17 League — mixed
      { id: 'tm-11', divisionId: 'div-u17', groupName: 'League', round: 'Matchday 1', roundNumber: 1, homeTeamId: 'tt-10', awayTeamId: 'tt-11', venueId: 'f-01', venueName: 'Main Pitch', dateTime: format(subDays(now, 2), 'yyyy-MM-dd') + 'T14:00', matchStatus: 'final', scoreDisplay: '3-1', homeGoals: 3, awayGoals: 1, winnerId: 'tt-10' },
      { id: 'tm-12', divisionId: 'div-u17', groupName: 'League', round: 'Matchday 1', roundNumber: 1, homeTeamId: 'tt-01', awayTeamId: 'tt-03', venueId: 'f-04', venueName: 'Training Pitch A', dateTime: format(subDays(now, 2), 'yyyy-MM-dd') + 'T16:00', matchStatus: 'final', scoreDisplay: '2-2', homeGoals: 2, awayGoals: 2 },
      { id: 'tm-13', divisionId: 'div-u17', groupName: 'League', round: 'Matchday 2', roundNumber: 2, homeTeamId: 'tt-10', awayTeamId: 'tt-15', venueId: 'f-01', venueName: 'Main Pitch', dateTime: format(subDays(now, 1), 'yyyy-MM-dd') + 'T14:00', matchStatus: 'final', scoreDisplay: '2-0', homeGoals: 2, awayGoals: 0, winnerId: 'tt-10' },
      { id: 'tm-14', divisionId: 'div-u17', groupName: 'League', round: 'Matchday 2', roundNumber: 2, homeTeamId: 'tt-01', awayTeamId: 'tt-11', venueId: 'f-04', venueName: 'Training Pitch A', dateTime: format(subDays(now, 1), 'yyyy-MM-dd') + 'T16:00', matchStatus: 'final', scoreDisplay: '2-0', homeGoals: 2, awayGoals: 0, winnerId: 'tt-01' },
      { id: 'tm-15', divisionId: 'div-u17', groupName: 'League', round: 'Matchday 3', roundNumber: 3, homeTeamId: 'tt-15', awayTeamId: 'tt-01', venueId: 'f-01', venueName: 'Main Pitch', dateTime: format(addDays(now, 3), 'yyyy-MM-dd') + 'T14:00', matchStatus: 'scheduled' },
      { id: 'tm-16', divisionId: 'div-u17', groupName: 'League', round: 'Matchday 3', roundNumber: 3, homeTeamId: 'tt-03', awayTeamId: 'tt-10', venueId: 'f-04', venueName: 'Training Pitch A', dateTime: format(addDays(now, 3), 'yyyy-MM-dd') + 'T16:00', matchStatus: 'scheduled' },
    ],

    compliance: {
      totalTeams: 17,
      compliant: 9,
      pending: 3,
      exempt: 3,
      nonCompliant: 1,
    },

    revenue: {
      totalRoomNights: 180,
      totalValue: 23400,
      commissionRate: 15,
      commissionEarned: 3510,
      courtsideSplit: 60,
      tournamentSplit: 40,
      courtsideAmount: 2106,
      tournamentAmount: 1404,
    },
  },
];
