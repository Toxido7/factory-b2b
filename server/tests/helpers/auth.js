// Finds the refresh cookie in a response's Set-Cookie headers
export const getRefreshCookie = (res) =>
  (res.headers['set-cookie'] ?? []).find((c) => c.startsWith('refresh_token='));

// "refresh_token=abc; Path=...; HttpOnly"  →  "refresh_token=abc"  (what a browser sends back)
export const getCookiePair = (setCookie) => setCookie.split(';')[0];

// "refresh_token=abc"  →  "abc"
export const getCookieValue = (setCookie) => getCookiePair(setCookie).split('=')[1];
