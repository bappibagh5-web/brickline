const APPLICATION_ID_STORAGE_KEY = 'brickline_application_id';
const FUNNEL_EMAIL_STORAGE_KEY = 'brickline_funnel_email';

export function getStoredApplicationId() {
  return window.localStorage.getItem(APPLICATION_ID_STORAGE_KEY);
}

export function setStoredApplicationId(applicationId) {
  if (!applicationId) return;
  window.localStorage.setItem(APPLICATION_ID_STORAGE_KEY, applicationId);
}

export function clearStoredApplicationId() {
  window.localStorage.removeItem(APPLICATION_ID_STORAGE_KEY);
}

export function getStoredFunnelEmail() {
  return window.localStorage.getItem(FUNNEL_EMAIL_STORAGE_KEY);
}

export function setStoredFunnelEmail(email) {
  if (!email) return;
  window.localStorage.setItem(FUNNEL_EMAIL_STORAGE_KEY, email);
}
