import React from "react";
import { View, StyleSheet } from "react-native";
import { TouchableWithoutFeedback } from "react-native";
import {
  renderBombChip,
  renderEmptyChip,
  renderEmptyPlayer,
  renderJumpChip,
} from "./../utils/renderInstructionChips";

export default function InstructionField({
  instruction,
  width,
  onClick,
  onLongPress,
}: {
  instruction: any;
  width: number;
  onClick?: any;
  onLongPress?: any;
}) {
  const iSize = instruction.length;
  const jSize = instruction[0].length;
  const cellSize = width / instruction[0].length;

  const wrapInTouchable = (
    key: string,
    view: any,
    onPress: any,
    onLongPress: any
  ) => {
    return (
      <TouchableWithoutFeedback
        key={key}
        onPress={onPress}
        onLongPress={onLongPress}
      >
        {view}
      </TouchableWithoutFeedback>
    );
  };

  return (
    <View
      style={{
        width: width + 1,
        display: "flex",
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {Array.from(Array(iSize).keys()).map((i) =>
        Array.from(Array(jSize).keys()).map((j) => {
          const key = `${i}${j}`;
          const elem = instruction[i][j];
          const cellStyle = elem === null ? "noCell" : "cell";
          const jumpInfo =
            elem && elem.toString().length >= 3 ? elem.split("-") : null;
          

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
                  : elem === "b"
                  ? renderBombChip(cellSize)
                  : jumpInfo
                  ? renderJumpChip(
                      Number.parseInt(jumpInfo[0]),
                      Number.parseInt(jumpInfo[1]),
                      cellSize
                    )
                  : renderEmptyChip(cellSize, elem)
                : null}
            </View>
          );
          return onClick
            ? wrapInTouchable(
                key,
                view,
                () => onClick(i, j),
                () => onLongPress(i, j)
              )
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
