import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';

export default function Footer({ activeTab, onTabChange }) {
  const tabs = ['Accueil', 'Recherche', 'Profil'];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => (
        <TouchableOpacity 
          key={tab} 
          onPress={() => onTabChange(tab)}
          style={[
            styles.tab,
            activeTab === tab && styles.activeTab
          ]}
        >
          <Text style={styles.tabText}>{tab}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: '#f8f9fa',
    ...Platform.select({
      web: {
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        boxShadow: '0 -2px 5px rgba(0,0,0,0.1)'
      },
      default: {
        borderTopWidth: 1,
        borderTopColor: '#ddd'
      }
    })
  },
  tab: {
    padding: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    color: '#333',
  }
});