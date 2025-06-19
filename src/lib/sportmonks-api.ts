import { env } from 'process';

const SPORTMONKS_API_BASE_URL = 'https://api.sportmonks.com/v3/football';
const SPORTMONKS_API_TOKEN = env.SPORTMONKS_API_TOKEN;

console.log('SPORTMONKS_API_TOKEN:', SPORTMONKS_API_TOKEN ? 'Set' : 'Not Set');

if (!SPORTMONKS_API_TOKEN) {
    throw new Error('SPORTMONKS_API_TOKEN is not set in environment variables.');
}

interface SportMonksApiResponse<T> {
    data: T | T[] | null; // Data can be a single object, an array, or null
    message?: string; // Add message for no results/errors
    pagination?: {
        count: number;
        per_page: number;
        current_page: number;
        next_page: string | null;
        has_more: boolean;
    };
    subscription?: any; // Add subscription info
    rate_limit?: any; // Add rate limit info
    timezone?: string; // Add timezone info
}

async function fetchSportMonks<T>(
    endpoint: string,
    params: Record<string, any> = {}
): Promise<SportMonksApiResponse<T>> {
    const url = new URL(`${SPORTMONKS_API_BASE_URL}${endpoint}`);
    url.searchParams.append('api_token', SPORTMONKS_API_TOKEN as string);

    for (const key in params) {
        if (params[key] !== undefined) {
            url.searchParams.append(key, String(params[key]));
        }
    }
    console.log('[SportMonks API] Fetching URL:', url.toString()); // Added log

    try {
        const response = await fetch(url.toString());
        const responseData: SportMonksApiResponse<T> = await response.json(); // Always parse JSON

        console.log('SportMonks API Raw Response Data:', responseData); // Log the raw response data

        if (!response.ok) {
            console.error(`SportMonks API Error: ${response.status} ${response.statusText}`, responseData);
            throw new Error(`SportMonks API Error: ${response.status} - ${responseData.message || 'Unknown error'}`);
        }

        // If data is null or undefined, return an empty array for consistency when expecting lists
        if (responseData.data === null || responseData.data === undefined) {
            return { ...responseData, data: [] as T[] };
        }

        return responseData;
    } catch (error) {
        console.error('Failed to fetch from SportMonks API:', error);
        throw error;
    }
}

// Example API functions (will be expanded as needed)

// Leagues
export const getLeagueDetails = async (leagueId: number, include?: string): Promise<any> => {
    return fetchSportMonks(`/leagues/${leagueId}`, { include });
};

export const getLeaguesByCountry = async (countryId: number, include?: string): Promise<any> => {
    return fetchSportMonks(`/leagues/countries/${countryId}`, { include });
};

// Seasons
export const getSeasonRounds = async (seasonId: number, include?: string): Promise<any> => {
    // Corrected endpoint based on user-provided documentation
    return fetchSportMonks(`/rounds/seasons/${seasonId}`, { include });
};

// Fetches teams for a specific season using the /teams endpoint with a season_id filter.
// Supports basic pagination parameters.
export const getSeasonTeams = async (
    seasonId: number,
    leagueId?: number, // Added leagueId parameter
    include?: string,
    page?: number,
    per_page?: number
): Promise<any> => {
    const directParams: Record<string, any> = {
        season_id: seasonId,
        include,
        page,
        per_page
    };
    if (leagueId !== undefined) {
        directParams.league_id = leagueId; // Add league_id to params if provided
    }
    // Note: The extensive comments about filter strategy can be removed or condensed later
    // if this direct parameter approach works consistently.

    return fetchSportMonks(`/teams`, directParams);
};

export const getSeasonDetails = async (seasonId: number, include?: string): Promise<any> => {
    return fetchSportMonks(`/seasons/${seasonId}`, { include });
};

// Rounds
export const getRoundFixtures = async (roundId: number): Promise<any> => {
    // Fetches a specific round by its ID and includes its fixtures.
    // Further details like participants and scores for these fixtures will be fetched separately.
    const includeParams = 'fixtures';
    console.log(`getRoundFixtures: Fetching round ${roundId} with include: ${includeParams}`);

    return fetchSportMonks(`/rounds/${roundId}`, { include: includeParams });
};

// Fixtures
export const getFixturesDetailsByIds = async (fixtureIdsCommaSeparated: string, include?: string): Promise<any> => {
    console.log(`getFixturesDetailsByIds: Fetching fixtures ${fixtureIdsCommaSeparated} with include: ${include}`);

    return fetchSportMonks(`/fixtures/multi/${fixtureIdsCommaSeparated}`, { include });
};

export const getFixturesByDateRange = async (
    startDate: string,
    endDate: string,
    params: { team_id?: number; leagues?: string; include?: string } = {}
): Promise<any> => {
    return fetchSportMonks(`/fixtures/between/${startDate}/${endDate}`, params);
};

// Teams
export const getTeamDetails = async (teamId: number, include?: string): Promise<any> => {
    return fetchSportMonks(`/teams/${teamId}`, { include });
};

// Search team by name
export const searchTeamByName = async (name: string, include?: string): Promise<any> => {
    // URL encode the search query to handle spaces and special characters
    const encodedName = encodeURIComponent(name);

    return fetchSportMonks(`/teams/search/${encodedName}`, { include });
};

// Standings
export const getSeasonStandings = async (seasonId: number, include?: string): Promise<any> => {
    return fetchSportMonks(`/standings/season/${seasonId}`, { include });
};

// Statistics
export const getSeasonStatistics = async (seasonId: number, include?: string): Promise<any> => {
    return fetchSportMonks(`/statistics/seasons/${seasonId}`, { include });
};
