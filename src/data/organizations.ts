export interface Organization {
  id: string;
  name: string;
  logo: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  sport: string;
  memberCount: number;
  teamCount: number;
  primaryColor: string;
  state?: string;
  slug?: string;
  governanceConfigured?: boolean;
  governanceConfigId?: string;
}

export const organizations: Organization[] = [
  {
    id: 'fc-courtside',
    name: 'FC Courtside',
    logo: 'FC',
    address: '1200 Champions Lane',
    city: 'London, UK',
    country: 'United Kingdom',
    phone: '+44 20 7946 0958',
    email: 'admin@fccourtside.com',
    sport: 'Football',
    memberCount: 142,
    teamCount: 6,
    primaryColor: '#00A76F',
    slug: 'fc-courtside',
    governanceConfigured: true,
    governanceConfigId: 'gc-fc-courtside',
  },
  {
    id: 'courtside-academy',
    name: 'Courtside Academy',
    logo: 'CA',
    address: '45 Academy Road',
    city: 'Manchester, UK',
    country: 'United Kingdom',
    phone: '+44 16 1234 5678',
    email: 'info@courtsideacademy.com',
    sport: 'Football',
    memberCount: 86,
    teamCount: 4,
    primaryColor: '#007867',
    slug: 'courtside-academy',
    state: 'Maharashtra',
    governanceConfigured: true,
    governanceConfigId: 'gc-india-football',
  },
  {
    id: 'courtside-women',
    name: 'FC Courtside Women',
    logo: 'CW',
    address: '88 Victory Park',
    city: 'Birmingham, UK',
    country: 'United Kingdom',
    phone: '+44 12 1555 7890',
    email: 'women@fccourtside.com',
    sport: 'Football',
    memberCount: 64,
    teamCount: 3,
    primaryColor: '#004B50',
  },
];
