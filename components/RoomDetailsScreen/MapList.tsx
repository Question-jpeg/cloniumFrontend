import {
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Alert,
} from "react-native";
import React, { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getExampleFields } from "./playgrounds";
import InstructionField from "../InstructionField";

const screenWidth = Dimensions.get("window").width;

export default function MapList({ onSet, onDelete, fields }: { onSet: Function, onDelete: Function, fields: any[] }) {

  const renderField = (index: number, item: any) => {
    const newItem = JSON.parse(JSON.stringify(item))
    return (
      <TouchableOpacity
        onPress={() => onSet(newItem)}
        onLongPress={() =>
          Alert.alert("Удалить поле?", undefined, [
            { text: "Отмена" },
            { text: "Да", onPress: () => onDelete(index) },
          ])
        }
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <InstructionField instruction={item} width={screenWidth / 3}  />
        <Text style={{ marginTop: 10, color: "lightgrey" }}>
          {item.length} x {item[0].length}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    fields && (
      <FlatList
        data={fields}
        renderItem={({ index, item }) => renderField(index, item)}
        horizontal
        ItemSeparatorComponent={() => (
          <View style={{ marginHorizontal: 5 }}></View>
        )}
        showsHorizontalScrollIndicator={false}
        ListHeaderComponent={() => <View style={{ width: 50 }}></View>}
        ListFooterComponent={() => <View style={{ width: 50 }}></View>}
      ></FlatList>
    )
  );
}
