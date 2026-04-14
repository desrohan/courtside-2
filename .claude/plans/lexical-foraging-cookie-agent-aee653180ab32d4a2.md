# Courtside UI - GroupsModule Enhancement Plan

## Overview

Three features to add to the GroupsModule:
1. **Flat Batch Listings** - Individual batches shown as separate rows (not nested under parent segments)
2. **Click-to-Detail View** - Clicking any segment or batch in GroupsModule opens a detail view
3. **Transfer/Reassign Modal** - Move users between teams, segments, and batches

---

## Current Architecture Summary

- **GroupsModule** (`src/pages/GroupsModule.tsx`): 212 lines. Three tabs (Teams/Segments/Batches). All clicks navigate to `/o/{orgId}/team` (TeamsModule). State is URL-driven for tabs, in-component for search. No detail views.
- **TeamsModule** (`src/pages/TeamsModule.tsx`): 648 lines. Has a mature 3-level drill-down: Team List -> Team Detail (Members/Segments tabs) -> Segment Detail. Uses `useState` for `viewMode`, `selectedTeam`, `selectedSegment`. Contains `SegmentFormModal` and `InfoCard` helper.
- **Data**: `segments.ts` exports `Segment[]` with nested `batches?: Batch[]` and `registrants: SegmentRegistrant[]`. `users.ts` exports `User[]` with `teamIds: string[]`.
- **Routing**: `App.tsx` uses `path="groups/*"` for GroupsModule. No sub-routes currently used.
- **UI Conventions**: Framer Motion for enter animations, Lucide icons, Tailwind with custom `court-*` and `dark-*` palette, `rounded-xl`/`rounded-2xl` cards, `shadow-card`/`shadow-card-hover`/`shadow-elevated` shadows, Inter font.

---

## Feature 1: Flat Batch Listings in GroupsModule

### Problem
The Batches tab currently shows parent segments (type='batch') as cards, with individual batches as small preview pills nested inside. The user wants each individual `Batch` to appear as its own row.

### Data Transformation

Add a helper function in `segments.ts` to flatten batches:

```typescript
export interface FlatBatch extends Batch {
  parentSegmentId: string;
  parentSegmentName: string;
  parentSegmentStatus: SegmentStatus;
  teamId: string;
}

export function getFlatBatches(): FlatBatch[] {
  return segments
    .filter(s => s.type === 'batch')
    .flatMap(seg =>
      (seg.batches || []).map(batch => ({
        ...batch,
        parentSegmentId: seg.id,
        parentSegmentName: seg.name,
        parentSegmentStatus: seg.status,
        teamId: seg.teamId,
      }))
    );
}
```

This produces one entry per individual batch (e.g., "Skills Training", "Fitness & Conditioning", "Goalkeeping Masterclass" from Easter Skills Camp).

### UI Changes in GroupsModule.tsx - Batches Tab

Replace the current batches section (lines 156-208) with a flat table/row layout.

**Tab count**: Change from `allBatches.length` (count of parent segments) to the total number of individual batches. Use `getFlatBatches().length`.

**Search**: Search should match against both the batch name and the parent segment name.

**Row layout** (for each FlatBatch):

```
[Color dot] [Batch Name]  [Parent Segment badge]  [Status badge]
            [Team name]   [Days: Mon, Wed, Fri]   [Time: 09:00-12:00]
            [Sessions: 6] [Enrolled: 14/20]        [Fee: £150]
```

Each row is a `motion.div` with the same styling pattern as the current segments tab rows:
- `bg-white border border-dark-100 rounded-xl p-5 hover:shadow-card hover:border-purple-200 transition-all cursor-pointer group`
- Left color accent bar using `batch.eventColor`
- Batch name as primary heading (`text-sm font-bold text-dark-900`)
- Parent segment name as a small purple badge: `px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-600`
- Status badge from `statusConfig[parentSegmentStatus]`
- Metadata row: team name, days, time, sessions count, enrollment fraction, optional fee
- Enrollment progress bar (matching the batch card style from TeamsModule lines 355-363)
- ChevronRight icon on hover for click affordance

**Implementation note**: The `onClick` handler should open the detail view (Feature 2), not navigate to `/o/{orgId}/team`.

### Estimated Scope
- `segments.ts`: Add `FlatBatch` interface + `getFlatBatches()` function (~15 lines)
- `GroupsModule.tsx`: Replace batches tab block (~50 lines replaced with ~65 lines), update tab count

---

## Feature 2: Segment/Batch Detail View in GroupsModule

### Design Decision: State-Driven 3-Level Navigation (like TeamsModule)

The TeamsModule already implements a clean pattern for drill-down views using `useState`:
- `viewMode: 'list' | 'detail'`
- `selectedTeam`, `selectedSegment`

GroupsModule should adopt the same pattern. When a user clicks a segment or batch, the listing is replaced by a detail view inline. This is consistent with the existing UX and avoids routing complexity.

### New State in GroupsModule

```typescript
type GroupsView = 'list' | 'segment-detail' | 'batch-detail';

const [view, setView] = useState<GroupsView>('list');
const [selectedSegment, setSelectedSegment] = useState<Segment | null>(null);
const [selectedBatch, setSelectedBatch] = useState<FlatBatch | null>(null);
```

### Navigation Flow

1. **List view** (current): Shows tabs (Teams/Segments/Batches) with cards/rows
2. **Click a segment row** -> `setView('segment-detail')`, `setSelectedSegment(seg)`
3. **Click a batch row** -> `setView('batch-detail')`, `setSelectedBatch(flatBatch)`, also load the parent segment
4. **Click a team card** -> Either navigate to TeamsModule (keep existing behavior) or show team detail. Since TeamsModule already handles team details well, keep the existing navigate to `/o/{orgId}/team` for now, or better: navigate to TeamsModule with the team pre-selected. For simplicity, keep current behavior.
5. **Back button** -> `setView('list')`, clear selections

### Segment Detail View Component

Extract the Segment Detail View from TeamsModule (lines 240-452) into a reusable component. This avoids code duplication. The view includes:

- Back breadcrumb
- Segment header (name, status badge, description)
- Edit/Delete buttons
- Info grid (start date, end date, registered count, location, schedule, age group, fee)
- Signup link section
- Event schedule (for type='segment') OR Batch cards (for type='batch')
- Registrants table

**Approach**: Create `src/components/groups/SegmentDetailView.tsx` that receives:
```typescript
interface SegmentDetailViewProps {
  segment: Segment;
  onBack: () => void;
  onEdit?: (segment: Segment) => void;
  onTransfer?: (registrant: SegmentRegistrant) => void; // for Feature 3
}
```

This component can be reused by both GroupsModule and TeamsModule, reducing duplication.

**Reuse from TeamsModule**: Copy the `InfoCard` component into a shared location or into the new file. Copy the segment detail JSX (lines 240-452 of TeamsModule) as the basis.

### Batch Detail View

When clicking an individual batch from the flat listing, show a batch-focused detail view:

- Back breadcrumb: "Batches > [Batch Name]"
- Batch header: name, event type badge (colored), parent segment name as subtitle
- Info grid: days, time, duration, total sessions, capacity/enrolled, fee
- Enrollment progress bar
- Registrants table: filtered to only registrants in this batch (`registrants.filter(r => r.batchId === batch.id)`)
- Link to parent segment detail

This is a new view not present in TeamsModule. Create `src/components/groups/BatchDetailView.tsx`:

```typescript
interface BatchDetailViewProps {
  batch: FlatBatch;
  parentSegment: Segment;
  onBack: () => void;
  onViewParentSegment: () => void;
  onTransfer?: (registrant: SegmentRegistrant) => void;
}
```

### Routing Consideration

No routing changes needed in `App.tsx`. The `path="groups/*"` wildcard already supports any sub-paths. The detail views are state-driven within GroupsModule, just like TeamsModule does it. If URL-driven state is desired later, optional sub-routes could be added like `groups/segments/:segmentId` and `groups/batches/:batchId`, but that is not required for the initial implementation.

### Estimated Scope
- New file `src/components/groups/SegmentDetailView.tsx`: ~200 lines (extracted from TeamsModule)
- New file `src/components/groups/BatchDetailView.tsx`: ~150 lines
- `GroupsModule.tsx`: Add state + conditional rendering (~30 lines of plumbing), update onClick handlers
- `TeamsModule.tsx`: Refactor to use shared SegmentDetailView (optional, can defer)

---

## Feature 3: Transfer/Reassign Modal

### Design: TransferModal Component

Create `src/components/groups/TransferModal.tsx` - a multi-purpose modal for moving users between organizational units.

### Transfer Types

The modal supports three transfer contexts, determined by what triggered it:

1. **Team Transfer**: Move a `User` from one team to another (modify `user.teamIds`)
2. **Segment Transfer**: Move a `SegmentRegistrant` from one segment to another
3. **Batch Transfer**: Move a `SegmentRegistrant` from one batch to another (within same segment or across segments)

### Modal Interface

```typescript
type TransferType = 'team' | 'segment' | 'batch';

interface TransferModalProps {
  open: boolean;
  onClose: () => void;
  type: TransferType;
  // For team transfers
  user?: User;
  currentTeamId?: string;
  // For segment/batch transfers
  registrant?: SegmentRegistrant;
  currentSegment?: Segment;
  currentBatchId?: string;
}
```

### UX Flow

**Step 1 - Review Current Assignment**:
- Show the person being transferred (avatar, name, email)
- Show current assignment (current team/segment/batch with colored badge)
- Transfer type indicator

**Step 2 - Select Destination**:
- **Team transfer**: Dropdown/list of all teams (excluding current). Each option shows team name, color badge, member count.
- **Segment transfer**: Dropdown/list of all segments (optionally filtered by team). Each option shows segment name, type badge, status, capacity.
- **Batch transfer**: Two-level selection:
  1. Select target segment (if transferring across segments) or stay in current segment
  2. Select target batch within that segment. Show batch name, days, time, enrollment/capacity.

**Step 3 - Confirm**:
- Summary: "[Person] will be moved from [Current] to [Destination]"
- Optional note/reason field
- Confirm button (green court-500)

### Visual Design

Follow the existing modal pattern from `SegmentFormModal` in TeamsModule (lines 458-635):
- Fixed overlay: `fixed inset-0 bg-black/30 backdrop-blur-sm z-[60]`
- Centered card: `bg-white rounded-2xl shadow-elevated w-full max-w-lg max-h-[85vh]`
- Header with title + close button
- Body with form fields
- Footer with Cancel + Confirm buttons
- Framer Motion enter/exit: `initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}`

### State Management

Since all data is local dummy data with no backend, the transfer is purely visual/state-based. The modal's `onConfirm` callback would:

1. **Team transfer**: Update the user's `teamIds` array. Since `users` is an exported const array, use local component state in the parent to track modifications, or mutate in place for the mockup.
2. **Segment transfer**: Remove registrant from source segment's `registrants`, add to destination segment's `registrants`.
3. **Batch transfer**: Update the registrant's `batchId` field. If moving across segments, also move the registrant record.

For a mockup, the simplest approach is to use `useState` at the GroupsModule level to hold a mutable copy of segments data, or accept that "transfers" are visual confirmations only (toast message shown, no actual data mutation). Given this is a UI mockup, showing a success toast/notification after confirming is sufficient.

### Where Transfer is Triggered

Add a "Transfer" button in the registrants table actions column (alongside existing Confirm/Move Up/Delete actions). This button appears in:
- `SegmentDetailView` registrants table
- `BatchDetailView` registrants table
- `TeamsModule` members table (for team-level transfers)

The button: `<button className="px-2 py-0.5 rounded bg-blue-50 text-blue-600 text-[10px] font-bold hover:bg-blue-100">Transfer</button>`

Also add a bulk transfer option: checkbox selection on registrants + "Transfer Selected" button in the header.

### Data Layer Helpers (segments.ts)

```typescript
// Get all segments that could be transfer destinations
export function getTransferableSegments(excludeId?: string): Segment[] {
  return segments.filter(s => s.id !== excludeId && s.status !== 'cancelled');
}

// Get batches within a segment
export function getBatchesForSegment(segmentId: string): Batch[] {
  const seg = segments.find(s => s.id === segmentId);
  return seg?.batches || [];
}
```

### Estimated Scope
- New file `src/components/groups/TransferModal.tsx`: ~250 lines
- `segments.ts`: Add 2 helper functions (~10 lines)
- `SegmentDetailView.tsx`: Add Transfer button in registrants table actions
- `BatchDetailView.tsx`: Add Transfer button in registrants table actions
- `GroupsModule.tsx`: Add transfer modal state + rendering (~15 lines)

---

## Implementation Sequence

### Phase 1: Data Layer (segments.ts)
1. Add `FlatBatch` interface
2. Add `getFlatBatches()` function
3. Add `getTransferableSegments()` function
4. Add `getBatchesForSegment()` function

### Phase 2: Shared Components
5. Create `src/components/groups/SegmentDetailView.tsx` - extract from TeamsModule
6. Create `src/components/groups/BatchDetailView.tsx` - new component
7. Create shared `InfoCard` component (or include in SegmentDetailView)

### Phase 3: Flat Batch Listing (GroupsModule)
8. Update GroupsModule imports to include new helpers
9. Replace batches tab content with flat batch rows
10. Update batch count in tab header
11. Update search to cover flat batches

### Phase 4: Detail Views (GroupsModule)
12. Add view state management to GroupsModule (`view`, `selectedSegment`, `selectedBatch`)
13. Add conditional rendering: list view vs. segment detail vs. batch detail
14. Wire onClick handlers on segment rows, batch rows, team cards
15. Wire back navigation

### Phase 5: Transfer Modal
16. Create `src/components/groups/TransferModal.tsx`
17. Add transfer state to GroupsModule (`showTransfer`, `transferType`, `transferTarget`)
18. Add Transfer buttons in SegmentDetailView and BatchDetailView registrant tables
19. Wire up modal open/close/confirm flow
20. Add success toast/feedback on transfer confirmation

### Phase 6: Polish & Integration
21. Ensure Framer Motion animations are consistent
22. Test all navigation flows (list -> detail -> back, batch -> parent segment)
23. Optionally refactor TeamsModule to reuse SegmentDetailView
24. Ensure search works across all views

---

## Files to Create

| File | Purpose | ~Lines |
|------|---------|--------|
| `src/components/groups/SegmentDetailView.tsx` | Reusable segment detail (extracted from TeamsModule) | 200 |
| `src/components/groups/BatchDetailView.tsx` | Batch-focused detail view | 150 |
| `src/components/groups/TransferModal.tsx` | Transfer/reassign modal | 250 |

## Files to Modify

| File | Changes |
|------|---------|
| `src/data/segments.ts` | Add `FlatBatch` interface, `getFlatBatches()`, `getTransferableSegments()`, `getBatchesForSegment()` |
| `src/pages/GroupsModule.tsx` | Add view state, flat batch rows, detail view rendering, transfer modal integration |
| `src/pages/TeamsModule.tsx` | (Optional) Refactor to use shared SegmentDetailView |

## Files Unchanged

| File | Reason |
|------|--------|
| `src/App.tsx` | No routing changes needed; `groups/*` wildcard is sufficient |
| `src/data/navigation.ts` | Navigation structure stays the same |
| `src/data/users.ts` | No structural changes (team transfer modifies `teamIds` in state) |
| `src/data/teams.ts` | No changes needed |

---

## Architectural Notes

1. **No backend**: All state changes are in-component `useState`. Transfer operations show visual confirmation but do not persist. For the mockup this is acceptable.

2. **State-driven navigation vs URL routing**: Using `useState` for view mode (matching TeamsModule pattern) keeps things simple. URL-based routing (`groups/segments/:id`) could be added later but adds complexity with no benefit for a mockup.

3. **Component extraction**: Extracting SegmentDetailView from TeamsModule is strongly recommended to avoid maintaining two copies of the same 200-line view. TeamsModule can import and render the same component.

4. **Consistent purple theming for batches**: The codebase already uses purple (`bg-purple-50 text-purple-600`) for batch-related UI elements. Maintain this in the flat listing and batch detail view.

5. **Animation patterns**: All new views should use `motion.div` with `initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}` matching the existing page entry pattern.

6. **Transfer modal as a portal pattern**: Use the same overlay pattern as SegmentFormModal with `AnimatePresence` wrapping for enter/exit animations.
