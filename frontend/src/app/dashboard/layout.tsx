
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import LogoutButton from "./LogoutButton";

const navigation = [
  { label: "Overview", href: "/dashboard", icon: "◫" },
  { label: "Research Papers", href: "/dashboard/papers", icon: "▤" },
  { label: "My Interests", href: "/dashboard/interests", icon: "◎" },
  { label: "Digest Settings", href: "/dashboard/settings", icon: "⚙" },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const displayName =
    user.user_metadata?.display_name ||
    user.email?.split("@")[0] ||
    "Researcher";

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-900 md:flex">
      <aside className="flex w-full flex-col border-b border-slate-200/80 bg-white md:min-h-screen md:w-72 md:border-b-0 md:border-r">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 border-b border-slate-100 px-5 py-5 sm:px-6 sm:py-6"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white">
            R
          </span>
          <span>
            <span className="block text-lg font-bold tracking-tight">
              ResearchDigest
            </span>
            <span className="block text-xs text-slate-500">
              Personal Research Intelligence
            </span>
          </span>
        </Link>

        <div className="px-3 py-4 sm:px-4 sm:py-5">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Workspace
          </p>

          <nav className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap md:flex-col">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex min-w-0 items-center gap-2 rounded-xl px-3 py-3 text-sm font-medium text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-700 sm:gap-3"
              >
                <span className="shrink-0 text-lg leading-none">{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-auto hidden border-t border-slate-100 p-4 md:block">
          <div className="mb-3 truncate px-2 text-sm text-slate-500">
            Signed in as
            <div className="mt-1 truncate font-medium text-slate-800">
              {user.email}
            </div>
          </div>
          <LogoutButton />
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-between gap-4 border-b border-slate-200/80 bg-white px-4 py-4 sm:px-5 md:px-8">
          <div>
            <p className="text-sm text-slate-500">Your research workspace</p>
            <h1 className="max-w-[15rem] truncate text-base font-semibold sm:max-w-none sm:text-lg">
              Welcome back, {displayName}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-500 sm:block">
              AI-powered discovery
            </span>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-700">
              {displayName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-5 md:p-8">
          {children}
        </main>

        <div className="border-t border-slate-200 bg-white p-4 md:hidden">
          <div className="mb-3 truncate text-sm text-slate-500">
            {user.email}
          </div>
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}