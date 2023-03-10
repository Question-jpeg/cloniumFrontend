import React from "react";
import { View, StyleSheet } from "react-native";
import { TouchableOpacity, TouchableWithoutFeedback } from "react-native";
import {
  renderEmptyChip,
  renderEmptyPlayer,
} from "./../utils/renderInstructionChips";

export default function InstructionField({
  instruction,
  width,
  onClick,
}: {
  instruction: any;
  width: number;
  onClick?: any;
}) {
  const iSize = instruction.length;
  const jSize = instruction[0].length;
  const cellSize = Math.floor(width / instruction[0].length);

  const wrapInTouchable = (key: string, view: any, onPress: any) => {
    return (
      <TouchableWithoutFeedback key={key} onPress={onPress}>
        {view}
      </TouchableWithoutFeedback>
    );
  };

  return (
    <View
      style={{ width, display: "flex", flexDirection: "row", flexWrap: "wrap" }}
    >
      {Array.from(Array(iSize).keys()).map((i) =>
        Array.from(Array(jSize).keys()).map((j) => {
          const key = `${i}${j}`;
          const elem = instruction[i][j];
          const cellStyle = elem === null ? "noCell" : "cell";
          const view = (
            <View
              key={key}
              style={{
                ...styles[cellStyle],
                borderRadius: cellSize / 5,
                width: cellSize,
                height: cellSize,
              }}
            >
              {elem
                ? elem === "p"
                  ? renderEmptyPlayer(cellSize)
                  : renderEmptyChip(cellSize, elem)
                : null}
            </View>
          );
          return onClick
            ? wrapInTouchable(key, view, () => onClick(i, j))
            : view;
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cell: {
    backgroundColor: "#4f5159",
    borderColor: "#737682",
    
    borderWidth: 1,
    overflow: "visible",

    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  noCell: {},
});
