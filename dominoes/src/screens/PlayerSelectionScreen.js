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

export default function PlayerSelectionScreen({ navigation }) {
  const [players, setPlayers] = useState([]);
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [selectionOrder, setSelectionOrder] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Charger les joueurs depuis SQLite via PlayerRepository lors du montage du composant
  useEffect(() => {
    const loadPlayers = async () => {
      try {
        // Récupération des joueurs depuis la base SQLite
        const loadedPlayers = await PlayerRepository.getAllPlayers();
        // Ajout d'une propriété "selected" pour la gestion de la sélection
        const formattedPlayers = loadedPlayers.map(player => ({
          ...player,
          selected: false,
        }));
        setPlayers(formattedPlayers);
      } catch (e) {
        Alert.alert('Erreur', 'Impossible de charger les joueurs');
      } finally {
        setIsLoading(false);
      }
    };

    loadPlayers();
  }, []);

  // Permettre la sélection/désélection d'un joueur
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

  // Ouvrir la modale pour ajouter un nouveau joueur
  const openAddPlayerModal = () => {
    setNewPlayerName('');
    setShowAddPlayerModal(true);
  };

  // Confirmer l'ajout d'un nouveau joueur dans la base SQLite
  const confirmAddPlayer = async () => {
    if (!newPlayerName.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un nom pour le joueur');
      return;
    }

    try {
      // Création dans la base grâce au repository
      const newId = await PlayerRepository.createPlayer(newPlayerName.trim());
      // Mise à jour de l'état local avec le nouveau joueur
      setPlayers(prev => [
        ...prev,
        { idplayer: newId, name: newPlayerName.trim(), selected: false }
      ]);
      setShowAddPlayerModal(false);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d’ajouter le joueur');
    }
  };

  // Supprimer un joueur à la fois de la base et de l'état local
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

  // Démarrer le jeu avec les joueurs sélectionnés
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
          
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => deletePlayer(player.idplayer)}
          >
            <Text style={styles.deleteButtonText}>×</Text>
          </TouchableOpacity>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 5,
  },
  playerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#2196F3',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checked: {
    width: 14,
    height: 14,
    backgroundColor: '#2196F3',
    borderRadius: 2,
  },
  playerText: {
    fontSize: 18,
    marginLeft: 15,
    color: '#333',
  },
  deleteButton: {
    padding: 10,
    marginLeft: 10,
  },
  deleteButtonText: {
    fontSize: 24,
    color: '#f44336',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 10,
  },
  startButton: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 12,
    marginBottom: 20,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#f44336',
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
