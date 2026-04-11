import { readFile } from "fs/promises";
import path from "path";

export async function loadLogoAsBase64(
  logoUrl: string
): Promise<{ logoBase64: string; logoMimeType: string } | null> {
  try {
    let buffer: Buffer;

    if (logoUrl.startsWith("http")) {
      const res = await fetch(logoUrl);
      if (!res.ok) return null;
      buffer = Buffer.from(await res.arrayBuffer());
    } else {
      buffer = await readFile(path.join(process.cwd(), "public", logoUrl));
    }

    const ext = logoUrl.split(".").pop()?.toLowerCase() ?? "";
    const logoMimeType =
      ext === "png"
        ? "image/png"
        : ext === "jpg" || ext === "jpeg"
        ? "image/jpeg"
        : "image/png";

    return { logoBase64: buffer.toString("base64"), logoMimeType };
  } catch {
    return null;
  }
}
