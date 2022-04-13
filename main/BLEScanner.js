import React, {useState, useEffect,} from 'react';
import {
  SafeAreaView, StyleSheet, ScrollView, View, 
  Text, NativeModules, NativeEventEmitter, 
  Button, PermissionsAndroid, FlatList,
} from 'react-native';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import BleManager from './BleManager';
import { LogBox } from 'react-native';
LogBox.ignoreLogs(['new NativeEventEmitter']);
import { openDatabase } from 'react-native-sqlite-storage';
import { useIsFocused } from '@react-navigation/native';

// connect to the sqlite db
const db = openDatabase(
  {
    name: 'ble_db.db', 
    createFromLocation: 1
  }, () => {},
  error => {console.log(error)}
);

const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

const BLEScanner = ({navigation}) => {
  const [isScanning, setIsScanning] = useState(false);
  const peripherals = new Map();
  const [list, setList] = useState([]);
  const [discoveredBleList, setDiscoveredBleList] = useState([]);
  const LoopTime = 10000; //10 sec
  const [focus, setFocus] = useState(true);

  const screenFocus = () =>{
    const isFocus = useIsFocused();
    setFocus(isFocus)
  }

  // get bluetooth permission
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
        // console.log('Permission is OK');
        return true;
      } else {
        // console.log('Permission denied');
        return false;
      }
    } catch (err) {
      console.warn(err);
      return false;
    }
  }
  
  // check the bluetooth state, request the user to turn on bluetooth when it is off
  const btState = () => {
    BleManager.enableBluetooth()
    .then(() => {
      // Success code
      // console.log("The bluetooth is already enabled or the user confirm");
      return(true)
    })
    .catch((error) => {
      // Failure code
      // console.log("The user refuse to enable bluetooth");
      return(false)
    });
  }
  
  // scan nearby ble device
  const startScan = () => {
    if (!isScanning) {
      // scan for Eddystone Service UUID (feaa)
      BleManager.scan(["feaa"], 5, true).then((results) => {
        console.log('Scanning...');
        setIsScanning(true);
      }).catch(err => {
        console.error(err);
      });
    }
  }
  
  const handleStopScan = () => {
    console.log('Scan is stopped');
    setIsScanning(false);
  }
  
  // get scanned ble device info
  const handleDiscoverPeripheral = (peripheral) => {
    console.log('Detected BLE Device', peripheral.id, peripheral.rssi, peripheral.advertising );
    peripherals.set(peripheral.id, peripheral);
    setList(Array.from(peripherals.values()));
  }

  const handleDisconnectedPeripheral = (data) => {
    let peripheral = peripherals.get(data.peripheral);
    if (peripheral) {
      peripheral.connected = false;
      peripherals.set(peripheral.id, peripheral);
      setList(Array.from(peripherals.values()));
    }
    console.log('Disconnected from ' + data.peripheral);
  }

  useEffect(() => {
    // check for active screen
    screenFocus;
    if (focus==true){
      BleManager.start({showAlert: false});
      bleManagerEmitter.addListener('BleManagerDiscoverPeripheral', handleDiscoverPeripheral);
      bleManagerEmitter.addListener('BleManagerStopScan', handleStopScan );
      bleManagerEmitter.addListener('BleManagerDisconnectPeripheral', handleDisconnectedPeripheral );
  
      //looping the scan process every 10 sec
      const interval = setInterval ( async () =>{
        btState();
        const permission = await requestPermission();
        if (permission && focus) {
          startScan()
        }
        console.log("log every 10 seconds")
      }, LoopTime)
  
      
      return (() => {
        console.log('unmount');
        bleManagerEmitter.removeListener('BleManagerDiscoverPeripheral', handleDiscoverPeripheral);
        bleManagerEmitter.removeListener('BleManagerStopScan', handleStopScan );
        bleManagerEmitter.removeListener('BleManagerDisconnectPeripheral', handleDisconnectedPeripheral );
        clearInterval(interval);
      })
    }
    else{
      console.log("this screen is inactive")
    }
  }, [focus]);

  // display the info of scanned ble devices
  const renderItem = (item) => {
    return (
        <View style={[styles.row]}>
          {/*set the target ble beacons*/}
          <Button
            title={item.id}
            onPress = {()=>{
              addDevice(item);
            }}
            style = {{paddingTop: 5}}
            color = "green"
          />
          <Text style={{fontSize: 12, textAlign: 'center', color: '#333333', padding: 2}}>RSSI: {item.rssi}</Text>
        </View>
    );
  }

  // add target ble
  const addDevice = (item) => {
    if (discoveredBleList.indexOf(item.id) === -1){
      setDiscoveredBleList([...discoveredBleList, item.id]);
      // setSelectedBle(item.id);
      // add to db
      db.transaction(function(tx){
        tx.executeSql(
          "INSERT INTO ble_device (mac_address) VALUES (?)",[item.id],
          (tx, res) => {
            console.log("Result", res.rowsAffected);
            if (res.rowsAffected > 0){
              console.log("Data inserted")
            }
          }
        )
      })
    }
    console.log(discoveredBleList);
  }

  // remove selected ble
  const removeDevice = (item) => {
    setDiscoveredBleList((prevState) =>
      prevState.filter((prevItem) => prevItem !== item)
    );
    db.transaction(function(tx){
      tx.executeSql(
        "DELETE FROM ble_device WHERE mac_address=?",[item],
        (tx, res) => {
          console.log("Result", res.rowsAffected);
          if (res.rowsAffected > 0){
            console.log("Data deleted")
          }
        }
      )
    })
    console.log(discoveredBleList);
  }

  // app ui
  return (
    <>
      <SafeAreaView>

        {/* display the select ble beacon */}
        <View style={{minHeight:100}}>
          <Text style={styles.title}>Selected BLE devices</Text>
          <Text style={{textAlign:"center"}}>(Press to remove)</Text>
          {discoveredBleList.map((item, key)=>(
            <Button key={key} title={item} onPress = {()=>
              removeDevice(item)
            }/>
          ))}
        </View>

        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          style={styles.scrollView}>

          {global.HermesInternal == null ? null : (
            <View style={styles.engine}>
              <Text style={styles.footer}>Engine: Hermes</Text>
            </View>
          )}

          <View style={styles.body}>
            <View>
              <Text style={styles.title}>Scan Bluetooth ({isScanning ? "Scanning..." : "off"})</Text>
            </View>
            {(list.length == 0) &&
              <View style={{flex:1, margin: 20}}>
                <Text style={{textAlign: 'center'}}>No peripherals</Text>
              </View>
            }
          </View>
        </ScrollView>

        <FlatList
            data={list}
            renderItem={({ item }) => renderItem(item) }
            keyExtractor={item => item.id}
          /> 

      </SafeAreaView>
    </>
  );
};

//app css
const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: Colors.lighter,
  },
  engine: {
    position: 'absolute',
    right: 0,
  },
  title: {
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold'
  },
  body: {
    backgroundColor: Colors.white,
  },
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.black,
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
    color: Colors.dark,
  },
  highlight: {
    fontWeight: '700',
  },
  footer: {
    color: Colors.dark,
    fontSize: 12,
    fontWeight: '600',
    padding: 4,
    paddingRight: 12,
    textAlign: 'right',
  },
});

export default BLEScanner;