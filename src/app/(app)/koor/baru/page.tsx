import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { hasPermission } from "@/lib/permissions";
import { SongForm } from "./song-form";

export default async function NewChoirSongPage() {
  const session = await auth();
  if (!hasPermission(session, "MANAGE_CHOIR")) redirect("/koor");

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-bold text-slate-900">Tambah Lagu Koor</h1>
      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-6">
        <SongForm />
      </div>
    </div>
  );
}
