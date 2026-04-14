import { Clock, Activity, Tag, FileText } from 'lucide-react';
import { SessionData } from '@/data/events';

interface Props {
  session?: SessionData;
}

export default function SessionTab({ session }: Props) {
  if (!session) {
    return (
      <div className="text-center py-12">
        <div className="w-14 h-14 rounded-2xl bg-dark-50 flex items-center justify-center mx-auto mb-3">
          <Activity size={24} className="text-dark-300" />
        </div>
        <p className="text-sm text-dark-400">No session data recorded</p>
      </div>
    );
  }

  const hours = Math.floor(session.duration / 60);
  const mins = session.duration % 60;
  const durationStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

  const rpeColor = session.rpe <= 3 ? '#22C55E' : session.rpe <= 6 ? '#FFAB00' : '#FF5630';
  const rpeLabel = session.rpe <= 3 ? 'Low' : session.rpe <= 6 ? 'Moderate' : 'High';

  return (
    <div className="space-y-5">
      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Duration */}
        <div className="bg-dark-50/60 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
              <Clock size={16} className="text-dark-500" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-dark-400">Duration</span>
          </div>
          <p className="text-2xl font-extrabold text-dark-900">{durationStr}</p>
          <p className="text-xs text-dark-400 mt-0.5">{session.duration} minutes total</p>
        </div>

        {/* RPE */}
        <div className="bg-dark-50/60 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
              <Activity size={16} className="text-dark-500" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-dark-400">RPE</span>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-extrabold" style={{ color: rpeColor }}>{session.rpe}</p>
            <span className="text-xs font-semibold" style={{ color: rpeColor }}>/ 10 ({rpeLabel})</span>
          </div>
          <div className="mt-2 h-2 bg-dark-200 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${(session.rpe / 10) * 100}%`, backgroundColor: rpeColor }}
            />
          </div>
        </div>
      </div>

      {/* Tags */}
      {session.tags.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Tag size={13} className="text-dark-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-dark-400">Tags</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {session.tags.map(tag => (
              <span key={tag} className="px-3 py-1.5 bg-court-50 text-court-700 rounded-lg text-xs font-semibold">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {session.notes && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <FileText size={13} className="text-dark-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-dark-400">Session Notes</h4>
          </div>
          <div className="p-4 bg-dark-50/60 rounded-xl">
            <p className="text-sm text-dark-700 leading-relaxed">{session.notes}</p>
          </div>
        </div>
      )}
    </div>
  );
}
