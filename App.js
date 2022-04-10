import React from 'react';
import 'react-native-gesture-handler';
import {NavigationContainer} from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, LogBox } from "react-native";

// import all page
import BLEScanner from './main/BLEScanner';
import Database from './main/Database';

LogBox.ignoreAllLogs();

const Tab = createBottomTabNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator initialRouteName="BLEScanner">

        {/* Configuration Page */}
        <Tab.Screen
          name="BLEScanner"
          component={BLEScanner}
          options={{
            title: 'BLE Beacon',
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

        {/* Showing user location */}
        <Tab.Screen
          name="db"
          component={Database}
          options={{
            title: 'db',
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

        {/* Showing user left */}
        {/* <Tab.Screen
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
        /> */}
      </Tab.Navigator>
    </NavigationContainer>
  );
};

export default App;
