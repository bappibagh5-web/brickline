import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { getCurrentUserAndProfile } from '@/lib/authz';
import { createAdminClient } from '@/lib/supabase/admin';
import type { EntityType, IntakeData, LoanType } from '@/lib/types';

function toSafeString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

export async function POST(request: Request) {
  const { supabase, user, profile } = await getCurrentUserAndProfile();

  if (!user || !profile) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!['borrower', 'broker', 'admin', 'super_admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Role cannot create applications.' }, { status: 403 });
  }

  const body = await request.json();
  const mode = toSafeString(body.mode);
  let borrowerId = user.id;
  let brokerId: string | null = null;

  const draftData: IntakeData = {};

  if (profile.role === 'borrower') {
    borrowerId = user.id;
    draftData.borrower_name = profile.full_name;
    draftData.email = profile.email;
  } else {
    brokerId = profile.role === 'broker' ? user.id : (toSafeString(body.broker_id) || null);

    if (mode === 'existing') {
      borrowerId = toSafeString(body.borrower_id);
      if (!borrowerId) {
        return NextResponse.json({ error: 'Select a borrower.' }, { status: 400 });
      }

      const { data: existing } = await supabase
        .from('user_profiles')
        .select('id,full_name,email')
        .eq('id', borrowerId)
        .eq('role', 'borrower')
        .maybeSingle();

      if (!existing) {
        return NextResponse.json({ error: 'Borrower not found.' }, { status: 404 });
      }

      draftData.borrower_name = existing.full_name;
      draftData.email = existing.email;
    } else if (mode === 'new') {
      const newBorrower = body.new_borrower || {};
      const borrowerName = toSafeString(newBorrower.borrower_name);
      const borrowerEmail = toSafeString(newBorrower.email).toLowerCase();
      const borrowerPhone = toSafeString(newBorrower.phone_number);
      const entityType = toSafeString(newBorrower.entity_type) as EntityType;

      if (!borrowerName || !borrowerEmail) {
        return NextResponse.json({ error: 'Borrower name and email are required.' }, { status: 400 });
      }

      const admin = createAdminClient();
      const { data: existingProfile } = await admin
        .from('user_profiles')
        .select('id')
        .ilike('email', borrowerEmail)
        .maybeSingle();

      if (existingProfile?.id) {
        borrowerId = existingProfile.id;
      } else {
        const tempPassword = `Tmp!${randomUUID()}aA1`;
        const { data: newUser, error: createError } = await admin.auth.admin.createUser({
          email: borrowerEmail,
          password: tempPassword,
          email_confirm: true,
          user_metadata: {
            full_name: borrowerName
          }
        });

        if (createError || !newUser.user) {
          return NextResponse.json({ error: createError?.message || 'Unable to create borrower.' }, { status: 400 });
        }

        borrowerId = newUser.user.id;

        await admin.from('user_profiles').upsert({
          id: borrowerId,
          role: 'borrower',
          full_name: borrowerName,
          email: borrowerEmail
        });
      }

      draftData.borrower_name = borrowerName;
      draftData.email = borrowerEmail;
      draftData.phone_number = borrowerPhone;
      if (entityType === 'individual' || entityType === 'llc') {
        draftData.entity_type = entityType;
      }
    } else {
      return NextResponse.json({ error: 'Invalid creation mode.' }, { status: 400 });
    }
  }

  const selectedLoanType = toSafeString(body.loan_type) as LoanType;
  if (selectedLoanType) {
    draftData.loan_type = selectedLoanType;
  }

  const { data: created, error } = await supabase
    .from('applications')
    .insert({
      borrower_id: borrowerId,
      broker_id: brokerId,
      loan_type: draftData.loan_type || null,
      status: 'draft',
      progress_step: 1,
      application_data: draftData,
      borrower_locked: false,
      created_by: user.id,
      updated_by: user.id
    })
    .select('id')
    .single();

  if (error || !created) {
    return NextResponse.json({ error: error?.message || 'Unable to create application.' }, { status: 400 });
  }

  return NextResponse.json({ applicationId: created.id });
}
