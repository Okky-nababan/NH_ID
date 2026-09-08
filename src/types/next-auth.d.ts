import { type DefaultSession } from "next-auth";
import type { Permission, Role } from "@/generated/prisma/client";

declare module "next-auth" {
  interface User {
    role: Role;
    permissions: Permission[];
  }

  interface Session {
    user: {
      id: string;
      role: Role;
      permissions: Permission[];
    } & DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: Role;
    permissions: Permission[];
  }
}
