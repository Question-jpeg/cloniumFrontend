import React, { useContext, useState, useRef, useEffect } from "react";
import {
  Text,
  View,
  Animated,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
} from "react-native";
import { colorMapping } from "./../game_logic/config";
import Title from "../components/WelcomeScreen/Title";
import * as Clipboard from "expo-clipboard";
import { isValidUUID } from "../utils/checkUUID";

export default function WelcomeScreen({ navigation }: any) {
  const textInput = useRef<any>(null);
  const [isEditing, setIsEditing] = useState<Boolean>(false);
  const [username, setUsername] = useState<string>();

  const focusInput = () => {
    if (textInput.current) {
      textInput.current.focus();
    }
  };

  return (
    <View
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        width: "100%",
      }}
    >
      <Title />
      <View style={{ height: "10%" }}></View>
      <View style={{ width: "70%" }}>
        <TouchableOpacity
          onPress={() => {
            !isEditing && focusInput();
          }}
          style={{ zIndex: 999, elevation: 999 }}
        >
          <TextInput
            pointerEvents={!isEditing ? "none" : "auto"}
            onFocus={() => setIsEditing(true)}
            onEndEditing={() => setIsEditing(false)}
            onChangeText={(text) => setUsername(text.trim())}
            ref={textInput}
            placeholder="Имя"
            placeholderTextColor="lightgrey"
            cursorColor="lightgrey"
            selectionColor={"lightgrey"}
            style={{
              ...styles.button,
              marginBottom: "10%",
              fontSize: 20,
              textAlign: "center",
              padding: 5,
              color: "white",
            }}
          ></TextInput>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            ...styles.button,
            backgroundColor: "#41d4f0d6",
            marginBottom: 10,
          }}
          onPress={() => {
            if (!username) Alert.alert("Введите свой ник");
            else navigation.navigate("RoomDetails", {username});
          }}
        >
          <Text
            style={{
              ...styles.buttonText,
            }}
          >
            Создать
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            ...styles.button,
            backgroundColor: "#3ee660d6",
          }}
          onPress={async () => {
            const clipString = await Clipboard.getStringAsync();
            if (!username) Alert.alert("Введите свой ник");
            else if (isValidUUID(clipString))
              navigation.navigate("Room", {
                code: clipString,
                username
              });
            else {
              Alert.alert("Вы не скопировали код комнаты");
            }
          }}
        >
          <Text
            style={{
              ...styles.buttonText,
            }}
          >
            Подключиться
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    borderColor: "lightgrey",
    borderWidth: 7,
    borderRadius: 20,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 20,
    margin: 10,
    fontWeight: "700",
  },
});
