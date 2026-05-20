import { useAppTheme } from "@/components/ThemeProvider";

/** Stack/tab navigation theme — ThemeProvider-ийн сонголт. */
export function useNavigationColorScheme() {
  return useAppTheme().resolvedScheme;
}
