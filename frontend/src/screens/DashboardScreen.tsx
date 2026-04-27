import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Button, Card, ProgressBar } from 'react-native-paper';
import { useNutriTrackerStore } from '../store';

export default function DashboardScreen() {
  const { user, dailyMacros, dailyState } = useNutriTrackerStore();

  if (!user || !dailyMacros || !dailyState) {
    return (
      <View style={styles.container}>
        <Text>Carregando...</Text>
      </View>
    );
  }

  // Calculate progress percentages
  const kcalProgress = Math.min(
    dailyState.consumed_kcal / dailyMacros.tdee,
    1,
  );
  const proteinProgress = Math.min(
    dailyState.macros_consumed.protein_g / dailyMacros.protein_g,
    1,
  );
  const carbsProgress = Math.min(
    dailyState.macros_consumed.carbs_g / dailyMacros.carbs_g,
    1,
  );
  const fatProgress = Math.min(
    dailyState.macros_consumed.fat_g / dailyMacros.fat_g,
    1,
  );

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Olá, {user.email}!</Text>
        <Text style={styles.date}>{new Date().toLocaleDateString('pt-BR')}</Text>
      </View>

      {/* Calories Card */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.cardTitle}>Calorias</Text>
          <Text style={styles.bigNumber}>
            {Math.round(dailyState.consumed_kcal)} / {Math.round(dailyMacros.tdee)} kcal
          </Text>
          <ProgressBar progress={kcalProgress} color="#FF6B6B" style={styles.progressBar} />
          <Text style={styles.remaining}>
            Faltam: {Math.round(dailyState.remaining_kcal)} kcal
          </Text>
        </Card.Content>
      </Card>

      {/* Macros Grid */}
      <View style={styles.macrosGrid}>
        {/* Protein */}
        <Card style={[styles.macroCard, { borderLeftColor: '#FF6B6B' }]}>
          <Card.Content>
            <Text style={styles.macroLabel}>Proteína</Text>
            <Text style={styles.macroValue}>
              {Math.round(dailyState.macros_consumed.protein_g)}g
            </Text>
            <Text style={styles.macroTarget}>{Math.round(dailyMacros.protein_g)}g</Text>
            <ProgressBar progress={proteinProgress} color="#FF6B6B" style={styles.smallProgress} />
          </Card.Content>
        </Card>

        {/* Carbs */}
        <Card style={[styles.macroCard, { borderLeftColor: '#4ECDC4' }]}>
          <Card.Content>
            <Text style={styles.macroLabel}>Carboidratos</Text>
            <Text style={styles.macroValue}>
              {Math.round(dailyState.macros_consumed.carbs_g)}g
            </Text>
            <Text style={styles.macroTarget}>{Math.round(dailyMacros.carbs_g)}g</Text>
            <ProgressBar progress={carbsProgress} color="#4ECDC4" style={styles.smallProgress} />
          </Card.Content>
        </Card>

        {/* Fat */}
        <Card style={[styles.macroCard, { borderLeftColor: '#FFE66D' }]}>
          <Card.Content>
            <Text style={styles.macroLabel}>Gordura</Text>
            <Text style={styles.macroValue}>
              {Math.round(dailyState.macros_consumed.fat_g)}g
            </Text>
            <Text style={styles.macroTarget}>{Math.round(dailyMacros.fat_g)}g</Text>
            <ProgressBar progress={fatProgress} color="#FFE66D" style={styles.smallProgress} />
          </Card.Content>
        </Card>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <Button mode="contained" style={styles.button}>
          Escanear Alimento
        </Button>
        <Button mode="outlined" style={styles.button}>
          Ver Sugestões
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    padding: 15,
  },
  header: {
    marginBottom: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  date: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  card: {
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  bigNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FF6B6B',
    marginBottom: 10,
  },
  progressBar: {
    height: 8,
    marginBottom: 10,
  },
  remaining: {
    fontSize: 14,
    color: '#999',
  },
  macrosGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  macroCard: {
    flex: 1,
    marginHorizontal: 5,
    backgroundColor: '#fff',
    borderLeftWidth: 4,
  },
  macroLabel: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
    marginBottom: 8,
  },
  macroValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  macroTarget: {
    fontSize: 12,
    color: '#ccc',
    marginBottom: 8,
  },
  smallProgress: {
    height: 4,
  },
  actions: {
    gap: 10,
  },
  button: {
    marginBottom: 10,
  },
});
