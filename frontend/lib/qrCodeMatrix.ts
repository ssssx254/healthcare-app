/**
 * Canvas/PNG-гүй QR матриц — Expo Go + web (qrcode core л ашиглана).
 */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const QRCodeCore = require("qrcode/lib/core/qrcode") as {
  create: (
    text: string,
    options?: { errorCorrectionLevel?: "L" | "M" | "Q" | "H" },
  ) => {
    modules: { size: number; get: (row: number, col: number) => boolean };
  };
};

export type QrMatrixData = {
  moduleCount: number;
  isDark: (row: number, col: number) => boolean;
};

export function buildQrMatrix(payload: string): QrMatrixData | null {
  const text = payload?.trim() ?? "";
  if (!text) return null;
  try {
    const qr = QRCodeCore.create(text, { errorCorrectionLevel: "M" });
    const modules = qr.modules;
    const moduleCount = modules.size;
    return {
      moduleCount,
      isDark: (row, col) => Boolean(modules.get(row, col)),
    };
  } catch {
    return null;
  }
}
