import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import PlayerRepository from '../database/PlayerRepository';
import { getDeviceId } from './../services/DeviceService';
import { fetchPlayersFromFirebase } from './../services/FirebaseService'
import NetInfo from '@react-native-community/netinfo';
import { database } from '../firebase/config';
import { ref, get, push, remove } from 'firebase/database';
import styles from '../../assets/styles/playerSelection';

export default function PlayerSelectionScreen({ navigation }) {
  const [players, setPlayers] = useState([]);
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [selectionOrder, setSelectionOrder] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRootDevice, setIsRootDevice] = useState(false);

  const checkInternetConnection = async () => {
    const state = await NetInfo.fetch();
    return state.isConnected && state.isInternetReachable;
  };

  const processRequests = async () => {
    try {
      const snapshot = await get(ref(database, 'requests'));
      if (!snapshot.exists()) {
        return;
      }

      const data = snapshot.val(); // objet clef ⇒ { name, timestamp, requestedBy }
      const entries = Object.entries(data); // [ [ key1, {…} ], [ key2, {…} ], … ]


      for (const [requestKey, requestObj] of entries) {

        await new Promise(resolveChoice => {
          Alert.alert(
            "Nouvelle demande d'ajout de joueur",
            `Nom du joueur : ${requestObj.name}\nDemandé par : ${requestObj.requestedBy}`,
            [
              {
                text: "Refuser",
                style: "destructive",
                onPress: () => {
                  remove(ref(database, `requests/${requestKey}`))
                    .catch(err => console.error("Erreur remove request :", err))
                    .finally(() => resolveChoice());
                }
              },
              {
                text: "Accepter",
                style: "default",
                onPress: () => {

                  (async () => {
                    try {
                      
                      await PlayerRepository.createPlayer(requestObj.name);
                    } catch (err1) {
                      console.error("Erreur création joueur local :", err1);
                    }

                    remove(ref(database, `requests/${requestKey}`))
                      .catch(err2 => console.error("Erreur remove request :", err2))
                      .finally(() => resolveChoice());
                  })();
                }
              }
            ],
            { cancelable: false }
          );
        });

      }
    } catch (err) {
      console.error("Erreur lors du traitement des demandes :", err);
    }
  };


useEffect(() => {
  const checkDevice = async () => {
    const deviceId = await getDeviceId();
    setIsRootDevice(deviceId === 'b8db9c4b7f2d4c81');
  };

  checkDevice();
}, []);


useEffect(() => {

  // if (isRootDevice === null || isRootDevice === undefined) return;

  const loadPlayers = async () => {
    setIsLoading(true);
    try {
      const localPlayers = await PlayerRepository.getAllPlayers();

      if (isRootDevice) {
        console.log("isRootDevice =", isRootDevice);
        const isConnected = await checkInternetConnection();
        if (isConnected) {
          await processRequests(); 
        }
        setPlayers(localPlayers.map(p => ({ ...p, selected: false })));
        return;
      }

      if (localPlayers.length === 0 && !isRootDevice) {
        const isConnected = await checkInternetConnection();
        if (!isConnected) {
          Alert.alert('Hors ligne', 'Vous êtes hors ligne. Connectez-vous à Internet pour synchroniser les joueurs.');
          setPlayers([]); 
          return;
        }

        const firebasePlayers = await fetchPlayersFromFirebase();

        for (const firebasePlayer of firebasePlayers) {
          await PlayerRepository.createFullPlayerIfNotExistsIfNotExists(firebasePlayer);
        }

        const updatedPlayers = await PlayerRepository.getAllPlayers();
        setPlayers(updatedPlayers.map(p => ({ ...p, selected: false })));
      } else {
        setPlayers(localPlayers.map(p => ({ ...p, selected: false })));
      }

    } catch (e) {
      Alert.alert('Erreur', 'Impossible de charger les joueurs');
    } finally {
      setIsLoading(false);
    }
  };

  loadPlayers();
}, [isRootDevice]);


  const togglePlayerSelection = (playerId) => {
    setPlayers(prevPlayers =>
      prevPlayers.map(player =>
        player.idplayer === playerId
          ? { ...player, selected: !player.selected }
          : player
      )
    );
    
    setSelectionOrder(prev =>
      prev.includes(playerId)
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    );
  };


  const openAddPlayerModal = () => {
    setNewPlayerName('');
    setShowAddPlayerModal(true);
  };


  const confirmAddPlayer = async () => {
    if (!newPlayerName.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un nom pour le joueur');
      return;
    }

    try {
      if (isRootDevice) {
        const newId = await PlayerRepository.createPlayer(newPlayerName.trim());
        setPlayers(prev => [
          ...prev,
          { idplayer: newId, name: newPlayerName.trim(), selected: false }
        ]);
        setShowAddPlayerModal(false);
      } 
      else {
        const netState = await NetInfo.fetch();

        if (!netState.isConnected || !netState.isInternetReachable) {
          Alert.alert(
            'Connexion requise',
            'Veuillez activer votre connexion Internet pour envoyer la demande.'
          );
          return;
        }

        try {
          const request = {
            name: newPlayerName.trim(),
            timestamp: Date.now(),
            requestedBy: await getDeviceId()
          };


          await push(ref(database, 'requests'), request);

          Alert.alert(
            'Demande envoyée',
            'Votre demande d’ajout de joueur a été envoyée. Elle doit être approuvée par l’administrateur.'
          );
        } catch (error) {
          console.error('Erreur lors de l\'envoi de la demande :', error);
          Alert.alert('Erreur', 'Impossible d’envoyer la demande.');
        }

        setShowAddPlayerModal(false);
      }

    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue.');
    }
  };


  const refreshPlayers = async () => {
    const isConnected = await checkInternetConnection();

    if (!isConnected) {
      Alert.alert(
        'Hors ligne',
        'Vous êtes hors ligne. Connectez-vous à Internet pour synchroniser les joueurs.'
      );
      setPlayers([]);
      return;
    }

    try {
      setIsLoading(true);
      const firebasePlayers = await fetchPlayersFromFirebase();

      for (const firebasePlayer of firebasePlayers) {
        await PlayerRepository.createFullPlayerIfNotExists(firebasePlayer);
      }

      const updatedPlayers = await PlayerRepository.getAllPlayers();
      setPlayers(updatedPlayers.map(p => ({ ...p, selected: false })));
      Alert.alert('Vous êtes à jour', 'Tous les joueuers ont été rafraîchis avec succès.');
    } catch (error) {
      console.error('Impossible de rafraîchir les joueurs.', error);

      Alert.alert('Erreur', 'Impossible de rafraîchir les joueurs. ');
    } finally {
      setIsLoading(false);
    }
  };

  const deletePlayer = async (playerId) => {
    Alert.alert(
      'Supprimer le joueur',
      'Êtes-vous sûr de vouloir supprimer ce joueur ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await PlayerRepository.deletePlayer(playerId);
              setPlayers(prev => prev.filter(p => p.idplayer !== playerId));
              setSelectionOrder(prev => prev.filter(id => id !== playerId));
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer ce joueur');
            }
          }
        }
      ]
    );
  };


  const startGame = () => {
    const selectedPlayers = players.filter((player) => player.selected);
    
    if (selectedPlayers.length < 1) {
      Alert.alert('Erreur', 'Veuillez sélectionner au moins un joueur.');
    } else if (selectedPlayers.length > 3) {
      Alert.alert('Erreur', 'Vous ne pouvez sélectionner que 3 joueurs maximum.');
    } else {
      const orderedPlayers = selectionOrder
        .map(id => selectedPlayers.find(p => p.idplayer === id))
        .filter(Boolean);
      
      navigation.navigate('HomeScreen', {
        players: orderedPlayers
      });
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Chargement des joueurs...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sélectionnez les joueurs</Text>

      {players.map((player) => (
        <View key={player.idplayer} style={styles.playerRow}>
          <TouchableOpacity
            style={styles.playerContainer}
            onPress={() => togglePlayerSelection(player.idplayer)}
          >
            <View style={styles.checkbox}>
              {player.selected && <View style={styles.checked} />}
            </View>
            <Text style={styles.playerText}>{player.name}</Text>
          </TouchableOpacity>
          
          {isRootDevice && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => deletePlayer(player.idplayer)}
            >
              <Text style={styles.deleteButtonText}>×</Text>
            </TouchableOpacity>
          )}

        </View>
      ))}

      <TouchableOpacity style={styles.addButton} onPress={openAddPlayerModal}>
        <Text style={styles.buttonText}>Ajouter un joueur</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.startButton,
          players.filter((p) => p.selected).length === 0 && { opacity: 0.5 },
        ]}
        onPress={startGame}
        disabled={players.filter((p) => p.selected).length === 0}
      >
        <Text style={styles.buttonText}>Commencer la partie</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.refreshButton} onPress={refreshPlayers}>
        <Text style={styles.refreshText}>Rafraîchir les joueurs</Text>
      </TouchableOpacity>

      <Modal
        visible={showAddPlayerModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddPlayerModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nouveau Joueur</Text>

            <TextInput
              style={styles.input}
              placeholder="Entrez le nom du joueur"
              value={newPlayerName}
              onChangeText={setNewPlayerName}
              autoFocus={true}
              maxLength={20}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAddPlayerModal(false)}
              >
                <Text style={styles.modalButtonText}>Annuler</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={confirmAddPlayer}
              >
                <Text style={styles.modalButtonText}>Ajouter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}