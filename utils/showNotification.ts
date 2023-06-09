import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

if (Platform.OS === 'android') {
  Notifications.setNotificationChannelAsync('default', {
    name: 'default',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF231F7C',
  })
}

export const showNotification = async (name: string, text: string) => {
  

  const { status } = await Notifications.requestPermissionsAsync();

  if (status === "granted") {
    Notifications.scheduleNotificationAsync({
      content: {
        title: name,
        body: text,
        data: {},
      },
      trigger: null,
    });
  }
};
