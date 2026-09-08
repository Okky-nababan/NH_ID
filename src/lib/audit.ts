import { prisma } from "@/lib/prisma";

type LogAuditParams = {
  userId?: string | null;
  action: string;
  module: string;
  recordId?: string | null;
  description: string;
  request?: Request;
};

function extractIp(request?: Request): string | null {
  if (!request) return null;
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() ?? null;
  return request.headers.get("x-real-ip");
}

/**
 * Catat aktivitas sensitif (kas, data anggota, user/izin, kepengurusan,
 * periode) ke AuditLog. Dipanggil dari route handler SETELAH mutasi
 * berhasil. Kegagalan mencatat audit log tidak boleh menggagalkan
 * request utama — dibungkus try/catch agar tidak melempar error ke caller.
 */
export async function logAudit(params: LogAuditParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId ?? null,
        action: params.action,
        module: params.module,
        recordId: params.recordId ?? null,
        description: params.description,
        ipAddress: extractIp(params.request),
      },
    });
  } catch (error) {
    console.error("Gagal mencatat audit log:", error);
  }
}
