import { useEffect, useRef, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import FunnelHeader from '../components/FunnelHeader.jsx';
import { getApiBaseUrl } from '../lib/apiBaseUrl.js';
import { funnelConfig, funnelInitialStepId } from './config.js';
import { useFunnel } from './FunnelContext.jsx';
import { getNextRoute, getStepByRoute } from './utils.js';
import {
  getStoredApplicationId,
  setStoredApplicationId,
  setStoredFunnelEmail
} from './session.js';

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA',
  'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT',
  'VA', 'WA', 'WV', 'WI', 'WY'
];

const US_STATE_NAME_TO_CODE = {
  alabama: 'AL',
  alaska: 'AK',
  arizona: 'AZ',
  arkansas: 'AR',
  california: 'CA',
  colorado: 'CO',
  connecticut: 'CT',
  delaware: 'DE',
  florida: 'FL',
  georgia: 'GA',
  hawaii: 'HI',
  idaho: 'ID',
  illinois: 'IL',
  indiana: 'IN',
  iowa: 'IA',
  kansas: 'KS',
  kentucky: 'KY',
  louisiana: 'LA',
  maine: 'ME',
  maryland: 'MD',
  massachusetts: 'MA',
  michigan: 'MI',
  minnesota: 'MN',
  mississippi: 'MS',
  missouri: 'MO',
  montana: 'MT',
  nebraska: 'NE',
  nevada: 'NV',
  'new hampshire': 'NH',
  'new jersey': 'NJ',
  'new mexico': 'NM',
  'new york': 'NY',
  'north carolina': 'NC',
  'north dakota': 'ND',
  ohio: 'OH',
  oklahoma: 'OK',
  oregon: 'OR',
  pennsylvania: 'PA',
  'rhode island': 'RI',
  'south carolina': 'SC',
  'south dakota': 'SD',
  tennessee: 'TN',
  texas: 'TX',
  utah: 'UT',
  vermont: 'VT',
  virginia: 'VA',
  washington: 'WA',
  'west virginia': 'WV',
  wisconsin: 'WI',
  wyoming: 'WY',
  'district of columbia': 'DC'
};

function buildApiBaseCandidates(primaryBase) {
  const bases = new Set();
  const normalized = String(primaryBase || '').trim().replace(/\/+$/, '');
  if (normalized) {
    bases.add(normalized);
    if (normalized.includes('localhost')) {
      bases.add(normalized.replace('localhost', '127.0.0.1'));
    }
    if (normalized.includes('127.0.0.1')) {
      bases.add(normalized.replace('127.0.0.1', 'localhost'));
    }
  }

  if (import.meta.env.DEV) {
    bases.add('http://localhost:3000');
    bases.add('http://127.0.0.1:3000');
  }

  return Array.from(bases);
}

function getAddressFieldKey(step, field) {
  if (!step?.addressPrefix) return field;
  return `${step.addressPrefix}_${field}`;
}

function getAddressFieldValue(step, answers, field) {
  const prefixedKey = getAddressFieldKey(step, field);
  if (answers?.[prefixedKey] !== undefined && answers?.[prefixedKey] !== null) {
    return answers[prefixedKey];
  }
  return answers?.[field] || '';
}

function getTodayIsoDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseIsoDate(isoDate) {
  if (!isoDate || !String(isoDate).includes('-')) return null;
  const [year, month, day] = String(isoDate).split('-').map(Number);
  if (!year || !month || !day) return null;
  const parsed = new Date(year, month - 1, day);
  if (
    parsed.getFullYear() !== year
    || parsed.getMonth() !== (month - 1)
    || parsed.getDate() !== day
  ) {
    return null;
  }
  return parsed;
}

function toIsoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getEarliestSigningDateIso() {
  const base = parseIsoDate(getTodayIsoDate()) || new Date();
  const minDate = new Date(base);
  minDate.setDate(minDate.getDate() + 5);

  const dayOfWeek = minDate.getDay();
  if (dayOfWeek === 6) {
    minDate.setDate(minDate.getDate() + 2);
  } else if (dayOfWeek === 0) {
    minDate.setDate(minDate.getDate() + 1);
  }

  return toIsoDate(minDate);
}

function isWeekend(isoDate) {
  const parsed = parseIsoDate(isoDate);
  if (!parsed) return false;
  const day = parsed.getDay();
  return day === 0 || day === 6;
}

function validateSigningDate(isoDate) {
  const errorMessage = 'Please select a valid signing date. It must be at least 5 days from today and cannot be on a weekend.';
  const parsed = parseIsoDate(isoDate);
  if (!parsed) {
    return { valid: false, error: errorMessage };
  }

  const minDateIso = getEarliestSigningDateIso();
  const minDate = parseIsoDate(minDateIso);
  if (!minDate) {
    return { valid: false, error: errorMessage };
  }

  if (parsed < minDate) {
    return { valid: false, error: errorMessage };
  }

  if (isWeekend(isoDate)) {
    return { valid: false, error: errorMessage };
  }

  return { valid: true, error: '' };
}

function formatIsoToUsDate(isoDate) {
  if (!isoDate || !String(isoDate).includes('-')) {
    return 'MM/DD/YYYY';
  }

  const [year, month, day] = String(isoDate).split('-');
  if (!year || !month || !day) {
    return 'MM/DD/YYYY';
  }
  return `${month}/${day}/${year}`;
}

function formatMoney(value) {
  const numeric = Number(value);
  const safeValue = Number.isFinite(numeric) ? numeric : 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(safeValue);
}

function formatRate(value) {
  const numeric = Number(value);
  const safeValue = Number.isFinite(numeric) ? numeric : 0;
  return `${safeValue.toFixed(2)}%`;
}

function extractStreetLine(fullAddress) {
  const raw = String(fullAddress || '').trim();
  if (!raw) return '';
  return raw.split(',')[0]?.trim() || raw;
}

function normalizeAddressValue(addressValue) {
  const next = { ...(addressValue || {}) };
  const currentLine1 = String(next.address_line_1 || '').trim();
  const fullAddress = String(next.full_address || '').trim();
  const normalizedLine1 = extractStreetLine(currentLine1) || extractStreetLine(fullAddress);

  return {
    address_line_1: normalizedLine1,
    address_line_2: String(next.address_line_2 || '').trim(),
    city: String(next.city || '').trim(),
    state: String(next.state || '').trim(),
    zip: String(next.zip || '').trim(),
    full_address: fullAddress,
    place_id: String(next.place_id || '').trim()
  };
}

function mapStateToCode(stateValue) {
  const raw = String(stateValue || '').trim();
  if (!raw) return '';
  const upper = raw.toUpperCase();
  if (US_STATES.includes(upper)) return upper;
  if (upper.includes('-')) {
    const tail = upper.split('-').pop();
    if (tail && US_STATES.includes(tail)) {
      return tail;
    }
  }
  return US_STATE_NAME_TO_CODE[raw.toLowerCase()] || '';
}

function normalizeQueryText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function scoreSuggestionByQuery(suggestion, queryText) {
  const query = normalizeQueryText(queryText);
  if (!query) return 0;

  const mainText = normalizeQueryText(suggestion?.main_text || '');
  const description = normalizeQueryText(suggestion?.description || '');
  const haystack = `${mainText} ${description}`.trim();
  if (!haystack) return -999;

  let score = 0;
  if (mainText.startsWith(query)) score += 180;
  if (haystack.startsWith(query)) score += 120;
  if (haystack.includes(query)) score += 90;

  const tokens = query.split(' ').filter(Boolean);
  for (const token of tokens) {
    if (!haystack.includes(token)) return -999;
    score += 20;
    if (mainText.startsWith(token)) score += 8;
  }

  if (/^\d/.test(query) && /^\d/.test(mainText || haystack)) {
    score += 30;
  }

  if (/\b(united states|usa)\b/.test(description)) {
    score += 5;
  }

  return score;
}

function rankSuggestions(suggestions, queryText) {
  return (Array.isArray(suggestions) ? suggestions : [])
    .map((item, index) => ({
      ...item,
      _score: scoreSuggestionByQuery(item, queryText),
      _index: index
    }))
    .filter((item) => item._score > -900)
    .sort((a, b) => (b._score - a._score) || (a._index - b._index))
    .map(({ _score, _index, ...item }) => item);
}

let googlePlacesScriptPromise = null;
const GOOGLE_KEY = String(import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '').trim();

function loadGooglePlacesLibrary() {
  if (window.google?.maps?.places) {
    return Promise.resolve(window.google);
  }

  if (!GOOGLE_KEY) {
    return Promise.reject(new Error('Address suggestions are temporarily unavailable.'));
  }

  if (googlePlacesScriptPromise) {
    return googlePlacesScriptPromise;
  }

  googlePlacesScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-google-places-loader="true"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.google), { once: true });
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Places script.')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(GOOGLE_KEY)}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.dataset.googlePlacesLoader = 'true';
    script.onload = () => {
      if (window.google?.maps?.places) {
        resolve(window.google);
      } else {
        reject(new Error('Google Places library not available.'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load Google Places script.'));
    document.head.appendChild(script);
  });

  return googlePlacesScriptPromise;
}

function pickGoogleAddressComponent(components, type) {
  return (Array.isArray(components) ? components : []).find((item) => Array.isArray(item.types) && item.types.includes(type));
}

function mapGooglePlaceToAddress(place, placeId) {
  const components = Array.isArray(place?.address_components) ? place.address_components : [];
  const streetNumber = pickGoogleAddressComponent(components, 'street_number')?.long_name || '';
  const route = pickGoogleAddressComponent(components, 'route')?.long_name || '';
  const city =
    pickGoogleAddressComponent(components, 'locality')?.long_name
    || pickGoogleAddressComponent(components, 'postal_town')?.long_name
    || pickGoogleAddressComponent(components, 'sublocality')?.long_name
    || '';
  const state = pickGoogleAddressComponent(components, 'administrative_area_level_1')?.short_name || '';
  const zip = pickGoogleAddressComponent(components, 'postal_code')?.long_name || '';
  const addressLine1 = [streetNumber, route].filter(Boolean).join(' ').trim();
  return normalizeAddressValue({
    address_line_1: addressLine1,
    address_line_2: '',
    city,
    state,
    zip,
    full_address: place?.formatted_address || addressLine1,
    place_id: place?.place_id || placeId || ''
  });
}

function BorrowerAddressAutocompleteInput({
  address,
  setAddressField
}) {
  const requestIdRef = useRef(0);
  const googleAutocompleteServiceRef = useRef(null);
  const googlePlacesServiceRef = useRef(null);
  const [query, setQuery] = useState(String(address?.address_line_1 || ''));
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inputError, setInputError] = useState('');

  useEffect(() => {
    setQuery(String(address?.address_line_1 || ''));
  }, [address?.address_line_1]);

  useEffect(() => {
    loadGooglePlacesLibrary()
      .then(() => {
        googleAutocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
        googlePlacesServiceRef.current = new window.google.maps.places.PlacesService(document.createElement('div'));
      })
      .catch(() => {
        googleAutocompleteServiceRef.current = null;
        googlePlacesServiceRef.current = null;
      });
  }, []);

  useEffect(() => {
    const rawInput = String(query ?? '');
    if (normalizeQueryText(rawInput).length < 3) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    if (!googleAutocompleteServiceRef.current || !window.google?.maps?.places) {
      return;
    }

    setLoading(true);
    setInputError('');
    const currentRequestId = ++requestIdRef.current;
    const timer = setTimeout(async () => {
      try {
        const predictionRequest = {
          input: rawInput,
          types: ['address'],
          componentRestrictions: { country: 'us' }
        };

        const googlePredictions = await new Promise((resolve, reject) => {
          googleAutocompleteServiceRef.current.getPlacePredictions(predictionRequest, (predictions, status) => {
            const placesStatus = window.google.maps.places.PlacesServiceStatus;
            if (status === placesStatus.OK) {
              resolve(Array.isArray(predictions) ? predictions : []);
              return;
            }
            if (status === placesStatus.ZERO_RESULTS) {
              resolve([]);
              return;
            }
            reject(new Error('Failed to fetch address suggestions.'));
          });
        });

        const nextSuggestions = rankSuggestions(
          googlePredictions.map((item) => ({
            place_id: item.place_id,
            description: item.description,
            main_text: item?.structured_formatting?.main_text || ''
          })),
          rawInput
        );

        if (currentRequestId !== requestIdRef.current) return;
        setLoading(false);
        setSuggestions(nextSuggestions);
      } catch (error) {
        if (currentRequestId !== requestIdRef.current) return;
        setLoading(false);
        setSuggestions([]);
        setInputError(error.message || 'Failed to fetch address suggestions.');
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelectSuggestion = async (prediction) => {
    const placeId = prediction?.place_id;
    if (!placeId || !googlePlacesServiceRef.current || !window.google?.maps?.places) return;

    setLoading(true);
    setInputError('');
    try {
      const mapped = await new Promise((resolve, reject) => {
        googlePlacesServiceRef.current.getDetails(
          {
            placeId,
            fields: ['address_components', 'formatted_address', 'place_id']
          },
          (place, status) => {
            const placesStatus = window.google.maps.places.PlacesServiceStatus;
            if (status === placesStatus.OK && place) {
              resolve(mapGooglePlaceToAddress(place, placeId));
              return;
            }
            reject(new Error('Could not load address details.'));
          }
        );
      });

      const nextAddress = normalizeAddressValue(mapped || {});
      setAddressField('address_line_1', nextAddress.address_line_1 || '');
      setAddressField('city', nextAddress.city || '');
      setAddressField('state', nextAddress.state || '');
      setAddressField('zip', nextAddress.zip || '');
      setQuery(nextAddress.address_line_1 || prediction.main_text || prediction.description || '');
      setSuggestions([]);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      setInputError(error.message || 'Could not load address details.');
    }
  };

  return (
    <div className="space-y-2">
      <input
        value={query}
        onChange={(event) => {
          const nextValue = event.target.value;
          setQuery(nextValue);
          setAddressField('address_line_1', nextValue);
          setInputError('');
        }}
        placeholder="Current Borrower Address Line 1"
        className="h-12 w-full rounded-none border border-[#9aa4ae] bg-[#f4f5f5] px-4 text-[16px] text-[#475569] placeholder:text-[#8d96b6] focus:border-[#4e6bf0] focus:bg-[#f3f6ff] focus:outline-none"
      />
      <div className="relative">
        {loading ? <p className="text-xs text-[#5f6b8f]">Searching address...</p> : null}
        {suggestions.length > 0 ? (
          <div className="absolute z-20 mt-1 max-h-64 w-full overflow-auto border border-[#d6dbea] bg-white shadow-[0_8px_20px_rgba(0,0,0,0.08)]">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.place_id}
                type="button"
                onClick={() => handleSelectSuggestion(suggestion)}
                className="block w-full border-b border-[#eef2fb] px-3 py-2 text-left text-sm text-[#27345d] hover:bg-[#f4f7ff]"
              >
                {suggestion.description}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      {inputError ? <p className="text-xs text-[#b63d3d]">{inputError}</p> : null}
    </div>
  );
}

function AddressAutocompleteField({ value, setValue }) {
  const requestIdRef = useRef(0);
  const googleAutocompleteServiceRef = useRef(null);
  const googlePlacesServiceRef = useRef(null);
  const lastSyncedPlaceIdRef = useRef('');
  const userTypingRef = useRef(false);
  const [query, setQuery] = useState(value?.address_line_1 || extractStreetLine(value?.full_address) || '');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inputError, setInputError] = useState('');
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const [geoBias, setGeoBias] = useState(null);

  useEffect(() => {
    loadGooglePlacesLibrary()
      .then(() => {
        googleAutocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
        googlePlacesServiceRef.current = new window.google.maps.places.PlacesService(document.createElement('div'));
        setGoogleLoaded(true);
      })
      .catch(() => {
        setGoogleLoaded(false);
      });
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGeoBias({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      () => {}
    );
  }, []);

  useEffect(() => {
    const placeId = String(value?.place_id || '');
    const nextStreet = value?.address_line_1 || extractStreetLine(value?.full_address) || '';
    if (!userTypingRef.current && placeId && placeId !== lastSyncedPlaceIdRef.current && nextStreet !== query) {
      setQuery(nextStreet);
      lastSyncedPlaceIdRef.current = placeId;
    }
  }, [query, value?.address_line_1, value?.full_address]);

  useEffect(() => {
    const rawInput = String(query ?? '');
    if (normalizeQueryText(rawInput).length < 3) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setInputError('');
    const currentRequestId = ++requestIdRef.current;
    const timer = setTimeout(async () => {
      try {
        let nextSuggestions = [];

        if (!googleLoaded || !googleAutocompleteServiceRef.current) {
          throw new Error('Address suggestions are temporarily unavailable.');
        }

        const predictionRequest = {
          input: rawInput,
          types: ['address'],
          componentRestrictions: { country: 'us' }
        };

        if (geoBias) {
          predictionRequest.location = new window.google.maps.LatLng(geoBias.lat, geoBias.lng);
          predictionRequest.radius = 50000;
        }

        const googlePredictions = await new Promise((resolve, reject) => {
          googleAutocompleteServiceRef.current.getPlacePredictions(predictionRequest, (predictions, status) => {
            const placesStatus = window.google.maps.places.PlacesServiceStatus;
            if (status === placesStatus.OK) {
              resolve(Array.isArray(predictions) ? predictions : []);
              return;
            }
            if (status === placesStatus.ZERO_RESULTS) {
              resolve([]);
              return;
            }
            reject(new Error('Failed to fetch address suggestions.'));
          });
        });

        nextSuggestions = rankSuggestions(
          googlePredictions.map((item) => ({
            provider: 'google',
            place_id: item.place_id,
            description: item.description,
            main_text: item?.structured_formatting?.main_text || ''
          })),
          rawInput
        );

        if (currentRequestId !== requestIdRef.current) return;
        setLoading(false);
        setSuggestions(nextSuggestions);
      } catch (error) {
        if (currentRequestId !== requestIdRef.current) return;
        setLoading(false);
        setSuggestions([]);
        setInputError(error.message || 'Failed to fetch address suggestions.');
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [geoBias, googleLoaded, query]);

  const handleSelectSuggestion = async (prediction) => {
    const placeId = prediction?.place_id;
    if (!placeId) return;

    userTypingRef.current = false;
    setLoading(true);
    setInputError('');
    try {
      let mapped = null;

      if (!googleLoaded || !googlePlacesServiceRef.current) {
        throw new Error('Address suggestions are temporarily unavailable.');
      }

      mapped = await new Promise((resolve, reject) => {
        googlePlacesServiceRef.current.getDetails(
          {
            placeId,
            fields: ['address_components', 'formatted_address', 'place_id']
          },
          (place, status) => {
            const placesStatus = window.google.maps.places.PlacesServiceStatus;
            if (status === placesStatus.OK && place) {
              resolve(mapGooglePlaceToAddress(place, placeId));
              return;
            }
            reject(new Error('Could not load address details.'));
          }
        );
      });

      const nextAddress = normalizeAddressValue(mapped || {});
      setValue(nextAddress);
      setQuery(nextAddress.address_line_1 || prediction.main_text || prediction.description || '');
      lastSyncedPlaceIdRef.current = String(nextAddress.place_id || placeId);
      setSuggestions([]);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      setInputError(error.message || 'Could not load address details. Try another suggestion.');
    }
  };

  return (
    <div className="mt-6 space-y-3">
      <label className="grid gap-1">
        <span className="text-xs font-medium uppercase tracking-wide text-[#5f6b8f]">Address Line 1</span>
        <input
          type="text"
          value={query}
          onChange={(event) => {
            const nextQuery = event.target.value;
            userTypingRef.current = true;
            setQuery(nextQuery);
            setValue({
              address_line_1: nextQuery,
              address_line_2: value?.address_line_2 || '',
              city: '',
              state: '',
              zip: '',
              full_address: '',
              place_id: ''
            });
            setInputError('');
          }}
          placeholder="Start typing property address..."
          className="h-11 w-full rounded-none border border-[#9aa4ae] bg-[#f4f5f5] px-4 text-[14px] text-[#475569] placeholder:text-[#8d96b6] transition-all duration-150 focus:border-[#4e6bf0] focus:bg-[#f3f6ff] focus:outline-none"
        />
      </label>

      <div className="relative">
        {loading ? <p className="text-xs text-[#5f6b8f]">Searching address...</p> : null}
        {suggestions.length > 0 ? (
          <div className="absolute z-20 mt-1 max-h-64 w-full overflow-auto border border-[#d6dbea] bg-white shadow-[0_8px_20px_rgba(0,0,0,0.08)]">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.place_id}
                type="button"
                onClick={() => handleSelectSuggestion(suggestion)}
                className="block w-full border-b border-[#eef2fb] px-3 py-2 text-left text-sm text-[#27345d] hover:bg-[#f4f7ff]"
              >
                {suggestion.description}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <label className="grid gap-1">
        <span className="text-xs font-medium uppercase tracking-wide text-[#5f6b8f]">Address Line 2</span>
        <input
          value={value?.address_line_2 || ''}
          onChange={(event) => setValue({ ...value, address_line_2: event.target.value })}
          placeholder="Apartment, suite, unit (optional)"
          className="h-11 w-full rounded-none border border-[#9aa4ae] bg-[#f4f5f5] px-4 text-[14px] text-[#475569] placeholder:text-[#8d96b6] transition-all duration-150 focus:border-[#4e6bf0] focus:bg-[#f3f6ff] focus:outline-none"
        />
      </label>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
        <label className="grid gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-[#5f6b8f]">City</span>
          <input readOnly value={value?.city || ''} className="h-10 rounded-none border border-[#dfe3ef] bg-[#f8faff] px-3 text-sm text-[#44517a]" />
        </label>
        <label className="grid gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-[#5f6b8f]">State</span>
          <input readOnly value={value?.state || ''} className="h-10 rounded-none border border-[#dfe3ef] bg-[#f8faff] px-3 text-sm text-[#44517a]" />
        </label>
        <label className="grid gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-[#5f6b8f]">Zip</span>
          <input readOnly value={value?.zip || ''} className="h-10 rounded-none border border-[#dfe3ef] bg-[#f8faff] px-3 text-sm text-[#44517a]" />
        </label>
      </div>

      {inputError ? <p className="text-xs text-[#b63d3d]">{inputError}</p> : null}
      <p className="text-xs text-[#5f6b8f]">Please choose an address from suggestions.</p>
    </div>
  );
}

function SigningDateStep({ value, setValue, onGoBack }) {
  const [showNotice, setShowNotice] = useState(true);
  const [validationError, setValidationError] = useState('');
  const earliestDateIso = getEarliestSigningDateIso();
  const effectiveDate = value || earliestDateIso;
  const validation = validateSigningDate(effectiveDate);
  const prettyDate = formatIsoToUsDate(effectiveDate);

  return (
    <div className="mt-5 space-y-4">
      <p className="text-[15px] text-[#374151]">
        Most borrowers can close and fund on the same day.
      </p>
      <p className="text-[15px] text-[#374151]">
        Borrowers in Alaska, Arizona, California, Hawaii, Idaho, Nevada, New Mexico, Oregon, and
        Washington may sign and fund a minimum of 1 day after signing.
      </p>

      <div className="rounded-md border border-[#0f766e] bg-[#e6f5f1] px-4 py-3 text-[15px] text-[#1f2937]">
        Based on the selected date and the property's location, your estimated signing date will be{' '}
        <span className="font-semibold">{prettyDate}</span>. You should fund the same day.
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[240px_1fr]">
        <label className="grid gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-[#6b7280]">MM/DD/YYYY</span>
          <input
            type="date"
            value={effectiveDate}
            min={earliestDateIso}
            onChange={(event) => {
              const nextDate = event.target.value;
              const nextValidation = validateSigningDate(nextDate);
              if (!nextValidation.valid) {
                setValidationError(nextValidation.error);
                return;
              }
              setValidationError('');
              setValue(nextDate);
            }}
            className="h-12 rounded-none border border-[#9aa4ae] bg-[#f4f5f5] px-3 text-[24px] leading-none text-[#334155] focus:border-[#4e6bf0] focus:bg-[#f3f6ff] focus:outline-none"
          />
        </label>

        {showNotice ? (
          <aside className="relative border border-[#d6d9db] bg-[#f8f8f8] px-5 py-4 shadow-[0_2px_3px_rgba(0,0,0,0.08)]">
            <button
              type="button"
              onClick={() => setShowNotice(false)}
              className="absolute right-3 top-2 text-sm text-[#9ca3af] hover:text-[#6b7280]"
              aria-label="Close notice"
            >
              ×
            </button>
            <h3 className="text-[24px] font-semibold leading-tight text-[#111827]">Closing Dates Can Change</h3>
            <p className="mt-2 text-[15px] leading-6 text-[#374151]">
              Please note that closing dates can change due to many factors including: time taken to
              complete full loan application, third party tasks (title, insurance, etc), amended purchase
              &amp; sale agreements. Please contact your sales rep if you have any questions.
            </p>
          </aside>
        ) : null}
      </div>

      <button
        type="button"
        onClick={onGoBack}
        className="text-[15px] font-medium text-[#0f766e] underline underline-offset-2 hover:text-[#0d5f59]"
      >
        Go Back
      </button>
      {!validation.valid || validationError ? (
        <p className="text-sm font-medium text-[#b63d3d]">
          {validationError || 'Please select a valid signing date. It must be at least 5 days from today and cannot be on a weekend.'}
        </p>
      ) : null}
    </div>
  );
}

function getReviewSummary(answers) {
  const calculatorInputs = answers.calculator_inputs || {};
  const calculatorResults = answers.calculator_results || {};
  const selectedProduct = answers.selected_loan_product || {};
  const selectedProductFallback = {
    term: answers.term ?? answers.termMonths ?? answers.selected_term ?? null,
    rate: answers.rate ?? answers.interest_rate ?? answers.annual_interest_rate ?? null,
    monthly_payment:
      answers.monthly_payment
      ?? answers.monthlyPayment
      ?? answers.estimated_monthly_payment
      ?? answers.estimatedMonthlyPayment
      ?? null
  };
  const effectiveSelectedProduct = {
    ...selectedProductFallback,
    ...selectedProduct
  };
  const loanProducts = Array.isArray(calculatorResults.loan_products)
    ? calculatorResults.loan_products
    : (Array.isArray(answers.loan_products) ? answers.loan_products : []);
  const selectedTerm = Number(
    effectiveSelectedProduct.term
    ?? effectiveSelectedProduct.termMonths
    ?? calculatorInputs.selected_term
    ?? answers.selected_term
    ?? 0
  );
  const matchedProduct = loanProducts.find((item) => Number(item?.term) === selectedTerm) || null;
  const fallbackProduct = matchedProduct || loanProducts[0] || null;
  const purchasePrice = Number(
    calculatorInputs.purchase_price ?? answers.purchase_price ?? 0
  );
  const rehabBudget = Number(
    calculatorInputs.rehab_budget ?? answers.rehab_budget ?? 0
  );
  const purchaseAdvancePercent = Number(
    calculatorInputs.purchase_advance_percent ?? answers.purchase_advance_percent ?? 0
  );
  const rehabAdvancePercent = Number(
    calculatorInputs.rehab_advance_percent ?? answers.rehab_advance_percent ?? 0
  );
  const normalizedPurchaseAdvance = purchaseAdvancePercent > 1 ? purchaseAdvancePercent / 100 : purchaseAdvancePercent;
  const normalizedRehabAdvance = rehabAdvancePercent > 1 ? rehabAdvancePercent / 100 : rehabAdvancePercent;

  const calculatedPurchaseLoan = purchasePrice * normalizedPurchaseAdvance;
  const calculatedRehabLoan = rehabBudget * normalizedRehabAdvance;

  const purchaseLoanAmount = Number(
    calculatorResults.purchase_loan
    ?? selectedProduct.purchase_loan
    ?? answers.purchase_loan
    ?? calculatedPurchaseLoan
    ?? 0
  );
  const rehabHoldback = Number(
    calculatorResults.rehab_loan
    ?? selectedProduct.rehab_loan
    ?? answers.rehab_loan
    ?? calculatedRehabLoan
    ?? 0
  );
  const totalLoanAmount = Number(
    calculatorResults.total_loan
    ?? selectedProduct.total_loan
    ?? answers.total_loan
    ?? purchaseLoanAmount + rehabHoldback
    ?? 0
  );
  const downPayment = Math.max(purchasePrice - purchaseLoanAmount, 0);
  const originationFee = totalLoanAmount * 0.02;
  const serviceFee = 1295;
  const cashRequired = downPayment + originationFee + serviceFee;
  const resolvedRate = Number(
    effectiveSelectedProduct.rate
    ?? effectiveSelectedProduct.interest_rate
    ?? effectiveSelectedProduct.annual_interest_rate
    ?? fallbackProduct?.rate
    ?? 0
  );
  const resolvedMonthlyPayment = Number(
    effectiveSelectedProduct.monthly_payment
    ?? effectiveSelectedProduct.monthlyPayment
    ?? effectiveSelectedProduct.estimated_monthly_payment
    ?? effectiveSelectedProduct.estimatedMonthlyPayment
    ?? fallbackProduct?.monthly_payment
    ?? fallbackProduct?.monthlyPayment
    ?? fallbackProduct?.estimated_monthly_payment
    ?? fallbackProduct?.estimatedMonthlyPayment
    ?? (resolvedRate > 0 ? (purchaseLoanAmount * (resolvedRate / 100)) / 12 : 0)
  );

  return {
    entity_name: answers.entity_name || 'Entity',
    property_address:
      answers.finance_property_full_address
      || answers.purchase_property_full_address
      || answers.lead_property_full_address
      || answers.property_address
      || 'N/A',
    property_type:
      answers.property_type
      || answers.calculator_inputs?.property_type
      || answers.submission_snapshot?.calculator?.property_type
      || 'N/A',
    total_loan_amount: totalLoanAmount,
    purchase_loan_amount: purchaseLoanAmount,
    rehab_holdback: rehabHoldback,
    estimated_monthly_payment: resolvedMonthlyPayment,
    interest_rate: resolvedRate,
    estimated_cash_required: cashRequired,
    down_payment: downPayment,
    origination_fee: originationFee,
    service_fee: serviceFee
  };
}

function SummaryRow({ label, value, strong = false }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <p className={`text-[15px] ${strong ? 'font-semibold text-[#1f2937]' : 'text-[#4b5563]'}`}>{label}</p>
      <p className={`text-[15px] ${strong ? 'font-semibold text-[#1f2937]' : 'text-[#1f2937]'}`}>{value}</p>
    </div>
  );
}

function ReviewSubmitStep({ summary, onGoBack, onSubmit, submitting, submitError, submitSuccess }) {
  return (
    <div className="mt-4">
      <h1 className="text-[48px] text-[clamp(32px,3.2vw,48px)] font-normal leading-[1.1] tracking-[-0.02em] text-[#1f2937]">
        Review Your Loan Details.
      </h1>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1.08fr_0.92fr]">
        <section className="panel p-5">
          <div className="border-b border-[#e7ebf4] pb-4">
            <p className="text-lg font-semibold text-[#1f2937]">{summary.entity_name}</p>
            <p className="mt-1 text-sm text-[#5f6b8f]">{summary.property_address}</p>
            <p className="mt-1 text-sm text-[#5f6b8f]">Property Type: {summary.property_type}</p>
          </div>

          <div className="border-b border-[#e7ebf4] py-4">
            <SummaryRow label="Total Loan Amount" value={formatMoney(summary.total_loan_amount)} strong />
            <SummaryRow label="Purchase Loan Amount" value={formatMoney(summary.purchase_loan_amount)} />
            <SummaryRow label="Rehab Holdback" value={formatMoney(summary.rehab_holdback)} />
          </div>

          <div className="border-b border-[#e7ebf4] py-4">
            <SummaryRow label="Estimated Monthly Payment" value={formatMoney(summary.estimated_monthly_payment)} strong />
            <SummaryRow label="Interest Rate" value={formatRate(summary.interest_rate)} strong />
          </div>

          <div className="pt-4">
            <SummaryRow label="Estimated Cash Required at Closing" value={formatMoney(summary.estimated_cash_required)} strong />
            <SummaryRow label="Down Payment" value={formatMoney(summary.down_payment)} />
            <SummaryRow label="Origination Fee" value={formatMoney(summary.origination_fee)} />
            <SummaryRow label="Service Fee" value={formatMoney(summary.service_fee)} />
          </div>
        </section>

        <aside className="space-y-4">
          <p className="text-[18px] leading-8 text-[#374151]">
            Please make sure your borrower and guarantor information is correct. In order to process your
            application quickly you can&apos;t make changes once submitted.
          </p>

          <button
            type="button"
            onClick={onSubmit}
            disabled={submitting}
            className="topbar-btn"
          >
            {submitting ? 'Submitting...' : 'Submit for Review'}
          </button>

          <p className="text-sm leading-6 text-[#4b5563]">
            By submitting for review you agree to the E-Sign Consent, Information Certification and
            Authorization Agreement, Refund Policy, Privacy Policy, Terms of Use, and State Disclosure.
          </p>

          {submitSuccess ? (
            <p className="text-sm font-semibold text-[#1f7a55]">Your loan has been submitted successfully.</p>
          ) : null}
          {submitError ? <p className="text-sm font-semibold text-[#b63d3d]">{submitError}</p> : null}

          <button
            type="button"
            onClick={onGoBack}
            className="text-sm font-semibold text-[#0f766e] underline underline-offset-2"
          >
            Go Back
          </button>
        </aside>
      </div>
    </div>
  );
}

function EligibilityConfirmStep({ value, setValue }) {
  const checked = Boolean(value?.non_owner_occupied);

  return (
    <div className="mt-6 max-w-[720px]">
      <label className="flex items-center gap-3 rounded-lg border border-[#d6d9db] bg-[#f8f8f8] px-4 py-3 text-[16px] text-[#1f2937]">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) =>
            setValue({
              non_owner_occupied: event.target.checked
            })
          }
          className="h-4 w-4 accent-[#2f54eb]"
        />
        <span>I will not be living in the property</span>
      </label>
    </div>
  );
}

function getBorrowerDetailsDefault(step, answers) {
  const fallbackAddressFromFull = extractStreetLine(
    getAddressFieldValue({ addressPrefix: 'finance_property' }, answers, 'full_address')
    || getAddressFieldValue({ addressPrefix: 'purchase_property' }, answers, 'full_address')
    || getAddressFieldValue({ addressPrefix: 'lead_property' }, answers, 'full_address')
    || answers.property_address
  );

  const fallbackAddressLine1 = getAddressFieldValue(
    { addressPrefix: 'finance_property' },
    answers,
    'address_line_1'
  ) || getAddressFieldValue({ addressPrefix: 'purchase_property' }, answers, 'address_line_1')
    || getAddressFieldValue({ addressPrefix: 'lead_property' }, answers, 'address_line_1')
    || fallbackAddressFromFull;

  const fallbackAddressLine2 = getAddressFieldValue(
    { addressPrefix: 'finance_property' },
    answers,
    'address_line_2'
  ) || getAddressFieldValue({ addressPrefix: 'purchase_property' }, answers, 'address_line_2')
    || getAddressFieldValue({ addressPrefix: 'lead_property' }, answers, 'address_line_2');

  const fallbackCity = getAddressFieldValue({ addressPrefix: 'finance_property' }, answers, 'city')
    || getAddressFieldValue({ addressPrefix: 'purchase_property' }, answers, 'city')
    || getAddressFieldValue({ addressPrefix: 'lead_property' }, answers, 'city');

  const fallbackState = getAddressFieldValue({ addressPrefix: 'finance_property' }, answers, 'state')
    || getAddressFieldValue({ addressPrefix: 'purchase_property' }, answers, 'state')
    || getAddressFieldValue({ addressPrefix: 'lead_property' }, answers, 'state')
    || answers.property_state
    || '';

  const fallbackZip = getAddressFieldValue({ addressPrefix: 'finance_property' }, answers, 'zip')
    || getAddressFieldValue({ addressPrefix: 'purchase_property' }, answers, 'zip')
    || getAddressFieldValue({ addressPrefix: 'lead_property' }, answers, 'zip');

  const existing = step.key && answers[step.key] && typeof answers[step.key] === 'object'
    ? answers[step.key]
    : {};

  return {
    entity_name: existing.entity_name || answers.entity_name || '',
    first_name: existing.first_name || answers.first_name || '',
    last_name: existing.last_name || answers.last_name || '',
    dob: existing.dob || answers.date_of_birth || '',
    address: {
      address_line_1: String(existing.address?.address_line_1 ?? fallbackAddressLine1 ?? ''),
      address_line_2: String(existing.address?.address_line_2 ?? fallbackAddressLine2 ?? ''),
      city: String(existing.address?.city ?? fallbackCity ?? ''),
      state: String(existing.address?.state ?? fallbackState ?? ''),
      zip: String(existing.address?.zip ?? fallbackZip ?? '')
    },
    consents: {
      credit_pull: Boolean(existing.consents?.credit_pull),
      background_check: Boolean(existing.consents?.background_check)
    }
  };
}

function BorrowerDetailsStep({
  value,
  setValue,
  onNext,
  onGoBack,
  canProceed,
  saving,
  initializing,
  error,
  applicationId,
  apiBaseUrl
}) {
  const [panelVisible, setPanelVisible] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');

  const setField = (field, nextValue) => {
    setValue({
      ...value,
      [field]: nextValue
    });
  };

  const setAddressField = (field, nextValue) => {
    setValue({
      ...value,
      address: {
        ...(value.address || {}),
        [field]: nextValue
      }
    });
  };

  const setConsentField = (field, nextValue) => {
    setValue({
      ...value,
      consents: {
        ...(value.consents || {}),
        [field]: nextValue
      }
    });
  };

  const handleDownloadTerms = async () => {
    if (!applicationId) return;
    setDownloadError('');
    setDownloading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/applications/${applicationId}/generate-loan-summary`);
      if (!response.ok) {
        throw new Error('Failed to generate loan summary.');
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = `loan-summary-${applicationId}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (downloadFailure) {
      setDownloadError(downloadFailure.message || 'Could not download loan terms.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="mt-4">
      <p className="max-w-[980px] text-[24px] leading-[1.35] text-[#1f2937]">
        In order to provide you the best possible rate, we will run a soft credit pull on the guarantor
        of the entity. Here is what we have so far.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-[1.05fr_0.95fr]">
        <section>
          <h2 className="text-[24px] font-semibold leading-tight text-[#1f2937]">Entity and Individual Details</h2>
          <p className="mt-2 text-[14px] leading-6 text-[#4b5563]">
            Here is the most up to date information we have. Please enter or confirm any additional details.
          </p>

          <div className="mt-6 space-y-4">
            <input
              value={value.entity_name || ''}
              onChange={(event) => setField('entity_name', event.target.value)}
              placeholder="Entity Name"
              className="h-12 w-full rounded-none border border-[#9aa4ae] bg-[#f4f5f5] px-4 text-[16px] text-[#475569] placeholder:text-[#8d96b6] focus:border-[#4e6bf0] focus:bg-[#f3f6ff] focus:outline-none"
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="text-[14px] font-medium text-[#374151]">First Name</label>
                <input
                  value={value.first_name || ''}
                  onChange={(event) => setField('first_name', event.target.value)}
                  className="mt-1 h-12 w-full rounded-none border border-[#9aa4ae] bg-[#f4f5f5] px-4 text-[16px] text-[#475569] focus:border-[#4e6bf0] focus:bg-[#f3f6ff] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[14px] font-medium text-[#374151]">Last Name</label>
                <input
                  value={value.last_name || ''}
                  onChange={(event) => setField('last_name', event.target.value)}
                  className="mt-1 h-12 w-full rounded-none border border-[#9aa4ae] bg-[#f4f5f5] px-4 text-[16px] text-[#475569] focus:border-[#4e6bf0] focus:bg-[#f3f6ff] focus:outline-none"
                />
              </div>
            </div>

            <input
              type="date"
              value={value.dob || ''}
              onChange={(event) => setField('dob', event.target.value)}
              className="h-12 w-full rounded-none border border-[#9aa4ae] bg-[#f4f5f5] px-4 text-[16px] text-[#475569] focus:border-[#4e6bf0] focus:bg-[#f3f6ff] focus:outline-none"
            />

            <h3 className="pt-1 text-[18px] font-semibold leading-tight text-[#1f2937]">
              Individual Current Address
            </h3>

            <BorrowerAddressAutocompleteInput
              address={value.address || {}}
              setAddressField={setAddressField}
            />

            <input
              value={value.address?.address_line_2 || ''}
              onChange={(event) => setAddressField('address_line_2', event.target.value)}
              placeholder="Current Borrower Address Line 2"
              className="h-12 w-full rounded-none border border-[#9aa4ae] bg-[#f4f5f5] px-4 text-[16px] text-[#475569] placeholder:text-[#8d96b6] focus:border-[#4e6bf0] focus:bg-[#f3f6ff] focus:outline-none"
            />

            <input
              value={value.address?.city || ''}
              onChange={(event) => setAddressField('city', event.target.value)}
              placeholder="City"
              className="h-12 w-full rounded-none border border-[#9aa4ae] bg-[#f4f5f5] px-4 text-[16px] text-[#475569] placeholder:text-[#8d96b6] focus:border-[#4e6bf0] focus:bg-[#f3f6ff] focus:outline-none"
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_1fr]">
              <select
                value={value.address?.state || ''}
                onChange={(event) => setAddressField('state', event.target.value)}
                className="h-12 w-full rounded-none border border-[#9aa4ae] bg-[#f4f5f5] px-4 text-[16px] text-[#475569] focus:border-[#4e6bf0] focus:bg-[#f3f6ff] focus:outline-none"
              >
                <option value="">State</option>
                {US_STATES.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
              <input
                value={value.address?.zip || ''}
                onChange={(event) => setAddressField('zip', event.target.value)}
                placeholder="ZIP Code"
                className="h-12 w-full rounded-none border border-[#9aa4ae] bg-[#f4f5f5] px-4 text-[16px] text-[#475569] placeholder:text-[#8d96b6] focus:border-[#4e6bf0] focus:bg-[#f3f6ff] focus:outline-none"
              />
            </div>
          </div>
        </section>

        <aside className="border border-[#d6d9db] bg-[#f8f8f8] p-6">
          <h3 className="text-[24px] font-semibold leading-tight text-[#1f2937]">Submission Details</h3>
          <p className="mt-2 text-[14px] leading-6 text-[#4b5563]">
            You can download Loan Terms now. Submit the loan application when you're ready.
          </p>

          <button
            type="button"
            onClick={handleDownloadTerms}
            disabled={downloading || !applicationId}
            className="mt-5 inline-flex h-10 items-center rounded border border-[#0f766e] bg-white px-5 text-[16px] font-medium text-[#0f766e] hover:bg-[#eef8f6] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {downloading ? 'Preparing PDF...' : 'Download Loan Terms'}
          </button>
          {downloadError ? <p className="mt-2 text-sm text-[#b63d3d]">{downloadError}</p> : null}

          <h4 className="mt-7 text-[18px] font-semibold text-[#1f2937]">About This Application</h4>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[14px] leading-7 text-[#374151]">
            <li>If you've recently applied for another loan with us, we will use the credit decision on file.</li>
            <li>To ensure the most accurate pricing, we recommend the guarantor submit the loan application.</li>
            <li>This guarantor must have owned at least 25% of this entity for at least 180 days or since inception.</li>
            <li>If you need to correct the guarantor, please go back and make that change.</li>
            <li>If you need to change entities for this loan application please contact support.</li>
          </ul>

          <p className="mt-5 text-[18px] font-semibold text-[#1f2937]">I consent to have this lender:</p>
          <div className="mt-4 space-y-4">
            <label className="flex items-start gap-3 text-[14px] leading-6 text-[#374151]">
              <input
                type="checkbox"
                checked={Boolean(value.consents?.credit_pull)}
                onChange={(event) => setConsentField('credit_pull', event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-[#9aa4ae]"
              />
              <span>Order a consumer credit report (soft pull)</span>
            </label>
            <label className="flex items-start gap-3 text-[14px] leading-6 text-[#374151]">
              <input
                type="checkbox"
                checked={Boolean(value.consents?.background_check)}
                onChange={(event) => setConsentField('background_check', event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-[#9aa4ae]"
              />
              <span>Obtain a background report</span>
            </label>
          </div>

          {error ? <p className="mt-4 text-sm font-medium text-[#b63d3d]">{error}</p> : null}

          <div className="mt-7 flex items-center justify-between">
            <button
              type="button"
              onClick={onGoBack}
              className="text-[14px] font-medium text-[#0f766e] underline underline-offset-2 hover:text-[#0d5f59]"
            >
              Go Back
            </button>
            <button
              type="button"
              onClick={onNext}
              disabled={!canProceed || saving || initializing}
              className="inline-flex h-10 min-w-[88px] items-center justify-center rounded bg-[#0f766e] px-4 text-[16px] font-semibold text-white transition-all duration-150 hover:bg-[#0d655e] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Next'}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function getStepValue(step, answers) {
  if (step.type === 'name') {
    return {
      first_name: answers.first_name || '',
      last_name: answers.last_name || '',
      suffix: answers.suffix || ''
    };
  }

  if (step.type === 'address') {
    const normalized = normalizeAddressValue({
      address_line_1: getAddressFieldValue(step, answers, 'address_line_1'),
      address_line_2: getAddressFieldValue(step, answers, 'address_line_2'),
      city: getAddressFieldValue(step, answers, 'city'),
      state: getAddressFieldValue(step, answers, 'state'),
      zip: getAddressFieldValue(step, answers, 'zip'),
      full_address: getAddressFieldValue(step, answers, 'full_address') || answers.property_address || '',
      place_id: getAddressFieldValue(step, answers, 'place_id')
    });

    return {
      ...normalized
    };
  }

  if (step.type === 'signingDate') {
    if (step.key && answers[step.key]) {
      return answers[step.key];
    }
    return getEarliestSigningDateIso();
  }

  if (step.type === 'eligibilityConfirm') {
    const saved = answers[step.key];
    if (saved && typeof saved === 'object') {
      return {
        non_owner_occupied: Boolean(saved.non_owner_occupied)
      };
    }
    return { non_owner_occupied: false };
  }

  if (step.type === 'borrowerDetails') {
    return getBorrowerDetailsDefault(step, answers);
  }

  if (step.type === 'reviewSubmit') {
    return getReviewSummary(answers);
  }

  if (!step.key) return null;
  return answers[step.key] ?? '';
}

function StepRenderer({
  step,
  value,
  setValue,
  onGoBack,
  onNext,
  canProceed,
  saving,
  initializing,
  error,
  submitError,
  submitSuccess,
  applicationId,
  apiBaseUrl,
  onSubmit
}) {
  if (step.options) {
    return (
      <div className="mt-6 grid gap-2.5">
        {step.options.map((option) => {
          const selected = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setValue(option.value)}
              className={`h-11 rounded-none border px-4 text-left text-[14px] font-normal transition-all duration-150 ${
                selected
                  ? 'border-[#4e6bf0] bg-[#eef2ff] text-[#1f3aa0]'
                  : 'border-[#9aa4ae] bg-[#f4f5f5] text-[#475569] hover:border-[#4e6bf0] hover:bg-[#f3f6ff]'
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    );
  }

  if (step.type === 'select') {
    return (
      <div className="mt-6">
        <select
          value={value || ''}
          onChange={(event) => setValue(event.target.value)}
          className="h-11 w-full rounded-none border border-[#9aa4ae] bg-[#f4f5f5] px-4 text-[14px] text-[#475569] transition-all duration-150 focus:border-[#4e6bf0] focus:bg-[#f3f6ff] focus:outline-none"
        >
          <option value="">Select a state</option>
          {US_STATES.map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (step.type === 'input') {
    const inputPlaceholder = step.key === 'email' ? 'Enter Your Email Address' : 'Type your answer';
    return (
      <div className="mt-6">
        <input
          type={step.inputType || 'text'}
          value={value || ''}
          onChange={(event) => setValue(event.target.value)}
          className="h-11 w-full rounded-none border border-[#9aa4ae] bg-[#f4f5f5] px-4 text-[14px] text-[#475569] placeholder:text-[#8d96b6] transition-all duration-150 focus:border-[#4e6bf0] focus:bg-[#f3f6ff] focus:outline-none"
          placeholder={inputPlaceholder}
        />
      </div>
    );
  }

  if (step.type === 'name') {
    return (
      <div className="mt-6 grid gap-2.5">
        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
          <input
            type="text"
            value={value?.first_name || ''}
            onChange={(event) => setValue({ ...value, first_name: event.target.value })}
            className="h-11 w-full rounded-none border border-[#9aa4ae] bg-[#f4f5f5] px-4 text-[14px] text-[#475569] placeholder:text-[#8d96b6] transition-all duration-150 focus:border-[#4e6bf0] focus:bg-[#f3f6ff] focus:outline-none"
            placeholder="First Name"
          />
          <input
            type="text"
            value={value?.last_name || ''}
            onChange={(event) => setValue({ ...value, last_name: event.target.value })}
            className="h-11 w-full rounded-none border border-[#9aa4ae] bg-[#f4f5f5] px-4 text-[14px] text-[#475569] placeholder:text-[#8d96b6] transition-all duration-150 focus:border-[#4e6bf0] focus:bg-[#f3f6ff] focus:outline-none"
            placeholder="Last Name"
          />
        </div>
        <select
          value={value?.suffix || ''}
          onChange={(event) => setValue({ ...value, suffix: event.target.value })}
          className="h-11 w-full rounded-none border border-[#9aa4ae] bg-[#f4f5f5] px-4 text-[14px] text-[#475569] transition-all duration-150 focus:border-[#4e6bf0] focus:bg-[#f3f6ff] focus:outline-none"
        >
          <option value="">Suffix (Optional)</option>
          <option value="Sr">Sr</option>
          <option value="Jr">Jr</option>
          <option value="II">II</option>
          <option value="III">III</option>
          <option value="IV">IV</option>
          <option value="V">V</option>
        </select>
      </div>
    );
  }

  if (step.type === 'address') {
    return <AddressAutocompleteField value={value} setValue={setValue} />;
  }

  if (step.type === 'signingDate') {
    return (
      <SigningDateStep
        value={value}
        setValue={setValue}
        onGoBack={onGoBack}
      />
    );
  }

  if (step.type === 'eligibilityConfirm') {
    return (
      <EligibilityConfirmStep
        value={value}
        setValue={setValue}
      />
    );
  }

  if (step.type === 'borrowerDetails') {
    return (
      <BorrowerDetailsStep
        value={value}
        setValue={setValue}
        onNext={onNext}
        onGoBack={onGoBack}
        canProceed={canProceed}
        saving={saving}
        initializing={initializing}
        error={error}
        applicationId={applicationId}
        apiBaseUrl={apiBaseUrl}
      />
    );
  }

  if (step.type === 'reviewSubmit') {
    return (
      <ReviewSubmitStep
        summary={value}
        onGoBack={onGoBack}
        onSubmit={onSubmit}
        submitting={saving}
        submitError={submitError}
        submitSuccess={submitSuccess}
      />
    );
  }

  return null;
}

export default function FunnelStepPage() {
  const apiBaseUrl = getApiBaseUrl();
  const apiBaseCandidates = buildApiBaseCandidates(apiBaseUrl);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { answers, setAnswer, hydrateAnswers } = useFunnel();
  const { user } = useAuth();
  const [applicationId, setApplicationId] = useState(
    () => searchParams.get('applicationId') || getStoredApplicationId() || ''
  );
  const [initializing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [checkEmailSaved, setCheckEmailSaved] = useState(false);

  const fetchApi = async (path, options = {}) => {
    let lastError = null;

    for (const base of apiBaseCandidates) {
      try {
        return await fetch(`${base}${path}`, options);
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError || new Error('Failed to fetch');
  };

  const current = getStepByRoute(location.pathname);

  if (!current) {
    return <Navigate to={funnelConfig[funnelInitialStepId].route} replace />;
  }

  const { stepId, step } = current;
  const value = getStepValue(step, answers);
  const isEmailCapture = stepId === 'emailCapture';

  const canProceed = (() => {
    if (step.type === 'name') {
      const firstName = String(value?.first_name || '').trim();
      const lastName = String(value?.last_name || '').trim();
      return Boolean(firstName && lastName);
    }

    if (step.type === 'address') {
      return Boolean(String(value?.place_id || '').trim());
    }

    if (step.type === 'signingDate') {
      return validateSigningDate(value).valid;
    }

    if (step.type === 'borrowerDetails') {
      const hasIdentity = Boolean(
        String(value?.entity_name || '').trim()
        && String(value?.first_name || '').trim()
        && String(value?.last_name || '').trim()
      );
      const hasAddress = Boolean(
        String(value?.address?.address_line_1 || '').trim()
        && String(value?.address?.city || '').trim()
        && String(value?.address?.state || '').trim()
        && String(value?.address?.zip || '').trim()
      );
      return hasIdentity && hasAddress;
    }

    if (step.type === 'eligibilityConfirm') {
      return Boolean(value?.non_owner_occupied);
    }

    if (step.type === 'reviewSubmit') {
      return true;
    }

    if (!step.key) {
      return Boolean(step.next);
    }

    return Boolean(String(value || '').trim());
  })();

  useEffect(() => {
    let ignore = false;

    const syncExistingApplicationSession = async () => {
      const fromUrl = searchParams.get('applicationId');
      const fromStorage = getStoredApplicationId();
      const existingApplicationId = fromUrl || fromStorage;

      if (!existingApplicationId) {
        return;
      }

      if (ignore) return;
      setApplicationId(existingApplicationId);
      setStoredApplicationId(existingApplicationId);

      try {
        const applicationResponse = await fetchApi(`/applications/${existingApplicationId}`);
        if (applicationResponse.ok && !ignore) {
          const applicationPayload = await applicationResponse.json().catch(() => ({}));
          const applicationData = applicationPayload?.application_data;
          if (applicationData && typeof applicationData === 'object') {
            hydrateAnswers(applicationData);
          }
        }
      } catch (_syncError) {
        // Keep the page interactive even if hydration fails.
      }

      if (!fromUrl) {
        const nextParams = new URLSearchParams(searchParams);
        nextParams.set('applicationId', existingApplicationId);
        setSearchParams(nextParams, { replace: true });
      }
    };

    syncExistingApplicationSession();

    return () => {
      ignore = true;
    };
  }, [apiBaseUrl, hydrateAnswers, searchParams, setSearchParams]);

  const ensureApplicationSession = async () => {
    if (applicationId) {
      return applicationId;
    }

    const response = await fetchApi('/applications/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload?.error || 'Failed to start application.');
    }

    const newApplicationId = payload.application_id;
    if (!newApplicationId) {
      throw new Error('Server did not return application_id.');
    }

    setApplicationId(newApplicationId);
    setStoredApplicationId(newApplicationId);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('applicationId', newApplicationId);
    setSearchParams(nextParams, { replace: true });
    return newApplicationId;
  };

  useEffect(() => {
    if (stepId !== 'accountCreationFlow' && checkEmailSaved) {
      setCheckEmailSaved(false);
      return;
    }

    if (stepId !== 'accountCreationFlow' || !applicationId || checkEmailSaved) {
      return;
    }

    let ignore = false;
    const persistCheckEmailStep = async () => {
      try {
        const response = await fetchApi(`/applications/${applicationId}/save-step`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            step_key: stepId,
            data: { check_email_viewed: true }
          })
        });

        if (!response.ok || ignore) return;
        setCheckEmailSaved(true);
      } catch (_error) {
        // Keep flow resilient even if this persistence call fails.
      }
    };

    persistCheckEmailStep();

    return () => {
      ignore = true;
    };
  }, [apiBaseUrl, applicationId, checkEmailSaved, stepId]);

  const setStepValue = (nextValue) => {
    if (step.type === 'name') {
      const firstName = String(nextValue?.first_name || '');
      const lastName = String(nextValue?.last_name || '');
      const suffix = String(nextValue?.suffix || '');
      const fullName = `${firstName} ${lastName}`.trim();

      setAnswer('first_name', firstName);
      setAnswer('last_name', lastName);
      setAnswer('suffix', suffix);
      setAnswer('name', fullName);
      return;
    }

    if (step.type === 'address') {
      const hasSelectedSuggestion = Boolean(String(nextValue?.place_id || '').trim());
      const nextAddress = hasSelectedSuggestion
        ? normalizeAddressValue(nextValue)
        : {
            address_line_1: String(nextValue?.address_line_1 ?? ''),
            address_line_2: String(nextValue?.address_line_2 ?? ''),
            city: String(nextValue?.city ?? ''),
            state: String(nextValue?.state ?? ''),
            zip: String(nextValue?.zip ?? ''),
            full_address: String(nextValue?.full_address ?? ''),
            place_id: ''
          };

      setAnswer('address_line_1', nextAddress.address_line_1 || '');
      setAnswer('address_line_2', nextAddress.address_line_2 || '');
      setAnswer('city', nextAddress.city || '');
      setAnswer('state', nextAddress.state || '');
      setAnswer('zip', nextAddress.zip || '');
      setAnswer('full_address', nextAddress.full_address || '');
      setAnswer('place_id', nextAddress.place_id || '');
      setAnswer(getAddressFieldKey(step, 'address_line_1'), nextAddress.address_line_1 || '');
      setAnswer(getAddressFieldKey(step, 'address_line_2'), nextAddress.address_line_2 || '');
      setAnswer(getAddressFieldKey(step, 'city'), nextAddress.city || '');
      setAnswer(getAddressFieldKey(step, 'state'), nextAddress.state || '');
      setAnswer(getAddressFieldKey(step, 'zip'), nextAddress.zip || '');
      setAnswer(getAddressFieldKey(step, 'full_address'), nextAddress.full_address || '');
      setAnswer(getAddressFieldKey(step, 'place_id'), nextAddress.place_id || '');
      setAnswer('property_address', nextAddress.full_address || nextAddress.address_line_1 || '');
      return;
    }

    if (step.type === 'eligibilityConfirm') {
      setAnswer(step.key, {
        non_owner_occupied: Boolean(nextValue?.non_owner_occupied)
      });
      return;
    }

    if (step.type === 'borrowerDetails') {
      setAnswer(step.key, nextValue);
      setAnswer('entity_name', nextValue?.entity_name || '');
      setAnswer('first_name', nextValue?.first_name || '');
      setAnswer('last_name', nextValue?.last_name || '');
      setAnswer('date_of_birth', nextValue?.dob || '');
      setAnswer('address_line_1', nextValue?.address?.address_line_1 || '');
      setAnswer('address_line_2', nextValue?.address?.address_line_2 || '');
      setAnswer('city', nextValue?.address?.city || '');
      setAnswer('state', nextValue?.address?.state || '');
      setAnswer('zip', nextValue?.address?.zip || '');
      return;
    }

    if (!step.key) return;
    setAnswer(step.key, nextValue);
  };

  const getStepPayload = () => {
    if (step.type === 'name') {
      const firstName = String(value?.first_name || '').trim();
      const lastName = String(value?.last_name || '').trim();
      const suffix = String(value?.suffix || '').trim();
      return {
        first_name: firstName,
        last_name: lastName,
        suffix,
        name: `${firstName} ${lastName}`.trim()
      };
    }

    if (step.type === 'address') {
      const baseAddress = normalizeAddressValue({
        address_line_1: String(value?.address_line_1 || '').trim(),
        address_line_2: String(value?.address_line_2 || '').trim(),
        city: String(value?.city || '').trim(),
        state: String(value?.state || '').trim(),
        zip: String(value?.zip || '').trim(),
        full_address: String(value?.full_address || '').trim(),
        place_id: String(value?.place_id || '').trim()
      });

      if (!step.addressPrefix) {
        return baseAddress;
      }

      return {
        ...baseAddress,
        [getAddressFieldKey(step, 'address_line_1')]: baseAddress.address_line_1,
        [getAddressFieldKey(step, 'address_line_2')]: baseAddress.address_line_2,
        [getAddressFieldKey(step, 'city')]: baseAddress.city,
        [getAddressFieldKey(step, 'state')]: baseAddress.state,
        [getAddressFieldKey(step, 'zip')]: baseAddress.zip,
        [getAddressFieldKey(step, 'full_address')]: baseAddress.full_address,
        [getAddressFieldKey(step, 'place_id')]: baseAddress.place_id
      };
    }

    if (step.type === 'borrowerDetails') {
      return {
        entity_name: String(value?.entity_name || '').trim(),
        first_name: String(value?.first_name || '').trim(),
        last_name: String(value?.last_name || '').trim(),
        dob: String(value?.dob || '').trim(),
        address: {
          address_line_1: String(value?.address?.address_line_1 || '').trim(),
          address_line_2: String(value?.address?.address_line_2 || '').trim(),
          city: String(value?.address?.city || '').trim(),
          state: String(value?.address?.state || '').trim(),
          zip: String(value?.address?.zip || '').trim()
        },
        consents: {
          credit_pull: Boolean(value?.consents?.credit_pull),
          background_check: Boolean(value?.consents?.background_check)
        }
      };
    }

    if (!step.key) {
      return null;
    }

    return {
      [step.key]: value
    };
  };

  const handleNext = async () => {
    if (!canProceed) return;

    setError('');
    const nextRoute = getNextRoute(stepId, value, answers, {
      isAuthenticated: Boolean(user)
    });
    if (!nextRoute) return;

    if (applicationId) {
      navigate(`${nextRoute}?applicationId=${applicationId}`);
    } else {
      navigate(nextRoute);
    }

    void (async () => {
      try {
        const activeApplicationId = applicationId || await ensureApplicationSession();
        const payloadData = getStepPayload();
        const shouldSaveStep = Boolean(payloadData && activeApplicationId);

        if (isEmailCapture && typeof value === 'string') {
          setStoredFunnelEmail(value);
        }

        if (!shouldSaveStep) return;

        if (stepId === 'fullName' && user?.id) {
          await fetchApi(`/applications/${activeApplicationId}/attach-user`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              user_id: user.id
            })
          }).catch(() => null);
        }

        const requestBody = step.type === 'borrowerDetails'
          ? {
              step: 'borrower_details',
              data: payloadData
            }
          : {
              step_key: stepId,
              data: payloadData
            };

        const response = await fetchApi(`/applications/${activeApplicationId}/save-step`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          console.error('Save failed', payload?.error || 'Failed to save step.');
        }
      } catch (backgroundSaveError) {
        console.error('Save failed', backgroundSaveError);
      }
    })();
  };

  const handleOpenEmail = () => {
    window.open('https://mail.google.com', '_blank', 'noopener,noreferrer');
  };

  const handleSubmitForReview = async () => {
    if (!applicationId || saving) return;
    setSubmitError('');
    setSubmitSuccess(false);
    setSaving(true);

    try {
      const response = await fetchApi(`/applications/${applicationId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to submit application.');
      }

      setSubmitSuccess(true);
      setTimeout(() => {
        navigate('/dashboard?submitted=1', { replace: true });
      }, 700);
    } catch (submitFailure) {
      setSubmitError(submitFailure.message || 'Failed to submit application.');
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = async () => {
    if (!step.allowSkip) return;

    setError('');
    const nextRoute = getNextRoute(stepId, value, answers, {
      isAuthenticated: Boolean(user)
    });

    if (!nextRoute) return;

    if (applicationId) {
      navigate(`${nextRoute}?applicationId=${applicationId}`);
    } else {
      navigate(nextRoute);
    }

    void (async () => {
      try {
        const activeApplicationId = applicationId || await ensureApplicationSession();
        if (!activeApplicationId) return;

        const response = await fetchApi(`/applications/${activeApplicationId}/save-step`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            step_key: stepId,
            data: { skipped: true }
          })
        });
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          console.error('Save failed', payload?.error || 'Failed to save skipped step.');
        }
      } catch (backgroundSkipError) {
        console.error('Save failed', backgroundSkipError);
      }
    })();
  };

  const handleBack = () => {
    if (stepId === funnelInitialStepId) return;
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-[#f3f4f4] text-[#1f2937]">
      <FunnelHeader />

      <main className="grid min-h-[calc(100vh-64px-72px)] grid-cols-1 lg:grid-cols-12">
        <section className="px-5 py-10 lg:col-span-7 lg:px-16 xl:px-20">
          <button
            type="button"
            onClick={handleBack}
            disabled={stepId === funnelInitialStepId}
            className="mb-5 inline-flex items-center gap-1 rounded px-1 py-1 text-xs font-medium text-[#4e5c86] transition-all duration-150 hover:text-[#2f54eb] disabled:opacity-40"
          >
            <ChevronLeft size={16} /> Back
          </button>

          <div className={step.type === 'borrowerDetails' || step.type === 'reviewSubmit' ? 'max-w-[1120px]' : 'max-w-[520px]'}>
            {step.type !== 'borrowerDetails' && step.type !== 'reviewSubmit' ? (
              <>
                <h1 className="text-[48px] text-[clamp(32px,3.2vw,48px)] font-normal leading-[1.1] tracking-[-0.02em] text-[#1f2937]">{step.title || 'Continue'}</h1>
                {step.description ? <p className="mt-2 text-sm text-[#60709a]">{step.description}</p> : null}
              </>
            ) : null}
            {error ? <p className="mt-3 text-sm font-semibold text-[#b63d3d]">{error}</p> : null}

            <StepRenderer
              step={step}
              value={value}
              setValue={setStepValue}
              onGoBack={handleBack}
              onNext={handleNext}
              canProceed={canProceed}
              saving={saving}
              initializing={initializing}
              error={error}
              submitError={submitError}
              submitSuccess={submitSuccess}
              applicationId={applicationId}
              apiBaseUrl={apiBaseUrl}
              onSubmit={handleSubmitForReview}
            />

            {stepId === 'accountCreationFlow' ? (
              <button
                type="button"
                onClick={handleOpenEmail}
                className="mt-6 inline-flex h-10 min-w-[140px] items-center justify-center rounded bg-[#2f54eb] px-4 text-sm font-semibold text-white transition-all duration-150 hover:bg-[#2246d0]"
              >
                Open your email
              </button>
            ) : step.next && !step.inlineActions ? (
              <div className="mt-6 flex items-center gap-3">
                {step.allowSkip ? (
                  <button
                    type="button"
                    onClick={handleSkip}
                    className="inline-flex h-10 min-w-[88px] items-center justify-center rounded border border-[#9aa4ae] bg-white px-4 text-sm font-semibold text-[#475569] transition-all duration-150 hover:bg-[#f3f6ff] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Skip
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!canProceed}
                  className="inline-flex h-10 min-w-[88px] items-center justify-center rounded bg-[#2f54eb] px-4 text-sm font-semibold text-white transition-all duration-150 hover:bg-[#2246d0] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            ) : step.type === 'reviewSubmit' || step.type === 'borrowerDetails' ? null : (
              <div className="mt-6 max-w-[460px] rounded-md border border-[#cfd8ff] bg-[#eef2ff] p-3 text-center text-sm font-semibold text-[#1f3aa0]">
                Funnel complete
              </div>
            )}
          </div>
        </section>

        <aside className="relative hidden overflow-hidden border-l border-[#d6d9db] bg-white lg:col-span-5 lg:block">
          <div className="absolute inset-0 bg-[#f2f4f5]" />
          <div className="absolute left-[6%] top-0 h-full w-[130px] bg-[#4e6bf0]/85" />
          <div className="absolute left-[24%] top-0 h-full w-[80px] bg-[#f6f7f8]" />
          <div className="absolute right-[18%] top-0 h-full w-[130px] bg-[#4e6bf0]/85" />
          <div className="absolute right-0 top-0 h-full w-[120px] bg-[#cfd8e2]" />
          <div className="absolute left-[-10%] top-[14%] h-[180px] w-[320px] rotate-[38deg] bg-[#4e6bf0]/80" />
          <div className="absolute right-[-8%] top-[36%] h-[180px] w-[320px] rotate-[38deg] bg-[#4e6bf0]/80" />
          <div className="absolute left-[34%] top-[64%] h-[180px] w-[340px] rotate-[38deg] bg-[#ffffff]" />

          <div className="absolute left-[18%] top-[0%] h-[42%] w-[44%] overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=900&q=80"
              alt="investor"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="absolute left-[18%] top-[40%] h-[42%] w-[44%] overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80"
              alt="borrower"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="absolute right-[2%] top-[24%] h-[48%] w-[36%] overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=900&q=80"
              alt="property work"
              className="h-full w-full object-cover"
            />
          </div>
        </aside>
      </main>

      <footer className="border-t border-[#d9dddd] bg-[#f2f3f3] px-5 py-3 text-[11px] text-[#6b7280]">
        <p>Terms of Service | Privacy Policy | Disclosures</p>
      </footer>
    </div>
  );
}
