import { DefaultTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import WelcomeScreen from '../screens/WelcomeScreen';
import FieldScreen from './../screens/FieldScreen';
import RoomScreen from './../screens/RoomScreen';
import RoomDetails from './../screens/RoomDetails';
import { colors } from './../game_logic/config';

const Stack = createStackNavigator();

export const Theme = {...DefaultTheme, colors: {...DefaultTheme.colors, background: colors.background}}

export default function StackNavigator() {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="Home" component={WelcomeScreen} />
      <Stack.Screen name="Room" component={RoomScreen} />
      <Stack.Screen name="RoomDetails" component={RoomDetails} />
      <Stack.Screen name="Field" component={FieldScreen} />
    </Stack.Navigator>
  );
}