import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";

export default async function DesktopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  if (session.perfil === "OPERADOR") {
    redirect("/mobile");
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar perfil={session.perfil} />
      <div className="flex-1 flex flex-col min-w-0">
        {children}
      </div>
    </div>
  );
}
