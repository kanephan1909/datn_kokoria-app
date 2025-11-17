import { StyleSheet, Text, View } from 'react-native'
import React from 'react'

const UserScreen = () => {
  return (
    <View>
      <Text style={styles.text}>UserScreen</Text>
    </View>
  )
}

export default UserScreen

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    text: {
        color: '#000',
        fontSize: 20,
        fontWeight: 'bold',
    },
})