import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useAuthStore } from '../../../src/lib/store';
import { useRefresh } from '../../../src/hooks/useRefresh';
import { useArticles } from '../../../src/hooks/useArticles';
import ArticleCard from '../../../src/components/newsletter/ArticleCard';
import SearchBar from '../../../src/components/newsletter/SearchBar';
import Tabs from '../../../src/components/newsletter/Tabs';
import EmptyState from '../../../src/components/newsletter/EmptyState';
import { COLORS, RADII } from '../../../src/styles/tokens';

export default function NewsletterScreen() {
  const session = useAuthStore((s) => s.session);
  const userId = session?.user?.id;
  const router = useRouter();

  const {
    filtered, isLoading, isSaving, activeTab, setActiveTab,
    searchText, setSearchText, load, toggleSaved,
  } = useArticles(userId);

  useEffect(() => {
    load();
  }, [userId, load]);

  const { refreshing, onRefresh } = useRefresh(async () => load(true));

  return (
    <View style={styles.screenBlack}>
      <SafeAreaView style={styles.safeBlack}>
        <View style={styles.header}><Text style={styles.headerTitle}>Newsletter</Text></View>
      </SafeAreaView>

      <View style={styles.panel}>
        <SearchBar value={searchText} onChange={setSearchText} />

        <Tabs
          active={activeTab}
          onChange={setActiveTab}
          disabled={isLoading}
          disableSaved={!userId}
          onRequireLogin={() => router.push('/auth/login')}
        />

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.black} />
            <Text style={styles.loadingText}>Cargando artículos...</Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(i) => i.id}
            renderItem={({ item }) => (
              <ArticleCard
                article={item}
                canSave={!!userId}
                isSaving={isSaving}
                onPress={() =>
                  router.push({
                    pathname: '/newsletter/article/[id]',
                    params: {
                      id: item.id,
                    },
                  })
                }
                onToggleSave={() => toggleSaved(item.id, !!item.saved)}
              />
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[COLORS.black]}
                tintColor={COLORS.black}
                title="Actualizando..."
                titleColor={COLORS.black}
              />
            }
            ListEmptyComponent={
              <EmptyState
                message={
                  activeTab === 'saved'
                    ? 'No tienes artículos guardados'
                    : 'No hay artículos que coincidan con tu búsqueda'
                }
              />
            }
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screenBlack: { flex: 1, backgroundColor: COLORS.black },
  safeBlack: { backgroundColor: COLORS.black },

  header: { backgroundColor: COLORS.black, paddingHorizontal: 30, paddingTop: 20 },
  headerTitle: { color: COLORS.white, fontSize: 28, fontWeight: '700' },

  panel: {
    flex: 1, backgroundColor: COLORS.white,
    borderTopLeftRadius: RADII.panel, borderTopRightRadius: RADII.panel,
    paddingTop: 24, paddingHorizontal: 20, paddingBottom: 0,
  },

  listContent: { paddingHorizontal: 10, paddingBottom: 80 },
  loadingContainer: { alignItems: 'center', paddingVertical: 60 },
  loadingText: { marginTop: 10, fontSize: 15, color: COLORS.black },
});
