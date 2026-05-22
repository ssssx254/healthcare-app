import { emitReconnectRefresh } from "@/lib/network/reconnectRefresh";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useEffect, useRef } from "react";

/**
 * Сүлжээ сэргэхэд router.replace хийхгүй — таб/форм дэлгэц буцах асуудлыг зайлсхийж,
 * context listener-үүдээр л GET өгөгдөл шинэчилнэ.
 */
export function ReconnectAutoRefresh() {
  const { reconnectTick } = useNetworkStatus();
  const lastTickRef = useRef(reconnectTick);

  useEffect(() => {
    if (reconnectTick <= lastTickRef.current) return;
    lastTickRef.current = reconnectTick;
    emitReconnectRefresh();
  }, [reconnectTick]);

  return null;
}
