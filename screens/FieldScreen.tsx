import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  TouchableWithoutFeedback,
  View,
  Dimensions,
  Animated,
  StyleSheet,
  Easing,
  Text,
} from "react-native";
import Field from "../game_logic/Field";
import Chip from "../game_logic/Chip";
import { animate } from "../utils/animate";
import { makeMediumHaptic } from "../utils/haptics";
import { WebsocketContext } from "../context/websocket";
import MoveOrder from "../components/FieldScreen/MoveOrder";

const screenWidth = Dimensions.get("window").width;

export default function FieldScreen({ route, navigation }: any) {
  const { socket, player_uid }: { socket: WebSocket; player_uid: string } =
    useContext<any>(WebsocketContext);

  const { instruction, order, names_mapping, onGoBack } = route.params;
  const cellSize = screenWidth / instruction[0].length;

  const [game, setGame] = useState<Field>();
  const [startBoomChips, setStartBoomChips] = useState<number[][]>([]);
  const [boomChips, setBoomChips] = useState<number[][]>([]);
  const [counter, refresh] = useState<number>(0);

  const [orderData, setOrderData] = useState<any>({
    order,
    currentPlayerIndex: 0,
  });

  const translateAnimatedValue = useRef(new Animated.Value(0)).current;
  const rotateAnimatedValue = useRef(new Animated.Value(0)).current;
  const scaleAnimatedValue = useRef(new Animated.Value(1)).current;

  const startBoom = (boomChips: number[][], callback: Function) => {
    setStartBoomChips(boomChips);
    makeMediumHaptic();

    animate(
      scaleAnimatedValue,
      {
        toValue: 1.5,
        duration: 500,
        easing: Easing.circle,
      },
      () => animateBoom(boomChips, callback)
    );
  };

  const animateBoom = (boomChips: number[][], callback: Function) => {
    setBoomChips(boomChips);

    animate(translateAnimatedValue, {
      toValue: cellSize,
      duration: 1000,
    });
    animate(
      rotateAnimatedValue,
      {
        toValue: 360,
        duration: 1000,
      },
      () => {
        callback();
        refreshAnimatedValues();
      }
    );
  };

  const refreshAnimatedValues = () => {
    translateAnimatedValue.setValue(0);
    rotateAnimatedValue.setValue(0);
    scaleAnimatedValue.setValue(1);
  };

  const renderCell = (
    cell: any,
    i: number,
    j: number,
    boomChips: number[][]
  ) => {
    const toBoom =
      boomChips.filter((boomChip) => boomChip[0] === i && boomChip[1] === j)
        .length > 0;

    const isStartBoom =
      startBoomChips.filter(
        (startBoomChip) => startBoomChip[0] === i && startBoomChip[1] === j
      ).length > 0;

    const cellStyle = cell === null ? "noCell" : "cell";

    return (
      <TouchableWithoutFeedback
        key={j}
        onPress={() => {
          // if (chip?.player_uid === player_uid && canMove) {
          if (
            cell &&
            cell.player_uid === player_uid &&
            orderData["order"][orderData["currentPlayerIndex"]] === player_uid
          ) {
            setOrderData((orderData: any) => {
              const updated = { ...orderData };
              updated["currentPlayerIndex"] =
                (updated["currentPlayerIndex"] + 1) % updated["order"].length;
              return updated;
            });
            makeMediumHaptic();
            socket.send(
              JSON.stringify({ type: "move", data: { coordinates: [i, j] } })
            );
            game?.handleMove(i, j, startBoom, () => refresh((c) => c + 1));
          }
          // }
        }}
      >
        <View
          style={{
            zIndex: toBoom || isStartBoom ? 1 : 0,
            width: cellSize,
            height: cellSize,
            ...styles[cellStyle],
          }}
        >
          {!toBoom && cell?.player_uid && (
            <Animated.View
              style={{
                transform: isStartBoom ? [{ scale: scaleAnimatedValue }] : [],
                width: "100%",
                height: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {game?.renderChip(cell)}
            </Animated.View>
          )}
          {toBoom && cell?.player_uid && (
            <>
              <Animated.View
                style={{
                  transform: [
                    {
                      translateX: translateAnimatedValue,
                    },
                    {
                      rotateY: rotateAnimatedValue.interpolate({
                        inputRange: [0, 180],
                        outputRange: ["0deg", "180deg"],
                      }),
                    },
                  ],
                  ...styles.newChip,
                }}
              >
                {game?.renderNewChip(cell.player_uid)}
              </Animated.View>

              <Animated.View
                style={{
                  transform: [
                    {
                      translateX: translateAnimatedValue.interpolate({
                        inputRange: [0, cellSize],
                        outputRange: [0, -cellSize],
                      }),
                    },
                    {
                      rotateY: rotateAnimatedValue.interpolate({
                        inputRange: [0, 180],
                        outputRange: ["0deg", "180deg"],
                      }),
                    },
                  ],
                  ...styles.newChip,
                }}
              >
                {game?.renderNewChip(cell.player_uid)}
              </Animated.View>

              <Animated.View
                style={{
                  transform: [
                    { translateY: translateAnimatedValue },
                    {
                      rotateX: rotateAnimatedValue.interpolate({
                        inputRange: [0, 180],
                        outputRange: ["0deg", "180deg"],
                      }),
                    },
                  ],
                  ...styles.newChip,
                }}
              >
                {game?.renderNewChip(cell.player_uid)}
              </Animated.View>

              <Animated.View
                style={{
                  transform: [
                    {
                      translateY: translateAnimatedValue.interpolate({
                        inputRange: [0, cellSize],
                        outputRange: [0, -cellSize],
                      }),
                    },
                    {
                      rotateX: rotateAnimatedValue.interpolate({
                        inputRange: [0, 180],
                        outputRange: ["0deg", "180deg"],
                      }),
                    },
                  ],
                  ...styles.newChip,
                }}
              >
                {game?.renderNewChip(cell.player_uid)}
              </Animated.View>
            </>
          )}
        </View>
      </TouchableWithoutFeedback>
    );
  };

  useEffect(() => {
    setGame(new Field(instruction, order));

    return function cleanup() {
      socket.send(JSON.stringify({ type: "leave_field" }));
      onGoBack();
    };
  }, []);

  useEffect(() => {
    if (game)
      socket.onmessage = async function (event) {
        const message = JSON.parse(event.data);
        const type = message["type"];
        const data = message["data"];

        if (type === "player_moved") {
          const [i, j] = data["coordinates"];
          if (game.field[i][j]?.player_uid !== player_uid) {
            makeMediumHaptic();
            await game.handleMove(i, j, startBoom, () => refresh((c) => c + 1));
            setOrderData((orderData: any) => {
              const updated = { ...orderData };
              updated["currentPlayerIndex"] =
                (updated["currentPlayerIndex"] + 1) % updated["order"].length;
              return updated;
            });
          }
        } else if (type === "player_left_the_field") {
          const uid = data["uid"];
          game!.removePlayer(uid);
          setOrderData((od: any) => {
            const updated = { ...od };
            updated["order"] = (updated["order"] as string[]).filter(
              (pl_uid) => pl_uid !== uid
            );
            if (updated["currentPlayerIndex"] > od["order"].indexOf(uid))
              updated["currentPlayerIndex"]--;
            else if (updated["currentPlayerIndex"] === od["order"].indexOf(uid))
              updated["currentPlayerIndex"] =
                updated["currentPlayerIndex"] % updated["order"].length;

            return updated;
          });
        } else if (type === "get_ready") {
          socket.send(
            JSON.stringify({ type: "player_ready", data: { value: false } })
          );
        }
      };
  }, [game]);

  return (
    <>
      {game && (
        <View
          style={{
            display: "flex",
            height: "100%",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <MoveOrder
            orderData={orderData}
            game={game}
            names_mapping={names_mapping}
          />

          <View
            style={{
              width: "100%",
              aspectRatio: 1,
              display: "flex",
              flexDirection: "row",
              justifyContent: "center",
              flexWrap: "wrap",
              overflow: "hidden",
              marginTop: 50,
            }}
          >
            {Array.from(Array(game.field.length).keys()).map((i) => {
              return Array.from(Array(game.field[i].length).keys()).map((j) => {
                const cell = game.field[i][j];
                return renderCell(cell, i, j, boomChips);
              });
            })}
          </View>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  newChip: {
    position: "absolute",
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

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
  noCell: {
    zIndex: 2,
    backgroundColor: "#292a2e",
  },
});
