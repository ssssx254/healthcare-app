import { View } from "react-native";

export type ListSkeletonProps = {
  rows?: number;
};

/** Жагсаалт ачаалах үед placeholder — жинхэнэ агуулгын өндөрт ойролцоо. */
export function ListSkeleton({ rows = 4 }: ListSkeletonProps) {
  return (
    <View className="gap-3" accessibilityLabel="Жагсаалт ачааллаж байна">
      {Array.from({ length: rows }, (_, i) => (
        <View
          key={`sk-${i}`}
          className="rounded-3xl border border-slate-200/90 bg-slate-50/95 p-4 dark:border-slate-700/80 dark:bg-slate-800/80"
        >
          <View className="h-4 w-[72%] rounded-md bg-slate-200 dark:bg-slate-600/90" />
          <View className="mt-3 h-3 w-[40%] rounded-md bg-slate-200 dark:bg-slate-600/90" />
          <View className="mt-3 h-3 w-[56%] rounded-md bg-slate-200 dark:bg-slate-600/90" />
          <View className="mt-4 h-10 w-full rounded-2xl bg-slate-200/95 dark:bg-slate-600/95" />
        </View>
      ))}
    </View>
  );
}
