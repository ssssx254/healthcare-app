import { useAppTheme } from "@/components/ThemeProvider";
import { cn } from "@/utils/cn";
import { Platform, Text, TextInput, View, type TextInputProps } from "react-native";

export type InputProps = TextInputProps & {
  label: string;
  hint?: string;
  error?: string;
  /** Нэвтрэх / бүртгэл зэрэгт илүү тод хүрээ, сүүдэр. */
  appearance?: "default" | "prominent";
};

export function Input({
  label,
  hint,
  error,
  appearance = "default",
  className,
  multiline,
  secureTextEntry,
  textAlignVertical,
  autoComplete,
  importantForAutofill,
  scrollEnabled,
  style,
  ...rest
}: InputProps) {
  const { palette } = useAppTheme();
  const alignVertical =
    textAlignVertical ?? (multiline ? "top" : Platform.OS === "android" ? "center" : undefined);
  const multilineScroll = multiline ? (scrollEnabled ?? true) : scrollEnabled;

  return (
    <View className="mb-4 w-full max-w-full">
      <Text className="mb-1.5 text-sm font-semibold text-app-text">{label}</Text>
      <TextInput
        placeholderTextColor={palette.textMuted}
        underlineColorAndroid="transparent"
        style={[{ color: palette.text }, style]}
        multiline={multiline}
        scrollEnabled={multilineScroll}
        secureTextEntry={secureTextEntry}
        textAlignVertical={alignVertical}
        autoComplete={autoComplete ?? (secureTextEntry ? "password" : undefined)}
        importantForAutofill={importantForAutofill ?? (secureTextEntry ? "yes" : undefined)}
        className={cn(
          "rounded-2xl border bg-app-card px-3.5 py-3.5 text-base leading-6 text-app-text",
          multiline ? "min-h-[120px] max-h-[220px]" : "",
          error
            ? "border-2 border-red-500"
            : appearance === "prominent"
              ? "border-2 border-app-border-strong shadow-sm"
              : "border border-app-border-strong",
          className,
        )}
        {...rest}
      />
      {hint && !error ? (
        <Text className="mt-1.5 text-xs leading-4 text-app-text-muted">{hint}</Text>
      ) : null}
      {error ? (
        <Text className="mt-1.5 text-xs leading-4 text-red-600 dark:text-red-400">{error}</Text>
      ) : null}
    </View>
  );
}
