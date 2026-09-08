import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/api-auth";
import { commentSchema } from "@/lib/validation";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireUser();
  if (error) return error;

  const { id: postId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = commentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Data tidak valid", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) {
    return NextResponse.json({ error: "Post tidak ditemukan" }, { status: 404 });
  }

  const comment = await prisma.comment.create({
    data: {
      postId,
      authorId: session!.user.id,
      content: parsed.data.content,
    },
    include: { author: { select: { id: true, name: true } } },
  });

  return NextResponse.json({ comment }, { status: 201 });
}
