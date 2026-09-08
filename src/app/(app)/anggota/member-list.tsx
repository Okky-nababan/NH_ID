"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";

type Row = {
  id: string;
  memberNumber: string | null;
  name: string;
  gender: "LAKI_LAKI" | "PEREMPUAN" | null;
  phone: string;
  email: string;
  membershipStatus: "AKTIF" | "TIDAK_AKTIF" | "PINDAH" | "MENGUNDURKAN_DIRI";
  photoUrl: string | null;
};

const STATUS_LABEL: Record<Row["membershipStatus"], string> = {
  AKTIF: "Aktif",
  TIDAK_AKTIF: "Tidak Aktif",
  PINDAH: "Pindah",
  MENGUNDURKAN_DIRI: "Mengundurkan Diri",
};

const STATUS_CLASS: Record<Row["membershipStatus"], string> = {
  AKTIF: "bg-green-50 text-green-700",
  TIDAK_AKTIF: "bg-slate-100 text-slate-500",
  PINDAH: "bg-amber-50 text-amber-700",
  MENGUNDURKAN_DIRI: "bg-red-50 text-red-700",
};

const PAGE_SIZE = 12;

export function MemberList({ members, canManage }: { members: Row[]; canManage: boolean }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("ALL");
  const [gender, setGender] = useState<string>("ALL");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return members.filter((m) => {
      const matchesSearch =
        !q || m.name.toLowerCase().includes(q) || (m.memberNumber ?? "").toLowerCase().includes(q);
      const matchesStatus = status === "ALL" || m.membershipStatus === status;
      const matchesGender = gender === "ALL" || m.gender === gender;
      return matchesSearch && matchesStatus && matchesGender;
    });
  }, [members, search, status, gender]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Cari nama atau nomor anggota..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="min-w-[200px] flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="ALL">Semua Status</option>
          <option value="AKTIF">Aktif</option>
          <option value="TIDAK_AKTIF">Tidak Aktif</option>
          <option value="PINDAH">Pindah</option>
          <option value="MENGUNDURKAN_DIRI">Mengundurkan Diri</option>
        </select>
        <select
          value={gender}
          onChange={(e) => {
            setGender(e.target.value);
            setPage(1);
          }}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="ALL">Semua Gender</option>
          <option value="LAKI_LAKI">Laki-laki</option>
          <option value="PEREMPUAN">Perempuan</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="mt-8 text-center text-sm text-slate-500">
          Tidak ada anggota yang cocok dengan pencarian.
        </p>
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pageItems.map((m) => (
              <Link
                key={m.id}
                href={`/anggota/${m.id}`}
                className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-4 hover:border-brand hover:shadow-sm"
              >
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-blue-100">
                  {m.photoUrl ? (
                    <Image src={m.photoUrl} alt={m.name} fill className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-brand">
                      {m.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900">{m.name}</p>
                  <p className="truncate text-sm text-slate-500">
                    {m.memberNumber ?? "-"} {canManage ? `· ${m.phone}` : ""}
                  </p>
                  <span
                    className={`mt-1 inline-block rounded px-1.5 py-0.5 text-xs font-medium ${STATUS_CLASS[m.membershipStatus]}`}
                  >
                    {STATUS_LABEL[m.membershipStatus]}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-40"
              >
                Sebelumnya
              </button>
              <span className="text-sm text-slate-500">
                Halaman {currentPage} dari {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-40"
              >
                Berikutnya
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
