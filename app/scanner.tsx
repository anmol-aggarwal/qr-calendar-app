// app/scanner.tsx
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Button, Linking, Platform, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import mediaMapping from './mediaMapping.json';

export default function ScannerPage() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [message, setMessage] = useState('');
  const [webUrl, setWebUrl] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!permission) requestPermission();
  }, [permission]);

  if (!permission) {
    return <Text>Requesting camera permissions...</Text>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text>No access to camera</Text>
        <Button title="Grant permission" onPress={() => requestPermission()} />
      </View>
    );
  }

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    setScanned(true);
    console.log('QR scanned:', data);

    const entry = mediaMapping[data];
    if (!entry) {
      setMessage('❌ No media found for this QR.');
      return;
    }

    const today = new Date();
    const mediaDate = new Date(entry.date);

    if (mediaDate <= today) {
      setMessage('✅ Opening media...');
      // prefer preview streaming url for Drive if user used a view link
      let url = entry.url;
      // auto-convert common Drive "view" links to preview format if needed
      if (typeof url === 'string' && url.includes('drive.google.com') && url.includes('/view')) {
        const match = url.match(/\/d\/([^/]+)/);
        if (match && match[1]) {
          url = `https://drive.google.com/uc?export=preview&id=${match[1]}`;
        }
      }
      setWebUrl(url);
    } else {
      setMessage('⏳ Locked until ' + entry.date);
    }
  };

  // helper used when WebView fails — opens external browser and resets state
  const openExternallyAndReset = async (url: string | null, reason?: string) => {
    if (url) {
      try {
        await Linking.openURL(url);
      } catch (e) {
        Alert.alert('Unable to open link externally', e?.message ?? String(e));
      }
    } else {
      Alert.alert('No URL to open');
    }
    setWebUrl(null);
    setScanned(false);
    if (reason) console.warn('Opened externally due to:', reason);
  };

  // If webUrl is set, show WebView
  if (webUrl) {
    return (
      <View style={{ flex: 1 }}>
        <WebView
          source={{ uri: webUrl }}
          style={{ flex: 1 }}
          // WebView playback + permissions
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowFileAccess={true}
          originWhitelist={['*']}
          allowsFullscreenVideo={true}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          mixedContentMode="always"
          startInLoadingState={true}
          renderLoading={() => <ActivityIndicator size="large" style={{ flex: 1 }} />}
          userAgent={
            Platform.OS === 'android'
              ? 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
              : undefined
          }
          onLoad={() => {
            console.log('WebView loaded', webUrl);
          }}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.warn('WebView error: ', nativeEvent);
            Alert.alert('Playback error', 'Web player failed — opening in browser as fallback.');
            openExternallyAndReset(webUrl, 'webview-onError');
          }}
          onHttpError={({ nativeEvent }) => {
            console.warn('WebView HTTP error:', nativeEvent.statusCode, nativeEvent.description);
            Alert.alert('Playback HTTP error', `Status ${nativeEvent.statusCode} — opening in browser as fallback.`);
            openExternallyAndReset(webUrl, `http-${nativeEvent.statusCode}`);
          }}
        />
        <View style={{ padding: 8 }}>
          <Button title="⬅️ Back" onPress={() => { setWebUrl(null); setScanned(false); }} />
        </View>
      </View>
    );
  }

  // If scanned but no webUrl, show message + options
  if (scanned) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>{message}</Text>
        <View style={{ height: 12 }} />
        <Button title="🔄 Scan Again" onPress={() => setScanned(false)} />
        <View style={{ height: 8 }} />
        <Button title="🏠 Back to Home" onPress={() => router.replace('/')} />
      </View>
    );
  }

  // Default: Camera scanner
  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  message: {
    fontSize: 18,
    textAlign: 'center',
    backgroundColor: '#fff',
    margin: 20,
    padding: 10,
    borderRadius: 8,
  },
});
