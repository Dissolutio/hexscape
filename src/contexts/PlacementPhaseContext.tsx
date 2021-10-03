import React, {
  createContext,
  SyntheticEvent,
  useContext,
  useState,
} from "react";
import { useBgioClientInfo, useBgioMoves, useBgioG } from "bgio-contexts";
import { useUIContext, useMapContext } from "contexts";
import { BoardHex, ArmyCard, GameUnit } from "game/types";

export type PlacementUnit = GameUnit & {
  name: string;
};
type PlacementContextValue = {
  placementUnits: PlacementUnit[];
  onClickPlacementUnit: (unitID: string) => void;
  onClickBoardHex_placement: (
    event: React.SyntheticEvent,
    sourceHex: BoardHex
  ) => void;
};

const PlacementContext = createContext<Partial<PlacementContextValue>>({});

export const PlacementContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { playerID } = useBgioClientInfo();
  const { boardHexes, gameUnits, myUnits, myCards, myStartZone } = useBgioG();
  const { moves } = useBgioMoves();
  const { setSelectedMapHex } = useMapContext();
  const { selectedUnitID, setSelectedUnitID } = useUIContext();

  const { placeUnitOnHex } = moves;
  // STATE
  const [placementUnits, setPlacementUnits] = useState((): PlacementUnit[] => {
    const myUnitIdsAlreadyOnMap = Object.values(boardHexes)
      .map((bH: BoardHex) => bH.occupyingUnitID)
      .filter((id) => {
        return id && gameUnits[id].playerID === playerID;
      });
    const units = myUnits
      .filter((unit: GameUnit) => !myUnitIdsAlreadyOnMap.includes(unit.unitID))
      .map((unit) => {
        const armyCard = myCards.find(
          (card: ArmyCard) => card.armyCardID === unit.armyCardID
        );
        return {
          ...unit,
          name: armyCard.name,
        };
      });
    return units;
  });
  const activeUnit: GameUnit = gameUnits[selectedUnitID];
  const removeUnitFromAvailable = (unit: GameUnit) => {
    const newState = placementUnits.filter((u) => {
      return !(u.unitID === unit.unitID);
    });
    setPlacementUnits(newState);
  };
  // HANDLERS
  function onClickPlacementUnit(unitID: string) {
    // either deselect unit, or select unit and deselect active hex
    if (unitID === selectedUnitID) {
      setSelectedUnitID("");
    } else {
      setSelectedUnitID(unitID);
      setSelectedMapHex("");
    }
  }
  function onClickBoardHex_placement(
    event: SyntheticEvent,
    sourceHex: BoardHex
  ) {
    // Do not propagate to background onClick
    event.stopPropagation();
    const hexID = sourceHex.id;
    const isInStartZone = myStartZone.includes(hexID);
    //  No unit, select hex
    if (!selectedUnitID) {
      setSelectedMapHex(hexID);
      return;
    }
    // have unit, clicked in start zone, place unit
    if (selectedUnitID && isInStartZone) {
      placeUnitOnHex(hexID, activeUnit);
      removeUnitFromAvailable(activeUnit);
      setSelectedUnitID("");
      return;
    }
    // have unit, clicked hex outside start zone, error
    if (selectedUnitID && !isInStartZone) {
      console.error(
        "Invalid hex selected. You must place units inside your start zone."
      );
      return;
    }
  }

  return (
    <PlacementContext.Provider
      value={{
        placementUnits,
        onClickPlacementUnit,
        onClickBoardHex_placement,
      }}
    >
      {children}
    </PlacementContext.Provider>
  );
};
export const usePlacementContext = () => {
  return {
    ...useContext(PlacementContext),
  };
};
