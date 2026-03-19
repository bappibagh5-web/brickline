import type { IntakeData, LoanType } from '@/lib/types';

export const MAX_STEP = 5;

export const LOAN_TYPE_LABELS: Record<LoanType, string> = {
  fix_flip: 'Fix & Flip',
  dscr: 'DSCR Rental',
  bridge: 'Bridge Loan',
  construction: 'New Construction'
};

export function normalizeNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function mergeIntakeData(existing: IntakeData | null | undefined, incoming: Partial<IntakeData>): IntakeData {
  return {
    ...(existing || {}),
    ...incoming
  };
}

function requiredString(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0;
}

function requiredNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value);
}

export function validateStep(step: number, data: IntakeData): string[] {
  const errors: string[] = [];

  if (step === 1) {
    if (!requiredString(data.borrower_name)) errors.push('Borrower name is required.');
    if (!requiredString(data.email)) errors.push('Email is required.');
    if (!requiredString(data.entity_type)) errors.push('Entity type is required.');
    if (!requiredString(data.phone_number)) errors.push('Phone number is required.');
  }

  if (step === 2) {
    if (!requiredString(data.loan_type)) errors.push('Loan type is required.');
  }

  if (step === 3) {
    if (!requiredString(data.property_address)) errors.push('Property address is required.');
    if (!requiredNumber(data.purchase_price)) errors.push('Purchase price is required.');
    if (!requiredNumber(data.estimated_value)) errors.push('Estimated value (ARV) is required.');
    if (!requiredString(data.property_type)) errors.push('Property type is required.');
  }

  if (step === 4) {
    if (!requiredNumber(data.loan_amount_requested)) errors.push('Loan amount requested is required.');
    if (!requiredNumber(data.down_payment)) errors.push('Down payment is required.');
    if (!requiredString(data.exit_strategy)) errors.push('Exit strategy is required.');

    if (data.loan_type === 'fix_flip' && !requiredNumber(data.rehab_budget)) {
      errors.push('Rehab budget is required for Fix & Flip.');
    }

    if (data.loan_type === 'dscr' && !requiredNumber(data.rental_income)) {
      errors.push('Rental income is required for DSCR.');
    }

    if (data.loan_type === 'construction') {
      if (!requiredString(data.construction_timeline)) {
        errors.push('Construction timeline is required for Construction loans.');
      }
      if (!requiredNumber(data.construction_budget)) {
        errors.push('Construction budget is required for Construction loans.');
      }
    }
  }

  return errors;
}

export function validateForSubmit(data: IntakeData): string[] {
  const errors = new Set<string>();

  for (const step of [1, 2, 3, 4]) {
    for (const error of validateStep(step, data)) {
      errors.add(error);
    }
  }

  return Array.from(errors);
}
