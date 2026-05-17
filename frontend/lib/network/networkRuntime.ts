type NetworkSnapshot = {
  isOnline: boolean;
  reconnectTick: number;
  cacheServedAt: number | null;
};

let snapshot: NetworkSnapshot = {
  isOnline: true,
  reconnectTick: 0,
  cacheServedAt: null,
};

const listeners = new Set<(next: NetworkSnapshot) => void>();

function emit(): void {
  for (const listener of listeners) {
    listener(snapshot);
  }
}

export function subscribeNetworkSnapshot(listener: (next: NetworkSnapshot) => void): () => void {
  listeners.add(listener);
  listener(snapshot);
  return () => listeners.delete(listener);
}

export function getNetworkSnapshot(): NetworkSnapshot {
  return snapshot;
}

export function setOnlineState(nextOnline: boolean): void {
  const wasOnline = snapshot.isOnline;
  if (wasOnline === nextOnline) return;
  snapshot = {
    ...snapshot,
    isOnline: nextOnline,
    reconnectTick: !wasOnline && nextOnline ? snapshot.reconnectTick + 1 : snapshot.reconnectTick,
  };
  emit();
}

export function markServedFromCache(): void {
  snapshot = {
    ...snapshot,
    cacheServedAt: Date.now(),
  };
  emit();
}
