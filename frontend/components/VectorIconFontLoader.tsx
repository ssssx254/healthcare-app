import { useFonts } from "expo-font";
import { createContext, useContext, useEffect, type ReactNode } from "react";
import { ActivityIndicator, Platform, View } from "react-native";

/** Must match @expo/vector-icons MaterialCommunityIcons font family name. */
export const MATERIAL_COMMUNITY_FONT_FAMILY = "material-community";

type VectorIconFontContextValue = {
  ready: boolean;
  failed: boolean;
};

const VectorIconFontContext = createContext<VectorIconFontContextValue>({
  ready: true,
  failed: false,
});

export function useVectorIconFonts(): VectorIconFontContextValue {
  return useContext(VectorIconFontContext);
}

type Props = {
  children: ReactNode;
};

const materialCommunityFontAsset = require("../assets/fonts/MaterialCommunityIcons.ttf");

/**
 * Web: load icon font from /assets/fonts/ (Firebase-safe path).
 * Native: Expo Go bundles fonts automatically — no gate.
 */
export function VectorIconFontLoader({ children }: Props) {
  const [fontsLoaded, fontError] = useFonts({
    [MATERIAL_COMMUNITY_FONT_FAMILY]: materialCommunityFontAsset,
  });

  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") return;
    const id = "material-community-font-face";
    if (document.getElementById(id)) return;

    const style = document.createElement("style");
    style.id = id;
    style.textContent = `
      @font-face {
        font-family: '${MATERIAL_COMMUNITY_FONT_FAMILY}';
        src: url('/assets/fonts/material-community.ttf') format('truetype');
        font-display: block;
      }
    `;
    document.head.appendChild(style);
  }, []);

  if (Platform.OS !== "web") {
    return <>{children}</>;
  }

  const ready = fontsLoaded || Boolean(fontError);
  const failed = Boolean(fontError);

  if (!ready) {
    return (
      <View className="flex-1 items-center justify-center bg-app-bg">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <VectorIconFontContext.Provider value={{ ready: true, failed }}>
      {children}
    </VectorIconFontContext.Provider>
  );
}
