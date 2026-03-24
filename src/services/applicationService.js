const { supabase } = require('../config/supabase');
const conditionService = require('./conditionService');

async function createApplication(userId) {
  const { data, error } = await supabase
    .from('loan_applications')
    .insert({
      user_id: userId,
      status: 'lead',
      application_data: {}
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function startApplication() {
  const { data, error } = await supabase
    .from('loan_applications')
    .insert({
      user_id: null,
      status: 'lead',
      application_data: {}
    })
    .select('id, status, application_data, created_at, updated_at')
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function getApplicationById(applicationId) {
  const { data, error } = await supabase
    .from('loan_applications')
    .select('*')
    .eq('id', applicationId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

async function insertStepCompletedEvent(applicationId, stepKey) {
  if (!stepKey) {
    return;
  }

  const withPreferredShape = await supabase
    .from('application_events')
    .insert({
      application_id: applicationId,
      event_type: 'step_completed',
      metadata: { step_key: stepKey }
    });

  if (!withPreferredShape.error) {
    return;
  }

  // Fallback for legacy schema without event_type/metadata columns.
  const fallback = await supabase
    .from('application_events')
    .insert({
      application_id: applicationId,
      notes: `step_completed:${stepKey}`
    });

  if (fallback.error) {
    throw fallback.error;
  }
}

async function mergeApplicationData(applicationId, newData) {
  const { data, error } = await supabase.rpc('merge_application_data', {
    p_application_id: applicationId,
    p_new_data: newData
  });

  if (error) {
    throw error;
  }

  if (!data || data.length === 0) {
    return null;
  }

  await conditionService.resolveRelatedConditions(applicationId, newData);

  return data[0];
}

async function saveApplicationStep(applicationId, stepKey, stepData) {
  const merged = await mergeApplicationData(applicationId, stepData);

  if (!merged) {
    return null;
  }

  await insertStepCompletedEvent(applicationId, stepKey);

  const isEmailStep = stepKey === 'emailStep' || (stepData && typeof stepData.email === 'string');
  const developmentVerificationLink = isEmailStep
    ? `http://localhost:5174/set-password?applicationId=${applicationId}`
    : null;

  return {
    application: merged,
    development_verification_link: developmentVerificationLink
  };
}

async function attachUserToApplication(applicationId, userId) {
  const { data, error } = await supabase
    .from('loan_applications')
    .update({
      user_id: userId,
      status: 'account_created',
      updated_at: new Date().toISOString()
    })
    .eq('id', applicationId)
    .select('*')
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

async function listAllAuthUsers() {
  const users = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });

    if (error) {
      throw error;
    }

    const batch = data?.users || [];
    users.push(...batch);

    if (batch.length < perPage) {
      break;
    }

    page += 1;
  }

  return users;
}

async function findAuthUserByEmail(email) {
  const normalized = String(email || '').trim().toLowerCase();
  if (!normalized) return null;

  const users = await listAllAuthUsers();
  return users.find((user) => String(user.email || '').toLowerCase() === normalized) || null;
}

async function createOrConfirmAuthUser(email, password) {
  const normalizedEmail = String(email || '').trim().toLowerCase();

  const created = await supabase.auth.admin.createUser({
    email: normalizedEmail,
    password,
    email_confirm: true,
    user_metadata: { role: 'borrower' }
  });

  if (!created.error && created.data?.user) {
    return created.data.user;
  }

  const errorMessage = String(created.error?.message || '').toLowerCase();
  const isExistingUser =
    errorMessage.includes('already') ||
    errorMessage.includes('exists') ||
    errorMessage.includes('registered');

  if (!isExistingUser) {
    throw created.error;
  }

  const existing = await findAuthUserByEmail(normalizedEmail);
  if (!existing) {
    throw created.error;
  }

  const updated = await supabase.auth.admin.updateUserById(existing.id, {
    password,
    email_confirm: true,
    user_metadata: {
      ...(existing.user_metadata || {}),
      role: (existing.user_metadata && existing.user_metadata.role) || 'borrower'
    }
  });

  if (updated.error) {
    throw updated.error;
  }

  return updated.data.user;
}

async function createAccountForApplication(applicationId, email, password) {
  const application = await getApplicationById(applicationId);

  if (!application) {
    return null;
  }

  const authUser = await createOrConfirmAuthUser(email, password);

  const updatedApplication = await attachUserToApplication(applicationId, authUser.id);
  if (!updatedApplication) {
    return null;
  }

  await mergeApplicationData(applicationId, { email }).catch(() => null);

  return {
    application: updatedApplication,
    user_id: authUser.id,
    email: authUser.email
  };
}

const FALLBACK_STEP_ORDER = [
  'loan_program',
  'experience',
  'property_state',
  'has_entity',
  'email',
  'phone',
  'name'
];

function parseEventStep(event) {
  if (!event) return null;

  if (event.metadata && typeof event.metadata === 'object' && event.metadata.step_key) {
    return event.metadata.step_key;
  }

  if (typeof event.notes === 'string' && event.notes.startsWith('step_completed:')) {
    return event.notes.slice('step_completed:'.length);
  }

  return null;
}

function deriveLastStepFromData(applicationData) {
  const data = applicationData && typeof applicationData === 'object' ? applicationData : {};

  let lastStep = null;
  for (const key of FALLBACK_STEP_ORDER) {
    const value = data[key];
    if (value === null || value === undefined || value === '') {
      continue;
    }
    lastStep = key;
  }

  return lastStep;
}

async function getApplicationResume(applicationId) {
  const application = await getApplicationById(applicationId);

  if (!application) {
    return null;
  }

  const eventsResponse = await supabase
    .from('application_events')
    .select('metadata, notes, created_at')
    .eq('application_id', applicationId)
    .order('created_at', { ascending: false })
    .limit(1);

  if (eventsResponse.error) {
    throw eventsResponse.error;
  }

  const latestEvent = eventsResponse.data && eventsResponse.data.length > 0
    ? eventsResponse.data[0]
    : null;

  const lastStepFromEvent = parseEventStep(latestEvent);
  const lastStep = lastStepFromEvent || deriveLastStepFromData(application.application_data);

  return {
    last_step: lastStep,
    data: application.application_data || {}
  };
}

module.exports = {
  createApplication,
  startApplication,
  getApplicationById,
  mergeApplicationData,
  saveApplicationStep,
  attachUserToApplication,
  createAccountForApplication,
  getApplicationResume
};
