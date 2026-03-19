export type AppRole = 'borrower' | 'broker' | 'admin' | 'lender' | 'super_admin';

export type LoanType = 'fix_flip' | 'dscr' | 'bridge' | 'construction';

export type ApplicationStatus = 'draft' | 'submitted' | 'in_review' | 'missing_items' | 'completed';

export type NoteType = 'internal' | 'borrower_visible';

export type EntityType = 'individual' | 'llc';

export type ExitStrategy = 'sell' | 'refinance' | 'rent';

export type DocumentType =
  | 'id_doc'
  | 'bank_statement'
  | 'purchase_contract'
  | 'rent_roll'
  | 'rehab_budget'
  | 'other';

export type DocumentStatus = 'uploaded' | 'under_review' | 'accepted' | 'rejected';

export interface IntakeData {
  borrower_name?: string;
  email?: string;
  entity_type?: EntityType;
  phone_number?: string;
  loan_type?: LoanType;
  property_address?: string;
  purchase_price?: number;
  estimated_value?: number;
  property_type?: string;
  loan_amount_requested?: number;
  down_payment?: number;
  exit_strategy?: ExitStrategy;
  rehab_budget?: number;
  rental_income?: number;
  construction_timeline?: string;
  construction_budget?: number;
}

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
  loan_type: LoanType | null;
  status: ApplicationStatus;
  progress_step: number;
  application_data: IntakeData | null;
  borrower_locked: boolean;
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
  file_name: string;
  document_type: DocumentType | string;
  status: DocumentStatus;
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
