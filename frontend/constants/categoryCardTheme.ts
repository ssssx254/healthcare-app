/** Дөрвөлжин ангиллын карт — light/dark хоёуланд уншигдах контраст. */
export type CategoryCardTheme = {
  cardClass: string;
  labelClass: string;
  iconWrapClass: string;
  iconColor: string;
  iconColorDark: string;
};

/** Нэгдсэн ногоон хэв маяг — «Дотор» карттай ижил, dark mode-д зөөлөн mint дэвсгэр. */
export const emeraldCategoryCardTheme: CategoryCardTheme = {
  cardClass: "bg-emerald-100 border-emerald-200/80 dark:bg-emerald-100/95 dark:border-emerald-300/70",
  labelClass: "text-emerald-900 dark:text-emerald-950",
  iconWrapClass: "bg-emerald-50/90 dark:bg-emerald-200/60",
  iconColor: "#047857",
  iconColorDark: "#065f46",
};
