import { TouchableOpacity, View, StyleSheet, Dimensions } from "react-native";
import React from "react";
import { MaterialIcons } from "@expo/vector-icons";
import {
  renderBombChip,
  renderEmptyChip,
  renderEmptyPlayer,
  renderJumpChip,
} from "./../../utils/renderInstructionChips";
import { ChipTypes } from "../../utils/ChipTypes";
import { actions, ActionTypes } from "../../utils/ActionTypes";

export default function Actions({
  currentAction,
  setCurrentAction,
}: {
  currentAction: ActionTypes;
  setCurrentAction: Function;
}) {
  const iconMapping: any = {
    [ActionTypes.cell]: () => (
      <MaterialIcons name="do-not-disturb-alt" size={50} color="brown" />
    ),
    [ActionTypes.player]: () => renderEmptyPlayer(50),
    [ActionTypes.chip]: () => renderEmptyChip(50, 3),
    [ActionTypes.jump]: () => renderJumpChip(ChipTypes.jumpRight, 3, 50),
    [ActionTypes.bomb]: () => renderBombChip(50),
    [ActionTypes.jumpBomb]: () => renderJumpChip(ChipTypes.jumpBombRight, 3, 50)
  };

  return (
    <View
      style={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 10,
        maxWidth: 310,
        flexWrap: 'wrap'
      }}
    >
      {actions.map(
        (action) => {
          return (
            <TouchableOpacity
              onPress={() => setCurrentAction(action)}
              key={action}
              style={{
                ...styles.cell,
                opacity: currentAction === action ? 1 : 0.5,                
                padding: action !== ActionTypes.cell ? 10 : 0,                                
              }}
            >
              {iconMapping[action]()}
            </TouchableOpacity>
          );
        }
      )}
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
    width: 70,
    aspectRatio: 1,
  },
});
