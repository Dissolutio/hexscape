import { useBgioClientInfo } from "bgio-contexts";
import {
  GameArmyCard,
  GameState,
  GameUnit,
  PlayerOrderMarkers,
} from "game/types";
import * as React from "react";

type BgioGProviderProps = {
  children: React.ReactNode;
  G: GameState;
};
type G = GameState & {
  myCards: GameArmyCard[];
  myStartZone: string[];
  myUnits: GameUnit[];
  myOrderMarkers: PlayerOrderMarkers;
};
const BgioGContext = React.createContext<G | undefined>(undefined);

export function BgioGProvider({ G, children }: BgioGProviderProps) {
  const { playerID, belongsToPlayer } = useBgioClientInfo();
  const myCards: GameArmyCard[] = G.armyCards.filter(belongsToPlayer);
  const myStartZone: string[] = G.startZones[playerID];
  const myUnits: GameUnit[] = Object.values(G.gameUnits).filter(
    belongsToPlayer
  );
  const myOrderMarkers: PlayerOrderMarkers =
    G.players?.[playerID]?.orderMarkers;
  return (
    <BgioGContext.Provider
      value={{ ...G, myCards, myStartZone, myUnits, myOrderMarkers }}
    >
      {children}
    </BgioGContext.Provider>
  );
}
export function useBgioG() {
  const context = React.useContext(BgioGContext);
  if (context === undefined) {
    throw new Error("useBgioG must be used within a BgioGProvider");
  }
  return context;
}
