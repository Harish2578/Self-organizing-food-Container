# Self-Organizing Food Storage Container — Digital Twin

An interactive simulator of a food container that **senses** how each item is spoiling, **moves its internal
partitions** along a guide rail, and **steers airflow** (fan / vent / valve) to create a separate
micro-environment for every group of foods. Next to it runs a conventional single-compartment fridge on the
same groceries, so the benefit is visible in real time. An optional Gemini-powered advisor reviews the live state.

Built on the Google AI Studio stack: React 19 + Vite + Tailwind 4 + Express + `@google/genai`.

## How it works

Each simulated hour runs one closed control loop (`src/sim/engine.ts`):

| Stage | What happens |
|-------|--------------|
| Sense | gas (ethylene / CO₂), humidity, temperature and camera readings per chamber |
| Classify | readings are fused into a freshness estimate → *Fresh / Aging / Near Spoilage / Spoiled* |
| Plan | foods are grouped by compatible temperature and humidity; ethylene producers are kept apart from sensitive foods; items below the quarantine threshold get their own chamber |
| Actuate | partitions slide to new positions; fan, vent and valve are set per chamber to hit its targets |
| Physics | each chamber's temperature, humidity, ethylene and CO₂ are updated and every item ages accordingly |

The conventional fridge uses one fixed setpoint (4 °C / 70 % RH) with almost no gas exchange.

> The spoilage and gas models are deliberately simplified and illustrative. They are not food-safety guidance.

## Modules

| Tab | What you get |
|-----|--------------|
| Overview | Animated adaptive container vs conventional fridge, live chamber cards, freshness chart, alert feed |
| Sensor Fusion | Per-item table showing camera, gas and temp/humidity scores fused into one estimate (vs hidden true freshness) |
| Impact & Energy | Food waste avoided, value preserved, CO2e avoided, energy use, condition breakdown chart |
| Control & AI | Five-stage control-loop dashboard, Gemini advisor, alerts and event log |

Simulation controls: three scenarios (household, supermarket bay, ethylene stress test), speed, add foods,
**open lid** and **6 h power cut** events (the adaptive container keeps fans/vents running on its backup battery),
and discard spoiled items.

## Run locally

Prerequisite: Node.js 20+

```bash
npm install
cp .env.example .env.local   # then put your key in GEMINI_API_KEY (optional)
npm run dev                  # http://localhost:3000
```

Without a Gemini key the AI panel falls back to a built-in rule-based advisor, so everything still works.

## Deploy to GitHub Pages

The simulator is fully client-side, so it can be hosted on GitHub Pages. The workflow in
`.github/workflows/deploy.yml` builds and publishes it on every push to `main`.

1. Push the project to a GitHub repository (branch `main`).
2. In the repo go to **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Wait for the *Deploy to GitHub Pages* action to finish (Actions tab).
4. Open `https://<your-username>.github.io/<repo-name>/`.

Pages cannot run `server.ts`, so there the AI panel uses the built-in rule-based advisor. To use Gemini,
host the full app (Express server + `GEMINI_API_KEY` secret) on Render, Railway, Fly.io or Cloud Run
(`npm run build`, then `npm start`). Never put an API key in client-side code.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Express + Vite dev server |
| `npm run build` | Build the client (`dist/`) and bundle the server (`dist/server.cjs`) |
| `npm start` | Run the production build |
| `npm run lint` | Type-check with `tsc` |

## Project structure

```
server.ts                  Express server, /api/analyze (Gemini + fallback), Vite middleware
src/
  App.tsx                  Layout, simulation loop, KPIs
  types.ts                 Shared types
  data/foods.ts            Food profiles (ideal temp/humidity, ethylene behaviour, shelf life)
  sim/engine.ts            Sensing, classification, partition planner, airflow controller, physics
  components/
    ContainerView.tsx      Animated container with sliding partitions
    ChamberCards.tsx       Per-chamber readings and actuator levels
    FoodPanel.tsx          Run / pause / speed / add food / reset
    FreshnessChart.tsx     Adaptive vs conventional freshness over time
    AiPanel.tsx            Gemini advisor UI
```

## API

`POST /api/analyze` — body: current simulation summary (see `AiPanel.tsx`);
returns `{ result: { summary, risks[], recommendations[] }, source: "gemini" | "rule_based" }`.

`GET /api/health` — `{ ok, gemini }`.

## Configuration

| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Server-side Gemini key (optional) |
| `GEMINI_MODEL` | Model override, default `gemini-3.5-flash` |
| `PORT` | Server port, default `3000` |

## License

Choose a license before publishing (e.g. MIT).
