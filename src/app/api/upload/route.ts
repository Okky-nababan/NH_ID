import { NextResponse } from "next/server";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { put } from "@vercel/blob";
import { requireUser } from "@/lib/api-auth";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_SIZE = 3 * 1024 * 1024;

export async function POST(request: Request) {
  const { session, error } = await requireUser();
  if (error) return error;

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Format file harus PNG, JPG, atau WEBP" },
      { status: 400 }
    );
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Ukuran file maksimal 3MB" }, { status: 400 });
  }

  const ext = file.type.split("/")[1];
  const filename = `${session!.user.id}-${randomUUID()}.${ext}`;

  // Di produksi (Vercel), filesystem bersifat read-only/sementara, jadi foto
  // disimpan ke Vercel Blob. Di lokal (tanpa BLOB_READ_WRITE_TOKEN), fallback
  // ke disk public/uploads seperti sebelumnya.
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`uploads/${filename}`, file, {
      access: "public",
      contentType: file.type,
    });
    return NextResponse.json({ url: blob.url });
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  const filePath = path.join(uploadDir, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  return NextResponse.json({ url: `/uploads/${filename}` });
}
