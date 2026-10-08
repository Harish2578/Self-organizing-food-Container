import type { AiResult } from "../types";

/** Deterministic advisor used when no Gemini key is configured, so the app always works. */
export function ruleBasedAnalysis(p: any): AiResult {
  const chambers: any[] = p.chambers ?? [];
  const gain = (p.adaptive?.avgFreshness ?? 0) - (p.baseline?.avgFreshness ?? 0);
  const worst = [...chambers].sort((a, b) => b.ethylene - a.ethylene)[0];
  const quarantine = chambers.find((c) => c.label === "Quarantine");
  const risks: string[] = [];
  if (worst && worst.ethylene > 10) risks.push(`${worst.label} has high ethylene (${worst.ethylene} ppm); keep its vent and valve fully open.`);
  if (quarantine) risks.push(`${quarantine.items.length} item(s) are quarantined; discard them to stop gas build-up.`);
  if ((p.adaptive?.spoiled ?? 0) > 0) risks.push(`${p.adaptive.spoiled} item(s) are already spoiled in the adaptive container.`);
  if (!risks.length) risks.push("No critical risks detected in the current configuration.");
  return {
    summary: `After ${Math.round((p.hour ?? 0) / 24)} day(s) the self-organizing container keeps average freshness ${gain >= 0 ? gain.toFixed(1) + " points above" : Math.abs(gain).toFixed(1) + " points below"} the conventional fridge, using ${p.adaptive?.reconfigurations ?? 0} partition reconfiguration(s).`,
    risks,
    recommendations: [
      { title: "Use items from the Quarantine chamber first", detail: "Cook or discard the most degraded items before they raise ethylene for neighbours.", priority: quarantine ? "High" : "Low" },
      { title: "Keep ethylene producers isolated", detail: "Bananas, apples and tomatoes should stay in their own zone away from leafy greens and berries.", priority: "Medium" },
      { title: "Batch new groceries", detail: "Add produce in groups to reduce how often partitions must move.", priority: "Low" },
    ],
  };
}
