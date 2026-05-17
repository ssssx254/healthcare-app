import { getNetworkSnapshot, setOnlineState, subscribeNetworkSnapshot } from "@/lib/network/networkRuntime";
import NetInfo from "@react-native-community/netinfo";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type NetworkContextValue = {
  isOnline: boolean;
  reconnectTick: number;
  cacheServedAt: number | null;
};

const NetworkContext = createContext<NetworkContextValue | null>(null);

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [value, setValue] = useState<NetworkContextValue>(() => getNetworkSnapshot());

  useEffect(() => {
    const unsubRuntime = subscribeNetworkSnapshot((next) => setValue(next));
    void NetInfo.fetch().then((state) => {
      const online = Boolean(state.isConnected) && state.isInternetReachable !== false;
      setOnlineState(online);
    });
    const unsubNetInfo = NetInfo.addEventListener((state) => {
      const online = Boolean(state.isConnected) && state.isInternetReachable !== false;
      setOnlineState(online);
    });
    return () => {
      unsubRuntime();
      unsubNetInfo();
    };
  }, []);

  const memo = useMemo(() => value, [value]);
  return <NetworkContext.Provider value={memo}>{children}</NetworkContext.Provider>;
}

export function useNetworkStatus(): NetworkContextValue {
  const ctx = useContext(NetworkContext);
  if (!ctx) throw new Error("useNetworkStatus must be used inside NetworkProvider.");
  return ctx;
}
