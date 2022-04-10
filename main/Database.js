import React, { useEffect } from 'react';
import {
  View, Text
} from 'react-native'
import { openDatabase } from 'react-native-sqlite-storage';

  // connect pre-populated database
const db = openDatabase({name: 'ble_db.db', createFromLocation: 1});

const Database = () => {
  useEffect(() => {
    db.transaction(function (txn) {
      txn.executeSql(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='Ble_device'",[],
        function (tx, res) {
          console.log('item:', res.rows.length);
          if (res.rows.length == 0) {
            txn.executeSql('DROP TABLE IF EXISTS Ble_device', []);
            txn.executeSql(
              'CREATE TABLE IF NOT EXISTS Ble_device(mac_address VARCHAR(255))',[]);
          }
        }
      );
    });
  }, []);
  return(
    <>
    </>
  );
};

export default Database;