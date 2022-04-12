import React, {useEffect} from 'react';
import 'react-native-gesture-handler';
import {NavigationContainer} from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, LogBox} from "react-native";
import { openDatabase } from 'react-native-sqlite-storage';

// import all page
import BLEScanner from './main/BLEScanner';
import BLESetting from './main/BLESetting';
import Location from './main/Location'
import Mailing from './main/Mailing';

LogBox.ignoreAllLogs();
// connect pre-populated database
const db = openDatabase({name: 'ble_db.db', createFromLocation: 1});
const Tab = createBottomTabNavigator();

const App = () => {
  useEffect(() => {
    db.transaction(function (txn) {
      txn.executeSql(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='ble_device'",[],
        function (tx, res) {
          console.log('item:', res.rows.length);
          if (res.rows.length == 0) {
            txn.executeSql('DROP TABLE IF EXISTS ble_device', []);
            txn.executeSql(
              'CREATE TABLE IF NOT EXISTS ble_device(mac_address VARCHAR(255) PRIMARY KEY, name TEXT DEFAULT "No Name")',[]);
            console.log("db created")
          }
        }
      );
    });
  }, []);
  return (
    <NavigationContainer>
      <Tab.Navigator initialRouteName="Location">

        {/* Showing user location */}
        <Tab.Screen
          name="Homepage"
          component={Location}
          options={{
            title: 'Homepage',
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

        {/* Scanning ble device */}
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

        {/* Setting tab */}
        <Tab.Screen
          name="Setting"
          component={BLESetting}
          options={{
            title: 'Setting',
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

        {/* testing tab */}
        {/* <Tab.Screen
          name="Mailing"
          component={Mailing}
          options={{
            title: 'Mailing',
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
