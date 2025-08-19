import { supabase } from './supabase';

export interface Profile {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  avatar_url: string;
  created_at: string;
  updated_at: string;
}

export async function getUserProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    
    return { profile: data as Profile, error: null };
  } catch (error) {
    console.error('Error fetching profile:', error);
    return { profile: null, error };
  }
}
