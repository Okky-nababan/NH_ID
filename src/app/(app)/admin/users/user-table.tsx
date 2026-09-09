"use client";

import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import { PERMISSION_LABELS } from "@/lib/permissions";
import type { Permission, Role } from "@/generated/prisma/client";

type Row = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  isActive: boolean;
  permissions: Permission[];
};

const ALL_PERMISSIONS = Object.keys(PERMISSION_LABELS) as Permission[];

export function UserTable({
  users,
  currentUserId,
}: {
  users: Row[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const update = async (
    id: string,
    patch: Partial<{ role: string; isActive: boolean; permissions: Permission[] }>
  ) => {
    setBusyId(id);
    setError(null);
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    setBusyId(null);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "Gagal memperbarui user");
      return;
    }
    router.refresh();
  };

  const togglePermission = (user: Row, permission: Permission) => {
    const next = user.permissions.includes(permission)
      ? user.permissions.filter((p) => p !== permission)
      : [...user.permissions, permission];
    update(user.id, { permissions: next });
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      {error && <p className="p-3 text-sm text-red-600">{error}</p>}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-slate-600">Nama</th>
              <th className="px-4 py-2 text-left font-semibold text-slate-600">Kontak</th>
              <th className="px-4 py-2 text-left font-semibold text-slate-600">Role</th>
              <th className="px-4 py-2 text-left font-semibold text-slate-600">Status</th>
              <th className="px-4 py-2 text-left font-semibold text-slate-600">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <Fragment key={u.id}>
                <tr>
                  <td className="px-4 py-2 font-medium text-slate-900">{u.name}</td>
                  <td className="px-4 py-2 text-slate-600">
                    <div>{u.email}</div>
                    <div className="text-xs text-slate-400">{u.phone}</div>
                  </td>
                  <td className="px-4 py-2">
                    <select
                      value={u.role}
                      disabled={busyId === u.id}
                      onChange={(e) => update(u.id, { role: e.target.value })}
                      className="rounded-md border border-slate-300 px-2 py-1 text-sm disabled:opacity-50"
                    >
                      <option value="ANGGOTA">Anggota</option>
                      <option value="PENGURUS">Pengurus</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                    {u.id === currentUserId && (
                      <p className="mt-1 text-[11px] text-slate-400">
                        Akun Anda sendiri. Butuh minimal 1 admin aktif lain untuk turun role.
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-medium ${
                        u.isActive ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {u.isActive ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex gap-2">
                      {u.role === "PENGURUS" && (
                        <button
                          onClick={() => setExpandedId(expandedId === u.id ? null : u.id)}
                          className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Izin ({u.permissions.length})
                        </button>
                      )}
                      <button
                        disabled={busyId === u.id || u.id === currentUserId}
                        onClick={() => update(u.id, { isActive: !u.isActive })}
                        className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                      >
                        {u.isActive ? "Nonaktifkan" : "Aktifkan"}
                      </button>
                    </div>
                  </td>
                </tr>
                {expandedId === u.id && (
                  <tr>
                    <td colSpan={5} className="bg-slate-50 px-4 py-3">
                      <p className="mb-2 text-xs font-semibold text-slate-500">
                        Izin granular untuk {u.name}
                      </p>
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {ALL_PERMISSIONS.map((perm) => (
                          <label key={perm} className="flex items-center gap-2 text-sm text-slate-700">
                            <input
                              type="checkbox"
                              checked={u.permissions.includes(perm)}
                              disabled={busyId === u.id}
                              onChange={() => togglePermission(u, perm)}
                              className="h-4 w-4 rounded border-slate-300"
                            />
                            {PERMISSION_LABELS[perm]}
                          </label>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
