async function parseJson(response) {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return null;
  }
  return response.json();
}

export async function getApplication(apiBaseUrl, applicationId) {
  const response = await fetch(`${apiBaseUrl}/applications/${applicationId}`);
  const payload = await parseJson(response);

  if (!response.ok) {
    throw new Error(payload?.error || 'Failed to fetch application.');
  }

  return payload;
}

export async function patchApplicationStep(apiBaseUrl, applicationId, stepName, stepData) {
  const response = await fetch(`${apiBaseUrl}/applications/${applicationId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      [stepName]: stepData
    })
  });
  const payload = await parseJson(response);

  if (!response.ok) {
    throw new Error(payload?.error || 'Failed to save application step.');
  }

  return payload;
}

export async function getFields(apiBaseUrl, product, groupName) {
  const params = new URLSearchParams({
    product,
    group: groupName
  });
  const response = await fetch(`${apiBaseUrl}/fields?${params.toString()}`);
  const payload = await parseJson(response);

  if (!response.ok) {
    throw new Error(payload?.error || 'Failed to load fields.');
  }

  return Array.isArray(payload) ? payload : [];
}

export async function calculateLoan(apiBaseUrl, input) {
  const response = await fetch(`${apiBaseUrl}/calculator/calculate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(input)
  });

  const payload = await parseJson(response);

  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || 'Failed to calculate loan metrics.');
  }

  if (!payload?.success || !payload?.data) {
    throw new Error('Invalid calculator response.');
  }

  return payload.data;
}

export async function calculateDscrLoan(apiBaseUrl, input) {
  const response = await fetch(`${apiBaseUrl}/calculator/dscr-calculate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(input)
  });

  const payload = await parseJson(response);

  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || 'Failed to calculate DSCR loan metrics.');
  }

  if (!payload?.success || !payload?.data) {
    throw new Error('Invalid DSCR calculator response.');
  }

  return payload.data;
}

export async function saveApplicationStep(apiBaseUrl, applicationId, stepKey, data) {
  const response = await fetch(`${apiBaseUrl}/applications/${applicationId}/save-step`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      step_key: stepKey,
      data
    })
  });

  const payload = await parseJson(response);
  if (!response.ok) {
    throw new Error(payload?.error || 'Failed to save step.');
  }

  return payload;
}
