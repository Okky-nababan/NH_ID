"use client";

import { useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { memberSchema, type MemberInput } from "@/lib/validation";

type Props = {
  memberId?: string;
  initial?: Partial<MemberInput>;
};

export function MemberForm({ memberId, initial }: Props) {
  const router = useRouter();
  const [photoUrl, setPhotoUrl] = useState(initial?.photoUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MemberInput>({
    resolver: zodResolver(memberSchema),
    defaultValues: { membershipStatus: "AKTIF", ...initial },
  });

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setFormError(null);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const body = await res.json();
    setUploading(false);
    if (!res.ok) {
      setFormError(body.error || "Gagal mengunggah foto");
      return;
    }
    setPhotoUrl(body.url);
  };

  const onSubmit = async (data: MemberInput) => {
    setFormError(null);
    setSubmitting(true);

    const res = await fetch(memberId ? `/api/members/${memberId}` : "/api/members", {
      method: memberId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, photoUrl }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setFormError(body.error || "Gagal menyimpan data anggota");
      return;
    }

    const { member } = await res.json();
    router.push(`/anggota/${member.id}`);
    router.refresh();
  };

  const onDeactivate = async () => {
    if (!memberId) return;
    if (!confirm("Nonaktifkan anggota ini? Riwayat kas dan kehadiran tetap tersimpan.")) return;
    setFormError(null);
    setDeactivating(true);
    const res = await fetch(`/api/members/${memberId}`, { method: "DELETE" });
    setDeactivating(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setFormError(body.error || "Gagal menonaktifkan anggota");
      return;
    }
    router.push("/anggota");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative h-16 w-16 overflow-hidden rounded-full bg-blue-100">
          {photoUrl ? (
            <Image src={photoUrl} alt="Foto" fill className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-brand">
              {(initial?.name ?? "?").slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Foto Profil</label>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handlePhotoChange}
            disabled={uploading}
            className="mt-1 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Nama Lengkap</label>
          <input
            type="text"
            {...register("name")}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Nama Panggilan</label>
          <input
            type="text"
            {...register("nickname")}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Email</label>
          <input
            type="email"
            {...register("email")}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Nomor HP</label>
          <input
            type="tel"
            {...register("phone")}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">
          {memberId ? "Reset Password (opsional)" : "Password"}
        </label>
        <input
          type="password"
          {...register("password")}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        {errors.password && (
          <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Jenis Kelamin</label>
          <select
            {...register("gender")}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">- Pilih -</option>
            <option value="LAKI_LAKI">Laki-laki</option>
            <option value="PEREMPUAN">Perempuan</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Tempat Lahir</label>
          <input
            type="text"
            {...register("birthPlace")}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Tanggal Lahir</label>
          <input
            type="date"
            {...register("birthDate")}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">
          Tubu/Boru ni Mama (Marga Ibu)
        </label>
        <input
          type="text"
          placeholder="Mis. Boru Sihombing"
          {...register("motherClan")}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Alamat</label>
        <input
          type="text"
          {...register("address")}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Nomor Anggota</label>
          <input
            type="text"
            placeholder="NHID-0001"
            {...register("memberNumber")}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Status Keanggotaan</label>
          <select
            {...register("membershipStatus")}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="AKTIF">Aktif</option>
            <option value="TIDAK_AKTIF">Tidak Aktif</option>
            <option value="PINDAH">Pindah</option>
            <option value="MENGUNDURKAN_DIRI">Mengundurkan Diri</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Keterangan</label>
        <textarea
          rows={2}
          {...register("notes")}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      {formError && <p className="text-sm text-red-600">{formError}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {submitting ? "Menyimpan..." : memberId ? "Simpan Perubahan" : "Tambah Anggota"}
        </button>
        {memberId && (
          <button
            type="button"
            disabled={deactivating}
            onClick={onDeactivate}
            className="rounded-md border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
          >
            {deactivating ? "Menonaktifkan..." : "Nonaktifkan Anggota"}
          </button>
        )}
      </div>
    </form>
  );
}
