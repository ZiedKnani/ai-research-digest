
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
    <div className="min-h-screen bg-[#f7f8fc] text-slate-900 md:flex">
      <aside className="flex w-full flex-col border-b border-slate-200 bg-white md:min-h-screen md:w-64 md:border-b-0 md:border-r">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 border-b border-slate-100 px-6 py-6"
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

        <div className="px-4 py-5">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Workspace
          </p>

          <nav className="flex gap-2 overflow-x-auto md:flex-col">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex shrink-0 items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-700"
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
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
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 md:px-8">
          <div>
            <p className="text-sm text-slate-500">Your research workspace</p>
            <h1 className="text-lg font-semibold">Welcome back, {displayName}</h1>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-500 sm:block">
              AI-powered discovery
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-700">
              {displayName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl p-5 md:p-8">
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