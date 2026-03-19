export type AppRole = 'borrower' | 'broker' | 'admin' | 'lender' | 'super_admin';

export type ApplicationStatus = 'submitted' | 'in_review' | 'missing_items' | 'completed';

export type NoteType = 'internal' | 'borrower_visible';

export interface UserProfile {
  id: string;
  role: AppRole;
  full_name: string;
  email: string;
  created_at: string;
}

export interface ApplicationRecord {
  id: string;
  borrower_id: string;
  broker_id: string | null;
  status: ApplicationStatus;
  created_by: string;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentRecord {
  id: string;
  application_id: string;
  uploaded_by: string;
  file_url: string;
  document_type: string;
  created_by: string;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface NoteRecord {
  id: string;
  application_id: string;
  created_by: string;
  note_type: NoteType;
  content: string;
  created_at: string;
}

export interface AuditLogRecord {
  id: string;
  entity_type: 'application' | 'document' | 'note' | 'user_profile' | 'assignment';
  entity_id: string;
  action: string;
  actor_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
}
