import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function Friends() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>A</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});
