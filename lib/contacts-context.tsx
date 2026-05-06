import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface Contact {
  id: string;
  name: string;
  phone: string;
}

interface ContactsContextType {
  contacts: Contact[];
  addContact: (contact: Omit<Contact, "id">) => Promise<void>;
  updateContact: (id: string, contact: Omit<Contact, "id">) => Promise<void>;
  removeContact: (id: string) => Promise<void>;
  isLoading: boolean;
}

const ContactsContext = createContext<ContactsContextType | null>(null);

const STORAGE_KEY = "@sos_mulher_contacts";

export function ContactsProvider({ children }: { children: React.ReactNode }) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setContacts(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Erro ao carregar contatos:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const saveContacts = async (newContacts: Contact[]) => {
    // Always update UI state immediately; persist best-effort.
    setContacts(newContacts);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newContacts));
    } catch (e) {
      console.error("Erro ao salvar contatos:", e);
    }
  };

  const updateContacts = useCallback(async (updater: (prev: Contact[]) => Contact[]) => {
    setContacts((prev) => {
      const next = updater(prev);
      // Fire-and-forget persistence to keep UI responsive.
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch((e) => {
        console.error("Erro ao salvar contatos:", e);
      });
      return next;
    });
  }, []);

  const createId = () => {
    const random = Math.random().toString(16).slice(2);
    return `${Date.now()}-${random}`;
  };

  const addContact = useCallback(async (contact: Omit<Contact, "id">) => {
    const newContact: Contact = {
      ...contact,
      id: createId(),
    };
    await updateContacts((prev) => [...prev, newContact]);
  }, [updateContacts]);

  const updateContact = useCallback(async (id: string, contact: Omit<Contact, "id">) => {
    await updateContacts((prev) => prev.map((c) => (c.id === id ? { ...contact, id } : c)));
  }, [updateContacts]);

  const removeContact = useCallback(async (id: string) => {
    await updateContacts((prev) => prev.filter((c) => c.id !== id));
  }, [updateContacts]);

  return (
    <ContactsContext.Provider value={{ contacts, addContact, updateContact, removeContact, isLoading }}>
      {children}
    </ContactsContext.Provider>
  );
}

export function useContacts() {
  const ctx = useContext(ContactsContext);
  if (!ctx) throw new Error("useContacts must be used within ContactsProvider");
  return ctx;
}
