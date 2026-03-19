import { NextResponse } from 'next/server';
import { getCurrentUserAndProfile } from '@/lib/authz';
import { mergeIntakeData, normalizeNumber, validateStep } from '@/lib/intake';
import type { IntakeData, LoanType } from '@/lib/types';

function sanitizeIncomingData(input: Partial<IntakeData>): Partial<IntakeData> {
  return {
    borrower_name: input.borrower_name?.trim(),
    email: input.email?.trim().toLowerCase(),
    entity_type: input.entity_type,
    phone_number: input.phone_number?.trim(),
    loan_type: input.loan_type,
    property_address: input.property_address?.trim(),
    purchase_price: normalizeNumber(input.purchase_price),
    estimated_value: normalizeNumber(input.estimated_value),
    property_type: input.property_type?.trim(),
    loan_amount_requested: normalizeNumber(input.loan_amount_requested),
    down_payment: normalizeNumber(input.down_payment),
    exit_strategy: input.exit_strategy,
    rehab_budget: normalizeNumber(input.rehab_budget),
    rental_income: normalizeNumber(input.rental_income),
    construction_timeline: input.construction_timeline?.trim(),
    construction_budget: normalizeNumber(input.construction_budget)
  };
}

function canEditApplication(role: string, userId: string, app: { borrower_id: string; broker_id: string | null; status: string; borrower_locked: boolean }) {
  if (role === 'admin' || role === 'super_admin') {
    return true;
  }

  if (role === 'broker' && app.broker_id === userId) {
    return true;
  }

  if (role === 'borrower' && app.borrower_id === userId && app.status === 'draft' && !app.borrower_locked) {
    return true;
  }

  return false;
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const { supabase, user, profile } = await getCurrentUserAndProfile();

  if (!user || !profile) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const step = Math.min(5, Math.max(1, Number(body.step) || 1));
  const saveOnly = Boolean(body.saveOnly);
  const incoming = sanitizeIncomingData((body.data || {}) as Partial<IntakeData>);

  const { data: app, error: appError } = await supabase
    .from('applications')
    .select('id,borrower_id,broker_id,status,borrower_locked,application_data,progress_step,loan_type')
    .eq('id', id)
    .single();

  if (appError || !app) {
    return NextResponse.json({ error: 'Application not found.' }, { status: 404 });
  }

  if (!canEditApplication(profile.role, user.id, app)) {
    return NextResponse.json({ error: 'Not authorized to edit this application.' }, { status: 403 });
  }

  const mergedData = mergeIntakeData((app.application_data as IntakeData | null) || {}, incoming);
  const errors = validateStep(step, mergedData);

  if (!saveOnly && errors.length) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  const nextProgress = Math.min(5, Math.max(Number(app.progress_step || 1), step));

  const { data: updated, error: updateError } = await supabase
    .from('applications')
    .update({
      application_data: mergedData,
      loan_type: (mergedData.loan_type as LoanType | undefined) || app.loan_type || null,
      progress_step: nextProgress,
      updated_by: user.id
    })
    .eq('id', id)
    .select('id,progress_step,application_data,status')
    .single();

  if (updateError || !updated) {
    return NextResponse.json({ error: updateError?.message || 'Unable to save step.' }, { status: 400 });
  }

  return NextResponse.json({ application: updated });
}

