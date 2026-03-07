import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth";
import { MobileNav } from "@/components/layout/MobileNav";

export default async function MobileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  if (session.perfil !== "OPERADOR" && session.perfil !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {children}
      <MobileNav />
    </div>
  );
}
