import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter"),
  email: z.string().trim().toLowerCase().email("Email tidak valid"),
  phone: z
    .string()
    .trim()
    .min(9, "Nomor HP minimal 9 digit")
    .regex(/^[0-9+\-\s]+$/, "Nomor HP hanya boleh berisi angka"),
  password: z.string().min(8, "Password minimal 8 karakter"),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});
export type LoginInput = z.infer<typeof loginSchema>;

/** Self-service: field yang boleh diubah anggota untuk profilnya sendiri. */
export const profileUpdateSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter"),
  phone: z
    .string()
    .trim()
    .min(9, "Nomor HP minimal 9 digit")
    .regex(/^[0-9+\-\s]+$/, "Nomor HP hanya boleh berisi angka"),
  address: z.string().trim().max(255).optional().or(z.literal("")),
  birthDate: z.string().optional().or(z.literal("")),
  photoUrl: z.string().optional().or(z.literal("")),
});
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

export const adminUserUpdateSchema = z.object({
  role: z.enum(["ADMIN", "PENGURUS", "ANGGOTA"]).optional(),
  isActive: z.boolean().optional(),
  permissions: z
    .array(
      z.enum([
        "MANAGE_MEMBERS",
        "MANAGE_ACTIVITIES",
        "MANAGE_ATTENDANCE",
        "MANAGE_CASH_PAYMENT",
        "VIEW_CASH_REPORT",
        "MANAGE_POSITIONS",
        "MANAGE_PERIODS",
        "MANAGE_USERS",
        "VIEW_AUDIT_LOG",
      ])
    )
    .optional(),
});
export type AdminUserUpdateInput = z.infer<typeof adminUserUpdateSchema>;

/** Admin/pengurus (permission MANAGE_MEMBERS): CRUD data anggota lengkap. */
export const memberSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter"),
  nickname: z.string().trim().max(50).optional().or(z.literal("")),
  email: z.string().trim().toLowerCase().email("Email tidak valid"),
  phone: z
    .string()
    .trim()
    .min(9, "Nomor HP minimal 9 digit")
    .regex(/^[0-9+\-\s]+$/, "Nomor HP hanya boleh berisi angka"),
  password: z.string().min(8, "Password minimal 8 karakter").optional().or(z.literal("")),
  gender: z.enum(["LAKI_LAKI", "PEREMPUAN"]).optional(),
  birthPlace: z.string().trim().max(100).optional().or(z.literal("")),
  birthDate: z.string().optional().or(z.literal("")),
  address: z.string().trim().max(255).optional().or(z.literal("")),
  memberNumber: z.string().trim().max(50).optional().or(z.literal("")),
  membershipStatus: z.enum(["AKTIF", "TIDAK_AKTIF", "PINDAH", "MENGUNDURKAN_DIRI"]),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
  photoUrl: z.string().optional().or(z.literal("")),
});
export type MemberInput = z.infer<typeof memberSchema>;

export const managementPeriodSchema = z.object({
  name: z.string().trim().min(3, "Nama periode wajib diisi"),
  startYear: z.coerce.number().int().min(2000).max(2100),
  endYear: z.coerce.number().int().min(2000).max(2100),
  isActive: z.boolean().optional(),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});
export type ManagementPeriodInput = z.input<typeof managementPeriodSchema>;
export type ManagementPeriodOutput = z.output<typeof managementPeriodSchema>;

export const positionSchema = z.object({
  title: z.string().trim().min(2, "Nama jabatan wajib diisi"),
  userId: z.string().min(1, "Anggota wajib dipilih"),
  periodId: z.string().min(1, "Periode wajib dipilih"),
  startDate: z.string().optional().or(z.literal("")),
  endDate: z.string().optional().or(z.literal("")),
  status: z.enum(["AKTIF", "NONAKTIF"]),
  order: z.coerce.number().int().min(0).optional(),
});
export type PositionInput = z.input<typeof positionSchema>;
export type PositionOutput = z.output<typeof positionSchema>;

export const activitySchema = z.object({
  name: z.string().trim().min(3, "Nama kegiatan minimal 3 karakter"),
  type: z.enum([
    "IBADAH",
    "KEBAKTIAN",
    "PERSEKUTUAN",
    "RAPAT",
    "OLAHRAGA",
    "BAKTI_SOSIAL",
    "ACARA_GEREJA",
    "RETREAT",
    "PELAYANAN",
    "KEGIATAN_SOSIAL",
    "LAINNYA",
  ]),
  description: z.string().trim().min(3, "Deskripsi wajib diisi"),
  date: z.string().min(1, "Tanggal & waktu wajib diisi"),
  location: z.string().trim().min(2, "Lokasi wajib diisi"),
  personInChargeId: z.string().optional().or(z.literal("")),
  status: z.enum(["DIRENCANAKAN", "BERLANGSUNG", "SELESAI", "DIBATALKAN"]),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
  photoUrl: z.string().optional().or(z.literal("")),
});
export type ActivityInput = z.infer<typeof activitySchema>;

export const attendanceEntrySchema = z.object({
  userId: z.string().min(1),
  status: z.enum(["HADIR", "TIDAK_HADIR", "IZIN", "SAKIT"]),
});
export const attendanceBulkSchema = z.object({
  entries: z.array(attendanceEntrySchema).min(1, "Minimal satu data kehadiran"),
});
export type AttendanceBulkInput = z.infer<typeof attendanceBulkSchema>;

export const cashPaymentSchema = z.object({
  userId: z.string().min(1, "Anggota wajib dipilih"),
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
  amount: z.coerce.number().int().positive("Jumlah harus lebih dari 0"),
  paymentDate: z.string().optional().or(z.literal("")),
  status: z.enum(["BELUM_BAYAR", "LUNAS", "PENDING", "DIBATALKAN"]),
  method: z.enum(["CASH", "TRANSFER", "LAINNYA"]).optional(),
  notes: z.string().trim().max(255).optional().or(z.literal("")),
});
export type CashPaymentInput = z.input<typeof cashPaymentSchema>;
export type CashPaymentOutput = z.output<typeof cashPaymentSchema>;

export const transactionSchema = z.object({
  type: z.enum(["MASUK", "KELUAR"]),
  category: z.string().trim().min(2, "Kategori wajib diisi"),
  amount: z.coerce.number().int().positive("Jumlah harus lebih dari 0"),
  description: z.string().trim().max(255).optional().or(z.literal("")),
  date: z.string().min(1, "Tanggal wajib diisi"),
  userId: z.string().optional().or(z.literal("")),
});
export type TransactionInput = z.input<typeof transactionSchema>;
export type TransactionOutput = z.output<typeof transactionSchema>;

export const postSchema = z.object({
  type: z.enum(["PENGUMUMAN", "FORUM"]),
  title: z.string().trim().min(3, "Judul minimal 3 karakter"),
  content: z.string().trim().min(3, "Isi wajib diisi"),
});
export type PostInput = z.infer<typeof postSchema>;

export const commentSchema = z.object({
  content: z.string().trim().min(1, "Komentar tidak boleh kosong"),
});
export type CommentInput = z.infer<typeof commentSchema>;
