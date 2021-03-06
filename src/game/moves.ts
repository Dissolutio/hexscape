import { BoardProps } from "boardgame.io/react";
import { INVALID_MOVE } from "boardgame.io/core";
import { HexUtils } from "react17-hexgrid";

import {
  selectHexForUnit,
  selectGameCardByID,
  calcUnitMoveRange,
  selectUnitsForCard,
  selectUnrevealedGameCard,
} from "./g-selectors";
import {
  GameState,
  BoardHexes,
  BoardHex,
  GameUnits,
  GameUnit,
  HexscapeMove,
} from "./types";
import { stageNames } from "./constants";

//phase:___RoundOfPlay
const endCurrentMoveStage: HexscapeMove = (G, ctx) => {
  ctx?.events?.setStage(stageNames.attacking);
};
const endCurrentPlayerTurn: HexscapeMove = (G, ctx) => {
  ctx?.events?.endTurn();
};
const moveAction: HexscapeMove = (G, ctx, unit: GameUnit, endHex: BoardHex) => {
  const isNoUnit = !unit || typeof unit === "undefined";
  const isNoEndHex = !endHex || typeof endHex === "undefined";
  if (isNoUnit || isNoEndHex) {
    return INVALID_MOVE;
  }
  const { unitID, movePoints } = unit;
  const playersOrderMarkers = G.players[ctx.currentPlayer].orderMarkers;
  const endHexID = endHex.id;
  const startHex = selectHexForUnit(unitID, G.boardHexes);
  const startHexID = startHex.id;
  const currentMoveRange = calcUnitMoveRange(unit, G.boardHexes, G.gameUnits);
  const isInSafeMoveRange = currentMoveRange.safe.includes(endHexID);
  const moveCost = HexUtils.distance(startHex, endHex);
  // clone G
  const newBoardHexes: BoardHexes = { ...G.boardHexes };
  const newGameUnits: GameUnits = { ...G.gameUnits };
  // update moved units counter
  const unitsMoved = [...G.unitsMoved];
  if (!unitsMoved.includes(unitID)) {
    unitsMoved.push(unitID);
    G.unitsMoved = unitsMoved;
  }
  // update unit position
  newBoardHexes[startHexID].occupyingUnitID = "";
  newBoardHexes[endHexID].occupyingUnitID = unitID;
  // update unit move points
  const newMovePoints = movePoints - moveCost;
  newGameUnits[unitID].movePoints = newMovePoints;
  // update move ranges for this turn's units
  const unrevealedGameCard = selectUnrevealedGameCard(
    playersOrderMarkers,
    G.armyCards,
    G.currentOrderMarker
  );
  const currentTurnUnits = selectUnitsForCard(
    unrevealedGameCard.gameCardID,
    G.gameUnits
  );
  currentTurnUnits.forEach((unit: GameUnit) => {
    const { unitID } = unit;
    const moveRange = calcUnitMoveRange(unit, newBoardHexes, newGameUnits);
    newGameUnits[unitID].moveRange = moveRange;
  });
  // Make the move
  if (isInSafeMoveRange) {
    G.boardHexes = { ...newBoardHexes };
    G.gameUnits = { ...newGameUnits };
  }
};
const attackAction: HexscapeMove = (
  G,
  ctx,
  unit: GameUnit,
  defenderHex: BoardHex
) => {
  const { unitID } = unit;
  const unitGameCard = selectGameCardByID(G.armyCards, unit.gameCardID);
  const unitRange = unitGameCard.range;
  const unitsMoved = [...G.unitsMoved];
  const unitsAttacked = [...G.unitsAttacked];
  const attacksAllowed = unitGameCard.figures;
  const attacksLeft = attacksAllowed - unitsAttacked.length;
  const attackerHex = selectHexForUnit(unitID, G.boardHexes);

  //! EARLY OUTS
  // DISALLOW - no target
  if (!defenderHex.occupyingUnitID) {
    console.log(`no target`);
    return;
  }
  // DISALLOW - all attacks used
  const isEndAttacks = attacksLeft <= 0;
  if (isEndAttacks) {
    console.log(`all attacks used`);
    return;
  }
  // DISALLOW - unit already attacked
  const isAlreadyAttacked = unitsAttacked.includes(unitID);
  if (isAlreadyAttacked) {
    console.log(`unit already attacked`);
    return;
  }
  // DISALLOW - attack must be used by a moved unit
  const isMovedUnit = unitsMoved.includes(unitID);
  const isOpenAttack =
    attacksLeft > unitsMoved.filter((id) => !unitsAttacked.includes(id)).length;
  const isUsableAttack = isMovedUnit || isOpenAttack;
  if (!isUsableAttack) {
    console.log(`attack must be used by a moved unit`);
    return;
  }
  // DISALLOW - defender is out of range
  const isInRange = HexUtils.distance(attackerHex, defenderHex) <= unitRange;
  if (!isInRange) {
    console.log(`defender is out of range`);
    return;
  }

  // ALLOW
  const attack = unitGameCard.attack;
  const defenderGameUnit = G.gameUnits[defenderHex.occupyingUnitID];
  const defenderGameCard = selectGameCardByID(
    G.armyCards,
    defenderGameUnit.gameCardID
  );
  const defense = defenderGameCard.defense;
  const defenderLife = defenderGameCard.life;
  const attackRoll = ctx.random.Die(6, attack);
  const skulls = attackRoll.filter((n) => n <= 3).length;
  const defenseRoll = ctx.random.Die(6, defense);
  const shields = defenseRoll.filter((n) => n === 4 || n === 5).length;
  const wounds = Math.max(skulls - shields, 0);
  const isHit = wounds > 0;
  const isFatal = wounds >= defenderLife;
  console.log(`A:`, skulls, `D:`, shields, `wounds:`, wounds);

  // deal damage
  if (isHit && !isFatal) {
    const gameCardIndex = G.armyCards.findIndex(
      (card) => card?.gameCardID === defenderGameUnit.gameCardID
    );
    G.armyCards[gameCardIndex].life = defenderLife - wounds;
  }
  // kill unit, clear hex
  if (isFatal) {
    delete G.gameUnits[defenderGameUnit.unitID];
    G.boardHexes[defenderHex.id].occupyingUnitID = "";
  }
  // update units attacked
  unitsAttacked.push(unitID);
  G.unitsAttacked = unitsAttacked;
};
//phase:___Placement
const placeUnitOnHex: HexscapeMove = (
  G,
  ctx,
  hexId: string,
  unit: GameUnit
) => {
  G.boardHexes[hexId].occupyingUnitID = unit?.unitID ?? "";
};
const confirmPlacementReady: HexscapeMove = (
  G,
  ctx,
  { playerID }: { playerID: string }
) => {
  G.placementReady[playerID] = true;
};
//phase:___PlaceOrderMarkers
function placeOrderMarker(
  G: GameState,
  ctx: BoardProps["ctx"],
  {
    playerID,
    orderMarker,
    gameCardID,
  }: { playerID: string; orderMarker: string; gameCardID: string }
) {
  G.players[playerID].orderMarkers[orderMarker] = gameCardID;
}
const confirmOrderMarkersReady: HexscapeMove = (G, ctx, { playerID }) => {
  G.orderMarkersReady[playerID] = true;
};

export const moves = {
  endCurrentMoveStage,
  endCurrentPlayerTurn,
  moveAction,
  attackAction,
  placeUnitOnHex,
  confirmPlacementReady,
  placeOrderMarker,
  confirmOrderMarkersReady,
};
