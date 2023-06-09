import React, { useContext, useState } from "react";
import Dialog from "react-native-dialog";
import { Dimensions, TouchableOpacity, StyleSheet } from "react-native";
import { colors } from "../game_logic/config";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { WebsocketContext } from "../context/websocket";

const screenWidth = Dimensions.get("window").width;

export default function ChatComponent({
  style,
}: {
  style?: any;
}) {
  
  const { setChatVisible }: { setChatVisible: Function } =
    useContext<any>(WebsocketContext);

  
  return (
    <>
      <TouchableOpacity
        onPress={() => setChatVisible(true)}
        style={{
          ...style,
          backgroundColor: colors.blue,
          padding: 5,
          borderRadius: 5,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <MaterialCommunityIcons name="chat" size={24} color="white" />
        
      </TouchableOpacity>
    </>
  );
}
