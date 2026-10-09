
import Link from "next/link";
import { createClient } from "../../lib/supabase/server";

export const dynamic = "force-dynamic";

function formatDate(value: string | null) {
  if (!value) return "Date unavailable";

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatScore(value: number | null) {
  return value == null ? "—" : `${Math.round(value)}%`;
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const [papersResult, favoritesResult, interestsResult, recentResult] =
    await Promise.all([
      supabase
        .from("papers")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id),

      supabase
        .from("papers")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_favorite", true),

      supabase
        .from("user_interests")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("enabled", true),

      supabase
        .from("papers")
        .select(
          "id, title, abstract, url, published_at, semantic_score, llm_relevance_score, primary_topic, summary, is_read, is_favorite, created_at"
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  const stats = [
    {
      label: "Papers collected",
      value: papersResult.count ?? 0,
      description: "Research papers in your library",
      icon: "▤",
      color: "bg-indigo-50 text-indigo-700",
    },
    {
      label: "Saved favorites",
      value: favoritesResult.count ?? 0,
      description: "Papers worth revisiting",
      icon: "☆",
      color: "bg-amber-50 text-amber-700",
    },
    {
      label: "Active interests",
      value: interestsResult.count ?? 0,
      description: "Topics followed by your AI",
      icon: "◎",
      color: "bg-emerald-50 text-emerald-700",
    },
  ];

  const recentPapers = recentResult.data ?? [];

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-600 p-7 text-white shadow-lg md:p-10">
        <div className="relative z-10 max-w-2xl">
          <p className="mb-3 text-sm font-medium text-indigo-100">
            YOUR PERSONAL RESEARCH SPACE
          </p>

          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Discover what matters.
          </h2>

          <p className="mt-4 max-w-xl leading-7 text-indigo-100">
            Spend less time searching and more time understanding the
            research that moves your interests forward.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/dashboard/papers"
              className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50"
            >
              Explore my papers →
            </Link>

            <Link
              href="/dashboard/interests"
              className="rounded-xl border border-white/30 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Manage interests
            </Link>
          </div>
        </div>

        <div className="pointer-events-none absolute -right-12 -top-16 h-64 w-64 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-4 -top-8 h-48 w-48 rounded-full border border-white/10" />
      </section>

      {/* Stats */}
      <section>
        <div className="mb-5">
          <h2 className="text-xl font-bold text-slate-900">
            Your research at a glance
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            An overview of your personal research library.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    {stat.label}
                  </p>
                  <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                    {stat.value}
                  </p>
                </div>

                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl text-2xl ${stat.color}`}
                >
                  {stat.icon}
                </div>
              </div>

              <p className="mt-4 text-sm text-slate-500">
                {stat.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Recent papers */}
      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-5 md:px-7">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Recent research
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              The latest papers in your library.
            </p>
          </div>

          <Link
            href="/dashboard/papers"
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-800"
          >
            View all →
          </Link>
        </div>

        {recentResult.error ? (
          <div className="p-8 text-sm text-red-600">
            Unable to load your papers. Check your Supabase table and access
            policies.
          </div>
        ) : recentPapers.length === 0 ? (
          <div className="px-6 py-14 text-center md:px-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-3xl text-indigo-600">
              ▤
            </div>

            <h3 className="mt-5 text-lg font-semibold text-slate-900">
              Your research journey starts here
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Your library is empty for now. Once papers are saved to your
              account, they will appear here with their relevance scores and
              summaries.
            </p>

            <Link
              href="/dashboard/interests"
              className="mt-6 inline-flex rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              Set up my interests →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentPapers.map((paper) => (
              <article
                key={paper.id}
                className="p-5 transition hover:bg-slate-50/70 md:px-7"
              >
                <div className="flex flex-wrap items-center gap-2">
                  {paper.primary_topic && (
                    <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
                      {paper.primary_topic}
                    </span>
                  )}

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      paper.is_read
                        ? "bg-slate-100 text-slate-500"
                        : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {paper.is_read ? "Read" : "Unread"}
                  </span>

                  {paper.is_favorite && (
                    <span className="text-amber-500" title="Favorite">
                      ★
                    </span>
                  )}
                </div>

                <h3 className="mt-3 font-semibold leading-6 text-slate-900">
                  {paper.title}
                </h3>

                <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                  {paper.summary || paper.abstract || "No abstract available."}
                </p>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                    <span>
                      Published: {formatDate(paper.published_at)}
                    </span>
                    <span>
                      Relevance: {formatScore(paper.llm_relevance_score)}
                    </span>
                  </div>

                  {paper.url && (
                    <a
                      href={paper.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                      Read paper ↗
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Quick actions */}
      <section>
        <h2 className="mb-4 text-lg font-bold text-slate-900">
          Customize your experience
        </h2>

        <div className="grid gap-4 md:grid-cols-2">
          <Link
            href="/dashboard/interests"
            className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50 text-2xl text-violet-700">
                ◎
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">
                  Research interests
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Tell your AI which subjects matter to you.
                </p>
              </div>
            </div>
            <p className="mt-5 text-sm font-semibold text-indigo-600 group-hover:text-indigo-800">
              Configure interests →
            </p>
          </Link>

          <Link
            href="/dashboard/settings"
            className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-2xl text-sky-700">
                ⚙
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">
                  Digest preferences
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Configure your delivery schedule and thresholds.
                </p>
              </div>
            </div>
            <p className="mt-5 text-sm font-semibold text-indigo-600 group-hover:text-indigo-800">
              Manage settings →
            </p>
          </Link>
        </div>
      </section>

      {(papersResult.error ||
        favoritesResult.error ||
        interestsResult.error) && (
        <p className="text-xs text-amber-700">
          Some statistics could not be loaded. Check the Supabase table
          permissions if the numbers seem incorrect.
        </p>
      )}
    </div>
  );
}