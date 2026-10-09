
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createClient } from "../../../lib/supabase/client";

type Interest = {
  id: string;
  name: string;
  description: string | null;
  weight: number;
  enabled: boolean;
};

function ImportanceSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const percentage = ((value - 0.1) / (5 - 0.1)) * 100;

  return (
    <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-indigo-50/60 p-5">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <label className="text-sm font-semibold text-slate-800">
            Importance
          </label>
          <p className="mt-1 text-xs text-slate-500">
            Influence this topic&apos;s priority in your research digest.
          </p>
        </div>

        <div className="min-w-16 rounded-xl border border-indigo-100 bg-white px-3 py-2 text-center shadow-sm">
          <span className="text-xl font-bold tabular-nums text-indigo-700">
            {value.toFixed(1)}
          </span>
          <span className="ml-1 text-xs text-slate-400">/ 5</span>
        </div>
      </div>

      <input
        type="range"
        min="0.1"
        max="5"
        step="0.1"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-label="Importance"
        className="importance-slider w-full cursor-pointer"
        style={{
          background: `linear-gradient(to right, #6366f1 0%, #8b5cf6 ${percentage}%, #e2e8f0 ${percentage}%, #e2e8f0 100%)`,
        }}
      />

      <div className="mt-2 flex justify-between text-xs text-slate-400">
        <span>0.1 · Low</span>
        <span>Moderate</span>
        <span>5 · High</span>
      </div>
    </div>
  );
}

export default function InterestsPage() {
  const [interests, setInterests] = useState<Interest[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [weight, setWeight] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const supabase = createClient();

  async function loadInterests(showLoading = false) {
  if (showLoading) {
    setLoading(true);
  }

  const { data, error } = await supabase
    .from("user_interests")
    .select("id, name, description, weight, enabled")
    .order("created_at", { ascending: false });

  if (error) {
    setMessage(`Unable to load interests: ${error.message}`);
  } else {
    setInterests((data ?? []) as Interest[]);
  }

  if (showLoading) {
    setLoading(false);
  }
}

 useEffect(() => {
  let cancelled = false;

  async function fetchInterests() {
    const { data, error } = await supabase
      .from("user_interests")
      .select("id, name, description, weight, enabled")
      .order("created_at", { ascending: false });

    if (cancelled) return;

    if (error) {
      setMessage(`Unable to load interests: ${error.message}`);
    } else {
      setInterests((data ?? []) as Interest[]);
    }

    setLoading(false);
  }

  void fetchInterests();

  return () => {
    cancelled = true;
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

  async function addInterest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim()) {
      setMessage("Please enter an interest name.");
      return;
    }

    setSaving(true);
    setMessage("");

    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      setMessage("Your session has expired. Please sign in again.");
      setSaving(false);
      return;
    }

    const { error } = await supabase.from("user_interests").insert({
      user_id: authData.user.id,
      name: name.trim(),
      description: description.trim() || null,
      weight,
      enabled: true,
    });

    if (error) {
      setMessage(
        error.code === "23505"
          ? "This interest already exists."
          : `Unable to save: ${error.message}`
      );
      setSaving(false);
      return;
    }

    setName("");
    setDescription("");
    setWeight(1);
    setMessage("Interest added successfully.");
    await loadInterests();
    setSaving(false);
  }

  async function toggleInterest(interest: Interest) {
    setMessage("");

    const { error } = await supabase
      .from("user_interests")
      .update({ enabled: !interest.enabled })
      .eq("id", interest.id);

    if (error) {
      setMessage(`Unable to update interest: ${error.message}`);
      return;
    }

    setInterests((current) =>
      current.map((item) =>
        item.id === interest.id
          ? { ...item, enabled: !item.enabled }
          : item
      )
    );
  }

  async function deleteInterest(interest: Interest) {
    if (!window.confirm(`Delete "${interest.name}"?`)) return;

    setMessage("");

    const { error } = await supabase
      .from("user_interests")
      .delete()
      .eq("id", interest.id);

    if (error) {
      setMessage(`Unable to delete interest: ${error.message}`);
      return;
    }

    setInterests((current) =>
      current.filter((item) => item.id !== interest.id)
    );
    setMessage("Interest deleted.");
  }

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm font-medium text-indigo-600">
          PERSONALIZATION
        </p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          My research interests
        </h2>
        <p className="mt-2 max-w-2xl text-slate-500">
          Choose the topics you want ResearchDigest to follow. Your interests
          will help personalize future paper recommendations.
        </p>
      </header>

      {message && (
        <div
          role="status"
          className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700"
        >
          {message}
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 md:p-8">
        <h3 className="text-lg font-bold text-slate-900">
          Add a new interest
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          For example: LLM agents, RAG, computer vision or AI research.
        </p>

        <form onSubmit={addInterest} className="mt-6 space-y-5">
          <div>
            <label
              htmlFor="interest-name"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Interest name
            </label>
            <input
              id="interest-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Retrieval-Augmented Generation"
              maxLength={120}
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <div>
            <label
              htmlFor="interest-description"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Description <span className="text-slate-400">(optional)</span>
            </label>
            <textarea
              id="interest-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe what you want to discover..."
              rows={3}
              maxLength={1000}
              className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <ImportanceSlider value={weight} onChange={setWeight} />

          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving..." : "+ Add interest"}
          </button>
        </form>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-900">
              Your interests
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {interests.length} topic{interests.length !== 1 ? "s" : ""}{" "}
              configured
            </p>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-slate-500">
            Loading your interests...
          </div>
        ) : interests.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
            <div className="text-3xl">◎</div>
            <h4 className="mt-3 font-semibold text-slate-900">
              No interests yet
            </h4>
            <p className="mt-2 text-sm text-slate-500">
              Add your first topic above to start personalizing your research.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {interests.map((interest) => (
              <article
                key={interest.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="break-words font-semibold text-slate-900">
                      {interest.name}
                    </h4>
                    <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-500">
                      {interest.description || "No description provided."}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                      interest.enabled
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {interest.enabled ? "Active" : "Paused"}
                  </span>
                </div>

                <div className="mt-5">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Importance</span>
                    <span className="font-semibold text-slate-700">
                      {Number(interest.weight).toFixed(1)} / 5
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-indigo-600"
                      style={{
                        width: `${Math.min(
                          100,
                          (Number(interest.weight) / 5) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="mt-5 flex gap-3 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() => void toggleInterest(interest)}
                    className="min-h-10 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    {interest.enabled ? "Pause" : "Activate"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void deleteInterest(interest)}
                    className="min-h-10 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}