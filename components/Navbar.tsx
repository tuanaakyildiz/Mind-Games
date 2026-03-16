import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Linking, Modal, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';

const THEME_OPTIONS = [
  { key: 'purple', hex: '#9370DB', label: 'Purple' },
  { key: 'blue', hex: '#6aa3ff', label: 'Blue' },
  { key: 'pink', hex: '#ec4899', label: 'Pink' },
  { key: 'cyan', hex: '#06b6d4', label: 'Cyan' },
  { key: 'gray', hex: '#6b7280', label: 'Gray' },
];

export const NavBar = () => {
  const navigation = useNavigation<any>();
  const { colors, mode, setMode, colorKey, setColorKey } = useTheme();
  
  // State to control the visibility of the Theme Settings Modal
  const [modalVisible, setModalVisible] = useState(false);


  return (
    <SafeAreaView style={{ backgroundColor: colors.fixedBackground }}>
      <View style={[styles.navContainer, { backgroundColor: colors.fixedBackground }]}>
        
        {/* LEFT SIDE: Home & Brand Link */}
        <View style={styles.leftSection}>
          <TouchableOpacity 
            style={[styles.homeButton, { borderColor: colors.text }]}
            onPress={() => navigation.navigate('Home')} 
          >
            <Text style={{ color: colors.text, fontWeight: 'bold' }}>🏠 Home</Text>
          </TouchableOpacity>
          
        </View>

        {/* RIGHT SIDE: Open Modal Button */}
        <TouchableOpacity 
          style={[styles.themeButton, { backgroundColor: colors.selected }]}
          onPress={() => setModalVisible(true)}
        >
          <Text style={{ color: colors.text, fontWeight: 'bold' }}>🎨 Tema</Text>
        </TouchableOpacity>

      </View>

      {/* ✨ THE THEME SETTINGS MODAL ✨ */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        {/* Clicking the dark overlay closes the modal */}
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          
          {/* Prevent clicks inside the menu box from closing the modal */}
          <Pressable style={[styles.modalContent, { backgroundColor: colors.background }]}>
            
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Görünüm Ayarları</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={{ color: colors.text, fontSize: 18, fontWeight: 'bold' }}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* 1. LIGHT / DARK MODE TOGGLE */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Mod</Text>
            <View style={styles.modeContainer}>
              <TouchableOpacity
                style={[
                  styles.modeBox, 
                  { borderColor: colors.text },
                  mode === 'light' && { backgroundColor: colors.selected }
                ]}
                onPress={() => setMode('light')}
              >
                <Text style={{ color: colors.text, fontSize: 16 }}>☀️ Light</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.modeBox, 
                  { borderColor: colors.text },
                  mode === 'dark' && { backgroundColor: colors.selected }
                ]}
                onPress={() => setMode('dark')}
              >
                <Text style={{ color: colors.text, fontSize: 16 }}>🌙 Dark</Text>
              </TouchableOpacity>
            </View>

            {/* 2. COLOR PALETTE SELECTION */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Renk Teması</Text>
            <View style={styles.colorGrid}>
              {THEME_OPTIONS.map((theme) => {
                const isSelected = colorKey === theme.key;
                return (
                  <TouchableOpacity
                    key={theme.key}
                    style={[
                      styles.colorSwatchWrapper,
                      isSelected && { borderColor: colors.text, backgroundColor: colors.fixedBackground }
                    ]}
                    onPress={() => setColorKey(theme.key)}
                  >
                    <View style={[styles.swatch, { backgroundColor: theme.hex }]} />
                    <Text style={{ color: colors.text, fontSize: 12, marginTop: 4 }}>{theme.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  navContainer: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 15, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  leftSection: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  homeButton: { paddingVertical: 6, paddingHorizontal: 12, borderWidth: 1, borderRadius: 8 },
  brandLink: { fontSize: 18, fontWeight: '800', letterSpacing: -0.5 },
  themeButton: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20 },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Dark semi-transparent background
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 20,
    elevation: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 22, fontWeight: 'bold' },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 10, marginTop: 10 },
  
  // Mode Selection Styles
  modeContainer: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  modeBox: {
    flex: 1, paddingVertical: 12, alignItems: 'center',
    borderWidth: 1, borderRadius: 10,
  },
  
  // Color Selection Styles
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  colorSwatchWrapper: {
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    width: '30%', // Fits 3 across nicely
  },
  swatch: {
    width: 36, height: 36, borderRadius: 18,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 1,
  },
});