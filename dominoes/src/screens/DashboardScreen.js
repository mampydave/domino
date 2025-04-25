import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Dimensions,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Sidebar from '../components/Sidebar';
import GameRepository from '../database/GameRepository';

const DashboardScreen = ({ route, navigation }) => {
  const { players } = route.params || { players: [] };
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [fundAmount, setFundAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [topPlayers, setTopPlayers] = useState([]);
  const [worstPlayers, setWorstPlayers] = useState([]);
  const [totalFunds, setTotalFunds] = useState(0);
  const [stats, setStats] = useState({
    totalWins: 0,
    totalLosses: 0,
    avgWinAmount: 0,
    avgLossAmount: 0,
  });

  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const sidebarOffset = useRef(new Animated.Value(-Dimensions.get('window').width)).current;

  const correctPassword = 'dashboard123D';

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const topPlayersData = await GameRepository.getTopPlayersByWins();
        setTopPlayers(topPlayersData);
        const worstPlayersData = await GameRepository.getWorstPlayersByLosses();
        setWorstPlayers(worstPlayersData);
        const totalFundsData = await GameRepository.getTotalFunds();
        setTotalFunds(totalFundsData);
        const statsData = await GameRepository.getGlobalStats();
        setStats(statsData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        Alert.alert('Erreur', 'Impossible de charger les données');
      } finally {
        setLoading(false);
      }
    };
    if (isAuthenticated) {
      fetchDashboardData();
    }
  }, [isAuthenticated]);

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
    if (screen === 'Selection') navigation.goBack();
    if (screen === 'Calculator') navigation.navigate('CalculatorScreen');
  };

  const handleLogin = () => {
    if (password === correctPassword) {
      setIsAuthenticated(true);
      setPassword('');
    } else {
      Alert.alert('Erreur', 'Mot de passe incorrect');
    }
  };

  const handleAddFund = async () => {
    const amount = parseFloat(fundAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer un montant valide');
      return;
    }
    try {
      await GameRepository.createFund(amount);
      setFundAmount('');
      setModalVisible(false);
      const total = await GameRepository.getTotalFunds();
      setTotalFunds(total);
      Alert.alert('Succès', 'Fonds ajouté avec succès');
    } catch (error) {
      console.error('Error adding fund:', error);
      Alert.alert('Erreur', 'Impossible d\'ajouter le fond');
    }
  };

  const resetAllData = async () => {
    Alert.alert(
      'Confirmation',
      'Voulez-vous vraiment réinitialiser toutes les données ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Oui',
          onPress: async () => {
            try {
              await GameRepository.resetAllData();
              
            } catch (error) {
              console.error('Erreur lors de la réinitialisation :', error);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={styles.loginBox}>
          <Text style={styles.title}>Accès au Tableau de Bord</Text>
          <View style={styles.inputContainer}>
            <Icon name="lock" size={24} color="#333" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Entrez le mot de passe"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>
          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>Se connecter</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Chargement des données...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.hamburgerButton} onPress={openSidebar}>
        <Icon name="menu" size={30} color="#333" />
      </TouchableOpacity>

      {sidebarOpen && (
        <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
          <TouchableOpacity
            style={styles.overlayTouchable}
            activeOpacity={1}
            onPress={closeSidebar}
          />
        </Animated.View>
      )}

      <Animated.View
        style={[styles.sidebarContainer, { transform: [{ translateX: sidebarOffset }] }]}
      >
        <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} onNavigate={navigateTo} />
      </Animated.View>

      <ScrollView contentContainerStyle={styles.dashboardContainer}>
        <Text style={styles.dashboardTitle}>Tableau de Bord Financier</Text>

        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Icon name="account-balance" size={30} color="#4CAF50" />
            <Text style={styles.summaryText}>Total Fonds: {totalFunds.toFixed(2)} €</Text>
          </View>
          <View style={styles.summaryItem}>
            <Icon name="emoji-events" size={30} color="#FFC107" />
            <Text style={styles.summaryText}>Victoires: {stats.totalWins}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Icon name="money-off" size={30} color="#F44336" />
            <Text style={styles.summaryText}>Pertes: {stats.totalLosses}</Text>
          </View>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.actionButtonText}>Ajouter Fonds</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏆 Top Joueurs (Gains)</Text>
          {topPlayers.slice(0, 3).map((player, index) => (
            <View key={player.idplayer} style={styles.playerCard}>
              <Text style={styles.playerRank}>{index + 1}</Text>
              <View style={styles.playerInfo}>
                <Text style={styles.playerName}>{player.name}</Text>
                <Text style={styles.playerStats}>
                  {player.totalWins} victoires • {player.totalAmount?.toFixed(2)} €
                </Text>
              </View>
              <Icon name="trending-up" size={24} color="#4CAF50" />
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💸 Pires Joueurs (Pertes)</Text>
          {worstPlayers.slice(0, 3).map((player, index) => (
            <View key={player.idplayer} style={styles.playerCard}>
              <Text style={styles.playerRank}>{index + 1}</Text>
              <View style={styles.playerInfo}>
                <Text style={styles.playerName}>{player.name}</Text>
                <Text style={styles.playerStats}>
                  {player.totalLosses} pertes • {player.totalAmount?.toFixed(2)} €
                </Text>
              </View>
              <Icon name="trending-down" size={24} color="#F44336" />
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Comparaison Joueurs</Text>
          <View style={styles.comparisonContainer}>
            <View style={styles.comparisonLegend}>
              <View style={[styles.legendItem, styles.winLegend]} />
              <Text>Gains</Text>
              <View style={[styles.legendItem, styles.lossLegend]} />
              <Text>Pertes</Text>
            </View>
            {[...topPlayers, ...worstPlayers]
              .filter((v, i, a) => a.findIndex(t => t.idplayer === v.idplayer) === i)
              .map(player => (
                <View key={player.idplayer} style={styles.comparisonItem}>
                  <Text style={styles.comparisonName}>{player.name}</Text>
                  <View style={styles.barContainer}>
                    <View
                      style={[
                        styles.winBar,
                        { width: `${((player.totalWinsAmount || 0) / (totalFunds || 1)) * 100}%` },
                      ]}
                    />
                    <View
                      style={[
                        styles.lossBar,
                        { width: `${((player.totalLossesAmount || 0) / (totalFunds || 1)) * 100}%` },
                      ]}
                    />
                  </View>
                </View>
              ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Détails des Joueurs</Text>
          {players.map((player) => (
            <View key={player.idplayer} style={styles.playerCard}>
              <Text style={styles.playerName}>{player.nom}</Text>
              <Text style={styles.playerDetail}>
                Gains: {(topPlayers.find(p => p.idplayer === player.idplayer)?.totalAmount || 0).toFixed(2)} €
              </Text>
              <Text style={styles.playerDetail}>
                Pertes: {(worstPlayers.find(p => p.idplayer === player.idplayer)?.totalAmount || 0).toFixed(2)} €
              </Text>
              <Text style={styles.playerDetail}>
                Net: {((topPlayers.find(p => p.idplayer === player.idplayer)?.totalAmount || 0) -
                  (worstPlayers.find(p => p.idplayer === player.idplayer)?.totalAmount || 0)).toFixed(2)} €
              </Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.actionButtonText}>Retour</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.resetButton} onPress={resetAllData}>
          <Text style={styles.resetText}>Reinitialiser toutes les donnees</Text>
        </TouchableOpacity>

      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Ajouter un Fonds</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Montant (€)"
              keyboardType="numeric"
              value={fundAmount}
              onChangeText={setFundAmount}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleAddFund}
              >
                <Text style={styles.modalButtonText}>Ajouter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
  loginBox: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    alignSelf: 'center',
    marginTop: '50%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
  },
  loginButton: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
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
  dashboardContainer: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 60,
  },
  dashboardTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  summaryCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  summaryText: {
    fontSize: 16,
    marginLeft: 10,
    color: '#333',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  playerCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  playerRank: {
    fontSize: 18,
    fontWeight: 'bold',
    width: 30,
    color: '#333',
  },
  playerInfo: {
    flex: 1,
    marginLeft: 10,
  },
  playerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  playerStats: {
    fontSize: 14,
    color: '#757575',
  },
  playerDetail: {
    fontSize: 16,
    color: '#757575',
    marginBottom: 3,
  },
  comparisonContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  comparisonLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  legendItem: {
    width: 20,
    height: 10,
    marginRight: 5,
    marginLeft: 10,
  },
  winLegend: {
    backgroundColor: '#4CAF50',
  },
  lossLegend: {
    backgroundColor: '#F44336',
  },
  comparisonItem: {
    marginBottom: 10,
  },
  comparisonName: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
  },
  barContainer: {
    height: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  winBar: {
    height: '50%',
    backgroundColor: '#4CAF50',
    position: 'absolute',
    top: 0,
  },
  lossBar: {
    height: '50%',
    backgroundColor: '#F44336',
    position: 'absolute',
    bottom: 0,
  },
  actionButton: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
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
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  modalInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#FF5252',
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resetButton: {
    alignSelf: 'center',
    backgroundColor: 'red',
    padding: 10,
    borderRadius: 8,
    marginVertical: 10,
  },
  resetText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default DashboardScreen;