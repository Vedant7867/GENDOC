export type UserRole = 
  | 'Club Member' 
  | 'Core Coordinator' 
  | 'Club Admin' 
  | 'Faculty Advisor';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  password?: string;
  avatarInitial?: string;
  createdAt: string;
}

export type DocumentStatus = 'Completed' | 'Needs Review' | 'Draft';

export type IconColorTheme = 'blue' | 'amber' | 'emerald' | 'purple' | 'indigo';

export interface ClubDocument {
  id: string;
  title: string;
  templateType: string;
  status: DocumentStatus;
  lastEditedText: string;
  lastEditedDate: string;
  iconTheme: IconColorTheme;
  venue?: string;
  eventDate?: string;
  expectedAttendance?: string;
  budgetTotal?: string;
  summary?: string;
  organizer?: string;
}

export interface DocumentTemplate {
  id: string;
  title: string;
  iconName: 'FileText' | 'Award' | 'Calendar' | 'FileSpreadsheet';
  theme: IconColorTheme;
  description: string;
  category: string;
  suggestedPrompt: string;
}

export type NavTab = 'Home' | 'Events' | 'Documents' | 'Templates' | 'Club Settings';

export interface ExtractedEventData {
  eventName: string;
  dates: string;
  venue: string;
  expectedParticipants: string;
  objective: string;
  targetAudience: string;
  budgetRequired: string;
  facultyCoordinator: string;
  studentLeads: string;
  equipmentNeeds: string[];
}
