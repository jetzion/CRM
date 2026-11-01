import Link from "next/link";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="flex min-h-screen flex-col justify-center bg-linear-to-br from-indigo-100 via-canvas to-fuchsia-100 px-4 py-12">
      <div className="mx-auto w-full max-w-sm">
        <Link href="/" className="mb-8 flex items-center gap-2 text-xl font-semibold">
          <span aria-hidden className="size-3 rounded-full bg-linear-to-br from-fuchsia-500 to-sky-500" />
          SimpleCRM
        </Link>
        {children}
      </div>
    </main>
  );
}
