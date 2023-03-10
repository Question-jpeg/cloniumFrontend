import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

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
