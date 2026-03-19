import type { DocumentStatus, DocumentType, LoanType } from '@/lib/types';

export const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
  { value: 'id_doc', label: 'ID / KYC' },
  { value: 'bank_statement', label: 'Bank Statement' },
  { value: 'purchase_contract', label: 'Purchase Contract' },
  { value: 'rent_roll', label: 'Rent Roll' },
  { value: 'rehab_budget', label: 'Rehab Budget' },
  { value: 'other', label: 'Other' }
];

export const DOCUMENT_STATUS_STYLES: Record<DocumentStatus, string> = {
  uploaded: 'bg-slate-100 text-slate-700',
  under_review: 'bg-amber-100 text-amber-800',
  accepted: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-rose-100 text-rose-800'
};

export const REQUIRED_DOCS_BY_LOAN_TYPE: Record<LoanType, DocumentType[]> = {
  fix_flip: ['purchase_contract', 'rehab_budget'],
  dscr: ['bank_statement', 'rent_roll'],
  bridge: ['purchase_contract', 'bank_statement'],
  construction: ['purchase_contract', 'rehab_budget']
};

export function documentTypeLabel(value: string) {
  return DOCUMENT_TYPES.find((item) => item.value === value)?.label || value;
}

export function getRequiredDocuments(loanType: LoanType | null | undefined) {
  if (!loanType) {
    return [] as DocumentType[];
  }
  return REQUIRED_DOCS_BY_LOAN_TYPE[loanType] || [];
}

export function getMissingDocuments(loanType: LoanType | null | undefined, existingTypes: string[]) {
  const required = getRequiredDocuments(loanType);
  return required.filter((docType) => !existingTypes.includes(docType));
}
