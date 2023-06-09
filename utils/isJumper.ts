import { ChipTypes } from "./ChipTypes";

export const isJumper = (chip: any) =>
  [
    ChipTypes.jumpTop,
    ChipTypes.jumpRight,
    ChipTypes.jumpDown,
    ChipTypes.jumpLeft,
  ].includes(chip.type);
