import { useEffect, useMemo, useState } from "react";
import "./App.css";
import {
  alloyPerSecond,
  applyIdleIncome,
  arcFurnaceCost,
  conveyorCost,
  corePerSecond,
  coreSynthCost,
  droneCost,
  dynamoCost,
  furnaceCost,
  initialState,
  nanobotCost,
  quantumCost,
  prestigeCost,
  recyclerCost,
  resonatorCost,
  refineryCost,
  scrapPerSecond,
  scrapUpgradeCost,
  singularityCost,
  type GameState,
} from "./game";

const SAVE_KEY = "neon-foundry-save-v1";

type Filter = "All" | "Basic" | "Production" | "Advanced";

type UpgradeDefinition = {
  key: string;
  title: string;
  category: Exclude<Filter, "All">;
  currency: "Scrap" | "Alloy" | "Neon Cores";
  icon: string;
  level: number;
  cost: number;
  effect: string;
  disabled: boolean;
  onBuy: () => void;
};

function loadSession(): GameState {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return initialState;

    const saved = JSON.parse(raw);

    return {
      ...initialState,
      ...saved,
      coreSynthLevel: saved.coreSynthLevel ?? 0,
      conveyorLevel: saved.conveyorLevel ?? 0,
      recyclerLevel: saved.recyclerLevel ?? 0,
      furnaceLevel: saved.furnaceLevel ?? 0,
      resonatorLevel: saved.resonatorLevel ?? 0,
      droneLevel: saved.droneLevel ?? 0,
      dynamoLevel: saved.dynamoLevel ?? 0,
      arcFurnaceLevel: saved.arcFurnaceLevel ?? 0,
      quantumLevel: saved.quantumLevel ?? 0,
      nanobotLevel: saved.nanobotLevel ?? 0,
      singularityLevel: saved.singularityLevel ?? 0,
    };
  } catch {
    return initialState;
  }
}

function getOfflineSeconds(state: GameState, now = Date.now()) {
  return Math.min(
    Math.max(0, (now - state.lastSavedAt) / 1000),
    8 * 60 * 60,
  );
}

function format(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: value < 100 ? 1 : 0,
    notation: value >= 100_000 ? "compact" : "standard",
  }).format(value);
}

function loadOfflineSession() {
  const previous = loadSession();
  const offlineSeconds = getOfflineSeconds(previous);

  return {
    game: applyIdleIncome(previous),
    offlineSeconds,
    offlineScrap: scrapPerSecond(previous) * offlineSeconds,
    offlineAlloy: alloyPerSecond(previous) * offlineSeconds,
    offlineCores: corePerSecond(previous) * offlineSeconds,
  };
}

export default function App() {
  const [session] = useState(loadOfflineSession);
  const [game, setGame] = useState<GameState>(session.game);
  const [filter, setFilter] = useState<Filter>("All");
  const [showOfflineReport, setShowOfflineReport] = useState(
    () => session.offlineSeconds >= 10,
  );

  const refineryUnlocked = game.scrap >= 100 || game.refineryLevel > 0;
  const coreSynthUnlocked = game.alloy >= 500 || game.coreSynthLevel > 0;

  const rates = useMemo(
    () => ({
      scrap: scrapPerSecond(game),
      alloy: alloyPerSecond(game),
      cores: corePerSecond(game),
    }),
    [game],
  );

  const totalUpgrades =
    game.scrapLevel +
    game.refineryLevel +
    game.coreSynthLevel +
    game.conveyorLevel +
    game.recyclerLevel +
    game.furnaceLevel +
    game.resonatorLevel +
    game.droneLevel +
    game.dynamoLevel +
    game.arcFurnaceLevel +
    game.quantumLevel +
    game.nanobotLevel +
    game.singularityLevel -
    1;

  const advancedUpgrades =
    game.resonatorLevel +
    game.droneLevel +
    game.dynamoLevel +
    game.arcFurnaceLevel +
    game.quantumLevel +
    game.nanobotLevel +
    game.singularityLevel;

  useEffect(() => {
    const timer = window.setInterval(() => {
      setGame((current) => applyIdleIncome(current));
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem(SAVE_KEY, JSON.stringify(game));
  }, [game]);

  function buyHarvester() {
    const cost = scrapUpgradeCost(game.scrapLevel);
    if (game.scrap < cost) return;
    setGame((current) => ({
      ...current,
      scrap: current.scrap - cost,
      scrapLevel: current.scrapLevel + 1,
    }));
  }

  function buyRefinery() {
    const cost = refineryCost(game.refineryLevel);
    if (!refineryUnlocked || game.scrap < cost) return;
    setGame((current) => ({
      ...current,
      scrap: current.scrap - cost,
      refineryLevel: current.refineryLevel + 1,
    }));
  }

  function buyConveyor() {
    const cost = conveyorCost(game.conveyorLevel);
    if (game.scrap < cost) return;
    setGame((current) => ({
      ...current,
      scrap: current.scrap - cost,
      conveyorLevel: current.conveyorLevel + 1,
    }));
  }

  function buyRecycler() {
    const cost = recyclerCost(game.recyclerLevel);
    if (game.scrap < cost) return;
    setGame((current) => ({
      ...current,
      scrap: current.scrap - cost,
      recyclerLevel: current.recyclerLevel + 1,
    }));
  }

  function buyFurnace() {
    const cost = furnaceCost(game.furnaceLevel);
    if (game.alloy < cost) return;
    setGame((current) => ({
      ...current,
      alloy: current.alloy - cost,
      furnaceLevel: current.furnaceLevel + 1,
    }));
  }

  function buyQuantum() {
    const cost = quantumCost(game.quantumLevel);
    if (game.cores < cost) return;

    setGame((current) => ({
      ...current,
      cores: current.cores - cost,
      quantumLevel: current.quantumLevel + 1,
    }));
  }

  function buyCoreSynth() {
    const cost = coreSynthCost(game.coreSynthLevel);
    if (!coreSynthUnlocked || game.alloy < cost) return;
    setGame((current) => ({
      ...current,
      alloy: current.alloy - cost,
      coreSynthLevel: current.coreSynthLevel + 1,
    }));
  }

  function buyResonator() {
    const cost = resonatorCost(game.resonatorLevel);
    if (game.cores < cost) return;
    setGame((current) => ({
      ...current,
      cores: current.cores - cost,
      resonatorLevel: current.resonatorLevel + 1,
    }));
  }

  function buyDrone() {
    const cost = droneCost(game.droneLevel);
    if (game.cores < cost) return;
    setGame((current) => ({
      ...current,
      cores: current.cores - cost,
      droneLevel: current.droneLevel + 1,
    }));
  }

  function buyDynamo() {
    const cost = dynamoCost(game.dynamoLevel);
    if (game.scrap < cost) return;
    setGame((current) => ({
      ...current,
      scrap: current.scrap - cost,
      dynamoLevel: current.dynamoLevel + 1,
    }));
  }

  function buyArcFurnace() {
    const cost = arcFurnaceCost(game.arcFurnaceLevel);
    if (game.alloy < cost) return;
    setGame((current) => ({
      ...current,
      alloy: current.alloy - cost,
      arcFurnaceLevel: current.arcFurnaceLevel + 1,
    }));
  }

  function buyNanobot() {
    const cost = nanobotCost(game.nanobotLevel);
    if (game.cores < cost) return;
    setGame((current) => ({
      ...current,
      cores: current.cores - cost,
      nanobotLevel: current.nanobotLevel + 1,
    }));
  }

  function buySingularity() {
    const cost = singularityCost(game.singularityLevel);
    if (game.cores < cost) return;
    setGame((current) => ({
      ...current,
      cores: current.cores - cost,
      singularityLevel: current.singularityLevel + 1,
    }));
  }

  function reboot() {
    const cost = prestigeCost(game);
    if (game.alloy < cost) return;

    setGame({
      ...initialState,
      prestige: game.prestige + 1,
      lastSavedAt: Date.now(),
    });
  }

  const upgrades: UpgradeDefinition[] = [
    {
      key: "harvester",
      title: "Scrap Harvester",
      category: "Basic",
      currency: "Scrap",
      icon: "⚙",
      level: game.scrapLevel,
      cost: scrapUpgradeCost(game.scrapLevel),
      effect: "+0.75 Scrap/s",
      disabled: game.scrap < scrapUpgradeCost(game.scrapLevel),
      onBuy: buyHarvester,
    },
    {
      key: "conveyor",
      title: "Conveyor Optimization",
      category: "Production",
      currency: "Scrap",
      icon: "▰",
      level: game.conveyorLevel,
      cost: conveyorCost(game.conveyorLevel),
      effect: "+5% Scrap",
      disabled: game.scrap < conveyorCost(game.conveyorLevel),
      onBuy: buyConveyor,
    },
    {
      key: "recycler",
      title: "Magnetic Recycler",
      category: "Production",
      currency: "Scrap",
      icon: "◉",
      level: game.recyclerLevel,
      cost: recyclerCost(game.recyclerLevel),
      effect: "+10% Scrap",
      disabled: game.scrap < recyclerCost(game.recyclerLevel),
      onBuy: buyRecycler,
    },
    {
      key: "refinery",
      title: "Alloy Refinery",
      category: "Production",
      currency: "Scrap",
      icon: "◆",
      level: game.refineryLevel,
      cost: refineryCost(game.refineryLevel),
      effect: "+0.08 Alloy/s",
      disabled: !refineryUnlocked || game.scrap < refineryCost(game.refineryLevel),
      onBuy: buyRefinery,
    },
    {
      key: "furnace",
      title: "Plasma Furnace",
      category: "Production",
      currency: "Alloy",
      icon: "🔥",
      level: game.furnaceLevel,
      cost: furnaceCost(game.furnaceLevel),
      effect: "+15% Alloy",
      disabled: game.alloy < furnaceCost(game.furnaceLevel),
      onBuy: buyFurnace,
    },
    {
      key: "core",
      title: "Core Synthesizer",
      category: "Advanced",
      currency: "Alloy",
      icon: "✦",
      level: game.coreSynthLevel,
      cost: coreSynthCost(game.coreSynthLevel),
      effect: "+0.01 Core/s",
      disabled: !coreSynthUnlocked || game.alloy < coreSynthCost(game.coreSynthLevel),
      onBuy: buyCoreSynth,
    },
    {
      key: "resonator",
      title: "Core Resonator",
      category: "Advanced",
      currency: "Neon Cores",
      icon: "◇",
      level: game.resonatorLevel,
      cost: resonatorCost(game.resonatorLevel),
      effect: "+25% Cores",
      disabled: game.cores < resonatorCost(game.resonatorLevel),
      onBuy: buyResonator,
    },
    {
      key: "drone",
      title: "Drone Swarm",
      category: "Advanced",
      currency: "Neon Cores",
      icon: "✧",
      level: game.droneLevel,
      cost: droneCost(game.droneLevel),
      effect: "+10% All",
      disabled: game.cores < droneCost(game.droneLevel),
      onBuy: buyDrone,
    },
    {
      key: "dynamo",
      title: "Industrial Dynamo",
      category: "Advanced",
      currency: "Scrap",
      icon: "⚡",
      level: game.dynamoLevel,
      cost: dynamoCost(game.dynamoLevel),
      effect: "+20% Scrap",
      disabled: game.scrap < dynamoCost(game.dynamoLevel),
      onBuy: buyDynamo,
    },
    {
      key: "arc",
      title: "Arc Furnace",
      category: "Advanced",
      currency: "Alloy",
      icon: "◈",
      level: game.arcFurnaceLevel,
      cost: arcFurnaceCost(game.arcFurnaceLevel),
      effect: "+25% Alloy",
      disabled: game.alloy < arcFurnaceCost(game.arcFurnaceLevel),
      onBuy: buyArcFurnace,
    },
    {
      key: "quantum",
      title: "Quantum Condenser",
      category: "Advanced",
      currency: "Neon Cores",
      icon: "⬡",
      level: game.quantumLevel,
      cost: quantumCost(game.quantumLevel),
      effect: "+40% Cores",
      disabled: game.cores < quantumCost(game.quantumLevel),
      onBuy: buyQuantum,
    },
    {
      key: "nanobot",
      title: "Nanobot Fabricator",
      category: "Advanced",
      currency: "Neon Cores",
      icon: "▣",
      level: game.nanobotLevel,
      cost: nanobotCost(game.nanobotLevel),
      effect: "+15% All",
      disabled: game.cores < nanobotCost(game.nanobotLevel),
      onBuy: buyNanobot,
    },
    {
      key: "singularity",
      title: "Singularity Engine",
      category: "Advanced",
      currency: "Neon Cores",
      icon: "✹",
      level: game.singularityLevel,
      cost: singularityCost(game.singularityLevel),
      effect: "+30% All",
      disabled: game.cores < singularityCost(game.singularityLevel),
      onBuy: buySingularity,
    },
  ];

  const visibleUpgrades =
    filter === "All"
      ? upgrades
      : upgrades.filter((upgrade) => upgrade.category === filter);

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><img src="/neon-flame.svg" alt="" /></div>
          <div>
            <span>NEON</span>
            <strong>FOUNDRY</strong>
          </div>
        </div>

        <nav className="side-nav">
          <button className="nav-item active"><span>▥</span><div><strong>Factory</strong><small>Build & Upgrade</small></div></button>
          <button className="nav-item"><span>▤</span><div><strong>Contracts</strong><small>Complete Objectives</small></div></button>
          <button className="nav-item"><span>◇</span><div><strong>Prestige</strong><small>Rebirth & Grow</small></div></button>
          <button className="nav-item"><span>▥</span><div><strong>Stats</strong><small>Your Progress</small></div></button>
          <button className="nav-item"><span>⚙</span><div><strong>Settings</strong><small>Game Options</small></div></button>
        </nav>

        <div className="sidebar-promo">
          <div className="promo-glow" />
          <span>BUILD</span>
          <strong>AUTOMATE</strong>
          <strong>EXPAND</strong>
          <em>ASCEND</em>
          <p>Turn scrap into a neon-powered empire.</p>
          <div className="promo-bar"><i /></div>
        </div>
      </aside>

      <section className="main-content">
        <header className="resource-bar">
          <ResourceCard icon="▰" name="SCRAP" value={game.scrap} rate={rates.scrap} />
          <ResourceCard icon="◆" name="ALLOY" value={game.alloy} rate={rates.alloy} />
          <ResourceCard icon="✦" name="NEON CORES" value={game.cores} rate={rates.cores} />
          <ResourceCard icon="✹" name="PRESTIGE" value={game.prestige} rate={game.prestige * 15} suffix="% boost" />
          <button className="prestige-button" onClick={reboot} disabled={game.alloy < prestigeCost(game)}>
            <span>✦</span>
            <div><strong>PRESTIGE</strong><small>Reset • Grow Stronger</small></div>
          </button>
        </header>

        <div className="dashboard-grid">
          <section className="center-column">
            <div className="factory-hero">
              <div className="hero-overlay" />
              <div className="hero-copy">
                <p>YOUR FACTORY</p>
                <h2>Upgrade. Automate. Generate. Expand.</h2>
              </div>
              <div className="hero-output">
                <span>FACTORY OUTPUT</span>
                <div>▰ <b>{format(rates.scrap)}</b> / sec</div>
                <div>◆ <b>{format(rates.alloy)}</b> / sec</div>
                <div>✦ <b>{format(rates.cores)}</b> / sec</div>
              </div>
              <div className="factory-scene">
                <span className="tower tower-a" />
                <span className="tower tower-b" />
                <span className="tower tower-c" />
                <span className="machine machine-a" />
                <span className="machine machine-b" />
                <span className="machine machine-c" />
                <span className="machine machine-d" />
                <span className="beam beam-a" />
                <span className="beam beam-b" />
                <span className="beam beam-c" />
              </div>
            </div>

            <section className="production-panel">
              <div className="section-heading">
                <div>
                  <h2>PRODUCTION FLOOR</h2>
                  <span>13 Upgrades • Build Your Empire</span>
                </div>
                <div className="filter-tabs">
                  {(["All", "Basic", "Production", "Advanced"] as Filter[]).map((item) => (
                    <button key={item} className={filter === item ? "selected" : ""} onClick={() => setFilter(item)}>
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div className="upgrade-grid">
                {visibleUpgrades.map((upgrade) => (
                  <UpgradeCard key={upgrade.key} upgrade={upgrade} />
                ))}
              </div>
            </section>
          </section>

          <aside className="right-column">
            <ContractsPanel />
            <StatsPanel
              totalUpgrades={Math.max(totalUpgrades, 0)}
              advancedUpgrades={advancedUpgrades}
              prestige={game.prestige}
            />
            <div className="side-art-card">
              <span>SMALL FACTORIES</span>
              <strong>BUILD RESOURCES.</strong>
              <strong>GREAT FACTORIES</strong>
              <em>BUILD FUTURES.</em>
            </div>
          </aside>
        </div>
      </section>

      {showOfflineReport && (
        <div className="offline-overlay">
          <section className="offline-modal" role="dialog" aria-modal="true">
            <p className="eyebrow">FACTORY STATUS REPORT</p>
            <h2>WELCOME BACK</h2>
            <p>You generated resources while away.</p>
            <div className="offline-rewards">
              <div><span>▰ Scrap</span><strong>+{format(session.offlineScrap)}</strong></div>
              <div><span>◆ Alloy</span><strong>+{format(session.offlineAlloy)}</strong></div>
              <div><span>✦ Neon Cores</span><strong>+{format(session.offlineCores)}</strong></div>
            </div>
            <button onClick={() => setShowOfflineReport(false)}>COLLECT REPORT</button>
          </section>
        </div>
      )}
    </main>
  );
}

function ResourceCard({
  icon,
  name,
  value,
  rate,
  suffix,
}: {
  icon: string;
  name: string;
  value: number;
  rate: number;
  suffix?: string;
}) {
  return (
    <article className="resource-card">
      <span className="resource-card-icon">{icon}</span>
      <div>
        <small>{name}</small>
        <strong>{format(value)}</strong>
        <em>+{format(rate)} / sec{suffix ? ` ${suffix}` : ""}</em>
      </div>
    </article>
  );
}

function UpgradeCard({ upgrade }: { upgrade: UpgradeDefinition }) {
  return (
    <article className={`upgrade-card ${upgrade.disabled ? "locked" : ""}`}>
      <div className="upgrade-art"><span>{upgrade.icon}</span></div>
      <div className="upgrade-info">
        <strong>{upgrade.title}</strong>
        <span>Lv. {upgrade.level}</span>
        <em>{upgrade.effect}</em>
        <small>Cost: {format(upgrade.cost)} {upgrade.currency}</small>
      </div>
      <button disabled={upgrade.disabled} onClick={upgrade.onBuy}>UPGRADE</button>
    </article>
  );
}

function ContractsPanel() {
  const contracts = [
    ["Produce 1,000 Scrap", "742 / 1,000", "Reward: +50 Alloy"],
    ["Produce 100 Alloy", "68 / 100", "Reward: +10 Neon Cores"],
    ["Reach 10 Scrap Upgrades", "6 / 10", "Reward: +1 Prestige"],
    ["Produce 10 Neon Cores", "4 / 10", "Reward: +100 Alloy"],
    ["Purchase 1 Advanced Upgrade", "0 / 1", "Reward: +25% Production (1h)"],
  ];

  return (
    <section className="info-panel">
      <div className="info-heading"><h2>FACTORY CONTRACTS</h2><span>Resets in 12h 34m</span></div>
      {contracts.map(([title, progress, reward], index) => (
        <div className="contract" key={title}>
          <div className={`contract-icon c${index}`}>{["⚙", "◆", "⬆", "✦", "▣"][index]}</div>
          <div className="contract-body">
            <strong>{title}</strong>
            <span>{progress}</span>
            <i className="progress-track"><b style={{ width: `${[74,68,60,40,0][index]}%` }} /></i>
            <small>{reward}</small>
          </div>
        </div>
      ))}
    </section>
  );
}

function StatsPanel({
  totalUpgrades,
  advancedUpgrades,
  prestige,
}: {
  totalUpgrades: number;
  advancedUpgrades: number;
  prestige: number;
}) {
  return (
    <section className="info-panel stats-panel">
      <div className="info-heading"><h2>GAME STATS</h2></div>
      {[
        ["▰", "Total Scrap Produced", "24,682"],
        ["◆", "Total Alloy Produced", "8,416"],
        ["✦", "Total Cores Produced", "1,280"],
        ["◷", "Time Played", "2h 14m"],
        ["⌂", "Upgrades Purchased", String(totalUpgrades)],
        ["▤", "Contracts Completed", "2"],
        ["☆", "Prestige Count", String(prestige)],
      ].map(([icon, label, value]) => (
        <div className="stat-row" key={label}><span>{icon}</span><strong>{label}</strong><b>{value}</b></div>
      ))}
      <small className="advanced-count">{advancedUpgrades} advanced upgrades in the factory</small>
    </section>
  );
}
