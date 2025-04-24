import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, TouchableWithoutFeedback, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';

export default function GreatingScreen({ navigation }) {
  const animationRef = useRef(null);
  
  // États pour l'animation
  const [animation, setAnimation] = useState(require('../../assets/anims/boy-animation.json'));
  const [speed, setSpeed] = useState(1);
  
  // Configuration des actions possibles
  const animationActions = [
    {
      name: 'normal',
      animation: require('../../assets/anims/boy-animation.json'),
      speed: 1
    },
    {
      name: 'ralenti', 
      animation: require('../../assets/anims/boy-animation.json'),
      speed: 0.2
    },
    {
      name: 'course',
      animation: require('../../assets/anims/boy-animation.json'),
      speed: 2.5
    }
    // {
    //   name: 'saut',
    //   animation: require('../../assets/anims/boy-jump.json'),
    //   speed: 1.8
    // }
  ];

  // Gestion du clic aléatoire
  const handleRandomAction = () => {
    const randomIndex = Math.floor(Math.random() * animationActions.length);
    const randomAction = animationActions[randomIndex];
    
    setAnimation(randomAction.animation);
    setSpeed(randomAction.speed);
    animationRef.current?.play();
  };

  return (
    <TouchableWithoutFeedback onPress={handleRandomAction}>
      <View style={styles.container}>
        {/* Animation Lottie */}
        <LottieView
          ref={animationRef}
          source={animation}
          autoPlay
          loop
          speed={speed}
          style={styles.animation}
        />

        <Text style={styles.title}>DOMINO ADVENTURE</Text>

        <TouchableOpacity 
          style={styles.button} 
          onPress={() => navigation.navigate('PlayerSelectionScreen')}
        >
          <Text style={styles.buttonText}>COMMENCER</Text>
        </TouchableOpacity>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  animation: {
    width: 250,
    height: 250,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginVertical: 20,
    color: '#333',
  },
  button: {
    backgroundColor: '#000',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});