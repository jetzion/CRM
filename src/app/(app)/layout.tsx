import Link from "next/link";
import { Suspense } from "react";
import { Nav, NavLinks } from "@/components/nav";
import { signOut } from "../(auth)/actions";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="md:flex md:min-h-screen">
      <a
        href="#main"
        className="sr-only z-10 rounded-md bg-white px-3 py-2 text-sm font-medium focus:not-sr-only focus:absolute focus:top-2 focus:left-2"
      >
        Skip to content
      </a>
      <aside className="bg-linear-to-b from-indigo-950 to-violet-950 px-4 py-3 text-indigo-100 md:w-56 md:shrink-0 md:py-6">
        <Link href="/dashboard" className="mb-3 flex items-center gap-2 px-3 text-lg font-semibold text-white md:mb-6">
          <span aria-hidden className="size-3 rounded-full bg-linear-to-br from-fuchsia-400 to-sky-400" />
          SimpleCRM
        </Link>
        <Suspense fallback={<NavLinks pathname="" />}>
          <Nav />
        </Suspense>
        <form action={signOut} className="hidden md:mt-6 md:block">
          <button className="px-3 py-2 text-sm text-indigo-300 hover:text-white">Sign out</button>
        </form>
      </aside>
      <main id="main" className="w-full min-w-0 max-w-5xl flex-1 px-4 py-6 md:px-8 md:py-10">
        {children}
      </main>
    </div>
  );
}
