"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ATTENDANCE_STATUS_LABELS } from "@/lib/labels";

type Member = { id: string; name: string };
type AttendanceStatus = "HADIR" | "TIDAK_HADIR" | "IZIN" | "SAKIT";

export function AttendanceForm({
  activityId,
  members,
  existing,
}: {
  activityId: string;
  members: Member[];
  existing: Record<string, AttendanceStatus>;
}) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, AttendanceStatus>>(existing);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const setStatus = (userId: string, status: AttendanceStatus) => {
    setValues((prev) => ({ ...prev, [userId]: status }));
  };

  const markAll = (status: AttendanceStatus) => {
    const next: Record<string, AttendanceStatus> = {};
    for (const m of members) next[m.id] = status;
    setValues(next);
  };

  const onSubmit = async () => {
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    const entries = Object.entries(values).map(([userId, status]) => ({ userId, status }));
    const res = await fetch(`/api/activities/${activityId}/attendance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entries }),
    });
    setSubmitting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "Gagal menyimpan kehadiran");
      return;
    }

    setSuccess(true);
    router.refresh();
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        <span className="text-sm text-slate-500">Tandai semua:</span>
        {(Object.keys(ATTENDANCE_STATUS_LABELS) as AttendanceStatus[]).map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => markAll(status)}
            className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            {ATTENDANCE_STATUS_LABELS[status]}
          </button>
        ))}
      </div>

      <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
        {members.map((m) => (
          <div key={m.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
            <span className="text-sm font-medium text-slate-900">{m.name}</span>
            <select
              value={values[m.id] ?? ""}
              onChange={(e) => setStatus(m.id, e.target.value as AttendanceStatus)}
              className="rounded-md border border-slate-300 px-2 py-1 text-sm"
            >
              <option value="" disabled>
                - Pilih -
              </option>
              {(Object.keys(ATTENDANCE_STATUS_LABELS) as AttendanceStatus[]).map((status) => (
                <option key={status} value={status}>
                  {ATTENDANCE_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {success && <p className="mt-2 text-sm text-green-600">Kehadiran berhasil disimpan.</p>}

      <button
        type="button"
        onClick={onSubmit}
        disabled={submitting}
        className="mt-3 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {submitting ? "Menyimpan..." : "Simpan Kehadiran"}
      </button>
    </div>
  );
}
