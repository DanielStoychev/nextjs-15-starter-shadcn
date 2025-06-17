import "server-only";

const SPORTMONKS_BASE_URL = "https://api.sportmonks.com/v3/football";
const SPORTMONKS_API_TOKEN = process.env.SPORTMONKS_API_TOKEN;

if (!SPORTMONKS_API_TOKEN) {
  throw new Error("SPORTMONKS_API_TOKEN is not set in environment variables.");
}

interface SportMonksApiResponse<T> {
  data: T;
  pagination?: {
    count: number;
    per_page: number;
    current_page: number;
    next_page?: string;
    has_more: boolean;
  };
  // Add other common SportMonks response properties like 'rate_limit', 'subscription', 'timezone' if needed
}

/**
 * Makes an authenticated request to the SportMonks API.
 * @param endpoint The API endpoint (e.g., "/leagues", "/seasons/{id}/fixtures").
 * @param params Optional query parameters.
 * @returns The API response data.
 */
export async function fetchSportMonksData<T>(
  endpoint: string,
  params?: Record<string, string | number | boolean>
): Promise<SportMonksApiResponse<T>> {
  const url = new URL(`${SPORTMONKS_BASE_URL}${endpoint}`);
  url.searchParams.append("api_token", SPORTMONKS_API_TOKEN as string);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, String(value));
    });
  }

  try {
    const response = await fetch(url.toString(), {
      next: { revalidate: 3600 }, // Cache data for 1 hour (adjust as needed)
    });

    if (!response.ok) {
      const errorBody = await response.json();
      console.error(`SportMonks API Error (${response.status}):`, errorBody);
      throw new Error(
        `Failed to fetch data from SportMonks API: ${response.statusText} - ${JSON.stringify(errorBody)}`
      );
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching SportMonks data:", error);
    throw error;
  }
}

// Example usage (can be removed later)
// async function getLeagues() {
//   try {
//     const response = await fetchSportMonksData<{ id: number; name: string }[]>("/leagues");
//     console.log("Leagues:", response.data);
//     return response.data;
//   } catch (error) {
//     console.error("Failed to get leagues:", error);
//     return [];
//   }
// }
