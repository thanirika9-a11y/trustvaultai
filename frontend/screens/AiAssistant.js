import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  ScrollView,
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../constants/theme';
import { chatWithAI } from '../services/aiApi';

export default function AiAssistant({ route }) {
  const initialGreeting = "வணக்கம்! நான் உங்கள் TrustVault AI உதவியாளர். உங்கள் Vault-ல் உள்ள ஆவணங்கள், லோன், இன்சூரன்ஸ் அல்லது அரசு ஆவணங்கள் பற்றி எந்த கேள்வியும் கேட்கலாம்.\n\n(Ask me anything about your uploaded documents, loan deadlines, or financial records in Tamil or English).";
  
  const [messages, setMessages] = useState([
    {
      id: '1',
      text: initialGreeting,
      sender: 'ai',
      time: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const flatListRef = useRef();

  // Vibrant, High-Contrast Quick Prompt Suggestions
  const quickPrompts = [
    {
      id: 'docs',
      query: 'En vault-la enna documents irukku?',
      display: 'En vault-la enna docs irukku?',
      icon: 'document-text',
      color: '#4F46E5',    // Indigo
      bg: '#EEF2FF',
      border: '#C7D2FE',
    },
    {
      id: 'summary',
      query: 'Summarize my uploaded documents with important notes',
      display: 'Summarize my uploaded docs',
      icon: 'sparkles',
      color: '#7C3AED',    // Violet
      bg: '#F5F3FF',
      border: '#DDD6FE',
    },
    {
      id: 'security',
      query: 'How is my data encrypted and secured in TrustVault?',
      display: 'How is my data encrypted?',
      icon: 'shield-checkmark',
      color: '#059669',    // Emerald Green
      bg: '#ECFDF5',
      border: '#A7F3D0',
    },
    {
      id: 'expiry',
      query: 'Any documents expiring soon or upcoming deadlines?',
      display: 'Any expiring documents?',
      icon: 'alarm',
      color: '#D97706',    // Amber
      bg: '#FFFBEB',
      border: '#FDE68A',
    },
    {
      id: 'loan',
      query: 'What loan EMI or payment dates do I have to pay?',
      display: 'Loan & payment dues?',
      icon: 'cash',
      color: '#0284C7',    // Sky Blue
      bg: '#F0F9FF',
      border: '#BAE6FD',
    },
    {
      id: 'legal',
      query: 'What are the legal document guidelines for Aadhaar, PAN, and Passports?',
      display: 'Legal doc guidelines',
      icon: 'scale',
      color: '#DC2626',    // Rose Red
      bg: '#FEF2F2',
      border: '#FECACA',
    }
  ];

  useEffect(() => {
    if (route?.params?.initialQuery) {
      setInput(route.params.initialQuery);
    }
  }, [route?.params?.initialQuery]);

  const sendQueryText = async (textToSend) => {
    if (!textToSend || textToSend.trim() === '') return;

    const userMsg = {
      id: Date.now().toString(),
      text: textToSend.trim(),
      sender: 'user',
      time: new Date()
    };

    const currentHistory = [...messages, userMsg];
    setMessages(currentHistory);
    setInput('');
    setTyping(true);

    try {
      // Call the real AI backend with RAG Document Context
      const res = await chatWithAI(textToSend.trim(), messages);
      
      const aiMsg = {
        id: (Date.now() + 1).toString(),
        text: res.response || "Sorry, I couldn't understand that.",
        sender: 'ai',
        time: new Date()
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error('Chat error:', err);
      const aiMsg = {
        id: (Date.now() + 1).toString(),
        text: "I'm having trouble connecting to the server right now. Please check if the backend server is running and try again.",
        sender: 'ai',
        time: new Date()
      };
      setMessages(prev => [...prev, aiMsg]);
    } finally {
      setTyping(false);
    }
  };

  const handleSend = () => sendQueryText(input);

  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 200);
  }, [messages, typing]);

  const renderMessageItem = ({ item }) => {
    const isUser = item.sender === 'user';
    return (
      <View style={[styles.messageRow, isUser ? styles.userRow : styles.aiRow]}>
        {!isUser && (
          <View style={styles.aiAvatar}>
            <Ionicons name="sparkles" size={14} color="#FFFFFF" />
          </View>
        )}
        <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
          <Text style={[styles.messageText, isUser ? styles.userMessageText : styles.aiMessageText]}>
            {item.text}
          </Text>
          <Text style={[styles.timeText, isUser ? styles.userTimeText : styles.aiTimeText]}>
            {new Date(item.time).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  const canSend = input.trim().length > 0;

  return (
    <KeyboardAvoidingView 
      style={styles.root} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      
      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessageItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Typing Indicator */}
      {typing && (
        <View style={styles.typingRow}>
          <View style={styles.aiAvatar}>
            <Ionicons name="sparkles" size={14} color="#FFFFFF" />
          </View>
          <View style={[styles.bubble, styles.aiBubble, styles.typingBubble]}>
            <ActivityIndicator size="small" color={COLORS.primary || '#6366F1'} />
            <Text style={styles.typingText}>TrustVault AI is typing...</Text>
          </View>
        </View>
      )}

      {/* Quick Suggestions Chips Section */}
      <View style={styles.quickPromptsSection}>
        <View style={styles.quickPromptsHeader}>
          <Ionicons name="bulb-outline" size={15} color="#4F46E5" />
          <Text style={styles.quickPromptsLabel}>Suggested Questions (கேட்கக்கூடிய கேள்விகள்):</Text>
        </View>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.chipsScrollContent}
        >
          {quickPrompts.map((p) => (
            <TouchableOpacity 
              key={p.id} 
              style={[styles.chip, { backgroundColor: p.bg, borderColor: p.border }]} 
              onPress={() => sendQueryText(p.query)}
              activeOpacity={0.7}
            >
              <Ionicons name={p.icon} size={15} color={p.color} style={{ marginRight: 6 }} />
              <Text style={[styles.chipText, { color: p.color }]}>{p.display}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Chat Input Bar */}
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.textInput, inputFocused && styles.textInputFocused]}
          placeholder="Ask AI about documents, loans, limits..."
          placeholderTextColor="#94A3B8"
          value={input}
          onChangeText={setInput}
          onFocus={() => setInputFocused(true)}
          onBlur={() => setInputFocused(false)}
          onSubmitEditing={handleSend}
          returnKeyType="send"
        />
        <TouchableOpacity 
          style={[styles.sendBtn, !canSend ? styles.sendBtnDisabled : styles.sendBtnActive]} 
          onPress={handleSend}
          disabled={!canSend}
          activeOpacity={0.8}
        >
          <Ionicons name="send" size={18} color={canSend ? "#FFFFFF" : "#94A3B8"} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAFC', // Crisp soft background
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
    maxWidth: 960,
    width: '100%',
    alignSelf: 'center',
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
    maxWidth: Platform.OS === 'web' ? '80%' : '88%',
  },
  userRow: {
    alignSelf: 'flex-end',
    justifyContent: 'flex-end',
  },
  aiRow: {
    alignSelf: 'flex-start',
    justifyContent: 'flex-start',
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 2,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexShrink: 1,
    maxWidth: '100%',
  },
  userBubble: {
    backgroundColor: '#4F46E5', // Crisp vibrant Indigo
    borderBottomRightRadius: 4,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  aiBubble: {
    backgroundColor: '#FFFFFF', // Pure white card
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderBottomLeftRadius: 4,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    flexShrink: 1,
    // Web word wrap safety
    ...(Platform.OS === 'web' ? { wordBreak: 'break-word' } : {}),
  },
  userMessageText: {
    color: '#FFFFFF',
    fontWeight: '400',
  },
  aiMessageText: {
    color: '#0F172A', // Ultra crisp dark slate for best readability
    fontWeight: '400',
  },
  timeText: {
    fontSize: 10,
    marginTop: 6,
    alignSelf: 'flex-end',
  },
  userTimeText: {
    color: 'rgba(255, 255, 255, 0.75)',
  },
  aiTimeText: {
    color: '#94A3B8',
  },
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  typingText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '500',
  },
  quickPromptsSection: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 10,
    paddingBottom: 8,
    width: '100%',
    maxWidth: 960,
    alignSelf: 'center',
  },
  quickPromptsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
    gap: 6,
  },
  quickPromptsLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4F46E5',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  chipsScrollContent: {
    paddingHorizontal: 16,
    gap: 10,
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
    cursor: 'pointer',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    maxWidth: 960,
    alignSelf: 'center',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F1F5F9', // Soft subtle grey container
    color: '#0F172A',           // DEEP DARK SLATE — NEVER WHITE
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 12,
    fontSize: 14.5,
    fontWeight: '400',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    outlineStyle: 'none',
  },
  textInputFocused: {
    backgroundColor: '#FFFFFF',
    borderColor: '#6366F1',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnActive: {
    backgroundColor: '#4F46E5',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  sendBtnDisabled: {
    backgroundColor: '#E2E8F0',
  },
});
