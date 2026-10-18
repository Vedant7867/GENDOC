import { User, ClubDocument, DocumentTemplate } from '../types';

const USERS_STORAGE_KEY = 'gendoc_users';
const SESSION_STORAGE_KEY = 'gendoc_session_user';
const DOCUMENTS_STORAGE_KEY = 'gendoc_documents';

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

export const INITIAL_DOCUMENTS: ClubDocument[] = [
  {
    id: 'doc-001',
    title: 'Web Development Workshop - Event Proposal',
    templateType: 'Event Proposal',
    status: 'Completed',
    lastEditedText: 'Last edited 2 days ago',
    lastEditedDate: '2026-10-17T14:30:00Z',
    iconTheme: 'blue',
    venue: 'Seminar Hall, Computer Engg. Dept.',
    eventDate: '14–15 October 2026',
    expectedAttendance: '120 students',
    budgetTotal: '₹18,500',
    summary: 'Comprehensive 2-day hands-on workshop covering modern full-stack web technologies, Git, and deployment practices for ACM student members.',
    organizer: 'Kristal Patel (Tech Lead)',
  },
  {
    id: 'doc-002',
    title: 'Permission Letter - Seminar Hall',
    templateType: 'Permission Letter',
    status: 'Needs Review',
    lastEditedText: 'Last edited 1 days ago',
    lastEditedDate: '2026-10-18T09:15:00Z',
    iconTheme: 'amber',
    venue: 'Seminar Hall - Complex B',
    eventDate: '14–15 October 2026 (9 AM - 6 PM)',
    expectedAttendance: '120 students',
    budgetTotal: 'N/A',
    summary: 'Formal requisition letter to Head of Department and Dean of Student Affairs requesting reservation of Seminar Hall, projector, and audio equipment.',
    organizer: 'Core Executive Committee',
  },
  {
    id: 'doc-003',
    title: 'Event Notice - Tech Fest',
    templateType: 'Event Notice',
    status: 'Completed',
    lastEditedText: 'Last edited 3 days ago',
    lastEditedDate: '2026-10-16T11:45:00Z',
    iconTheme: 'emerald',
    venue: 'Campus Wide / Central Auditorium',
    eventDate: '24–26 November 2026',
    expectedAttendance: '850+ attendees',
    budgetTotal: '₹1,40,000',
    summary: 'Official student body notice announcement for annual flagship technical symposium with competitive programming, hackathons, and guest lectures.',
    organizer: 'ACM NIT Surat Student Chapter',
  },
  {
    id: 'doc-004',
    title: 'Budget Estimate - Workshop',
    templateType: 'Budget Estimate',
    status: 'Draft',
    lastEditedText: 'Last edited 3 days ago',
    lastEditedDate: '2026-10-16T17:20:00Z',
    iconTheme: 'blue',
    venue: 'Seminar Hall',
    eventDate: '14–15 October 2026',
    expectedAttendance: '120 participants',
    budgetTotal: '₹22,000 (Itemized)',
    summary: 'Itemized expenditure forecast including guest speaker honorarium, refreshments, printed participation certificates, and swag kits.',
    organizer: 'Finance & Logistics Team',
  },
];

export const TEMPLATES_LIST: DocumentTemplate[] = [
  {
    id: 'tpl-event-proposal',
    title: 'Event Proposal',
    iconName: 'FileText',
    theme: 'blue',
    category: 'Planning',
    description: 'Detailed proposal with objectives, timeline, participant demographics, budget, and learning outcomes for administrative approval.',
    suggestedPrompt: 'Two-day Web Development Workshop on 14–15 October in Seminar Hall for around 120 students with hands-on coding sessions.',
  },
  {
    id: 'tpl-permission-letter',
    title: 'Permission Letter',
    iconName: 'FileText',
    theme: 'amber',
    category: 'Administration',
    description: 'Formal administrative request letter addressed to HOD / Faculty Advisor / Dean for venue booking, lab access, and audio-visual resources.',
    suggestedPrompt: 'Permission letter requesting Seminar Hall allocation on 14-15 Oct from 9:00 AM to 6:00 PM for ACM Web Dev BootCamp.',
  },
  {
    id: 'tpl-event-notice',
    title: 'Event Notice',
    iconName: 'FileText',
    theme: 'emerald',
    category: 'Publicity',
    description: 'Crisp, high-impact circular notice for student noticeboards, departmental distribution, and WhatsApp/Slack club channels.',
    suggestedPrompt: 'Departmental notice announcing registrations open for ACM Web Development Workshop 2026 with QR code and link.',
  },
  {
    id: 'tpl-budget-estimate',
    title: 'Budget Estimate',
    iconName: 'FileText',
    theme: 'purple',
    category: 'Finance',
    description: 'Tabular financial breakdown covering refreshments, printing, speaker honorarium, technical infrastructure, and contingency reserve.',
    suggestedPrompt: 'Budget estimation sheet for 120 participants workshop including refreshments (Rs 9,000), speaker gift (Rs 4,000), certificates (Rs 3,000).',
  },
  {
    id: 'tpl-participation-certificate',
    title: 'Participation Certificate',
    iconName: 'Award',
    theme: 'indigo',
    category: 'Recognition',
    description: 'Standardized ACM student chapter certificate layout with recipient name, event title, date, credential ID, and authorized signatures.',
    suggestedPrompt: 'Participation certificate template for student attendees of ACM Web Development Workshop held on 14-15 October 2026.',
  },
];

// Helper functions for User Auth
export function getRegisteredUsers(): User[] {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) {
      // Default initial state: empty or seeded?
      // Let's seed with default user so the user can sign in immediately if they want,
      // but also if someone checks empty accounts, we support that.
      // Let's store the default user so kristal.patel@svnit.acm.org works right away!
      const initial = [DEFAULT_DEMO_USER];
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return [DEFAULT_DEMO_USER];
  }
}

export function saveRegisteredUser(user: User): void {
  const users = getRegisteredUsers();
  const existingIndex = users.findIndex(u => u.email.toLowerCase() === user.email.toLowerCase());
  if (existingIndex >= 0) {
    users[existingIndex] = user;
  } else {
    users.push(user);
  }
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

export function findUserByEmail(email: string): User | undefined {
  const users = getRegisteredUsers();
  return users.find(u => u.email.trim().toLowerCase() === email.trim().toLowerCase());
}

export function getActiveSessionUser(): User | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setActiveSessionUser(user: User | null): void {
  if (!user) {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } else {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
  }
}

// Helper functions for Documents
export function getStoredDocuments(): ClubDocument[] {
  try {
    const raw = localStorage.getItem(DOCUMENTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(DOCUMENTS_STORAGE_KEY, JSON.stringify(INITIAL_DOCUMENTS));
      return INITIAL_DOCUMENTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_DOCUMENTS;
  }
}

export function saveStoredDocuments(docs: ClubDocument[]): void {
  localStorage.setItem(DOCUMENTS_STORAGE_KEY, JSON.stringify(docs));
}

export function addDocument(newDoc: ClubDocument): ClubDocument[] {
  const docs = getStoredDocuments();
  const updated = [newDoc, ...docs];
  saveStoredDocuments(updated);
  return updated;
}
