import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Button } from 'react-native-paper';
import { useNutriTrackerStore } from '../store';
import { NutriTrackerAPI } from '../services/api';

interface BarcodeScannerScreenProps {
  onFoodScanned: (foodData: any) => void;
}

/**
 * BarcodeScannerScreen Component
 * 
 * Funcionalidade:
 * 1. Acessa câmera nativa do celular (react-native-vision-camera)
 * 2. Lê código de barras
 * 3. Envia para backend
 * 4. Backend faz fetch na OpenFoodFacts
 * 5. Resultado é cacheado localmente (AsyncStorage)
 * 6. Alimento é exibido na tela
 */
export default function BarcodeScannerScreen({
  onFoodScanned,
}: BarcodeScannerScreenProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [loading, setLoading] = useState(false);
  const [scannedFoods, setScannedFoods] = useState<any[]>([]);
  const { user, setCacheItem, getCacheItem } = useNutriTrackerStore();
  const cameraRef = useRef<CameraView>(null);
  const [isScanning, setIsScanning] = useState(true);

  // Request camera permission on mount
  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission]);

  /**
   * Handles barcode scanned event
   * Flow: Scan → Check Cache → Fetch API → Save Cache → Display
   */
  const handleBarcodeScan = async (barcode: string) => {
    if (!isScanning || loading) return;

    setIsScanning(false);
    setLoading(true);

    try {
      // Step 1: Check local cache first
      const cached = await getCacheItem(`barcode_${barcode}`);

      if (cached) {
        console.log('Using cached data for barcode:', barcode);
        setScannedFoods([cached, ...scannedFoods]);
        onFoodScanned(cached);
        setLoading(false);
        setTimeout(() => setIsScanning(true), 2000);
        return;
      }

      // Step 2: Fetch from backend
      console.log('Fetching food data for barcode:', barcode);
      const foodData = await NutriTrackerAPI.getFoodByBarcode(barcode);

      // Step 3: Cache the result locally
      await setCacheItem(`barcode_${barcode}`, foodData);

      // Step 4: Display scanned food
      setScannedFoods([foodData, ...scannedFoods]);
      onFoodScanned(foodData);

      Alert.alert('Sucesso!', `${foodData.food_name} adicionado`, [
        {
          text: 'OK',
          onPress: () => {
            setLoading(false);
            setTimeout(() => setIsScanning(true), 2000);
          },
        },
      ]);
    } catch (error) {
      console.error('Error scanning barcode:', error);
      Alert.alert(
        'Erro',
        'Código de barras não encontrado ou erro na API',
        [
          {
            text: 'Tentar Novamente',
            onPress: () => {
              setLoading(false);
              setIsScanning(true);
            },
          },
        ],
      );
    }
  };

  // Permission check
  if (!permission) {
    return (
      <View style={styles.container}>
        <Text>Solicitando permissão de câmera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          Permissão de câmera necessária para escanear código de barras
        </Text>
        <Button mode="contained" onPress={requestPermission}>
          Conceder Permissão
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera View */}
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="back"
          barCodeScannerSettings={{
            barcodeTypes: ['ean13', 'ean8', 'upca', 'upce', 'code128', 'code39'],
          }}
          onBarcodeScanned={({ data }) => {
            handleBarcodeScan(data);
          }}
        >
          {/* Overlay Grid for barcode positioning */}
          <View style={styles.overlay}>
            <View style={styles.overlayBox} />
          </View>
        </CameraView>

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>Processando...</Text>
          </View>
        )}
      </View>

      {/* Recent Scans List */}
      <View style={styles.scansContainer}>
        <Text style={styles.title}>Alimentos Escaneados</Text>
        {scannedFoods.length === 0 ? (
          <Text style={styles.emptyText}>Nenhum alimento escaneado ainda</Text>
        ) : (
          scannedFoods.map((food, index) => (
            <View key={index} style={styles.foodCard}>
              <Text style={styles.foodName}>{food.food_name}</Text>
              <Text style={styles.foodNutrition}>
                {food.nutrition.kcal} kcal | P: {food.nutrition.protein_g}g | C:{' '}
                {food.nutrition.carbs_g}g | G: {food.nutrition.fat_g}g
              </Text>
              <Text style={styles.portion}>{food.portion_size}</Text>
            </View>
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayBox: {
    width: 250,
    height: 100,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 8,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
  scansContainer: {
    height: 200,
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  emptyText: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
  },
  foodCard: {
    backgroundColor: '#fff',
    padding: 10,
    marginBottom: 8,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  foodName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  foodNutrition: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  portion: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
  },
});
