import { View, Text, Animated, Dimensions } from "react-native";
import React, { useEffect, useRef, useState } from "react";
import Field from "./../../game_logic/Field";
import { animate } from "./../../utils/animate";
import { makeMediumHaptic } from "./../../utils/haptics";

const getPx = (count: number) => {
  let firstPx = -40 * (count - 1);
  return Array.from(Array(count).keys()).map((i) => firstPx + i * 80);
};

export default function MoveOrder({
  orderData,
  game,
  names_mapping,
  timeoutCounter
}: {
  orderData: any;
  game: Field;
  names_mapping: any;
  timeoutCounter: number;
}) {
  const translateAnimatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pxs = getPx(orderData["order"].length);
    animate(translateAnimatedValue, {
      toValue: pxs[orderData["currentPlayerIndex"]],
      duration: 1000,
    });
  }, [orderData]);

  return (
    <>
      <View
        style={{
          display: "flex",
          flexDirection: "row",
          width: "100%",
          justifyContent: "center",
          alignItems: "center",
          height: 70,
          marginTop: "20%",
          marginBottom: "10%",
        }}
      >
        {timeoutCounter > 0 && (
          <View
            style={{
              position: "absolute",
              zIndex: 10,
              elevation: 10,
              width: "50%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              top: -60,
            }}
          >
            <Text style={{ fontSize: 24, color: "lightgrey" }}>
              {timeoutCounter}
            </Text>
          </View>
        )}
        <Animated.View
          style={{
            backgroundColor: "grey",
            borderRadius: 20,
            width: 90,
            height: 110,
            position: "absolute",
            transform: [{ translateX: translateAnimatedValue }],
          }}
        ></Animated.View>
        {orderData["order"].map((uid: string) => {
          return (
            <View
              key={uid}
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",

                width: 70,
                marginRight: 5,
                marginLeft: 5,
              }}
            >
              <Text
                numberOfLines={1}
                ellipsizeMode="clip"
                style={{
                  color: "lightgrey",
                  fontSize: 14,
                  fontWeight: "700",
                  marginBottom: 5,
                }}
              >
                {names_mapping[uid]}
              </Text>
              {game.renderNewChip(uid, 0, 70)}
              <Text
                style={{
                  color: "white",
                  fontWeight: "700",
                  fontSize: 20,
                  position: "absolute",
                  transform: [{ translateY: 10 }],
                }}
              >
                {game.scores[uid]}
              </Text>
            </View>
          );
        })}
      </View>
    </>
  );
}
