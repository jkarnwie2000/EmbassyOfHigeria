// The __Host- prefix forces Secure, Path=/ and no Domain attribute (production only,
// because browsers reject __Host- cookies over plain http://localhost).
export const SESSION_COOKIE =
  process.env.NODE_ENV === 'production' ? '__Host-embassy_session' : 'embassy_session';
