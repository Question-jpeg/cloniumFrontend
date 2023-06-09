import React, { useRef, useEffect, useState } from "react";
import "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { Alert, StyleSheet, Text, View } from "react-native";
import { WebsocketContext } from "./context/websocket";
import StackNavigator, { Theme } from "./navigators/StackNavigator";
import { NavigationContainer } from "@react-navigation/native";
import { getNewSocket } from "./utils/connectToSocket";
import { AlertBox } from "react-native-alertbox";
import ChatDialog from "./components/ChatDialog";

export default function App() {
  const [player_uid, set_player_uid] = useState<string>();
  const [socket, setSocket] = useState<WebSocket>();
  const [numberOfTries, setNumberOfTries] = useState<number>(0);
  const [chatVisible, setChatVisible] = useState<boolean>(false);
  const socketRef = useRef<WebSocket>();

  socketRef.current = socket;

  const defineSocket = () => {
    const sock = getNewSocket();
    sock.onmessage = function (event) {
      const message = JSON.parse(event.data);
      const type = message["type"];
      const data = message["data"];

      if (type === "connection_established") {
        set_player_uid(data["uid"]);
        setNumberOfTries(0);
      }
    };
    sock.onclose = function () {
      setNumberOfTries((number) => {
        if (number === 0)
          Alert.alert(
            "Потеря соединения!",
            "Если вы были подключены к какой-либо комнате, перезайдите в неё"
          );
        if (number < 5) defineSocket();
        else {
          Alert.alert("Фатальная ошибка. Перезапустите приложение");
        }
        return number + 1;
      });
    };
    setSocket(sock);
  };

  useEffect(() => {
    defineSocket();
  }, []);

  return (
    <WebsocketContext.Provider
      value={{ socket, player_uid, setSocket, setChatVisible }}
    >
      {player_uid && (
        <NavigationContainer theme={Theme}>
          <StackNavigator />
        </NavigationContainer>
      )}
      <ChatDialog visible={chatVisible} />
      <StatusBar style="light" />
    </WebsocketContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    // flex: 1,
    backgroundColor: "#292a2e",
    // alignItems: "center",
    // justifyContent: "center",
  },
});
