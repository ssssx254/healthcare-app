/** Сүлжээ сэргэхэд дэлгэц солихгүйгээр өгөгдөл шинэчлэх listener-үүд. */
const listeners = new Set<() => void>();

export function subscribeReconnectRefresh(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function emitReconnectRefresh(): void {
  for (const listener of listeners) {
    try {
      listener();
    } catch {
      /* listener алдааг тусад нь зохицуулна */
    }
  }
}
