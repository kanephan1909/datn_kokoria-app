import React, { Component } from 'react'
import { Text, View } from 'react-native'
import './global.css'

export class App extends Component {
  render() {
    return (
      <View>
        <Text className='text-teal-400'> textInComponent </Text>
      </View>
    )
  }
}

export default App
