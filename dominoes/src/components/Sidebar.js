import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import * as FileSystem from 'expo-file-system';
import { decodeJpeg } from '@tensorflow/tfjs-react-native';
import { handleUploadWithConfirmation } from '../services/UploadService';

const Sidebar = ({ isOpen, onClose, onNavigate }) => {
  const [tfReady, setTfReady] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
      if (status !== 'granted') {
        Alert.alert(
          'Permission refusée',
          'Veuillez autoriser l’accès à la caméra dans les paramètres.'
        );
        return;
      }
      await tf.ready();
      setTfReady(true);
    })();
  }, []);

  const analyzeImage = async (imageUri) => {
    try {
      setLoading(true);

      // Étape 1 : Charger et décoder l'image
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const byteArray = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
      let imageTensor = decodeJpeg(byteArray).toFloat();

      // Étape 2 : Redimensionner l'image
      const [h, w] = imageTensor.shape.slice(0, 2);
      const newW = 300;
      const newH = Math.round((h / w) * newW);
      imageTensor = tf.image.resizeBilinear(imageTensor, [newH, newW]);

      // Étape 3 : Convertir en niveaux de gris et normaliser
      const gray = imageTensor.mean(2).div(255).expandDims(2);

      // Étape 4 : Ajuster le seuil de binarisation (abaissé à 0.2 pour capturer plus de points sombres)
      const binary = gray.less(tf.scalar(0.2)).cast('int32');
      const data = binary.squeeze().arraySync();

      // Étape 5 : Détecter les dominos
      // Nouvelle approche : Identifier les régions blanches connectées (dominos) avec DFS
      const visitedRegions = Array.from({ length: newH }, () => Array(newW).fill(false));
      const dominoRegions = [];

      const dfsRegion = (y, x) => {
        const stack = [[y, x]];
        const region = [];
        while (stack.length) {
          const [cy, cx] = stack.pop();
          if (
            cy < 0 || cy >= newH || cx < 0 || cx >= newW ||
            visitedRegions[cy][cx] || data[cy][cx] === 1 // Ignorer les points noirs
          ) continue;
          visitedRegions[cy][cx] = true;
          region.push([cy, cx]);
          stack.push([cy + 1, cx], [cy - 1, cx], [cy, cx + 1], [cy, cx - 1]);
        }
        return region;
      };

      // Trouver toutes les régions blanches (dominos)
      for (let y = 0; y < newH; y++) {
        for (let x = 0; x < newW; x++) {
          if (!visitedRegions[y][x] && data[y][x] === 0) {
            const region = dfsRegion(y, x);
            if (region.length > 1000) { // Filtrer les petites régions (bruit)
              // Calculer les limites de la région (bounding box)
              let minY = newH, maxY = 0, minX = newW, maxX = 0;
              for (const [ry, rx] of region) {
                minY = Math.min(minY, ry);
                maxY = Math.max(maxY, ry);
                minX = Math.min(minX, rx);
                maxX = Math.max(maxX, rx);
              }
              dominoRegions.push({ minY, maxY, minX, maxX });
            }
          }
        }
      }

      console.log("Nombre de dominos détectés :", dominoRegions.length);

      // Étape 6 : Compter les points dans chaque domino
      let totalPips = 0;
      for (const { minY, maxY, minX, maxX } of dominoRegions) {
        const visitedPips = Array.from({ length: newH }, () => Array(newW).fill(false));
        const dfsPip = (y, x) => {
          const stack = [[y, x]];
          let size = 0;
          while (stack.length) {
            const [cy, cx] = stack.pop();
            if (
              cy < minY || cy > maxY || cx < minX || cx > maxX ||
              visitedPips[cy][cx] || data[cy][cx] === 0
            ) continue;
            visitedPips[cy][cx] = true;
            size++;
            stack.push([cy + 1, cx], [cy - 1, cx], [cy, cx + 1], [cy, cx - 1]);
          }
          return size;
        };

        let pipCount = 0;
        for (let y = minY; y <= maxY; y++) {
          for (let x = minX; x <= maxX; x++) {
            if (!visitedPips[y][x] && data[y][x] === 1) {
              const size = dfsPip(y, x);
              // Ajuster la plage de taille des points (plus petite pour les points redimensionnés)
              if (size > 5 && size < 80) {
                pipCount++;
              }
            }
          }
        }
        console.log(`Points détectés dans ce domino : ${pipCount}`);
        totalPips += pipCount;
      }

      console.log("Total des points détectés :", totalPips);

      // Étape 7 : Nettoyer les tenseurs
      tf.dispose([imageTensor, gray, binary]);
      return totalPips;
    } catch (error) {
      console.error("Erreur analyse image:", error);
      return 0;
    } finally {
      setLoading(false);
    }
  };

  const handleCapture = async () => {
    if (!hasPermission) {
      Alert.alert('Erreur', 'Permission caméra non accordée');
      return;
    }
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: false,
      });
      if (result.canceled) return;
      const { uri } = result.assets[0];
      setLoading(true);
      const totalPoints = await analyzeImage(uri);
      Alert.alert('Résultat', `Nombre total de points détectés : ${totalPoints}`);
    } catch (e) {
      console.error('Erreur capture/analyse :', e);
      Alert.alert('Erreur', 'Impossible de capturer ou d’analyser la photo');
      setLoading(false);
    }
  };

  const menuItems = [
    { title: 'Tableau de bord', screen: 'Dashboard', icon: 'dashboard' },
    { title: 'Calculator', screen: 'Calculator', icon: 'calculate' },
    { title: 'Selection', screen: 'Selection', icon: 'group' },
    { title: 'Caméra Domino', action: handleCapture, icon: 'casino' },
    { title: 'Mise en ligne', action: () => handleUploadWithConfirmation(setLoading), icon: 'cloud-upload' },
  ];

  if (!isOpen) return null;

  return (
    <View style={styles.container}>
      {loading && (
        <View
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            zIndex: 10,
            transform: [{ translateX: -25 }, { translateY: -25 }],
          }}
        >
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      )}
      <TouchableOpacity onPress={onClose} style={styles.closeButton}>
        <Icon name="close" size={24} color="#333" />
      </TouchableOpacity>
      <View style={styles.menuContainer}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.title}
            style={styles.menuItem}
            onPress={item.action || (() => onNavigate(item.screen))}
          >
            <Icon name={item.icon} size={20} color="#555" style={styles.icon} />
            <Text style={styles.menuText}>{item.title}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 280,
    backgroundColor: 'white',
    height: '100%',
    paddingTop: 50,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    padding: 5,
  },
  menuContainer: {
    marginTop: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  icon: {
    marginRight: 15,
  },
  menuText: {
    fontSize: 16,
    color: '#333',
  },
});

export default Sidebar;