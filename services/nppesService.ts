import { Ophthalmologist } from '../types';

// The URL of your deployed Cloud Function.
const PROXY_URL = 'https://us-central1-virtual-vision-test-app.cloudfunctions.net/getNearbyOphthalmologistsProxy';

/**
 * Fetches a list of nearby ophthalmologists by calling a secure backend proxy function.
 * The backend now handles all data processing and cleaning.
 * @param stateCode The 2-letter state code (e.g., "NY").
 * @param cityName The optional city name.
 * @param limit The maximum number of results to return.
 * @returns A promise that resolves to an array of Ophthalmologist objects.
 */
export const getNearbyOphthalmologists = async (
  stateCode: string,
  cityName?: string,
  limit: number = 10
): Promise<Ophthalmologist[]> => {
  try {
    // Construct the URL with query parameters for a GET request.
    const params = new URLSearchParams({
      stateCode,
      limit: limit.toString(),
    });
    if (cityName) {
      params.append('cityName', cityName);
    }
    
    const urlWithParams = `${PROXY_URL}?${params.toString()}`;

    const response = await fetch(urlWithParams, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response from proxy.' }));
        console.error(`Error from proxy function: ${response.status}`, errorData);
        return [];
    }

    const data = await response.json();
    
    // The backend now does the processing. We just need to access the clean result.
    return data.ophthalmologists || [];
    
  } catch (err) {
    console.error("Client-side error calling getNearbyOphthalmologistsProxy:", err);
    return [];
  }
};