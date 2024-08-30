import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { fontLists } from '../assets/fonts/fontLists';
import { useFonts } from "expo-font";
import { Text } from "react-native";

import TabNavigator from './tab-navigator';
import Modal from '../screens/modal';
import { ScreenContent } from "../components/ScreenContent";

export type RootStackParamList = {
  TabNavigator: undefined;
  Modal: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function RootStack() {
  const [fontsLoaded] = useFonts(fontLists);
  if (!fontsLoaded) {
    return <ScreenContent/>;
  }
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="TabNavigator">
        <Stack.Screen
          name="TabNavigator"
          component={TabNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Modal"
          component={Modal}
          options={{ presentation: 'modal', headerLeft: () => null }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
