// If NEXT_PUBLIC_API_URL is explicitly set (e.g. to a remote backend), use it.
// Otherwise default to empty string so requests are relative (/api/...) and work seamlessly on Vercel and local dev.
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL
    : "";

export function apiUrl(endpoint: string): string {
  const clean = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return API_BASE_URL ? `${API_BASE_URL}${clean}` : clean;
}
