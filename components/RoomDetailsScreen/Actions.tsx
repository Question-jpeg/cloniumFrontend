import { TouchableOpacity, View, StyleSheet, Dimensions } from "react-native";
import React from "react";
import { MaterialIcons } from "@expo/vector-icons";
import {
  renderEmptyChip,
  renderEmptyPlayer,
} from "./../../utils/renderInstructionChips";

export default function Actions({
  currentAction,
  setCurrentAction,
}: {
  currentAction: "cell" | "player" | "chip";
  setCurrentAction: Function;
}) {
  const iconMapping: any = {
    cell: () => (
      <MaterialIcons name="do-not-disturb-alt" size={50} color="brown" />
    ),
    player: () => renderEmptyPlayer(50),
    chip: () => renderEmptyChip(50, 3),
  };

  return (
    <View
      style={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 10
      }}
    >
      {["cell", "player", "chip"].map((action) => {
        return (
          <TouchableOpacity
            onPress={() => setCurrentAction(action)}
            key={action}
            style={{
              ...styles.cell,
              opacity: currentAction === action ? 1 : 0.5,
              // width: "18%",
              width: 70,
              aspectRatio: 1,
              padding: action !== "cell" ? 10 : 0,
            }}
          >
            {iconMapping[action]()}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  cell: {
    backgroundColor: "#4f5159",
    borderColor: "#737682",
    borderRadius: 5,
    borderWidth: 1,
    overflow: "visible",

    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
});
