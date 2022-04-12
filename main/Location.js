import React, {useEffect, useState, useCallback} from "react";
import { StyleSheet, View, SafeAreaView, Text, PermissionsAndroid,
        ScrollView, RefreshControl, NativeModules, NativeEventEmitter, Image } from "react-native";
// import Eddystone from "@lg2/react-native-eddystone";
import { openDatabase } from 'react-native-sqlite-storage';
import { useIsFocused } from '@react-navigation/native';
import BleManager from './BleManager';

const db = openDatabase(
    {
      name: 'ble_db.db', 
      createFromLocation: 1
    }, () => {},
    error => {console.log(error)}
  );
  
const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

export default function Location({navigation}){
  const [isScanning, setIsScanning] = useState(false);
  const [items, setItems] = useState([]);
  const [empty, setEmpty] = useState([]);
  const [refresh, setRefresh] = useState(false);
  const LoopTime = 30000; //60 sec
  const [focus, setFocus] = useState(true);
  const [address, setAddress] = useState("");
  const [location, setLocation] = useState("");
  const [isFound, setIsFound] = useState([]);

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

  useEffect(()=>{
    db.transaction(function (txn) {
      txn.executeSql(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='temp_reading'",[],
        function (tx, res) {
          console.log('temp reading item:', res.rows.length);
          if (res.rows.length > 0) {
            txn.executeSql('DROP TABLE IF EXISTS temp_reading', []);
            txn.executeSql(
              'CREATE TABLE IF NOT EXISTS temp_reading(id INTEGER NOT NULL, mac_address TEXT, rssi INTEGER, PRIMARY KEY (id AUTOINCREMENT))',[]);
            console.log("db created");
          }
        }
      );
    });
  },[isScanning]);


  useEffect( () => {
    screenFocus;
    if(focus==true){
      BleManager.start({showAlert: false});
      bleManagerEmitter.addListener('BleManagerDiscoverPeripheral', handleDiscoverPeripheral);
      bleManagerEmitter.addListener('BleManagerStopScan', handleStopScan );
      const permission = requestPermission();
      if (permission){
        getRSSI(); //trigger once when the app started
      }
      const interval = setInterval ( async () =>{
        if (permission && focus) {
          getRSSI()
        }
        console.log("get user location every 30sec")
      }, LoopTime)

      
      return (() => {
        console.log('unmount');
        bleManagerEmitter.removeListener('BleManagerDiscoverPeripheral', handleDiscoverPeripheral);
        bleManagerEmitter.removeListener('BleManagerStopScan', handleStopScan );
        clearInterval(interval);
      })
    }
  }, [focus]);

  useEffect(() => {
    db.transaction((tx) => {
      tx.executeSql(
        'SELECT * FROM ble_device',
        [],
        (tx, res) => {
          var temp = [];
          // append db data to list
          for (let i = 0; i < res.rows.length; ++i)
            temp.push(res.rows.item(i));
          setItems(temp);
          // check db is empty
          if (res.rows.length >= 1) {
            setEmpty(false);
          } else {
            setEmpty(true)
          }
        }
      ); 
    });
    console.log(items);
  }, [refresh]);

  useEffect(()=>{
    db.transaction((tx)=>{
      tx.executeSql(
        'SELECT mac_address FROM temp_reading WHERE mac_address IN (SELECT mac_address FROM ble_device) ORDER BY rssi DESC LIMIT 1',[],
        (tx, res) =>{
          if (res.rows.length==0){
            console.warn("no record");
            setIsFound(false);
          }
          else{
            setIsFound(true);
            var temp_address = [];
            temp_address.push(res.rows.item(0));
            console.warn(temp_address[0].mac_address);
            // console.warn(typeof(temp_address[0].mac_address));
            setAddress(temp_address[0].mac_address);
            // console.log("set address ok")
          }
        }
      )
    })
    db.transaction((tx)=>{
      tx.executeSql(
        'SELECT name from ble_device WHERE mac_address=?',[address],
        (tx, res) =>{
          if (res.rows.length==0){
            console.warn("no record")
          }
          else{
            var temp_location = [];
            temp_location.push(res.rows.item(0));
            setLocation(temp_location[0].name);
            console.warn(location);
            console.log("set location ok");
          }
        }
      )
    })
  },[refresh])

  // handle screen refresh
  const wait = (timeout) => {
    return new Promise(resolve => setTimeout(resolve, timeout));
  }
  const onRefresh = useCallback(()=>{
    setRefresh(true);
    wait(2000).then(()=>setRefresh(false));
  },[]);

  // check db is empty or not
  const emptyMSG = (status) => {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refresh}
            onRefresh={onRefresh}
          />
        }>
          <View style={{ justifyContent: 'center', alignItems: 'center', flex: 1 }}>
            <Text style={{ fontSize: 25, textAlign: 'center' }}>
              No device is set
            </Text>
            <Text style={{ fontSize: 18, textAlign: 'center' }}>
              (Please scan and add the BLE device first)
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const MSG = (status) => {
    return(
      <SafeAreaView style={{ flex: 1 }}>
      <ScrollView
      refreshControl={
        <RefreshControl
          refreshing={refresh}
          onRefresh={onRefresh}
        />
      }>
        <View style={{ justifyContent: 'center', alignItems: 'center', flex: 1 }}>
          {isFound ? 
            <>
              <Text style={{ fontSize: 25, textAlign: 'center' }}>
                User location is : {location}
              </Text>
            </>
            :
            <>
              <Text style={{ fontSize: 25, textAlign: 'center' }}>
                User has left the location
              </Text>
              <Image 
                source={require("./image/leaving.jpg")} 
                style={{width: '100%', height:400}}
              />
            </>
          }
        </View>
      </ScrollView>
    </SafeAreaView>
    );
  }

  const getRSSI  = () =>{
    // console.log("test")
    if (!isScanning) {
      // scan for Eddystone Service UUID (feaa)
      BleManager.scan(["feaa"], 20, true).then((results) => {
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
    db.transaction(function(tx){
      tx.executeSql(
        "INSERT INTO temp_reading (mac_address, rssi) VALUES (?, ?)",[peripheral.id, peripheral.rssi],
        // (tx, res) => {
        //   console.log("Result", res.rowsAffected);
        //   if (res.rowsAffected > 0){
        //     console.log("Data inserted")
        //   }
        // }
      )
    })
  }

  return(
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refresh}
            onRefresh={onRefresh}
          />
        }
        >
      <View style={{ flex: 1 }}>
        {empty ? emptyMSG(empty) : MSG(isFound)}
          {/* <FlatList
            data={items}
            refreshing={refresh}
            onRefresh={onRefresh}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) =>
              <View key={item.mac_address} style={{ padding: 20 }}>
                <Text style={styles.itemsStyle}> {item.mac_address} </Text>
                <Text style={styles.itemsStyle}> Name: {item.name} </Text>
              </View>
            }
          /> */}
      </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({ 
  itemsStyle: {
    fontSize: 22,
    color: '#000'
  },
});