import { View, StyleSheet, Button, Text, FlatList, Platform, PermissionsAndroid, Alert  } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useAutoNote, getToken, setConfig } from 'mtl-autonote';
import { request, PERMISSIONS } from 'react-native-permissions';

export default function App() {
  const [token, setToken] = useState<string>('');
  const [asrResultText, setAsrResultText] = useState<string>('');
  const [reports, setReports] = useState<any[]>([]);
  const api_url :string =  '<url>';

  const requestMicrophonePermission = async () => {
    if (Platform.OS === 'android') {
        try {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
                {
                    title: 'Microphone Permission',
                    message: 'This app needs access to your microphone to record audio.',
                    buttonNeutral: 'Ask Me Later',
                    buttonNegative: 'Cancel',
                    buttonPositive: 'OK',
                },
            );
            return granted === PermissionsAndroid.RESULTS.GRANTED;
        } catch (err) {
            Alert.alert('Permission error', 'Failed to request permission for microphone.');
            return false;
        }
    } else if (Platform.OS === 'ios') {
        request(PERMISSIONS.IOS.MICROPHONE).then((result) => {
            console.log(result);
            return true; 
          });
        }
    return false;
};


  useEffect(() => {
    requestMicrophonePermission();
    getToken('<email>', '<password>', api_url)
    .then((token: string) => setToken(token))
    .catch((error: any) => console.error(error));
  }, [])

  useEffect(() => {
    token && setConfig({ urlPath: api_url, lang: 'tr', token: token });
  }, [token])

  const vad = useAutoNote({})

  const handleSendVoice = async (audio: any) => {
    const result = await vad.sendVoice(audio);
    setAsrResultText(result);
  }

  const handleGetReports = async () => {
    if (asrResultText) {
      console.log(asrResultText)
      const result = await vad.getReports(asrResultText);
      setReports(result);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.button}>
        <Button
          title={vad.isRecording && !vad.isPaused ? 'Pause Recording' : 'Start Recording'}
          onPress={vad.toggleRecording}
        />
        {vad.isRecording && <Button title="Stop Recording" onPress={vad.stop} />}
      </View>
      <FlatList
        data={vad.recordings}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item, index }) => (
          <View>
            <Text>{index + 1}. Audio</Text>
            <View style={styles.button}>
              <Button title="Send Voice" onPress={() => {handleSendVoice(item)}} />
              <Button title="Get Reports" onPress={() => handleGetReports()} />
            </View>
          </View>
        )}
      />
      <View style={styles.text}>
        {
          asrResultText &&
          <View>
            <Text>Voice Result:</Text>
            <Text>{asrResultText ? asrResultText : ''}</Text>
          </View>
        }
        {
          reports.length !== 0 &&
          <View>
            <Text>Reports:</Text>
            <Text>{JSON.stringify(reports)}</Text>
          </View>
        }
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    justifyContent: 'center',
    padding: 10,
    marginTop: 30
  },
  button: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    color: '#fff',
    borderRadius: 5,
  },
  text: {
    fontSize: 20,
    margin: 10,
    color: '#333',
  }
});
