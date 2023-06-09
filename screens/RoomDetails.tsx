import {
  ScrollView,
  Dimensions,
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
} from "react-native";
import React, { useRef, useState, useEffect, useContext } from "react";
import { WebsocketContext } from "../context/websocket";
import MapList from "../components/RoomDetailsScreen/MapList";
import InstructionField from "../components/InstructionField";
import { sendReady } from "../utils/sendReady";
import { showNotification } from "./../utils/showNotification";
import { getExampleFields } from "./../components/RoomDetailsScreen/playgrounds";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Actions from "../components/RoomDetailsScreen/Actions";
import { Entypo, MaterialIcons } from "@expo/vector-icons";
import { makeMediumHaptic } from "./../utils/haptics";
import { ChipTypes } from "../utils/ChipTypes";
import { ActionTypes } from "../utils/ActionTypes";
import { colors } from "./../game_logic/config";

const screenWidth = Dimensions.get("window").width;

export default function RoomDetails({ navigation, route }: any) {
  const { username } = route.params;
  const { socket }: { socket: WebSocket } = useContext(WebsocketContext);

  const [fields, setFields] = useState<any>([]);
  const [roomCode, setRoomCode] = useState<string>();
  const [playground, setPlayground] = useState<any[][]>();
  const [currentAction, setCurrentAction] = useState<ActionTypes>(
    ActionTypes.cell
  );
  const [secForMove, setSecForMove] = useState<number | null>(null);
  const [fieldSaveDisabled, setFieldSaveDisabled] = useState<boolean>();

  const handleClick = (i: number, j: number) => {
    setPlayground((field: any) => {
      const newField = JSON.parse(JSON.stringify(field));
      const cell = newField[i][j];
      if (currentAction === ActionTypes.cell) {
        if (cell !== null) newField[i][j] = null;
        else newField[i][j] = 0;
      } else if (currentAction === ActionTypes.player) {
        let countOfPlayer = 0;

        newField.forEach((row: any) =>
          row.forEach((elem: any) => {
            countOfPlayer += elem === "p" ? 1 : 0;
          })
        );

        if (cell === "p") newField[i][j] = 0;
        else if (countOfPlayer < 4) newField[i][j] = "p";
        else Alert.alert("Вы не можете добавить более 4 игроков на поле");
      } else if (currentAction === ActionTypes.chip) {
        if (![null, "p"].includes(cell))
          newField[i][j] = (newField[i][j] + 1) % 4;
        else newField[i][j] = 1;
      } else if (currentAction === ActionTypes.bomb) {
        if (cell === "b") newField[i][j] = 0;
        else newField[i][j] = "b";
      } else if (
        [ActionTypes.jump, ActionTypes.jumpBomb].includes(currentAction)
      ) {
        const types =
          currentAction === ActionTypes.jump
            ? [
                ChipTypes.jumpTop,
                ChipTypes.jumpRight,
                ChipTypes.jumpDown,
                ChipTypes.jumpLeft,
              ]
            : [
                ChipTypes.jumpBombTop,
                ChipTypes.jumpBombRight,
                ChipTypes.jumpBombDown,
                ChipTypes.jumpBombLeft,
              ];

        if (cell && cell.toString().length >= 3) {
          const cellStr = cell.toString();
          const cellInfo = cellStr.split("-");
          const cellType = Number.parseInt(cellInfo[0]);
          const nextType = types[(types.indexOf(cellType) + 1) % 4];
          if ([ChipTypes.jumpTop, ChipTypes.jumpBombTop].includes(nextType))
            newField[i][j] = 0;
          else newField[i][j] = `${nextType}-${cellInfo[1]}`;
        } else {
          newField[i][j] = `${types[0]}-1`;
        }
      }

      return newField;
    });
  };

  const handleLongPress = (i: number, j: number) => {
    makeMediumHaptic();
    setPlayground((field: any) => {
      const newField = JSON.parse(JSON.stringify(field));
      const cell = newField[i][j];
      const cellInfo =
        cell && cell.toString().length >= 3 ? cell.split("-") : null;
      if (
        cellInfo &&
        [ActionTypes.jumpBomb, ActionTypes.jump].includes(currentAction)
      ) {
        if (cellInfo[1] !== "3")
          newField[i][j] = `${cellInfo[0]}-${Number.parseInt(cellInfo[1]) + 1}`;
        else newField[i][j] = 0;
      }
      return newField;
    });
  };

  const populateFields = async () => {
    setFields(getExampleFields());
    const value = await AsyncStorage.getItem("@fields");

    if (value) setFields((flds: any) => [...flds, ...JSON.parse(value)]);
  };

  const saveField = async () => {
    if (!saveDisabled()) {
      const value = await AsyncStorage.getItem("@fields");
      const storedFields = value ? (JSON.parse(value) as any[]) : [];
      storedFields.push(playground);
      await AsyncStorage.setItem("@fields", JSON.stringify(storedFields));
      setFields((flds: any) => [
        ...flds,
        JSON.parse(JSON.stringify(playground)),
      ]);
    }
    setFieldSaveDisabled(true);
  };

  const deleteField = async (index: number) => {
    if (index === 0) Alert.alert("Вы не можете удалить это поле");
    else {
      const value = await AsyncStorage.getItem("@fields");
      const storedFields = value ? (JSON.parse(value) as any[]) : [];
      storedFields.splice(index - 1, 1);
      await AsyncStorage.setItem("@fields", JSON.stringify(storedFields));

      const updatedFields = [...fields];
      updatedFields.splice(index, 1);
      setFields(updatedFields);
    }
  };

  useEffect(() => {
    populateFields();

    socket.onmessage = function (event) {
      const message = JSON.parse(event.data);
      const type = message["type"];
      const data = message["data"];
      if (type === "room_created") setRoomCode(data["code"]);
    };

    socket.send(
      JSON.stringify({
        type: "create_room",
        data: { username },
      })
    );

    return function cleanup() {
      socket.send(JSON.stringify({ type: "leave_room", data: {} }));
    };
  }, []);

  const refreshSocket = () => {
    socket.onmessage = function (event) {
      const message = JSON.parse(event.data);
      const type = message["type"];
      const data = message["data"];

      if (type === "get_ready") {
        sendReady(socket, false);
      } else if (type === "message") {
        showNotification(data["username"], data["text"]);
      }
    };
  };

  const extendX = (value: number) => {
    setPlayground((field: any) => {
      const updatedField: any[] = JSON.parse(JSON.stringify(field));

      updatedField.forEach((row: any[]) =>
        value > 0 ? row.push(0) : row.pop()
      );

      return updatedField;
    });
  };

  const extendY = (value: number) => {
    setPlayground((field: any) => {
      const updatedField: any[] = JSON.parse(JSON.stringify(field));

      if (value > 0) {
        updatedField.push(Array(updatedField[0].length).fill(0));
      } else updatedField.pop();

      return updatedField;
    });
  };

  const isShortXDisabled = () =>
    playground![0].length < 5 || playground![0].length === playground!.length;

  const isExtendXDisabled = () => playground![0].length > 14;

  const isShortYDisabled = () => playground!.length < 5;

  const isExtendYDisabled = () =>
    playground!.length > 14 || playground!.length === playground![0].length;

  const saveDisabled = () => {
    for (let field of fields) {
      let isEqual = true;
      for (let i = 0; i < field.length; i++) {
        if (isEqual)
          for (let j = 0; j < field[i].length; j++) {
            if (field[i][j] !== playground![i][j]) {
              isEqual = false;
              break;
            }
          }
        else break;
      }
      if (isEqual) return true;
    }
    return false;
  };

  useEffect(() => {
    if (playground) setFieldSaveDisabled(false);
  }, [playground]);

  return (
    <ScrollView
      contentContainerStyle={{
        gap: 15,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        paddingTop: "20%",
      }}
    >
      <Text
        style={{
          color: "lightgrey",
          fontSize: 32,
          fontWeight: "700",
        }}
      >
        Редактор поля
      </Text>
      <View
        style={{
          width: "100%",
          height: 2,
          backgroundColor: "lightgrey",
          marginTop: 20,
          marginBottom: 5,
        }}
      ></View>
      <MapList onSet={setPlayground} fields={fields} onDelete={deleteField} />
      <View
        style={{
          width: "100%",
          height: 2,
          backgroundColor: "lightgrey",
          marginBottom: 20,
        }}
      ></View>

      {playground && (
        <>
          <View
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
            }}
          >
            <View
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 10,
              }}
            >
              <View
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  flexDirection: "row",
                  marginLeft: "auto",
                  gap: 15,
                }}
              >
                <TouchableOpacity
                  onPress={saveField}
                  disabled={fieldSaveDisabled}
                  style={{
                    flex: 1,
                    backgroundColor: fieldSaveDisabled ? "grey" : colors.blue,
                    opacity: fieldSaveDisabled ? 0.5 : 1,
                    borderRadius: 5,
                    padding: 5,
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 5,
                  }}
                >
                  {fieldSaveDisabled ? (
                    <MaterialIcons name="check" size={24} color="white" />
                  ) : (
                    <MaterialIcons name="save" size={24} color="white" />
                  )}
                  <Text
                    style={{ color: "white", fontWeight: "700", fontSize: 16 }}
                  >
                    {fieldSaveDisabled ? "Сохранено!" : "Сохранить"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  disabled={isShortXDisabled()}
                  onPress={() => extendX(-1)}
                  style={{
                    backgroundColor: "grey",
                    borderRadius: 5,
                    opacity: isShortXDisabled() ? 0.2 : 1,
                  }}
                >
                  <Entypo name="chevron-left" size={32} color="lightgrey" />
                </TouchableOpacity>
                <Text style={{ color: "lightgrey", fontSize: 24 }}>
                  {playground[0].length}
                </Text>
                <TouchableOpacity
                  disabled={isExtendXDisabled()}
                  onPress={() => extendX(1)}
                  style={{
                    backgroundColor: "grey",
                    borderRadius: 5,
                    opacity: isExtendXDisabled() ? 0.2 : 1,
                  }}
                >
                  <Entypo name="chevron-right" size={32} color="lightgrey" />
                </TouchableOpacity>
              </View>
              <InstructionField
                instruction={playground}
                width={screenWidth / 1.2}
                onClick={handleClick}
                onLongPress={handleLongPress}
              />

              <View style={{ marginTop: 10 }}>
                <Actions
                  currentAction={currentAction}
                  setCurrentAction={setCurrentAction}
                />
              </View>
            </View>

            <View
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                marginBottom: "auto",
                gap: 10,
              }}
            >
              <TouchableOpacity
                disabled={isShortYDisabled()}
                onPress={() => extendY(-1)}
                style={{
                  backgroundColor: "grey",
                  borderRadius: 5,
                  opacity: isShortYDisabled() ? 0.2 : 1,
                }}
              >
                <Entypo name="chevron-up" size={32} color="lightgrey" />
              </TouchableOpacity>
              <Text style={{ color: "lightgrey", fontSize: 24 }}>
                {playground.length}
              </Text>
              <TouchableOpacity
                disabled={isExtendYDisabled()}
                onPress={() => extendY(1)}
                style={{
                  backgroundColor: "grey",
                  borderRadius: 5,
                  opacity: isExtendYDisabled() ? 0.2 : 1,
                }}
              >
                <Entypo name="chevron-down" size={32} color="lightgrey" />
              </TouchableOpacity>
            </View>
          </View>
          <View
            style={{
              width: "100%",
              height: 2,
              backgroundColor: "lightgrey",
              marginTop: 10,
            }}
          ></View>
          <View
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-evenly",
              width: "100%",
              paddingHorizontal: "10%",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Text style={{ color: "lightgrey", fontSize: 20 }}>
              Время на ход
            </Text>
            <View style={{ display: "flex", flexDirection: "row", gap: 15 }}>
              {[5, 10, 15, null].map((secs) => (
                <TouchableOpacity
                  key={secs}
                  style={{
                    backgroundColor:
                      secForMove === secs ? "grey" : "transparent",
                    borderRadius: 5,
                    padding: 5,
                  }}
                  onPress={() => {
                    setSecForMove(secs);
                  }}
                >
                  <Text
                    style={{
                      color: "lightgrey",
                      fontSize: 20,
                      textAlign: "center",
                    }}
                  >
                    {secs ?? "∞"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View
            style={{
              width: "100%",
              height: 2,
              backgroundColor: "lightgrey",
            }}
          ></View>
          <TouchableOpacity
            style={{
              ...styles.button,
              backgroundColor: "#41d4f0d6",
              marginTop: 20,
            }}
            onPress={() => {
              if (roomCode) {
                const playersCount = playground
                  .flatMap((row) => row)
                  .filter((elem) => elem === "p").length;

                if (playersCount > 1) {
                  socket.send(
                    JSON.stringify({
                      type: "update_field",
                      data: { playground, secondsForMove: secForMove },
                    })
                  );
                  navigation.navigate("Room", {
                    playground,
                    code: roomCode,
                    onGoBack: refreshSocket,
                  });
                } else {
                  Alert.alert("Добавьте игроков на поле");
                }
              } else Alert.alert("Ошибка. Попробуйте перезапустить приложение");
            }}
          >
            <Text
              style={{
                ...styles.buttonText,
              }}
            >
              Войти в комнату
            </Text>
          </TouchableOpacity>
        </>
      )}

      <View style={{ height: 350 }}></View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 30,
  },
  textInput: {
    borderColor: "lightgrey",
    borderWidth: 3,
    borderRadius: 20,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minWidth: 50,
  },
  button: {
    borderColor: "lightgrey",
    borderWidth: 7,
    borderRadius: 20,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: "95%",
  },
  buttonText: {
    color: "white",
    fontSize: 20,
    margin: 10,
    fontWeight: "700",
  },
});
