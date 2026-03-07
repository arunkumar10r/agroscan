import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';

export default function ScanningPulse() {
  const pulse1 = useSharedValue(0);
  const pulse2 = useSharedValue(0);
  const pulse3 = useSharedValue(0);
  const scanLine = useSharedValue(0);

  useEffect(() => {
    const dur = 1800;
    pulse1.value = withRepeat(withTiming(1, { duration: dur, easing: Easing.out(Easing.quad) }), -1, false);
    pulse2.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 300 }),
        withTiming(1, { duration: dur, easing: Easing.out(Easing.quad) })
      ),
      -1,
      false
    );
    pulse3.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 600 }),
        withTiming(1, { duration: dur, easing: Easing.out(Easing.quad) })
      ),
      -1,
      false
    );
    scanLine.value = withRepeat(withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, []);

  const ring1Style = useAnimatedStyle(() => {
    const size = 100 + pulse1.value * 200;
    const opacity = (1 - pulse1.value) * 0.6;
    return { width: size, height: size, borderRadius: size / 2, opacity };
  });

  const ring2Style = useAnimatedStyle(() => {
    const size = 100 + pulse2.value * 200;
    const opacity = (1 - pulse2.value) * 0.6;
    return { width: size, height: size, borderRadius: size / 2, opacity };
  });

  const ring3Style = useAnimatedStyle(() => {
    const size = 100 + pulse3.value * 200;
    const opacity = (1 - pulse3.value) * 0.6;
    return { width: size, height: size, borderRadius: size / 2, opacity };
  });

  const scanLineStyle = useAnimatedStyle(() => ({
    top: `${scanLine.value * 100}%` as any,
    opacity: 0.7,
  }));

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <View style={styles.center}>
        <Animated.View style={[styles.ring, ring1Style]} />
        <Animated.View style={[styles.ring, ring2Style]} />
        <Animated.View style={[styles.ring, ring3Style]} />
      </View>
      <Animated.View style={[styles.scanLine, scanLineStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#2D5A27',
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#2D5A27',
    opacity: 0.7,
  },
});
