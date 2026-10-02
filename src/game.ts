export type GameState = {
  scrap: number;
  alloy: number;
  cores: number;
  scrapLevel: number;
  refineryLevel: number;
  coreSynthLevel: number;
  prestige: number;
  lastSavedAt: number;
};

export const initialState: GameState = {
  scrap: 0,
  alloy: 0,
  cores: 0,
  scrapLevel: 1,
  refineryLevel: 0,
  coreSynthLevel: 0,
  prestige: 0,
  lastSavedAt: Date.now(),
};

const multiplier = (state: GameState) => 1 + state.prestige * 0.15;

export const scrapPerSecond = (state: GameState) =>
  (1 + state.scrapLevel * 0.75) * multiplier(state);

export const alloyPerSecond = (state: GameState) =>
  state.refineryLevel * 0.08 * multiplier(state);

export const corePerSecond = (state: GameState) =>
  state.coreSynthLevel * 0.01 * multiplier(state);

export const scrapUpgradeCost = (level: number) =>
  Math.floor(15 * Math.pow(1.15, level));

export const refineryCost = (level: number) =>
  Math.floor(100 * Math.pow(1.22, level));

export const coreSynthCost = (level: number) =>
  Math.floor(500 * Math.pow(1.28, level));

export const prestigeCost = (state: GameState) =>
  Math.floor(5_000 * Math.pow(2.2, state.prestige));

export function applyIdleIncome(state: GameState, now = Date.now()): GameState {
  const elapsedSeconds = Math.min(
    Math.max(0, (now - state.lastSavedAt) / 1000),
    8 * 60 * 60,
  );

  return {
    ...state,
    scrap: state.scrap + scrapPerSecond(state) * elapsedSeconds,
    alloy: state.alloy + alloyPerSecond(state) * elapsedSeconds,
    cores: state.cores + corePerSecond(state) * elapsedSeconds,
    lastSavedAt: now,
  };
}
