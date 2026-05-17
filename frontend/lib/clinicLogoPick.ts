import * as ImagePicker from "expo-image-picker";
import { Alert, Platform } from "react-native";

const NEED_PERMISSION_MSG =
  "Лого сонгохын тулд зурагны сан руу хандахыг зөвшөөрнө үү. Тохиргоо → MedEasy → Зурагнууд.";
const WEB_LIMIT_MSG =
  "Веб дээр зургийг галерейгаас сонгох боломж хязгаарлагдмал байна. Утасны аппаас оролдоно уу.";

/** Base64 data URL — серверт `logo_url` талбарт илгээнэ (жижигхэн лого байх ёстой). */
const MAX_DATA_URL_CHARS = 2_400_000;

/**
 * Утасны зурагны сангаас эмнэлгийн лого сонгоод data URL буцаана (Expo Go-д тохирно).
 */
export async function pickClinicLogoDataUrlFromLibrary(): Promise<string | null> {
  if (Platform.OS === "web") {
    Alert.alert("Мэдэгдэл", WEB_LIMIT_MSG);
    return null;
  }

  const existing = await ImagePicker.getMediaLibraryPermissionsAsync();
  let granted = existing.status === ImagePicker.PermissionStatus.GRANTED;
  if (!granted) {
    const requested = await ImagePicker.requestMediaLibraryPermissionsAsync();
    granted = requested.status === ImagePicker.PermissionStatus.GRANTED;
  }
  if (!granted) {
    Alert.alert("Зөвшөөрөл хэрэгтэй", NEED_PERMISSION_MSG);
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.42,
    base64: true,
  });

  if (result.canceled || !result.assets[0]) return null;
  const asset = result.assets[0];
  if (!asset.base64) return null;
  const mime = asset.mimeType ?? "image/jpeg";
  const dataUrl = `data:${mime};base64,${asset.base64}`;
  if (dataUrl.length > MAX_DATA_URL_CHARS) {
    Alert.alert("Зураг хэт том", "Өөр жижиг зураг сонгоно уу эсвэл илүү энгийн дүрс ашиглана уу.");
    return null;
  }
  return dataUrl;
}
