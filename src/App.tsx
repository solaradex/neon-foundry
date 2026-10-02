import { useEffect, useMemo, useState } from "react";
import "./App.css";
import {
  alloyPerSecond,
  applyIdleIncome,
  conveyorCost,
  corePerSecond,
  coreSynthCost,
  droneCost,
  furnaceCost,
  initialState,
  prestigeCost,
  recyclerCost,
  resonatorCost,
  refineryCost,
  scrapPerSecond,
  scrapUpgradeCost,
  type GameState,
} from "./game";

const SAVE_KEY = "neon-foundry-save-v1";

type LoadedSession = {
  game: GameState;
  offlineSeconds: number;
  offlineScrap: number;
  offlineAlloy: number;
  offlineCores: number;
};

function loadSession(): LoadedSession {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) {
      return {
        game: initialState,
        offlineSeconds: 0,
        offlineScrap: 0,
        offlineAlloy: 0,
        offlineCores: 0,
      };
    }

    const saved = JSON.parse(raw);

    const previousState: GameState = {
      ...initialState,
      ...saved,
      coreSynthLevel: saved.coreSynthLevel ?? 0,
      conveyorLevel: saved.conveyorLevel ?? 0,
      recyclerLevel: saved.recyclerLevel ?? 0,
      furnaceLevel: saved.furnaceLevel ?? 0,
      resonatorLevel: saved.resonatorLevel ?? 0,
      droneLevel: saved.droneLevel ?? 0,
    };

    const offlineSeconds = getOfflineSeconds(previousState);
    const offlineScrap = scrapPerSecond(previousState) * offlineSeconds;
    const offlineAlloy = alloyPerSecond(previousState) * offlineSeconds;
    const offlineCores = corePerSecond(previousState) * offlineSeconds;

    return {
      game: applyIdleIncome(previousState),
      offlineSeconds,
      offlineScrap,
      offlineAlloy,
      offlineCores,
    };
  } catch {
    return {
      game: initialState,
      offlineSeconds: 0,
      offlineScrap: 0,
      offlineAlloy: 0,
      offlineCores: 0,
    };
  }
}

function getOfflineSeconds(state: GameState, now = Date.now()) {
  return Math.min(
    Math.max(0, (now - state.lastSavedAt) / 1000),
    8 * 60 * 60,
  );
}

function formatDuration(seconds: number) {
  const total = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
}

function format(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: value < 100 ? 1 : 0,
    notation: value >= 100_000 ? "compact" : "standard",
  }).format(value);
}

export default function App() {
  const [session] = useState(loadSession);
  const [game, setGame] = useState<GameState>(session.game);
  const [offlineSeconds] = useState(session.offlineSeconds);
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

  function buyCoreSynth() {
    const cost = coreSynthCost(game.coreSynthLevel);
    if (!coreSynthUnlocked || game.alloy < cost) return;

    setGame((current) => ({
      ...current,
      alloy: current.alloy - cost,
      coreSynthLevel: current.coreSynthLevel + 1,
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

  function resetGame() {
    localStorage.removeItem(SAVE_KEY);
    setGame(initialState);
  }

  const { offlineScrap, offlineAlloy, offlineCores } = session;

  return (
    <main className="shell">
      {showOfflineReport && (
        <div className="offline-overlay">
          <section className="offline-modal" role="dialog" aria-modal="true">
            <p className="eyebrow">FACTORY STATUS REPORT</p>
            <h2>WELCOME BACK</h2>
            <p>Your factory operated for <strong>{formatDuration(offlineSeconds)}</strong> while you were away.</p>

            <div className="offline-rewards">
              <div>
                <span>⚙ Scrap</span>
                <strong>+{format(offlineScrap)}</strong>
              </div>
              <div>
                <span>◈ Alloy</span>
                <strong>+{format(offlineAlloy)}</strong>
              </div>
              <div>
                <span>✦ Neon Cores</span>
                <strong>+{format(offlineCores)}</strong>
              </div>
            </div>

            <button onClick={() => setShowOfflineReport(false)}>
              COLLECT REPORT
            </button>
          </section>
        </div>
      )}
      <header className="topbar">
        <div>
          <p className="eyebrow">AUTOMATED INDUSTRIAL SIMULATION</p>
          <h1>NEON FOUNDRY</h1>
        </div>
        <div className="prestige">⚡ Reboots: {game.prestige}</div>
      </header>

      <section className="resources">
        <Resource icon="⚙" name="Scrap" value={game.scrap} rate={rates.scrap} />
        <Resource icon="◈" name="Alloy" value={game.alloy} rate={rates.alloy} />
        <Resource icon="✦" name="Neon Cores" value={game.cores} rate={rates.cores} />
      </section>

      <section className="grid">
        <article className="panel">
          <h2>Production Floor</h2>
          <p>Build machines to automate the Neon Foundry.</p>

          <Upgrade
            title="Scrap Harvester"
            subtitle={`Level ${game.scrapLevel} · +0.75 Scrap/s`}
            cost={scrapUpgradeCost(game.scrapLevel)}
            disabled={game.scrap < scrapUpgradeCost(game.scrapLevel)}
            onClick={buyHarvester}
          />

          <Upgrade
            title="Conveyor Optimization"
            subtitle={`Level ${game.conveyorLevel} · +5% Scrap production`}
            cost={conveyorCost(game.conveyorLevel)}
            disabled={game.scrap < conveyorCost(game.conveyorLevel)}
            onClick={buyConveyor}
          />

          <Upgrade
            title="Magnetic Recycler"
            subtitle={`Level ${game.recyclerLevel} · +10% Scrap production`}
            cost={recyclerCost(game.recyclerLevel)}
            disabled={game.scrap < recyclerCost(game.recyclerLevel)}
            onClick={buyRecycler}
          />

          <Upgrade
            title="Alloy Refinery"
            subtitle={
              refineryUnlocked
                ? `Level ${game.refineryLevel} · +0.08 Alloy/s`
                : `LOCKED · ${Math.floor(game.scrap)} / 100 Scrap`
            }
            cost={refineryCost(game.refineryLevel)}
            disabled={
              !refineryUnlocked || game.scrap < refineryCost(game.refineryLevel)
            }
            onClick={buyRefinery}
          />

          <Upgrade
            title="Plasma Furnace"
            subtitle={`Level ${game.furnaceLevel} · +15% Alloy production`}
            cost={furnaceCost(game.furnaceLevel)}
            currency="Alloy"
            disabled={
              game.alloy < furnaceCost(game.furnaceLevel)
            }
            onClick={buyFurnace}
          />

          <Upgrade
            title="Neon Core Synthesizer"
            subtitle={
              coreSynthUnlocked
                ? `Level ${game.coreSynthLevel} · +0.01 Core/s`
                : `LOCKED · ${Math.floor(game.alloy)} / 500 Alloy`
            }
            cost={coreSynthCost(game.coreSynthLevel)}
            currency="Alloy"
            disabled={
              !coreSynthUnlocked || game.alloy < coreSynthCost(game.coreSynthLevel)
            }
            onClick={buyCoreSynth}
          />

          <Upgrade
            title="Core Resonator"
            subtitle={`Level ${game.resonatorLevel} · +25% Neon Core production`}
            cost={resonatorCost(game.resonatorLevel)}
            currency="Neon Cores"
            disabled={game.cores < resonatorCost(game.resonatorLevel)}
            onClick={buyResonator}
          />

          <Upgrade
            title="Drone Swarm"
            subtitle={`Level ${game.droneLevel} · +10% all production`}
            cost={droneCost(game.droneLevel)}
            currency="Neon Cores"
            disabled={game.cores < droneCost(game.droneLevel)}
            onClick={buyDrone}
          />
        </article>

        <article className="panel accent">
          <h2>System Reboot</h2>
          <p>
            Reset factory progress and gain a permanent <strong>+15%</strong>
            {" "}production multiplier.
          </p>
          <p className="cost">Requires {format(prestigeCost(game))} Alloy</p>
          <button
            className="danger"
            disabled={game.alloy < prestigeCost(game)}
            onClick={reboot}
          >
            Reboot Factory
          </button>
        </article>
      </section>

      <section className="panel">
        <h2>Future Store</h2>
        <div className="hook-grid">
          <div>
            <strong>Rewarded boost</strong>
            <span>Double offline production for four hours.</span>
          </div>
          <div>
            <strong>Cosmetic shop</strong>
            <span>Factory themes, robot skins, and animations.</span>
          </div>
          <div>
            <strong>Season pass</strong>
            <span>Optional rewards, quests, and visual items.</span>
          </div>
        </div>
      </section>

      <button className="reset" onClick={resetGame}>
        Reset local save
      </button>
    </main>
  );
}

function Resource({
  icon,
  name,
  value,
  rate,
}: {
  icon: string;
  name: string;
  value: number;
  rate: number;
}) {
  return (
    <article className="resource">
      <span className="resource-icon">{icon}</span>
      <div>
        <p>{name}</p>
        <strong>{format(value)}</strong>
        <small>+{format(rate)}/sec</small>
      </div>
    </article>
  );
}

function Upgrade({
  title,
  subtitle,
  cost,
  currency = "Scrap",
  disabled,
  onClick,
}: {
  title: string;
  subtitle: string;
  cost: number;
  currency?: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <div className="upgrade">
      <div>
        <strong>{title}</strong>
        <span>{subtitle}</span>
      </div>
      <button disabled={disabled} onClick={onClick}>
        Upgrade · {format(cost)} {currency}
      </button>
    </div>
  );
}
