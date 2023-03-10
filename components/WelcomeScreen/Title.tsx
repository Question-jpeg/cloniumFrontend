import React, { useState, useRef, useEffect } from "react";
import { Text, View, Animated } from "react-native";
import { colorMapping } from "./../../game_logic/config";
import Chip from "./../../game_logic/Chip";
import { animate } from "../../utils/animate";

export default function Title() {
  const [tappedIndex, setTappedIndex] = useState<number>(1);
  const scaleAnimatedValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    scaleAnimatedValue.setValue(1)
    animate(scaleAnimatedValue, { toValue: 1.25, duration: 500 });
  }, [tappedIndex]);

  return (
    <>
      <Text style={{ color: "white", fontSize: 32, marginBottom: 20 }}>
        KREZER CLONIUM
      </Text>
      <View
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          height: 90,
          gap: 10
        }}
      >
        {Array.from(Array(3).keys()).map((i) => {
          let uid = i.toString();

          return (
            <Animated.View
            key={i}
              style={{
                width: 90,
                transform:
                  tappedIndex === i ? [{ scale: scaleAnimatedValue }] : [],
              }}
              onTouchStart={() => setTappedIndex(i)}
            >
              {new Chip(uid, 3).render({ [uid]: colorMapping[i] }, 90)}
            </Animated.View>
          );
        })}
      </View>
    </>
  );
}
