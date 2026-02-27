import { getToken } from "@auth/core/jwt";

/**
 * Read the auth JWT from the request cookies.
 *
 * In Anything, the app may run on http (dev) or https (published). Auth.js uses
 * different cookie names depending on whether cookies are "secure".
 *
 * To avoid env/config mismatches (e.g. AUTH_URL is https but dev server is http),
 * we attempt both secure and non-secure cookie variants.
 */
export default async function getJwt(request) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    return null;
  }

  // Try secure cookie variant first (production), then non-secure (dev/local).
  const jwtSecure = await getToken({
    req: request,
    secret,
    secureCookie: true,
  });
  if (jwtSecure) {
    return jwtSecure;
  }

  const jwtInsecure = await getToken({
    req: request,
    secret,
    secureCookie: false,
  });

  return jwtInsecure || null;
}
