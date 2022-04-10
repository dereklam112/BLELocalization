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

const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

const App = () => {
  const [isScanning, setIsScanning] = useState(false);
  const peripherals = new Map();
  const [list, setList] = useState([]);
  const LoopTime = 10000; //10 sec

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
        console.log('Permission is OK');
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
  
  // check the bluetooth state, request the user to turn on bluetooth when it is off
  const btState = () => {
    BleManager.enableBluetooth()
    .then(() => {
      // Success code
      console.log("The bluetooth is already enabled or the user confirm");
      return(true)
    })
    .catch((error) => {
      // Failure code
      console.log("The user refuse to enable bluetooth");
      return(false)
    });
  }
  
  // scan nearby ble device
  const startScan = () => {
    if (!isScanning) {
      BleManager.scan([], 5, true).then((results) => {
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
    console.log('Detected BLE Device', peripheral.id, peripheral.rssi);
    if (!peripheral.name) {
      peripheral.name = 'NO NAME';
    }
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
    BleManager.start({showAlert: false});
    bleManagerEmitter.addListener('BleManagerDiscoverPeripheral', handleDiscoverPeripheral);
    bleManagerEmitter.addListener('BleManagerStopScan', handleStopScan );
    bleManagerEmitter.addListener('BleManagerDisconnectPeripheral', handleDisconnectedPeripheral );

    //looping the scan process every 10 sec
    const interval = setInterval ( async () =>{
      btState();
      const permission = await requestPermission();
      if (permission) {
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
  }, []);

  //looping the scan process every 10 sec
  // useEffect (() => {
  //   const interval = setInterval ( async () =>{
  //       btState();
  //       const permission = await requestPermission();
  //       if (permission) {
  //         startScan()
  //       }
  //     console.log("log every 10 seconds")
  //   }, LoopTime)
  //   return () => clearInterval(interval);
  // },[])

  // display the info of scanned ble devices
  const renderItem = (item) => {
    const color = item.connected ? 'green' : '#fff';
    return (
        <View style={[styles.row, {backgroundColor: color}]}>
          <Text style={{fontSize: 12, textAlign: 'center', color: '#333333', padding: 10}}>{item.name}</Text>
          <Text style={{fontSize: 10, textAlign: 'center', color: '#333333', padding: 2}}>RSSI: {item.rssi}</Text>
          <Text style={{fontSize: 8, textAlign: 'center', color: '#333333', padding: 2, paddingBottom: 20}}>{item.id}</Text>
        </View>
    );
  }

  // app ui
  return (
    <>
      <SafeAreaView>
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
              <Button 
                title={'Scan Bluetooth (' + (isScanning ? 'Scanning...' : 'off') + ')'}
                onPress={ async() =>{
                  btState();
                  const permission = await requestPermission();
                  if (permission) {
                    startScan()
                  }
                }}
              />
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

export default App;