import React from 'react';
import { Modal, View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, SafeAreaView, } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';

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
          />

          <View style = {styles.header}>
            <TouchableOpacity onPress={onRename}>
              <Text style = {styles.title}>{item.liftName}</Text>
              <View style = {{ width: 28 }} />
            </TouchableOpacity>
          </View>

          <View style = {styles.controls}>
            <TouchableOpacity
              style = {styles.controlButton}
              onPress = {onSave}
              disabled = {busy}
            >
              {busy
                ? <ActivityIndicator color="#fff" />
                : <Ionicons name = "download" size = {24} color="#fff" />}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, styles.deleteButton]}
              onPress = {onDelete}
              disabled = {busy}
            >
              <Ionicons name = "trash" size={24} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.controlButton, styles.closeButton]}
              onPress = {onClose}
              disabled = {busy}
            >
              <Ionicons name = "close" size={24} color="#black" />
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
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 6,
    alignItems: 'center'
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  video: {
    flex: 1,
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  controlButton: {
    backgroundColor: '#C2FD4E',
    padding: 14,
    marginHorizontal: 20,
    borderRadius: 8,
  },
  deleteButton: {
    backgroundColor: '#8A5BFE', // #ff4444 8A5BFE
  },
  closeButton: {
    backgroundColor: 'white',
  }
});
