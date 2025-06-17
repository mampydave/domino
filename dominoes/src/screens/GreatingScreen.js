import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, TouchableWithoutFeedback, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';
import styles from '../../assets/styles/greating';

export default function GreatingScreen({ navigation }) {
  const animationRef = useRef(null);
  

  const [animation, setAnimation] = useState(require('../../assets/anims/boy-animation.json'));
  const [speed, setSpeed] = useState(1);
  

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

