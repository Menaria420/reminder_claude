import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Dimensions } from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

let toastRef = null;

export const showToast = (message, type = 'info', duration = 3000) => {
  if (toastRef) {
    toastRef.show(message, type, duration);
  }
};

const Toast = React.forwardRef((props, ref) => {
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info'); // 'success', 'error', 'warning', 'info'
  const [isVisible, setIsVisible] = useState(false);
  const slideAnim = new Animated.Value(-100);
  let timeoutId = null;

  const getToastStyle = () => {
    const colors = {
      success: {
        background: '#DCFCE7',
        text: '#166534',
        icon: '#10B981',
        border: '#BBEF63',
      },
      error: {
        background: '#FEE2E2',
        text: '#991B1B',
        icon: '#EF4444',
        border: '#FECACA',
      },
      warning: {
        background: '#FEF3C7',
        text: '#92400E',
        icon: '#F59E0B',
        border: '#FCD34D',
      },
      info: {
        background: '#DBEAFE',
        text: '#0C2340',
        icon: '#3B82F6',
        border: '#BFDBFE',
      },
    };
    return colors[type] || colors.info;
  };

  const getIconName = () => {
    const icons = {
      success: 'check-circle',
      error: 'error',
      warning: 'warning',
      info: 'info',
    };
    return icons[type] || 'info';
  };

  const show = (msg, toastType = 'info', duration = 3000) => {
    setMessage(msg);
    setType(toastType);
    setIsVisible(true);

    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();

    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      hide();
    }, duration);
  };

  const hide = () => {
    Animated.timing(slideAnim, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setIsVisible(false);
      setMessage('');
    });
  };

  React.useImperativeHandle(ref, () => {
    const instance = {
      show,
      hide,
    };
    toastRef = instance; // Register to global
    return instance;
  });

  if (!isVisible) return null;

  const colors = getToastStyle();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View
        style={[
          styles.toast,
          {
            backgroundColor: colors.background,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.contentWrapper}>
          <Icon name={getIconName()} size={22} color={colors.icon} style={styles.icon} />
          <Text
            style={[
              styles.message,
              {
                color: colors.text,
              },
            ]}
            numberOfLines={2}
          >
            {message}
          </Text>
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={hide}>
          <Icon name="close" size={18} color={colors.text} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
});

Toast.displayName = 'Toast';

export default Toast;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  contentWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  icon: {
    marginRight: 10,
  },
  message: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  closeButton: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
