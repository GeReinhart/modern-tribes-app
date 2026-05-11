const rawApiBaseUrl: string = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api';

export function getAPIBaseUrl() {

    const url = !rawApiBaseUrl.includes('localhost') && rawApiBaseUrl.startsWith('http://')
    ? rawApiBaseUrl.replace('http://', 'https://')
    : rawApiBaseUrl;

    console.log(`getAPIBaseUrl: ${url}`);

    return url;
}