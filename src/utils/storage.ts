import { User } from '../types';

/** Demo account prefilled on the sign-in screen. Documents, templates and sessions live on the server. */
// Pre-seeded default user for testing if desired
export const DEFAULT_DEMO_USER: User = {
  id: 'usr_nit_001',
  name: 'Kristal Patel',
  email: 'kristal.patel@svnit.acm.org',
  role: 'Club Member',
  password: 'Password123!',
  avatarInitial: 'K',
  createdAt: '2026-09-01T10:00:00Z',
};
