import { APP_MAX_WIDTH, isWeb } from "@/constants/webLayout";
import { useWebLayoutMode } from "@/hooks/useWebViewportWidth";
import { cn } from "@/utils/cn";
import type { PropsWithChildren } from "react";
import { Platform, StyleSheet, View } from "react-native";

/**
 * Web desktop (>768px): бүх дэлгэцийг splash шиг төвлөрсөн 480px баганад.
 * Утасны browser (≤768px): бүтэн өргөн.
 * Native: өөрчлөлтгүй.
 */
export function WebScreenFrame({ children }: PropsWithChildren) {
  if (!isWeb) {
    return <>{children}</>;
  }

  const { desktopPreview } = useWebLayoutMode();

  return (
    <View
      className={cn(
        "web-screen-frame flex-1",
        desktopPreview ? "web-screen-frame--preview" : "web-screen-frame--mobile",
      )}
      style={[
        styles.frame,
        desktopPreview ? styles.framePreview : styles.frameMobile,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    flex: 1,
  },
  framePreview: {
    width: APP_MAX_WIDTH,
    maxWidth: APP_MAX_WIDTH,
    alignSelf: "center",
    overflow: "visible",
    ...Platform.select({
      web: { minHeight: "100%" as unknown as number },
      default: {},
    }),
  },
  frameMobile: {
    width: "100%",
    maxWidth: "100%",
    alignSelf: "stretch",
  },
});
