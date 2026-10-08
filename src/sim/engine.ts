/**
 * Digital-twin engine for the self-organizing food storage container.
 *
 * One call to step() = one simulated hour of the closed control loop:
 *   1. SENSE     - gas / humidity / temperature / camera readings per chamber
 *   2. CLASSIFY  - fuse the readings into a freshness estimate + condition
 *   3. PLAN      - group compatible foods, isolate ethylene producers & spoiling items
 *   4. ACTUATE   - move partitions along the guide rail, set fan / vent / valve per chamber
 *   5. PHYSICS   - update each micro-environment and age every food item
 */
import { FOODS } from "../data/foods";
import type { Chamber, ChamberEnv, Classification, Condition, FoodItem, FoodProfile, Mode, ScenarioKind, SimState } from "../types";

export const MAX_CHAMBERS = 5;
export const MIN_WIDTH = 0.14;
export const QUARANTINE_BELOW = 30; // estimated freshness that triggers isolation
export const SPOILED_BELOW = 20;
export const CONTAINER_CM = 60;
export const AMBIENT = 24; // kitchen / store temperature during a power cut

const ROOM: ChamberEnv = { temp: 12, humidity: 70, ethylene: 0, co2: 400 }; // groceries arriving from the shop

export const getProfile = (id: string): FoodProfile => FOODS.find((f) => f.id === id)!;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

let counter = 0;
export function newItem(profileId: string): FoodItem {
  counter += 1;
  return { uid: `item-${counter}`, profileId, freshness: 100, ageHours: 0 };
}

export const SCENARIOS: Record<ScenarioKind, { label: string; spec: [string, number][] }> = {
  home: { label: "Household basket", spec: [["banana", 3], ["apple", 2], ["tomato", 2], ["lettuce", 2], ["spinach", 1], ["strawberry", 2], ["cucumber", 1], ["potato", 2], ["onion", 1]] },
  supermarket: { label: "Supermarket produce bay", spec: [["banana", 8], ["apple", 8], ["tomato", 6], ["lettuce", 6], ["spinach", 4], ["strawberry", 6], ["cucumber", 4], ["carrot", 5], ["potato", 6], ["onion", 4]] },
  stress: { label: "Ethylene stress test", spec: [["banana", 6], ["apple", 5], ["tomato", 4], ["lettuce", 4], ["spinach", 3], ["strawberry", 4], ["carrot", 2]] },
};

export function makeScenario(kind: ScenarioKind = "home"): FoodItem[] {
  return SCENARIOS[kind].spec.flatMap(([id, n]) => Array.from({ length: n }, () => newItem(id)));
}

/* ---------- 1 + 2. SENSE & CLASSIFY (multi-sensor fusion) ---------- */
export function classify(item: FoodItem, env: ChamberEnv, hour: number): Classification {
  const p = getProfile(item.profileId);
  const seed = Number(item.uid.split("-")[1]) || 0;
  const visual = clamp(item.freshness + 3 * Math.sin(hour * 0.7 + seed), 0, 100); // camera module
  const gas = clamp(item.freshness - p.ethyleneSensitivity * env.ethylene * 0.3, 0, 100); // gas sensor
  const envScore = clamp(100 - 4 * Math.abs(env.temp - p.idealTemp) - Math.abs(env.humidity - p.idealHumidity), 0, 100); // temp + humidity
  const fused = 0.55 * visual + 0.35 * gas + 0.1 * envScore;
  return { visual, gas, env: envScore, fused, condition: toCondition(fused) };
}

export function toCondition(score: number): Condition {
  if (score > 70) return "Fresh";
  if (score > 45) return "Aging";
  if (score >= SPOILED_BELOW) return "Near Spoilage";
  return "Spoiled";
}

/* ---------- 3. PLAN (grouping + partition layout) ---------- */
interface Group { items: FoodItem[]; quarantine: boolean }

function ethyleneConflict(a: FoodProfile, b: FoodProfile) {
  return (a.ethyleneProducer > 0.3 && b.ethyleneSensitivity >= 0.5) || (b.ethyleneProducer > 0.3 && a.ethyleneSensitivity >= 0.5);
}

function compatible(group: FoodItem[], item: FoodItem): boolean {
  const p = getProfile(item.profileId);
  const gp = group.map((i) => getProfile(i.profileId));
  const t = gp.reduce((s, x) => s + x.idealTemp, 0) / gp.length;
  const h = gp.reduce((s, x) => s + x.idealHumidity, 0) / gp.length;
  if (Math.abs(p.idealTemp - t) > 4 || Math.abs(p.idealHumidity - h) > 12) return false;
  return !gp.some((g) => ethyleneConflict(p, g));
}

export function planGroups(items: FoodItem[], estimate: (i: FoodItem) => number): Group[] {
  const quarantine = items.filter((i) => estimate(i) < QUARANTINE_BELOW);
  const rest = items
    .filter((i) => estimate(i) >= QUARANTINE_BELOW)
    .sort((a, b) => getProfile(a.profileId).idealTemp - getProfile(b.profileId).idealTemp);

  let groups: FoodItem[][] = [];
  for (const it of rest) {
    const g = groups.find((x) => compatible(x, it));
    if (g) g.push(it);
    else groups.push([it]);
  }
  const limit = MAX_CHAMBERS - (quarantine.length ? 1 : 0);
  while (groups.length > limit) {
    groups.sort((a, b) => a.length - b.length);
    const [a, b, ...r] = groups;
    groups = [[...a, ...b], ...r]; // merge the two smallest groups
  }
  const out: Group[] = groups.map((items) => ({ items, quarantine: false }));
  if (quarantine.length) out.push({ items: quarantine, quarantine: true });
  return out.length ? out : [{ items: [], quarantine: false }];
}

function labelFor(g: Group): string {
  if (g.quarantine) return "Quarantine";
  const ps = g.items.map((i) => getProfile(i.profileId));
  if (ps.some((p) => p.ethyleneSensitivity >= 0.5)) return "Sensitive zone";
  if (ps.some((p) => p.ethyleneProducer > 0.3)) return "Ethylene zone";
  return "General zone";
}

function inheritEnv(items: FoodItem[], prev: Chamber[]): ChamberEnv {
  const envs = items.map((i) => prev.find((c) => c.itemUids.includes(i.uid))?.env).filter(Boolean) as ChamberEnv[];
  const pool = envs.length ? envs : prev.map((c) => c.env);
  if (!pool.length) return { ...ROOM };
  const avg = (k: keyof ChamberEnv) => pool.reduce((s, e) => s + e[k], 0) / pool.length;
  return { temp: avg("temp"), humidity: avg("humidity"), ethylene: avg("ethylene"), co2: avg("co2") };
}

function layout(groups: Group[], prev: Chamber[]): Chamber[] {
  const weights = groups.map((g) => Math.max(1, g.items.length));
  const total = weights.reduce((a, b) => a + b, 0);
  let widths = weights.map((w) => Math.max(MIN_WIDTH, w / total));
  const sum = widths.reduce((a, b) => a + b, 0);
  widths = widths.map((w) => w / sum);
  let cursor = 0;
  return groups.map((g, idx) => {
    const start = cursor;
    cursor += widths[idx];
    return {
      id: idx,
      label: labelFor(g),
      itemUids: g.items.map((i) => i.uid),
      start,
      end: idx === groups.length - 1 ? 1 : cursor,
      env: inheritEnv(g.items, prev),
      target: { temp: ROOM.temp, humidity: ROOM.humidity, ethylene: 15 },
      fan: 0.3, vent: 0.1, valve: 0.3,
    };
  });
}

const signature = (arrs: string[][]) => arrs.map((a) => [...a].sort().join(",")).sort().join("|");

function travel(oldC: Chamber[], newC: Chamber[]): number {
  const b = (cs: Chamber[]) => cs.slice(0, -1).map((c) => c.end);
  const o = b(oldC), n = b(newC);
  let t = 0;
  for (let i = 0; i < Math.max(o.length, n.length); i++) t += Math.abs((n[i] ?? 1) - (o[i] ?? 1));
  return t;
}

/* ---------- 4. ACTUATE (airflow controller) ---------- */
function control(c: Chamber, items: FoodItem[], mode: Mode) {
  if (mode === "static") {
    // conventional fridge: one fixed setpoint, almost no gas exchange
    c.target = { temp: 4, humidity: 70, ethylene: 10 };
    c.fan = 0.3; c.vent = 0.05; c.valve = 0.2;
    return;
  }
  if (!items.length) {
    c.target = { temp: 8, humidity: 70, ethylene: 15 };
    c.fan = 0.1; c.vent = 0.1; c.valve = 0.1;
    return;
  }
  const ps = items.map((i) => getProfile(i.profileId));
  const avg = (k: "idealTemp" | "idealHumidity") => ps.reduce((s, p) => s + p[k], 0) / ps.length;
  const sensitive = ps.some((p) => p.ethyleneSensitivity >= 0.5);
  const quarantine = c.label === "Quarantine";
  c.target = { temp: quarantine ? 2 : avg("idealTemp"), humidity: avg("idealHumidity"), ethylene: sensitive ? 1 : 15 };
  const dt = Math.abs(c.env.temp - c.target.temp);
  const dh = Math.abs(c.env.humidity - c.target.humidity);
  const high = c.env.ethylene > c.target.ethylene;
  c.fan = clamp(dt / 8 + dh / 50, 0.1, 1);
  c.vent = high ? clamp((c.env.ethylene - c.target.ethylene) / 10, 0.2, 1) : 0.1;
  c.valve = high ? 1 : 0.3;
}

/* ---------- state management ---------- */
export function createState(items: FoodItem[], mode: Mode): SimState {
  const its: FoodItem[] = structuredClone(items);
  const s: SimState = { hour: 0, mode, items: its, chambers: [], reconfigurations: 0, partitionTravel: 0, energyWh: 0, outageHours: 0, log: [] };
  if (mode === "static") {
    s.chambers = [{
      id: 0, label: "Single compartment", itemUids: its.map((i) => i.uid), start: 0, end: 1,
      env: { ...ROOM }, target: { temp: 4, humidity: 70, ethylene: 10 }, fan: 0.3, vent: 0.05, valve: 0.2,
    }];
  } else {
    s.chambers = layout(planGroups(its, (i) => i.freshness), []);
  }
  return s;
}

export function addItem(state: SimState, item: FoodItem): SimState {
  const s = structuredClone(state);
  s.items.push(structuredClone(item));
  if (s.mode === "static") s.chambers[0].itemUids.push(item.uid);
  return s;
}

export function discardSpoiled(state: SimState): SimState {
  const s = structuredClone(state);
  const dead = new Set(s.items.filter((i) => i.freshness < SPOILED_BELOW).map((i) => i.uid));
  s.items = s.items.filter((i) => !dead.has(i.uid));
  s.chambers.forEach((c) => (c.itemUids = c.itemUids.filter((u) => !dead.has(u))));
  return s;
}

/* ---------- 5. PHYSICS: advance one simulated hour ---------- */
export function step(state: SimState): SimState {
  const s: SimState = structuredClone(state);
  s.hour += 1;
  const byUid = new Map(s.items.map((i) => [i.uid, i]));

  if (s.mode === "adaptive") {
    const envOf = new Map<string, ChamberEnv>();
    s.chambers.forEach((c) => c.itemUids.forEach((u) => envOf.set(u, c.env)));
    const groups = planGroups(s.items, (i) => classify(i, envOf.get(i.uid) ?? ROOM, s.hour).fused);
    if (signature(groups.map((g) => g.items.map((i) => i.uid))) !== signature(s.chambers.map((c) => c.itemUids))) {
      const next = layout(groups, s.chambers);
      const t = travel(s.chambers, next);
      s.partitionTravel += t;
      s.energyWh += t * 8; // partition drive motors
      s.reconfigurations += 1;
      s.log = [`Hour ${s.hour}: partitions moved -> ${next.length} chamber(s)`, ...s.log].slice(0, 8);
      s.chambers = next;
    }
  }

  for (const c of s.chambers) {
    const items = c.itemUids.map((u) => byUid.get(u)).filter(Boolean) as FoodItem[];
    control(c, items, s.mode);
    const outage = s.outageHours > 0;
    if (outage) {
      // power cut: no cooling. The adaptive container keeps fans/vents alive on its backup battery.
      c.fan = s.mode === "adaptive" ? 0.3 : 0;
      c.vent = s.mode === "adaptive" ? Math.max(c.vent, 0.5) : 0.05;
    }
    // shared cooling system: ~8 W holding load (+1.5 W per extra zone), fans 1.5 W, vents 0.5 W at full output
    const hold = s.mode === "adaptive" ? (8 + 1.5 * (s.chambers.length - 1)) / s.chambers.length : 8;
    s.energyWh += 1.5 * c.fan + 0.5 * c.vent + (outage ? 0 : hold + 10 * Math.max(0, c.env.temp - c.target.temp));

    const width = Math.max(0.2, c.end - c.start);
    const rate = outage ? 0.04 : 0.2 + 0.6 * c.fan;
    c.env.temp += ((outage ? AMBIENT : c.target.temp) - c.env.temp) * rate;
    c.env.humidity += (c.target.humidity - c.env.humidity) * rate * 0.6;

    let prod = 0;
    for (const it of items) {
      const p = getProfile(it.profileId);
      prod += p.ethyleneProducer * (1 + (100 - it.freshness) / 40) + (it.freshness < 40 ? 0.3 : 0);
    }
    const clear = 0.04 + 0.5 * c.vent * (0.4 + 0.6 * c.valve);
    c.env.ethylene = clamp((c.env.ethylene + prod / (width * 6)) * (1 - clear), 0, 100);
    c.env.co2 = clamp(400 + (c.env.co2 - 400 + (items.length * 20) / (width * 2 + 0.5)) * (1 - clear), 400, 5000);

    for (const it of items) {
      const p = getProfile(it.profileId);
      const base = 100 / (p.shelfLifeDays * 24 * 1.5); // shelf life ~ time until the item starts to degrade
      const mult = 1 + 0.12 * Math.abs(c.env.temp - p.idealTemp) + 0.02 * Math.abs(c.env.humidity - p.idealHumidity) + p.ethyleneSensitivity * 0.04 * c.env.ethylene;
      it.freshness = clamp(it.freshness - base * mult, 0, 100);
      it.ageHours += 1;
    }
  }
  if (s.outageHours > 0) s.outageHours -= 1;
  return s;
}

/* ---------- metrics ---------- */
export const avgFreshness = (s: SimState) =>
  s.items.length ? s.items.reduce((a, i) => a + i.freshness, 0) / s.items.length : 0;
export const spoiledCount = (s: SimState) => s.items.filter((i) => i.freshness < SPOILED_BELOW).length;

/* ---------- user-triggered disturbances ---------- */
export function openLid(state: SimState): SimState {
  const s = structuredClone(state);
  s.chambers.forEach((c) => {
    c.env.temp += 4;
    c.env.humidity = Math.max(40, c.env.humidity - 8);
    c.env.ethylene *= 0.5;
  });
  s.log = [`Hour ${s.hour}: lid opened (warm air + gas exchange)`, ...s.log].slice(0, 8);
  return s;
}

export function startOutage(state: SimState, hours = 6): SimState {
  const s = structuredClone(state);
  s.outageHours = hours;
  s.log = [`Hour ${s.hour}: ${hours}h power cut`, ...s.log].slice(0, 8);
  return s;
}

/* ---------- impact metrics ---------- */
export const retainedValue = (s: SimState) =>
  s.items.reduce((a, i) => a + getProfile(i.profileId).priceUsd * (i.freshness / 100), 0);
export const wastedKg = (s: SimState) => s.items.reduce((a, i) => a + 0.25 * (1 - i.freshness / 100), 0); // ~250 g per item
export const conditionCounts = (s: SimState): Record<Condition, number> => {
  const out: Record<Condition, number> = { Fresh: 0, Aging: 0, "Near Spoilage": 0, Spoiled: 0 };
  s.items.forEach((i) => (out[toCondition(i.freshness)] += 1));
  return out;
};
