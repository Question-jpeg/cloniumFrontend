import { useContext, useEffect, useState } from "react";
import {
  Dimensions,
  View,
  Text,
  Button,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import React from "react";
import { WebsocketContext } from "./../context/websocket";
import { shuffle } from "./../utils/shuffle";
import * as Clipboard from "expo-clipboard";
import InstructionField from "../components/InstructionField";
import { AntDesign } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "./../game_logic/config";
import { sendReady } from "../utils/sendReady";
import { showNotification } from "./../utils/showNotification";

const screenWidth = Dimensions.get("window").width;

export default function RoomScreen({ route, navigation }: any) {
  const { playground, username, code, onGoBack } = route.params;
  const { socket, player_uid }: { socket: WebSocket; player_uid: string } =
    useContext<any>(WebsocketContext);

  const [players, setPlayers] = useState<any>({});
  const [readyPlayers, setReadyPlayers] = useState<any>([]);
  const [isReady, setIsReady] = useState<boolean>(true);
  const [field, setField] = useState<any[][]>();

  const addPlayer = (uid: string, name: string) => {
    setPlayers((players: any) => {
      return { ...players, [uid]: name };
    });
  };

  const removePlayer = (uid: string) => {
    setPlayers((players: any) => {
      const updatedPlayers = { ...players };
      delete updatedPlayers[uid];
      return updatedPlayers;
    });
  };

  const refreshRoom = () => {
    setWebsocketListener();
    socket.send(JSON.stringify({ type: "get_room_info" }));
  };

  const sendIsReady = () => {
    sendReady(socket, isReady);
  };

  const navigateToField = (
    order: string[],
    names_mapping: any,
    instruction: any
  ) => {
    navigation.navigate("Field", {
      instruction,
      order,
      names_mapping,
      onGoBack: refreshRoom,
    });
  };

  const setWebsocketListener = () => {
    socket.onmessage = function (event) {
      const message = JSON.parse(event.data);
      const type = message["type"];
      const data = message["data"];

      if (type === "field_info") setField(data["playground"]);
      else if (type === "player_info") {
        const uid = data["uid"];
        const name = data["name"];
        addPlayer(uid, name);
      } else if (type === "player_left") {
        const uid = data["uid"];
        removePlayer(uid);
      } else if (type === "game_started") {
        const order = data["order"];
        const names_mapping = data["names_mapping"];
        const instruction = data["field"];
        navigateToField(order, names_mapping, instruction);
      } else if (
        (type === "room_destroyed" && username) ||
        type === "disconnected"
      ) {
        navigation.goBack();
      } else if (type === "get_ready") {
        sendIsReady();
      } else if (type === "player_ready") {
        if (data["value"] === true)
          setReadyPlayers((rps: any) => ({ ...rps, [data["uid"]]: true }));
        else {
          setReadyPlayers((rps: any) => {
            const updated = { ...rps };
            delete updated[data["uid"]];
            return updated;
          });
        }
      } else if (type === "message") {
        showNotification(data["username"], data["text"]);
      }
    };
  };

  useEffect(() => {
    setWebsocketListener();
    if (playground) {
      socket.send(JSON.stringify({ type: "get_room_info" }));
    }

    if (username) {
      socket.send(
        JSON.stringify({
          type: "connect_to_room",
          data: { username, code },
        })
      );
    }

    return function cleanup() {
      if (username) {
        socket.send(JSON.stringify({ type: "leave_room", data: {} }));
      }
      if (playground) {
        sendReady(socket, false);
        onGoBack();
      }
    };
  }, []);

  const startGame = () => {
    const players_uids = Object.keys(players);

    shuffle(players_uids);
    socket.send(
      JSON.stringify({
        type: "start_game",
        data: { order: players_uids, names_mapping: players },
      })
    );
  };

  const sendMessage = () => {
    Alert.prompt("Cообщение", "", [
      { text: "Отмена" },
      {
        text: "Отправить",
        onPress(value?) {
          socket.send(
            JSON.stringify({ type: "send_message", data: { text: value } })
          );
        },
      },
    ]);
  };

  return (
    <View
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100%",
      }}
    >
      <TouchableOpacity
        style={{
          ...styles.button,
          borderWidth: 5,
          marginBottom: 30,
        }}
        onPress={() => {
          Clipboard.setStringAsync(code);
        }}
      >
        <Text
          style={{
            ...styles.buttonText,
          }}
        >
          Скопировать код комнаты
        </Text>
      </TouchableOpacity>
      <View
        style={{
          width: "100%",
          height: 2,
          backgroundColor: "lightgrey",
          marginBottom: 20,
        }}
      ></View>
      {field && (
        <InstructionField instruction={field} width={screenWidth / 3} />
      )}
      <View
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          marginTop: 20,
          gap: 10,
        }}
      >
        {!playground && (
          <>
            <TouchableOpacity
              onPress={() => {
                setIsReady(true);
                sendReady(socket, true);
              }}
              style={{
                backgroundColor: colors.green,
                padding: 5,
                borderRadius: 5,
              }}
            >
              <AntDesign name="like1" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setIsReady(false);
                sendReady(socket, false);
              }}
              style={{
                backgroundColor: colors.red,
                padding: 5,
                borderRadius: 5,
              }}
            >
              <AntDesign name="dislike1" size={24} color="white" />
            </TouchableOpacity>
          </>
        )}
        <TouchableOpacity
          onPress={sendMessage}
          style={{
            backgroundColor: colors.blue,
            padding: 5,
            borderRadius: 5,
            width: playground ? screenWidth / 3 : "auto",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <MaterialCommunityIcons name="chat" size={24} color="white" />
        </TouchableOpacity>
      </View>
      <View
        style={{
          width: "100%",
          height: 2,
          backgroundColor: "lightgrey",
          marginTop: 20,
          marginBottom: 10,
        }}
      ></View>

      {Object.keys(players).map((uid: string) => {
        const name = players[uid];
        return (
          <Text
            ellipsizeMode='clip'
            numberOfLines={1}
            style={{ ...styles.text, marginHorizontal: 20 }}
            key={name}
          >
            {readyPlayers[uid] ? "✓ " : "✗ "}
            {name}
          </Text>
        );
      })}

      <View style={{ flex: 0.5 }}></View>

      {Object.keys(players).length === Object.keys(readyPlayers).length &&
        playground && (
          <TouchableOpacity
            style={{
              ...styles.button,
              backgroundColor: "#3ee660d6",
              marginTop: 20,
            }}
            onPress={startGame}
          >
            <Text
              style={{
                ...styles.buttonText,
              }}
            >
              Начать игру
            </Text>
          </TouchableOpacity>
        )}
    </View>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 32,
    fontWeight: "700",
    color: "lightgrey",
  },

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
