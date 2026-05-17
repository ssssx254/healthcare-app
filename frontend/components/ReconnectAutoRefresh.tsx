import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { usePathname, useRouter } from "expo-router";
import { useEffect, useRef } from "react";

export function ReconnectAutoRefresh() {
  const { reconnectTick } = useNetworkStatus();
  const pathname = usePathname();
  const router = useRouter();
  const lastTickRef = useRef(reconnectTick);

  useEffect(() => {
    if (reconnectTick <= lastTickRef.current) return;
    lastTickRef.current = reconnectTick;
    if (!pathname) return;
    // Холболт эргэж ирэхэд одоогийн дэлгэцийг дахин mount хийж GET өгөгдлийг шинэчилнэ.
    router.replace(pathname as never);
  }, [reconnectTick, pathname, router]);

  return null;
}
