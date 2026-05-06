import {
  Text,
  View,
  Pressable,
  Modal,
  StyleSheet,
  TextInput,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useState } from "react";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useContacts, Contact } from "@/lib/contacts-context";
import { useColors } from "@/hooks/use-colors";

const MAX_CONTACTS = 3;

interface ContactFormData {
  name: string;
  phone: string;
}

export default function ContactsScreen() {
  const colors = useColors();
  const { contacts, addContact, updateContact, removeContact } = useContacts();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [form, setForm] = useState<ContactFormData>({ name: "", phone: "" });
  const [errors, setErrors] = useState<Partial<ContactFormData>>({});

  const openAddModal = () => {
    setEditingContact(null);
    setForm({ name: "", phone: "" });
    setErrors({});
    setModalVisible(true);
  };

  const openEditModal = (contact: Contact) => {
    setEditingContact(contact);
    setForm({ name: contact.name, phone: contact.phone });
    setErrors({});
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingContact(null);
    setForm({ name: "", phone: "" });
    setErrors({});
  };

  const validate = (): boolean => {
    const newErrors: Partial<ContactFormData> = {};
    if (!form.name.trim()) {
      newErrors.name = "O nome é obrigatório";
    }
    const digits = form.phone.replace(/\D/g, "");
    if (!form.phone.trim()) {
      newErrors.phone = "O telefone é obrigatório";
    } else if (digits.length < 8) {
      newErrors.phone = "Telefone inválido (mínimo 8 dígitos)";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    try {
      if (editingContact) {
        await updateContact(editingContact.id, { name: form.name.trim(), phone: form.phone.trim() });
      } else {
        await addContact({ name: form.name.trim(), phone: form.phone.trim() });
      }
      if (Platform.OS !== "web") {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      closeModal();
    } catch (e) {
      console.error("Erro ao salvar contato:", e);
    }
  };

  const handleRemove = (contact: Contact) => {
    if (Platform.OS === "web") {
      const ok = globalThis.confirm?.(
        `Deseja remover "${contact.name}" dos seus contatos de confiança?`,
      );
      if (!ok) return;
      removeContact(contact.id).catch((e) => {
        console.error("Erro ao remover contato:", e);
      });
      return;
    }

    Alert.alert(
      "Remover contato",
      `Deseja remover "${contact.name}" dos seus contatos de confiança?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: async () => {
            try {
              await removeContact(contact.id);
            } catch (e) {
              console.error("Erro ao remover contato:", e);
            }
            if (Platform.OS !== "web") {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
          },
        },
      ]
    );
  };

  const canAddMore = contacts.length < MAX_CONTACTS;

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* Header */}
      <View style={styles.header}>
        <IconSymbol name="person.2.fill" size={26} color={colors.primary} />
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          Contatos de Confiança
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Info card */}
        <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <IconSymbol name="shield.fill" size={18} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.muted }]}>
            Cadastre até {MAX_CONTACTS} pessoas de confiança. Elas receberão uma mensagem de SOS quando você acionar o botão de emergência.
          </Text>
        </View>

        {/* Slots counter */}
        <View style={styles.slotsRow}>
          <Text style={[styles.slotsLabel, { color: colors.muted }]}>
            {contacts.length}/{MAX_CONTACTS} contatos cadastrados
          </Text>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={[
                styles.slotDot,
                {
                  backgroundColor:
                    i < contacts.length ? colors.primary : colors.border,
                },
              ]}
            />
          ))}
        </View>

        {/* Contact cards */}
        {contacts.length === 0 ? (
          <View style={[styles.emptyState, { borderColor: colors.border }]}>
            <IconSymbol name="person.crop.circle.fill" size={48} color={colors.border} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              Nenhum contato ainda
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
              Adicione contatos de confiança para que o SOS funcione corretamente.
            </Text>
          </View>
        ) : (
          <View style={styles.contactsList}>
            {contacts.map((contact, index) => (
              <View
                key={contact.id}
                style={[styles.contactCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <View style={[styles.contactAvatar, { backgroundColor: colors.primary + "22" }]}>
                  <Text style={[styles.contactAvatarText, { color: colors.primary }]}>
                    {contact.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.contactInfo}>
                  <Text style={[styles.contactCardName, { color: colors.foreground }]}>
                    {contact.name}
                  </Text>
                  <View style={styles.phoneRow}>
                    <IconSymbol name="phone.fill" size={13} color={colors.muted} />
                    <Text style={[styles.contactCardPhone, { color: colors.muted }]}>
                      {contact.phone}
                    </Text>
                  </View>
                </View>
                <View style={styles.contactActions}>
                  <Pressable
                    onPress={() => openEditModal(contact)}
                    style={({ pressed }) => [
                      styles.actionBtn,
                      { backgroundColor: colors.primary + "18" },
                      pressed && { opacity: 0.6 },
                    ]}
                  >
                    <IconSymbol name="pencil" size={16} color={colors.primary} />
                  </Pressable>
                  <Pressable
                    onPress={() => handleRemove(contact)}
                    style={({ pressed }) => [
                      styles.actionBtn,
                      { backgroundColor: colors.error + "18" },
                      pressed && { opacity: 0.6 },
                    ]}
                  >
                    <IconSymbol name="trash.fill" size={16} color={colors.error} />
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Add button */}
        <Pressable
          onPress={canAddMore ? openAddModal : undefined}
          style={({ pressed }) => [
            styles.addButton,
            {
              backgroundColor: canAddMore ? colors.primary : colors.border,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <IconSymbol name="plus.circle.fill" size={22} color="#FFFFFF" />
          <Text style={styles.addButtonText}>
            {canAddMore ? "Adicionar Contato" : "Limite de 3 contatos atingido"}
          </Text>
        </Pressable>
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <Pressable style={styles.modalBackdrop} onPress={closeModal} />
          <View style={[styles.modalSheet, { backgroundColor: colors.background, borderColor: colors.border }]}>
            {/* Handle */}
            <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />

            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              {editingContact ? "Editar Contato" : "Novo Contato"}
            </Text>

            {/* Name field */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Nome</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    borderColor: errors.name ? colors.error : colors.border,
                    color: colors.foreground,
                  },
                ]}
                placeholder="Ex: Mãe, Amiga Ana..."
                placeholderTextColor={colors.muted}
                value={form.name}
                onChangeText={(t) => setForm((f) => ({ ...f, name: t }))}
                returnKeyType="next"
                autoCapitalize="words"
              />
              {errors.name && (
                <Text style={[styles.errorText, { color: colors.error }]}>{errors.name}</Text>
              )}
            </View>

            {/* Phone field */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Telefone</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    borderColor: errors.phone ? colors.error : colors.border,
                    color: colors.foreground,
                  },
                ]}
                placeholder="Ex: +55 11 99999-9999"
                placeholderTextColor={colors.muted}
                value={form.phone}
                onChangeText={(t) => setForm((f) => ({ ...f, phone: t }))}
                keyboardType="phone-pad"
                returnKeyType="done"
                onSubmitEditing={handleSave}
              />
              {errors.phone && (
                <Text style={[styles.errorText, { color: colors.error }]}>{errors.phone}</Text>
              )}
            </View>

            {/* Buttons */}
            <View style={styles.modalButtons}>
              <Pressable
                onPress={closeModal}
                style={({ pressed }) => [
                  styles.modalCancelBtn,
                  { borderColor: colors.border },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text style={[styles.modalCancelText, { color: colors.muted }]}>Cancelar</Text>
              </Pressable>
              <Pressable
                onPress={handleSave}
                style={({ pressed }) => [
                  styles.modalSaveBtn,
                  { backgroundColor: colors.primary },
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Text style={styles.modalSaveText}>
                  {editingContact ? "Salvar" : "Adicionar"}
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    gap: 16,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },
  slotsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  slotsLabel: {
    fontSize: 13,
    flex: 1,
  },
  slotDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  emptyState: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 40,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: 20,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "600",
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 21,
  },
  contactsList: {
    gap: 12,
  },
  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
  },
  contactAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  contactAvatarText: {
    fontSize: 20,
    fontWeight: "700",
  },
  contactInfo: {
    flex: 1,
    gap: 4,
  },
  contactCardName: {
    fontSize: 16,
    fontWeight: "600",
  },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  contactCardPhone: {
    fontSize: 13,
  },
  contactActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 4,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: 24,
    gap: 16,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  input: {
    height: 52,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  errorText: {
    fontSize: 12,
    marginTop: 2,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: "500",
  },
  modalSaveBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  modalSaveText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
