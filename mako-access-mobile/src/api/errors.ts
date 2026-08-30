/**
 * Turn an API failure into something worth showing a user.
 *
 * Axios exposes transport detail that must never reach the UI - the request
 * config carries the full backend URL, and its own messages ("Network Error",
 * "timeout of 10000ms exceeded") are meaningless to anyone but a developer.
 * Only a message the server deliberately sent is safe to surface verbatim.
 */
export const getApiErrorMessage = (error: any, fallback: string): string => {
  // The server answered and told us what was wrong.
  if (error?.response) {
    return error.response.data?.message || fallback;
  }

  // The request went out but nothing came back: offline, DNS, TLS, timeout.
  if (error?.request) {
    return 'Connection failed. Check your internet connection and try again.';
  }

  // Not an HTTP failure at all - e.g. a TTLock SDK error, whose message is
  // written for the person holding the phone and is worth showing.
  return error?.message || fallback;
};
