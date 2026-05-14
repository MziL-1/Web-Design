import { Suspense } from "react";
import { auth } from "@/lib/auth";
import NavBar from "@/components/NavBar";
import Footer from "@/components/ui/Footer";
import StarField from "@/components/ui/StarField";

function NavBarFallback() {
  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-gray-50/95 backdrop-blur-md">
      <nav className="mx-auto flex h-14 max-w-[1200px] items-center justify-between px-6">
        <span className="font-display text-2xl font-semibold tracking-[-0.5px] text-gray-950">
          BlogPlatform
        </span>
      </nav>
    </header>
  );
}

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="relative flex min-h-screen flex-col">
      <StarField />
      <div className="relative z-10 flex min-h-screen flex-col">
        <Suspense fallback={<NavBarFallback />}>
          <NavBar session={session} />
        </Suspense>
        <main className="mx-auto w-full max-w-[1200px] flex-1 px-6 py-8">{children}</main>
        <Footer />
      </div>
    </div>
  );
}
