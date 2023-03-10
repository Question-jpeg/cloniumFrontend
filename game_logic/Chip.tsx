import React from "react";
import { View } from 'react-native';



export default class Chip {
    public value = 1;
  
    constructor(public player_uid: string, value?: number) {
      if (value !== undefined) this.value = value
    }
  
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
  
    render(colorMapping: any, cellSize: number) {
      const colors = colorMapping[this.player_uid];
      return (
        <View
          style={{
            width: '85%',
            height: '85%',
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
          {this.value > 2 && this.renderDot(cellSize)}
          <View style={{ display: "flex", flexDirection: "row", gap: cellSize / 40 * 3 }}>
            {this.value > 0 && this.renderDot(cellSize)}
            {this.value > 1 && this.renderDot(cellSize)}
          </View>
          <View
            style={{
              borderRadius: 999,
              borderWidth: cellSize / 16,
              width: '100%',
              height: '100%',
              borderColor: colors.border,
              opacity: 0.1,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              position: "absolute",
            }}
          ></View>
        </View>
      );
    }
  }
  
