export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'player' | 'coach' | 'staff' | 'admin' | 'medical';
  designation: string;
  avatar: string;
  teamIds: string[];
  status: 'active' | 'injured' | 'suspended';
  jerseyNumber?: number;
  position?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  nationality?: string;
  countryOfResidence?: string;
  athleteRegistrationId?: string;
  parentGuardian?: { name: string; email: string; phone: string; relationship: string };
}

export const currentUser: User = {
  id: 'u-001',
  firstName: 'Marcus',
  lastName: 'Reid',
  email: 'marcus.reid@fccourtside.com',
  role: 'admin',
  designation: 'Technical Director',
  avatar: 'MR',
  teamIds: ['first-team'],
  status: 'active',
};

export const users: User[] = [
  currentUser,
  { id: 'u-002', firstName: 'James', lastName: 'Carter', email: 'j.carter@fccourtside.com', role: 'coach', designation: 'Head Coach', avatar: 'JC', teamIds: ['first-team'], status: 'active' },
  { id: 'u-003', firstName: 'Elena', lastName: 'Vasquez', email: 'e.vasquez@fccourtside.com', role: 'coach', designation: 'Assistant Coach', avatar: 'EV', teamIds: ['first-team', 'u21'], status: 'active' },
  { id: 'u-004', firstName: 'Ryan', lastName: 'Mitchell', email: 'r.mitchell@fccourtside.com', role: 'coach', designation: 'Goalkeeping Coach', avatar: 'RM', teamIds: ['first-team'], status: 'active' },
  { id: 'u-005', firstName: 'Sarah', lastName: 'O\'Brien', email: 's.obrien@fccourtside.com', role: 'medical', designation: 'Head Physiotherapist', avatar: 'SO', teamIds: ['first-team', 'u21'], status: 'active' },
  { id: 'u-006', firstName: 'Daniel', lastName: 'Kim', email: 'd.kim@fccourtside.com', role: 'staff', designation: 'Performance Analyst', avatar: 'DK', teamIds: ['first-team'], status: 'active' },
  // First Team Players
  { id: 'p-001', firstName: 'Liam', lastName: 'Henderson', email: 'l.henderson@fccourtside.com', role: 'player', designation: 'Player', avatar: 'LH', teamIds: ['first-team'], status: 'active', jerseyNumber: 1, position: 'Goalkeeper', dateOfBirth: '1998-03-15', gender: 'male', nationality: 'British', countryOfResidence: 'United Kingdom', athleteRegistrationId: 'areg-001' },
  { id: 'p-002', firstName: 'Marcus', lastName: 'Williams', email: 'm.williams@fccourtside.com', role: 'player', designation: 'Player', avatar: 'MW', teamIds: ['first-team'], status: 'active', jerseyNumber: 4, position: 'Centre-Back', dateOfBirth: '2007-11-22', gender: 'male', nationality: 'British', countryOfResidence: 'United Kingdom', athleteRegistrationId: 'areg-002', parentGuardian: { name: 'David Williams', email: 'd.williams@email.com', phone: '+44 7700 900123', relationship: 'parent' } },
  { id: 'p-003', firstName: 'Kai', lastName: 'Tanaka', email: 'k.tanaka@fccourtside.com', role: 'player', designation: 'Player', avatar: 'KT', teamIds: ['first-team'], status: 'active', jerseyNumber: 5, position: 'Centre-Back', dateOfBirth: '2000-06-10', gender: 'male', nationality: 'Japanese', countryOfResidence: 'United Kingdom', athleteRegistrationId: 'areg-003' },
  { id: 'p-004', firstName: 'Omar', lastName: 'Hassan', email: 'o.hassan@fccourtside.com', role: 'player', designation: 'Player', avatar: 'OH', teamIds: ['first-team'], status: 'active', jerseyNumber: 3, position: 'Left-Back', dateOfBirth: '2008-09-05', gender: 'male', nationality: 'British', countryOfResidence: 'United Kingdom', athleteRegistrationId: 'areg-004', parentGuardian: { name: 'Fatima Hassan', email: 'f.hassan@email.com', phone: '+44 7700 900456', relationship: 'parent' } },
  { id: 'p-005', firstName: 'Andre', lastName: 'Silva', email: 'a.silva@fccourtside.com', role: 'player', designation: 'Player', avatar: 'AS', teamIds: ['first-team'], status: 'active', jerseyNumber: 2, position: 'Right-Back' },
  { id: 'p-006', firstName: 'Jack', lastName: 'Brennan', email: 'j.brennan@fccourtside.com', role: 'player', designation: 'Player', avatar: 'JB', teamIds: ['first-team'], status: 'active', jerseyNumber: 8, position: 'Central Midfield' },
  { id: 'p-007', firstName: 'Leo', lastName: 'Fernandez', email: 'l.fernandez@fccourtside.com', role: 'player', designation: 'Player', avatar: 'LF', teamIds: ['first-team'], status: 'active', jerseyNumber: 6, position: 'Defensive Midfield' },
  { id: 'p-008', firstName: 'Noah', lastName: 'Clarke', email: 'n.clarke@fccourtside.com', role: 'player', designation: 'Player', avatar: 'NC', teamIds: ['first-team'], status: 'active', jerseyNumber: 10, position: 'Attacking Midfield' },
  { id: 'p-009', firstName: 'Ethan', lastName: 'Brooks', email: 'e.brooks@fccourtside.com', role: 'player', designation: 'Player', avatar: 'EB', teamIds: ['first-team'], status: 'injured', jerseyNumber: 7, position: 'Right Wing' },
  { id: 'p-010', firstName: 'Lucas', lastName: 'Dubois', email: 'l.dubois@fccourtside.com', role: 'player', designation: 'Player', avatar: 'LD', teamIds: ['first-team'], status: 'active', jerseyNumber: 11, position: 'Left Wing' },
  { id: 'p-011', firstName: 'Gabriel', lastName: 'Torres', email: 'g.torres@fccourtside.com', role: 'player', designation: 'Player', avatar: 'GT', teamIds: ['first-team'], status: 'active', jerseyNumber: 9, position: 'Striker' },
  // U-21 Players
  { id: 'p-012', firstName: 'Aiden', lastName: 'Murphy', email: 'a.murphy@fccourtside.com', role: 'player', designation: 'Player', avatar: 'AM', teamIds: ['u21'], status: 'active', jerseyNumber: 9, position: 'Striker' },
  { id: 'p-013', firstName: 'Jayden', lastName: 'Park', email: 'j.park@fccourtside.com', role: 'player', designation: 'Player', avatar: 'JP', teamIds: ['u21'], status: 'active', jerseyNumber: 10, position: 'Attacking Midfield' },
  { id: 'p-014', firstName: 'Finn', lastName: 'O\'Connor', email: 'f.oconnor@fccourtside.com', role: 'player', designation: 'Player', avatar: 'FO', teamIds: ['u21'], status: 'active', jerseyNumber: 7, position: 'Right Wing' },
];
