export interface FacilityCenter {
  id: string;
  name: string;
  facilities: Facility[];
}

export interface Facility {
  id: string;
  name: string;
  type: string;
  capacity?: number;
}

export const facilityCenters: FacilityCenter[] = [
  {
    id: 'fc-main',
    name: 'Courtside Stadium',
    facilities: [
      { id: 'f-01', name: 'Main Pitch', type: 'Pitch', capacity: 35000 },
      { id: 'f-02', name: 'Press Conference Room', type: 'Room', capacity: 80 },
      { id: 'f-03', name: 'VIP Lounge', type: 'Room', capacity: 120 },
    ],
  },
  {
    id: 'fc-training',
    name: 'Courtside Training Ground',
    facilities: [
      { id: 'f-04', name: 'Training Pitch A', type: 'Pitch' },
      { id: 'f-05', name: 'Training Pitch B', type: 'Pitch' },
      { id: 'f-06', name: 'Indoor Arena', type: 'Indoor' },
      { id: 'f-07', name: 'Gym & Fitness Centre', type: 'Gym' },
      { id: 'f-08', name: 'Recovery Pool', type: 'Pool' },
      { id: 'f-09', name: 'Tactical Room', type: 'Room', capacity: 40 },
    ],
  },
  {
    id: 'fc-academy',
    name: 'Academy Complex',
    facilities: [
      { id: 'f-10', name: 'Academy Pitch 1', type: 'Pitch' },
      { id: 'f-11', name: 'Academy Pitch 2', type: 'Pitch' },
      { id: 'f-12', name: 'Academy Indoor Hall', type: 'Indoor' },
      { id: 'f-13', name: 'Classroom A', type: 'Room', capacity: 30 },
    ],
  },
];
