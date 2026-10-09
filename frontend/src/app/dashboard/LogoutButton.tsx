
"use client";

import { useState } from "react";
import { createClient } from "../../lib/supabase/client";

export default function LogoutButton() {
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Erreur de déconnexion :", error);
      alert("Impossible de se déconnecter. Réessaie.");
      setLoading(false);
      return;
    }

    window.location.href = "/";
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? "Signing out..." : "↪ Sign out"}
    </button>
  );
}