import { supabase } from '../lib/supabase';
import type { Article } from '../types/article';

export async function fetchAllArticles(): Promise<Article[]> {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchSavedIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('saved_articles')
    .select('article_id')
    .eq('user_id', userId);
  if (error) throw error;
  return (data ?? []).map((d) => d.article_id);
}

export async function saveArticle(userId: string, articleId: string) {
  const { error } = await supabase
    .from('saved_articles')
    .insert({ user_id: userId, article_id: articleId });
  if (error) throw error;
}

export async function unsaveArticle(userId: string, articleId: string) {
  const { error } = await supabase
    .from('saved_articles')
    .delete()
    .eq('user_id', userId)
    .eq('article_id', articleId);
  if (error) throw error;
}
