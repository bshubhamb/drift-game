const LOCAL_BACKEND_URL = "http://127.0.0.1:3001";

export function apiUrl(path: string) {
  const configuredUrl = process.env.NEXT_PUBLIC_DRIFT_API_URL;

  if (configuredUrl) {
    return `${configuredUrl.replace(/\/$/, "")}${path}`;
  }

  if (typeof window !== "undefined") {
    const isLocalhost = window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost";

    if (isLocalhost && window.location.port === "3000") {
      return `${LOCAL_BACKEND_URL}${path}`;
    }
  }

  return path;
}
