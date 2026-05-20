import { useAppTheme } from "@/components/ThemeProvider";
import {
  APP_MAX_WIDTH,
  WEB_HORIZONTAL_GUTTER,
  getWebBreakpoint,
  isWeb,
} from "@/constants/webLayout";
import { useWebLayoutMode } from "@/hooks/useWebViewportWidth";
import { cn } from "@/utils/cn";
import { useMemo } from "react";
import { Platform, StyleSheet, View, type ViewProps } from "react-native";

export type AppContainerProps = ViewProps & {
  /**
   * Root web shell: full-viewport backdrop + centered app column.
   * Use once in `app/_layout.tsx`. Native: passthrough only.
   */
  shell?: boolean;
  /** Vertically center children on web (splash, login, register). */
  centerContent?: boolean;
  /** Extra horizontal padding inside the column on web. */
  padded?: boolean;
};

export function AppContainer({
  children,
  shell = false,
  centerContent = false,
  padded = false,
  className,
  style,
  ...rest
}: AppContainerProps) {
  const { palette } = useAppTheme();
  const { viewportWidth, mobileFullscreen, desktopPreview } = useWebLayoutMode();

  const breakpoint = useMemo(
    () => (isWeb ? getWebBreakpoint(viewportWidth) : "mobile"),
    [viewportWidth],
  );

  if (!isWeb) {
    return (
      <View className={cn("flex-1", className)} style={style} {...rest}>
        {children}
      </View>
    );
  }

  if (shell) {
    const shellBg = palette.background;
    const isDesktop = breakpoint === "desktop";

    return (
      <View
        className={cn(
          "web-app-shell",
          mobileFullscreen ? "web-app-shell--mobile" : "web-app-shell--preview",
        )}
        style={[
          styles.shell,
          mobileFullscreen ? styles.shellMobile : { backgroundColor: shellBg },
          desktopPreview && isDesktop && styles.shellDesktop,
        ]}
      >
        <View
          className={cn(
            "web-app-column",
            mobileFullscreen ? "web-app-column--mobile" : "web-app-column--preview",
            desktopPreview && isDesktop && "web-app-column--desktop",
            className,
          )}
          style={[
            styles.column,
            mobileFullscreen ? styles.columnMobile : styles.columnPreview,
            desktopPreview && isDesktop && styles.columnDesktop,
            desktopPreview && padded && { paddingHorizontal: WEB_HORIZONTAL_GUTTER },
            style,
          ]}
          {...rest}
        >
          {children}
        </View>
      </View>
    );
  }

  return (
    <View
      className={cn(
        "w-full flex-1 web-app-inner",
        mobileFullscreen ? "web-app-inner--mobile" : "web-app-inner--preview",
        centerContent && "justify-center",
        className,
      )}
      style={[
        styles.inner,
        mobileFullscreen ? styles.innerMobile : styles.innerPreview,
        centerContent && styles.centered,
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    ...Platform.select({
      web: { minHeight: "100vh" as unknown as number },
      default: {},
    }),
  },
  shellMobile: {
    alignItems: "stretch",
    backgroundColor: "transparent",
  },
  shellDesktop: {
    paddingVertical: 24,
  },
  column: {
    flex: 1,
    alignSelf: "center",
  },
  columnPreview: {
    width: APP_MAX_WIDTH,
    maxWidth: APP_MAX_WIDTH,
    overflow: "visible",
  },
  columnMobile: {
    width: "100%",
    maxWidth: "100%",
    alignSelf: "stretch",
    overflow: "visible",
    ...Platform.select({
      web: { minHeight: "100vh" as unknown as number },
      default: {},
    }),
  },
  columnDesktop: Platform.select({
    web: {
      borderRadius: 20,
      overflow: "visible",
      boxShadow: "0 12px 40px rgba(15, 23, 42, 0.14)",
      paddingBottom: 4,
    },
    default: {},
  }) as object,
  inner: {
    width: "100%",
  },
  innerPreview: {
    width: APP_MAX_WIDTH,
    maxWidth: APP_MAX_WIDTH,
    alignSelf: "center",
  },
  innerMobile: {
    width: "100%",
    maxWidth: "100%",
    alignSelf: "stretch",
    ...Platform.select({
      web: { minHeight: "100vh" as unknown as number },
      default: {},
    }),
  },
  centered: {
    justifyContent: "center",
  },
});
