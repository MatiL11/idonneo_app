import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../../src/lib/supabase';
import { useAuthStore } from '../../src/lib/store';
import { useRefresh } from '../../src/hooks/useRefresh';

interface Article {
  id: string;
  title: string;
  tag?: string;
  content?: string;
  image_url?: string;
  date?: string;
  read_time?: string;
  created_at?: string;
  updated_at?: string;
  saved?: boolean;
}

const RADIUS = 25;
const THUMB_HEIGHT = 160;

export default function NewsletterScreen() {
  const [activeTab, setActiveTab] = useState<'all' | 'saved'>('all');
  const [searchText, setSearchText] = useState('');
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const session = useAuthStore((state) => state.session);
  const userId = session?.user?.id;
  const router = useRouter();

  const fetchArticles = async (isRefreshing = false) => {
    try {
      // Si no estamos refrescando (pull-to-refresh), mostrar indicador de carga completo
      if (!isRefreshing) {
        setIsLoading(true);
      }

      const { data: articlesData, error: articlesError } = await supabase
        .from('articles')
        .select('*')
        .order('created_at', { ascending: false });

      if (articlesError) {
        console.error('Error cargando artículos:', articlesError);
        Alert.alert('Error', 'No se pudieron cargar los artículos');
        return;
      }

      let savedArticleIds: string[] = [];
      if (userId) {
        const { data: savedData, error: savedError } = await supabase
          .from('saved_articles')
          .select('article_id')
          .eq('user_id', userId);

        if (savedError) {
          console.error('Error cargando artículos guardados:', savedError);
        } else if (savedData) {
          savedArticleIds = savedData.map((item) => item.article_id);
        }
      }

      const articlesWithSaved = (articlesData ?? []).map((article) => ({
        ...article,
        saved: savedArticleIds.includes(article.id),
      }));

      setArticles(articlesWithSaved);
    } catch (error) {
      console.error('Error en la carga de datos:', error);
      Alert.alert('Error', 'Ocurrió un problema al cargar los artículos');
    } finally {
      setIsLoading(false);
    }
  };

  // Utilizamos el hook personalizado de refresh
  const { refreshing, onRefresh } = useRefresh(async () => {
    await fetchArticles(true);
  });

  useEffect(() => {
    fetchArticles();
  }, [userId]);

  const filteredData = articles.filter((item) => {
    const matchesSearch = searchText
      ? item.title.toLowerCase().includes(searchText.toLowerCase())
      : true;
    const matchesTab = activeTab === 'saved' ? item.saved : true;
    return matchesSearch && matchesTab;
  });

  const toggleSaved = async (articleId: string, currentSaved: boolean) => {
    if (!userId) {
      Alert.alert('Inicia sesión', 'Debes iniciar sesión para guardar artículos', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Iniciar sesión', onPress: () => router.push('/auth/login') },
      ]);
      return;
    }

    try {
      setIsSaving(true);

      if (currentSaved) {
        const { error } = await supabase
          .from('saved_articles')
          .delete()
          .eq('user_id', userId)
          .eq('article_id', articleId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('saved_articles').insert({
          user_id: userId,
          article_id: articleId,
        });
        if (error) throw error;
      }

      setArticles((prev) =>
        prev.map((a) => (a.id === articleId ? { ...a, saved: !currentSaved } : a))
      );
    } catch (error) {
      console.error('Error al guardar/eliminar artículo:', error);
      Alert.alert('Error', 'No se pudo completar la operación');
    } finally {
      setIsSaving(false);
    }
  };

  const renderArticleCard = ({ item }: { item: Article }) => (
    <View style={styles.articleCardContainer}>
      <TouchableOpacity
        style={styles.articleCard}
        activeOpacity={0.85}
        onPress={() =>
          router.push({
            pathname: '/article-detail',
            params: {
              id: item.id,
              title: item.title,
              tag: item.tag || '',
              date: item.date || '',
              readTime: item.read_time || '',
              content: item.content || '',
              imageUrl: item.image_url || '',
            },
          })
        }
      >
        {item.image_url ? (
          <View style={styles.thumbContainer}>
            <Image source={{ uri: item.image_url }} style={styles.thumbImage} resizeMode="cover" />
          </View>
        ) : (
          <View style={styles.thumbPlaceholder} />
        )}
        <Text style={styles.articleTitle}>{item.title}</Text>
      </TouchableOpacity>

      {userId && (
        <TouchableOpacity
          style={styles.saveButton}
          onPress={() => toggleSaved(item.id, !!item.saved)}
          disabled={isSaving}
        >
          <MaterialCommunityIcons
            name={item.saved ? 'bookmark' : 'bookmark-outline'}
            size={24}
            color={item.saved ? '#000' : '#777'}
          />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.screenBlack}>
      <SafeAreaView style={styles.safeBlack}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Newsletter</Text>
        </View>
      </SafeAreaView>

      <View style={styles.panel}>
        <View style={styles.searchContainer}>
          <Feather name="search" size={18} color="#777" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar"
            placeholderTextColor="#777"
            value={searchText}
            onChangeText={setSearchText}
            returnKeyType="search"
          />
        </View>

        <View style={styles.tabsRow}>
          <TouchableOpacity
            onPress={() => setActiveTab('all')}
            style={[styles.tabPill, activeTab === 'all' ? styles.tabActive : styles.tabInactive]}
            activeOpacity={0.8}
            disabled={isLoading}
          >
            <Text
              style={[styles.tabPillText, activeTab === 'all' ? styles.textActive : styles.textInactive]}
            >
              Ver todo
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              if (!userId) {
                Alert.alert('Inicia sesión', 'Debes iniciar sesión para ver tus artículos guardados', [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Iniciar sesión', onPress: () => router.push('/auth/login') },
                ]);
                return;
              }
              setActiveTab('saved');
            }}
            style={[styles.tabPill, activeTab === 'saved' ? styles.tabActive : styles.tabInactive]}
            activeOpacity={0.8}
            disabled={isLoading}
          >
            <Text
              style={[
                styles.tabPillText,
                activeTab === 'saved' ? styles.textActive : styles.textInactive,
              ]}
            >
              Mis guardados
            </Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#000" />
            <Text style={styles.loadingText}>Cargando artículos...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredData}
            keyExtractor={(i) => i.id}
            renderItem={renderArticleCard}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#000"]}
                tintColor="#000"
                title="Actualizando..."
                titleColor="#000"
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="text-box-search-outline" size={46} color="#7a7a7a" />
                <Text style={styles.emptyText}>
                  {activeTab === 'saved'
                    ? 'No tienes artículos guardados'
                    : 'No hay artículos que coincidan con tu búsqueda'}
                </Text>
              </View>
            }
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  /** CONTENEDORES NEGROS */
  screenBlack: { flex: 1, backgroundColor: '#000' },
  safeBlack: { backgroundColor: '#000' },

  /** HEADER */
  header: { backgroundColor: '#000', paddingHorizontal: 30, paddingTop: 20 },
  headerTitle: { color: '#fff', fontSize: 28, fontWeight: '700' },

  /** PANEL BLANCO */
  panel: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: RADIUS,
    borderTopRightRadius: RADIUS,
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 0,
  },

  /** BUSCADOR */
  searchContainer: {
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#EEE',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
    marginBottom: 16,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, height: '100%', color: '#000', fontSize: 16 },

  /** TABS */
  tabsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 20,
    paddingHorizontal: 10,
  },
  tabPill: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    width: '48%',
    alignItems: 'center',
    justifyContent: 'center',
    height: 34,
  },
  tabActive: { backgroundColor: '#000', borderWidth: 0 },
  tabInactive: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#e0e0e0' },
  tabPillText: { fontSize: 15, fontWeight: '500', textAlign: 'center' },
  textActive: { color: '#fff', fontWeight: '600' },
  textInactive: { color: '#777' },

  /** LISTA */
  listContent: { paddingHorizontal: 10, paddingBottom: 80 },

  /** CARD */
  articleCardContainer: { position: 'relative', marginBottom: 20 },
  articleCard: {
    backgroundColor: '#fff',
    padding: 0,
    overflow: 'hidden',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  thumbContainer: {
    height: THUMB_HEIGHT,
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 4,
  },
  thumbPlaceholder: {
    height: THUMB_HEIGHT,
    backgroundColor: '#b6b6b6ff',
    borderRadius: 15,
    marginBottom: 12,
  },
  thumbImage: { width: '100%', height: '100%' },
  articleTitle: { fontSize: 20, fontWeight: '700', color: '#000', lineHeight: 26, paddingBottom: 10 },

  /** GUARDADO */
  saveButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255,255,255,0.8)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },

  /** ESTADOS */
  loadingContainer: { alignItems: 'center', paddingVertical: 60 },
  loadingText: { marginTop: 10, fontSize: 15, color: '#000' },
  emptyContainer: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { marginTop: 10, fontSize: 15, color: '#7a7a7a', textAlign: 'center' },
});
