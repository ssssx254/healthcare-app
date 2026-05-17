import * as FileSystem from "expo-file-system/legacy";

const SUBDIR = "doctor-avatars";

async function ensureDir(root: string): Promise<string> {
  const dir = `${root}${SUBDIR}/`;
  await FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch(() => {});
  return dir;
}

/**
 * Галерейн түр URI-г эмч бүрт тогтмол замд хуулна (устарсан түр холбоосоос зайлсхийх).
 * Веб эсвэл `documentDirectory` байхгүй бол эх сурвалжийн URI буцаана.
 */
export async function copyPickedDoctorImageToPersistentFile(sourceUri: string, doctorId: string): Promise<string> {
  const root = FileSystem.documentDirectory;
  if (!root) return sourceUri;
  const dir = await ensureDir(root);
  const dest = `${dir}${doctorId}.jpg`;
  await FileSystem.copyAsync({ from: sourceUri, to: dest });
  return dest;
}
