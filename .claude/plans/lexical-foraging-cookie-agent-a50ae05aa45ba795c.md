# Courtside Premium UI Mockup - Complete Implementation Plan

## Table of Contents
1. [Project Setup](#1-project-setup)
2. [File Structure](#2-file-structure)
3. [Design System & Theme](#3-design-system--theme)
4. [Dummy Data Architecture](#4-dummy-data-architecture)
5. [Routing Configuration](#5-routing-configuration)
6. [Component Specifications](#6-component-specifications)
7. [UI Improvements Over Current App](#7-ui-improvements-over-current-app)
8. [Implementation Sequence](#8-implementation-sequence)

---

## 1. Project Setup

### 1.1 Initialize Project
```bash
cd "/Users/courtsideanalyticsllc/Desktop/claudec courtside ui"
npm create vite@latest . -- --template react-ts
```
Select React framework and TypeScript variant. Since the directory already has .claude/, Vite will scaffold alongside it.

### 1.2 Install Dependencies

**Core:**
```bash
npm install react-router-dom@6
npm install tailwindcss @tailwindcss/vite
```

**Calendar:**
```bash
npm install @fullcalendar/core @fullcalendar/react @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/list @fullcalendar/interaction
```

**Animation & UI:**
```bash
npm install framer-motion lucide-react
```

**Utilities:**
```bash
npm install date-fns clsx
```

### 1.3 Tailwind CSS v4 Configuration

In vite.config.ts:
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': '/src' }
  }
})
```

### 1.4 tsconfig.json Path Aliases
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

### 1.5 Google Font
In index.html, add inside head:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
```

---

## 2. File Structure

```
src/
├── main.tsx
├── App.tsx
├── index.css
│
├── data/
│   ├── organizations.ts
│   ├── users.ts
│   ├── teams.ts
│   ├── events.ts
│   ├── eventTypes.ts
│   ├── activities.ts
│   ├── facilities.ts
│   ├── setupGuide.ts
│   ├── navigation.ts
│   ├── forms.ts
│   └── sessions.ts
│
├── types/
│   ├── index.ts
│   ├── organization.ts
│   ├── user.ts
│   ├── team.ts
│   ├── event.ts
│   ├── eventType.ts
│   ├── facility.ts
│   ├── form.ts
│   └── session.ts
│
├── hooks/
│   ├── useDebounce.ts
│   ├── useLocalStorage.ts
│   ├── useSidebar.ts
│   └── useEventFilters.ts
│
├── context/
│   ├── AuthContext.tsx
│   ├── OrgContext.tsx
│   └── SidebarContext.tsx
│
├── layouts/
│   ├── RootLayout.tsx
│   ├── OrgLayout.tsx
│   ├── Sidebar.tsx
│   ├── Topbar.tsx
│   └── SidebarNavItem.tsx
│
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Badge.tsx
│   │   ├── Card.tsx
│   │   ├── Avatar.tsx
│   │   ├── AvatarGroup.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Checkbox.tsx
│   │   ├── Toggle.tsx
│   │   ├── Slider.tsx
│   │   ├── Modal.tsx
│   │   ├── Drawer.tsx
│   │   ├── Tabs.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── Tooltip.tsx
│   │   ├── DropdownMenu.tsx
│   │   ├── DataTable.tsx
│   │   ├── EmptyState.tsx
│   │   ├── SearchInput.tsx
│   │   ├── Pagination.tsx
│   │   ├── StatusDot.tsx
│   │   ├── GlassCard.tsx
│   │   ├── AnimatedCounter.tsx
│   │   └── Breadcrumb.tsx
│   │
│   ├── calendar/
│   │   ├── CalendarView.tsx
│   │   ├── CalendarToolbar.tsx
│   │   ├── CalendarFilterPanel.tsx
│   │   ├── CalendarEventCard.tsx
│   │   ├── SavedViewsDropdown.tsx
│   │   └── PublishButton.tsx
│   │
│   ├── events/
│   │   ├── EventDetailDrawer.tsx
│   │   ├── EventCreateModal.tsx
│   │   ├── EventOverviewTab.tsx
│   │   ├── EventEditTab.tsx
│   │   ├── EventAttendanceTab.tsx
│   │   ├── EventChecklistTab.tsx
│   │   ├── EventItineraryTab.tsx
│   │   ├── EventSessionTab.tsx
│   │   ├── EventHydrationTab.tsx
│   │   ├── EventAssignmentsTab.tsx
│   │   ├── EventFilesTab.tsx
│   │   ├── RecurrenceSelector.tsx
│   │   ├── LocationSelector.tsx
│   │   └── RPESlider.tsx
│   │
│   ├── dashboard/
│   │   ├── WelcomeCard.tsx
│   │   ├── SetupGuideTimeline.tsx
│   │   ├── StatsRow.tsx
│   │   ├── ScheduleWidget.tsx
│   │   ├── AnnouncementsWidget.tsx
│   │   └── TasksWidget.tsx
│   │
│   └── shared/
│       ├── UserAvatar.tsx
│       ├── TeamBadge.tsx
│       ├── EventTypeBadge.tsx
│       ├── RoleBadge.tsx
│       └── ActivityIcon.tsx
│
├── pages/
│   ├── OrgSelectionPage.tsx
│   ├── DashboardPage.tsx
│   ├── SchedulerPage.tsx
│   ├── PeopleOverviewPage.tsx
│   ├── UserListPage.tsx
│   ├── TeamListPage.tsx
│   ├── ApproveRequestsPage.tsx
│   ├── FormsListPage.tsx
│   ├── FormCreatePage.tsx
│   ├── FormAssignPage.tsx
│   ├── MyAssignmentsPage.tsx
│   ├── FormSubmissionsPage.tsx
│   ├── SessionsPage.tsx
│   ├── ChatPage.tsx
│   ├── SettingsAccountPage.tsx
│   ├── SettingsResourcesPage.tsx
│   └── NotFoundPage.tsx
│
└── lib/
    ├── cn.ts
    ├── formatters.ts
    └── constants.ts
```

Total: ~93 source files.

---

## 3. Design System & Theme

### 3.1 Color Palette (Refined from Current #00A76F)

| Token | Hex | Usage |
|-------|-----|-------|
| primary-50 | #EDFCF2 | Lightest backgrounds, hover states |
| primary-100 | #C8FAD6 | Selected row backgrounds |
| primary-200 | #A0F5BA | Progress bars, light accents |
| primary-300 | #5BE49B | Active states, toggles |
| primary-400 | #22C55E | Buttons secondary |
| primary-500 | #00A76F | Primary buttons, links, active nav |
| primary-600 | #15743E | Button hover, dark accents |
| primary-700 | #007867 | Dark UI elements |
| primary-800 | #004B50 | Deep dark surfaces |
| primary-900 | #003832 | Deepest dark |

**Neutral palette:** Standard gray scale from #F9FAFB to #030712

**Semantic:** success=#22C55E, warning=#F59E0B, error=#EF4444, info=#3B82F6

**Event type colors:** training=#00A76F, match=#EF4444, meeting=#3B82F6, recovery=#8B5CF6, social=#F59E0B

### 3.2 Typography Scale (Inter font)

| Name | Size | Weight | Usage |
|------|------|--------|-------|
| display-lg | 36px | 800 | Page hero titles |
| display-md | 30px | 700 | Section headers |
| heading-lg | 24px | 700 | Card titles |
| heading-md | 20px | 600 | Sub-section headers |
| heading-sm | 16px | 600 | Widget headers |
| body-lg | 16px | 400 | Primary body text |
| body-md | 14px | 400 | Default text, table cells |
| body-sm | 13px | 400 | Secondary text, captions |
| caption | 12px | 500 | Labels, badges, metadata |
| overline | 11px | 600 | Sidebar sections (uppercase, letter-spaced) |

### 3.3 Component Design Tokens

**Cards:**
- Background: white, Border: 1px solid rgba(145,158,171,0.12), Radius: 16px
- Hover: translateY(-2px) + deepened shadow, 200ms ease

**Glass Cards (dashboard stats):**
- Background: rgba(255,255,255,0.72), backdrop-filter: blur(20px) saturate(180%)
- Border: 1px solid rgba(255,255,255,0.4)
- Green glow: box-shadow: 0 8px 32px rgba(0,167,111,0.08)

**Buttons:**
- Pill shape (rounded-xl), px-5 py-2.5
- active:scale-[0.98] press feedback
- Primary: bg-primary-500 hover:bg-primary-600
- Secondary: bg-primary-50 text-primary-700

**Sidebar:**
- 280px expanded / 80px collapsed
- White background, border-r border-neutral-100
- Active item: 3px left green bar + bg-primary-50 + text-primary-700
- 300ms width transition via Framer Motion

**Data Tables:**
- Header: bg-neutral-50, 12px semibold uppercase text-neutral-500
- 48px row height (compact)
- Rounded container, subtle divide-y
- Row hover: bg-primary-50/40

### 3.4 Page Background
- Main content area: #F8FAFC (neutral-50)

---

## 4. Dummy Data Architecture

### 4.1 Organizations (src/data/organizations.ts)
3 organizations:
- FC Courtside: 1200 Stadium Way, Austin TX 78701, 127 members
- Courtside Academy: 450 Youth Drive, Austin TX 78702, 89 members
- Downtown Athletics Club: 88 Commerce St, Austin TX 78703, 45 members

### 4.2 Users (src/data/users.ts)
40+ users:
- 8 Coaches: Marcus Rivera (Head Coach), Sarah Chen (Asst), James Okonkwo (U-17), Lisa Fernandez (U-15), David Park (GK Coach), Ana Martinez (Fitness), Tom Williams (Recovery), Rachel Adams (Analyst)
- 15 First Team Players with positions/numbers
- 10 U-17 Players
- 10 U-15 Players
- 4 Staff: Org Admin, Physio, Kit Manager, Team Secretary

Each with: id, name, email, role, designation, position, jerseyNumber, avatarColor, status, teams[], etc.

### 4.3 Teams (src/data/teams.ts)
5 teams: First Team, U-17 Boys, U-15 Boys, Reserve Team, Goalkeepers
Each with unique color, member lists, activity

### 4.4 Events (src/data/events.ts)
50+ events across March-April 2026:
- 30 Training Sessions (Mon/Wed/Fri recurring per team)
- 8 Matches (weekends)
- 5 Team Meetings (pre-match briefings)
- 5 Recovery Sessions (post-match)
- 2 Social Events

Each event has nested: attendance[], checklist[], itinerary[], session, hydration[], assignments[], files[]

### 4.5 Event Types (src/data/eventTypes.ts)
5 types with colors: Training (#00A76F), Match (#EF4444), Meeting (#3B82F6), Recovery (#8B5CF6), Social (#F59E0B)

### 4.6 Facilities (src/data/facilities.ts)
4 facilities: Main Field, Training Ground B, Gym, Recovery Suite

### 4.7 Setup Guide (src/data/setupGuide.ts)
9 steps: Role, Designation, Event Type, Activity, Facility, User, Tags, Team, Scheduler
7 of 9 completed for demo state

### 4.8 Navigation (src/data/navigation.ts)
Sidebar menu config with sections, icons, permissions, children

---

## 5. Routing Configuration

```
/                               -> Redirect to /o
/o                              -> OrgSelectionPage (RootLayout)
/o/:orgId                       -> Redirect to dashboard
/o/:orgId/dashboard             -> DashboardPage (OrgLayout)
/o/:orgId/schedule              -> Redirect to calendar
/o/:orgId/schedule/calendar     -> SchedulerPage (OrgLayout)
/o/:orgId/schedule/people       -> SchedulerPage (OrgLayout)
/o/:orgId/user                  -> UserListPage (OrgLayout)
/o/:orgId/approve-requests      -> ApproveRequestsPage (OrgLayout)
/o/:orgId/team                  -> TeamListPage (OrgLayout)
/o/:orgId/forms                 -> FormsListPage (OrgLayout)
/o/:orgId/forms/create          -> FormCreatePage (OrgLayout)
/o/:orgId/forms/assign          -> FormAssignPage (OrgLayout)
/o/:orgId/forms/my-assignments  -> MyAssignmentsPage (OrgLayout)
/o/:orgId/forms/submissions     -> FormSubmissionsPage (OrgLayout)
/o/:orgId/sessions              -> SessionsPage (OrgLayout)
/o/:orgId/chat                  -> ChatPage (OrgLayout)
/o/:orgId/settings/account      -> SettingsAccountPage (OrgLayout)
/o/:orgId/settings/resources    -> SettingsResourcesPage (OrgLayout)
*                               -> NotFoundPage
```

---

## 6. Component Specifications

### 6.1 LAYOUTS

**RootLayout.tsx** - Minimal layout for org selection. Animated gradient background (primary-50/100 mesh). Courtside logo top-left. Centers Outlet.

**OrgLayout.tsx** - Three-region: Sidebar + Topbar + Content. Content area: bg-neutral-50, px-8 py-6, max-w-[1600px]. Reads orgId from URL, sets OrgContext. AnimatePresence for route transitions.

**Sidebar.tsx** - Fixed left, full height. Collapsed: 80px (icons only with tooltips). Expanded: 280px (icons + labels). Top: org logo/name with switch dropdown. Middle: scrollable nav sections. Bottom: settings + user profile. Active item: 3px left green bar. Framer Motion layout animation for collapse.

**SidebarNavItem.tsx** - Icon + label + optional badge + optional children accordion. Active state via useLocation. Hover bg transition. Children expand with AnimatePresence.

**Topbar.tsx** - Fixed top, 64px height, spans content area only. Left: breadcrumb. Center: search input with Cmd+K hint. Right: activity dropdown, team selector, notification bell (red dot), user avatar dropdown.

### 6.2 PAGES

**OrgSelectionPage.tsx**
- Title: "Welcome back, Marcus" (36px) + subtitle
- Debounced search input (300ms)
- 3-column card grid with hover lift + green glow
- Each card: colored top strip, logo circle, name, address, contact, member count pill
- Framer Motion stagger animation (0.05s per card)
- Pagination component (wired but 3 cards so invisible)

**DashboardPage.tsx**
- Two columns: 60% left / 40% right
- Left: WelcomeCard (gradient green, white text, illustration, 200px), StatsRow (3 glass cards with animated counters), ScheduleWidget (next 5 events), QuickActions row (pill buttons)
- Right: SetupGuideTimeline (7/9 complete, vertical timeline), AnnouncementsWidget, TasksWidget

**SchedulerPage.tsx**
- Tab bar: Calendar | People (route-based)
- Calendar tab: CalendarToolbar above FullCalendar. Custom toolbar with Today/prev/next, view pills (Month/Week/Day/List), filter button + saved views + publish button. Events color-coded by type. Click date -> EventCreateModal. Click event -> EventDetailDrawer.
- People tab: grouped user grid by team

**UserListPage.tsx**
- Header with "New User" button
- Search + Role/Status/Team filter dropdowns
- DataTable: Avatar+Name, Email, Designation, Role (badge), Teams, Location, Status (dot)
- 48px compact rows, sortable, paginated

**TeamListPage.tsx**
- Grid of team cards with color bar, name, counts, avatar stack
- Create Team button

**SettingsResourcesPage.tsx**
- Left sub-nav tabs: Event Types, Activities, Facilities, Roles, Designations, Tags
- Right: CRUD table for selected resource
- Event Types: color dot + name + activity + edit/delete actions

### 6.3 EVENT COMPONENTS

**EventCreateModal.tsx** (720px modal)
- Title, Event Type select, Date/Time row (start+end+timezone+allday toggle), RecurrenceSelector, LocationSelector (HOME/AWAY toggle + facility/address), Teams multi-select, Description rich text, Privacy toggle, RPESlider (1-10 color gradient), Notify toggle
- Footer: Cancel, Save, Publish, Publish & Notify
- Scale-in animation

**EventDetailDrawer.tsx** (600px from right)
- Header: title, type badge, team badges, date range, close button
- 9 horizontal scrollable tabs: Overview, Edit, Attendance, Checklist, Itinerary, Session, Hydration, Assignments, Files
- Each tab renders its component

**EventOverviewTab.tsx** - Read-only summary with sections for date/time, location, teams, description, RPE, privacy

**EventAttendanceTab.tsx** - User list with Present/Absent/Pending toggles. Summary bar with counts.

**EventChecklistTab.tsx** - Checkbox items with assignees. Progress bar. Add item input.

**EventItineraryTab.tsx** - Vertical timeline. Time on left, activity card on right. Day tabs for multi-day. Green dashed connecting line.

**EventSessionTab.tsx** - Duration, per-player RPE circles, session tags as pills

**EventHydrationTab.tsx** - Table: user, pre/post weight, fluid intake, status indicator

**EventAssignmentsTab.tsx** - Role assignments list, auto-assign toggle

**EventFilesTab.tsx** - File card grid with type icons, drag-drop upload zone

**RecurrenceSelector.tsx** - Dropdown (None/Daily/Weekly/Monthly/Annually). Weekly: 7 day-circle buttons. End condition: Never/After N/On date.

**RPESlider.tsx** - Range 1-10 with green-yellow-red gradient track. Value shown in circle on thumb.

### 6.4 UI PRIMITIVES (src/components/ui/)

**Button.tsx** - Variants: primary/secondary/ghost/danger/outline. Sizes: sm/md/lg. Icon support. Loading spinner. active:scale-[0.98].

**Card.tsx** - Variants: default/glass/outlined/elevated. Hover lift option. Padding sizes.

**Modal.tsx** - Portal-rendered. Backdrop blur. Scale-in animation. Sizes: sm/md/lg/xl/full. ESC + backdrop close.

**Drawer.tsx** - Right slide-in. Full height. Configurable width. Portal-rendered.

**Tabs.tsx** - Variants: underline (sliding indicator via layoutId)/pills/enclosed. Icon + badge support.

**DataTable.tsx** - Generic with Column config. Sortable headers. Row hover. Empty state. Loading skeleton.

**Avatar.tsx** - Image or colored initials. Sizes: xs/sm/md/lg/xl. Online dot indicator.

**AvatarGroup.tsx** - Stacked with overlap. +N overflow pill. Max count config.

**GlassCard.tsx** - bg-white/70 backdrop-blur-xl. Green glow shadow.

**SearchInput.tsx** - Search icon left. Cmd+K hint right. Focus ring. Clear button. Debounce option.

**Badge.tsx** - Variants: default/success/warning/error/info/neutral. Dot indicator. Pill shape.

**AnimatedCounter.tsx** - Number animation from 0 to target on mount. 800ms ease-out.

**EmptyState.tsx** - Illustration + title + description + action button. Reused everywhere.

All other primitives: Input, Select, Checkbox, Toggle, Slider, ProgressBar, Tooltip, DropdownMenu, Pagination, StatusDot, Breadcrumb.

---

## 7. UI Improvements Over Current App

### 7.1 Sidebar
- Current: flat dark sidebar, basic hover
- New: light sidebar with section overlines, 3px green accent bar for active, smooth collapse animation, org switcher, user profile at bottom

### 7.2 Tables
- Current: too much row spacing (annotated in screenshots), 40px avatars
- New: compact 48px rows, 32px avatars, rounded container, subtle alternating, sort indicators

### 7.3 Dashboard
- Current: dark background, flat stat cards
- New: light bg, glassmorphism stats with animated counters, gradient welcome card with illustration, interactive setup timeline, stagger animations

### 7.4 Event Creation
- Current: dense cramped form, basic selects
- New: spacious 720px modal, two-column layout, visual RPE slider with color gradient, HOME/AWAY toggle pills, team badges in multi-select, day-of-week circle buttons for recurrence

### 7.5 Event Details
- Current: basic tabbed overlay
- New: full-height 600px drawer, animated tab indicator, rich tab content (timeline itinerary, colored RPE grid, checklist progress bar)

### 7.6 Calendar
- Current: standard FullCalendar minimal customization
- New: custom toolbar, pill view switcher, filter panel with active badges, color-coded events with team indicators, dashed border for drafts, publish button with count

### 7.7 Typography
- Current: Public Sans at consistent weights
- New: Inter with 300-800 weight range, defined type scale 11px-36px, proper letter-spacing on overlines

### 7.8 Animations
- Current: no animations, instant transitions
- New: route fade+slide, card hover lifts, staggered list entrance, modal scale-in, drawer slide, animated counters, tab indicator sliding

### 7.9 Colors & Visual
- Current: green used heavily with dark backgrounds
- New: light mode primary, green as accent not dominant, glassmorphism elevation, subtle gradients, proper contrast ratios

### 7.10 Empty States
- Current: basic text
- New: every empty state has illustration + text + action button via reusable EmptyState component

---

## 8. Implementation Sequence

### Phase 1: Foundation (12 steps)
1. Project scaffolding (Vite + deps)
2. src/index.css (theme tokens, animations, fonts)
3. src/lib/cn.ts (clsx utility)
4. src/lib/constants.ts
5. src/lib/formatters.ts
6. src/types/ (all type files)
7. src/data/organizations.ts
8. src/data/users.ts (40+ users)
9. src/data/teams.ts
10. src/data/eventTypes.ts + activities.ts + facilities.ts
11. src/data/events.ts (50+ events with nested data)
12. src/data/navigation.ts + setupGuide.ts

### Phase 2: UI Primitives (18 steps)
13-30. All src/components/ui/ components (Button through Breadcrumb)

### Phase 3: Contexts & Hooks (7 steps)
31-37. AuthContext, OrgContext, SidebarContext, useDebounce, useLocalStorage, useSidebar, useEventFilters

### Phase 4: Layout Shell (6 steps)
38-43. SidebarNavItem, Sidebar, Topbar, RootLayout, OrgLayout, App.tsx routes

### Phase 5: Shared Components (5 steps)
44-48. UserAvatar, TeamBadge, EventTypeBadge, RoleBadge, ActivityIcon

### Phase 6: Org Selection Page (1 step)
49. OrgSelectionPage.tsx

### Phase 7: Dashboard (7 steps)
50-56. WelcomeCard, StatsRow, SetupGuideTimeline, ScheduleWidget, AnnouncementsWidget, TasksWidget, DashboardPage

### Phase 8: Scheduler & Calendar (14 steps)
57-70. CalendarToolbar, FilterPanel, EventCard, SavedViews, PublishButton, CalendarView, RecurrenceSelector, LocationSelector, RPESlider, EventCreateModal, OverviewTab, EditTab, AttendanceTab, ChecklistTab

### Phase 9: Event Detail Tabs (8 steps)
71-78. ItineraryTab, SessionTab, HydrationTab, AssignmentsTab, FilesTab, EventDetailDrawer, SchedulerPage, PeopleOverviewPage

### Phase 10: Remaining Pages (12 steps)
79-90. UserList, TeamList, ApproveRequests, FormsList, FormCreate, FormAssign, MyAssignments, FormSubmissions, Sessions, Chat, SettingsAccount, SettingsResources

### Phase 11: Polish & Entry (3 steps)
91-93. NotFoundPage, main.tsx, index.html

### Phase 12: Final Polish
94. Responsive breakpoints
95. Focus states & keyboard nav
96. Loading/skeleton states
97. Route transition tuning
98. Visual audit

---

## Key Architectural Decisions

1. No state management library -- React Context + useState is sufficient for a mockup
2. No API layer -- all data imported from src/data/ files
3. FullCalendar with custom themed toolbar and event rendering
4. Framer Motion for page transitions, modal/drawer, hover effects, stagger animations
5. Desktop-first responsive: sidebar collapses at lg breakpoint
6. Tailwind v4 CSS-first config (no tailwind.config.js, all tokens in @theme {} block)

## Potential Challenges

1. FullCalendar CSS conflicts with Tailwind -- use classNames prop + CSS custom properties
2. Large dummy data set -- use factory functions to generate events programmatically
3. Drawer + Calendar interaction -- drawer via portal, calendar stays mounted
4. Sidebar animation performance -- use transform/opacity, Framer Motion layout
5. Tailwind v4 uses CSS-first config -- all theme tokens in @theme {} in CSS, no JS config file
