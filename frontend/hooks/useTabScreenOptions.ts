import { useAppTheme } from "@/components/ThemeProvider";
import { tabScreenOptions } from "@/constants/navigationTheme";
import { useWebViewportWidth } from "@/hooks/useWebViewportWidth";
import { isWebMobileFullscreen, isWeb } from "@/constants/webLayout";
import { useMemo } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function useTabScreenOptions() {
  const { resolvedScheme } = useAppTheme();
  const width = useWebViewportWidth();
  const { bottom } = useSafeAreaInsets();

  return useMemo(
    () =>
      tabScreenOptions(resolvedScheme, {
        webMobileLayout: isWeb && isWebMobileFullscreen(width),
        safeAreaBottom: bottom,
      }),
    [resolvedScheme, width, bottom],
  );
}
