import Chip from "../game_logic/Chip";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { colorMapping } from "../game_logic/config";

export const renderEmptyPlayer = (cellSize: number) => {
  const chip = new Chip("player", 0);

  return (
    <>
      <Ionicons
        name="ios-person"
        color="grey"
        size={cellSize / 2.5}
        style={{ position: "absolute", zIndex: 1 }}
      />
      {chip.render({ player: colorMapping["player"] }, cellSize)}
    </>
  );
};

export const renderEmptyChip = (cellSize: number, value: number) => {
  const chip = new Chip("neutral", value);

  return chip.render({ neutral: colorMapping["neutral"] }, cellSize);
};
