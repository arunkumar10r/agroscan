import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTextGeneration } from '@fastshot/ai';
import { ChatMessage } from '@/lib/types';
import SproutAnimation from '@/components/SproutAnimation';

const QUICK_QUESTIONS = [
  'What causes leaf spots?',
  'How to prevent root rot?',
  'Best organic pesticides?',
  'Signs of nutrient deficiency?',
];

export default function HelpScreen() {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '0',
      role: 'assistant',
      content:
        "Hi! I'm **Agro**, your AI plant health assistant 🌿\n\nAsk me anything about plant diseases, treatments, soil health, irrigation, or general farming tips!",
      timestamp: Date.now(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const { generateText, isLoading } = useTextGeneration();

  const scrollToBottom = () => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const handleSend = async (text?: string) => {
    const msg = text || inputText.trim();
    if (!msg || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: msg,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    scrollToBottom();

    try {
      const result = await generateText(
        `You are Agro, an expert plant pathologist and agricultural AI assistant.
Answer questions about plant diseases, treatments, soil health, and farming.
Be concise (under 180 words), helpful, and use bullet points when listing items.
User question: ${msg}`
      );

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result || "I couldn't generate a response. Please try again.",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      scrollToBottom();
    } catch (err) {
      console.error('Chat error:', err);
      Alert.alert('Error', 'Failed to get a response. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.agroAvatar}>
            <Ionicons name="leaf" size={22} color="#FFFFFF" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Agro AI Assistant</Text>
            <View style={styles.onlineRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>Online · Plant Expert</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity
          style={styles.clearBtn}
          onPress={() => {
            setMessages([
              {
                id: Date.now().toString(),
                role: 'assistant',
                content: "Chat cleared! Ask me anything about plant health 🌱",
                timestamp: Date.now(),
              },
            ]);
          }}
        >
          <Ionicons name="refresh-outline" size={20} color="#88A070" />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={styles.messages}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={scrollToBottom}
      >
        {messages.map((msg) => (
          <View
            key={msg.id}
            style={[
              styles.messageRow,
              msg.role === 'user' ? styles.userRow : styles.assistantRow,
            ]}
          >
            {msg.role === 'assistant' && (
              <View style={styles.botAvatar}>
                <Ionicons name="leaf" size={14} color="#FFFFFF" />
              </View>
            )}
            <View
              style={[
                styles.bubble,
                msg.role === 'user' ? styles.userBubble : styles.assistantBubble,
              ]}
            >
              <Text
                style={[
                  styles.bubbleText,
                  msg.role === 'user' ? styles.userBubbleText : styles.assistantBubbleText,
                ]}
              >
                {msg.content}
              </Text>
            </View>
          </View>
        ))}

        {isLoading && (
          <View style={[styles.messageRow, styles.assistantRow]}>
            <View style={styles.botAvatar}>
              <Ionicons name="leaf" size={14} color="#FFFFFF" />
            </View>
            <View style={[styles.bubble, styles.assistantBubble, styles.typingBubble]}>
              <SproutAnimation size={36} />
              <Text style={styles.typingText}>Thinking...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Quick Questions */}
      {messages.length <= 1 && !isLoading && (
        <View style={styles.quickSection}>
          <Text style={styles.quickTitle}>Quick questions</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickScroll}
          >
            {QUICK_QUESTIONS.map((q, i) => (
              <TouchableOpacity
                key={i}
                style={styles.quickChip}
                onPress={() => handleSend(q)}
              >
                <Text style={styles.quickChipText}>{q}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Input */}
      <View style={[styles.inputContainer, { paddingBottom: insets.bottom + 8 }]}>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Ask about plant health..."
            placeholderTextColor="#88A070"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={() => handleSend()}
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              (!inputText.trim() || isLoading) && styles.sendBtnDisabled,
            ]}
            onPress={() => handleSend()}
            disabled={!inputText.trim() || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Ionicons name="send" size={18} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FBF9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8EDE8',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  agroAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2D5A27',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A3318',
  },
  onlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
  },
  onlineText: {
    fontSize: 12,
    color: '#88A070',
    fontWeight: '500',
  },
  clearBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F0F5F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messages: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 20,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  assistantRow: {
    justifyContent: 'flex-start',
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2D5A27',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  bubble: {
    maxWidth: '72%',
    borderRadius: 18,
    padding: 12,
  },
  userBubble: {
    backgroundColor: '#2D5A27',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 21,
  },
  userBubbleText: {
    color: '#FFFFFF',
  },
  assistantBubbleText: {
    color: '#1A3318',
  },
  typingText: {
    fontSize: 13,
    color: '#88A070',
    fontStyle: 'italic',
  },
  quickSection: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  quickTitle: {
    fontSize: 12,
    color: '#88A070',
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quickScroll: {
    gap: 8,
  },
  quickChip: {
    backgroundColor: '#EFF5EF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#C5D9BF',
  },
  quickChipText: {
    fontSize: 13,
    color: '#2D5A27',
    fontWeight: '500',
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8EDE8',
    paddingTop: 10,
    paddingHorizontal: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#F0F5F0',
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 11,
    fontSize: 14,
    color: '#1A3318',
    maxHeight: 100,
    minHeight: 46,
  },
  sendBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#2D5A27',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2D5A27',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  sendBtnDisabled: {
    backgroundColor: '#88A070',
    shadowOpacity: 0,
    elevation: 0,
  },
});
