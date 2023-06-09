import { ChipTypes } from "./ChipTypes";

export const isBombJumper = (chip: any) =>
  [
    ChipTypes.jumpBombTop,
    ChipTypes.jumpBombRight,
    ChipTypes.jumpBombDown,
    ChipTypes.jumpBombLeft,
  ].includes(chip.type);
