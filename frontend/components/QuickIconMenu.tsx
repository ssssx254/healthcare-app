import { Link, type Href } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { AppIcon, type AppIconProps } from "./AppIcon";

export type QuickIconMenuItem = {
  href: Href;
  label: string;
  icon: AppIconProps["name"];
};

export type QuickIconMenuProps = {
  title: string;
  items: QuickIconMenuItem[];
};

/** Figma-тай ойролцоо: дугуй цэнхэр icon, доор бичиг */
export function QuickIconMenu({ title, items }: QuickIconMenuProps) {
  return (
    <View className="rounded-2xl border border-slate-200 bg-white px-2 pb-4 pt-3 dark:border-slate-700 dark:bg-slate-900">
      <Text className="mb-4 px-2 text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</Text>
      <View className="flex-row flex-wrap justify-between gap-y-5">
        {items.map((item) => (
          <View key={String(item.href)} className="w-[23%] items-center">
            <Link href={item.href} asChild>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={item.label}
                className="items-center active:opacity-80"
              >
                <View className="h-14 w-14 items-center justify-center rounded-full bg-blue-600 shadow-sm dark:bg-blue-500">
                  <AppIcon name={item.icon} size={26} color="#ffffff" />
                </View>
                <Text
                  className="mt-2 px-0.5 text-center text-[10px] font-medium leading-3 text-slate-600 dark:text-slate-300"
                  numberOfLines={3}
                >
                  {item.label}
                </Text>
              </Pressable>
            </Link>
          </View>
        ))}
      </View>
    </View>
  );
}
