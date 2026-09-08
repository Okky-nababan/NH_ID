"use client";

import { useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { profileUpdateSchema, type ProfileUpdateInput } from "@/lib/validation";

type Props = {
  userId: string;
  initial: {
    name: string;
    phone: string;
    address: string;
    birthDate: string;
    photoUrl: string;
  };
};

export function ProfileForm({ userId, initial }: Props) {
  const router = useRouter();
  const [photoUrl, setPhotoUrl] = useState(initial.photoUrl);
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileUpdateInput>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      name: initial.name,
      phone: initial.phone,
      address: initial.address,
      birthDate: initial.birthDate,
    },
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

  const onSubmit = async (data: ProfileUpdateInput) => {
    setFormError(null);
    setSuccess(false);
    setSubmitting(true);

    const res = await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, photoUrl }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setFormError(body.error || "Gagal menyimpan profil");
      return;
    }

    setSuccess(true);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="flex items-center gap-4">
        <div className="relative h-16 w-16 overflow-hidden rounded-full bg-blue-100">
          {photoUrl ? (
            <Image src={photoUrl} alt="Foto profil" fill className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-blue-700">
              {initial.name.slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Ganti Foto Profil
          </label>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handlePhotoChange}
            disabled={uploading}
            className="mt-1 text-sm"
          />
          {uploading && <p className="text-xs text-slate-500">Mengunggah...</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Nama Lengkap</label>
        <input
          type="text"
          {...register("name")}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Nomor HP</label>
        <input
          type="tel"
          {...register("phone")}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Alamat</label>
        <input
          type="text"
          {...register("address")}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Tanggal Lahir</label>
        <input
          type="date"
          {...register("birthDate")}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {formError && <p className="text-sm text-red-600">{formError}</p>}
      {success && <p className="text-sm text-green-600">Profil berhasil disimpan.</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
      >
        {submitting ? "Menyimpan..." : "Simpan Perubahan"}
      </button>
    </form>
  );
}
