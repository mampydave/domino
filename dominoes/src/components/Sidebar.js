import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Dimensions, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Camera, useCameraDevices, useFrameProcessor } from 'react-native-vision-camera';
import { runOnJS } from 'react-native-reanimated';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import * as FileSystem from 'expo-file-system';

const Sidebar = ({ isOpen, onClose, onNavigate }) => {
  const [showDominoCamera, setShowDominoCamera] = useState(false);
  const [totalPoints, setTotalPoints] = useState(0);
  const [detectedDominos, setDetectedDominos] = useState([]);
  const [model, setModel] = useState(null); // Modèle de détection
  const [pipModel, setPipModel] = useState(null); // Modèle de classification des points
  const [tfReady, setTfReady] = useState(false);
  const devices = useCameraDevices();
  const device = devices.back;
  const cameraRef = useRef(null);
  const detectionCache = useRef(new Set());

  // Initialiser TensorFlow.js et charger les modèles
  // useEffect(() => {
  //   const initializeTF = async () => {
  //     try {
  //       await tf.ready();
  //       setTfReady(true);

  //       // Charger le modèle de détection des dominos
  //       const detectionModelUrl = Platform.OS === 'ios'
  //         ? `${FileSystem.documentDirectory}model/model.json`
  //         : `file:///android_asset/model/model.json`;
  //       const detectionModel = await tf.loadGraphModel(detectionModelUrl);

  //       // Charger le modèle de classification des points
  //       const pipModelUrl = Platform.OS === 'ios'
  //         ? `${FileSystem.documentDirectory}tfjs_pip_model/model.json`
  //         : `file:///android_asset/tfjs_pip_model/model.json`;
  //       const pipModel = await tf.loadLayersModel(pipModelUrl);

  //       setModel(detectionModel);
  //       setPipModel(pipModel);
  //       console.log('Modèles chargés avec succès');
  //     } catch (error) {
  //       console.error('Erreur lors de l\'initialisation de TF.js:', error);
  //     }
  //   };

  //   initializeTF();

  //   return () => {
  //     if (model) model.dispose();
  //     if (pipModel) pipModel.dispose();
  //   };
  // }, []);

  useEffect(() => {
    const initializeTF = async () => {
      try {
        await tf.ready();
        setTfReady(true);

        // Charger le modèle de détection depuis assets
        const detectionModelAsset = Asset.Asset.fromModule(require('./assets/model/model.json'));
        await detectionModelAsset.downloadAsync();
        const detectionModelDir = detectionModelAsset.localUri.replace('/model.json', '');
        const detectionModel = await tf.loadGraphModel(`file://${detectionModelAsset.localUri}`);

        // Charger le modèle de classification des points depuis assets
        const pipModelAsset = Asset.Asset.fromModule(require('./assets/tfjs_pip_model/model.json'));
        await pipModelAsset.downloadAsync();
        const pipModelInstance = await tf.loadLayersModel(`file://${pipModelAsset.localUri}`);

        setModel(detectionModel);
        setPipModel(pipModelInstance);
        console.log('Modèles chargés avec succès');
      } catch (error) {
        console.error('Erreur lors de l\'initialisation de TF.js:', error);
      }
    };

    initializeTF();

    return () => {
      if (model) model.dispose();
      if (pipModel) pipModel.dispose();
    };
  }, []);

  // Préprocesseur d'image pour la détection
  const preprocessImage = useCallback((frame) => {
    return tf.tidy(() => {
      const imageTensor = tf.tensor3d(new Uint8Array(frame.image), [frame.height, frame.width, 3]);
      const resized = tf.image.resizeBilinear(imageTensor, [320, 320]);
      const normalized = resized.div(255.0);
      return normalized.expandDims(0);
    });
  }, []);

  // Préprocesseur pour la classification des points
  const preprocessPipImage = useCallback((regionTensor) => {
    return tf.tidy(() => {
      const resized = tf.image.resizeBilinear(regionTensor, [64, 64]);
      return resized.div(255.0).expandDims(0);
    });
  }, []);

  // Post-traitement des prédictions de détection
  const postProcessPrediction = useCallback((prediction, frameWidth, frameHeight) => {
    const boxes = prediction.boxes.arraySync()[0];
    const scores = prediction.scores.arraySync()[0];
    const classes = prediction.classes.arraySync()[0];

    const threshold = 0.65;
    const dominos = [];
    const seenPositions = new Set();

    for (let i = 0; i < boxes.length; i++) {
      if (scores[i] >= threshold) {
        const [yMin, xMin, yMax, xMax] = boxes[i];
        const x = xMin * frameWidth;
        const y = yMin * frameHeight;
        const width = (xMax - xMin) * frameWidth;
        const height = (yMax - yMin) * frameHeight;

        const positionKey = `${Math.round(x)}-${Math.round(y)}`;
        if (!seenPositions.has(positionKey)) {
          seenPositions.add(positionKey);
          dominos.push({
            position: { x, y },
            width,
            height,
            confidence: scores[i],
          });
        }
      }
    }

    return dominos;
  }, []);

  // Compter les points noirs avec le modèle CNN
  const countPipsWithAI = async (region, frameTensor) => {
    try {
      const { x, y, width, height } = region;
      const regionTensor = tf.tidy(() => {
        const sliced = tf.slice(frameTensor, [y, x, 0], [height, width, 3]);
        return preprocessPipImage(sliced);
      });

      const prediction = await pipModel.predict(regionTensor);
      const pips = prediction.argMax(-1).dataSync()[0]; // Classe prédite (0-9)

      tf.dispose([regionTensor, prediction]);
      return pips;
    } catch (error) {
      console.error('Erreur lors de la classification des points:', error);
      return 0;
    }
  };

  // Compter les points noirs sans IA
  const countPipsWithoutAI = (imageTensor, region) => {
    try {
      const { x, y, width, height } = region;
      const regionTensor = tf.tidy(() => {
        return tf.slice(imageTensor, [y, x, 0], [height, width, 3]);
      });

      const grayTensor = tf.tidy(() => {
        return regionTensor.mean(2).expandDims(2);
      });

      const threshold = 0.3;
      const binaryTensor = grayTensor.greater(threshold).cast('float32');

      const pixelValues = binaryTensor.dataSync();
      let pipCount = 0;
      const visited = new Set();

      for (let i = 0; i < pixelValues.length; i++) {
        if (pixelValues[i] === 0 && !visited.has(i)) {
          pipCount++;
          visited.add(i);
          for (let j = i + 1; j < Math.min(i + 10, pixelValues.length); j++) {
            if (pixelValues[j] === 0) visited.add(j);
          }
        }
      }

      tf.dispose([regionTensor, grayTensor, binaryTensor]);
      return Math.min(pipCount, 9);
    } catch (error) {
      console.error('Erreur lors du comptage des points sans IA:', error);
      return 0;
    }
  };

  // Analyser les moitiés du domino
  const analyzeDomino = useCallback(async (dominoRegions, frameTensor, useAI = true) => {
    const results = [];

    for (const region of dominoRegions) {
      try {
        const { x, y, width, height } = region;
        const halfWidth = width / 2;

        const leftHalf = {
          x: Math.round(x),
          y: Math.round(y),
          width: Math.round(halfWidth),
          height: Math.round(height),
        };
        const rightHalf = {
          x: Math.round(x + halfWidth),
          y: Math.round(y),
          width: Math.round(halfWidth),
          height: Math.round(height),
        };

        const value1 = useAI
          ? await countPipsWithAI(leftHalf, frameTensor)
          : countPipsWithoutAI(frameTensor, leftHalf);
        const value2 = useAI
          ? await countPipsWithAI(rightHalf, frameTensor)
          : countPipsWithoutAI(frameTensor, rightHalf);

        results.push({
          ...region,
          value1,
          value2,
          points: value1 + value2,
        });
      } catch (error) {
        console.error('Erreur lors de l\'analyse du domino:', error);
      }
    }

    return results;
  }, [pipModel]);

  // Processeur de frame
  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    if (!model || !pipModel || !tfReady || !showDominoCamera) return;

    const imageTensor = preprocessImage(frame);
    runOnJS(processDetection)(imageTensor, frame.width, frame.height);
  }, [model, pipModel, tfReady, showDominoCamera, preprocessImage]);

  // Traitement de la détection
  const processDetection = useCallback(async (imageTensor, frameWidth, frameHeight) => {
    try {
      const prediction = await model.executeAsync(imageTensor);
      const rawDominos = postProcessPrediction(prediction, frameWidth, frameHeight);

      // Analyser les dominos avec le modèle CNN ou sans IA
      const dominosWithValues = await analyzeDomino(rawDominos, imageTensor, true);

      // Filtrer les doublons
      const uniqueDominos = dominosWithValues.filter((domino) => {
        const key = `${domino.value1}-${domino.value2}-${Math.round(domino.position.x)}-${Math.round(domino.position.y)}`;
        if (!detectionCache.current.has(key)) {
          detectionCache.current.add(key);
          return true;
        }
        return false;
      });

      if (uniqueDominos.length > 0) {
        setDetectedDominos((prev) => [...prev, ...uniqueDominos]);
        setTotalPoints((prev) => prev + uniqueDominos.reduce((sum, d) => sum + d.points, 0));
      }

      tf.dispose([imageTensor, prediction]);
    } catch (error) {
      console.error('Erreur lors du traitement de la détection:', error);
    }
  }, [model, postProcessPrediction, analyzeDomino]);

  // Réinitialiser lors de la fermeture de la caméra
  useEffect(() => {
    if (!showDominoCamera) {
      detectionCache.current.clear();
      setDetectedDominos([]);
      setTotalPoints(0);
    }
  }, [showDominoCamera]);

  const menuItems = [
    { title: 'Tableau de bord', screen: 'Dashboard', icon: 'dashboard' },
    { title: 'Calculator', screen: 'Calculator', icon: 'calculate' },
    { title: 'Selection', screen: 'Selection', icon: 'group' },
    { title: 'Caméra Dominos', action: () => setShowDominoCamera(true), icon: 'casino' },
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
            <Icon name={item.icon} size={20} color="#333" style={styles.icon} />
            <Text style={styles.menuText}>{item.title}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Modal
        visible={showDominoCamera}
        onRequestClose={() => setShowDominoCamera(false)}
        animationType="slide"
      >
        <View style={styles.cameraContainer}>
          {device && (
            <>
              <Camera
                ref={cameraRef}
                style={StyleSheet.absoluteFill}
                device={device}
                isActive={showDominoCamera}
                frameProcessor={frameProcessor}
                frameProcessorFps={3}
                orientation="portrait"
              />

              <View style={styles.overlay}>
                {detectedDominos.map((domino, index) => (
                  <View
                    key={index}
                    style={[
                      styles.dominoBox,
                      {
                        left: domino.position.x,
                        top: domino.position.y,
                        width: domino.width,
                        height: domino.height,
                      },
                    ]}
                  >
                    <View style={styles.dominoHalf}>
                      <Text style={styles.dominoValue}>{domino.value1}</Text>
                    </View>
                    <View style={styles.dominoHalf}>
                      <Text style={styles.dominoValue}>{domino.value2}</Text>
                    </View>
                    <Text style={styles.confidenceText}>{(domino.confidence * 100).toFixed(0)}%</Text>
                  </View>
                ))}
              </View>

              <View style={styles.infoPanel}>
                <Text style={styles.infoText}>
                  Points: {totalPoints} | Dominos: {detectedDominos.length}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowDominoCamera(false)}
              >
                <Icon name="close" size={30} color="#fff" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 280,
    backgroundColor: '#fff',
    height: '100%',
    paddingTop: 50,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  dominoBox: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#2e86de',
    flexDirection: 'row',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  dominoHalf: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderColor: '#000',
  },
  dominoValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  confidenceText: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    fontSize: 10,
    color: '#333',
  },
  infoPanel: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 10,
    padding: 15,
  },
  infoText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 10,
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