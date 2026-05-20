import { isWeb, isWebMobileFullscreen } from "@/constants/webLayout";
import { useEffect, useState } from "react";
import { Platform, useWindowDimensions } from "react-native";

/**
 * Web: browser viewport өргөн (resize-д шинэчлэгдэнэ).
 * Native: useWindowDimensions (Expo Go өөрчлөгдөхгүй).
 */
export function useWebViewportWidth(): number {
  const { width: rnWidth } = useWindowDimensions();
  const [webWidth, setWebWidth] = useState(() => readBrowserWidth(rnWidth));

  useEffect(() => {
    if (!isWeb || typeof window === "undefined") return;

    const update = () => setWebWidth(window.innerWidth);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return isWeb ? webWidth : rnWidth;
}

function readBrowserWidth(fallback: number): number {
  if (typeof window !== "undefined" && window.innerWidth > 0) {
    return window.innerWidth;
  }
  return fallback;
}

export function useWebLayoutMode() {
  const viewportWidth = useWebViewportWidth();
  const mobileFullscreen = isWeb && isWebMobileFullscreen(viewportWidth);
  const desktopPreview = isWeb && !mobileFullscreen;
  return { viewportWidth, mobileFullscreen, desktopPreview };
}
