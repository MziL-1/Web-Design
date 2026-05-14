import { auth } from "@/lib/auth";
import NavBar from "@/components/NavBar";
import Footer from "@/components/ui/Footer";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <>
      <NavBar session={session} />
      <main className="mx-auto max-w-[1200px] px-6 py-8">{children}</main>
      <Footer />
    </>
  );
}
