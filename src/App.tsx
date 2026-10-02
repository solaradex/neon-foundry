import { useEffect, useMemo, useState } from "react";
import "./App.css";
import {
  alloyPerSecond,
  applyIdleIncome,
  corePerSecond,
  coreSynthCost,
  initialState,
  prestigeCost,
  refineryCost,
  scrapPerSecond,
  scrapUpgradeCost,
  type GameState,
} from "./game";

const SAVE_KEY = "neon-foundry-save-v1";

function loadGame(): GameState {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return initialState;

    const saved = JSON.parse(raw);

    return applyIdleIncome({
      ...initialState,
      ...saved,
      coreSynthLevel: saved.coreSynthLevel ?? 0,
    });
  } catch {
    return initialState;
  }
}

function format(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: value < 100 ? 1 : 0,
    notation: value >= 100_000 ? "compact" : "standard",
  }).format(value);
}

export default function App() {
  const [game, setGame] = useState<GameState>(loadGame);

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

  return (
    <main className="shell">
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
