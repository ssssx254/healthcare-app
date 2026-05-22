import { AUDIENCE_CATEGORIES } from "@/constants/audienceCategories";
import type { CategoryCardTheme } from "@/constants/categoryCardTheme";
import { MEDICAL_SPECIALTY_CATEGORIES } from "@/constants/medicalSpecialtyCategories";
import { navigateToDoctorsWithFilter } from "@/lib/doctorCategoryNav";
import type { ServiceCategorySelection } from "@/types/serviceCategorySelection";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ComponentProps, ReactNode } from "react";
import { useState } from "react";
import { LayoutAnimation, Platform, Pressable, Text, UIManager, View } from "react-native";
import { useColorScheme } from "nativewind";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export type { ServiceCategorySelection } from "@/types/serviceCategorySelection";

type CategoryCardProps = CategoryCardTheme & {
  label: string;
  icon: ComponentProps<typeof MaterialCommunityIcons>["name"];
  onPress: () => void;
  active?: boolean;
};

/** 4 багана — light/dark хоёуланд уншигдах текст, дэвсгэр. */
function CategorySquareCard({
  label,
  icon,
  cardClass,
  labelClass,
  iconWrapClass,
  iconColor,
  iconColorDark,
  onPress,
  active,
}: CategoryCardProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const resolvedIconColor = isDark ? iconColorDark : iconColor;

  return (
    <View className="min-w-0 flex-1" style={{ maxWidth: "25%" }}>
      <Pressable
        onPress={onPress}
        className={`aspect-square items-center justify-center overflow-hidden rounded-2xl border px-0.5 py-1.5 active:opacity-90 ${
          active
            ? "border-brand-600 bg-brand-100 dark:border-brand-400 dark:bg-brand-950/80"
            : `border-app-border ${cardClass}`
        }`}
      >
        <View className={`h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconWrapClass}`}>
          <MaterialCommunityIcons name={icon} size={20} color={resolvedIconColor} />
        </View>
        <Text
          className={`mt-1 w-full shrink px-0.5 text-center font-semibold leading-[11px] text-[9px] ${
            active ? "text-brand-800 dark:text-brand-200" : labelClass
          }`}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {label}
        </Text>
      </Pressable>
    </View>
  );
}

function CategoryRow({ children }: { children: ReactNode }) {
  return <View className="flex-row gap-1.5">{children}</View>;
}

function isAudienceActive(selection: ServiceCategorySelection | null | undefined, id: string): boolean {
  return selection?.kind === "audience" && selection.id === id;
}

function isSpecialtyActive(selection: ServiceCategorySelection | null | undefined, id: string): boolean {
  return (selection?.kind === "specialty" && selection.id === id) || (selection?.kind === "provider" && selection.name === id);
}

type ServiceCategorySectionProps = {
  /** Дотоод шүүлт (эмч нар таб) */
  selection?: ServiceCategorySelection | null;
  onSelectCategory?: (selection: ServiceCategorySelection) => void;
};

export function ServiceCategorySection({
  selection = null,
  onSelectCategory,
}: ServiceCategorySectionProps) {
  const [expanded, setExpanded] = useState(false);
  const filterMode = Boolean(onSelectCategory);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const chevronColor = isDark ? "#93c5fd" : "#2563eb";

  const toggleExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((v) => !v);
  };

  const applySelection = (next: ServiceCategorySelection) => {
    if (filterMode) {
      onSelectCategory!(next);
      return;
    }
    navigateToDoctorsWithFilter(next);
  };

  const handleAudiencePress = (item: (typeof AUDIENCE_CATEGORIES)[number]) => {
    const next: ServiceCategorySelection = {
      kind: "audience",
      id: item.id,
      label: item.label,
      searchQuery: item.searchQuery,
    };
    if (filterMode && isAudienceActive(selection, item.id)) {
      applySelection({ kind: "all" });
      return;
    }
    applySelection(next);
  };

  const handleSpecialtyPress = (item: (typeof MEDICAL_SPECIALTY_CATEGORIES)[number]) => {
    const next: ServiceCategorySelection = {
      kind: "specialty",
      id: item.id,
      label: item.label,
      keywords: item.keywords,
    };
    if (filterMode && isSpecialtyActive(selection, item.id)) {
      applySelection({ kind: "all" });
      return;
    }
    applySelection(next);
  };

  return (
    <View>
      <Text className="text-sm font-semibold text-app-text">Үйлчилгээний ангиллууд</Text>
      {filterMode && selection && selection.kind !== "all" ? (
        <Text className="mt-1 text-xs text-app-text-muted">
          Сонгосон:{" "}
          {selection.kind === "audience"
            ? selection.label
            : selection.kind === "specialty"
              ? selection.label
              : selection.name}
        </Text>
      ) : null}

      <View className="mt-3">
        <CategoryRow>
          {AUDIENCE_CATEGORIES.map((item) => (
            <CategorySquareCard
              key={item.id}
              label={item.label}
              icon={item.icon}
              cardClass={item.cardClass}
              labelClass={item.labelClass}
              iconWrapClass={item.iconWrapClass}
              iconColor={item.iconColor}
              iconColorDark={item.iconColorDark}
              active={isAudienceActive(selection, item.id)}
              onPress={() => handleAudiencePress(item)}
            />
          ))}
        </CategoryRow>
      </View>

      <View className="mt-3">
        <Pressable
          onPress={toggleExpanded}
          className="flex-row items-center justify-center gap-1 rounded-xl border border-app-border bg-app-muted px-3 py-2.5 active:opacity-90 dark:bg-app-muted/80"
        >
          <Text className="text-xs font-semibold text-brand-800 dark:text-brand-200">
            {expanded ? "Хураах" : "Бүх ангиллыг харах"}
          </Text>
          <MaterialCommunityIcons name={expanded ? "chevron-up" : "chevron-down"} size={18} color={chevronColor} />
        </Pressable>

        {expanded ? (
          <View className="mt-3">
            <CategoryRow>
              {MEDICAL_SPECIALTY_CATEGORIES.map((item) => (
                <CategorySquareCard
                  key={item.id}
                  label={item.label}
                  icon={item.icon}
                  cardClass={item.cardClass}
                  labelClass={item.labelClass}
                  iconWrapClass={item.iconWrapClass}
                  iconColor={item.iconColor}
                  iconColorDark={item.iconColorDark}
                  active={isSpecialtyActive(selection, item.id)}
                  onPress={() => handleSpecialtyPress(item)}
                />
              ))}
            </CategoryRow>
          </View>
        ) : null}
      </View>
    </View>
  );
}
