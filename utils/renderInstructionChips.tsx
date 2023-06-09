import Chip from "../game_logic/Chip";
import { colorMapping } from "../game_logic/config";
import { ChipTypes } from "./ChipTypes";

export const renderEmptyPlayer = (cellSize: number) => {
  const chip = new Chip("player", 0, ChipTypes.emptyPlayer);

  return chip.render({ player: colorMapping["player"] }, cellSize);
};

export const renderEmptyChip = (cellSize: number, value: number) => {
  const chip = new Chip("neutral", value);

  return chip.render({ neutral: colorMapping["neutral"] }, cellSize);
};

export const renderJumpChip = (
  type: ChipTypes,
  power: number,
  cellSize: number,
) => {
  const chip = new Chip("neutral", 0, type, power);

  return chip.render({ neutral: colorMapping["neutral"] }, cellSize);
};

export const renderBombChip = (cellSize: number) => {
  const chip = new Chip('neutral', 0, ChipTypes.bomb)

  return chip.render({ neutral: colorMapping["neutral"] }, cellSize);
}