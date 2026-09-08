import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Navbar } from "@/components/navbar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex flex-1 flex-col">
      <Navbar
        name={session.user.name ?? "Anggota"}
        role={session.user.role}
        permissions={session.user.permissions}
      />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
        {children}
      </main>
    </div>
  );
}
