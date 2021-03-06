import * as React from "react";
import { BoardProps } from "boardgame.io/react";
import { useBgioClientInfo } from "./useBgioClientInfo";
import { phaseNames, stageNames } from "game/constants";

type BgioCtxProviderProps = {
  children: React.ReactNode;
  ctx: BoardProps["ctx"];
};

type BgioCtxValue = {
  ctx: BoardProps["ctx"] & {
    isMyTurn: boolean;
    isOrderMarkerPhase: boolean;
    isPlacementPhase: boolean;
    isRoundOfPlayPhase: boolean;
    isAttackingStage: boolean;
    isGameover: boolean;
  };
};
const BgioCtxContext = React.createContext<BgioCtxValue | undefined>(undefined);

export function BgioCtxProvider({ ctx, children }: BgioCtxProviderProps) {
  const { playerID } = useBgioClientInfo();
  const isMyTurn: boolean = ctx.currentPlayer === playerID;
  const isOrderMarkerPhase: boolean =
    ctx.phase === phaseNames.placeOrderMarkers;
  const isPlacementPhase: boolean = ctx.phase === phaseNames.placement;
  const isRoundOfPlayPhase: boolean = ctx.phase === phaseNames.roundOfPlay;
  const isAttackingStage: boolean =
    isRoundOfPlayPhase &&
    ctx.activePlayers?.[playerID] === stageNames.attacking;
  const isGameover: boolean = Boolean(ctx.gameover);
  return (
    <BgioCtxContext.Provider
      value={{
        ctx: {
          ...ctx,
          isMyTurn,
          isOrderMarkerPhase,
          isPlacementPhase,
          isRoundOfPlayPhase,
          isAttackingStage,
          isGameover,
        },
      }}
    >
      {children}
    </BgioCtxContext.Provider>
  );
}

export function useBgioCtx() {
  const context = React.useContext(BgioCtxContext);
  if (context === undefined) {
    throw new Error("useBgioCtx must be used within a BgioCtxProvider");
  }
  return context;
}
