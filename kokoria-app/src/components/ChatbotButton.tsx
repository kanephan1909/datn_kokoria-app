import React, {useRef, useEffect} from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  Animated,
  View,
  Image,
  PanResponder,
  Dimensions,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ChatbotButtonProps {
  onPress: () => void;
  visible?: boolean;
  badgeCount?: number;
}

const BUTTON_SIZE = 60;
const CHATBOT_POSITION_KEY = '@chatbot_button_position';

const ChatbotButton: React.FC<ChatbotButtonProps> = ({
  onPress,
  visible = true,
  badgeCount = 0,
}) => {
  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Position state (for saving)
  const pan = useRef(new Animated.ValueXY()).current;
  const isDragging = useRef(false);
  const currentPosition = useRef({x: 0, y: 0});

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Chỉ bắt đầu drag nếu di chuyển đủ xa (tránh conflict với tap)
        return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        isDragging.current = false;
        // Lưu vị trí hiện tại
        pan.setOffset({
          x: currentPosition.current.x,
          y: currentPosition.current.y,
        });
        pan.setValue({x: 0, y: 0});
        // Scale down khi bắt đầu drag
        Animated.spring(scaleAnim, {
          toValue: 0.9,
          useNativeDriver: true,
        }).start();
      },
      onPanResponderMove: (_, gestureState) => {
        isDragging.current = true;
        pan.setValue({x: gestureState.dx, y: gestureState.dy});
      },
      onPanResponderRelease: (_, gestureState) => {
        // Tính vị trí mới
        const newX = currentPosition.current.x + gestureState.dx;
        const newY = currentPosition.current.y + gestureState.dy;

        pan.flattenOffset();
        isDragging.current = false;

        // Scale back
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
        }).start();

        // Giới hạn trong màn hình
        const maxX = SCREEN_WIDTH - BUTTON_SIZE - 20;
        const maxY = SCREEN_HEIGHT - BUTTON_SIZE - 100; // Trừ đi safe area và bottom bar
        const minX = 20;
        const minY = Platform.OS === 'ios' ? 50 : 20;

        let finalX = Math.max(minX, Math.min(maxX, newX));
        let finalY = Math.max(minY, Math.min(maxY, newY));

        // Snap to edges (tùy chọn - có thể bỏ nếu muốn tự do hơn)
        const snapThreshold = 50;
        if (finalX < snapThreshold) {
          finalX = minX;
        } else if (finalX > SCREEN_WIDTH - BUTTON_SIZE - snapThreshold) {
          finalX = maxX;
        }

        // Cập nhật vị trí hiện tại
        currentPosition.current = {x: finalX, y: finalY};

        // Animate to final position
        Animated.spring(pan, {
          toValue: {x: finalX, y: finalY},
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }).start();

        // Lưu vị trí
        AsyncStorage.setItem(
          CHATBOT_POSITION_KEY,
          JSON.stringify({x: finalX, y: finalY}),
        );
      },
    }),
  ).current;

  // Load saved position
  useEffect(() => {
    const loadPosition = async () => {
      try {
        const savedPosition = await AsyncStorage.getItem(CHATBOT_POSITION_KEY);
        let initialX: number;
        let initialY: number;

        if (savedPosition) {
          const {x, y} = JSON.parse(savedPosition);
          // Validate position is still within screen bounds
          const maxX = SCREEN_WIDTH - BUTTON_SIZE - 20;
          const maxY = SCREEN_HEIGHT - BUTTON_SIZE - 100;
          const minX = 20;
          const minY = Platform.OS === 'ios' ? 50 : 20;

          initialX = Math.max(minX, Math.min(maxX, x));
          initialY = Math.max(minY, Math.min(maxY, y));
        } else {
          // Default position (bottom right)
          initialX = SCREEN_WIDTH - BUTTON_SIZE - 20;
          initialY = SCREEN_HEIGHT - BUTTON_SIZE - 100;
        }

        // Cập nhật cả pan và currentPosition
        currentPosition.current = {x: initialX, y: initialY};
        pan.setValue({x: initialX, y: initialY});
      } catch (error) {
        console.error('Error loading chatbot position:', error);
        // Default position on error
        const defaultX = SCREEN_WIDTH - BUTTON_SIZE - 20;
        const defaultY = SCREEN_HEIGHT - BUTTON_SIZE - 100;
        currentPosition.current = {x: defaultX, y: defaultY};
        pan.setValue({x: defaultX, y: defaultY});
      }
    };

    loadPosition();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Pulse animation
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
    );

    // Subtle rotation animation
    const rotate = Animated.loop(
      Animated.sequence([
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ]),
    );

    pulse.start();
    rotate.start();

    return () => {
      pulse.stop();
      rotate.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePress = () => {
    // Chỉ trigger onPress nếu không phải đang drag
    if (!isDragging.current) {
      // Scale animation on press
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 300,
          friction: 10,
          useNativeDriver: true,
        }),
      ]).start();

      onPress();
    }
    // Reset dragging flag sau một chút
    setTimeout(() => {
      isDragging.current = false;
    }, 100);
  };

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '5deg'],
  });

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            {translateX: pan.x},
            {translateY: pan.y},
            {scale: Animated.multiply(scaleAnim, pulseAnim)},
            {rotate: rotateInterpolate},
          ],
        },
      ]}
      {...panResponder.panHandlers}>
      {/* Pulse ring effect */}
      <Animated.View
        style={[
          styles.pulseRing,
          {
            transform: [{scale: pulseAnim}],
            opacity: pulseAnim.interpolate({
              inputRange: [1, 1.15],
              outputRange: [0.3, 0],
            }),
          },
        ]}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handlePress}
        activeOpacity={0.9}>
        <View style={styles.gradient}>
          <Image
            source={require('../assets/images/conchatbot.png')}
            style={styles.chatbotImage}
            resizeMode="contain"
          />
        </View>
      </TouchableOpacity>

      {/* Badge notification */}
      {badgeCount > 0 && (
        <View style={styles.badge}>
          <Animated.Text style={styles.badgeText}>
            {badgeCount > 9 ? '9+' : badgeCount}
          </Animated.Text>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 1000,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F97316',
  },
  button: {
    width: 60,
    height: 60,
    borderRadius: 40,
    overflow: 'hidden',
    shadowColor: '#F97316',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  gradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F97316',
  },
  chatbotImage: {
    width: 60,
    height: 60,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
});

export default ChatbotButton;
