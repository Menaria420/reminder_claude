import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated } from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';

let alertRef = null;

export const showAlert = (title, message, type = 'info', buttons = null) => {
  if (alertRef) {
    alertRef.show(title, message, type, buttons);
  }
};

const CustomAlert = React.forwardRef((props, ref) => {
  const [visible, setVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info'); // 'success', 'error', 'warning', 'info', 'confirm'
  const [buttons, setButtons] = useState(null);
  const scaleAnim = React.useRef(new Animated.Value(0)).current;

  const getAlertStyle = () => {
    const styles = {
      success: {
        iconBg: '#DCFCE7',
        iconColor: '#10B981',
        headerBg: '#ECFDF5',
      },
      error: {
        iconBg: '#FEE2E2',
        iconColor: '#EF4444',
        headerBg: '#FEF2F2',
      },
      warning: {
        iconBg: '#FEF3C7',
        iconColor: '#F59E0B',
        headerBg: '#FFFBEB',
      },
      info: {
        iconBg: '#DBEAFE',
        iconColor: '#3B82F6',
        headerBg: '#EFF6FF',
      },
      confirm: {
        iconBg: '#E0E7FF',
        iconColor: '#6366F1',
        headerBg: '#F0F4FF',
      },
    };
    return styles[type] || styles.info;
  };

  const getIconName = () => {
    const icons = {
      success: 'check-circle',
      error: 'error',
      warning: 'warning',
      info: 'info',
      confirm: 'help',
    };
    return icons[type] || 'info';
  };

  const show = (alertTitle, alertMessage, alertType = 'info', alertButtons = null) => {
    setTitle(alertTitle);
    setMessage(alertMessage);
    setType(alertType);
    setButtons(alertButtons);
    setVisible(true);

    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const hide = () => {
    Animated.timing(scaleAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setVisible(false);
    });
  };

  React.useImperativeHandle(ref, () => {
    const instance = {
      show,
      hide,
    };
    alertRef = instance; // Register to global
    return instance;
  });

  const styles = getAlertStyle();

  const defaultButtons = [
    {
      text: 'OK',
      onPress: hide,
      style: 'primary',
    },
  ];

  const finalButtons = buttons || defaultButtons;

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={hide}>
      <View style={styleSheet.overlay}>
        <Animated.View
          style={[
            styleSheet.alertContainer,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Header */}
          <View
            style={[
              styleSheet.header,
              {
                backgroundColor: styles.headerBg,
              },
            ]}
          >
            <View
              style={[
                styleSheet.iconContainer,
                {
                  backgroundColor: styles.iconBg,
                },
              ]}
            >
              <Icon name={getIconName()} size={32} color={styles.iconColor} />
            </View>
            <Text style={styleSheet.title}>{title}</Text>
          </View>

          {/* Message */}
          <View style={styleSheet.messageContainer}>
            <Text style={styleSheet.message}>{message}</Text>
          </View>

          {/* Buttons */}
          <View style={styleSheet.buttonContainer}>
            {finalButtons.map((button, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styleSheet.button,
                  button.style === 'primary'
                    ? styleSheet.primaryButton
                    : styleSheet.secondaryButton,
                  finalButtons.length > 1 && { flex: 1 },
                ]}
                onPress={() => {
                  button.onPress?.();
                  hide();
                }}
              >
                <Text
                  style={[
                    styleSheet.buttonText,
                    button.style === 'primary'
                      ? styleSheet.primaryButtonText
                      : styleSheet.secondaryButtonText,
                  ]}
                >
                  {button.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
});

CustomAlert.displayName = 'CustomAlert';

export default CustomAlert;

const styleSheet = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertContainer: {
    width: '85%',
    maxWidth: 400,
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  messageContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  message: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    padding: 12,
    gap: 8,
  },
  button: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#667EEA',
  },
  secondaryButton: {
    backgroundColor: '#F3F4F6',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  primaryButtonText: {
    color: 'white',
  },
  secondaryButtonText: {
    color: '#111827',
  },
});
