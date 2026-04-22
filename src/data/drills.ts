export interface Drill {
  id: string;
  name: string;
  description: string;
  activityId: string;
  attributeIds: string[];
  durationMinutes: number;
  intensity: 'low' | 'medium' | 'high';
}

export const drills: Drill[] = [
  { id: 'drill-01', name: 'Rondo 4v2', description: 'Quick passing in tight space with 2 defenders pressing', activityId: 'act-football', attributeIds: ['attr-03', 'attr-12'], durationMinutes: 15, intensity: 'medium' },
  { id: 'drill-02', name: 'Finishing Circuit', description: 'Rotation of shooting positions around the box', activityId: 'act-football', attributeIds: ['attr-02', 'attr-09'], durationMinutes: 20, intensity: 'high' },
  { id: 'drill-03', name: '1v1 Dribbling Gates', description: 'Beat a defender through coned gates', activityId: 'act-football', attributeIds: ['attr-01', 'attr-12'], durationMinutes: 15, intensity: 'high' },
  { id: 'drill-04', name: 'Pressing Triggers', description: 'Coordinated team pressing patterns from different zones', activityId: 'act-football', attributeIds: ['attr-04', 'attr-08', 'attr-09'], durationMinutes: 25, intensity: 'high' },
  { id: 'drill-05', name: 'Crossing & Heading', description: 'Wide players deliver crosses for attackers to finish with headers', activityId: 'act-football', attributeIds: ['attr-10', 'attr-11'], durationMinutes: 20, intensity: 'medium' },
  { id: 'drill-06', name: 'Set Piece Routines', description: 'Corner kicks, free kicks, and throw-in patterns', activityId: 'act-football', attributeIds: ['attr-06', 'attr-03'], durationMinutes: 25, intensity: 'low' },
  { id: 'drill-07', name: 'Possession Game 5v5', description: 'Small-sided game focused on ball retention', activityId: 'act-football', attributeIds: ['attr-03', 'attr-12', 'attr-08'], durationMinutes: 20, intensity: 'medium' },
  { id: 'drill-08', name: 'Sprint Interval Training', description: 'High-intensity sprint repetitions with active recovery', activityId: 'act-football', attributeIds: ['attr-07'], durationMinutes: 15, intensity: 'high' },
  { id: 'drill-09', name: 'Defensive Shape Walk-Through', description: 'Tactical movement patterns for back four and midfield line', activityId: 'act-football', attributeIds: ['attr-04', 'attr-09', 'attr-08'], durationMinutes: 20, intensity: 'low' },
  { id: 'drill-10', name: 'Build-Up Play Pattern', description: 'Playing out from the back through structured passing lanes', activityId: 'act-football', attributeIds: ['attr-03', 'attr-08', 'attr-09'], durationMinutes: 25, intensity: 'medium' },
  { id: 'drill-11', name: 'Tackling Circuit', description: 'One-on-one and sliding tackle technique drills', activityId: 'act-football', attributeIds: ['attr-05', 'attr-04'], durationMinutes: 15, intensity: 'high' },
  { id: 'drill-12', name: 'Long Ball Accuracy', description: 'Switching play and long-range passing accuracy to targets', activityId: 'act-football', attributeIds: ['attr-03', 'attr-10'], durationMinutes: 15, intensity: 'low' },
  { id: 'drill-13', name: 'Agility & Coordination', description: 'Ladder drills, cone weaves, and reaction exercises', activityId: 'act-football', attributeIds: ['attr-07', 'attr-01'], durationMinutes: 15, intensity: 'medium' },
  { id: 'drill-14', name: 'Counter-Attack Transition', description: 'Win ball and attack quickly with numbers advantage', activityId: 'act-football', attributeIds: ['attr-08', 'attr-02', 'attr-03'], durationMinutes: 20, intensity: 'high' },
  { id: 'drill-15', name: 'Cool Down & Stretching', description: 'Light jogging and static stretches for recovery', activityId: 'act-football', attributeIds: ['attr-07'], durationMinutes: 10, intensity: 'low' },
  { id: 'drill-16', name: 'Penalty Practice', description: 'Penalty kick taking and goalkeeping practice', activityId: 'act-football', attributeIds: ['attr-02', 'attr-06'], durationMinutes: 15, intensity: 'low' },
  { id: 'drill-17', name: 'Full-Field Match 11v11', description: 'Match simulation with tactical focus areas', activityId: 'act-football', attributeIds: ['attr-08', 'attr-09', 'attr-07'], durationMinutes: 30, intensity: 'high' },
  { id: 'drill-18', name: 'GK Distribution', description: 'Goalkeeper distribution — throws, kicks, and short passing', activityId: 'act-football', attributeIds: ['attr-03', 'attr-12'], durationMinutes: 15, intensity: 'medium' },
];
