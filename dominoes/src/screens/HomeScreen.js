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
import styles from '../../assets/styles/home';

export default function HomeScreen({ route, navigation }) {
  const { players } = route.params;
  const confettiRef = useRef(null);
  

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


  const [sidebarOpen, setSidebarOpen] = useState(false);
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const sidebarOffset = useRef(new Animated.Value(-Dimensions.get('window').width)).current;


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


  

  useEffect(() => {
    const checkAchievements = async () => {

      console.log('player :', await PlayerRepository.getAllPlayers());
      console.log('players selected :', players);

      const allScores = playerList.map(p => p.score);
      const maxScore = Math.max(...allScores);
      const minScore = Math.min(...allScores);
      const winner = playerList.find(p => p.score === maxScore);
      const losers = playerList.filter(p => p.idplayer !== winner?.idplayer).map(p => p.idplayer);
      let fundId = 500; 

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
        const tsypoinse = playerList.find(p => p.score > 0 && p.idplayer !== achiever?.idplayer);
        console.log('tsy poinse :', tsypoinse);
        
        if (achiever && !tsypoinse) {

          try {
            // const fundId = await GameRepository.getLastFund();
            const currentDate = new Date().toISOString();
            const fundIdwin = fundId * (playerList.length - 1);
            
            await GameRepository.addWinner(achiever.idplayer, currentDate, fundIdwin);
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
        
        try {
          // const fundId = await GameRepository.createFund(winner.score);
          const currentDate = new Date().toISOString();
          const fundIdwin = fundId * (playerList.length - 1);
          
          await GameRepository.addWinner(winner.idplayer, currentDate, fundIdwin);
          await GameRepository.addLosers(losers, currentDate, fundId);
        } catch (error) {
          console.error("Erreur lors de l'enregistrement", error);
        }
  
        setModalMessage(`${winner.name} a gagné avec ${winner.score} points !`);
        setModalVisible(true);
        setGameEnded(true);
        setPlayerList(prev => prev.map(p => 
          p.idplayer === winner.idplayer ? {...p, reached120: true} : p
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
  // console.log(`player ${currentPlayer.name}`)
  
  const nextTurn = () => {
    setCurrentTurnIndex((prev) => (prev + 1) % playerList.length);
  };


  const addScoreToPlayer = (playerId) => {
    const score = parseInt(scoreInput);
    if (isNaN(score)) {
      Alert.alert('Erreur', 'Veuillez entrer un nombre valide');
      return;
    }

    setPlayerList(prevPlayers => {
      return prevPlayers.map(player => {
        if (player.idplayer === playerId) {
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
  // console.log(playerList);



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


  const handleModalClose = () => {
    setModalVisible(false);
    if (gameEnded) {
      setShowSummary(true);
    }
  };


  const returnToSelection = () => {
    navigation.goBack();
  };


  if (showSummary) {
    return (
      <Layout>
        <ScrollView contentContainerStyle={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Résumé de la Partie</Text>
          
              {playerList
                .sort((a, b) => b.score - a.score)
                .map((player, index) => (
                  <View key={player.idplayer} style={styles.summaryPlayerCard}>
                    <Text style={styles.summaryPosition}>{index + 1}er</Text>
                    <View style={styles.summaryPlayerInfo}>
                      <Text style={styles.summaryPlayerName}>{player.name}</Text>
                      <Text style={styles.summaryPlayerScore}>{player.score} points</Text>
                    </View>

                    {index === 0 && player.reached120 && (
                      <Text style={styles.winnerBadge}>🏆 Gagnant</Text>
                    )}
                    {index === 0 && <Text style={styles.winnerBadge}>🥇</Text>}
                    {index === 1 && <Text style={styles.winnerBadge}>🥈</Text>}
                    {index === 2 && <Text style={styles.winnerBadge}>🥉</Text>}
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
      <TouchableOpacity 
        style={styles.hamburgerButton}
        onPress={openSidebar}
      >
        <Icon name="menu" size={30} color="#333" />
      </TouchableOpacity>

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

        <View style={styles.turnIndicator}>
          <Text style={styles.turnText}>Tour de :</Text>
          <Text style={styles.currentPlayer}>{currentPlayer.name}</Text>
        </View>

        <View style={styles.playersContainer}>
          {playerList.map(player => (
            <View 
              key={player.idplayer} 
              style={[
                styles.playerCard,
                player.idplayer === currentPlayer.idplayer && styles.activePlayerCard,
                player.reached120 && styles.winnerCard
              ]}
            >
              <Text style={styles.playerName}>{player.name}</Text>
              <Text style={styles.playerScore}>Score: {player.score}</Text>
              <Text style={styles.playerTurns}>Tours: {player.turns}</Text>
            </View>
          ))}
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Entrez le score à ajouter"
            keyboardType="numeric"
            value={scoreInput}
            onChangeText={setScoreInput}
          />
        </View>


        <View style={styles.buttonsContainer}>
          {playerList.map(player => (
            <TouchableOpacity
              key={player.idplayer}
              style={[
                styles.scoreButton,
                player.idplayer === currentPlayer.idplayer && styles.currentPlayerButton
              ]}
              onPress={() => addScoreToPlayer(player.idplayer)}
              disabled={!scoreInput}
            >
              <Text style={styles.buttonText}>Ajouter à {player.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity 
          style={styles.skipButton}
          onPress={skipTurn}
        >
          <Text style={styles.skipButtonText}>Passer le tour (score 0)</Text>
        </TouchableOpacity>
      </ScrollView>

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

