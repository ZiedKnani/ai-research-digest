
"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "../../../lib/supabase/client";

type Paper = {
  id: string;
  title: string;
  abstract: string | null;
  authors: string[] | null;
  url: string | null;
  published_at: string | null;
  semantic_score: number | null;
  llm_relevance_score: number | null;
  primary_topic: string | null;
  reason: string | null;
  summary: string | null;
  is_read: boolean;
  is_favorite: boolean;
  created_at: string;
};

type Filter = "all" | "unread" | "favorites";

const supabase = createClient();

function formatDate(value: string | null) {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function scoreLabel(value: number | null) {
  if (value === null || value === undefined) return null;
  return `${Math.round(value)}%`;
}

export default function PapersPage() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [topic, setTopic] = useState("all");
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState("relevance");
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchPapers() {
      const { data, error } = await supabase
        .from("papers")
        .select(
          "id, title, abstract, authors, url, published_at, semantic_score, llm_relevance_score, primary_topic, reason, summary, is_read, is_favorite, created_at"
        )
        .order("created_at", { ascending: false })
        .limit(200);

      if (cancelled) return;

      if (error) {
        setErrorMessage(error.message);
      } else {
        setPapers((data ?? []) as Paper[]);
      }

      setLoading(false);
    }

    void fetchPapers();

    return () => {
      cancelled = true;
    };
  }, []);

  const topics = useMemo(
    () =>
      Array.from(
        new Set(
          papers
            .map((paper) => paper.primary_topic?.trim())
            .filter((value): value is string => Boolean(value))
        )
      ).sort((a, b) => a.localeCompare(b)),
    [papers]
  );

  const filteredPapers = useMemo(() => {
    const query = search.trim().toLowerCase();

    const result = papers.filter((paper) => {
      const matchesSearch =
        !query ||
        paper.title.toLowerCase().includes(query) ||
        (paper.abstract ?? "").toLowerCase().includes(query) ||
        (paper.summary ?? "").toLowerCase().includes(query) ||
        (paper.authors ?? []).some((author) =>
          author.toLowerCase().includes(query)
        );

      const matchesTopic =
        topic === "all" || paper.primary_topic === topic;

      const matchesFilter =
        filter === "all" ||
        (filter === "unread" && !paper.is_read) ||
        (filter === "favorites" && paper.is_favorite);

      return matchesSearch && matchesTopic && matchesFilter;
    });

    result.sort((a, b) => {
      if (sort === "newest") {
        return (
          new Date(b.published_at ?? b.created_at).getTime() -
          new Date(a.published_at ?? a.created_at).getTime()
        );
      }

      if (sort === "oldest") {
        return (
          new Date(a.published_at ?? a.created_at).getTime() -
          new Date(b.published_at ?? b.created_at).getTime()
        );
      }

      return (
        (b.llm_relevance_score ?? b.semantic_score ?? -1) -
        (a.llm_relevance_score ?? a.semantic_score ?? -1)
      );
    });

    return result;
  }, [papers, search, topic, filter, sort]);

  async function updatePaper(
    paper: Paper,
    field: "is_read" | "is_favorite"
  ) {
    setBusyId(paper.id);
    setNotice("");
    setErrorMessage("");

    const nextValue = !paper[field];

    const { error } = await supabase
      .from("papers")
      .update({ [field]: nextValue })
      .eq("id", paper.id);

    if (error) {
      setErrorMessage(`Unable to update article: ${error.message}`);
    } else {
      setPapers((current) =>
        current.map((item) =>
          item.id === paper.id ? { ...item, [field]: nextValue } : item
        )
      );
      setNotice(
        field === "is_favorite"
          ? nextValue
            ? "Article added to favorites."
            : "Article removed from favorites."
          : nextValue
            ? "Article marked as read."
            : "Article marked as unread."
      );
    }

    setBusyId(null);
  }

  const unreadCount = papers.filter((paper) => !paper.is_read).length;
  const favoriteCount = papers.filter((paper) => paper.is_favorite).length;

  return (
    <div className="space-y-8">
      {/* Page heading */}
      <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-indigo-600">
            <span className="h-2 w-2 rounded-full bg-indigo-600" />
            Your research library
          </div>

          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            Research Papers
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Discover, organize and revisit the scientific research that
            matters to you.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <p className="text-xs text-slate-500">Total papers</p>
            <p className="mt-1 text-xl font-bold text-slate-900">
              {papers.length}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <p className="text-xs text-slate-500">Unread</p>
            <p className="mt-1 text-xl font-bold text-indigo-600">
              {unreadCount}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <p className="text-xs text-slate-500">Favorites</p>
            <p className="mt-1 text-xl font-bold text-rose-500">
              {favoriteCount}
            </p>
          </div>
        </div>
      </section>

      {/* Search and filters */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="relative min-w-0 flex-1">
            <svg
              className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m16 16 4 4" />
            </svg>

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search titles, abstracts or authors..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              aria-label="Filter by topic"
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
            >
              <option value="all">All topics</option>
              {topics.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              aria-label="Sort papers"
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
            >
              <option value="relevance">Most relevant</option>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          {(
            [
              ["all", "All papers"],
              ["unread", "Unread"],
              ["favorites", "Favorites"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                filter === value
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {label}
            </button>
          ))}

          <span className="ml-auto text-xs text-slate-400">
            {filteredPapers.length} result
            {filteredPapers.length === 1 ? "" : "s"}
          </span>
        </div>
      </section>

      {/* Feedback */}
      {errorMessage && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {errorMessage}
        </div>
      )}

      {notice && (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
        >
          {notice}
        </div>
      )}

      {/* Paper list */}
      {loading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6"
            >
              <div className="h-4 w-28 rounded bg-slate-200" />
              <div className="mt-4 h-6 w-3/4 rounded bg-slate-200" />
              <div className="mt-3 h-4 w-full rounded bg-slate-100" />
              <div className="mt-2 h-4 w-2/3 rounded bg-slate-100" />
            </div>
          ))}
        </div>
      ) : filteredPapers.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-3xl">
            {papers.length === 0 ? "⌕" : "⌕"}
          </div>

          <h3 className="mt-5 text-lg font-semibold text-slate-900">
            {papers.length === 0
              ? "Your research library is waiting"
              : "No papers found"}
          </h3>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            {papers.length === 0
              ? "Once your research pipeline saves papers to your account, they will appear here. Add your interests to prepare your personalized discovery feed."
              : "Try another search term or change the topic and filter settings."}
          </p>

          {papers.length === 0 && (
            <a
              href="/dashboard/interests"
              className="mt-6 inline-flex items-center rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              Manage my interests →
            </a>
          )}

          {papers.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setTopic("all");
                setFilter("all");
              }}
              className="mt-6 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Clear filters
            </button>
          )}
        </section>
      ) : (
        <div className="space-y-4">
          {filteredPapers.map((paper) => {
            const score =
              paper.llm_relevance_score ?? paper.semantic_score;

            return (
              <article
                key={paper.id}
                className={`rounded-2xl border bg-white p-5 shadow-sm transition hover:border-indigo-200 hover:shadow-md sm:p-6 ${
                  paper.is_read
                    ? "border-slate-200"
                    : "border-indigo-100"
                }`}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      {paper.primary_topic && (
                        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                          {paper.primary_topic}
                        </span>
                      )}

                      {!paper.is_read && (
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                          Unread
                        </span>
                      )}

                      {paper.is_favorite && (
                        <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-medium text-rose-600">
                          ♥ Favorite
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-bold leading-7 text-slate-900 sm:text-xl">
                      {paper.title}
                    </h3>

                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                      <span>
                        {formatDate(paper.published_at ?? paper.created_at)}
                      </span>

                      {paper.authors && paper.authors.length > 0 && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span>
                            {paper.authors.slice(0, 3).join(", ")}
                            {paper.authors.length > 3 ? " et al." : ""}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {score !== null && score !== undefined && (
                    <div className="flex shrink-0 items-center gap-3 rounded-xl bg-indigo-50 px-4 py-3 sm:flex-col sm:gap-1 sm:text-center">
                      <span className="text-2xl font-bold text-indigo-700">
                        {scoreLabel(score)}
                      </span>
                      <span className="text-xs font-medium text-indigo-600">
                        Relevance
                      </span>
                    </div>
                  )}
                </div>

                <p className="mt-4 text-sm leading-7 text-slate-600">
                  {paper.summary ||
                    paper.abstract ||
                    "No summary is available for this paper yet."}
                </p>

                {paper.reason && (
                  <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Why it matches
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      {paper.reason}
                    </p>
                  </div>
                )}

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busyId === paper.id}
                      onClick={() => void updatePaper(paper, "is_favorite")}
                      className={`rounded-xl border px-3 py-2 text-sm font-medium transition disabled:opacity-50 ${
                        paper.is_favorite
                          ? "border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {paper.is_favorite ? "♥ Saved" : "♡ Add to favorites"}
                    </button>

                    <button
                      type="button"
                      disabled={busyId === paper.id}
                      onClick={() => void updatePaper(paper, "is_read")}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                    >
                      {paper.is_read ? "Mark as unread" : "Mark as read"}
                    </button>
                  </div>

                  {paper.url ? (
                    <a
                      href={paper.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
                    >
                      Read paper <span aria-hidden="true">↗</span>
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400">
                      No paper link available
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <p className="text-center text-xs text-slate-400">
        Showing up to 200 saved papers. Relevance scores are displayed as
        percentages.
      </p>
    </div>
  );
}