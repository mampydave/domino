import React, { useState, useEffect ,useRef} from 'react';
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
  RefreshControl, 
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Sidebar from '../components/Sidebar';
import GameRepository from '../database/GameRepository';
import PlayerRepository from '../database/PlayerRepository';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { ProgressBar } from 'react-native-paper';
import PerformanceChart from './PerformanceChart';
import styles from '../../assets/styles/dashboard';

const DashboardScreen = ({ route, navigation }) => {
  const { players } = route.params || { players: [] };
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [fundAmount, setFundAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [topPlayers, setTopPlayers] = useState([]);
  const [allPlayers, setAllPlayers] = useState([]);
  const [worstPlayers, setWorstPlayers] = useState([]);
  const [totalFunds, setTotalFunds] = useState(0);
  const [lastFunds, setLastFunds] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [topPlayersfetch, setTopPlayersfetch] = useState([]);
  const [worstPlayersfetch, setWorstPlayersfetch] = useState([]);
  const [refreshing, setRefreshing] = useState(false); 

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
    if (isAuthenticated) {
      fetchDashboardData();
    }
  }, [isAuthenticated]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setRefreshing(true); 
      const topPlayersData = await GameRepository.getTopPlayersByWins();
      setTopPlayers(topPlayersData);
      console.log('topPlayer ', topPlayersData);
      const worstPlayersData = await GameRepository.getWorstPlayersByLosses();
      setWorstPlayers(worstPlayersData);
      console.log('worstPlayer ', worstPlayersData);

      const topPlayersDatafetch = await GameRepository.fetchAllWinsData();
      setTopPlayersfetch(topPlayersDatafetch);
      console.log('topPlayer fetch', topPlayersDatafetch);

      const worstPlayersDatafetch = await GameRepository.fetchAllLossesData();
      setWorstPlayersfetch(worstPlayersDatafetch);
      console.log('worstPlayer fetch', worstPlayersDatafetch);

      const totalFundsData = await GameRepository.getTotalFunds();
      console.log('totalFundsData: ', totalFundsData);
      const lastFundsData = await GameRepository.getLastFund();
      setLastFunds(lastFundsData?.amount ?? 500);

      setAllPlayers(await PlayerRepository.getAllPlayers());

      setTotalFunds(totalFundsData);
      const statsData = await GameRepository.getGlobalStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      Alert.alert('Erreur', 'Impossible de charger les données');
    } finally {
      setLoading(false);
      setRefreshing(false); 
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

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
              fetchDashboardData(); 
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
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity onPress={togglePasswordVisibility} style={styles.eyeIcon}>
              <Icon 
                name={showPassword ? 'visibility-off' : 'visibility'} 
                size={24} 
                color="#333" 
              />
            </TouchableOpacity>
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

      <ScrollView
        contentContainerStyle={styles.dashboardContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchDashboardData}
            colors={['#2196F3']} 
            tintColor="#2196F3" 
          />
        }
      >
        <Text style={styles.dashboardTitle}>Tableau de Bord Financier</Text>

        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Icon name="account-balance" size={30} color="#4CAF50" />
            <Text style={styles.summaryText}>Fonds actuel: {lastFunds.toFixed(2)} Ar</Text>
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
                  {player.totalWins} victoires • {player.totalAmount?.toFixed(2)} Ar
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
                  {player.totalLosses} pertes • {player.totalAmount?.toFixed(2)} Ar
                </Text>
              </View>
              <Icon name="trending-down" size={24} color="#F44336" />
            </View>
          ))}
        </View>

        <PerformanceChart
          winTransactions={topPlayersfetch}
          lossTransactions={worstPlayersfetch}
        />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statistiques global des Joueurs</Text>
          {allPlayers.map((player) => {
            const gains = topPlayers.find(p => p.idplayer === player.idplayer)?.totalAmount || 0;
            const pertes = worstPlayers.find(p => p.idplayer === player.idplayer)?.totalAmount || 0;
            const net = gains - pertes;

            return (
              <View key={player.idplayer} style={styles.playerCard}>
                <View style={styles.playerHeader}>
                  <Text style={styles.playerName}>{player.name}</Text>
                  <View style={[
                    styles.netBadge,
                    net >= 0 ? styles.positiveNet : styles.negativeNet
                  ]}>
                    <Text style={styles.netText}>{net.toFixed(2)} Ar</Text>
                  </View>
                </View>

                <View style={styles.statsContainer}>
                  <View style={styles.statItem}>
                    <Ionicons name="trending-up" size={18} color="#4CAF50" />
                    <Text style={[styles.statValue, styles.gainText]}>
                      {gains.toFixed(2)} Ar
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Ionicons name="trending-down" size={18} color="#F44336" />
                    <Text style={[styles.statValue, styles.lossText]}>
                      {pertes.toFixed(2)} Ar
                    </Text>
                  </View>
                </View>

                <ProgressBar
                  progress={pertes > 0 ? gains / (gains + pertes) : 1}
                  color="#4CAF50"
                  unfilledColor="#F44336"
                  borderWidth={0}
                  height={4}
                  style={styles.progressBar}
                />
              </View>
            );
          })}
        </View>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.actionButtonText}>Retour</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.resetButton} onPress={resetAllData}>
          <Text style={styles.resetText}>Réinitialiser toutes les données</Text>
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
              placeholder="Montant (Ar)"
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



export default DashboardScreen;