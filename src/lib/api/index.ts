import 'server-only';
import { DATA_SOURCE } from '../config';
import type { SkyHavenApi } from './contract';
import { httpApi } from './http';
import { mockApi } from './mock';

export const api: SkyHavenApi = DATA_SOURCE === 'api' ? httpApi : mockApi;

export type { SkyHavenApi } from './contract';
export { ApiError, isApiError } from './errors';
