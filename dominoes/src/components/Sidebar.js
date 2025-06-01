import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import * as FileSystem from 'expo-file-system';
import { decodeJpeg } from '@tensorflow/tfjs-react-native';

const Sidebar = ({ isOpen, onClose, onNavigate }) => {
  const [tfReady, setTfReady] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);

  useEffect(() => {
    const initialize = async () => {
      try {
        console.log('Vérification des permissions de la caméra...');
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        console.log('Statut des permissions:', status);
        setHasPermission(status === 'granted');

        if (status !== 'granted') {
          Alert.alert(
            'Permission refusée',
            'Veuillez activer la caméra dans les paramètres.'
          );
          return;
        }

        console.log('Initialisation de TensorFlow...');
        await tf.ready();
        setTfReady(true);
        console.log('TensorFlow prêt');
      } catch (error) {
        console.error('Erreur init:', error);
        Alert.alert('Erreur', 'Impossible d\'initialiser la caméra ou TensorFlow');
      }
    };

    initialize();
  }, []);

  const countPipsInRegion = (imageTensor, region) => {
    try {
      const { x, y, width, height } = region;
      const regionTensor = tf.tidy(() => {
        return tf.slice(imageTensor, [Math.round(y), Math.round(x), 0], [Math.round(height), Math.round(width), 3]);
      });

      const grayTensor = tf.tidy(() => {
        return regionTensor.mean(2).expandDims(2);
      });

      const threshold = 0.2;
      const binaryTensor = grayTensor.less(threshold).cast('float32');

      const pixelValues = binaryTensor.dataSync();
      const visited = new Set();
      let pipCount = 0;

      for (let i = 0; i < pixelValues.length; i++) {
        if (pixelValues[i] === 1 && !visited.has(i)) {
          pipCount++;
          const stack = [i];
          while (stack.length > 0) {
            const idx = stack.pop();
            if (!visited.has(idx) && pixelValues[idx] === 1) {
              visited.add(idx);
              const neighbors = [idx - Math.round(width), idx + Math.round(width), idx - 1, idx + 1];
              for (const n of neighbors) {
                if (
                  n >= 0 &&
                  n < pixelValues.length &&
                  !visited.has(n) &&
                  pixelValues[n] === 1
                ) {
                  stack.push(n);
                }
              }
            }
          }
        }
      }

      tf.dispose([regionTensor, grayTensor, binaryTensor]);
      return Math.min(pipCount, 6);
    } catch (e) {
      console.error('Erreur pip:', e);
      return 0;
    }
  };

  const simulateDominoDetection = (width, height) => {
    return [
      { x: width * 0.3, y: height * 0.3, width: width * 0.2, height: height * 0.4 },
      { x: width * 0.5, y: height * 0.5, width: width * 0.2, height: height * 0.4 },
    ];
  };

  const analyzeImage = async (imageUri, width, height) => {
    try {
      console.log('Chargement de l\'image:', imageUri);
      const imageData = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const imageTensor = tf.tidy(() => {
        const rawImageData = Uint8Array.from(atob(imageData), c => c.charCodeAt(0));
        const imageTensor = decodeJpeg(rawImageData);
        return imageTensor.cast('float32');
      });


      const dominoRegions = simulateDominoDetection(width, height);
      const results = [];

      for (const region of dominoRegions) {
        const { x, y, width, height } = region;
        const halfWidth = width / 2;

        const leftHalf = { x, y, width: halfWidth, height };
        const rightHalf = { x: x + halfWidth, y, width: halfWidth, height };

        const value1 = countPipsInRegion(imageTensor, leftHalf);
        const value2 = countPipsInRegion(imageTensor, rightHalf);

        results.push({ value1, value2, points: value1 + value2 });
      }

      const totalPoints = results.reduce((sum, d) => sum + d.points, 0);
      tf.dispose([imageTensor]);
      return { dominos: results, totalPoints };
    } catch (e) {
      console.error('Erreur analyse:', e);
      return { dominos: [], totalPoints: 0 };
    }
  };

  const handleCapture = async () => {
    if (!hasPermission) {
      Alert.alert('Erreur', 'Permission de la caméra non accordée');
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: false,
      });

      if (result.canceled) {
        console.log('Capture annulée');
        return;
      }

      const { uri, width, height } = result.assets[0];
      console.log('Image capturée:', { uri, width, height });
      const { dominos, totalPoints } = await analyzeImage(uri, width, height);

      Alert.alert(
        'Résultat',
        `Dominos détectés : ${dominos.length}\nTotal des points : ${totalPoints}\n` +
          dominos.map((d, i) => `Domino ${i + 1} : ${d.value1} | ${d.value2}`).join('\n'),
        [{ text: 'OK' }]
      );
    } catch (e) {
      console.error('Erreur capture:', e);
      Alert.alert('Erreur', 'Impossible de capturer ou d\'analyser la photo');
    }
  };

  const menuItems = [
    { title: 'Tableau de bord', screen: 'Dashboard', icon: 'dashboard' },
    { title: 'Calculator', screen: 'Calculator', icon: 'calculate' },
    { title: 'Selection', screen: 'Selection', icon: 'group' },
    { title: 'Caméra Dominos', action: handleCapture, icon: 'casino' },
  ];

  if (!isOpen) return null;

  return (
    <View style={styles.container}>
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