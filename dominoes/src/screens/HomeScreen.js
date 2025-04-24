import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import Layout from '../components/Layout';
import Sidebar from '../components/Sidebar';
import Icon from 'react-native-vector-icons/MaterialIcons';
import GameRepository from '../database/GameRepository';
import PlayerRepository from '../database/PlayerRepository';

export default function HomeScreen({ route, navigation }) {
  const { players } = route.params;
  const confettiRef = useRef(null);
  
  // États du jeu
  const [playerList, setPlayerList] = useState(
    players.map(player => ({
      ...player,
      score: 0,
      turns: 0,
      reached60: false,
      reached120: false
    }))
  );
  
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [scoreInput, setScoreInput] = useState('');
  const [showSummary, setShowSummary] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [gameEnded, setGameEnded] = useState(false);

  // États du Sidebar
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const sidebarOffset = useRef(new Animated.Value(-Dimensions.get('window').width)).current;

  // Animation pour ouvrir le sidebar
  const openSidebar = () => {
    setSidebarOpen(true);
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0.5,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(sidebarOffset, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Animation pour fermer le sidebar
  const closeSidebar = () => {
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(sidebarOffset, {
        toValue: -Dimensions.get('window').width,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => setSidebarOpen(false));
  };

  // Navigation depuis le sidebar
  const navigateTo = (screen) => {
    closeSidebar();
    if (screen === 'Selection') {
      navigation.goBack();
    }
    if (screen === 'Calculator') {
      navigation.navigate('CalculatorScreen');
    }
    if (screen === 'Dashboard') {
      navigation.navigate('DashboardScreen', { players: playerList });
    }
    // Ajoutez d'autres écrans ici si nécessaire
  };


  
  // Vérifie les conditions de victoire
  useEffect(() => {
    const checkAchievements = async () => {
      const allScores = playerList.map(p => p.score);
      const maxScore = Math.max(...allScores);
      const minScore = Math.min(...allScores);
      const winner = playerList.find(p => p.score === maxScore);
      const losers = playerList.filter(p => p.id !== winner?.id).map(p => p.id);
      let fundId = 1; 

      try {
        const lastFund = await GameRepository.getLastFund();
        if (lastFund) {
          fundId = lastFund.amount;
        }
      } catch (error) {
        console.warn("Aucun fond existant trouvé");
      }

      // Condition 1: Un joueur atteint 60+ et les autres à 0
      if (maxScore >= 60 && minScore === 0 && !winner?.reached60) {
        const achiever = playerList.find(p => p.score >= 60);
        if (achiever) {
          // Enregistrement dans la base de données
          try {
            const fundId = await GameRepository.createFund(achiever.score);
            const currentDate = new Date().toISOString();
            
            await GameRepository.addWinner(achiever.id, currentDate, fundId);
            await GameRepository.addLosers(losers, currentDate, fundId);
          } catch (error) {
            console.error("Erreur lors de l'enregistrement", error);
          }
  
          setModalMessage(`${achiever.name} a atteint ${achiever.score} points alors que les autres sont à 0 !`);
          setModalVisible(true);
          setGameEnded(true);
          setPlayerList(prev => prev.map(p => 
            p.id === achiever.id ? {...p, reached60: true} : p
          ));
          return true;
        }
      }
  
      // Condition 2: Un joueur atteint 120+
      if (maxScore >= 120 && !winner?.reached120) {
        // Enregistrement dans la base de données
        try {
          // const fundId = await GameRepository.createFund(winner.score);
          const currentDate = new Date().toISOString();
          
          await GameRepository.addWinner(winner.id, currentDate, fundId);
          await GameRepository.addLosers(losers, currentDate, fundId);
        } catch (error) {
          console.error("Erreur lors de l'enregistrement", error);
        }
  
        setModalMessage(`${winner.name} a gagné avec ${winner.score} points !`);
        setModalVisible(true);
        setGameEnded(true);
        setPlayerList(prev => prev.map(p => 
          p.id === winner.id ? {...p, reached120: true} : p
        ));
        return true;
      }
  
      return false;
    };
  
    checkAchievements();
  }, [playerList]);

  // useEffect(() => {
  //   const unsubscribe = navigation.addListener('focus', () => {
  //     // Logique à exécuter quand l'écran redevient actif
  //     console.log("Retour sur l'écran de jeu - état préservé");
      
  //     // Si vous avez besoin de rafraîchir des données :
  //     // refreshData();
  //   });

  //   return unsubscribe;
  // }, [navigation]);

  // Joueur actuel
  const currentPlayer = playerList[currentTurnIndex];

  // Passe au joueur suivant
  const nextTurn = () => {
    setCurrentTurnIndex((prev) => (prev + 1) % playerList.length);
  };

  // Ajoute un score à un joueur
  const addScoreToPlayer = (playerId) => {
    const score = parseInt(scoreInput);
    if (isNaN(score)) {
      Alert.alert('Erreur', 'Veuillez entrer un nombre valide');
      return;
    }

    setPlayerList(prevPlayers => {
      return prevPlayers.map(player => {
        if (player.id === playerId) {
          return {
            ...player,
            score: player.score + score,
            turns: player.turns + 1
          };
        }
        return player;
      });
    });

    setScoreInput('');
    nextTurn();
  };

  // Passe le tour sans ajouter de score
  const skipTurn = () => {
    setPlayerList(prevPlayers =>
      prevPlayers.map((player, index) =>
        index === currentTurnIndex
          ? { ...player, turns: player.turns + 1 }
          : player
      )
    );
    nextTurn();
  };

  // Ferme le modal et gère la fin de jeu
  const handleModalClose = () => {
    setModalVisible(false);
    if (gameEnded) {
      setShowSummary(true);
    }
  };

  // Retour à la sélection des joueurs
  const returnToSelection = () => {
    navigation.goBack();
  };

  // Écran de résumé
  if (showSummary) {
    return (
      <Layout>
        <ScrollView contentContainerStyle={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Résumé de la Partie</Text>
          
          {playerList
            .sort((a, b) => b.score - a.score)
            .map((player, index) => (
              <View key={player.id} style={styles.summaryPlayerCard}>
                <Text style={styles.summaryPosition}>{index + 1}er</Text>
                <View style={styles.summaryPlayerInfo}>
                  <Text style={styles.summaryPlayerName}>{player.name}</Text>
                  <Text style={styles.summaryPlayerScore}>{player.score} points</Text>
                </View>
                {player.reached120 && (
                  <Text style={styles.winnerBadge}>🏆 Gagnant</Text>
                )}
              </View>
            ))}

          <TouchableOpacity 
            style={styles.returnButton}
            onPress={returnToSelection}
          >
            <Text style={styles.returnButtonText}>Retour à la sélection</Text>
          </TouchableOpacity>
        </ScrollView>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Bouton hamburger */}
      <TouchableOpacity 
        style={styles.hamburgerButton}
        onPress={openSidebar}
      >
        <Icon name="menu" size={30} color="#333" />
      </TouchableOpacity>

      {/* Overlay pour fermer le sidebar */}
      {sidebarOpen && (
        <Animated.View 
          style={[
            styles.overlay,
            { opacity: overlayOpacity }
          ]}
        >
          <TouchableOpacity
            style={styles.overlayTouchable}
            activeOpacity={1}
            onPress={closeSidebar}
          />
        </Animated.View>
      )}

      {/* Sidebar animé */}
      <Animated.View 
        style={[
          styles.sidebarContainer,
          { transform: [{ translateX: sidebarOffset }] }
        ]}
      >
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={closeSidebar}
          onNavigate={navigateTo}
        />
      </Animated.View>

      <ScrollView contentContainerStyle={styles.container}>
        {/* Tour actuel */}
        <View style={styles.turnIndicator}>
          <Text style={styles.turnText}>Tour de :</Text>
          <Text style={styles.currentPlayer}>{currentPlayer.name}</Text>
        </View>

        {/* Liste des joueurs */}
        <View style={styles.playersContainer}>
          {playerList.map(player => (
            <View 
              key={player.id} 
              style={[
                styles.playerCard,
                player.id === currentPlayer.id && styles.activePlayerCard,
                player.reached120 && styles.winnerCard
              ]}
            >
              <Text style={styles.playerName}>{player.name}</Text>
              <Text style={styles.playerScore}>Score: {player.score}</Text>
              <Text style={styles.playerTurns}>Tours: {player.turns}</Text>
            </View>
          ))}
        </View>

        {/* Input score */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Entrez le score à ajouter"
            keyboardType="numeric"
            value={scoreInput}
            onChangeText={setScoreInput}
          />
        </View>

        {/* Boutons d'action */}
        <View style={styles.buttonsContainer}>
          {playerList.map(player => (
            <TouchableOpacity
              key={player.id}
              style={[
                styles.scoreButton,
                player.id === currentPlayer.id && styles.currentPlayerButton
              ]}
              onPress={() => addScoreToPlayer(player.id)}
              disabled={!scoreInput}
            >
              <Text style={styles.buttonText}>Ajouter à {player.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Bouton passer tour */}
        <TouchableOpacity 
          style={styles.skipButton}
          onPress={skipTurn}
        >
          <Text style={styles.skipButtonText}>Passer le tour (score 0)</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal de notification */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleModalClose}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1}
          onPress={handleModalClose}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>{modalMessage}</Text>
            {gameEnded && (
              <ConfettiCannon
                count={200}
                origin={{ x: -10, y: 0 }}
                explosionSpeed={500}
                fallSpeed={3000}
                fadeOut={true}
                ref={confettiRef}
              />
            )}
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleModalClose}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
    marginTop: 50, // Pour éviter que le contenu soit caché sous le header
  },
  hamburgerButton: {
    position: 'absolute',
    top: 15,
    left: 15,
    zIndex: 50,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
    zIndex: 90,
  },
  overlayTouchable: {
    flex: 1,
  },
  sidebarContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: 100,
  },
  summaryContainer: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  summaryTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  summaryPlayerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  summaryPosition: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
    marginRight: 15,
  },
  summaryPlayerInfo: {
    flex: 1,
  },
  summaryPlayerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  summaryPlayerScore: {
    fontSize: 16,
    color: '#757575',
  },
  winnerBadge: {
    color: '#4CAF50',
    fontWeight: 'bold',
    marginLeft: 10,
  },
  returnButton: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 30,
  },
  returnButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  turnIndicator: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  turnText: {
    color: 'white',
    fontSize: 16,
  },
  currentPlayer: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 5,
  },
  playersContainer: {
    marginBottom: 20,
  },
  playerCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  activePlayerCard: {
    borderColor: '#2196F3',
    backgroundColor: '#e3f2fd',
  },
  winnerCard: {
    borderColor: '#4CAF50',
    backgroundColor: '#e8f5e9',
  },
  playerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  playerScore: {
    fontSize: 16,
    color: '#2196F3',
    marginTop: 5,
  },
  playerTurns: {
    fontSize: 14,
    color: '#757575',
    marginTop: 3,
  },
  inputContainer: {
    marginBottom: 15,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
  },
  buttonsContainer: {
    marginBottom: 15,
  },
  scoreButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  currentPlayerButton: {
    backgroundColor: '#2196F3',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  skipButton: {
    backgroundColor: '#f44336',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  skipButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  modalOverlay: {
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
    alignItems: 'center',
  },
  modalText: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButton: {
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 5,
    width: '50%',
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});