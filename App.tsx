import React, { useEffect, useState } from "react";
import "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import FieldScreen from "./screens/FieldScreen";
import WelcomeScreen from "./screens/WelcomeScreen";
import { WebsocketContext } from "./context/websocket";
import StackNavigator, { Theme } from "./navigators/StackNavigator";
import { NavigationContainer } from "@react-navigation/native";
import { getNewSocket } from './utils/connectToSocket';

export default function App() {
  const [player_uid, set_player_uid] = useState<string>();
  const [socket, setSocket] = useState<WebSocket>();

  useEffect(() => {
    const sock = getNewSocket();
    sock.onmessage = function (event) {
      const message = JSON.parse(event.data);
      const type = message["type"];
      const data = message["data"];

      if (type === "connection_established") set_player_uid(data["uid"]);
    };

    sock.onclose = function(event) {
      setSocket(getNewSocket())
    }

    setSocket(sock);
  }, []);

  return (
    <WebsocketContext.Provider value={{ socket, player_uid, setSocket }}>
      {player_uid && (
        <NavigationContainer theme={Theme}>
          <StackNavigator />
        </NavigationContainer>
      )}

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
