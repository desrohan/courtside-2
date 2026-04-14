import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Warehouse, Building2 } from 'lucide-react';
import { facilityCenters } from '@/data/facilities';
import { events, CalendarEvent } from '@/data/events';
import { format, parseISO, isToday, addDays, subDays, isSameDay } from 'date-fns';

export interface FacilitySelection {
  date: string;
  startTime: string;
  endTime: string;
  venueId: string;
  facilityId: string; // empty string if venue-mode column
}

interface Props {
  onEventClick: (event: CalendarEvent) => void;
  onSelect?: (sel: FacilitySelection) => void;
}

type GroupMode = 'venue' | 'facility';

interface Column {
  id: string;
  label: string;
  subLabel?: string;
  facilityIds: string[]; // which facility IDs this column covers
}

const HOURS = Array.from({ length: 15 }, (_, i) => i + 6); // 6am–8pm
const HOUR_PX = 64; // height of each hour row in px
const ROW_LABEL_W = 56; // px width of the time label column

export default function FacilityView({ onEventClick, onSelect }: Props) {
  const [viewDate, setViewDate] = useState(new Date());
  const [groupMode, setGroupMode] = useState<GroupMode>('facility');
  const [activeVenueIds, setActiveVenueIds] = useState<string[]>(
    facilityCenters.map(fc => fc.id)
  );
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to 8am on mount
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = (8 - 6) * HOUR_PX;
    }
  }, []);

  // Drag-select state
  const dragCol = useRef<Column | null>(null);
  const dragStartY = useRef<number>(0);
  const dragCurrentY = useRef<number>(0);
  const [dragOverlay, setDragOverlay] = useState<{ colId: string; top: number; height: number } | null>(null);

  const yToTime = (y: number): string => {
    const clampedMin = Math.max(0, Math.min(Math.round(y / (HOUR_PX / 60)), HOURS.length * 60));
    const totalMin = (HOURS[0] * 60) + clampedMin;
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const snapToInterval = (timeStr: string, intervalMin = 15): string => {
    const [h, m] = timeStr.split(':').map(Number);
    const snapped = Math.round((h * 60 + m) / intervalMin) * intervalMin;
    return `${String(Math.floor(snapped / 60)).padStart(2, '0')}:${String(snapped % 60).padStart(2, '0')}`;
  };

  const getRelativeY = (e: React.MouseEvent<HTMLDivElement>, el: HTMLDivElement): number => {
    const rect = el.getBoundingClientRect();
    return e.clientY - rect.top;
  };

  const handleColMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>, col: Column) => {
    if (e.button !== 0) return;
    e.preventDefault();
    dragCol.current = col;
    const y = getRelativeY(e, e.currentTarget as HTMLDivElement);
    dragStartY.current = y;
    dragCurrentY.current = y;
    setDragOverlay({ colId: col.id, top: y, height: 0 });
  }, []);

  const handleColMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>, col: Column) => {
    if (!dragCol.current || dragCol.current.id !== col.id) return;
    const y = getRelativeY(e, e.currentTarget as HTMLDivElement);
    dragCurrentY.current = y;
    const top = Math.min(dragStartY.current, y);
    const height = Math.abs(y - dragStartY.current);
    setDragOverlay({ colId: col.id, top, height });
  }, []);

  const handleColMouseUp = useCallback((e: React.MouseEvent<HTMLDivElement>, col: Column) => {
    if (!dragCol.current || dragCol.current.id !== col.id) return;
    const y = getRelativeY(e, e.currentTarget as HTMLDivElement);
    const startY = Math.min(dragStartY.current, y);
    const endY = Math.max(dragStartY.current, y);

    // Treat tiny drags as a single click → 1-hour default
    const minDragPx = 10;
    const rawStart = yToTime(startY);
    const rawEnd = endY - startY < minDragPx ? yToTime(startY + HOUR_PX) : yToTime(endY);
    const startTime = snapToInterval(rawStart);
    const endTime = snapToInterval(rawEnd);

    // Resolve venueId / facilityId from the column
    const venueId = groupMode === 'venue'
      ? col.id
      : facilityCenters.find(fc => fc.facilities.some(f => f.id === col.id))?.id || '';
    const facilityId = groupMode === 'facility' ? col.id : '';

    if (onSelect) {
      onSelect({
        date: format(viewDate, 'yyyy-MM-dd'),
        startTime,
        endTime,
        venueId,
        facilityId,
      });
    }

    dragCol.current = null;
    setDragOverlay(null);
  }, [groupMode, viewDate, onSelect]);

  const toggleVenue = (id: string) =>
    setActiveVenueIds(p =>
      p.includes(id) ? (p.length > 1 ? p.filter(x => x !== id) : p) : [...p, id]
    );

  // Build columns based on mode
  const columns: Column[] = groupMode === 'venue'
    ? facilityCenters
        .filter(fc => activeVenueIds.includes(fc.id))
        .map(fc => ({
          id: fc.id,
          label: fc.name,
          facilityIds: fc.facilities.map(f => f.id),
        }))
    : facilityCenters
        .filter(fc => activeVenueIds.includes(fc.id))
        .flatMap(fc =>
          fc.facilities.map(f => ({
            id: f.id,
            label: f.name,
            subLabel: fc.name,
            facilityIds: [f.id],
          }))
        );

  const dayEvents = events.filter(ev =>
    isSameDay(parseISO(ev.start.date), viewDate) &&
    ev.facilityIds && ev.facilityIds.length > 0
  );

  const getColEvents = (col: Column) =>
    dayEvents.filter(ev => ev.facilityIds?.some(fid => col.facilityIds.includes(fid)));

  const getEventStyle = (ev: CalendarEvent) => {
    const [sh, sm] = ev.start.time.split(':').map(Number);
    const [eh, em] = ev.end.time.split(':').map(Number);
    const startMin = (sh - 6) * 60 + sm;
    const endMin = (eh - 6) * 60 + em;
    const top = (startMin / 60) * HOUR_PX;
    const height = Math.max(((endMin - startMin) / 60) * HOUR_PX, 22);
    return { top, height };
  };

  const totalH = HOURS.length * HOUR_PX;

  return (
    <div className="bg-white rounded-2xl border border-dark-100 overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 220px)' }}>
      {/* ── Toolbar ── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-dark-100 bg-dark-50/40 shrink-0 flex-wrap">
        {/* Date nav */}
        <button onClick={() => setViewDate(subDays(viewDate, 1))}
          className="p-1.5 rounded-lg hover:bg-dark-100 text-dark-500 transition-colors">
          <ChevronLeft size={16} />
        </button>
        <button onClick={() => setViewDate(new Date())}
          className="h-7 px-3 rounded-lg bg-dark-100 text-[11px] font-semibold text-dark-600 hover:bg-dark-200 transition-colors">
          Today
        </button>
        <button onClick={() => setViewDate(addDays(viewDate, 1))}
          className="p-1.5 rounded-lg hover:bg-dark-100 text-dark-500 transition-colors">
          <ChevronRight size={16} />
        </button>
        <h2 className="text-sm font-bold text-dark-900">
          {format(viewDate, 'EEEE, MMMM d, yyyy')}
          {isToday(viewDate) && (
            <span className="ml-2 px-1.5 py-0.5 bg-court-50 text-court-600 rounded text-[9px] font-bold align-middle">Today</span>
          )}
        </h2>

        <div className="ml-auto flex items-center gap-2 flex-wrap">
          {/* Venue / Facility toggle */}
          <div className="flex rounded-xl border border-dark-200 overflow-hidden bg-white">
            <button
              onClick={() => setGroupMode('venue')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                groupMode === 'venue' ? 'bg-dark-800 text-white' : 'text-dark-500 hover:bg-dark-50'
              }`}
            >
              <Building2 size={12} /> Venue
            </button>
            <button
              onClick={() => setGroupMode('facility')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                groupMode === 'facility' ? 'bg-dark-800 text-white' : 'text-dark-500 hover:bg-dark-50'
              }`}
            >
              <Warehouse size={12} /> Facility
            </button>
          </div>

          {/* Venue filter chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {facilityCenters.map(fc => {
              const active = activeVenueIds.includes(fc.id);
              return (
                <button key={fc.id} onClick={() => toggleVenue(fc.id)}
                  className={`h-7 px-2.5 rounded-lg text-[11px] font-semibold border transition-colors ${
                    active
                      ? 'bg-court-500 text-white border-court-500'
                      : 'bg-white text-dark-400 border-dark-200 hover:border-dark-300'
                  }`}>
                  {fc.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Grid ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Scrollable area */}
        <div ref={scrollRef} className="flex-1 overflow-auto">
          <div style={{ minWidth: `${ROW_LABEL_W + columns.length * 160}px` }}>

            {/* Column headers — sticky top */}
            <div className="sticky top-0 z-20 flex bg-white border-b border-dark-100 shadow-sm">
              {/* Time gutter */}
              <div style={{ width: ROW_LABEL_W, minWidth: ROW_LABEL_W }} className="shrink-0 border-r border-dark-100 bg-dark-50/60" />
              {/* Columns */}
              {columns.map((col, i) => (
                <div key={col.id}
                  style={{ minWidth: 160 }}
                  className={`flex-1 px-3 py-2.5 border-r border-dark-100 last:border-r-0 ${i % 2 === 0 ? 'bg-white' : 'bg-dark-50/30'}`}>
                  <p className="text-xs font-bold text-dark-800 truncate">{col.label}</p>
                  {col.subLabel && (
                    <p className="text-[10px] text-dark-400 truncate mt-0.5">{col.subLabel}</p>
                  )}
                </div>
              ))}
            </div>

            {/* Time rows + event grid */}
            <div className="relative flex">
              {/* Time labels */}
              <div style={{ width: ROW_LABEL_W, minWidth: ROW_LABEL_W }} className="shrink-0 border-r border-dark-100 bg-dark-50/40">
                {HOURS.map(h => (
                  <div key={h} style={{ height: HOUR_PX }}
                    className="flex items-start justify-end pr-2 pt-1 border-b border-dark-100/50 last:border-b-0">
                    <span className="text-[10px] font-semibold text-dark-400 tabular-nums">
                      {h === 12 ? '12pm' : h > 12 ? `${h - 12}pm` : `${h}am`}
                    </span>
                  </div>
                ))}
              </div>

              {/* Column cells */}
              {columns.map((col, ci) => {
                const colEvents = getColEvents(col);
                return (
                  <div key={col.id}
                    style={{ minWidth: 160, position: 'relative', height: totalH }}
                    className={`flex-1 border-r border-dark-100 last:border-r-0 select-none ${ci % 2 === 0 ? '' : 'bg-dark-50/20'} ${onSelect ? 'cursor-crosshair' : ''}`}
                    onMouseDown={e => handleColMouseDown(e, col)}
                    onMouseMove={e => handleColMouseMove(e, col)}
                    onMouseUp={e => handleColMouseUp(e, col)}
                    onMouseLeave={() => { if (dragCol.current?.id === col.id) { dragCol.current = null; setDragOverlay(null); } }}
                  >
                    {/* Hour grid lines */}
                    {HOURS.map(h => (
                      <div key={h} style={{ top: (h - 6) * HOUR_PX, height: HOUR_PX }}
                        className="absolute left-0 right-0 border-b border-dark-100/50" />
                    ))}
                    {/* Half-hour dashed lines */}
                    {HOURS.map(h => (
                      <div key={`${h}-half`}
                        style={{ top: (h - 6) * HOUR_PX + HOUR_PX / 2 }}
                        className="absolute left-0 right-0 border-b border-dashed border-dark-100/30" />
                    ))}
                    {/* Drag selection overlay */}
                    {dragOverlay && dragOverlay.colId === col.id && dragOverlay.height > 4 && (
                      <div
                        style={{ top: dragOverlay.top, height: dragOverlay.height, left: 4, right: 4, position: 'absolute' }}
                        className="rounded-lg bg-court-500/20 border-2 border-court-500 pointer-events-none z-20"
                      />
                    )}
                    {/* Events */}
                    {colEvents.map(ev => {
                      const { top, height } = getEventStyle(ev);
                      return (
                        <button key={ev.id} onClick={() => onEventClick(ev)}
                          style={{ top, height, left: 4, right: 4, position: 'absolute', backgroundColor: ev.eventType.color }}
                          className="rounded-lg px-2 py-1 flex flex-col justify-start overflow-hidden cursor-pointer hover:brightness-110 active:brightness-95 transition-all text-white shadow-sm text-left z-10">
                          <span className="text-[11px] font-bold leading-tight truncate">{ev.title}</span>
                          {height > 32 && (
                            <span className="text-[10px] opacity-80 mt-0.5">{ev.start.time} – {ev.end.time}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      </div>

      {/* Empty state */}
      {columns.length === 0 && (
        <div className="py-16 text-center">
          <Warehouse size={28} className="text-dark-200 mx-auto mb-2" />
          <p className="text-sm text-dark-400">No venues selected</p>
        </div>
      )}
    </div>
  );
}
