import { NextResponse } from 'next/server';
import { getCurrentUserAndProfile } from '@/lib/authz';
import { validateForSubmit } from '@/lib/intake';
import type { IntakeData, LoanType } from '@/lib/types';

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
  const incomingData = (body.data || {}) as IntakeData;

  const { data: app, error: appError } = await supabase
    .from('applications')
    .select('id,borrower_id,broker_id,status,borrower_locked,application_data')
    .eq('id', id)
    .single();

  if (appError || !app) {
    return NextResponse.json({ error: 'Application not found.' }, { status: 404 });
  }

  if (!canEditApplication(profile.role, user.id, app)) {
    return NextResponse.json({ error: 'Not authorized to submit this application.' }, { status: 403 });
  }

  const merged = { ...(app.application_data || {}), ...(incomingData || {}) } as IntakeData;
  const errors = validateForSubmit(merged);

  if (errors.length) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  const { data: updated, error: submitError } = await supabase
    .from('applications')
    .update({
      application_data: merged,
      loan_type: (merged.loan_type as LoanType | undefined) || null,
      status: 'submitted',
      progress_step: 5,
      borrower_locked: true,
      updated_by: user.id
    })
    .eq('id', id)
    .select('id,status,progress_step')
    .single();

  if (submitError || !updated) {
    return NextResponse.json({ error: submitError?.message || 'Unable to submit application.' }, { status: 400 });
  }

  return NextResponse.json({ application: updated });
}

