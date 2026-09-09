import { NextResponse } from "next/server";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { put } from "@vercel/blob";
import { requireUser } from "@/lib/api-auth";

const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
const ALLOWED_PDF_TYPE = "application/pdf";
const MAX_IMAGE_SIZE = 3 * 1024 * 1024;
// Scan partitur PDF biasanya lebih besar dari foto biasa -- batas lebih longgar.
const MAX_PDF_SIZE = 15 * 1024 * 1024;

export async function POST(request: Request) {
  const { session, error } = await requireUser();
  if (error) return error;

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });
  }

  const isPdf = file.type === ALLOWED_PDF_TYPE;
  const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
  if (!isPdf && !isImage) {
    return NextResponse.json(
      { error: "Format file harus PNG, JPG, WEBP, atau PDF" },
      { status: 400 }
    );
  }
  const maxSize = isPdf ? MAX_PDF_SIZE : MAX_IMAGE_SIZE;
  if (file.size > maxSize) {
    return NextResponse.json(
      { error: `Ukuran file maksimal ${isPdf ? "15MB" : "3MB"}` },
      { status: 400 }
    );
  }

  const ext = isPdf ? "pdf" : file.type.split("/")[1];
  const filename = `${session!.user.id}-${randomUUID()}.${ext}`;

  // Di produksi (Vercel), filesystem bersifat read-only/sementara, jadi foto
  // disimpan ke Vercel Blob. Di lokal (tanpa BLOB_READ_WRITE_TOKEN), fallback
  // ke disk public/uploads seperti sebelumnya.
  try {
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
  } catch (err) {
    // Detail error (mis. penyebab teknis) dicatat ke log server saja --
    // pesan ke klien sengaja generik supaya tidak membocorkan detail
    // internal server (path filesystem, dll).
    console.error("Gagal menyimpan file upload:", err);
    return NextResponse.json(
      { error: "Gagal menyimpan file di server. Coba lagi, atau hubungi admin bila terus gagal." },
      { status: 500 }
    );
  }
}
