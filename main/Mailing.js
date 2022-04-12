import RNSmtpMailer from "react-native-smtp-mailer";
import React, { useEffect, useState } from "react";
import { Button, StyleSheet, Text, View } from "react-native";
import { openDatabase } from 'react-native-sqlite-storage';
const db = openDatabase(
    {
      name: 'ble_db.db', 
      createFromLocation: 1
    }, () => {},
    error => {console.log(error)}
  );

export default function Mailing({navigation}){
  const [email, setEmail] = useState("")
  const [focus, setFocus] = useState(true);
  const screenFocus = () =>{
    const isFocus = useIsFocused();
    setFocus(isFocus)
  }
  useEffect(()=>{
    screenFocus;
    db.transaction((tx)=>{
      tx.executeSql(
        'SELECT email FROM caregiver WHERE id=1',[],
        (tx, res) =>{
          if (res.rows.length==0){
            console.warn("email not found")
          }
          else{
            console.warn("email found")
            var temp_email = [];
            temp_email.push(res.rows.item(0));
            console.warn(temp_email[0].email);
            setEmail(temp_email[0].email);
          }
        }
      )
    })
  },[focus])

  const sendEmail = () => {
    RNSmtpMailer.sendMail({
      mailhost: "smtp.gmail.com",
      port: "465",
      ssl: true, // optional. if false, then TLS is enabled. Its true by default in android. In iOS TLS/SSL is determined automatically, and this field doesn't affect anything
      username: "shiroarashi112@gmail.com",
      password: "Y6929905",
      recipients: email,
      subject: "Alert message",
      htmlBody: "<h1>Alert</h1><p>The user has left the area in the alert time range</p>",
    })
      .then(success => console.log(success))
      .catch(err => console.log(err));
  };
  return (
    <View style={styles.container}>
      <Text style={styles.welcome}>Welcome to Smtp Mailer!</Text>
      <Button title="Send Email" onPress={sendEmail} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5FCFF"
  },
  welcome: {
    fontSize: 20,
    textAlign: "center",
    margin: 10
  },
  instructions: {
    textAlign: "center",
    color: "#333333",
    marginBottom: 5
  }
});