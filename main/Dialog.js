import React, { useState } from "react";
import { Button, StyleSheet, View } from "react-native";
import Dialog from "react-native-dialog";
import { openDatabase } from 'react-native-sqlite-storage';
const db = openDatabase(
    {
      name: 'ble_db.db', 
      createFromLocation: 1
    }, () => {},
    error => {console.log(error)}
  );

export default function App() {
  const [visible, setVisible] = useState(false);

  const showDialog = () => {
    setVisible(true);
  };

  const handleCancel = () => {
    setVisible(false);
  };

  const handleDelete = () => {
    // The user has pressed the "Delete" button, so here you can do your own logic.
    // ...Your logic
    setVisible(false);
  };

  const getData = () => {
    try {
        db.transaction((tx) => {
            tx.executeSql(
                "SELECT mac_address FROM ble_device",
                [],
                (tx, results) => {
                    var len = results.rows.length;
                    if (len > 0) {
                        console.log(len)
                    }
                    else{
                        console.log("No data found")
                    }
                }
            )
        })
    } catch (error) {
        console.log(error);
    }
}

  return (
    <View style={styles.container}>
      <Button title="Show dialog" onPress={getData} />
      <Dialog.Container visible={visible}>
        <Dialog.Title>Account delete</Dialog.Title>
        <Dialog.Description>
          Do you want to delete this account? You cannot undo this action.
        </Dialog.Description>
        <Dialog.Button label="Cancel" onPress={handleCancel} />
        <Dialog.Button label="Delete" onPress={handleDelete} />
      </Dialog.Container>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});