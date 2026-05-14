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
    <div className="flex min-h-screen flex-col">
      <NavBar session={session} />
      <main className="mx-auto w-full max-w-[1200px] flex-1 px-6 py-8">{children}</main>
      <Footer />
    </div>
  );
}
