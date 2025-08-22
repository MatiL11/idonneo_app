import { useCallback, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import type { Article } from '../types/index';
import { fetchAllArticles, fetchSavedIds, saveArticle, unsaveArticle } from '../services/index';

export type TabKey = 'all' | 'saved';

export function useArticles(userId?: string) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [searchText, setSearchText] = useState('');

  const load = useCallback(async (light = false) => {
    try {
      if (!light) setIsLoading(true);
      const all = await fetchAllArticles();

      let savedIds: string[] = [];
      if (userId) {
        try {
          savedIds = await fetchSavedIds(userId);
        } catch (e) {
          // no bloquear la carga si falla saved
          console.error('fetchSavedIds error', e);
        }
      }

      const withSaved = all.map((a) => ({ ...a, saved: savedIds.includes(a.id) }));
      setArticles(withSaved);
    } catch (e) {
      console.error('load articles error', e);
      Alert.alert('Error', 'No se pudieron cargar los artículos');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const toggleSaved = useCallback(async (articleId: string, currentSaved: boolean) => {
    if (!userId) {
      Alert.alert('Inicia sesión', 'Debes iniciar sesión para guardar artículos');
      return;
    }
    try {
      setIsSaving(true);
      if (currentSaved) await unsaveArticle(userId, articleId);
      else await saveArticle(userId, articleId);

      setArticles((prev) => prev.map(a => a.id === articleId ? { ...a, saved: !currentSaved } : a));
    } catch (e) {
      console.error('toggleSaved error', e);
      Alert.alert('Error', 'No se pudo completar la operación');
    } finally {
      setIsSaving(false);
    }
  }, [userId]);

  const filtered = useMemo(() => {
    const st = searchText.trim().toLowerCase();
    return articles.filter((a) => {
      const matchesSearch = st ? a.title.toLowerCase().includes(st) : true;
      const matchesTab = activeTab === 'saved' ? !!a.saved : true;
      return matchesSearch && matchesTab;
    });
  }, [articles, searchText, activeTab]);

  return {
    // state
    articles,
    filtered,
    isLoading,
    isSaving,
    activeTab,
    searchText,
    // setters
    setActiveTab,
    setSearchText,
    // actions
    load,
    toggleSaved,
  };
}
