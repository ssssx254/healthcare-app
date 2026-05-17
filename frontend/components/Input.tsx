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
  ...rest
}: InputProps) {
  const alignVertical =
    textAlignVertical ?? (multiline ? "top" : Platform.OS === "android" ? "center" : undefined);
  const multilineScroll = multiline ? (scrollEnabled ?? true) : scrollEnabled;

  return (
    <View className="mb-4 w-full max-w-full">
      <Text className="mb-1.5 text-sm font-semibold text-slate-800 dark:text-slate-100">{label}</Text>
      <TextInput
        placeholderTextColor="#64748b"
        underlineColorAndroid="transparent"
        multiline={multiline}
        scrollEnabled={multilineScroll}
        secureTextEntry={secureTextEntry}
        textAlignVertical={alignVertical}
        autoComplete={autoComplete ?? (secureTextEntry ? "password" : undefined)}
        importantForAutofill={importantForAutofill ?? (secureTextEntry ? "yes" : undefined)}
        className={cn(
          "rounded-2xl border bg-white px-3.5 py-3.5 text-base leading-6 text-slate-900 dark:bg-slate-900 dark:text-slate-50",
          multiline ? "min-h-[120px] max-h-[220px]" : "",
          error
            ? "border-2 border-red-500"
            : appearance === "prominent"
              ? "border-2 border-slate-300 shadow-sm dark:border-slate-500"
              : "border border-slate-300 dark:border-slate-600",
          className,
        )}
        {...rest}
      />
      {hint && !error ? (
        <Text className="mt-1.5 text-xs leading-4 text-slate-500 dark:text-slate-400">{hint}</Text>
      ) : null}
      {error ? (
        <Text className="mt-1.5 text-xs leading-4 text-red-600 dark:text-red-400">{error}</Text>
      ) : null}
    </View>
  );
}
