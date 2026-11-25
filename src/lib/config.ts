import 'server-only';

/**
 * Where the web app gets its data.
 * - `mock`: an in-memory SkyHaven API with seeded sample data and a sandbox payment gateway. Default until the
 *   NestJS endpoints exist, so every flow can be built and demoed end to end.
 * - `api`: the real SkyHaven API at `API_URL`.
 */
export const DATA_SOURCE: 'mock' | 'api' = process.env.SKYHAVEN_DATA_SOURCE === 'api' ? 'api' : 'mock';

export const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

export const IS_SANDBOX = DATA_SOURCE === 'mock';

/** Developer shortcuts (demo sign-in, acting as reviewer). Only on `npm run dev` with test data; never in a build. */
export const DEV_TOOLS = IS_SANDBOX && process.env.NODE_ENV === 'development';

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
