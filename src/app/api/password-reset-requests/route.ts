import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { passwordResetRequestSchema } from "@/lib/validation";

/**
 * Endpoint publik (tidak perlu login) untuk form "Lupa Password". Hanya
 * mencatat permintaan — TIDAK mengirim email otomatis. Admin melihat dan
 * memproses permintaan ini secara manual di /admin/password-reset.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = passwordResetRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Data tidak valid", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  await prisma.passwordResetRequest.create({
    data: {
      email: parsed.data.email,
      message: parsed.data.message || null,
    },
  });

  return NextResponse.json({ success: true }, { status: 201 });
}
