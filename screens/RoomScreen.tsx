import { useContext, useEffect, useState, useRef } from "react";
import {
  ScrollView,
  Dimensions,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import React from "react";
import { WebsocketContext } from "./../context/websocket";
import { shuffle } from "./../utils/shuffle";
import * as Clipboard from "expo-clipboard";
import InstructionField from "../components/InstructionField";
import { AntDesign } from "@expo/vector-icons";
import { colors } from "./../game_logic/config";
import { sendReady } from "../utils/sendReady";
import { showNotification } from "./../utils/showNotification";
import ChatComponent from "./../components/ChatComponent";

const screenWidth = Dimensions.get("window").width;

export default function RoomScreen({ route, navigation }: any) {
  const { playground, username, code, onGoBack } = route.params;
  const { socket, player_uid }: { socket: WebSocket; player_uid: string } =
    useContext<any>(WebsocketContext);

  const [players, setPlayers] = useState<any>({});
  const [readyPlayers, setReadyPlayers] = useState<any>([]);
  const [isReady, setIsReady] = useState<boolean>(true);
  const [field, setField] = useState<any[][]>();
  const [host, setHost] = useState<string>();

  const isReadyRef = useRef<boolean>(true);
  isReadyRef.current = isReady;

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
    setReadyPlayers((rps: any) => {
      const updated = { ...rps };
      delete updated[uid];
      return updated;
    });
  };

  const refreshRoom = () => {
    setWebsocketListener();
    socket.send(JSON.stringify({ type: "get_room_info" }));
  };

  const sendIsReady = () => {
    sendReady(socket, isReadyRef.current);
  };

  const navigateToField = (
    order: string[],
    names_mapping: any,
    instruction: any,
    secondsForMove: number|null
  ) => {
    navigation.navigate("Field", {
      instruction,
      order,
      names_mapping,
      secondsForMove,
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
        const isHost = data["is_host"];
        if (isHost) setHost(uid);
        addPlayer(uid, name);
      } else if (type === "player_left") {
        const uid = data["uid"];
        removePlayer(uid);
      } else if (type === "game_started") {
        const order = data["order"];
        const names_mapping = data["names_mapping"];
        const instruction = data["field_data"]['playground'];
        const timeForMove = data['field_data']['secondsForMove']
        setReadyPlayers({});
        setPlayers({});
        navigateToField(order, names_mapping, instruction, timeForMove);
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

  return (
    <ScrollView contentContainerStyle={{ paddingTop: "30%" }}>
      <View
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
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
          <InstructionField instruction={field} width={screenWidth / 2} />
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
          <ChatComponent
            style={{ width: playground ? screenWidth / 3 : "auto" }}
          />
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

        {!(host && Object.keys(players).includes(host)) &&
          Object.keys(players).length > 0 && (
            <Text style={{ ...styles.text }}>! Создатель вышел !</Text>
          )}
        {Object.keys(players).map((uid: string) => {
          const name = players[uid];
          return (
            <Text
              ellipsizeMode="clip"
              numberOfLines={1}
              style={{ ...styles.text, marginHorizontal: 20 }}
              key={name}
            >
              {readyPlayers[uid] ? "✓ " : "✗ "}
              {name}
              {uid === host ? " ☆" : ""}
            </Text>
          );
        })}
        {Object.keys(players).length === 0 && (
          <Text style={{ ...styles.text }}>...</Text>
        )}

        <View style={{ flex: 0.5 }}></View>

        {Object.keys(players).length === Object.keys(readyPlayers).length &&
          Object.keys(players).length > 1 &&
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
      <View style={{ height: 300 }}></View>
    </ScrollView>
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
