import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useSavedArticle(userId?: string, articleId?: string) {
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (!userId || !articleId) return;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('saved_articles')
          .select('id')
          .eq('user_id', userId)
          .eq('article_id', articleId)
          .maybeSingle();
        if (error) throw error;
        if (mounted) setIsSaved(!!data);
      } catch (e) {
        console.error('useSavedArticle check error:', e);
      }
    })();
    return () => { mounted = false; };
  }, [userId, articleId]);

  const toggleSaved = async () => {
    if (!userId || !articleId) {
      throw new Error('AUTH_REQUIRED');
    }
    setSaving(true);
    try {
      if (isSaved) {
        const { error } = await supabase
          .from('saved_articles')
          .delete()
          .eq('user_id', userId)
          .eq('article_id', articleId);
        if (error) throw error;
        setIsSaved(false);
      } else {
        const { error } = await supabase
          .from('saved_articles')
          .insert({ user_id: userId, article_id: articleId });
        if (error) throw error;
        setIsSaved(true);
      }
    } finally {
      setSaving(false);
    }
  };

  return { isSaved, saving, toggleSaved };
}
