import React from 'react'
import {AsyncStorage, Button, StyleSheet, Text, ScrollView, View} from 'react-native'
import * as Location from 'expo-location'
import * as Permissions from 'expo-permissions'
import * as TaskManager from 'expo-task-manager'

const ASYNC_STORAGE_KEY = '@MySuperStore'
const BACKGROUND_LOCATION_TASK_NAME = 'bg-location-name'

class Storage extends React.Component {
  state = {
    content: null,
  }

  componentDidMount() {
    this.refreshAsyncStorage()
  }

  refreshAsyncStorage = async () => {
    const store = await AsyncStorage.getItem(ASYNC_STORAGE_KEY)
    this.setState({content: store ? JSON.parse(store) : null})
  }

  render() {
    this.refreshAsyncStorage()
    return <View style={styles.tracking}>
      <Text>{this.state.content && this.state.content.length} locations recorded</Text>
      {this.state.content && this.state.content.map(l => l.locations.map((location, idx) =>
        <Text key={idx}>{new Date(location.timestamp).toString()}: lat {location.coords.latitude} lon {location.coords.longitude}</Text>
      ))}
    </View>
  }
}

export default class App extends React.Component {
  state = {enabled: false}

  onPressEnable = async () => {
    await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.Highest,
      distanceInterval: 20,
      showsBackgroundLocationIndicator: true,
    })
    this.setState({enabled: true})
  }

  async componentDidMount() {
    let {status} = await Permissions.askAsync(Permissions.LOCATION)
    if (status !== 'granted') {
      alert('Location permission required')
    }

    if (await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK_NAME)) {
      this.setState({enabled: true})
    }
  }

  render() {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Button onPress={this.onPressEnable} title="Enable background location" />
        {this.state.enabled && <Text>Tracking enabled</Text>}

        <Storage />
      </ScrollView>
    )
  }
}

TaskManager.defineTask(BACKGROUND_LOCATION_TASK_NAME, async ({data, error}) => {
  const store = await AsyncStorage.getItem(ASYNC_STORAGE_KEY)
  const events = store ? JSON.parse(store) : []
  events.push(error || data)
  await AsyncStorage.setItem(ASYNC_STORAGE_KEY, JSON.stringify(events))
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 80,
    marginTop: 80,
  },
  tracking: {
    paddingTop: 20,
  }
})
