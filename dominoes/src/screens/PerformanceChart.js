import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

const PerformanceChart = ({ 
  winTransactions = [], 
  lossTransactions = [] 
}) => {
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    end: new Date()
  });
  const [showDatePicker, setShowDatePicker] = useState(null);
  const [filteredPlayers, setFilteredPlayers] = useState([]);


  const aggregatePlayerData = (wins, losses) => {
    const playersMap = {};


    wins.forEach(win => {
      if (!playersMap[win.idplayer]) {
        playersMap[win.idplayer] = {
          idplayer: win.idplayer,
          name: win.name || 'Joueur inconnu',
          gains: 0,
          pertes: 0,
          winDetails: [],
          lossDetails: []
        };
      }
      playersMap[win.idplayer].gains += win.amount;
      playersMap[win.idplayer].winDetails.push({
        date: win.date,
        amount: win.amount
      });
    });


    losses.forEach(loss => {
      if (!playersMap[loss.idplayer]) {
        playersMap[loss.idplayer] = {
          idplayer: loss.idplayer,
          name: loss.name || 'Joueur inconnu',
          gains: 0,
          pertes: 0,
          winDetails: [],
          lossDetails: []
        };
      }
      playersMap[loss.idplayer].pertes += loss.amount;
      playersMap[loss.idplayer].lossDetails.push({
        date: loss.date,
        amount: loss.amount
      });
    });

    return Object.values(playersMap).sort((a, b) => (b.gains - b.pertes) - (a.gains - a.pertes));
  };

  useEffect(() => {
    const filteredWins = winTransactions.filter(t => 
      new Date(t.date) >= dateRange.start && 
      new Date(t.date) <= dateRange.end
    );
    
    const filteredLosses = lossTransactions.filter(t => 
      new Date(t.date) >= dateRange.start && 
      new Date(t.date) <= dateRange.end
    );

    const aggregatedPlayers = aggregatePlayerData(filteredWins, filteredLosses);
    setFilteredPlayers(aggregatedPlayers);
  }, [winTransactions, lossTransactions, dateRange]);

  const handleDateChange = (event, selectedDate, type) => {
    setShowDatePicker(null);
    if (selectedDate) {
      setDateRange(prev => ({
        ...prev,
        [type]: selectedDate
      }));
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📈 Filtrage</Text>
        
        <View style={styles.dateFilterContainer}>
          <TouchableOpacity 
            style={styles.dateButton}
            onPress={() => setShowDatePicker('start')}
          >
            <Ionicons name="calendar" size={16} color="#555" />
            <Text style={styles.dateText}>
              {dateRange.start.toLocaleDateString()}
            </Text>
          </TouchableOpacity>
          
          <Text style={styles.dateSeparator}>à</Text>
          
          <TouchableOpacity 
            style={styles.dateButton}
            onPress={() => setShowDatePicker('end')}
          >
            <Ionicons name="calendar" size={16} color="#555" />
            <Text style={styles.dateText}>
              {dateRange.end.toLocaleDateString()}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView>
        {filteredPlayers.map((player) => (
          <View key={player.idplayer} style={styles.playerCard}>
            <View style={styles.playerHeader}>
              <Text style={styles.playerName}>{player.name}</Text>
              <View style={[
                styles.netBadge, 
                player.gains - player.pertes >= 0 ? styles.positiveNet : styles.negativeNet
              ]}>
                <Text style={styles.netText}>
                  {(player.gains - player.pertes).toFixed(2)} Ar
                </Text>
              </View>
            </View>
            
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Ionicons name="trending-up" size={18} color="#4CAF50" />
                <Text style={styles.statValue}>{player.gains.toFixed(2)} Ar</Text>
                <Text style={styles.statSubtext}>
                  ({player.winDetails.length} transactions)
                </Text>
              </View>
              
              <View style={styles.statItem}>
                <Ionicons name="trending-down" size={18} color="#F44336" />
                <Text style={styles.statValue}>{player.pertes.toFixed(2)} Ar</Text>
                <Text style={styles.statSubtext}>
                  ({player.lossDetails.length} transactions)
                </Text>
              </View>
            </View>
            
            <View style={styles.progressContainer}>
              <View style={[
                styles.progressBar,
                { 
                  width: `${player.gains + player.pertes > 0 
                    ? (player.gains / (player.gains + player.pertes)) * 100 
                    : 0}%` 
                }
              ]} />
            </View>

            <View style={styles.transactionsContainer}>
              <Text style={styles.transactionsTitle}>Détails des gains:</Text>
              {player.winDetails.map((detail, index) => (
                <Text key={`win_${index}`} style={styles.transactionDetail}>
                  {new Date(detail.date).toLocaleDateString()}: +{detail.amount.toFixed(2)} Ar
                </Text>
              ))}
              
              <Text style={styles.transactionsTitle}>Détails des pertes:</Text>
              {player.lossDetails.map((detail, index) => (
                <Text key={`loss_${index}`} style={styles.transactionDetail}>
                  {new Date(detail.date).toLocaleDateString()}: -{detail.amount.toFixed(2)} Ar
                </Text>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      {showDatePicker && (
        <DateTimePicker
          value={dateRange[showDatePicker]}
          mode="date"
          display="default"
          onChange={(e, d) => handleDateChange(e, d, showDatePicker)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  dateFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  dateText: {
    fontSize: 14,
    color: '#555',
  },
  dateSeparator: {
    color: '#7f8c8d',
    fontSize: 14,
  },
  playerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  playerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#34495e',
    flex: 1,
    marginRight: 8,
  },
  netBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  positiveNet: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  negativeNet: {
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
  },
  netText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
  },
  statSubtext: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 2,
  },
  progressContainer: {
    height: 6,
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  transactionsContainer: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 8,
  },
  transactionsTitle: {
    fontWeight: '600',
    fontSize: 12,
    color: '#555',
    marginBottom: 4,
  },
  transactionDetail: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
});

export default PerformanceChart;