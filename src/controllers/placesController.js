const GOOGLE_PLACES_BASE_URL = 'https://maps.googleapis.com/maps/api/place';

function getGooglePlacesApiKey() {
  return (
    process.env.GOOGLE_MAPS_API_KEY
    || process.env.GOOGLE_PLACES_API_KEY
    || process.env.VITE_GOOGLE_MAPS_API_KEY
    || ''
  );
}

async function autocomplete(req, res, next) {
  try {
    const apiKey = getGooglePlacesApiKey();
    if (!apiKey) {
      return res.status(500).json({ error: 'Server missing GOOGLE_MAPS_API_KEY.' });
    }

    const input = String(req.query.input || '').trim();
    if (input.length < 3) {
      return res.status(200).json({ predictions: [] });
    }

    const url = `${GOOGLE_PLACES_BASE_URL}/autocomplete/json?input=${encodeURIComponent(input)}&types=address&components=country:us&key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(url);
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      return res.status(response.status).json({ error: payload?.error_message || 'Failed to fetch address suggestions.' });
    }

    const predictions = Array.isArray(payload?.predictions)
      ? payload.predictions.map((item) => ({
          place_id: item.place_id,
          description: item.description,
          main_text: item?.structured_formatting?.main_text || ''
        }))
      : [];

    return res.status(200).json({ predictions });
  } catch (error) {
    next(error);
  }
}

function pickAddressComponent(components, type) {
  return components.find((component) => Array.isArray(component.types) && component.types.includes(type));
}

async function details(req, res, next) {
  try {
    const apiKey = getGooglePlacesApiKey();
    if (!apiKey) {
      return res.status(500).json({ error: 'Server missing GOOGLE_MAPS_API_KEY.' });
    }

    const placeId = String(req.query.place_id || '').trim();
    if (!placeId) {
      return res.status(400).json({ error: 'place_id is required.' });
    }

    const fields = 'address_component,formatted_address,place_id';
    const url = `${GOOGLE_PLACES_BASE_URL}/details/json?place_id=${encodeURIComponent(placeId)}&fields=${encodeURIComponent(fields)}&key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(url);
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      return res.status(response.status).json({ error: payload?.error_message || 'Failed to fetch address details.' });
    }

    const result = payload?.result || {};
    const components = Array.isArray(result.address_components) ? result.address_components : [];

    const streetNumber = pickAddressComponent(components, 'street_number')?.long_name || '';
    const route = pickAddressComponent(components, 'route')?.long_name || '';
    const city =
      pickAddressComponent(components, 'locality')?.long_name
      || pickAddressComponent(components, 'postal_town')?.long_name
      || pickAddressComponent(components, 'sublocality')?.long_name
      || '';
    const state = pickAddressComponent(components, 'administrative_area_level_1')?.short_name || '';
    const zip = pickAddressComponent(components, 'postal_code')?.long_name || '';
    const addressLine1 = [streetNumber, route].filter(Boolean).join(' ').trim();

    return res.status(200).json({
      data: {
        address_line_1: addressLine1,
        address_line_2: '',
        city,
        state,
        zip,
        full_address: result.formatted_address || addressLine1,
        place_id: result.place_id || placeId
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  autocomplete,
  details
};
