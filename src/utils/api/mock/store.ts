import { buildInitialStore, STORE_VERSION, type Store } from "./fixtures";

const KEY = "sochamar:store";

let store: Store | null = null;

function inBrowser() {
  return typeof window !== "undefined";
}

function read(): Store | null {
  if (!inBrowser()) return null;

  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;

    const saved = JSON.parse(raw) as Store;
    if (saved.version !== STORE_VERSION) return null;

    return saved;
  } catch {
    return null;
  }
}

export function persist() {
  if (!inBrowser() || !store) return;

  try {
    window.localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
  }
}

export function getStore(): Store {
  if (store) return store;

  store = read() ?? buildInitialStore();
  persist();
  return store;
}

export function write<T>(change: (store: Store) => T): T {
  const current = getStore();
  const result = change(current);
  persist();
  return result;
}

export function newId(prefix: string) {
  const current = getStore();
  current.sequence += 1;
  return `${prefix}-${current.sequence}`;
}

export function resetStore() {
  store = buildInitialStore();
  persist();
  return store;
}

export function dumpStore() {
  return JSON.stringify(getStore(), null, 2);
}
