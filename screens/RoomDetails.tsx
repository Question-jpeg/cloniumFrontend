import {
  ScrollView,
  Dimensions,
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Text,
  KeyboardType,
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
import { Entypo } from "@expo/vector-icons";

const screenWidth = Dimensions.get("window").width;

export default function RoomDetails({ navigation, route }: any) {
  const { username } = route.params;
  const { socket }: { socket: WebSocket } = useContext(WebsocketContext);

  const [fields, setFields] = useState<any>([]);
  const [roomCode, setRoomCode] = useState<string>();
  const [playground, setPlayground] = useState<any[][]>();
  const [currentAction, setCurrentAction] = useState<
    "cell" | "player" | "chip"
  >("cell");

  const handleClick = (i: number, j: number) => {
    setPlayground((field: any) => {
      const newField = JSON.parse(JSON.stringify(field));
      const cell = newField[i][j];
      if (currentAction === "cell") {
        if (cell !== null) newField[i][j] = null;
        else newField[i][j] = 0;
      } else if (currentAction === "player") {
        let countOfPlayer = 0;

        newField.forEach((row: any) =>
          row.forEach((elem: any) => {
            countOfPlayer += elem === "p" ? 1 : 0;
          })
        );

        if (cell === "p") newField[i][j] = 0;
        else if (countOfPlayer < 4) newField[i][j] = "p";
        else Alert.alert("Вы не можете добавить более 4 игроков на поле");
      } else if (![null, "p"].includes(cell))
        newField[i][j] = (newField[i][j] + 1) % 4;
      else newField[i][j] = 1;
      return newField;
    });
  };

  const populateFields = async () => {
    setFields(getExampleFields());
    const value = await AsyncStorage.getItem("@fields");

    if (value) setFields((flds: any) => [...flds, ...JSON.parse(value)]);
  };

  const saveField = async () => {
    const value = await AsyncStorage.getItem("@fields");
    const storedFields = value ? (JSON.parse(value) as any[]) : [];
    storedFields.push(playground);
    await AsyncStorage.setItem("@fields", JSON.stringify(storedFields));
    setFields((flds: any) => [...flds, JSON.parse(JSON.stringify(playground))]);
  };

  const deleteField = async (index: number) => {
    const value = await AsyncStorage.getItem("@fields");
    const storedFields = value ? (JSON.parse(value) as any[]) : [];
    storedFields.splice(index - 1, 1);
    await AsyncStorage.setItem("@fields", JSON.stringify(storedFields));

    const updatedFields = [...fields];
    updatedFields.splice(index, 1);
    setFields(updatedFields);
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
      socket.send(JSON.stringify({ type: "destroy_room", data: {} }));
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
      const updatedField: any[] = JSON.parse(JSON.stringify(field))
      updatedField.forEach((row: any[]) => value > 0 ? row.push(0) : row.pop())
      return updatedField
    })
  }

  const extendY = (value: number) => {
    setPlayground((field: any) => {
      const updatedField: any[] = JSON.parse(JSON.stringify(field))
      value > 0 ? updatedField.push(Array(updatedField[0].length).fill(0)) : updatedField.pop()
      return updatedField
    })
  }

  return (
    <ScrollView
      contentContainerStyle={{
        gap: 15,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        // height: "100%",
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
      <View style={{ maxHeight: 200 }}>
        <MapList onSet={setPlayground} fields={fields} onDelete={deleteField} />
      </View>

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
                  marginLeft: 'auto',
                  gap: 15,
                }}
              >
                <TouchableOpacity
                onPress={() => extendX(-1)}
                  style={{ backgroundColor: "grey", borderRadius: 5 }}
                >
                  <Entypo name="chevron-left" size={32} color="lightgrey" />
                </TouchableOpacity>
                <Text style={{ color: "lightgrey", fontSize: 24 }}>
                  {playground[0].length}
                </Text>
                <TouchableOpacity
                onPress={() => extendX(1)}
                  style={{ backgroundColor: "grey", borderRadius: 5 }}
                >
                  <Entypo name="chevron-right" size={32} color="lightgrey" />
                </TouchableOpacity>
              </View>
              <InstructionField
                instruction={playground}
                width={screenWidth / 1.2}
                onClick={handleClick}
              />
              <View style={{marginTop: 10}}>
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
                marginBottom: 'auto',
                gap: 10,
              }}
            >
              <TouchableOpacity
              onPress={() => extendY(-1)}
                style={{ backgroundColor: "grey", borderRadius: 5 }}
              >
                <Entypo name="chevron-up" size={32} color="lightgrey" />
              </TouchableOpacity>
              <Text style={{ color: "lightgrey", fontSize: 24 }}>
                {playground.length}
              </Text>
              <TouchableOpacity
              onPress={() => extendY(1)}
                style={{ backgroundColor: "grey", borderRadius: 5 }}
              >
                <Entypo name="chevron-down" size={32} color="lightgrey" />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={{
              ...styles.button,
              borderWidth: 5,
              marginTop: 50,
            }}
            onPress={saveField}
          >
            <Text
              style={{
                ...styles.buttonText,
              }}
            >
              Сохранить поле
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              ...styles.button,
              backgroundColor: "#41d4f0d6",
            }}
            onPress={() => {
              if (roomCode) {
                socket.send(
                  JSON.stringify({ type: "update_field", data: { playground } })
                );
                navigation.navigate("Room", {
                  playground,
                  code: roomCode,
                  onGoBack: refreshSocket,
                });
              } else Alert.alert("Ошибка. Попробуйте ещё раз");
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

      <View style={{ height: 200 }}></View>
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
