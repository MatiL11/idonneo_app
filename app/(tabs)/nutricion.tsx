import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface MealCategory {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const MEAL_CATEGORIES: MealCategory[] = [
  { id: '1', name: 'Desayunos', icon: 'sunny' },
  { id: '2', name: 'Almuerzos', icon: 'restaurant' },
  { id: '3', name: 'Cenas', icon: 'moon' },
  { id: '4', name: 'Snacks', icon: 'nutrition' },
];

interface Recipe {
  id: string;
  title: string;
  time: string;
  calories: string;
  image: string;
}

const FEATURED_RECIPES: Recipe[] = [
  {
    id: '1',
    title: 'Bowl de Açaí con Frutas',
    time: '15 min',
    calories: '320 kcal',
    image: 'https://images.unsplash.com/photo-1546039907-8d3112854e32',
  },
  {
    id: '2',
    title: 'Pollo al Curry con Arroz',
    time: '30 min',
    calories: '450 kcal',
    image: 'https://images.unsplash.com/photo-1604908177453-7462950a6a3b',
  },
  {
    id: '3',
    title: 'Ensalada Mediterránea',
    time: '10 min',
    calories: '280 kcal',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd',
  },
];

export default function NutricionScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Nutrition Plans */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mis Planes Nutricionales</Text>
          <View style={styles.planCard}>
            <View style={styles.planHeader}>
              <Text style={styles.planTitle}>Plan personalizado</Text>
              <TouchableOpacity style={styles.viewButton}>
                <Text style={styles.viewButtonText}>Ver plan</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.nutritionStats}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>2100</Text>
                <Text style={styles.statLabel}>kcal/día</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statValue}>140g</Text>
                <Text style={styles.statLabel}>Proteínas</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statValue}>65g</Text>
                <Text style={styles.statLabel}>Grasas</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statValue}>220g</Text>
                <Text style={styles.statLabel}>Carbos</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Meal Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categorías</Text>
          <View style={styles.categoriesContainer}>
            {MEAL_CATEGORIES.map((category) => (
              <TouchableOpacity key={category.id} style={styles.categoryCard}>
                <Ionicons name={category.icon} size={32} color="#2C6ECB" />
                <Text style={styles.categoryName}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Featured Recipes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recetas Destacadas</Text>
          {FEATURED_RECIPES.map((recipe) => (
            <TouchableOpacity key={recipe.id} style={styles.recipeCard}>
              <Image
                source={{ uri: `${recipe.image}?w=500` }}
                style={styles.recipeImage}
              />
              <View style={styles.recipeInfo}>
                <Text style={styles.recipeTitle}>{recipe.title}</Text>
                <View style={styles.recipeDetails}>
                  <View style={styles.recipeDetailItem}>
                    <Ionicons name="time-outline" size={16} color="#666" />
                    <Text style={styles.recipeDetailText}>{recipe.time}</Text>
                  </View>
                  <View style={styles.recipeDetailItem}>
                    <Ionicons name="flame-outline" size={16} color="#666" />
                    <Text style={styles.recipeDetailText}>{recipe.calories}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  section: {
    padding: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333333',
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  viewButton: {
    backgroundColor: '#2C6ECB',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  viewButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  nutritionStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
  },
  statDivider: {
    height: 40,
    width: 1,
    backgroundColor: '#E0E0E0',
  },
  categoriesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  categoryCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  categoryName: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  recipeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  recipeImage: {
    width: '100%',
    height: 160,
  },
  recipeInfo: {
    padding: 12,
  },
  recipeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  recipeDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recipeDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  recipeDetailText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#666666',
  },
});
