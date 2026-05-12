import { auth } from "@/lib/auth";
import Link from "next/link";
import NavBar from "@/components/NavBar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <>
      <NavBar session={session} />
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </>
  );
}
