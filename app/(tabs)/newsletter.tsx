import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Article {
  id: string;
  title: string;
  image: string;
  date: string;
}

const DUMMY_ARTICLES: Article[] = [
  {
    id: '1',
    title: 'Cómo optimizar tu rutina de entrenamiento',
    image: 'https://picsum.photos/id/1/500/300',
    date: '15 agosto, 2025',
  },
  {
    id: '2',
    title: 'Nutrición pre y post entrenamiento',
    image: 'https://picsum.photos/id/1/500/300',
    date: '10 agosto, 2025',
  },
  {
    id: '3',
    title: 'Tips para mantener la motivación',
    image: 'https://picsum.photos/id/1/500/300',
    date: '5 agosto, 2025',
  },
];

export default function NewsletterScreen() {
  const renderItem = ({ item }: { item: Article }) => (
    <TouchableOpacity style={styles.articleCard}>
      <Image 
        source={{ uri: item.image }}
        style={styles.articleImage}
        resizeMode="cover"
      />
      <View style={styles.articleContent}>
        <Text style={styles.articleDate}>{item.date}</Text>
        <Text style={styles.articleTitle}>{item.title}</Text>
        <TouchableOpacity style={styles.readMoreBtn}>
          <Text style={styles.readMoreText}>Leer más</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList<Article>
        data={DUMMY_ARTICLES}
        renderItem={renderItem}
        keyExtractor={(item: Article) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  list: {
    padding: 16,
  },
  articleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  articleImage: {
    width: '100%',
    height: 180,
  },
  articleContent: {
    padding: 16,
  },
  articleDate: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 8,
  },
  articleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  readMoreBtn: {
    alignSelf: 'flex-start',
  },
  readMoreText: {
    color: '#2C6ECB',
    fontWeight: '600',
    fontSize: 14,
  },
});
