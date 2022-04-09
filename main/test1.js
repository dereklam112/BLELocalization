import React, {useState, useEffect} from "react";
import { PermissionsAndroid, View, Text, Button, Alert } from "react-native";
import { BleManager } from 'react-native-ble-plx';    
import { LogBox } from 'react-native';
LogBox.ignoreLogs(['new NativeEventEmitter']);

const manager = new BleManager();

const requestPermission = async () => {
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION, {
        title: "Request for Location Permission",
        message: "Bluetooth Scanner requires access to Fine Location Permission",
        buttonNeutral: "Ask Me Later",
        buttonNegative: "Cancel",
        buttonPositive: "OK"
      }
    );
    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      console.log('You can use the scanner');
      return true;
    } else {
      console.log('Permission denied');
      return false;
    }
  } catch (err) {
    console.warn(err);
    return false;
  }
}
const BLEScanner = () => {
  const [logData, setLogData] = useState([]);
  const [logCount, setLogCount] = useState(0);
  const [scannedDevices, setScannedDevices] = useState({});

  useEffect(() => {
    manager.onStateChange((state) => {
      const subscription = manager.onStateChange(async (state) => {
        console.log(state);
        const newLogData = logData;
        newLogData.push(state);
        await setLogData(newLogData);
        subscription.remove();
      }, true);
      return () => subscription.remove();
    });
  }, [manager]);
  return(
    <View>
      <Button
        title="Scan"
        onPress={async () => {
          const btState = await manager.state()
          // test if bluetooth is powered on
          if (btState!=="PoweredOn") {
            alert("Bluetooth is not powered on");
            return (false);
          }
          // explicitly ask for user's permission
          const permission = await requestPermission();
          if (permission) {
            manager.startDeviceScan(null, null, async (error, device) => {
                // error handling
                if (error) {
                  console.log(error);
                  return
                }
                // found a bluetooth device
                if (device) {
                  console.log(`${device.name} (${device.id}) ${device.rssi}` );
                  const newScannedDevices = scannedDevices;
                  newScannedDevices[device.id] = device;
                  await setScannedDevices(scannedDevices);
                }
            });
          }
          return (true);
        }}
      />
    </View>
  )
}

export default BLEScanner;
