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
): ScrollViewProps["contentContainerStyle"] {
  const flat = StyleSheet.flatten(contentContainerStyle) as Record<string, unknown> | undefined;
  const baseBottom = bottomPaddingFromStyle(flat ?? {});
  return [{ flexGrow: 1 as const }, contentContainerStyle, { paddingBottom: baseBottom + insetBottom + 8 }];
}

type Props = ScrollViewProps & {
  /** false бол доод safe area padding нэмэхгүй (ховор тохиолдолд). */
  includeBottomInset?: boolean;
};

/**
 * Талбартай дэлгэцүүдэд Android/iOS дээр гар, scroll, товч дарахад фокус алдах зэргийг бууруулна.
 * Доод safe area (жишээ нь Android нав бар)-ыг content-д нэмнэ.
 * Expo Go-д нэмэлт native модуль шаарддаггүй.
 */
export function FormScrollView({
  keyboardShouldPersistTaps = "handled",
  keyboardDismissMode = "on-drag",
  contentContainerStyle,
  nestedScrollEnabled = Platform.OS === "android",
  includeBottomInset = true,
  ...rest
}: Props) {
  const { bottom } = useSafeAreaInsets();
  const merged = includeBottomInset
    ? mergeContentContainerStyle(contentContainerStyle, bottom)
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

/**
 * Жагсаалт, танилцуулгын дэлгэцүүд — FormScrollView-тай ижил: гар, scroll, доод safe area.
 */
export function ScreenScrollView(props: Props) {
  return <FormScrollView {...props} />;
}
