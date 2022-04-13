import React, { useState, useEffect, useCallback } from "react";
import { StyleSheet, TouchableOpacity, View, SafeAreaView, 
          Text, ScrollView, RefreshControl, Button, FlatList, TextInput  } from "react-native";
import Dialog from "react-native-dialog";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { openDatabase } from 'react-native-sqlite-storage';
const db = openDatabase(
    {
      name: 'ble_db.db', 
      createFromLocation: 1
    }, () => {},
    error => {console.log(error)}
  );

export default function BLESetting({navigation}) {
  const [visible, setVisible] = useState(false);
  const [items, setItems] = useState([]);
  const [empty, setEmpty] = useState([]);
  const [refresh, setRefresh] = useState(false);
  const [text, onChangeText] = useState("");
  const [ble, setBle] = useState("");
  const [isTimePickerVisible, setTimePickerVisibility] = useState(false);
  const [fromTime, setFromTime] = useState(new Date);
  const [toTime, setToTime] = useState(new Date);
  const [info, setInfo] = useState("");

  // get db data
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
  }, [refresh]);

  // set alert time range (from)
  useEffect(()=>{
    db.transaction(function(tx){
      tx.executeSql(
        "UPDATE alert_time SET from=? WHERE id=1",[JSON.stringify(fromTime)],
        (tx, res) => {
          console.log("Result", res.rowsAffected);
          if (res.rowsAffected > 0){
            console.log("Data Updated")
          }
        }
      )
    })
  },[fromTime])

   // set alert time range (To)
  useEffect(()=>{
    db.transaction(function(tx){
      tx.executeSql(
        "UPDATE alert_time SET to=? WHERE id=1",[JSON.stringify(toTime)],
        (tx, res) => {
          console.log("Result", res.rowsAffected);
          if (res.rowsAffected > 0){
            console.log("Data Updated")
          }
        }
      )
    })
  },[toTime])

    // set caregiver email
  useEffect(()=>{
    db.transaction(function(tx){
      tx.executeSql(
        "UPDATE caregiver SET to=? WHERE id=1",[info],
        (tx, res) => {
          console.log("Result", res.rowsAffected);
          if (res.rowsAffected > 0){
            console.log("Data Updated")
          }
        }
      )
    })
  },[info])

  // handle dialog
  const showDialog = (e) => {
    setBle(e.mac_address);
    setVisible(true);
  };

  const handleCancel = () => {
    setVisible(false);
  };

  const handleConfirm = (ble, text) => {
    db.transaction(function(tx){
      tx.executeSql(
        "UPDATE ble_device SET name=? WHERE mac_address=?",[text, ble],
        (tx, res) => {
          console.log("Result", res.rowsAffected);
          if (res.rowsAffected > 0){
            console.log("Data Updated")
          }
        }
      )
    })
    setVisible(false);
  };

  // handle time picker
  const showTimePicker = () => {
    setTimePickerVisibility(true);
  };

  const hideTimePicker = () => {
    setTimePickerVisibility(false);
  };

  const handleFromTimePicker = (time) => {
    console.warn("A time has been picked: ", time);
    setFromTime(time);
    hideTimePicker();
  };

  const handleToTimePicker = (time) => { 
    console.warn("A time has been picked: ", time);
    setToTime(time);
    hideTimePicker();
  };

  // handle screen refresh
  const wait = (timeout) => {
    return new Promise(resolve => setTimeout(resolve, timeout));
  }
  const onRefresh = useCallback(()=>{
    setRefresh(true);
    wait(2000).then(()=>setRefresh(false));
  },[]);

//   const getData = () => {
//     try {
//         db.transaction((tx) => {
//             tx.executeSql(
//                 "SELECT mac_address FROM ble_device",
//                 [],
//                 (tx, results) => {
//                     var len = results.rows.length;
//                     if (len > 0) {
//                         console.log(len)
//                     }
//                     else{
//                         console.log("No data found")
//                     }
//                 }
//             )
//         })
//     } catch (error) {
//         console.log(error);
//     }
// }

  const ItemSeparator = () => {
    return (
      <View
        style={{
          height: 1,
          width: '100%',
          backgroundColor: '#000'
        }}
      />
    );
  };

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
              Database is Empty...
            </Text>
            <Text style={{ fontSize: 25, textAlign: 'center' }}>
              (Pull down to refresh)
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View>
        <Dialog.Container visible={visible}>
          <Dialog.Title>Edit BLE</Dialog.Title>
          <Dialog.Description>
            Enter the location of the BLE device ({ble})
          </Dialog.Description>
          <Dialog.Input
            placeholder="e.g. Bedroom" 
            onChangeText={onChangeText}
            value={text}
          />
          <Dialog.Button label="Cancel" onPress={handleCancel} />
          <Dialog.Button label="Confirm" onPress={()=>handleConfirm(ble, text)} />
        </Dialog.Container>
      </View>
    
      <View style={{ flex: 1 }}>
        
        {empty ? emptyMSG(empty) :
          <FlatList
            data={items}
            ItemSeparatorComponent={ItemSeparator}
            refreshing={refresh}
            onRefresh={onRefresh}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) =>
              <TouchableOpacity onPress={()=>showDialog(item)}>
                <View key={item.mac_address} style={{ padding: 20 }}>
                  <Text style={styles.itemsStyle}> {item.mac_address} </Text>
                  <Text style={styles.itemsStyle}> Name: {item.name} </Text>
                </View>
              </TouchableOpacity>
            }
          />
        }
      </View>

      <View
        style={{
          height: 3,
          width: '100%',
          backgroundColor: '#000'
        }}
      />
      <View style={{minHeight:75}}>  
        <Text style={styles.title}>Set the caregiver email:</Text>
        <TextInput 
          style={styles.input}
          onChangeText={setInfo}
          value = {info}
        />
      </View>

      <View style={{minHeight:100}}>
        <Text style={styles.title}>Set the alert time range:</Text>
        <Button title="From:" onPress={showTimePicker}/>
          <DateTimePickerModal
            isVisible={isTimePickerVisible}
            mode="time"
            onConfirm={handleFromTimePicker}
            onCancel={hideTimePicker}
          />
        <Button title="To:" onPress={showTimePicker} />
          <DateTimePickerModal
            isVisible={isTimePickerVisible}
            mode="time"
            onConfirm={handleToTimePicker}
            onCancel={hideTimePicker}
          />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },  
  itemsStyle: {
    fontSize: 22,
    color: '#000'
  },
  title:{
    fontSize:22,
    fontWeight:"bold",
    color: '#000'
  },
  input: {
    height: 40,
    margin: 12,
    borderWidth: 1,
    padding: 10,
  },
});