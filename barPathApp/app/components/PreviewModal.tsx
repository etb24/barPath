import React from 'react';
import { Modal, View, TouchableOpacity, ActivityIndicator, StyleSheet, SafeAreaView, } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import Typography from './ui/Typography';
import { colors, spacing, radii } from '../styles/theme';

export default function libraryModal({
  visible,
  item,
  busy,
  onClose,
  onSave,
  onDelete,
  onRename,
}: {
  visible: boolean;
  item: { url: string; liftName: string } | null;
  busy: boolean;
  onClose: () => void;
  onSave: () => void;
  onDelete: () => void;
  onRename: () => void;
}) {
  // EARLY RETURN: nothing will render (no stray boolean) unless both are provided
  if (!visible || !item) {
    return null;
  }

  return (
    <Modal
      visible = {true}
      animationType = "slide"
      presentationStyle = "overFullScreen"
      transparent
    >
      <View style = {styles.overlay}>
        <SafeAreaView style = {styles.container}>

          <Video
            source = {{ uri: item.url }}
            style = {styles.video}
            useNativeControls
            resizeMode = {ResizeMode.CONTAIN}
            shouldPlay
            isLooping
          />

          <View style={styles.header}>
            <TouchableOpacity onPress={onRename}>
              <Typography variant="subtitle" weight="bold" style={styles.title}>
                {item.liftName}
              </Typography>
            </TouchableOpacity>
          </View>

          <View style = {styles.controls}>
            <TouchableOpacity
              style = {styles.controlButton}
              onPress = {onSave}
              disabled = {busy}
            >
              {busy
                ? <ActivityIndicator color={colors.textPrimary} />
                : <Ionicons name = "download" size = {24} color={colors.textPrimary} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, styles.deleteButton]}
              onPress = {onDelete}
              disabled = {busy}
            >
              <Ionicons name = "trash" size={24} color={colors.textPrimary} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.controlButton, styles.closeButton]}
              onPress = {onClose}
              disabled = {busy}
            >
              <Ionicons name = "close" size={24} color={colors.background} />
            </TouchableOpacity>
          
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    marginBottom: spacing.sm,
    alignItems: 'center'
  },
  title: {
    color: colors.textPrimary,
  },
  video: {
    flex: 1,
    marginHorizontal: spacing.lg,
    borderRadius: radii.lg,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.lg,
  },
  controlButton: {
    backgroundColor: colors.accent,
    padding: spacing.md,
    borderRadius: radii.md,
  },
  deleteButton: {
    backgroundColor: colors.destructive,
  },
  closeButton: {
    backgroundColor: colors.textPrimary,
  }
});
