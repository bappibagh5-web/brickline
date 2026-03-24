const APPLICATION_ID_STORAGE_KEY = 'brickline_application_id';
const FUNNEL_EMAIL_STORAGE_KEY = 'brickline_funnel_email';
const ACCOUNT_SETUP_LINK_STORAGE_KEY = 'brickline_account_setup_link';

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

export function getStoredAccountSetupLink() {
  return window.localStorage.getItem(ACCOUNT_SETUP_LINK_STORAGE_KEY);
}

export function setStoredAccountSetupLink(link) {
  if (!link) return;
  window.localStorage.setItem(ACCOUNT_SETUP_LINK_STORAGE_KEY, link);
}

export function clearStoredAccountSetupLink() {
  window.localStorage.removeItem(ACCOUNT_SETUP_LINK_STORAGE_KEY);
}
