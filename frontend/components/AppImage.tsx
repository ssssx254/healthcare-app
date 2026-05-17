import { cn } from "@/utils/cn";
import { useState, type ComponentProps } from "react";
import { Image, View, type ImageProps, type ImageSourcePropType } from "react-native";
import { AppIcon } from "./AppIcon";

export type AppImageProps = ImageProps & {
  fallbackIcon?: ComponentProps<typeof AppIcon>["name"];
  imageClassName?: string;
  placeholderClassName?: string;
};

function sourceUri(source: ImageSourcePropType | undefined): string | null {
  if (!source) return null;
  if (typeof source === "number") return "local";
  const uri = "uri" in source ? source.uri : null;
  return uri?.trim() ? uri.trim() : null;
}

/** Remote/local image with placeholder card when load fails (no empty squares on web). */
export function AppImage({
  source,
  className,
  imageClassName,
  placeholderClassName,
  fallbackIcon = "image-off-outline",
  style,
  onError,
  ...rest
}: AppImageProps) {
  const [failed, setFailed] = useState(false);
  const uri = sourceUri(source);
  const isLocal = uri === "local";
  const showPlaceholder = failed || (!isLocal && !uri);

  if (showPlaceholder) {
    return (
      <View
        className={cn(
          "items-center justify-center overflow-hidden bg-slate-100 dark:bg-slate-800",
          className,
          placeholderClassName,
        )}
        style={style}
      >
        <AppIcon name={fallbackIcon} size={28} color="#94a3b8" />
      </View>
    );
  }

  return (
    <Image
      source={source}
      className={cn(className, imageClassName)}
      style={style}
      onError={(e) => {
        setFailed(true);
        onError?.(e);
      }}
      {...rest}
    />
  );
}
