import { View, StyleSheet } from 'react-native';
import Sidebar from './Sidebar';
import Footer from './Footer';
import styles from '../../assets/styles/layout';

export default function Layout({ children, footerProps, sidebarProps }) {
  return (
    <View style={styles.container}>
      <Sidebar {...sidebarProps} />
      
      <View style={styles.content}>
        {children}
      </View>
      
      {/* <Footer {...footerProps} /> */}
    </View>
  );
}

