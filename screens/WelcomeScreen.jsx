import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import MapScreen from "./MapScreen";
import RegisterScreen from "./RegisterScreen";
import RegisterUser from "../components/RegisterUser";

const WelcomeScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text>WelcomeScreen</Text>
      <TouchableOpacity
        onPress={() => {
          navigation.navigate("TabNavigator", { screen: "MapScreen" });
        }}
      >
        <Text>Go to home</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default WelcomeScreen;
