import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';

const LoadingAnimation = () => {
  const [dots] = React.useState([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0)
  ]);

  React.useEffect(() => {
    const animations = dots.map((dot, index) => {
      return Animated.sequence([
        Animated.delay(index * 200),
        Animated.loop(
          Animated.sequence([
            // Drop down
            Animated.timing(dot, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
            // Bounce up slightly
            Animated.timing(dot, {
              toValue: 0.8,
              duration: 200,
              useNativeDriver: true,
            }),
            // Settle
            Animated.timing(dot, {
              toValue: 0.9,
              duration: 100,
              useNativeDriver: true,
            }),
            // Hold position
            Animated.delay(300),
            // Reset position
            Animated.timing(dot, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
            // Wait before next drop
            Animated.delay(1200),
          ])
        ),
      ]);
    });

    Animated.parallel(animations).start();
  }, []);

  return (
    <View style={styles.container}>
      {dots.map((dot, index) => (
        <Animated.View
          key={index}
          style={[
            styles.dot,
            {
              transform: [{
                translateY: dot.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-100, 0], // Drop from above
                }),
              }, {
                scaleX: dot.interpolate({
                  inputRange: [0, 0.8, 0.9, 1],
                  outputRange: [1, 1.2, 1.1, 1],
                }),
              }, {
                scaleY: dot.interpolate({
                  inputRange: [0, 0.8, 0.9, 1],
                  outputRange: [1, 0.8, 0.9, 1],
                }),
              }],
              backgroundColor: [
                '#4CAF50', // Primary green
                '#66BB6A',
                '#81C784',
                '#A5D6A7'
              ][index],
              opacity: dot.interpolate({
                inputRange: [0, 0.8, 0.9, 1],
                outputRange: [1, 1, 1, 1], // Stay fully opaque
              }),
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  dot: {
    width: 24, // Larger dots
    height: 24,
    borderRadius: 12,
    marginHorizontal: 8,
  },
});

export default LoadingAnimation; 