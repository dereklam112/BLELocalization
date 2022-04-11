import React, {useEffect, useState, useCallback} from "react";
import { StyleSheet, View, SafeAreaView, Text, PermissionsAndroid,
        ScrollView, RefreshControl, } from "react-native";
// import Eddystone from "@lg2/react-native-eddystone";
import { openDatabase } from 'react-native-sqlite-storage';
const db = openDatabase(
    {
      name: 'ble_db.db', 
      createFromLocation: 1
    }, () => {},
    error => {console.log(error)}
  );
  
export default function Location({navigation}){
  const [items, setItems] = useState([]);
  const [empty, setEmpty] = useState([]);
  const [refresh, setRefresh] = useState(false);
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


  useEffect(() => {
    // Eddystone.addListener("onUIDFrame", function(beacon) {
    //   console.log(beacon);
    // });
    // Eddystone.startScanning();

    //looping the scan process every 10 sec
    const interval = setInterval ( async () =>{
      const permission = await requestPermission();
      if (permission) {
        getRSSI()
      }
      console.log("get rssi every 10 seconds")
    }, LoopTime)

    
    return (() => {
      console.log('unmount');
      clearInterval(interval);
    })
  }, []);

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

  const getRSSI  = () =>{
    console.log("test")


    // BleManager.readRSSI("E7:A4:A5:8D:3F:55").then((rssi)=>{
    //   console.log("Current RSSI: " + rssi);
    // }).catch((error) => {
    //   console.warn(error);
    // });
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
        {empty ? emptyMSG(empty) :
          <Text>test</Text>
          // <FlatList
          //   data={items}
          //   refreshing={refresh}
          //   onRefresh={onRefresh}
          //   keyExtractor={(item, index) => index.toString()}
          //   renderItem={({ item }) =>
          //     <View key={item.mac_address} style={{ padding: 20 }}>
          //       <Text style={styles.itemsStyle}> {item.mac_address} </Text>
          //       <Text style={styles.itemsStyle}> Name: {item.name} </Text>
          //     </View>
          //   }
          // />
        }
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