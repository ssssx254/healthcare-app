import { getWebTabBarScrollBottomPadding } from "@/constants/webTabBar";
import { isWeb } from "@/constants/webLayout";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform, ScrollView, StyleSheet, type ScrollViewProps } from "react-native";

function bottomPaddingFromStyle(flat: Record<string, unknown>): number {
  if (typeof flat.paddingBottom === "number") return flat.paddingBottom;
  if (typeof flat.padding === "number") return flat.padding;
  if (typeof flat.paddingVertical === "number") return flat.paddingVertical;
  return 0;
}

function mergeContentContainerStyle(
  contentContainerStyle: ScrollViewProps["contentContainerStyle"],
  insetBottom: number,
  includeTabBarClearance: boolean,
): ScrollViewProps["contentContainerStyle"] {
  const flat = StyleSheet.flatten(contentContainerStyle) as Record<string, unknown> | undefined;
  const baseBottom = bottomPaddingFromStyle(flat ?? {});
  const webTabClearance =
    isWeb && includeTabBarClearance ? getWebTabBarScrollBottomPadding(insetBottom) : 0;
  const nativeInset = Platform.OS === "web" ? 0 : insetBottom;
  return [
    { flexGrow: 1 as const },
    contentContainerStyle,
    { paddingBottom: baseBottom + nativeInset + webTabClearance + 8 },
  ];
}

type Props = ScrollViewProps & {
  /** false бол доод safe area padding нэмэхгүй (ховор тохиолдолд). */
  includeBottomInset?: boolean;
  /** Tab доторх web scroll — tab bar-ын ард нуугдахгүй. */
  includeTabBarClearance?: boolean;
};

/**
 * Талбартай дэлгэцүүдэд Android/iOS дээр гар, scroll, товч дарахад фокус алдах зэргийг бууруулна.
 * Expo Go-д нэмэлт native модуль шаарддаггүй.
 */
export function FormScrollView({
  keyboardShouldPersistTaps = "handled",
  keyboardDismissMode = "on-drag",
  contentContainerStyle,
  nestedScrollEnabled = Platform.OS === "android",
  includeBottomInset = true,
  includeTabBarClearance = false,
  ...rest
}: Props) {
  const { bottom } = useSafeAreaInsets();
  const merged = includeBottomInset
    ? mergeContentContainerStyle(contentContainerStyle, bottom, includeTabBarClearance)
    : [{ flexGrow: 1 as const }, contentContainerStyle];

  return (
    <ScrollView
      {...rest}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      keyboardDismissMode={keyboardDismissMode}
      nestedScrollEnabled={nestedScrollEnabled}
      contentContainerStyle={merged}
    />
  );
}

/** Tab доторх home/жагсаалт — web дээр tab bar-ын доор контент үлдэнэ. */
export function ScreenScrollView({ includeTabBarClearance = true, ...props }: Props) {
  return <FormScrollView includeTabBarClearance={includeTabBarClearance} {...props} />;
}
