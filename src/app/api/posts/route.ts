import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-auth";
import { postSchema } from "@/lib/validation";

export async function GET() {
  const { error } = await requireUser();
  if (error) return error;

  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { id: true, name: true } },
      _count: { select: { comments: true } },
    },
  });

  return NextResponse.json({ posts });
}

export async function POST(request: Request) {
  const { session, error } = await requireUser();
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Data tidak valid", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { type, title, content } = parsed.data;

  if (type === "PENGUMUMAN" && session!.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Hanya pengurus yang bisa membuat pengumuman" },
      { status: 403 }
    );
  }

  const post = await prisma.post.create({
    data: { type, title, content, authorId: session!.user.id },
  });

  return NextResponse.json({ post }, { status: 201 });
}
