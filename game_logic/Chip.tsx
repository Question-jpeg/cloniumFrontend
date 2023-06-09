import React from "react";
import { View, Text } from "react-native";
import {
  MaterialCommunityIcons,
  FontAwesome,
  Ionicons,
  Foundation,
} from "@expo/vector-icons";
import { isJumper } from "./../utils/isJumper";
import { ChipTypes } from "../utils/ChipTypes";
import { isBombJumper } from "./../utils/isBombJumper";

export default class Chip {
  constructor(
    public player_uid: string,
    public value = 1,
    public type = ChipTypes.player,
    public power = 1
  ) {}

  private renderDot(cellSize: number) {
    return (
      <View
        style={{
          backgroundColor: "white",
          width: cellSize / 8,
          height: cellSize / 8,
          borderRadius: 999,
        }}
      ></View>
    );
  }

  private renderPlayerChip(cellSize: number) {
    return (
      this.value > 0 &&
      this.type === ChipTypes.player && (
        <>
          {this.value > 2 && this.renderDot(cellSize)}
          <View
            style={{
              display: "flex",
              flexDirection: "row",
              gap: (cellSize / 40) * 3,
            }}
          >
            {this.renderDot(cellSize)}
            {this.value > 1 && this.renderDot(cellSize)}
          </View>
        </>
      )
    );
  }

  private renderEmptyPlayerChip(cellSize: number) {
    return (
      this.type === ChipTypes.emptyPlayer && (
        <Ionicons name="ios-person" color="grey" size={cellSize / 2.5} />
      )
    );
  }

  private renderJumpChipComponent(cellSize: number, style?: any) {
    return (
      <MaterialCommunityIcons
        name={
          this.power === 1
            ? "chevron-right"
            : this.power === 2
            ? "chevron-double-right"
            : "chevron-triple-right"
        }
        size={cellSize / 2}
        color="white"
        style={{
          transform: [
            {
              rotate: [
                ChipTypes.jumpTop,
                ChipTypes.jumpDown,
                ChipTypes.jumpBombTop,
                ChipTypes.jumpBombDown,
              ].includes(this.type)
                ? [ChipTypes.jumpTop, ChipTypes.jumpBombTop].includes(this.type)
                  ? "-90deg"
                  : "90deg"
                : [ChipTypes.jumpRight, ChipTypes.jumpBombRight].includes(
                    this.type
                  )
                ? "0deg"
                : "180deg",
            },
          ],
          ...style,
        }}
      />
    );
  }

  private renderBombChipComponent(cellSize: number, child?: any) {
    return (
      <>
        <FontAwesome
          name="bomb"
          size={cellSize / 1.65}
          color="black"
          style={{
            position: "absolute",
            transform: [
              { translateX: cellSize / 16.5 },
              { translateY: -cellSize / 16.5 },
            ],
          }}
        />
        {child}
      </>
    );
  }

  private renderJumpChip(cellSize: number) {
    return isJumper(this) && this.renderJumpChipComponent(cellSize);
  }

  private renderBombChip(cellSize: number) {
    return (
      this.type === ChipTypes.bomb && this.renderBombChipComponent(cellSize)
    );
  }

  private renderJumpBombChip(cellSize: number) {
    return (
      isBombJumper(this) &&
      this.renderBombChipComponent(
        cellSize,
        this.renderJumpChipComponent(cellSize / 1.5, { opacity: 0.7 })
      )
    );
  }

  private renderExplodeChip(cellSize: number) {
    return (
      this.type === ChipTypes.explosion && (
        <Foundation name="burst" size={cellSize} color="black" />
      )
    );
  }

  render(colorMapping: any, cellSize: number) {
    const colors = colorMapping[this.player_uid];
    return (
      this.renderBombChip(cellSize) ||
      this.renderExplodeChip(cellSize) || (
        <View
          style={{
            width: "85%",
            height: "85%",
            borderRadius: 999,
            borderWidth: cellSize / 12,
            borderColor: "lightgrey",
            display: "flex",
            gap: cellSize / 20,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: colors.background,
          }}
        >
          {this.renderPlayerChip(cellSize)}
          {this.renderJumpChip(cellSize)}
          {this.renderEmptyPlayerChip(cellSize)}
          {this.renderJumpBombChip(cellSize)}
          <View
            style={{
              borderRadius: 999,
              borderWidth: cellSize / 16,
              width: "100%",
              height: "100%",
              borderColor: colors.border,
              opacity: 0.1,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              position: "absolute",
            }}
          ></View>
        </View>
      )
    );
  }
}
