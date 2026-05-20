import { Linking, Platform } from "react-native";

export const EMERGENCY_NUMBER = "103";
export const EMERGENCY_TEL_URL = `tel:${EMERGENCY_NUMBER}`;

export async function openEmergencyCall(): Promise<void> {
  try {
    const supported = await Linking.canOpenURL(EMERGENCY_TEL_URL);
    if (supported) {
      await Linking.openURL(EMERGENCY_TEL_URL);
      return;
    }
  } catch {
    /* fallback */
  }

  if (Platform.OS === "web" && typeof window !== "undefined") {
    window.location.href = EMERGENCY_TEL_URL;
    return;
  }

  await Linking.openURL(EMERGENCY_TEL_URL);
}
