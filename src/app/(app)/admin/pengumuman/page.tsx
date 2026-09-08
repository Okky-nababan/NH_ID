import { prisma } from "@/lib/prisma";
import { AnnouncementAdmin } from "./announcement-admin";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(
    date
  );
}

export default async function AdminPengumumanPage() {
  const posts = await prisma.post.findMany({
    where: { type: "PENGUMUMAN" },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-900">Kelola Pengumuman</h2>
      <p className="mt-1 text-sm text-slate-500">
        Buat dan kelola pengumuman resmi untuk seluruh anggota.
      </p>
      <div className="mt-4">
        <AnnouncementAdmin
          posts={posts.map((p) => ({
            id: p.id,
            title: p.title,
            content: p.content,
            createdAt: formatDate(p.createdAt),
          }))}
        />
      </div>
    </div>
  );
}
