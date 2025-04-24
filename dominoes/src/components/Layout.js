import { View, StyleSheet } from 'react-native';
import Sidebar from './Sidebar';
import Footer from './Footer';

export default function Layout({ children, footerProps, sidebarProps }) {
  return (
    <View style={styles.container}>
      <Sidebar {...sidebarProps} />
      
      <View style={styles.content}>
        {children}
      </View>
      
      <Footer {...footerProps} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative'
  },
  content: {
    flex: 1,
    paddingBottom: 70 // Pour éviter le chevauchement avec le footer
  }
});