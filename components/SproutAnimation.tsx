import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

interface SproutAnimationProps {
  size?: number;
}

export default function SproutAnimation({ size = 80 }: SproutAnimationProps) {
  const stemScale = useSharedValue(0);
  const leafLeftScale = useSharedValue(0);
  const leafRightScale = useSharedValue(0);
  const stemOpacity = useSharedValue(0);
  const leafLeftOpacity = useSharedValue(0);
  const leafRightOpacity = useSharedValue(0);

  const easing = Easing.out(Easing.cubic);

  useEffect(() => {
    // startAnimation must be declared as a regular function (not arrow)
    // so that runOnJS can safely marshal it back to the JS thread
    // from within the withTiming worklet callback.
    function startAnimation() {
      // Reset all values before each cycle
      stemScale.value = 0;
      leafLeftScale.value = 0;
      leafRightScale.value = 0;
      stemOpacity.value = 0;
      leafLeftOpacity.value = 0;
      leafRightOpacity.value = 0;

      stemOpacity.value = withTiming(1, { duration: 200 });
      stemScale.value = withTiming(1, { duration: 600, easing });

      leafLeftOpacity.value = withDelay(500, withTiming(1, { duration: 200 }));
      leafLeftScale.value = withDelay(500, withTiming(1, { duration: 400, easing }));

      leafRightOpacity.value = withDelay(700, withTiming(1, { duration: 200 }));
      leafRightScale.value = withDelay(700, withTiming(1, { duration: 400, easing }));

      // Fade out — when done, restart the cycle via runOnJS so it runs
      // on the JS thread (the withTiming callback is a worklet and cannot
      // directly call a plain JS closure).
      stemOpacity.value = withDelay(
        1600,
        withTiming(0, { duration: 400 }, (finished) => {
          if (finished) runOnJS(startAnimation)();
        })
      );
      leafLeftOpacity.value = withDelay(1600, withTiming(0, { duration: 400 }));
      leafRightOpacity.value = withDelay(1600, withTiming(0, { duration: 400 }));
    }

    startAnimation();
  }, []);

  const stemStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: stemScale.value }],
    opacity: stemOpacity.value,
  }));

  const leafLeftStyle = useAnimatedStyle(() => ({
    transform: [{ scale: leafLeftScale.value }],
    opacity: leafLeftOpacity.value,
  }));

  const leafRightStyle = useAnimatedStyle(() => ({
    transform: [{ scale: leafRightScale.value }],
    opacity: leafRightOpacity.value,
  }));

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Ground line */}
      <View style={[styles.ground, { width: size * 0.7 }]} />
      {/* Stem */}
      <Animated.View
        style={[
          styles.stem,
          stemStyle,
          { height: size * 0.45, bottom: size * 0.08 },
        ]}
      />
      {/* Left leaf */}
      <Animated.View
        style={[
          styles.leaf,
          styles.leafLeft,
          leafLeftStyle,
          { bottom: size * 0.35, left: size * 0.12 },
        ]}
      />
      {/* Right leaf */}
      <Animated.View
        style={[
          styles.leaf,
          styles.leafRight,
          leafRightStyle,
          { bottom: size * 0.42, right: size * 0.12 },
        ]}
      />
      {/* Top bud */}
      <Animated.View
        style={[
          styles.bud,
          stemStyle,
          { bottom: size * 0.5, width: size * 0.16, height: size * 0.18 },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  ground: {
    height: 3,
    backgroundColor: '#88A070',
    borderRadius: 2,
    position: 'absolute',
    bottom: 0,
  },
  stem: {
    width: 4,
    backgroundColor: '#2D5A27',
    borderRadius: 2,
    position: 'absolute',
    transformOrigin: 'bottom',
  },
  leaf: {
    width: 22,
    height: 16,
    backgroundColor: '#2D5A27',
    borderRadius: 12,
    position: 'absolute',
  },
  leafLeft: {
    transform: [{ rotate: '-30deg' }],
  },
  leafRight: {
    transform: [{ rotate: '30deg' }],
  },
  bud: {
    backgroundColor: '#4CAF50',
    borderRadius: 20,
    position: 'absolute',
    alignSelf: 'center',
  },
});
