import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { Alert, Platform } from "react-native";

const MAX_DATA_URL_CHARS = 2_400_000;
const NEED_PERMISSION_MSG =
  "Файл сонгохын тулд зурагны сан руу хандахыг зөвшөөрнө үү. Тохиргоо → MedEasy → Зурагнууд.";

export type PickedLabFile = { dataUrl: string; fileType: "image" | "pdf" };

export async function pickLabImageDataUrl(): Promise<PickedLabFile | null> {
  if (Platform.OS === "web") {
    Alert.alert("Мэдэгдэл", "Веб дээр зураг сонгохыг утасны аппаас оролдоно уу.");
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
    quality: 0.55,
    base64: true,
  });
  if (result.canceled || !result.assets[0]?.base64) return null;
  const asset = result.assets[0];
  const mime = asset.mimeType ?? "image/jpeg";
  const dataUrl = `data:${mime};base64,${asset.base64}`;
  if (dataUrl.length > MAX_DATA_URL_CHARS) {
    Alert.alert("Зураг хэт том", "Өөр жижиг зураг сонгоно уу.");
    return null;
  }
  return { dataUrl, fileType: "image" };
}

async function uriToDataUrl(uri: string, mime: string): Promise<string | null> {
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: "base64" });
    const dataUrl = `data:${mime};base64,${base64}`;
    if (dataUrl.length > MAX_DATA_URL_CHARS) {
      Alert.alert("Файл хэт том", "Өөр жижиг PDF эсвэл зураг сонгоно уу.");
      return null;
    }
    return dataUrl;
  } catch {
    Alert.alert("Алдаа", "Файлыг уншиж чадсангүй. Дахин оролдоно уу.");
    return null;
  }
}

export async function pickLabPdfDataUrl(): Promise<PickedLabFile | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: "application/pdf",
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled || !result.assets?.[0]?.uri) return null;
  const asset = result.assets[0];
  const dataUrl = await uriToDataUrl(asset.uri, asset.mimeType ?? "application/pdf");
  if (!dataUrl) return null;
  return { dataUrl, fileType: "pdf" };
}
