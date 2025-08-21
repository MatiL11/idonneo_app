import React from 'react';
import { View, Text, StyleSheet, ScrollView, Share, StatusBar, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/lib/store';

import { useArticleDetail } from '../../src/hooks/useArticleDetail';
import { useSavedArticle } from '../../src/hooks/useSavedArticle';

import ArticleHeader from '../../src/components/newsletter/ArticleHeader';
import CoverImage from '../../src/components/newsletter/CoverImage';
import TagPill from '../../src/components/newsletter/TagPill';
import MetaRow from '../../src/components/newsletter/MetaRow';

export default function ArticleDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id: string; title?: string; tag?: string; date?: string; readTime?: string; content?: string; imageUrl?: string;
  }>();
  const session = useAuthStore((s) => s.session);
  const userId = session?.user?.id;

  const { article, loadingArticle } = useArticleDetail(params.id, {
    title: params.title, tag: params.tag, date: params.date, readTime: params.readTime,
    content: params.content, imageUrl: params.imageUrl,
  });

  const { isSaved, saving, toggleSaved } = useSavedArticle(userId, article.id);

  const onBack = () => router.back();

  const onToggleSave = async () => {
    try {
      await toggleSaved();
    } catch (e: any) {
      if (e.message === 'AUTH_REQUIRED') {
        Alert.alert('Inicia sesión', 'Debes iniciar sesión para guardar artículos', [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Iniciar sesión', onPress: () => router.push('/auth/login') },
        ]);
      } else {
        Alert.alert('Error', 'No se pudo completar la operación');
      }
    }
  };

  const onShare = async () => {
    try {
      await Share.share({ message: `${article.title}\n\nLee este artículo en iDonneo App` });
    } catch {}
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeTop}>
        <ArticleHeader
          onBack={onBack}
          onToggleSave={onToggleSave}
          onShare={onShare}
          saved={isSaved}
          disabled={saving}
        />
      </SafeAreaView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <TagPill tag={article.tag} />
        <Text style={styles.title}>{article.title}</Text>
        <CoverImage uri={article.imageUrl} loading={loadingArticle} />
        <MetaRow date={article.date} readTime={article.readTime} />
        <Text style={styles.body}>{article.content}</Text>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  safeTop: { backgroundColor: '#000' },
  content: { flex: 1, paddingHorizontal: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginTop: 5, lineHeight: 32, color: '#000' },
  body: { fontSize: 16, lineHeight: 24, color: '#333' },
});
