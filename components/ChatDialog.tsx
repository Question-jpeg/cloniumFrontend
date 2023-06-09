import {
  Animated,
  Keyboard,
  Text,
  TextInput,
  TouchableHighlight,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useContext, useEffect, useRef, useState } from "react";
import { WebsocketContext } from "../context/websocket";
import { animate } from "../utils/animate";

export default function ChatDialog({ visible }: { visible: boolean }) {
  const {
    socket,
    setChatVisible,
  }: { socket: WebSocket; setChatVisible: Function } =
    useContext<any>(WebsocketContext);

  const [messageText, setMessageText] = useState<string>();
  const [closing, setClosing] = useState<boolean>(false);

  const animatedValue = useRef(new Animated.Value(0)).current;

  const sendMessage = () => {
    if (messageText) {
      socket.send(
        JSON.stringify({ type: "send_message", data: { text: messageText } })
      );
      setClosing(true);
      setMessageText(undefined)
    }
  };

  useEffect(() => {
    if (visible) {
      animate(animatedValue, { toValue: 1, duration: 500 });
    }
  }, [visible]);

  useEffect(() => {
    if (closing) {
      Keyboard.dismiss();

      animate(animatedValue, { toValue: 0, duration: 500 }, () => {
        setChatVisible(false);
        setClosing(false);
      });
    }
  }, [closing]);

  return visible ? (
    <View
      style={{
        display: "flex",
        position: "absolute",
        width: "100%",
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Animated.View
        style={{
          backgroundColor: "#EFF1F0",
          borderRadius: 10,
          overflow: "hidden",
          width: "60%",
          opacity: animatedValue,
          transform: [
            {
              translateY: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -50],
              }),
            },
            {
              scale: animatedValue.interpolate({
                inputRange: [0, 0.45, 1],
                outputRange: [0.8, 0.8, 1],
              }),
            },
          ],
        }}
      >
        <Text
          style={{
            fontSize: 18,
            color: "#000100",
            fontWeight: "700",
            textAlign: "center",
            marginVertical: 10,
          }}
        >
          Сообщение
        </Text>
        <TextInput
          onChangeText={setMessageText}
          selectionColor={"grey"}
          multiline
          style={{
            backgroundColor: "#FEFEFE",
            borderColor: "#D2D2D0",
            borderWidth: 2,
            fontSize: 16,
            marginBottom: 10,
            marginHorizontal: 10,
            paddingHorizontal: 5,
          }}
          autoFocus
          onEndEditing={() => setClosing(true)}
        />
        <View
          style={{
            width: "100%",
            height: 1,
            backgroundColor: "#D2D2D0",
          }}
        ></View>
        <View
          style={{
            display: "flex",
            flexDirection: "row",
            width: "100%",
          }}
        >
          <TouchableHighlight
            onPress={() => setClosing(true)}
            underlayColor={"lightgrey"}
            style={{ flex: 1, paddingVertical: 10 }}
          >
            <Text style={{ color: "black", textAlign: "center" }}>Отмена</Text>
          </TouchableHighlight>
          <View
            style={{ height: "100%", width: 1, backgroundColor: "#D2D2D0" }}
          ></View>
          <TouchableHighlight
            onPress={sendMessage}
            underlayColor={"lightgrey"}
            style={{ flex: 1, paddingVertical: 10 }}
          >
            <Text style={{ color: "black", textAlign: "center" }}>
              Отправить
            </Text>
          </TouchableHighlight>
        </View>
      </Animated.View>
    </View>
  ) : (
    <></>
  );
}
