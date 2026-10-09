
"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../../lib/supabase/client";

type Settings = {
  email_digest_enabled: boolean;
  digest_frequency: "daily" | "weekly" | "manual";
  digest_time: string;
  timezone: string;
  semantic_threshold: number;
  llm_threshold: number;
};

function ThresholdSlider({
  label,
  description,
  value,
  min,
  max,
  accent,
  onChange,
}: {
  label: string;
  description: string;
  value: number;
  min: number;
  max: number;
  accent: string;
  onChange: (value: number) => void;
}) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <label className="font-semibold text-slate-800">{label}</label>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>

        <span
          className="min-w-16 rounded-xl border px-3 py-2 text-center text-sm font-bold shadow-sm"
          style={{
            backgroundColor: `${accent}1A`,
            borderColor: `${accent}33`,
            color: accent,
          }}
        >
          {value}
        </span>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step="1"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-label={label}
        className="importance-slider w-full cursor-pointer"
        style={{
          background: `linear-gradient(to right, ${accent} 0%, ${accent} ${percentage}%, #e2e8f0 ${percentage}%, #e2e8f0 100%)`,
        }}
      />

      <div className="mt-2 flex justify-between text-xs text-slate-400">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

const defaultSettings: Settings = {
  email_digest_enabled: true,
  digest_frequency: "daily",
  digest_time: "08:00",
  timezone: "Africa/Tunis",
  semantic_threshold: 30,
  llm_threshold: 60,
};

const supabase = createClient();

const timezones = [
  "Africa/Tunis",
  "Europe/Paris",
  "Europe/London",
  "Europe/Berlin",
  "America/New_York",
  "America/Los_Angeles",
  "Asia/Dubai",
  "Asia/Tokyo",
  "UTC",
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (cancelled) return;

      if (authError || !authData.user) {
        setErrorMessage("Your session has expired. Please sign in again.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("user_settings")
        .select(
          "email_digest_enabled, digest_frequency, digest_time, timezone, semantic_threshold, llm_threshold"
        )
        .eq("user_id", authData.user.id)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        setErrorMessage(`Unable to load settings: ${error.message}`);
      } else if (data) {
        setSettings({
          email_digest_enabled: data.email_digest_enabled ?? true,
          digest_frequency: data.digest_frequency ?? "daily",
          digest_time: String(data.digest_time ?? "08:00").slice(0, 5),
          timezone: data.timezone ?? "Africa/Tunis",
          semantic_threshold: Number(data.semantic_threshold ?? 30),
          llm_threshold: Number(data.llm_threshold ?? 60),
        });
      }

      setLoading(false);
    }

    void loadSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  function updateSetting<K extends keyof Settings>(
    key: K,
    value: Settings[K]
  ) {
    setSettings((current) => ({ ...current, [key]: value }));
    setMessage("");
    setErrorMessage("");
  }

  async function saveSettings(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setErrorMessage("");

    const { data: authData, error: authError } =
      await supabase.auth.getUser();

    if (authError || !authData.user) {
      setErrorMessage("Your session has expired. Please sign in again.");
      setSaving(false);
      return;
    }

    const payload = {
      user_id: authData.user.id,
      ...settings,
      digest_time: settings.digest_time.length === 5
        ? `${settings.digest_time}:00`
        : settings.digest_time,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("user_settings")
      .upsert(payload, { onConflict: "user_id" });

    if (error) {
      setErrorMessage(`Unable to save settings: ${error.message}`);
    } else {
      setMessage("Your settings have been saved successfully.");
    }

    setSaving(false);
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-56 animate-pulse rounded bg-slate-200" />
        <div className="h-64 animate-pulse rounded-2xl bg-white" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <section>
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-indigo-600">
          <span className="h-2 w-2 rounded-full bg-indigo-600" />
          Personalization
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">
          Digest Settings
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Choose when you receive research updates and how the AI selects
          papers for your personalized digest.
        </p>
      </section>

      {errorMessage && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {errorMessage}
        </div>
      )}

      {message && (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
        >
          {message}
        </div>
      )}

      <form onSubmit={saveSettings} className="space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-8">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-900">
              Email delivery
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Configure your research digest schedule.
            </p>
          </div>

          <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div>
              <p className="font-semibold text-slate-800">
                Enable email digest
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Receive research updates by email.
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={settings.email_digest_enabled}
              onClick={() =>
                updateSetting(
                  "email_digest_enabled",
                  !settings.email_digest_enabled
                )
              }
              className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                settings.email_digest_enabled
                  ? "bg-indigo-600"
                  : "bg-slate-300"
              }`}
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
                  settings.email_digest_enabled
                    ? "left-6"
                    : "left-1"
                }`}
              />
            </button>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="frequency"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Delivery frequency
              </label>
              <select
                id="frequency"
                value={settings.digest_frequency}
                onChange={(event) =>
                  updateSetting(
                    "digest_frequency",
                    event.target.value as Settings["digest_frequency"]
                  )
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="manual">Manual only</option>
              </select>
              <p className="mt-2 text-xs text-slate-500">
                Manual mode disables scheduled delivery.
              </p>
            </div>

            <div>
              <label
                htmlFor="digest-time"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Preferred delivery time
              </label>
              <input
                id="digest-time"
                type="time"
                value={settings.digest_time}
                onChange={(event) =>
                  updateSetting("digest_time", event.target.value)
                }
                disabled={settings.digest_frequency === "manual"}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="timezone"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Timezone
              </label>
              <select
                id="timezone"
                value={settings.timezone}
                onChange={(event) =>
                  updateSetting("timezone", event.target.value)
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
              >
                {!timezones.includes(settings.timezone) && (
                  <option value={settings.timezone}>
                    {settings.timezone}
                  </option>
                )}
                {timezones.map((zone) => (
                  <option key={zone} value={zone}>
                    {zone}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-slate-500">
                Delivery time is interpreted in this timezone.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-900">
              AI relevance
            </h3>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Adjust how selective your research pipeline should be.
              Higher thresholds generally produce fewer, more selective
              recommendations.
            </p>
          </div>

          <div className="space-y-5">
            <ThresholdSlider
              label="Semantic similarity threshold"
              description="Initial filter based on your interests."
              value={settings.semantic_threshold}
              min={0}
              max={100}
              accent="#4f46e5"
              onChange={(value) => updateSetting("semantic_threshold", value)}
            />

            <ThresholdSlider
              label="AI relevance threshold"
              description="Minimum score required after AI evaluation."
              value={settings.llm_threshold}
              min={0}
              max={100}
              accent="#8b5cf6"
              onChange={(value) => updateSetting("llm_threshold", value)}
            />
          </div>

          <div className="mt-6 rounded-xl border border-amber-100 bg-amber-50 p-4">
            <p className="text-sm leading-6 text-amber-900">
              These values are saved to your account. Your n8n workflow
              must read them and apply them for changes to affect actual
              paper selection and email delivery.
            </p>
          </div>
        </section>

        <div className="flex flex-col-reverse justify-between gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => {
              setSettings(defaultSettings);
              setMessage("");
              setErrorMessage("");
            }}
            className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Reset form
          </button>

          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving settings..." : "Save settings"}
          </button>
        </div>
      </form>
    </div>
  );
}