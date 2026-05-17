import {
  APP_MAX_WIDTH,
  WEB_HORIZONTAL_GUTTER,
  WEB_SHELL_BACKGROUND,
  WEB_SHELL_BACKGROUND_DARK,
  getWebBreakpoint,
  isWeb,
} from "@/constants/webLayout";
import { cn } from "@/utils/cn";
import { useMemo } from "react";
import {
  Platform,
  StyleSheet,
  useColorScheme,
  useWindowDimensions,
  View,
  type ViewProps,
} from "react-native";

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
  const colorScheme = useColorScheme();
  const { width: viewportWidth } = useWindowDimensions();

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
    const shellBg = colorScheme === "dark" ? WEB_SHELL_BACKGROUND_DARK : WEB_SHELL_BACKGROUND;
    const isDesktop = breakpoint === "desktop";

    return (
      <View
        style={[
          styles.shell,
          { backgroundColor: shellBg },
          isDesktop && styles.shellDesktop,
        ]}
      >
        <View
          style={[
            styles.column,
            { maxWidth: APP_MAX_WIDTH },
            isDesktop && styles.columnDesktop,
            padded && { paddingHorizontal: WEB_HORIZONTAL_GUTTER },
            style,
          ]}
          className={className}
          {...rest}
        >
          {children}
        </View>
      </View>
    );
  }

  return (
    <View
      className={cn("w-full flex-1", centerContent && "justify-center", className)}
      style={[
        styles.inner,
        { maxWidth: APP_MAX_WIDTH, alignSelf: "center" },
        padded && { paddingHorizontal: WEB_HORIZONTAL_GUTTER },
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
  shellDesktop: {
    paddingVertical: 24,
  },
  column: {
    flex: 1,
    width: "100%",
    alignSelf: "center",
    overflow: "hidden",
  },
  columnDesktop: Platform.select({
    web: {
      borderRadius: 20,
      overflow: "hidden",
      // RN Web box shadow
      boxShadow: "0 12px 40px rgba(15, 23, 42, 0.14)",
    },
    default: {},
  }) as object,
  inner: {
    width: "100%",
  },
  centered: {
    justifyContent: "center",
  },
});
