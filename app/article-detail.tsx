import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Share,
  StatusBar,
  Alert,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../src/lib/supabase';
import { useAuthStore } from '../src/lib/store';

export default function ArticleDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Obtenemos la sesión y ID del usuario
  const session = useAuthStore((state) => state.session);
  const userId = session?.user?.id;
  
  // Utilizamos los datos recibidos como parámetros
  const article = {
    id: params.id as string,
    title: params.title as string || 'Título de la entrada',
    tag: params.tag as string || 'Consejos',
    date: params.date as string || '25/08/2023',
    readTime: params.readTime as string || '5 min',
    content: params.content as string || 'No hay contenido disponible para este artículo.',
    imageUrl: params.imageUrl as string || '',
  };
  
  // Verificar si el artículo está guardado
  useEffect(() => {
    const checkIfSaved = async () => {
      if (!userId || !article.id) return;
      
      try {
        const { data, error } = await supabase
          .from('saved_articles')
          .select('id')
          .eq('user_id', userId)
          .eq('article_id', article.id)
          .single();
          
        if (error && error.code !== 'PGRST116') {
          console.error('Error verificando si el artículo está guardado:', error);
        }
        
        setIsSaved(!!data);
      } catch (error) {
        console.error('Error al verificar el estado guardado:', error);
      }
    };
    
    checkIfSaved();
  }, [userId, article.id]);

  const handleBackPress = () => {
    router.back();
  };

  const handleSavePress = async () => {
    if (!userId) {
      Alert.alert(
        "Inicia sesión", 
        "Debes iniciar sesión para guardar artículos",
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Iniciar sesión", onPress: () => router.push('/auth/login') }
        ]
      );
      return;
    }
    
    try {
      setIsLoading(true);
      
      if (isSaved) {
        // Si ya está guardado, lo eliminamos
        const { error } = await supabase
          .from('saved_articles')
          .delete()
          .eq('user_id', userId)
          .eq('article_id', article.id);
          
        if (error) throw error;
        
        setIsSaved(false);
      } else {
        // Si no está guardado, lo guardamos
        const { error } = await supabase
          .from('saved_articles')
          .insert({
            user_id: userId,
            article_id: article.id
          });
          
        if (error) throw error;
        
        setIsSaved(true);
      }
      
    } catch (error) {
      console.error("Error al guardar/eliminar artículo:", error);
      Alert.alert("Error", "No se pudo completar la operación");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSharePress = async () => {
    try {
      await Share.share({
        message: `${article.title}\n\nLee este artículo en iDonneo App`,
      });
    } catch (error) {
      console.error('Error compartiendo el artículo:', error);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header negro con botones de navegación y acciones */}
      <SafeAreaView style={styles.safeAreaHeader}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
            <Ionicons name="chevron-back" size={28} color="#FFF" />
          </TouchableOpacity>
          
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={handleSavePress}
            >
              <Ionicons 
                name={isSaved ? "bookmark" : "bookmark-outline"} 
                size={24} 
                color="#FFF" 
              />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={handleSharePress}
            >
              <Ionicons name="share-outline" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Tag del artículo */}
        <View style={styles.tagContainer}>
          <Text style={styles.tag}>{article.tag}</Text>
        </View>
        
        {/* Título del artículo */}
        <Text style={styles.title}>{article.title}</Text>
        
        {/* Imagen de portada */}
        <View style={styles.coverImageContainer}>
          {article.imageUrl ? (
            <Image 
              source={{ uri: article.imageUrl }} 
              style={styles.coverImage}
              resizeMode="cover"
            />
          ) : (
            <Text style={styles.coverImagePlaceholder}>foto de portada</Text>
          )}
        </View>
        
        {/* Fecha y tiempo de lectura */}
        <View style={styles.metaContainer}>
          <Text style={styles.date}>{article.date}</Text>
          <Text style={styles.readTime}>{article.readTime} de lectura</Text>
        </View>
        
        {/* Contenido del artículo */}
        <Text style={styles.articleContent}>{article.content}</Text>
        
        {/* Espacio adicional al final */}
        <View style={styles.bottomSpace} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  safeAreaHeader: {
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingTop: 10,
    height: 50,
    backgroundColor: '#000',
  },
  backButton: {
    padding: 5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 5,
    marginLeft: 15,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  tagContainer: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 20,
    marginBottom: 10,
  },
  tag: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 15,
  },
  date: {
    fontSize: 14,
    color: '#666',
  },
  readTime: {
    fontSize: 14,
    color: '#666',
  },
  coverImageContainer: {
    height: 200,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 15,
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverImagePlaceholder: {
    fontSize: 18,
    color: '#666',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 5,
    lineHeight: 32,
  },
  articleContent: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  bottomSpace: {
    height: 40,
  },
});
