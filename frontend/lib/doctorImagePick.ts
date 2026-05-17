import * as ImagePicker from "expo-image-picker";
import { Alert, Platform } from "react-native";

const NEED_PERMISSION_MSG =
  "Эмчийн профайл зураг сонгохын тулд зурагны сан руу хандахыг зөвшөөрнө үү. Тохиргоо → MedEasy → Зурагнууд.";
const WEB_LIMIT_MSG =
  "Веб дээр зургийг галерейгаас сонгох боломж хязгаарлагдмал байна. Утасны аппаас оролдоно уу.";

export async function pickDoctorProfileImageFromLibrary(): Promise<string | null> {
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
    quality: 0.85,
  });

  if (result.canceled || !result.assets[0]?.uri) return null;
  return result.assets[0].uri;
}
