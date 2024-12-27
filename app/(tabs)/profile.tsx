import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  TextInput,
  Modal,
  Button,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from '@/hooks/useColorScheme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { getDoc, doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/firebaseConfig';

export default function Profile() {
  const { t, i18n } = useTranslation();
  const colorScheme = useColorScheme();
  const currentColors = Colors[colorScheme || 'light'];
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState('');
  const [username, setUsername] = useState('');
  const [profilePicture, setProfilePicture] = useState('null');
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [menuModalVisible, setMenuModalVisible] = useState(false);

  // Récupère les données de l'utilisateur depuis Firestore
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser?.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUsername(data.username || 'Unknown User');
          setProfilePicture(data.avatar || 'https://via.placeholder.com/150');
          setDescription(data.description || "Description du profil");
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
    fetchUserData();
  }, [auth.currentUser]);

  // Changement de langue
  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    setLanguageModalVisible(false);
  };

  // Fonction pour enregistrer la description modifiée dans Firestore
  const saveDescriptionToFirestore = async () => {
    try {
      const userRef = doc(db, 'users', auth.currentUser?.uid);
      await updateDoc(userRef, {
        description: description,
      });
    } catch (error) {
      console.error('Error updating description:', error);
      Alert.alert(t('profile.error'), t('profile.updateError'));
    }
  };

  // Basculer entre mode édition/lecture et enregistrer si en mode édition
  const handleEdit = () => {
    if (isEditing) {
      saveDescriptionToFirestore(); // Enregistrer dans Firestore
    }
    setIsEditing(!isEditing);
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: currentColors.background },
      ]}
    >
      {/* Photo de profil */}
      <Image
        source={{ uri: profilePicture }}
        style={styles.profilePicture}
      />

      {/* Nom de l'utilisateur */}
      <Text style={[styles.username, { color: currentColors.text }]}>
        {username}
      </Text>

      {/* Description */}
      <View style={styles.descriptionContainer}>
        <TextInput
          style={[styles.descriptionText, { color: currentColors.text }]}
          value={description}
          editable={isEditing}
          onChangeText={setDescription}
        />
        <TouchableOpacity onPress={handleEdit}>
          <MaterialCommunityIcons
            name={isEditing ? 'check' : 'pencil'}
            size={24}
            color={currentColors.text}
          />
        </TouchableOpacity>
      </View>

      {/* Boutons */}
      <View style={styles.buttonsContainer}>
        {/* Bouton Changer de langue */}
        <TouchableOpacity
          style={[styles.button, { backgroundColor: currentColors.tabBackground }]}
          onPress={() => setLanguageModalVisible(true)}
        >
          <Text style={[styles.buttonText, { color: currentColors.text }]}>
            {t('profile.langue')}
          </Text>
        </TouchableOpacity>

        {/* Bouton Informations */}
        <TouchableOpacity
          style={[styles.button, { backgroundColor: currentColors.tabBackground }]}
          onPress={() => setMenuModalVisible(true)}
        >
          <Text style={[styles.buttonText, { color: currentColors.text }]}>
            {t('profile.info')}
          </Text>
        </TouchableOpacity>

        {/* Bouton Paramètres */}
        <TouchableOpacity
          style={[styles.button, { backgroundColor: currentColors.tabBackground }]}
          onPress={() => setMenuModalVisible(true)}
        >
          <Text style={[styles.buttonText, { color: currentColors.text }]}>
            {t('profile.settings')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Modal pour Changer de langue */}
      <Modal visible={languageModalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: currentColors.background }]}>
            <Text style={[styles.modalTitle, { color: currentColors.text }]}>
              {t('profile.chooseLanguage')}
            </Text>
            <Button title="English" onPress={() => changeLanguage('en')} />
            <Button title="Français" onPress={() => changeLanguage('fr')} />
            <Button
              title={t('common.close')}
              color="red"
              onPress={() => setLanguageModalVisible(false)}
            />
          </View>
        </View>
      </Modal>

      {/* Modal pour Informations/Paramètres */}
      <Modal visible={menuModalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: currentColors.background }]}>
            <Text style={[styles.modalTitle, { color: currentColors.text }]}>
              {t('profile.menu')}
            </Text>
            {/* Ajoutez des options ici */}
            <Button
              title={t('common.close')}
              color="red"
              onPress={() => setMenuModalVisible(false)}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 10,
  },
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginVertical: 10,
  },
  username: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  descriptionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  descriptionText: {
    fontSize: 16,
    marginRight: 10,
  },
  buttonsContainer: {
    width: '100%',
    marginTop: 'auto',
    marginBottom: 20,
  },
  button: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    padding: 20,
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
});
