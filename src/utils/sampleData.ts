import { Project, Accomplishment, TagType, ImpactLevel } from '../types';
import { getISOWeekId } from './dateUtils';

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    name: 'Atlas API Redesign',
    description: 'GraphQL & REST core backend services overhaul',
    color: 'indigo',
    icon: 'Layers',
    status: 'active',
    order: 1,
  },
  {
    id: 'proj-2',
    name: 'Mobile App V2',
    description: 'React Native iOS & Android unified client release',
    color: 'emerald',
    icon: 'Smartphone',
    status: 'active',
    order: 2,
  },
  {
    id: 'proj-3',
    name: 'Q3 Cloud Migration',
    description: 'Zero-downtime database & microservices AWS to GCP port',
    color: 'sky',
    icon: 'Cloud',
    status: 'active',
    order: 3,
  },
  {
    id: 'proj-4',
    name: 'Customer Onboarding Flow',
    description: 'Self-serve workspace invitation & activation journey',
    color: 'amber',
    icon: 'UserCheck',
    status: 'active',
    order: 4,
  },
  {
    id: 'proj-5',
    name: 'Internal DevX & CI/CD',
    description: 'Build pipeline optimization and test runner speeding',
    color: 'rose',
    icon: 'Terminal',
    status: 'active',
    order: 5,
  },
];

export function getSampleAccomplishments(): Accomplishment[] {
  const currentWeek = getISOWeekId();
  const now = new Date();

  // Helper for dates in current week
  const daysAgo = (days: number, hours: number = 0) => {
    const d = new Date(now);
    d.setDate(d.getDate() - days);
    d.setHours(d.getHours() - hours);
    return d.toISOString();
  };

  return [
    {
      id: 'acc-1',
      projectId: 'proj-1',
      content: 'Shipped v2.4 GraphQL schema endpoints with rate limiting & JWT caching',
      tag: 'Feature',
      impact: 'High',
      weekId: currentWeek,
      createdAt: daysAgo(0, 3),
      isPinned: true,
    },
    {
      id: 'acc-1b',
      projectId: 'proj-1',
      content: 'Resolved memory leak in streaming response handler under heavy load',
      tag: 'Fix',
      impact: 'Medium',
      weekId: currentWeek,
      createdAt: daysAgo(1, 4),
    },
    {
      id: 'acc-2',
      projectId: 'proj-2',
      content: 'Completed biometrics auth integration for FaceID / TouchID on iOS build',
      tag: 'Milestone',
      impact: 'High',
      weekId: currentWeek,
      createdAt: daysAgo(0, 6),
      isPinned: true,
    },
    {
      id: 'acc-2b',
      projectId: 'proj-2',
      content: 'Optimized offline SQLite sync queue reducing battery consumption by 18%',
      tag: 'Refactor',
      impact: 'Medium',
      weekId: currentWeek,
      createdAt: daysAgo(2, 2),
    },
    {
      id: 'acc-3',
      projectId: 'proj-3',
      content: 'Migrated primary user database tables with zero downtime during maintenance window',
      tag: 'Win',
      impact: 'High',
      weekId: currentWeek,
      createdAt: daysAgo(1, 8),
      isPinned: true,
    },
    {
      id: 'acc-4',
      projectId: 'proj-4',
      content: 'Added magic link sign-in option and automated team welcome email sequence',
      tag: 'Feature',
      impact: 'Medium',
      weekId: currentWeek,
      createdAt: daysAgo(2, 5),
    },
    {
      id: 'acc-5',
      projectId: 'proj-5',
      content: 'Cut Github Actions test suite runtime from 14 minutes down to 4.5 minutes',
      tag: 'Win',
      impact: 'High',
      weekId: currentWeek,
      createdAt: daysAgo(3, 1),
    },
  ];
}
