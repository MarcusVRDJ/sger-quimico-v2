import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SGE Químico v2",
  description: "Sistema de Gerenciamento de Contentores IBC",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
