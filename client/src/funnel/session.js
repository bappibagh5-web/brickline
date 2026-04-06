const APPLICATION_ID_STORAGE_KEY = 'brickline_application_id';
const FUNNEL_EMAIL_STORAGE_KEY = 'brickline_funnel_email';
const ACCOUNT_SETUP_LINK_STORAGE_KEY = 'brickline_account_setup_link';
const SELECTED_LOAN_STORAGE_KEY = 'selectedLoan';
const LEGACY_SELECTED_LOAN_STORAGE_KEY = 'brickline_selected_loan';

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

export function getStoredSelectedLoan() {
  const raw = window.localStorage.getItem(SELECTED_LOAN_STORAGE_KEY)
    || window.localStorage.getItem(LEGACY_SELECTED_LOAN_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStoredSelectedLoan(selectedLoan) {
  if (!selectedLoan || typeof selectedLoan !== 'object') return;
  const serialized = JSON.stringify(selectedLoan);
  window.localStorage.setItem(SELECTED_LOAN_STORAGE_KEY, serialized);
  window.localStorage.setItem(LEGACY_SELECTED_LOAN_STORAGE_KEY, serialized);
}

export function clearStoredSelectedLoan() {
  window.localStorage.removeItem(SELECTED_LOAN_STORAGE_KEY);
  window.localStorage.removeItem(LEGACY_SELECTED_LOAN_STORAGE_KEY);
}
