import React from 'react';
import { Clock, FileText } from 'lucide-react';
import type { DayPlan, PlannerCycle, PlannerBlock } from '@/data/planner';

interface DayPlanCellProps {
  plan?: DayPlan;
  cycle?: PlannerCycle;
  block?: PlannerBlock;
  onClick: () => void;
}

export default function DayPlanCell({ plan, cycle, block, onClick }: DayPlanCellProps) {
  if (!plan) {
    return (
      <button
        onClick={onClick}
        className="w-full h-14 rounded-lg border border-dashed border-dark-200/60 hover:border-court-300 hover:bg-court-50/30 transition-all flex items-center justify-center group"
      >
        <span className="text-[10px] text-dark-300 group-hover:text-court-500 font-medium">+ Plan</span>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="w-full h-14 rounded-lg p-1.5 text-left transition-all hover:shadow-sm hover:brightness-95"
      style={{ backgroundColor: block?.color || cycle?.color || '#E8F5E9' }}
    >
      <div className="flex items-center gap-1 mb-0.5">
        <Clock size={8} className="text-dark-500" />
        <span className="text-[9px] font-bold text-dark-600">{plan.durationMinutes}m</span>
      </div>
      <div className="text-[9px] font-semibold text-dark-700 truncate">
        {plan.drillIds.length} drill{plan.drillIds.length !== 1 ? 's' : ''}
      </div>
      {plan.notes && (
        <div className="flex items-center gap-0.5 mt-0.5">
          <FileText size={7} className="text-dark-400" />
          <span className="text-[8px] text-dark-400 truncate">{plan.notes}</span>
        </div>
      )}
    </button>
  );
}
