import { useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../lib/supabase';

export type ArticleParams = {
  title?: string;
  tag?: string;
  date?: string;
  readTime?: string;
  content?: string;
  imageUrl?: string;
};

export function useArticleDetail(id?: string, initial?: ArticleParams) {
  const [dbArticle, setDbArticle] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  // Fallback: si faltan datos en params, cargo desde DB
  useEffect(() => {
    if (!id) return;
    const needFetch = !initial?.title || !initial?.content || !initial?.imageUrl;
    if (!needFetch) return;

    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('articles')
          .select('*')
          .eq('id', id)
          .single();
        if (error) throw error;
        if (mounted) setDbArticle(data);
      } catch (e) {
        console.error('useArticleDetail error:', e);
        Alert.alert('Error', 'No se pudo cargar el artículo.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id, initial?.title, initial?.content, initial?.imageUrl]);

  const article = useMemo(() => ({
    id,
    title: dbArticle?.title ?? initial?.title ?? 'Título de la entrada',
    tag: dbArticle?.tag ?? initial?.tag ?? 'Consejos',
    date: dbArticle?.date ?? initial?.date ?? '',
    readTime: dbArticle?.read_time ?? initial?.readTime ?? '',
    content: dbArticle?.content ?? initial?.content ?? 'No hay contenido disponible para este artículo.',
    imageUrl: dbArticle?.image_url ?? initial?.imageUrl ?? '',
  }), [dbArticle, initial, id]);

  return { article, loadingArticle: loading };
}
