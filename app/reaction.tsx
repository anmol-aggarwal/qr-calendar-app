// app/reaction.tsx
import { Camera } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Button, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

export default function ReactionPage() {
  const { youtubeId, title } = useLocalSearchParams<{ youtubeId?: string; title?: string }>();
  const router = useRouter();
  const cameraRef = useRef<Camera | null>(null);
  const [camPerm, setCamPerm] = useState<boolean | null>(null);
  const [micPerm, setMicPerm] = useState<boolean | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordUri, setRecordUri] = useState<string | null>(null);
  const [muted, setMuted] = useState(true);
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const cam = await Camera.requestCameraPermissionsAsync();
        setCamPerm(cam.status === 'granted');

        // request microphone permission if available
        if ((Camera as any).requestMicrophonePermissionsAsync) {
          try {
            const mic = await (Camera as any).requestMicrophonePermissionsAsync();
            setMicPerm(mic.status === 'granted');
          } catch {
            setMicPerm(true);
          }
        } else {
          // assume microphone permission will be requested by runtime when recording
          setMicPerm(true);
        }
      } catch (e) {
        console.warn('perm error', e);
        setCamPerm(false);
        setMicPerm(false);
      }
    })();
  }, []);

  const youtubeUrl = youtubeId
    ? `https://www.youtube.com/embed/${youtubeId}?playsinline=1&autoplay=0&rel=0&modestbranding=1${muted ? '&mute=1' : ''}`
    : null;

  // countdown then start
  const startWithCountdown = async () => {
    setCountdown(3);
    let n = 3;
    const t = setInterval(() => {
      n -= 1;
      setCountdown(n > 0 ? n : null);
      if (n <= 0) {
        clearInterval(t);
        startRecording();
      }
    }, 1000);
  };

  const startRecording = async () => {
    if (!cameraRef.current) {
      Alert.alert('Camera not ready');
      return;
    }

    try {
      setIsRecording(true);

      // recordAsync returns local file path
      const promise = cameraRef.current.recordAsync({
        quality: Camera.Constants.VideoQuality['480p'],
        maxDuration: 180, // seconds
        mute: false, // capture microphone
      });

      const result = await promise;
      setRecordUri(result.uri);
      setIsRecording(false);
      Alert.alert('Recording saved', result.uri);
      // Optionally: upload result.uri here
    } catch (err) {
      console.warn('record error', err);
      setIsRecording(false);
      Alert.alert('Recording error', String(err));
    }
  };

  const stopRecording = async () => {
    try {
      cameraRef.current?.stopRecording();
      setIsRecording(false);
    } catch (e) {
      console.warn('stopRecording error', e);
    }
  };

  const openSaved = async () => {
    if (!recordUri) {
      Alert.alert('No recording saved');
      return;
    }
    // on mobile you can open using FileSystem.getContentUriAsync (android) or share; just show path for now
    Alert.alert('Saved file', recordUri);
  };

  if (camPerm === null || micPerm === null) return <View style={styles.center}><Text>Requesting permissions...</Text></View>;
  if (!camPerm) return <View style={styles.center}><Text>Camera permission is required</Text></View>;
  if (!micPerm) return <View style={styles.center}><Text>Microphone permission is required</Text></View>;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Button title="⬅ Back" onPress={() => router.back()} />
        <Text style={styles.title}>{title ?? 'Reaction'}</Text>
      </View>

      <View style={styles.playerArea}>
        {youtubeUrl ? (
          <>
            <WebView
              source={{ uri: youtubeUrl }}
              style={{ flex: 1 }}
              mediaPlaybackRequiresUserAction={false}
              allowsInlineMediaPlayback
              javaScriptEnabled
            />
            <View style={styles.playerControls}>
              <Button title={muted ? 'Muted (tap to unmute; use headphones)' : 'Unmuted'} onPress={() => setMuted(!muted)} />
            </View>
          </>
        ) : (
          <View style={styles.center}><Text>No YouTube video id provided</Text></View>
        )}
      </View>

      <View style={styles.recorderArea}>
        <Camera
          ref={(r) => (cameraRef.current = r)}
          style={styles.cameraPreview}
          type={Camera.Constants.Type.front}
        />
        <View style={styles.recControls}>
          {countdown ? (
            <Text style={{ fontSize: 32 }}>{countdown}</Text>
          ) : !isRecording ? (
            <Button title="Start Recording Reaction" onPress={startWithCountdown} />
          ) : (
            <Button title="Stop Recording" onPress={stopRecording} />
          )}
          <View style={{ height: 8 }} />
          {recordUri ? <Button title="Show saved path" onPress={openSaved} /> : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 8 },
  title: { flex: 1, textAlign: 'center', fontWeight: '600' },
  playerArea: { height: '45%' },
  playerControls: { padding: 8, alignItems: 'center' },
  recorderArea: { flex: 1, padding: 8, alignItems: 'center' },
  cameraPreview: { width: 160, height: 240, borderRadius: 8, overflow: 'hidden', backgroundColor: '#000' },
  recControls: { marginTop: 12 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
