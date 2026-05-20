import type { ReactNode } from "react";
import { Text, View } from "react-native";

export type ProviderFormSectionProps = {
  title: string;
  description?: string;
  /** Хоосон бол зөвхөн гарчиг/тайлбар — дараагийн талбарууд гадна байж болно. */
  children?: ReactNode;
};

/** Эмнэлгийн талын маягт — бүлэг гарчиг, тайлбар. */
export function ProviderFormSection({ title, description, children }: ProviderFormSectionProps) {
  return (
    <View className="mb-5">
      <Text className="mb-1.5 text-xs font-bold uppercase tracking-wide text-brand-700 dark:text-brand-300">{title}</Text>
      {description ? (
        <Text className="mb-3 text-xs leading-5 text-app-text-muted">{description}</Text>
      ) : null}
      {children ?? null}
    </View>
  );
}
