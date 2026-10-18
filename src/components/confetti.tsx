import { useEffect, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

const COLORS = ['#FF385C', '#D70466', '#FFB400', '#7B1FA2', '#00A699', '#FC642D', '#E07AB4'];

type Piece = { x: number; drift: number; size: number; color: string; delay: number; duration: number; spin: number; round: boolean };

function makePieces(count: number, width: number): Piece[] {
  return Array.from({ length: count }, () => ({
    x: Math.random() * width,
    drift: (Math.random() - 0.5) * 160,
    size: 6 + Math.random() * 8,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    delay: Math.random() * 350,
    duration: 1800 + Math.random() * 1400,
    spin: (Math.random() - 0.5) * 1080,
    round: Math.random() < 0.3,
  }));
}

/** A one-shot confetti burst falling from the top of its parent. Change `key` to replay. */
export function Confetti({ count = 70 }: { count?: number }) {
  const { width, height } = useWindowDimensions();
  const [pieces] = useState(() => makePieces(count, width));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {pieces.map((piece, i) => (
        <ConfettiPiece key={i} piece={piece} fall={height + 40} />
      ))}
    </View>
  );
}

function ConfettiPiece({ piece, fall }: { piece: Piece; fall: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.set(withDelay(piece.delay, withTiming(1, { duration: piece.duration, easing: Easing.out(Easing.quad) })));
  }, [piece, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: progress.value > 0.85 ? (1 - progress.value) / 0.15 : 1,
    transform: [
      { translateX: piece.drift * progress.value },
      { translateY: -40 + fall * progress.value },
      { rotate: `${piece.spin * progress.value}deg` },
      { rotateX: `${piece.spin * 0.6 * progress.value}deg` },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.piece,
        {
          left: piece.x,
          width: piece.size,
          height: piece.round ? piece.size : piece.size * 0.45,
          borderRadius: piece.round ? piece.size : 1.5,
          backgroundColor: piece.color,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  piece: {
    position: 'absolute',
    top: 0,
  },
});
