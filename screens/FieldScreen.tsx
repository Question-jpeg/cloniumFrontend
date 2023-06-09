import React, { useContext, useEffect, useRef, useState } from "react";
import {
  Alert,
  TouchableWithoutFeedback,
  View,
  Dimensions,
  Animated,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import Field from "../game_logic/Field";
import { animate } from "../utils/animate";
import { makeMediumHaptic } from "../utils/haptics";
import { WebsocketContext } from "../context/websocket";
import MoveOrder from "../components/FieldScreen/MoveOrder";
import { showNotification } from "./../utils/showNotification";
import ChatComponent from "./../components/ChatComponent";
import { colors } from "./../game_logic/config";
import { FontAwesome5 } from "@expo/vector-icons";
import Chip from "../game_logic/Chip";
import { ChipTypes } from "../utils/ChipTypes";
import { isJumper } from "./../utils/isJumper";
import { isBombJumper } from "./../utils/isBombJumper";

const screenWidth = Dimensions.get("window").width;

export default function FieldScreen({ route, navigation }: any) {
  const { socket, player_uid }: { socket: WebSocket; player_uid: string } =
    useContext<any>(WebsocketContext);

  const { instruction, order, names_mapping, onGoBack, secondsForMove } = route.params;

  const cellSize = screenWidth / instruction[0].length;

  const [game, setGame] = useState<Field>();
  const [bombChips, setBombChips] = useState<number[][]>([]);
  const [jumpersIndexes, setJumpersIndexes] = useState<any>({});
  const [counter, refresh] = useState<number>(0);
  const [connectedPlayers, setConnectedPlayers] = useState<string[]>(order);
  const [readyPlayers, setReadyPlayers] = useState<string[]>([]);
  const [firstMove, setFirstMove] = useState<boolean>(true);

  const [timeoutCounter, setTimeoutCounter] = useState<number>(0);
  const interval = useRef<any>();

  const [orderData, setOrderData] = useState<any>({
    order,
    currentPlayerIndex: 0,
  });

  const [canMove, setCanMove] = useState<boolean>(true);

  const translateAnimatedValue = useRef(new Animated.Value(0)).current;

  const startBoom = (bombChips: number[][], callback: Function) => {
    makeMediumHaptic();
    setBombChips(bombChips);

    animate(
      translateAnimatedValue,
      {
        toValue: cellSize,
        duration: 750,
      },
      () => {
        translateAnimatedValue.setValue(0);
        setBombChips([]);
        callback();
      }
    );
  };

  const runTimer = () => {
    setTimeoutCounter(secondsForMove);
    interval.current = setInterval(() => {
      setTimeoutCounter((c) => {
        if (c <= 4 && c > 1) makeMediumHaptic()
        if (c === 1) handleClick(-1, -1);

        return c - 1;
      });
    }, 1000);
  };

  const move1Turn = () => {
    setOrderData((orderData: any) => {
      const updated = { ...orderData };
      const order = updated["order"];
      const index = updated["currentPlayerIndex"];
      const targetIndex = (index + 1) % order.length;

      updated["currentPlayerIndex"] = targetIndex;

      if (order[targetIndex] === player_uid && secondsForMove) runTimer();

      return updated;
    });

    if (orderData["order"][orderData["currentPlayerIndex"]] === player_uid)
      setCanMove(true);

    checkScores();
  };

  const sendReady = () => {
    socket.send(
      JSON.stringify({
        type: "ready_for_move",
        data: "123",
      })
    );
  };

  const getJumpTransform = (chip: Chip) => {
    if (
      [
        ChipTypes.jumpTop,
        ChipTypes.jumpDown,
        ChipTypes.jumpBombTop,
        ChipTypes.jumpBombDown,
      ].includes(chip.type)
    )
      return [
        {
          translateY: translateAnimatedValue.interpolate({
            inputRange: [0, cellSize],
            outputRange: [
              0,
              cellSize *
                chip.power *
                ([ChipTypes.jumpTop, ChipTypes.jumpBombTop].includes(chip.type)
                  ? -1
                  : 1),
            ],
          }),
        },
        {
          rotateX: translateAnimatedValue.interpolate({
            inputRange: [0, cellSize],
            outputRange: ["0deg", "360deg"],
          }),
        },
      ];
    return [
      {
        translateX: translateAnimatedValue.interpolate({
          inputRange: [0, cellSize],
          outputRange: [
            0,
            cellSize *
              chip.power *
              ([ChipTypes.jumpLeft, ChipTypes.jumpBombLeft].includes(chip.type)
                ? -1
                : 1),
          ],
        }),
      },
      {
        rotateY: translateAnimatedValue.interpolate({
          inputRange: [0, cellSize],
          outputRange: ["0deg", "360deg"],
        }),
      },
    ];
  };

  const getOpacityValue = () => {
    return translateAnimatedValue.interpolate({
      inputRange: [cellSize * 0.9, cellSize],
      outputRange: [1, 0],
    });
  };

  const isUnderBomb = (i: number, j: number, coords: number[]) => {
    return Math.abs(i - coords[0]) <= 1 && Math.abs(j - coords[1]) <= 1;
  };

  const getCoordsToJumpTo = (chip: Chip, i: number, j: number) => {
    let targetI = i;
    let targetJ = j;
    if ([ChipTypes.jumpBombTop, ChipTypes.jumpTop].includes(chip.type)) {
      targetI = i - chip.power;
    } else if (
      [ChipTypes.jumpBombRight, ChipTypes.jumpRight].includes(chip.type)
    ) {
      targetJ = j + chip.power;
    } else if (
      [ChipTypes.jumpBombDown, ChipTypes.jumpDown].includes(chip.type)
    ) {
      targetI = i + chip.power;
    } else if (
      [ChipTypes.jumpBombLeft, ChipTypes.jumpLeft].includes(chip.type)
    ) {
      targetJ = j - chip.power;
    }

    return [targetI, targetJ];
  };

  const calculateDepth = (chip: Chip, i: number, j: number): number => {
    const initial = 3;
    const [targetI, targetJ] = getCoordsToJumpTo(chip, i, j);
    if (
      0 <= targetI &&
      targetI < game!.field.length &&
      0 <= targetJ &&
      targetJ < game!.field[targetI].length
    ) {
      const targetChip = game!.field[targetI][targetJ];
      if (targetChip && (isJumper(targetChip) || isBombJumper(targetChip))) {
        return calculateDepth(targetChip, targetI, targetJ) + 1;
      } else return initial;
    } else return initial;
  };

  const handleClick = async (i: number, j: number) => {
    setCanMove(false);

    makeMediumHaptic();

    clearInterval(interval.current);
    setTimeoutCounter(0);

    socket.send(
      JSON.stringify({ type: "move", data: { coordinates: [i, j] } })
    );
    if (i !== -1)
      await game?.handleMove(i, j, startBoom, () => refresh((c) => c + 1));
    sendReady();
  };

  const renderCell = (cell: any, i: number, j: number) => {
    let toBoom = false;
    let toJump = false;
    let toBomb = false;
    let toGreyOut = false;
    let toGreyOutJump = false;
    let toGreyOutTop = false;
    let toGreyOutRight = false;
    let toGreyOutDown = false;
    let toGreyOutLeft = false;
    const toGreySideInfo = [false, false, false, false];

    if (cell) {
      toBoom = cell.value > 3;
      toJump = (isJumper(cell) || isBombJumper(cell)) && cell.value > 0;

      for (let bombChip of bombChips) {
        if (toBoom) {
          const coords = [
            [i - 1, j],
            [i, j + 1],
            [i + 1, j],
            [i, j - 1],
          ];

          for (let i = 0; i < 4; i++) {
            const y = coords[i][0];
            const x = coords[i][1];

            toGreySideInfo[i] = isUnderBomb(y, x, bombChip);
          }
        }
        if (toJump) {
          const [targetI, targetJ] = getCoordsToJumpTo(cell, i, j);
          if (isUnderBomb(targetI, targetJ, bombChip) && !isBombJumper(cell))
            toGreyOutJump = true;
        }
        if (bombChip[0] === i && bombChip[1] === j) {
          toBomb = true;
          break;
        }
        if (isUnderBomb(i, j, bombChip) && cell.type === ChipTypes.player)
          toGreyOut = true;
      }
      if (toBoom) {
        toGreyOutTop = toGreySideInfo[0];
        toGreyOutRight = toGreySideInfo[1];
        toGreyOutDown = toGreySideInfo[2];
        toGreyOutLeft = toGreySideInfo[3];
      }
    }

    const cellStyle = cell === null ? "noCell" : "cell";

    return (
      <TouchableWithoutFeedback
        key={j}
        onPress={async () => {
          if (
            canMove &&
            cell &&
            cell.player_uid === player_uid &&
            orderData["order"][orderData["currentPlayerIndex"]] === player_uid
          ) {
            handleClick(i, j);
          }
        }}
      >
        <View
          style={{
            zIndex: toBoom
              ? 1
              : toJump
              ? jumpersIndexes[`${i}-${j}`]
              : toBomb
              ? 999
              : 0,
            elevation: toBoom
              ? 1
              : toJump
              ? jumpersIndexes[`${i}-${j}`]
              : toBomb
              ? 999
              : 0,
            width: cellSize,
            height: cellSize,
            ...styles[cellStyle],
          }}
        >
          {cell?.player_uid && (
            <>
              {!toBoom && !toBomb && (
                <>
                  {toJump && (
                    <Animated.View
                      style={{
                        transform: getJumpTransform(cell),
                        opacity: toGreyOutJump ? getOpacityValue() : 1,
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        position: "absolute",
                      }}
                    >
                      {game?.renderObject(
                        cell.player_uid,
                        cell.value,
                        isJumper(cell) ? ChipTypes.player : ChipTypes.bomb
                      )}
                    </Animated.View>
                  )}
                  <Animated.View
                    style={{
                      opacity: toGreyOut ? getOpacityValue() : 1,
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    {game?.renderChip(cell)}
                  </Animated.View>
                </>
              )}
              {(toBoom || toBomb) && (
                <Animated.View
                  style={{
                    opacity: toBomb || toGreyOut ? getOpacityValue() : 1,
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <>
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
                            rotateX: translateAnimatedValue.interpolate({
                              inputRange: [0, cellSize],
                              outputRange: ["0deg", "360deg"],
                            }),
                          },
                        ],
                        ...styles.newChip,
                        opacity: toGreyOutTop ? getOpacityValue() : 1,
                      }}
                    >
                      {game?.renderObject(
                        cell.player_uid,
                        1,
                        toBomb ? ChipTypes.explosion : ChipTypes.player
                      )}
                    </Animated.View>
                    <Animated.View
                      style={{
                        transform: [
                          {
                            translateX: translateAnimatedValue,
                          },
                          {
                            rotateY: translateAnimatedValue.interpolate({
                              inputRange: [0, cellSize],
                              outputRange: ["0deg", "360deg"],
                            }),
                          },
                        ],
                        ...styles.newChip,
                        opacity: toGreyOutRight ? getOpacityValue() : 1,
                      }}
                    >
                      {game?.renderObject(
                        cell.player_uid,
                        1,
                        toBomb ? ChipTypes.explosion : ChipTypes.player
                      )}
                    </Animated.View>
                    <Animated.View
                      style={{
                        transform: [
                          { translateY: translateAnimatedValue },
                          {
                            rotateX: translateAnimatedValue.interpolate({
                              inputRange: [0, cellSize],
                              outputRange: ["0deg", "360deg"],
                            }),
                          },
                        ],
                        ...styles.newChip,
                        opacity: toGreyOutDown ? getOpacityValue() : 1,
                      }}
                    >
                      {game?.renderObject(
                        cell.player_uid,
                        1,
                        toBomb ? ChipTypes.explosion : ChipTypes.player
                      )}
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
                            rotateY: translateAnimatedValue.interpolate({
                              inputRange: [0, cellSize],
                              outputRange: ["0deg", "360deg"],
                            }),
                          },
                        ],
                        ...styles.newChip,
                        opacity: toGreyOutLeft ? getOpacityValue() : 1,
                      }}
                    >
                      {game?.renderObject(
                        cell.player_uid,
                        1,
                        toBomb ? ChipTypes.explosion : ChipTypes.player
                      )}
                    </Animated.View>
                  </>
                  {toBomb && (
                    <>
                      <View style={{ ...styles.newChip }}>
                        {game?.renderObject(
                          cell.player_uid,
                          0,
                          ChipTypes.explosion
                        )}
                      </View>
                      <Animated.View
                        style={{
                          transform: [
                            {
                              translateX: translateAnimatedValue,
                            },
                            { translateY: translateAnimatedValue },
                            {
                              rotateY: translateAnimatedValue.interpolate({
                                inputRange: [0, cellSize],
                                outputRange: ["0deg", "360deg"],
                              }),
                            },
                          ],
                          ...styles.newChip,
                        }}
                      >
                        {game?.renderObject(
                          cell.player_uid,
                          0,
                          ChipTypes.explosion
                        )}
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
                            { translateY: translateAnimatedValue },
                            {
                              rotateY: translateAnimatedValue.interpolate({
                                inputRange: [0, cellSize],
                                outputRange: ["0deg", "360deg"],
                              }),
                            },
                          ],
                          ...styles.newChip,
                        }}
                      >
                        {game?.renderObject(
                          cell.player_uid,
                          0,
                          ChipTypes.explosion
                        )}
                      </Animated.View>
                      <Animated.View
                        style={{
                          transform: [
                            {
                              translateX: translateAnimatedValue,
                            },
                            {
                              translateY: translateAnimatedValue.interpolate({
                                inputRange: [0, cellSize],
                                outputRange: [0, -cellSize],
                              }),
                            },
                            {
                              rotateY: translateAnimatedValue.interpolate({
                                inputRange: [0, cellSize],
                                outputRange: ["0deg", "360deg"],
                              }),
                            },
                          ],
                          ...styles.newChip,
                        }}
                      >
                        {game?.renderObject(
                          cell.player_uid,
                          0,
                          ChipTypes.explosion
                        )}
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
                              translateY: translateAnimatedValue.interpolate({
                                inputRange: [0, cellSize],
                                outputRange: [0, -cellSize],
                              }),
                            },
                            {
                              rotateY: translateAnimatedValue.interpolate({
                                inputRange: [0, cellSize],
                                outputRange: ["0deg", "360deg"],
                              }),
                            },
                          ],
                          ...styles.newChip,
                        }}
                      >
                        {game?.renderObject(
                          cell.player_uid,
                          0,
                          ChipTypes.explosion
                        )}
                      </Animated.View>
                    </>
                  )}
                </Animated.View>
              )}
            </>
          )}
        </View>
      </TouchableWithoutFeedback>
    );
  };

  const removePlayer = (uid: string) => {
    setOrderData((od: any) => {
      const updated = { ...od };
      let _order: string[] = updated["order"];

      if (_order.includes(uid) && _order.length > 1) {
        game?.removePlayer(uid);

        updated["order"] = (updated["order"] as string[]).filter(
          (pl_uid) => pl_uid !== uid
        );

        _order = updated["order"];

        if (player_uid === uid)
          Alert.alert("ПОРАЖЕНИЕ!", undefined, [
            {
              text: "ок",
              onPress: _order.length === 1 ? navigation.goBack : 0,
            },
          ]);
        else if (_order.length === 1 && _order[0] === player_uid)
          Alert.alert("ПОБЕДА!", undefined, [
            { text: "ок", onPress: navigation.goBack },
          ]);

        if (updated["currentPlayerIndex"] > od["order"].indexOf(uid))
          updated["currentPlayerIndex"]--;
        else if (updated["currentPlayerIndex"] === od["order"].indexOf(uid))
          updated["currentPlayerIndex"] =
            updated["currentPlayerIndex"] % updated["order"].length;
        return updated;
      }
      return od;
    });
  };

  const giveUp = () => {
    Alert.alert("Сдаться?", undefined, [
      { text: "Нет" },
      { text: "Да", onPress: navigation.goBack },
    ]);
  };

  useEffect(() => {
    setGame(new Field(instruction, order));

    return function cleanup() {
      socket.send(JSON.stringify({ type: "leave_field" }));
      onGoBack();
    };
  }, []);

  useEffect(() => {
    if (game) {
      let jumpersDepths = {};
      for (let i = 0; i < game.field.length; i++) {
        for (let j = 0; j < game.field[i].length; j++) {
          const chip = game.field[i][j];
          if (chip && (isJumper(chip) || isBombJumper(chip))) {
            const chipDepth = calculateDepth(chip, i, j);
            jumpersDepths = { ...jumpersDepths, [`${i}-${j}`]: chipDepth };
          }
        }
      }
      setJumpersIndexes(jumpersDepths);

      socket.onmessage = async function (event) {
        const message = JSON.parse(event.data);
        const type = message["type"];
        const data = message["data"];

        if (type === "player_moved") {
          const senderUid = data["uid"];
          if (senderUid !== player_uid) {
            makeMediumHaptic();
            const [i, j] = data["coordinates"];
            if (i !== -1) {
              if (game.field[i][j]?.player_uid !== player_uid) {
                await game.handleMove(i, j, startBoom, () =>
                  refresh((c) => c + 1)
                );
              }
            }
            sendReady();
          }
        } else if (type === "player_left_the_field") {
          const uid = data["uid"];
          removePlayer(uid);
          setConnectedPlayers((players) => players.filter((p) => p !== uid));
        } else if (type === "player_ready_for_move") {
          setReadyPlayers((players) => [...players, data["uid"]]);
        } else if (type === "get_ready") {
          socket.send(
            JSON.stringify({ type: "player_ready", data: { value: false } })
          );
        } else if (type === "message") {
          showNotification(data["username"], data["text"]);
        }
      };
      sendReady();
    }
  }, [game]);

  const checkScores = () => {
    if (game?.scores) {
      for (let uid of orderData["order"]) {
        if (!game.scores[uid]) {
          removePlayer(uid);
        }
      }
    }
  };

  useEffect(() => {
    const intersections = readyPlayers.filter((p) =>
      connectedPlayers.includes(p)
    );
    if (intersections.length === connectedPlayers.length) {
      setReadyPlayers([]);
      if (!firstMove) {
        move1Turn();
      } else {
        setFirstMove(false);
        if (orderData["order"][0] === player_uid && secondsForMove) runTimer();
      }
    }
  }, [readyPlayers, connectedPlayers]);

  return (
    game && (
      <View
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
        }}
      >
        <MoveOrder
          orderData={orderData}
          game={game}
          names_mapping={names_mapping}
          timeoutCounter={timeoutCounter}
        />

        <View
          style={{
            width: screenWidth + 1,
            display: "flex",
            flexDirection: "row",
            justifyContent: "center",
            flexWrap: "wrap",
            overflow: "hidden",
          }}
        >
          {Array.from(Array(game.field.length).keys()).map((i) => {
            return Array.from(Array(game.field[i].length).keys()).map((j) => {
              const cell = game.field[i][j];
              return renderCell(cell, i, j);
            });
          })}
        </View>
        <View style={{ display: "flex", flexDirection: "row", gap: 10 }}>
          <TouchableOpacity
            onPress={giveUp}
            style={{
              backgroundColor: colors.red,
              borderRadius: 5,
              marginTop: 20,
              marginBottom: 20,
              width: screenWidth / 3,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <FontAwesome5 name="skull-crossbones" size={24} color="white" />
          </TouchableOpacity>
          <ChatComponent
            style={{
              marginTop: 20,
              marginBottom: 20,
              width: screenWidth / 3,
            }}
          />
        </View>
      </View>
    )
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
    elevation: 2,
    backgroundColor: "#292a2e",
  },
});
