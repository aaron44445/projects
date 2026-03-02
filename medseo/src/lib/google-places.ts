export interface PlaceResult {
  name: string;
  address: string;
  phone?: string;
  website?: string;
  rating?: number;
  reviewCount?: number;
  placeId: string;
}

export async function searchMedSpas(
  city: string,
  state: string
): Promise<PlaceResult[]> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) throw new Error("Google Maps API key not configured");

  const query = encodeURIComponent(`med spa in ${city} ${state}`);
  const results: PlaceResult[] = [];
  let nextPageToken: string | undefined;

  // Fetch up to 3 pages (60 results max)
  for (let page = 0; page < 3; page++) {
    const url = nextPageToken
      ? `https://maps.googleapis.com/maps/api/place/textsearch/json?pagetoken=${nextPageToken}&key=${apiKey}`
      : `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      throw new Error(`Places API error: ${data.status}`);
    }

    for (const place of data.results || []) {
      results.push({
        name: place.name,
        address: place.formatted_address,
        rating: place.rating,
        reviewCount: place.user_ratings_total,
        placeId: place.place_id,
      });
    }

    nextPageToken = data.next_page_token;
    if (!nextPageToken) break;

    // Google requires a short delay between page token requests
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  // Get website and phone for each result via Place Details (limit to 20)
  const detailed = await Promise.all(
    results.slice(0, 20).map(async (place) => {
      try {
        const detailUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.placeId}&fields=website,formatted_phone_number&key=${apiKey}`;
        const res = await fetch(detailUrl);
        const detail = await res.json();
        return {
          ...place,
          website: detail.result?.website,
          phone: detail.result?.formatted_phone_number,
        };
      } catch {
        return place;
      }
    })
  );

  return detailed;
}
