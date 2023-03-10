import { View, Text, Animated } from "react-native";
import React, { useEffect, useRef } from "react";
import Field from "./../../game_logic/Field";
import { animate } from "./../../utils/animate";

const getPx = (count: number) => {
  let firstPx = -40 * (count - 1);
  return Array.from(Array(count).keys()).map((i) => firstPx + i * 80);
};

export default function MoveOrder({
  orderData,
  game,
  names_mapping,
}: {
  orderData: any;
  game: Field;
  names_mapping: any;
}) {
  const translateAnimatedValue = useRef(new Animated.Value(0)).current;

  const scores = game.getScores();

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
          //   gap: 10,
          height: 70,
        }}
      >
        <Animated.View
          style={{
            backgroundColor: "grey",
            borderRadius: 20,
            width: 90,
            height: 110,
            position: "absolute",
            transform: [
              { translateX: translateAnimatedValue },
            ],
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
              ellipsizeMode='clip'            
                style={{
                  color: "lightgrey",
                  fontSize: 20,
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
                {scores[uid]}
              </Text>
            </View>
          );
        })}
      </View>
    </>
  );
}
