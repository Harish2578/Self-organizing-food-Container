export interface FoodProfile {
  id: string;
  name: string;
  emoji: string;
  /** Ethylene output (relative units per item per hour). >0.3 = producer */
  ethyleneProducer: number;
  /** 0..1, >=0.5 = ethylene-sensitive */
  ethyleneSensitivity: number;
  idealTemp: number; // deg C
  idealHumidity: number; // % RH
  shelfLifeDays: number; // at ideal conditions
  priceUsd: number; // illustrative retail price per item
}

export interface FoodItem {
  uid: string;
  profileId: string;
  freshness: number; // 0..100 (ground truth, hidden from the controller)
  ageHours: number;
}

export interface ChamberEnv {
  temp: number;
  humidity: number;
  ethylene: number; // ppm
  co2: number; // ppm
}

export interface Chamber {
  id: number;
  label: string;
  itemUids: string[];
  start: number; // 0..1 position of left partition along the guide rail
  end: number; // 0..1
  env: ChamberEnv;
  target: { temp: number; humidity: number; ethylene: number };
  fan: number; // 0..1
  vent: number; // 0..1
  valve: number; // 0..1
}

export type Mode = "adaptive" | "static";
export type Condition = "Fresh" | "Aging" | "Near Spoilage" | "Spoiled";

export interface SimState {
  hour: number;
  mode: Mode;
  items: FoodItem[];
  chambers: Chamber[];
  reconfigurations: number;
  partitionTravel: number; // in container-widths
  energyWh: number; // cumulative energy use
  outageHours: number; // remaining hours of power cut (backup battery mode)
  log: string[];
}

export interface Classification {
  visual: number;
  gas: number;
  env: number;
  fused: number;
  condition: Condition;
}

export type ScenarioKind = "home" | "supermarket" | "stress";

export interface AiResult {
  summary: string;
  risks: string[];
  recommendations: { title: string; detail: string; priority: "High" | "Medium" | "Low" }[];
}

export interface HistoryPoint {
  hour: number;
  adaptive: number;
  baseline: number;
}
