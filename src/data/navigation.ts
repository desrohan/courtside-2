export interface NavItem {
  title: string;
  path: string;
  icon: string;
  permission?: string[];
  children?: NavChild[];
  badge?: number;
}

export interface NavChild {
  title: string;
  path: string;
  permission?: string[];
}

export interface NavSection {
  subheader: string;
  items: NavItem[];
}

export const getNavigation = (orgId: string): NavSection[] => [
  {
    subheader: 'Overview',
    items: [
      { title: 'Home', path: '/o', icon: 'layout-dashboard' },
      { title: 'Dashboard', path: `/o/${orgId}/dashboard`, icon: 'home' },
      { title: 'Help Guide', path: `/o/${orgId}/helpguide`, icon: 'help-circle' },
    ],
  },
  {
    subheader: 'Management',
    items: [
      { title: 'Users', path: `/o/${orgId}/user`, icon: 'user', permission: ['View User'] },
      { title: 'Approve Requests', path: `/o/${orgId}/invite`, icon: 'user-check', permission: ['User Request Approvals'], badge: 3 },
      {
        title: 'Groups',
        path: `/o/${orgId}/groups/teams`,
        icon: 'users',
        permission: ['View Team'],
        children: [
          { title: 'Teams', path: `/o/${orgId}/groups/teams`, permission: ['View Team'] },
          { title: 'Segments', path: `/o/${orgId}/groups/segments`, permission: ['View Team'] },
          { title: 'Batches', path: `/o/${orgId}/groups/batches`, permission: ['View Team'] },
        ],
      },
      { title: 'Scheduler', path: `/o/${orgId}/schedule/calendar`, icon: 'calendar', permission: ['View Event'] },
      {
        title: 'Forms',
        path: `/o/${orgId}/form`,
        icon: 'file-text',
        permission: ['View Form'],
        children: [
          { title: 'Create & Edit', path: `/o/${orgId}/form`, permission: ['View Form'] },
          { title: 'Assign Form', path: `/o/${orgId}/form/form_assignment`, permission: ['View Form Assignment'] },
          { title: 'My Assignment', path: `/o/${orgId}/form/user_form_assignment`, permission: ['My Form Assignment'] },
          { title: 'Form Submission', path: `/o/${orgId}/form/form_submission`, permission: ['View Form Submission'] },
        ],
      },
      { title: 'Sessions', path: `/o/${orgId}/session`, icon: 'target', permission: ['View Session'] },
      { title: 'Chat', path: `/o/${orgId}/chat`, icon: 'message-circle', permission: ['Chat'] },
      { title: 'Tournaments', path: `/o/${orgId}/tournament`, icon: 'trophy', permission: ['View Event'] },
      {
        title: 'Settings',
        path: `/o/${orgId}/settings`,
        icon: 'settings',
        children: [
          { title: 'Account', path: `/o/${orgId}/settings/account`, permission: ['Edit Organization', 'View Role', 'View Designation'] },
          { title: 'Resources', path: `/o/${orgId}/settings/resources`, permission: ['View Event Type', 'View Facility Center and Facility', 'View Tag'] },
          { title: 'Governance', path: `/o/${orgId}/settings/governance`, permission: ['Edit Organization'] },
        ],
      },
    ],
  },
];
