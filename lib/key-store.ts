const STORAGE_KEY = 'speed-arena-keys';

function getStore(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function getApiKey(providerId: string): string | null {
  return getStore()[providerId] || null;
}

export function setApiKey(providerId: string, key: string): void {
  const store = getStore();
  store[providerId] = key;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function removeApiKey(providerId: string): void {
  const store = getStore();
  delete store[providerId];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function getAllConfiguredProviders(): string[] {
  return Object.keys(getStore());
}
