import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { borderRadius, spacing, typography } from "../../constants/theme";
import { useTheme } from "../../hooks";
import { Text } from "./Text";

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxHeight?: number | `${number}%`;
  showCloseButton?: boolean;
  title?: string;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  visible,
  onClose,
  children,
  maxHeight = "90%",
  showCloseButton = true,
  title,
}) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();

  const slideAnim = useRef(new Animated.Value(300)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  // Track keyboard height so sheet shrinks when keyboard pushes it up
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Convert maxHeight to pixels, capped so sheet never extends into status bar / notch
  // When keyboard is open, KAV pushes the sheet up — reduce height to compensate
  const sheetHeight = useMemo(() => {
    let h: number;
    if (typeof maxHeight === "number") {
      h = maxHeight;
    } else if (typeof maxHeight === "string" && maxHeight.endsWith("%")) {
      h = (parseFloat(maxHeight) / 100) * windowHeight;
    } else {
      h = windowHeight * 0.9;
    }
    const maxAllowedHeight = windowHeight - insets.top - keyboardHeight;
    return Math.min(h, maxAllowedHeight);
  }, [maxHeight, windowHeight, insets.top, keyboardHeight]);

  useEffect(() => {
    if (visible) {
      slideAnim.setValue(sheetHeight);
      backdropAnim.setValue(0);

      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, sheetHeight]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: sheetHeight,
        duration: 250,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <Animated.View
        style={[
          styles.backdrop,
          {
            opacity: backdropAnim,
            backgroundColor: isDark
              ? "rgba(0,0,0,0.7)"
              : "rgba(0,0,0,0.5)",
          },
        ]}
      >
        <Pressable style={styles.backdropTouch} onPress={handleClose} />
      </Animated.View>

      {/* Sheet */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardView}
        pointerEvents="box-none"
      >
        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.background,
              paddingBottom: keyboardHeight > 0 ? spacing[2] : insets.bottom + spacing[4],
              height: sheetHeight,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Handle bar */}
          <View style={styles.handleContainer}>
            <View
              style={[styles.handle, { backgroundColor: colors.textTertiary }]}
            />
          </View>

          {/* Close button */}
          {showCloseButton && (
            <TouchableOpacity
              style={[
                styles.closeButton,
                { backgroundColor: colors.surfaceSecondary },
              ]}
              onPress={handleClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}

          {/* Title */}
          {title && (
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          )}

          {/* Content */}
          <View style={styles.content}>{children}</View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  backdropTouch: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: borderRadius["2xl"],
    borderTopRightRadius: borderRadius["2xl"],
    paddingHorizontal: spacing[5],
    paddingTop: 0,
  },
  handleContainer: {
    alignItems: "center",
    paddingTop: spacing[3],
    paddingBottom: spacing[1],
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  closeButton: {
    position: "absolute",
    top: spacing[4],
    right: spacing[4],
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: "600",
    textAlign: "center",
    marginTop: spacing[2],
    marginBottom: spacing[3],
  },
  content: {
    flex: 1,
  },
});

export default BottomSheet;
