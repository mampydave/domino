import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import styles from '../../assets/styles/performanceChart';

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



export default PerformanceChart;