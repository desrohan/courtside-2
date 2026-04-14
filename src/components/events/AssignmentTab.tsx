import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check, Plus, X, Save, Pencil, Trash2,
  Plane, Bus, Car, Train, Hotel, BedDouble, BedSingle, Crown,
  GripVertical, ArrowRight, MapPin, ChevronDown, Users, Navigation,
  Paperclip, Eye, FileText,
} from 'lucide-react';
import { AssignmentRecord } from '@/data/events';

interface Props {
  records: AssignmentRecord[];
  eventStartDate?: string;
  eventEndDate?: string;
  eventTimezone?: string;
}

const COMMON_TIMEZONES = [
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Madrid', 'Europe/Rome',
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Sao_Paulo', 'America/Toronto', 'America/Mexico_City',
  'Asia/Kolkata', 'Asia/Mumbai', 'Asia/Dubai', 'Asia/Singapore', 'Asia/Tokyo', 'Asia/Shanghai',
  'Australia/Sydney', 'Australia/Melbourne',
  'Africa/Johannesburg', 'Africa/Lagos',
  'Pacific/Auckland', 'UTC',
];

type AssignView = 'travel' | 'accommodation';

// ══════════════════════════════════════════════════════
// TRAVEL TYPES
// ══════════════════════════════════════════════════════
type TransportMode = 'plane' | 'bus' | 'car' | 'train';

const transportIconsSm: Record<TransportMode, React.ReactNode> = {
  plane: <Plane size={13} />, bus: <Bus size={13} />, car: <Car size={13} />, train: <Train size={13} />,
};
const transportIconsMd: Record<TransportMode, React.ReactNode> = {
  plane: <Plane size={15} />, bus: <Bus size={15} />, car: <Car size={15} />, train: <Train size={15} />,
};
const transportColors: Record<TransportMode, string> = {
  plane: '#00B8D9', bus: '#FFAB00', car: '#00A76F', train: '#8E33FF',
};

interface TravelVehicle {
  id: string;
  mode: TransportMode;
  name: string;
  departure: string;
  arrival: string;
  departureTimezone?: string;
  arrivalTimezone?: string;
  capacity?: number;
  groupFile?: { name: string; url: string; type: string };
  passengerSeats: { userId: string; seat?: string; ticket?: { name: string; url: string; type: string } }[];
}

interface TravelLeg {
  id: string;
  label?: string; // e.g. "Mumbai → Lonavala"
  vehicles: TravelVehicle[];
}

interface TravelRoute {
  id: string;
  origin: string;
  destination: string;
  passengers: { userId: string; name: string; avatar: string }[];
  legs: TravelLeg[];
}

// ══════════════════════════════════════════════════════
// ACCOMMODATION TYPES
// ══════════════════════════════════════════════════════
type RoomType = 'single' | 'double' | 'twin' | 'suite';

const roomIcons: Record<RoomType, React.ReactNode> = {
  single: <BedSingle size={14} />, double: <BedDouble size={14} />, twin: <BedDouble size={14} />, suite: <Crown size={14} />,
};
const roomCapacity: Record<RoomType, number> = { single: 1, double: 2, twin: 2, suite: 3 };
const roomColors: Record<RoomType, string> = { single: '#637381', double: '#00A76F', twin: '#00B8D9', suite: '#8E33FF' };

interface AccommodationRoom {
  id: string;
  roomType: RoomType;
  roomNumber: string;
  occupants: { userId: string; name: string; avatar: string }[];
}

interface AccommodationPlace {
  id: string;
  name: string;
  location: string;
  checkIn?: string;
  checkOut?: string;
  rooms: AccommodationRoom[];
}

// ── Dummy data ────────────────────────────────────────
const dummyRoutes: TravelRoute[] = [
  {
    id: 'rt-01',
    origin: 'Courtside Stadium',
    destination: 'Rangers Arena, Liverpool',
    passengers: [
      { userId: 'u-002', name: 'James Carter',    avatar: 'JC' },
      { userId: 'p-011', name: 'Gabriel Torres',  avatar: 'GT' },
      { userId: 'p-008', name: 'Noah Clarke',     avatar: 'NC' },
      { userId: 'p-006', name: 'Jack Brennan',    avatar: 'JB' },
      { userId: 'p-007', name: 'Leo Fernandez',   avatar: 'LF' },
      { userId: 'p-002', name: 'Marcus Williams', avatar: 'MW' },
      { userId: 'p-003', name: 'Kai Tanaka',      avatar: 'KT' },
      { userId: 'p-001', name: 'Liam Henderson',  avatar: 'LH' },
    ],
    legs: [
      {
        id: 'lg-01',
        label: 'Stadium → City Centre',
        vehicles: [
          {
            id: 'vh-01', mode: 'bus', name: 'Coaches Bus', departure: '14:00', arrival: '16:00', capacity: 12,
            passengerSeats: [
              { userId: 'u-002' },
              { userId: 'p-006', seat: '1A' }, { userId: 'p-007', seat: '1B' },
              { userId: 'p-002', seat: '2A' }, { userId: 'p-003', seat: '2B' },
            ],
          },
          {
            id: 'vh-02', mode: 'bus', name: 'Players Bus', departure: '14:30', arrival: '16:30', capacity: 24,
            passengerSeats: [
              { userId: 'p-011', seat: '1A' }, { userId: 'p-008', seat: '1B' },
              { userId: 'p-001', seat: '2A' },
            ],
          },
        ],
      },
      {
        id: 'lg-02',
        label: 'City Centre → Arena',
        vehicles: [
          {
            id: 'vh-03', mode: 'train', name: 'Express Train', departure: '17:00', arrival: '17:30',
            passengerSeats: [
              { userId: 'u-002' }, { userId: 'p-011' }, { userId: 'p-008' },
              { userId: 'p-006' }, { userId: 'p-007' }, { userId: 'p-002' },
              { userId: 'p-003' }, { userId: 'p-001' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'rt-02',
    origin: 'Courtside Stadium',
    destination: 'The Grand Liverpool',
    passengers: [
      { userId: 'u-005', name: "Sarah O'Brien", avatar: 'SO' },
      { userId: 'u-006', name: 'Daniel Kim',    avatar: 'DK' },
    ],
    legs: [
      {
        id: 'lg-03',
        vehicles: [
          {
            id: 'vh-04', mode: 'car', name: 'Staff Car 1', departure: '13:00', arrival: '16:30',
            passengerSeats: [{ userId: 'u-005' }, { userId: 'u-006' }],
          },
        ],
      },
    ],
  },
];

const dummyPlaces: AccommodationPlace[] = [
  {
    id: 'pl-01',
    name: 'The Grand Liverpool',
    location: 'Liverpool, UK',
    checkIn: '2025-09-14',
    checkOut: '2025-09-16',
    rooms: [
      { id: 'ac-01', roomType: 'suite',  roomNumber: '501', occupants: [{ userId: 'u-002', name: 'James Carter',    avatar: 'JC' }] },
      { id: 'ac-02', roomType: 'double', roomNumber: '302', occupants: [{ userId: 'p-011', name: 'Gabriel Torres',  avatar: 'GT' }, { userId: 'p-008', name: 'Noah Clarke',     avatar: 'NC' }] },
      { id: 'ac-03', roomType: 'double', roomNumber: '303', occupants: [{ userId: 'p-006', name: 'Jack Brennan',    avatar: 'JB' }, { userId: 'p-007', name: 'Leo Fernandez',   avatar: 'LF' }] },
      { id: 'ac-04', roomType: 'twin',   roomNumber: '304', occupants: [{ userId: 'p-002', name: 'Marcus Williams', avatar: 'MW' }, { userId: 'p-003', name: 'Kai Tanaka',      avatar: 'KT' }] },
      { id: 'ac-05', roomType: 'single', roomNumber: '210', occupants: [{ userId: 'u-005', name: "Sarah O'Brien",   avatar: 'SO' }] },
      { id: 'ac-06', roomType: 'single', roomNumber: '211', occupants: [] },
    ],
  },
  {
    id: 'pl-02',
    name: 'Holiday Inn Express',
    location: 'Liverpool City Centre',
    rooms: [
      { id: 'ac-07', roomType: 'double', roomNumber: '102', occupants: [] },
    ],
  },
];

const allPeople = [
  { userId: 'u-002', name: 'James Carter',    avatar: 'JC', role: 'Head Coach' },
  { userId: 'u-003', name: 'Elena Vasquez',   avatar: 'EV', role: 'Team Manager' },
  { userId: 'u-005', name: "Sarah O'Brien",   avatar: 'SO', role: 'Physiotherapist' },
  { userId: 'u-006', name: 'Daniel Kim',      avatar: 'DK', role: 'Analyst' },
  { userId: 'p-001', name: 'Liam Henderson',  avatar: 'LH', role: 'Forward' },
  { userId: 'p-002', name: 'Marcus Williams', avatar: 'MW', role: 'Midfielder' },
  { userId: 'p-003', name: 'Kai Tanaka',      avatar: 'KT', role: 'Midfielder' },
  { userId: 'p-006', name: 'Jack Brennan',    avatar: 'JB', role: 'Defender' },
  { userId: 'p-007', name: 'Leo Fernandez',   avatar: 'LF', role: 'Defender' },
  { userId: 'p-008', name: 'Noah Clarke',     avatar: 'NC', role: 'Goalkeeper' },
  { userId: 'p-011', name: 'Gabriel Torres',  avatar: 'GT', role: 'Forward' },
];

const fmt12 = (t: string) => {
  if (!t) return '—';
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};

// ══════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════
export default function AssignmentTab({ eventStartDate, eventEndDate, eventTimezone }: Props) {
  const [view, setView] = useState<AssignView>('travel');
  const [routes, setRoutes] = useState<TravelRoute[]>(dummyRoutes);
  const [places, setPlaces] = useState<AccommodationPlace[]>(dummyPlaces);
  const [collapsedRoutes, setCollapsedRoutes] = useState<Set<string>>(new Set());
  const [collapsedPlaces, setCollapsedPlaces] = useState<Set<string>>(new Set());

  const [showRouteForm, setShowRouteForm] = useState(false);
  const [editRoute, setEditRoute] = useState<TravelRoute | null>(null);

  const [showPlaceForm, setShowPlaceForm] = useState(false);
  const [editPlace, setEditPlace] = useState<AccommodationPlace | null>(null);

  const [showRoomForm, setShowRoomForm] = useState(false);
  const [editRoomCtx, setEditRoomCtx] = useState<{ room: AccommodationRoom; placeId: string } | null>(null);
  const [addRoomToPlaceId, setAddRoomToPlaceId] = useState<string | null>(null);

  const [dragUser, setDragUser] = useState<{ userId: string; name: string; avatar: string } | null>(null);

  // Derived — accommodation
  const allRooms = places.flatMap(p => p.rooms);
  const assignedToRooms = allRooms.flatMap(r => r.occupants.map(o => o.userId));
  const unassignedPeople = allPeople.filter(p => !assignedToRooms.includes(p.userId));
  const totalRooms = allRooms.length;

  const dropOnRoom = (roomId: string) => {
    if (!dragUser) return;
    setPlaces(prev => prev.map(pl => ({
      ...pl,
      rooms: pl.rooms.map(r => {
        if (r.id !== roomId) return r;
        if (r.occupants.length >= roomCapacity[r.roomType]) return r;
        if (r.occupants.some(o => o.userId === dragUser.userId)) return r;
        return { ...r, occupants: [...r.occupants, dragUser] };
      }),
    })));
    setDragUser(null);
  };

  const removeFromRoom = (roomId: string, userId: string) => {
    setPlaces(prev => prev.map(pl => ({
      ...pl,
      rooms: pl.rooms.map(r => r.id === roomId ? { ...r, occupants: r.occupants.filter(o => o.userId !== userId) } : r),
    })));
  };

  const savePlace = (place: AccommodationPlace) => {
    if (editPlace) {
      setPlaces(p => p.map(pl => pl.id === place.id ? { ...pl, name: place.name, location: place.location } : pl));
    } else {
      setPlaces(p => [...p, { ...place, id: `pl-${Date.now()}`, rooms: [] }]);
    }
    setShowPlaceForm(false);
    setEditPlace(null);
  };

  const saveRoom = (room: AccommodationRoom) => {
    if (editRoomCtx) {
      setPlaces(p => p.map(pl => pl.id === editRoomCtx.placeId
        ? { ...pl, rooms: pl.rooms.map(r => r.id === room.id ? room : r) }
        : pl
      ));
    } else {
      setPlaces(p => p.map(pl => pl.id === addRoomToPlaceId
        ? { ...pl, rooms: [...pl.rooms, { ...room, id: `ac-${Date.now()}`, occupants: [] }] }
        : pl
      ));
    }
    setShowRoomForm(false);
    setEditRoomCtx(null);
    setAddRoomToPlaceId(null);
  };

  const saveRoute = (route: TravelRoute) => {
    if (editRoute) {
      setRoutes(prev => prev.map(r => r.id === route.id ? route : r));
    } else {
      setRoutes(prev => [...prev, { ...route, id: `rt-${Date.now()}` }]);
    }
    setShowRouteForm(false);
    setEditRoute(null);
  };

  return (
    <div className="space-y-5">
      {/* View toggle */}
      <div className="flex items-center gap-1 bg-dark-100/60 rounded-lg p-0.5 w-fit">
        {([
          { key: 'travel' as AssignView, label: 'Travel', icon: <Navigation size={13} /> },
          { key: 'accommodation' as AssignView, label: 'Accommodation', icon: <Hotel size={13} /> },
        ]).map(t => (
          <button key={t.key} onClick={() => setView(t.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${view === t.key ? 'bg-white text-dark-900 shadow-sm' : 'text-dark-500'}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ─── TRAVEL ────────────────────────────────── */}
      {view === 'travel' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-dark-500">{routes.length} {routes.length === 1 ? 'route' : 'routes'}</p>
            <button
              onClick={() => { setEditRoute(null); setShowRouteForm(true); }}
              className="h-8 px-3 rounded-lg bg-court-500 text-white text-xs font-semibold hover:bg-court-600 flex items-center gap-1.5"
            ><Plus size={14} /> Add Route</button>
          </div>

          {routes.length === 0 && (
            <div className="text-center py-12 bg-white border border-dark-100 rounded-2xl">
              <Navigation size={24} className="text-dark-300 mx-auto mb-2" />
              <p className="text-sm text-dark-400">No routes yet</p>
            </div>
          )}

          {routes.map(route => {
            const routeCollapsed = collapsedRoutes.has(route.id);
            const toggleRouteCollapsed = () => setCollapsedRoutes((prev: Set<string>) => { const n = new Set(prev); n.has(route.id) ? n.delete(route.id) : n.add(route.id); return n; });
            const totalAssigned = new Set(route.legs.flatMap(l => l.vehicles.flatMap(v => v.passengerSeats.map(ps => ps.userId)))).size;
            const totalVehicles = route.legs.reduce((s, l) => s + l.vehicles.length, 0);
            return (
            <div key={route.id} className="bg-white border border-dark-100 rounded-2xl overflow-hidden">
              {/* Route header */}
              <div className="flex items-center gap-3 px-4 py-3 bg-dark-50/40">
                <div className="w-8 h-8 rounded-xl bg-court-100 flex items-center justify-center shrink-0">
                  <Navigation size={15} className="text-court-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-sm font-bold text-dark-900">
                    <span className="truncate">{route.origin}</span>
                    <ArrowRight size={13} className="text-dark-400 shrink-0" />
                    <span className="truncate">{route.destination}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => { setEditRoute(route); setShowRouteForm(true); }}
                    className="p-1.5 rounded-lg hover:bg-white text-dark-400 hover:text-dark-700 transition-colors"
                  ><Pencil size={13} /></button>
                  <button
                    onClick={() => setRoutes(prev => prev.filter(r => r.id !== route.id))}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-dark-400 hover:text-red-500 transition-colors"
                  ><Trash2 size={13} /></button>
                  <button onClick={toggleRouteCollapsed} className="p-1.5 rounded-lg hover:bg-dark-100 text-dark-400 transition-colors">
                    <ChevronDown size={13} className={`transition-transform ${routeCollapsed ? '' : 'rotate-180'}`} />
                  </button>
                </div>
              </div>
              {/* Summary strip — always visible */}
              <div className={`flex items-center gap-3 px-4 py-2 flex-wrap text-[11px] text-dark-400 ${routeCollapsed ? '' : 'border-b border-dark-100'}`}>
                <span><span className="font-semibold text-dark-600">{route.passengers.length}</span> travelling</span>
                <span className="text-dark-200">·</span>
                <span><span className="font-semibold text-dark-600">{route.legs.length}</span> {route.legs.length === 1 ? 'leg' : 'legs'}</span>
                <span className="text-dark-200">·</span>
                <span><span className="font-semibold text-dark-600">{totalVehicles}</span> {totalVehicles === 1 ? 'vehicle' : 'vehicles'}</span>
                <span className="text-dark-200">·</span>
                <span><span className="font-semibold text-dark-600">{totalAssigned}</span> assigned</span>
              </div>

              {/* Legs — collapsible */}
              {!routeCollapsed && (
              <div className="p-3 space-y-2 border-t border-dark-100">
                {route.legs.length === 0 ? (
                  <p className="text-xs text-dark-300 italic text-center py-3">No legs — edit route to add segments</p>
                ) : route.legs.map((leg, legIdx) => (
                  <div key={leg.id} className="rounded-xl border border-dark-100 overflow-hidden">
                    {/* Leg header */}
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-dark-50/60">
                      <span className="w-4 h-4 rounded-full bg-dark-300 flex items-center justify-center text-white text-[9px] font-bold shrink-0">{legIdx + 1}</span>
                      <span className="text-[11px] font-semibold text-dark-600 truncate">{leg.label || `Leg ${legIdx + 1}`}</span>
                      <span className="text-[10px] text-dark-400 ml-auto">{leg.vehicles.length} vehicle{leg.vehicles.length !== 1 ? 's' : ''}</span>
                    </div>
                    {/* Vehicles */}
                    <div className="divide-y divide-dark-50">
                      {leg.vehicles.map(vh => {
                        const color = transportColors[vh.mode];
                        const vhPassengers = route.passengers.filter(p => vh.passengerSeats.some(ps => ps.userId === p.userId));
                        return (
                          <div key={vh.id} className="flex items-start gap-2.5 px-3 py-2">
                            <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: color + '18', color }}>
                              {transportIconsSm[vh.mode]}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[11px] font-bold text-dark-800">{vh.name || 'Unnamed'}</span>
                                <span className="text-[10px] text-dark-400">{fmt12(vh.departure)} → {fmt12(vh.arrival)}</span>
                                {vh.capacity && <span className="text-[9px] px-1 py-0.5 rounded bg-dark-100 text-dark-400">{vh.passengerSeats.length}/{vh.capacity} seats</span>}
                              </div>
                              {vhPassengers.length > 0 && (
                                <div className="flex items-center gap-1 mt-1 flex-wrap">
                                  {vhPassengers.map(p => {
                                    const ps = vh.passengerSeats.find(x => x.userId === p.userId);
                                    return (
                                      <div key={p.userId} className="flex items-center gap-1 px-1.5 py-0.5 bg-white rounded-md border border-dark-100 text-[10px]">
                                        <div className="w-4 h-4 rounded-full bg-gradient-to-br from-court-400 to-court-600 flex items-center justify-center">
                                          <span className="text-[6px] font-bold text-white">{p.avatar}</span>
                                        </div>
                                        <span className="text-dark-600 font-medium">{p.name.split(' ')[0]}</span>
                                        {ps?.seat && <span className="text-dark-400 font-mono">{ps.seat}</span>}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              )}
            </div>
            );
          })}
        </div>
      )}

      {/* ─── ACCOMMODATION ─────────────────────────── */}
      {view === 'accommodation' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-dark-500">
              {places.length} {places.length === 1 ? 'place' : 'places'} &middot; {totalRooms} rooms &middot; {assignedToRooms.length}/{allPeople.length} assigned
            </p>
            <button
              onClick={() => { setEditPlace(null); setShowPlaceForm(true); }}
              className="h-8 px-3 rounded-lg bg-court-500 text-white text-xs font-semibold hover:bg-court-600 flex items-center gap-1.5"
            >
              <Plus size={14} /> Add Place
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-4">
              {places.length === 0 && (
                <div className="text-center py-12 bg-white border border-dark-100 rounded-2xl">
                  <Hotel size={24} className="text-dark-300 mx-auto mb-2" />
                  <p className="text-sm text-dark-400">No places added yet</p>
                </div>
              )}
              {places.map(place => {
                const placeOccupied = place.rooms.flatMap(r => r.occupants).length;
                const placeCap = place.rooms.reduce((sum, r) => sum + roomCapacity[r.roomType], 0);
                const isCollapsed = collapsedPlaces.has(place.id);
                const toggleCollapsed = () => setCollapsedPlaces(prev => {
                  const next = new Set(prev);
                  next.has(place.id) ? next.delete(place.id) : next.add(place.id);
                  return next;
                });
                return (
                  <div key={place.id} className="bg-white border border-dark-100 rounded-2xl overflow-hidden">
                    <button
                      onClick={toggleCollapsed}
                      className="w-full flex items-center gap-3 px-4 py-2.5 bg-dark-50/40 hover:bg-dark-50/70 transition-colors text-left"
                    >
                      <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
                        <Hotel size={13} className="text-violet-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-dark-900 leading-tight truncate">{place.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-dark-400 flex-wrap">
                          <MapPin size={8} className="shrink-0" />
                          <span className="truncate max-w-[80px]">{place.location}</span>
                          {place.location && (
                            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([place.name, place.location].filter(Boolean).join(', '))}`}
                              target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                              className="text-violet-500 hover:text-violet-700 font-semibold transition-colors">Map</a>
                          )}
                          <span className="text-dark-200">·</span>
                          <span>{place.rooms.length} rooms</span>
                          <span className="text-dark-200">·</span>
                          <span>{placeOccupied}/{placeCap} guests</span>
                          {(place.checkIn || place.checkOut) && <span className="text-dark-200">·</span>}
                          {place.checkIn && <span className="font-medium text-dark-600">{new Date(place.checkIn + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>}
                          {place.checkIn && place.checkOut && <ArrowRight size={8} className="text-dark-300 shrink-0" />}
                          {place.checkOut && <span className="font-medium text-dark-600">{new Date(place.checkOut + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0" onClick={e => e.stopPropagation()}>
                        <button onClick={() => { setEditPlace(place); setShowPlaceForm(true); }} className="p-1.5 rounded-lg hover:bg-white text-dark-400 hover:text-dark-700 transition-colors"><Pencil size={12} /></button>
                        <button onClick={() => { setAddRoomToPlaceId(place.id); setEditRoomCtx(null); setShowRoomForm(true); }} className="h-6 px-2 ml-1 rounded-lg bg-court-500 text-white text-[10px] font-semibold hover:bg-court-600 flex items-center gap-1 transition-colors">
                          <Plus size={10} /> Add Room
                        </button>
                      </div>
                      <ChevronDown size={13} className={`text-dark-400 shrink-0 transition-transform ml-0.5 ${isCollapsed ? '' : 'rotate-180'}`} />
                    </button>
                    <AnimatePresence initial={false}>
                    {!isCollapsed && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                    <div className="p-3 space-y-2 border-t border-dark-100">
                      {place.rooms.length === 0 ? (
                        <p className="text-xs text-dark-300 italic text-center py-4">No rooms — click "Add Room" above</p>
                      ) : place.rooms.map(room => {
                        const cap = roomCapacity[room.roomType];
                        const isFull = room.occupants.length >= cap;
                        const rc = roomColors[room.roomType];
                        return (
                          <div key={room.id} onDragOver={e => { if (!isFull) e.preventDefault(); }} onDrop={() => dropOnRoom(room.id)}
                            className={`border rounded-xl overflow-hidden transition-all ${dragUser && !isFull ? 'border-court-300 ring-2 ring-court-500/10 bg-court-50/30' : 'border-dark-100 bg-dark-50/20'}`}>
                            <div className="flex items-center gap-2.5 px-3.5 py-2 border-b border-dark-100/60">
                              <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: rc + '15', color: rc }}>{roomIcons[room.roomType]}</div>
                              <div className="flex-1 flex items-center gap-2">
                                <span className="text-xs font-bold text-dark-800">Room {room.roomNumber}</span>
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold capitalize" style={{ backgroundColor: rc + '15', color: rc }}>{room.roomType}</span>
                              </div>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isFull ? 'bg-green-50 text-green-600' : 'bg-dark-100 text-dark-400'}`}>{room.occupants.length}/{cap}</span>
                              <button onClick={() => { setEditRoomCtx({ room, placeId: place.id }); setShowRoomForm(true); }} className="p-1 rounded hover:bg-white text-dark-400 hover:text-dark-700 transition-colors"><Pencil size={11} /></button>
                              <button className="p-1 rounded hover:bg-red-50 text-dark-400 hover:text-red-500 transition-colors"><Trash2 size={11} /></button>
                            </div>
                            <div className="px-3.5 py-2 min-h-[36px]">
                              {room.occupants.length === 0 ? (
                                <p className="text-[11px] text-dark-300 italic text-center py-0.5">{dragUser && !isFull ? 'Drop here to assign' : 'No occupants — drag a person here'}</p>
                              ) : (
                                <div className="flex flex-wrap gap-1.5">
                                  {room.occupants.map(o => (
                                    <div key={o.userId} className="flex items-center gap-1.5 px-2 py-1 bg-white rounded-lg border border-dark-100 group/occ">
                                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-court-400 to-court-600 flex items-center justify-center shrink-0">
                                        <span className="text-[7px] font-bold text-white">{o.avatar}</span>
                                      </div>
                                      <span className="text-[11px] font-medium text-dark-700">{o.name}</span>
                                      <button onClick={() => removeFromRoom(room.id, o.userId)} className="p-0.5 rounded hover:bg-red-50 text-dark-300 hover:text-red-500 opacity-0 group-hover/occ:opacity-100 transition-opacity"><X size={9} /></button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    </motion.div>
                    )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            {/* People pool */}
            <div className="space-y-2">
              <div className="bg-dark-50 rounded-xl p-3 sticky top-0">
                <p className="text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-2">Unassigned ({unassignedPeople.length}/{allPeople.length})</p>
                {unassignedPeople.length === 0 ? (
                  <p className="text-xs text-dark-400 text-center py-3">Everyone assigned</p>
                ) : (
                  <div className="space-y-1.5">
                    {unassignedPeople.map(p => (
                      <div key={p.userId} draggable onDragStart={() => setDragUser(p)} onDragEnd={() => setDragUser(null)}
                        className={`flex items-center gap-2 px-2.5 py-2 bg-white rounded-lg border cursor-grab active:cursor-grabbing transition-all ${dragUser?.userId === p.userId ? 'border-court-300 opacity-50 scale-95' : 'border-dark-200 hover:border-court-200 hover:shadow-sm'}`}>
                        <GripVertical size={12} className="text-dark-300 shrink-0" />
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-court-400 to-court-600 flex items-center justify-center shrink-0">
                          <span className="text-[8px] font-bold text-white">{p.avatar}</span>
                        </div>
                        <span className="text-[11px] font-medium text-dark-700 truncate">{p.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="bg-court-50/50 rounded-xl p-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-court-600 mb-2">Assigned ({assignedToRooms.length}/{allPeople.length})</p>
                <div className="space-y-1">
                  {allPeople.filter(p => assignedToRooms.includes(p.userId)).map(p => {
                    let roomLabel = '';
                    for (const pl of places) {
                      const r = pl.rooms.find(r => r.occupants.some(o => o.userId === p.userId));
                      if (r) { roomLabel = `Rm ${r.roomNumber}`; break; }
                    }
                    return (
                      <div key={p.userId} className="flex items-center gap-2 px-2.5 py-1.5 text-[11px]">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-court-400 to-court-600 flex items-center justify-center shrink-0">
                          <span className="text-[7px] font-bold text-white">{p.avatar}</span>
                        </div>
                        <span className="text-dark-600 truncate flex-1">{p.name}</span>
                        <span className="text-dark-400 shrink-0">{roomLabel}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODALS ────────────────────────────────── */}
      <AnimatePresence>
        {showRouteForm && (
          <RouteFormModal
            route={editRoute}
            onClose={() => { setShowRouteForm(false); setEditRoute(null); }}
            onSave={saveRoute}
            defaultTimezone={eventTimezone}
          />
        )}
        {showPlaceForm && <PlaceFormModalWrapper place={editPlace} onClose={() => { setShowPlaceForm(false); setEditPlace(null); }} onSave={savePlace} onDelete={editPlace ? () => { setPlaces(prev => prev.filter(p => p.id !== editPlace.id)); setShowPlaceForm(false); setEditPlace(null); } : undefined} eventStartDate={eventStartDate} eventEndDate={eventEndDate} />}
        {showRoomForm && (
          <RoomFormModal
            room={editRoomCtx?.room ?? null}
            onClose={() => { setShowRoomForm(false); setEditRoomCtx(null); setAddRoomToPlaceId(null); }}
            onSave={saveRoom}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// ROUTE FORM MODAL
// ══════════════════════════════════════════════════════

// VehicleRow — pure vehicle config (no passenger assignment here)
const modeDefaultCapacity: Record<TransportMode, number> = { car: 4, bus: 56, train: 100, plane: 100 };

function VehicleRow({ vh, defaultTimezone, onUpdate, onRemove }: {
  vh: TravelVehicle;
  defaultTimezone?: string;
  onUpdate: (patch: Partial<TravelVehicle>) => void;
  onRemove: () => void;
}) {
  const depTz = vh.departureTimezone || defaultTimezone || 'UTC';
  const arrTz = vh.arrivalTimezone || defaultTimezone || 'UTC';

  return (
    <div className="border border-dark-100 rounded-xl overflow-hidden bg-white">
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="flex gap-0.5 shrink-0">
          {(['plane', 'bus', 'car', 'train'] as TransportMode[]).map(m => (
            <button key={m} onClick={() => onUpdate({ mode: m, capacity: modeDefaultCapacity[m] })}
              className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${vh.mode === m ? 'text-white' : 'bg-dark-100 text-dark-400 hover:bg-dark-200'}`}
              style={vh.mode === m ? { backgroundColor: transportColors[m] } : {}} title={m}>
              {transportIconsSm[m]}
            </button>
          ))}
        </div>
        <input
          value={vh.name}
          onChange={e => onUpdate({ name: e.target.value })}
          placeholder={
            vh.mode === 'plane' ? 'Airline & flight no. (e.g. BA 204)' :
            vh.mode === 'bus'   ? 'Bus name (e.g. Team Coach A)' :
            vh.mode === 'train' ? 'Train no. (e.g. Amtrak 2153)' :
                                  'Car name & plate (e.g. Toyota · ABC 123)'
          }
          className="flex-1 min-w-0 h-7 px-2 rounded-lg border border-dark-200 text-xs focus:outline-none focus:ring-1 focus:ring-court-500/30"
        />
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-[11px] font-semibold text-dark-700">{vh.passengerSeats.length}</span>
          {vh.capacity && <span className="text-[10px] text-dark-400">/ {vh.capacity}</span>}
        </div>
        <input type="number" value={vh.capacity ?? ''} onChange={e => onUpdate({ capacity: e.target.value ? Number(e.target.value) : undefined })}
          placeholder="Cap" min={1}
          className="w-12 h-7 px-1.5 rounded-lg border border-dark-200 text-xs text-center focus:outline-none focus:ring-1 focus:ring-court-500/30 shrink-0" />
        {/* Group file upload / view / delete */}
        {vh.groupFile ? (
          <div className="flex items-center gap-0.5 shrink-0">
            <a href={vh.groupFile.url} target="_blank" rel="noopener noreferrer" title={`View: ${vh.groupFile.name}`}
              className="w-6 h-7 rounded-l-lg border border-r-0 border-court-200 bg-court-50 flex items-center justify-center text-court-500 hover:bg-court-100 transition-colors">
              {vh.groupFile.type === 'application/pdf' ? <FileText size={11} /> : <Eye size={11} />}
            </a>
            <button onClick={() => onUpdate({ groupFile: undefined })} title="Remove file"
              className="w-6 h-7 rounded-r-lg border border-red-200 bg-red-50 flex items-center justify-center text-red-400 hover:bg-red-100 transition-colors">
              <X size={9} />
            </button>
          </div>
        ) : (
          <label className="w-[50px] h-7 shrink-0 rounded-lg border border-dark-200 flex items-center justify-center text-dark-400 hover:bg-dark-50 hover:text-dark-600 transition-colors cursor-pointer" title="Upload group boarding pass / document">
            <Paperclip size={11} />
            <input type="file" accept=".png,.jpg,.jpeg,.pdf" className="hidden"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) onUpdate({ groupFile: { name: file.name, url: URL.createObjectURL(file), type: file.type } });
              }} />
          </label>
        )}
        <button onClick={onRemove} className="p-1 rounded-lg hover:bg-red-50 text-dark-300 hover:text-red-500 transition-colors shrink-0">
          <Trash2 size={11} />
        </button>
      </div>
      {/* Dep time + tz → Arr time + tz on one line */}
      <div className="flex items-center gap-1.5 px-3 pb-2">
        <span className="text-[9px] font-bold text-dark-400 uppercase tracking-wide shrink-0">Dep</span>
        <input type="time" value={vh.departure} onChange={e => onUpdate({ departure: e.target.value })}
          className="w-24 h-6 px-1.5 rounded-md border border-dark-200 text-[11px] focus:outline-none shrink-0" />
        <select value={depTz} onChange={e => onUpdate({ departureTimezone: e.target.value })}
          className="flex-1 h-6 px-1 rounded-md border border-dark-100 bg-dark-50 text-[10px] text-dark-500 focus:outline-none min-w-0">
          {COMMON_TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
        </select>
        <ArrowRight size={10} className="text-dark-300 shrink-0" />
        <span className="text-[9px] font-bold text-dark-400 uppercase tracking-wide shrink-0">Arr</span>
        <input type="time" value={vh.arrival} onChange={e => onUpdate({ arrival: e.target.value })}
          className="w-24 h-6 px-1.5 rounded-md border border-dark-200 text-[11px] focus:outline-none shrink-0" />
        <select value={arrTz} onChange={e => onUpdate({ arrivalTimezone: e.target.value })}
          className="flex-1 h-6 px-1 rounded-md border border-dark-100 bg-dark-50 text-[10px] text-dark-500 focus:outline-none min-w-0">
          {COMMON_TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
        </select>
      </div>
    </div>
  );
}

// LegPassengerTable — one row per passenger, pick which vehicle they're on
function LegPassengerTable({ leg, routePassengers, onAssign, onUploadTicket }: {
  leg: TravelLeg;
  routePassengers: { userId: string; name: string; avatar: string }[];
  onAssign: (userId: string, vehicleId: string | null, seat: string) => void;
  onUploadTicket: (legId: string, vehicleId: string, userId: string, file: File | null) => void;
}) {
  const useDropdown = leg.vehicles.length > 3;
  const COL = 'w-12'; // fixed column width for None + each vehicle button

  if (routePassengers.length === 0) {
    return <p className="text-[11px] text-dark-300 italic text-center py-2">Add passengers to the route first</p>;
  }
  if (leg.vehicles.length === 0) {
    return <p className="text-[11px] text-dark-300 italic text-center py-2">Add a vehicle above to assign passengers</p>;
  }

  // Each column is the same width so headers and buttons line up perfectly

  return (
    <div className="rounded-xl border border-dark-100 overflow-hidden">
      {/* Column headers */}
      {!useDropdown && (
        <div className="flex items-center gap-1.5 px-3 py-2 bg-dark-50/60 border-b border-dark-100">
          <div className="flex-1 min-w-0" />
          {/* None header */}
          <div className={`${COL} shrink-0 overflow-hidden`}>
            <div className="w-full flex items-center justify-center py-0.5 rounded-md text-[9px] font-semibold text-dark-400 bg-dark-100/60">
              None
            </div>
          </div>
          {leg.vehicles.map(vh => (
            <div key={vh.id} className={`${COL} shrink-0 overflow-hidden`}>
              <div
                className="w-full flex items-center justify-center gap-1 py-0.5 rounded-md text-[9px] font-bold truncate"
                style={{ backgroundColor: transportColors[vh.mode] + '20', color: transportColors[vh.mode] }}
              >
                <span className="shrink-0">{transportIconsSm[vh.mode]}</span>
                <span className="truncate">{vh.name || 'Vehicle'}</span>
              </div>
            </div>
          ))}
          <div className="w-10 shrink-0 text-center text-[9px] font-semibold text-dark-300">Seat</div>
          <div className="w-[50px] shrink-0" />
        </div>
      )}

      {routePassengers.map((p, idx) => {
        const assignedVh = leg.vehicles.find(vh => vh.passengerSeats.some(ps => ps.userId === p.userId));
        const assignedSeat = assignedVh?.passengerSeats.find(ps => ps.userId === p.userId)?.seat || '';
        const isLast = idx === routePassengers.length - 1;

        return (
          <div
            key={p.userId}
            className={`flex items-center gap-1.5 px-3 py-2 transition-colors ${assignedVh ? 'bg-white' : 'bg-white hover:bg-dark-50/40'} ${!isLast ? 'border-b border-dark-50' : ''}`}
          >
            {/* Avatar + name */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-court-400 to-court-600 flex items-center justify-center shrink-0">
                <span className="text-[7px] font-bold text-white">{p.avatar}</span>
              </div>
              <div className="min-w-0">
                <p className={`text-[11px] truncate leading-tight ${assignedVh ? 'font-semibold text-dark-800' : 'text-dark-600'}`}>{p.name}</p>
                <p className="text-[9px] text-dark-400 truncate leading-tight">{allPeople.find(x => x.userId === p.userId)?.role}</p>
              </div>
            </div>

            {/* Vehicle selector */}
            {useDropdown ? (
              <select
                value={assignedVh?.id || ''}
                onChange={e => onAssign(p.userId, e.target.value || null, assignedSeat)}
                className="flex-1 h-6 px-1.5 rounded-md border border-dark-200 text-[11px] bg-white focus:outline-none"
              >
                <option value="">— None —</option>
                {leg.vehicles.map(vh => (
                  <option key={vh.id} value={vh.id}>{vh.name || 'Unnamed'}</option>
                ))}
              </select>
            ) : (
              <>
                {/* None button */}
                <button
                  onClick={() => onAssign(p.userId, null, '')}
                  className={`${COL} h-7 shrink-0 rounded-lg border text-[9px] font-medium transition-all ${!assignedVh ? 'bg-dark-100 border-dark-300 text-dark-500' : 'bg-dark-50 border-dark-100 text-dark-300 hover:bg-dark-100 hover:text-dark-400'}`}
                >
                  None
                </button>
                {leg.vehicles.map(vh => {
                  const isThis = assignedVh?.id === vh.id;
                  const color = transportColors[vh.mode];
                  return (
                    <button
                      key={vh.id}
                      onClick={() => onAssign(p.userId, vh.id, isThis ? assignedSeat : '')}
                      className={`${COL} h-7 shrink-0 rounded-lg border text-[9px] font-bold transition-all flex items-center justify-center`}
                      style={isThis
                        ? { backgroundColor: color, borderColor: color, color: '#fff' }
                        : { borderColor: '#e5e7eb', color: '#d1d5db', backgroundColor: '#fafafa' }
                      }
                    >
                      {isThis ? <Check size={10} /> : <span className="opacity-40">{transportIconsSm[vh.mode]}</span>}
                    </button>
                  );
                })}
              </>
            )}

            {/* Seat input */}
            <input
              value={assignedSeat}
              onChange={e => assignedVh && onAssign(p.userId, assignedVh.id, e.target.value)}
              placeholder="—"
              disabled={!assignedVh}
              className="w-10 h-7 shrink-0 px-1 rounded-lg border border-dark-200 bg-white text-[10px] text-center font-mono focus:outline-none disabled:opacity-30 disabled:bg-dark-50"
            />

            {/* Ticket upload / view / delete */}
            {assignedVh ? (() => {
              const ps = assignedVh.passengerSeats.find(x => x.userId === p.userId);
              const ticket = ps?.ticket;
              return ticket ? (
                <div className="flex items-center gap-0.5 shrink-0">
                  <a
                    href={ticket.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`View: ${ticket.name}`}
                    className="w-6 h-7 rounded-l-lg border border-r-0 border-court-200 bg-court-50 flex items-center justify-center text-court-500 hover:bg-court-100 transition-colors"
                  >
                    {ticket.type === 'application/pdf' ? <FileText size={11} /> : <Eye size={11} />}
                  </a>
                  <button
                    onClick={() => onUploadTicket(leg.id, assignedVh.id, p.userId, null as unknown as File)}
                    title="Remove ticket"
                    className="w-6 h-7 rounded-r-lg border border-red-200 bg-red-50 flex items-center justify-center text-red-400 hover:bg-red-100 transition-colors"
                  >
                    <X size={9} />
                  </button>
                </div>
              ) : (
                <label className="w-[50px] h-7 shrink-0 rounded-lg border border-dark-200 flex items-center justify-center text-dark-400 hover:bg-dark-50 hover:text-dark-600 transition-colors cursor-pointer" title="Upload ticket / boarding pass">
                  <Paperclip size={11} />
                  <input
                    type="file"
                    accept=".png,.jpg,.jpeg,.pdf"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file && assignedVh) onUploadTicket(leg.id, assignedVh.id, p.userId, file);
                    }}
                  />
                </label>
              );
            })() : <div className="w-[50px] h-6 shrink-0" />}
          </div>
        );
      })}
    </div>
  );
}

function RouteFormModal({ route, onClose, onSave, defaultTimezone }: {
  route: TravelRoute | null;
  onClose: () => void;
  onSave: (r: TravelRoute) => void;
  defaultTimezone?: string;
}) {
  const [origin, setOrigin] = useState(route?.origin || '');
  const [destination, setDestination] = useState(route?.destination || '');
  const [routePassengers, setRoutePassengers] = useState<{ userId: string; name: string; avatar: string }[]>(route?.passengers || []);
  const [legs, setLegs] = useState<TravelLeg[]>(route?.legs || []);
  const [collapsedLegs, setCollapsedLegs] = useState<Set<string>>(new Set());
  const toggleLegCollapsed = (legId: string) => setCollapsedLegs(prev => { const n = new Set(prev); n.has(legId) ? n.delete(legId) : n.add(legId); return n; });
  const [collapsedAssignments, setCollapsedAssignments] = useState<Set<string>>(new Set());
  const toggleAssignments = (legId: string) => setCollapsedAssignments(prev => { const n = new Set(prev); n.has(legId) ? n.delete(legId) : n.add(legId); return n; });

  const toggleRoutePassenger = (p: typeof allPeople[0]) => {
    if (routePassengers.some(pp => pp.userId === p.userId)) {
      setLegs(ls => ls.map(leg => ({
        ...leg,
        vehicles: leg.vehicles.map(vh => ({ ...vh, passengerSeats: vh.passengerSeats.filter(ps => ps.userId !== p.userId) })),
      })));
      setRoutePassengers(prev => prev.filter(x => x.userId !== p.userId));
    } else {
      setRoutePassengers(prev => [...prev, p]);
    }
  };

  const addLeg = () => {
    const newLeg: TravelLeg = { id: `lg-${Date.now()}`, vehicles: [] };
    setLegs(prev => [...prev, newLeg]);
  };

  const removeLeg = (legId: string) => setLegs(prev => prev.filter(l => l.id !== legId));

  const updateLegLabel = (legId: string, label: string) =>
    setLegs(prev => prev.map(l => l.id === legId ? { ...l, label } : l));

  const addVehicle = (legId: string) => {
    const legIdx = legs.findIndex(l => l.id === legId);
    const defaultMode: TransportMode = legIdx === 1 ? 'train' : 'bus';
    const newVh: TravelVehicle = { id: `vh-${Date.now()}`, mode: defaultMode, name: '', departure: '', arrival: '', capacity: modeDefaultCapacity[defaultMode], passengerSeats: [] };
    setLegs(prev => prev.map(l => l.id === legId ? { ...l, vehicles: [...l.vehicles, newVh] } : l));
  };

  const removeVehicle = (legId: string, vhId: string) =>
    setLegs(prev => prev.map(l => l.id === legId ? { ...l, vehicles: l.vehicles.filter(v => v.id !== vhId) } : l));

  const updateVehicle = (legId: string, vhId: string, patch: Partial<TravelVehicle>) =>
    setLegs(prev => prev.map(l => l.id === legId
      ? { ...l, vehicles: l.vehicles.map(v => v.id === vhId ? { ...v, ...patch } : v) }
      : l
    ));

  const assignPassengerToVehicle = (legId: string, userId: string, vehicleId: string | null, seat: string) => {
    setLegs(prev => prev.map(leg => leg.id !== legId ? leg : {
      ...leg,
      vehicles: leg.vehicles
        .map(vh => ({ ...vh, passengerSeats: vh.passengerSeats.filter(ps => ps.userId !== userId) }))
        .map(vh => vh.id !== vehicleId ? vh : {
          ...vh,
          passengerSeats: [...vh.passengerSeats, { userId, seat: seat || undefined }],
        }),
    }));
  };

  const uploadTicket = (legId: string, vehicleId: string, userId: string, file: File | null) => {
    const ticket = file ? { name: file.name, url: URL.createObjectURL(file), type: file.type } : undefined;
    setLegs(prev => prev.map(leg => leg.id !== legId ? leg : {
      ...leg,
      vehicles: leg.vehicles.map(vh => vh.id !== vehicleId ? vh : {
        ...vh,
        passengerSeats: vh.passengerSeats.map(ps => ps.userId !== userId ? ps : { ...ps, ticket }),
      }),
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-elevated w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-dark-100 shrink-0">
          <div>
            <h3 className="text-sm font-bold text-dark-900">{route ? 'Edit Route' : 'Add Route'}</h3>
            <p className="text-[11px] text-dark-400 mt-0.5">Route → Legs (segments) → Vehicles (modes of transport per segment)</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-dark-50 text-dark-400"><X size={16} /></button>
        </div>

        {/* Body — two columns */}
        <div className="flex flex-1 min-h-0">
          {/* Left: origin/destination + passengers */}
          <div className="w-52 shrink-0 border-r border-dark-100 flex flex-col">
            <div className="p-4 space-y-3 border-b border-dark-100">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-dark-400 mb-1">Origin *</label>
                <input value={origin} onChange={e => setOrigin(e.target.value)} placeholder="e.g. Team Hotel"
                  className="w-full h-8 px-2.5 rounded-lg border border-dark-200 text-xs focus:outline-none focus:ring-2 focus:ring-court-500/20" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-dark-400 mb-1">Destination *</label>
                <input value={destination} onChange={e => setDestination(e.target.value)} placeholder="e.g. Yankee Stadium"
                  className="w-full h-8 px-2.5 rounded-lg border border-dark-200 text-xs focus:outline-none focus:ring-2 focus:ring-court-500/20" />
              </div>
            </div>
            {/* Passengers */}
            <div className="flex-1 overflow-y-auto p-3">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-dark-400">Passengers</label>
                <div className="flex items-center gap-1.5">
                  {routePassengers.length === allPeople.length ? (
                    <button onClick={() => { setLegs(ls => ls.map(leg => ({ ...leg, vehicles: leg.vehicles.map(vh => ({ ...vh, passengerSeats: vh.passengerSeats.filter(ps => allPeople.some(p => p.userId === ps.userId)) })) }))); setRoutePassengers([]); }}
                      className="text-[10px] font-semibold text-dark-400 hover:text-dark-600 transition-colors">
                      Clear all
                    </button>
                  ) : (
                    <button onClick={() => setRoutePassengers(allPeople)}
                      className="text-[10px] font-semibold text-court-500 hover:text-court-700 transition-colors">
                      Select all
                    </button>
                  )}
                  <span className="text-[10px] font-semibold text-court-600 bg-court-50 px-1.5 py-0.5 rounded">{routePassengers.length}/{allPeople.length}</span>
                </div>
              </div>
              <div className="space-y-0.5">
                {allPeople.map(p => {
                  const isSelected = routePassengers.some(pp => pp.userId === p.userId);
                  return (
                    <button key={p.userId} onClick={() => toggleRoutePassenger(p)}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors text-left ${isSelected ? 'bg-court-50' : 'hover:bg-dark-50'}`}>
                      <div className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${isSelected ? 'bg-court-500 border-court-500' : 'border-dark-300'}`}>
                        {isSelected && <Check size={7} className="text-white" />}
                      </div>
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-court-400 to-court-600 flex items-center justify-center shrink-0">
                        <span className="text-[7px] font-bold text-white">{p.avatar}</span>
                      </div>
                      <div className="min-w-0">
                        <p className={`text-xs truncate leading-tight ${isSelected ? 'font-semibold text-dark-900' : 'text-dark-600'}`}>{p.name}</p>
                        <p className="text-[10px] text-dark-400 font-normal truncate leading-tight">{p.role}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Legs + Vehicles */}
          <div className="flex-1 min-w-0 flex flex-col">
            <div className="flex items-center justify-between px-4 pt-3 pb-2 shrink-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-dark-400">Legs ({legs.length})</span>
              <button onClick={addLeg} className="h-7 px-2.5 rounded-lg bg-court-500 text-white text-[11px] font-semibold hover:bg-court-600 flex items-center gap-1">
                <Plus size={11} /> Add Leg
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
              {legs.length === 0 ? (
                <div className="text-center py-10">
                  <Navigation size={20} className="mx-auto mb-2 text-dark-300" />
                  <p className="text-xs text-dark-400">No legs yet — click "Add Leg"</p>
                </div>
              ) : legs.map((leg, legIdx) => (
                <div key={leg.id} className="border border-dark-200 rounded-xl overflow-hidden">
                  {/* Leg header */}
                  <div className="flex items-center gap-2 px-3 py-2 bg-dark-50/60">
                    <span className="w-5 h-5 rounded-full bg-dark-300 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                      {legIdx + 1}
                    </span>
                    <input
                      value={leg.label || ''}
                      onChange={e => updateLegLabel(leg.id, e.target.value)}
                      placeholder={legIdx === 0 ? 'e.g. Team Hotel → Grand Central Station' : legIdx === 1 ? 'e.g. Grand Central → Yankee Stadium Station' : 'e.g. Stadium → Airport (Heathrow T5)'}
                      className="flex-1 h-7 px-2 rounded-lg border border-dark-200 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-court-500/30"
                    />
                    <button onClick={() => addVehicle(leg.id)}
                      className="h-6 px-2 rounded-md bg-court-50 text-court-600 text-[10px] font-semibold hover:bg-court-100 flex items-center gap-1 transition-colors shrink-0">
                      <Plus size={9} /> Vehicle
                    </button>
                    <button onClick={() => removeLeg(leg.id)} className="p-1 rounded-lg hover:bg-red-50 text-dark-300 hover:text-red-500 transition-colors">
                      <Trash2 size={12} />
                    </button>
                    <button onClick={() => toggleLegCollapsed(leg.id)} className="p-1 rounded-lg hover:bg-dark-100 text-dark-400 transition-colors shrink-0">
                      <ChevronDown size={13} className={`transition-transform ${collapsedLegs.has(leg.id) ? '' : 'rotate-180'}`} />
                    </button>
                  </div>
                  {/* Collapsed summary */}
                  {collapsedLegs.has(leg.id) && (() => {
                    const totalAssigned = [...new Set(leg.vehicles.flatMap(v => v.passengerSeats.map(ps => ps.userId)))].length;
                    const totalCap = leg.vehicles.reduce((s, v) => s + (v.capacity ?? 0), 0);
                    return (
                      <div className="flex items-center gap-3 px-4 py-1.5 border-t border-dark-100 bg-white flex-wrap">
                        <span className="text-[10px] text-dark-400">{leg.vehicles.length} vehicle{leg.vehicles.length !== 1 ? 's' : ''}</span>
                        <span className="text-dark-200 text-[10px]">·</span>
                        <span className="text-[10px] text-dark-400">{totalAssigned} assigned{totalCap > 0 ? ` / ${totalCap} capacity` : ''}</span>
                        {leg.vehicles.length > 0 && (
                          <>
                            <span className="text-dark-200 text-[10px]">·</span>
                            <div className="flex items-center gap-1">
                              {leg.vehicles.map(v => (
                                <div key={v.id} className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-medium" style={{ backgroundColor: transportColors[v.mode] + '18', color: transportColors[v.mode] }}>
                                  {transportIconsSm[v.mode]}
                                  <span>{v.name || 'Unnamed'}</span>
                                  <span className="opacity-60">({v.passengerSeats.length})</span>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })()}
                  {/* Vehicles */}
                  <AnimatePresence initial={false}>
                  {!collapsedLegs.has(leg.id) && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                  <div className="p-2 space-y-2 bg-white">
                    {leg.vehicles.length === 0 ? (
                      <p className="text-[11px] text-dark-300 italic text-center py-2">No vehicles — click "+ Vehicle" above</p>
                    ) : leg.vehicles.map(vh => (
                      <VehicleRow
                        key={vh.id}
                        vh={vh}
                        defaultTimezone={defaultTimezone}
                        onUpdate={patch => updateVehicle(leg.id, vh.id, patch)}
                        onRemove={() => removeVehicle(leg.id, vh.id)}
                      />
                    ))}
                  </div>
                  {/* Passenger assignments */}
                  <div className="px-2 pb-2">
                    {/* Accordion header */}
                    <button
                      onClick={() => toggleAssignments(leg.id)}
                      className="w-full flex items-center gap-2 mb-1.5 group"
                    >
                      <div className="flex-1 h-px bg-dark-100" />
                      <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-dark-400 group-hover:text-dark-600 transition-colors">
                        Passenger Assignments
                        <ChevronDown size={10} className={`transition-transform ${collapsedAssignments.has(leg.id) ? '' : 'rotate-180'}`} />
                      </span>
                      <div className="flex-1 h-px bg-dark-100" />
                    </button>
                    {/* Collapsed summary */}
                    {collapsedAssignments.has(leg.id) && (() => {
                      const assignedIds = new Set(leg.vehicles.flatMap(v => v.passengerSeats.map(ps => ps.userId)));
                      const unassigned = routePassengers.filter(p => !assignedIds.has(p.userId)).length;
                      return (
                        <div className="flex items-center gap-2 flex-wrap py-1">
                          {unassigned > 0 && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-dark-100 text-[10px] text-dark-500 font-medium">
                              None · {unassigned}
                            </span>
                          )}
                          {leg.vehicles.map(v => (
                            <span key={v.id} className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium" style={{ backgroundColor: transportColors[v.mode] + '18', color: transportColors[v.mode] }}>
                              {transportIconsSm[v.mode]}
                              <span>{v.name || 'Vehicle'}</span>
                              <span className="opacity-70">· {v.passengerSeats.length}</span>
                            </span>
                          ))}
                        </div>
                      );
                    })()}
                    <AnimatePresence initial={false}>
                      {!collapsedAssignments.has(leg.id) && (
                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                          <LegPassengerTable
                            leg={leg}
                            routePassengers={routePassengers}
                            onAssign={(userId, vehicleId, seat) => assignPassengerToVehicle(leg.id, userId, vehicleId, seat)}
                            onUploadTicket={uploadTicket}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  </motion.div>
                  )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-3 border-t border-dark-100 shrink-0">
          <button onClick={onClose} className="h-8 px-3 rounded-lg border border-dark-200 text-xs font-medium text-dark-600 hover:bg-dark-50">Cancel</button>
          <button
            onClick={() => onSave({ id: route?.id || '', origin, destination, passengers: routePassengers, legs })}
            disabled={!origin || !destination}
            className="h-8 px-4 rounded-lg bg-court-500 text-white text-xs font-semibold hover:bg-court-600 disabled:opacity-40 flex items-center gap-1.5"
          ><Save size={13} /> Save Route</button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Place form modal wrapper (computes default dates) ─
function PlaceFormModalWrapper({ place, onClose, onSave, onDelete, eventStartDate, eventEndDate }: {
  place: AccommodationPlace | null;
  onClose: () => void;
  onSave: (p: AccommodationPlace) => void;
  onDelete?: () => void;
  eventStartDate?: string;
  eventEndDate?: string;
}) {
  const shiftDay = (dateStr: string, delta: number) => {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + delta);
    return d.toISOString().slice(0, 10);
  };
  const sameDay = eventStartDate && eventEndDate && eventStartDate === eventEndDate;
  const defCheckIn  = sameDay ? shiftDay(eventStartDate!, -1) : eventStartDate;
  const defCheckOut = sameDay ? shiftDay(eventEndDate!,    1) : eventEndDate;
  return <PlaceFormModal place={place} onClose={onClose} onSave={onSave} onDelete={onDelete} defaultCheckIn={defCheckIn} defaultCheckOut={defCheckOut} />;
}

// ── Place form modal ──────────────────────────────────
function PlaceFormModal({ place, onClose, onSave, onDelete, defaultCheckIn, defaultCheckOut }: {
  place: AccommodationPlace | null;
  onClose: () => void;
  onSave: (p: AccommodationPlace) => void;
  onDelete?: () => void;
  defaultCheckIn?: string;
  defaultCheckOut?: string;
}) {
  const [name, setName] = useState(place?.name || '');
  const [location, setLocation] = useState(place?.location || '');
  const [checkIn, setCheckIn] = useState(place?.checkIn || defaultCheckIn || '');
  const [checkOut, setCheckOut] = useState(place?.checkOut || defaultCheckOut || '');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const fmtDate = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: '2-digit' });
  const shiftDate = (val: string, delta: number) => { const d = new Date(val + 'T12:00:00'); d.setDate(d.getDate() + delta); return d.toISOString().slice(0, 10); };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-elevated w-full max-w-sm overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center">
              <Hotel size={15} className="text-violet-600" />
            </div>
            <h3 className="text-base font-bold text-dark-900">{place ? 'Edit Place' : 'Add Place'}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-dark-100 text-dark-400 transition-colors"><X size={15} /></button>
        </div>

        <div className="px-5 pb-5 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-dark-400 mb-1.5">Hotel / Venue Name <span className="text-court-500">*</span></label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. The Grand Liverpool"
              className="w-full h-10 px-3.5 rounded-xl border border-dark-200 text-sm font-medium text-dark-900 placeholder:text-dark-300 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300 transition-all" />
          </div>

          {/* Location + pin */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-dark-400 mb-1.5">Location</label>
            <input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Liverpool, UK"
              className="w-full h-10 px-3.5 rounded-xl border border-dark-200 text-sm font-medium text-dark-900 placeholder:text-dark-300 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300 transition-all" />
            <button type="button" className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-violet-500 hover:text-violet-700 transition-colors">
              <MapPin size={11} />
              Set exact map pin
              <span className="font-normal text-dark-300 ml-0.5">— used for navigation</span>
            </button>
          </div>

          {/* Check-in / Check-out */}
          <div className="bg-dark-50/60 rounded-2xl p-3.5 space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-dark-400">Stay Dates</p>
            <div className="grid grid-cols-2 gap-3">
              {/* Check-in */}
              <div className="bg-white rounded-xl border border-dark-100 overflow-hidden">
                <div className="px-3 pt-2.5 pb-1">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-dark-400">Check-in</p>
                  {checkIn
                    ? <p className="text-xs font-bold text-dark-800 mt-0.5">{fmtDate(checkIn)}</p>
                    : <p className="text-xs text-dark-300 mt-0.5">Not set</p>
                  }
                </div>
                <input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)}
                  className="w-full px-3 pb-2 text-[11px] text-dark-500 focus:outline-none bg-transparent" />
                <div className="flex border-t border-dark-100">
                  <button onClick={() => checkIn && setCheckIn(shiftDate(checkIn, -1))} className="flex-1 py-1.5 text-sm font-bold text-dark-400 hover:bg-dark-50 hover:text-dark-700 transition-colors">−</button>
                  <div className="w-px bg-dark-100" />
                  <button onClick={() => checkIn && setCheckIn(shiftDate(checkIn, 1))} className="flex-1 py-1.5 text-sm font-bold text-dark-400 hover:bg-dark-50 hover:text-dark-700 transition-colors">+</button>
                </div>
              </div>

              {/* Check-out */}
              <div className="bg-white rounded-xl border border-dark-100 overflow-hidden">
                <div className="px-3 pt-2.5 pb-1">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-dark-400">Check-out</p>
                  {checkOut
                    ? <p className="text-xs font-bold text-dark-800 mt-0.5">{fmtDate(checkOut)}</p>
                    : <p className="text-xs text-dark-300 mt-0.5">Not set</p>
                  }
                </div>
                <input type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)} min={checkIn || undefined}
                  className="w-full px-3 pb-2 text-[11px] text-dark-500 focus:outline-none bg-transparent" />
                <div className="flex border-t border-dark-100">
                  <button onClick={() => checkOut && setCheckOut(shiftDate(checkOut, -1))} className="flex-1 py-1.5 text-sm font-bold text-dark-400 hover:bg-dark-50 hover:text-dark-700 transition-colors">−</button>
                  <div className="w-px bg-dark-100" />
                  <button onClick={() => checkOut && setCheckOut(shiftDate(checkOut, 1))} className="flex-1 py-1.5 text-sm font-bold text-dark-400 hover:bg-dark-50 hover:text-dark-700 transition-colors">+</button>
                </div>
              </div>
            </div>
            {checkIn && checkOut && (
              <p className="text-[10px] text-dark-400 text-center">
                {Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000)} night stay
              </p>
            )}
          </div>
        </div>

        {/* Confirm delete panel */}
        <div className="border-t border-dark-100">
          {confirmDelete && (
            <div className="mx-5 mt-3 mb-0 rounded-xl bg-red-50 border border-red-100 p-3.5">
              <p className="text-xs font-bold text-red-700 mb-0.5">Delete this place?</p>
              <p className="text-[11px] text-red-500 mb-2.5 leading-relaxed">All rooms and guest assignments will be permanently removed.</p>
              <div className="flex gap-2">
                <button onClick={() => { onDelete!(); onClose(); }} className="flex-1 h-8 rounded-lg bg-red-500 text-white text-[11px] font-semibold hover:bg-red-600 flex items-center justify-center gap-1.5 transition-colors">
                  <Trash2 size={11} /> Yes, delete
                </button>
                <button onClick={() => setConfirmDelete(false)} className="flex-1 h-8 rounded-lg border border-red-200 text-[11px] font-semibold text-red-500 hover:bg-white transition-colors">
                  Go back
                </button>
              </div>
            </div>
          )}
          <div className="flex items-center justify-between px-5 py-3.5">
            {onDelete ? (
              <button onClick={() => setConfirmDelete(true)} className="flex items-center gap-1.5 text-[11px] font-semibold text-red-400 hover:text-red-600 transition-colors">
                <Trash2 size={12} /> Delete place
              </button>
            ) : <span />}
            <div className="flex gap-2">
              <button onClick={onClose} className="h-8 px-4 rounded-xl border border-dark-200 text-xs font-semibold text-dark-600 hover:bg-dark-50 transition-colors">Cancel</button>
              <button onClick={() => onSave({ id: place?.id || '', name, location, checkIn: checkIn || undefined, checkOut: checkOut || undefined, rooms: place?.rooms || [] })} disabled={!name}
                className="h-8 px-4 rounded-xl bg-court-500 text-white text-xs font-semibold hover:bg-court-600 disabled:opacity-40 flex items-center gap-1.5 transition-colors"><Save size={12} /> Save</button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ── Room form modal ───────────────────────────────────
function RoomFormModal({ room, onClose, onSave }: {
  room: AccommodationRoom | null;
  onClose: () => void;
  onSave: (r: AccommodationRoom) => void;
}) {
  const [roomType, setRoomType] = useState<RoomType>(room?.roomType || 'double');
  const [roomNumber, setRoomNumber] = useState(room?.roomNumber || '');

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-elevated w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-dark-100">
          <h3 className="text-sm font-bold text-dark-900">{room ? 'Edit Room' : 'Add Room'}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-dark-50 text-dark-400"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1.5">Room Type</label>
            <div className="grid grid-cols-4 gap-2">
              {(['single', 'double', 'twin', 'suite'] as RoomType[]).map(t => (
                <button key={t} onClick={() => setRoomType(t)}
                  className={`flex flex-col items-center gap-1 py-2.5 rounded-xl text-[11px] font-semibold capitalize transition-all ${roomType === t ? 'text-white shadow-sm' : 'bg-dark-50 text-dark-500 hover:bg-dark-100'}`}
                  style={roomType === t ? { backgroundColor: roomColors[t] } : {}}>
                  {roomIcons[t]}{t}
                  <span className="text-[9px] opacity-75">max {roomCapacity[t]}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-dark-400 mb-1">Room Number *</label>
            <input value={roomNumber} onChange={e => setRoomNumber(e.target.value)} placeholder="e.g. 302"
              className="w-full h-9 px-3 rounded-lg border border-dark-200 text-sm focus:outline-none focus:ring-2 focus:ring-court-500/20" />
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-3 border-t border-dark-100">
          <button onClick={onClose} className="h-8 px-3 rounded-lg border border-dark-200 text-xs font-medium text-dark-600 hover:bg-dark-50">Cancel</button>
          <button onClick={() => onSave({ id: room?.id || '', roomType, roomNumber, occupants: room?.occupants || [] })} disabled={!roomNumber}
            className="h-8 px-4 rounded-lg bg-court-500 text-white text-xs font-semibold hover:bg-court-600 disabled:opacity-40 flex items-center gap-1.5"><Save size={13} /> Save</button>
        </div>
      </motion.div>
    </div>
  );
}
