import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "Keine Datei hochgeladen" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = file.name.split(".").pop() ?? "png";
    const dir = path.join(process.cwd(), "public", "uploads", "logos", session.user.id);
    await mkdir(dir, { recursive: true });

    const filename = `logo.${ext}`;
    const filepath = path.join(dir, filename);
    await writeFile(filepath, buffer);

    const url = `/uploads/logos/${session.user.id}/${filename}`;
    return NextResponse.json({ url });
  } catch (error) {
    console.error("Logo upload error:", error);
    return NextResponse.json({ error: "Upload fehlgeschlagen" }, { status: 500 });
  }
}
