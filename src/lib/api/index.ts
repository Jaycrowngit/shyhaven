import 'server-only';
import { LISTINGS_SOURCE } from '../config';
import type { SkyHavenApi } from './contract';
import { httpApi } from './http';
import { mockApi } from './mock';

/**
 * Accounts and every signed-in call go to the real API. Only the public listing reads come from the sample homes,
 * until those endpoints are live (`SKYHAVEN_LISTINGS_SOURCE=api`).
 */
const listings: Pick<SkyHavenApi, 'searchListings' | 'getListing' | 'inspectionSlots' | 'cities'> =
  LISTINGS_SOURCE === 'api'
    ? httpApi
    : {
        searchListings: (params) => mockApi.searchListings(params),
        getListing: (slug) => mockApi.getListing(slug),
        inspectionSlots: (listingId) => mockApi.inspectionSlots(listingId),
        cities: () => mockApi.cities(),
      };

export const api: SkyHavenApi = {
  ...httpApi,
  searchListings: listings.searchListings,
  getListing: listings.getListing,
  inspectionSlots: listings.inspectionSlots,
  cities: listings.cities,
};

export type { SkyHavenApi } from './contract';
export { ApiError, isApiError } from './errors';
