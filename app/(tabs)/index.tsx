// app/(tabs)/index.tsx
import { useRouter } from 'expo-router';
import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Button, Card } from 'react-native-paper';
import mediaMapping from '../mediaMapping.json'; // adjust path if your JSON is elsewhere

export default function HomePage() {
  const router = useRouter();
  const today = new Date();

  const mediaList = Object.entries(mediaMapping).map(([id, entry]) => ({
    id,
    ...entry,
  }));

  return (
    <View style={styles.container}>
      <Text style={styles.header}>📅 QR Calendar</Text>

      <Button
        mode="contained"
        icon="qrcode-scan"
        style={styles.scanButton}
        onPress={() => router.push('/scanner')}
      >
        <Text style={styles.scanButtonText}>Scan QR</Text>
      </Button>

      <FlatList
        data={mediaList}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const mediaDate = new Date(item.date);
          const isUnlocked = mediaDate <= today;

          return (
            <Card style={[styles.card, isUnlocked ? styles.unlocked : styles.locked]}>
              <Card.Cover
                source={{
                  uri: item.thumbnail || 'https://placehold.co/600x400?text=Media',
                }}
              />
              <Card.Content>
                <Text style={styles.dateText}>{item.date}</Text>
                <Text style={styles.status}>{isUnlocked ? '✅ Available' : '⏳ Locked'}</Text>
              </Card.Content>

              <Card.Actions>
                {isUnlocked && (
                  <>
                    <Button onPress={() => router.push('/scanner')}>
                      <Text style={{ fontWeight: '600' }}>Open with QR</Text>
                    </Button>

                    {/* If item has a youtubeId, offer Record Reaction */}
                    {item.youtubeId ? (
                      <Button
                        onPress={() =>
                          router.push({
                            pathname: '/reaction',
                            params: { youtubeId: item.youtubeId, title: item.title ?? item.id },
                          })
                        }
                      >
                        <Text style={{ fontWeight: '600' }}>Record Reaction</Text>
                      </Button>
                    ) : null}
                  </>
                )}
              </Card.Actions>
            </Card>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: '#f2f2f7' },
  header: { fontSize: 26, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  scanButton: { marginBottom: 20, alignSelf: 'center' },
  scanButtonText: { fontSize: 16, fontWeight: 'bold', color: 'white' },
  card: { marginBottom: 15, borderRadius: 10, overflow: 'hidden' },
  unlocked: { backgroundColor: '#ffffff' },
  locked: { backgroundColor: '#e0e0e0' },
  dateText: { fontSize: 16, fontWeight: '600', marginTop: 5 },
  status: { fontSize: 14, marginTop: 3 },
});
