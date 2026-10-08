import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import type { AiResult, SimState } from "../types";
import { avgFreshness, getProfile, spoiledCount } from "../sim/engine";
import { ruleBasedAnalysis } from "../sim/advisor";

const PRIORITY: Record<string, string> = {
  High: "bg-red-500/25 text-red-300",
  Medium: "bg-amber-400/25 text-amber-300",
  Low: "bg-emerald-400/25 text-emerald-300",
};

export default function AiPanel({ adaptive, baseline }: { adaptive: SimState; baseline: SimState }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AiResult | null>(null);
  const [source, setSource] = useState<string>("");

  async function analyze() {
    setLoading(true);
    setError(null);
    const metrics = (s: SimState) => ({
      avgFreshness: +avgFreshness(s).toFixed(1),
      spoiled: spoiledCount(s),
      reconfigurations: s.reconfigurations,
    });
    const payload = {
      hour: adaptive.hour,
      adaptive: metrics(adaptive),
      baseline: metrics(baseline),
      chambers: adaptive.chambers.map((c) => ({
        label: c.label,
        items: c.itemUids.map((u) => getProfile(adaptive.items.find((i) => i.uid === u)!.profileId).name),
        temp: +c.env.temp.toFixed(1),
        humidity: +c.env.humidity.toFixed(0),
        ethylene: +c.env.ethylene.toFixed(1),
        fan: +c.fan.toFixed(2),
        vent: +c.vent.toFixed(2),
      })),
    };
    try {
      const res = await fetch("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      setResult(data.result);
      setSource(data.source);
    } catch (e: any) {
      // No Gemini server reachable (e.g. static hosting): use the built-in advisor in the browser
      setResult(ruleBasedAnalysis(payload));
      setSource("rule_based");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold text-white">AI advisor</h3>
        <button
          onClick={analyze}
          disabled={loading}
          className="btn btn-primary disabled:opacity-60"
        >
          {loading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />} Analyze current state
        </button>
      </div>
      {error && <p className="text-sm text-red-300">{error}</p>}
      {!result && !error && <p className="text-sm text-slate-400">Ask Gemini to review the live chamber readings and suggest actions.</p>}
      {result && (
        <div className="space-y-3 text-sm">
          <p className="text-slate-200">{result.summary}</p>
          <ul className="list-disc space-y-1 pl-5 text-slate-300">
            {result.risks.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
          <div className="grid gap-2 md:grid-cols-3">
            {result.recommendations.map((r, i) => (
              <div key={i} className="rounded-lg border border-white/10 bg-white/5 p-3">
                <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${PRIORITY[r.priority] ?? PRIORITY.Low}`}>{r.priority}</span>
                <p className="mt-1 font-medium">{r.title}</p>
                <p className="text-xs text-slate-300">{r.detail}</p>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-slate-500">Source: {source === "gemini" ? "Gemini" : "built-in rule-based advisor (no Gemini server connected)"}</p>
        </div>
      )}
    </div>
  );
}
