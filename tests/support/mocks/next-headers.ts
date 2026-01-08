export function headers(): Headers {
  return new Headers();
}

export function cookies() {
  const store = new Map<string, string>();
  return {
    get: (name: string) => (store.has(name) ? { name, value: store.get(name)! } : undefined),
    set: (name: string, value: string) => { store.set(name, value); },
    delete: (name: string) => { store.delete(name); },
    getAll: () => Array.from(store.entries()).map(([name, value]) => ({ name, value })),
  };
}

export function draftMode() {
  return {
    isEnabled: false,
    enable: () => {},
    disable: () => {},
  };
}



