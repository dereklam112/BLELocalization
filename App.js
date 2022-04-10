import 'react-native-gesture-handler';

import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import { View, LogBox } from "react-native";

// import all page
import BLEScanner from './main/BLEScanner';

LogBox.ignoreAllLogs();

const Stack = createStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="BLEScanner">
        <Stack.Screen
          name="BLEScanner"
          component={BLEScanner}
          options={{
            title: 'Home',
            headerStyle: {
              backgroundColor: '#f7764f',
              height: 40,
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold', 
            },
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
