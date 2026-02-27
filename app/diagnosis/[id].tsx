import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTextGeneration } from '@fastshot/ai';
import { loadScans } from '@/lib/storage';
import { ScanResult, ChatMessage } from '@/lib/types';

export default function DiagnosisDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [scan, setScan] = useState<ScanResult | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const chatScrollRef = useRef<ScrollView>(null);

  const { generateText, isLoading: chatLoading } = useTextGeneration();

  useEffect(() => {
    loadScans().then((scans) => {
      const found = scans.find((s) => s.id === id);
      if (found) {
        setScan(found);
        setMessages([
          {
            id: '0',
            role: 'assistant',
            content: `Hello! I've analyzed your plant and detected **${found.diseaseName}** in your **${found.plantType}** with ${found.confidence}% confidence. Ask me anything about this diagnosis, treatment options, or plant care!`,
            timestamp: Date.now(),
          },
        ]);
      }
    });
  }, [id]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || chatLoading || !scan) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputText('');

    setTimeout(() => chatScrollRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const context = `You are an expert plant pathologist AI assistant named Agro.
The user has a plant with the following diagnosis:
- Plant: ${scan.plantType}
- Disease: ${scan.diseaseName}
- Confidence: ${scan.confidence}%
- Description: ${scan.description}
Answer the user's question concisely and helpfully. Keep responses under 150 words.`;

      const result = await generateText(`${context}\n\nUser question: ${inputText.trim()}`);

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result || 'I could not generate a response. Please try again.',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setTimeout(() => chatScrollRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (err) {
      console.error('Chat error:', err);
      Alert.alert('Error', 'Failed to get AI response. Please try again.');
    }
  };

  const getConfidenceColor = (c: number) => {
    if (c >= 80) return '#2D5A27';
    if (c >= 60) return '#FFC107';
    return '#CD5C5C';
  };

  const isHealthy = scan?.diseaseName.toLowerCase().includes('healthy');

  if (!scan) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#2D5A27" />
        <Text style={styles.loadingText}>Loading diagnosis...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <ScrollView
        ref={scrollRef}
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        {/* Hero Image */}
        <View style={styles.heroContainer}>
          <Image source={{ uri: scan.imageUri }} style={styles.heroImage} resizeMode="cover" />
          <View style={styles.heroOverlay} />
          {/* Header */}
          <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.screenTitle}>Diagnosis Report</Text>
            <View style={{ width: 44 }} />
          </View>
          {/* Disease badge on image */}
          <View style={styles.heroInfo}>
            <View
              style={[
                styles.statusChip,
                { backgroundColor: isHealthy ? '#2D5A27' : '#CD5C5C' },
              ]}
            >
              <Ionicons
                name={isHealthy ? 'checkmark-circle' : 'warning'}
                size={14}
                color="#FFFFFF"
              />
              <Text style={styles.statusChipText}>{isHealthy ? 'Healthy' : 'Disease Detected'}</Text>
            </View>
            <Text style={styles.heroDiseaseName}>{scan.diseaseName}</Text>
            <Text style={styles.heroPlantName}>{scan.plantType}</Text>
          </View>
        </View>

        {/* Confidence Score */}
        <View style={styles.section}>
          <View style={styles.confidenceCard}>
            <View style={styles.confidenceLeft}>
              <Text style={styles.confidenceLabel}>Confidence Score</Text>
              <Text
                style={[
                  styles.confidenceValue,
                  { color: getConfidenceColor(scan.confidence) },
                ]}
              >
                {scan.confidence}%
              </Text>
            </View>
            <View style={styles.confidenceBarContainer}>
              <View style={styles.confidenceBarBg}>
                <View
                  style={[
                    styles.confidenceBarFill,
                    {
                      width: `${scan.confidence}%`,
                      backgroundColor: getConfidenceColor(scan.confidence),
                    },
                  ]}
                />
              </View>
              <Text style={styles.confidenceBarLabel}>AI Certainty</Text>
            </View>
          </View>
        </View>

        {/* Disease Overview */}
        <View style={styles.section}>
          <SectionHeader icon="information-circle-outline" title="Disease Overview" />
          <View style={styles.card}>
            <Text style={styles.cardText}>{scan.description}</Text>
          </View>
        </View>

        {/* Treatment Plan */}
        <View style={styles.section}>
          <SectionHeader icon="medkit-outline" title="Treatment Plan" />

          <Text style={styles.subSectionTitle}>🌿 Biological Treatment</Text>
          <View style={[styles.card, styles.greenBorder]}>
            {scan.biologicalTreatment.map((item, i) => (
              <TreatmentItem key={i} text={item} color="#2D5A27" />
            ))}
          </View>

          <Text style={[styles.subSectionTitle, { marginTop: 12 }]}>🧪 Chemical Treatment</Text>
          <View style={[styles.card, styles.redBorder]}>
            {scan.chemicalTreatment.map((item, i) => (
              <TreatmentItem key={i} text={item} color="#CD5C5C" />
            ))}
          </View>
        </View>

        {/* Prevention Tips */}
        <View style={styles.section}>
          <SectionHeader icon="shield-checkmark-outline" title="Prevention Tips" />
          <View style={[styles.card, styles.yellowBorder]}>
            {scan.preventionTips.map((tip, i) => (
              <View key={i} style={styles.tipRow}>
                <View style={styles.tipBullet}>
                  <Ionicons name="checkmark" size={12} color="#FFC107" />
                </View>
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* AI Chat */}
        <View style={[styles.section, { marginBottom: 0 }]}>
          <SectionHeader icon="chatbubble-ellipses-outline" title="AI Chat Assistant" />
          <View style={styles.chatContainer}>
            <ScrollView
              ref={chatScrollRef}
              style={styles.chatMessages}
              contentContainerStyle={{ padding: 12, gap: 10 }}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
            >
              {messages.map((msg) => (
                <View
                  key={msg.id}
                  style={[
                    styles.messageBubble,
                    msg.role === 'user' ? styles.userBubble : styles.assistantBubble,
                  ]}
                >
                  {msg.role === 'assistant' && (
                    <View style={styles.botAvatar}>
                      <Ionicons name="leaf" size={12} color="#FFFFFF" />
                    </View>
                  )}
                  <View
                    style={[
                      styles.messageContent,
                      msg.role === 'user' ? styles.userContent : styles.assistantContent,
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        msg.role === 'user' ? styles.userText : styles.assistantText,
                      ]}
                    >
                      {msg.content}
                    </Text>
                  </View>
                </View>
              ))}
              {chatLoading && (
                <View style={[styles.messageBubble, styles.assistantBubble]}>
                  <View style={styles.botAvatar}>
                    <Ionicons name="leaf" size={12} color="#FFFFFF" />
                  </View>
                  <View style={styles.assistantContent}>
                    <ActivityIndicator size="small" color="#2D5A27" />
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Chat Input */}
            <View style={styles.chatInputRow}>
              <TextInput
                style={styles.chatInput}
                placeholder="Ask about this diagnosis..."
                placeholderTextColor="#88A070"
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={300}
                returnKeyType="send"
                onSubmitEditing={handleSendMessage}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!inputText.trim() || chatLoading) && styles.sendDisabled,
                ]}
                onPress={handleSendMessage}
                disabled={!inputText.trim() || chatLoading}
              >
                <Ionicons name="send" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function SectionHeader({ icon, title }: { icon: string; title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Ionicons name={icon as any} size={20} color="#2D5A27" />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function TreatmentItem({ text, color }: { text: string; color: string }) {
  return (
    <View style={styles.treatmentRow}>
      <View style={[styles.treatmentDot, { backgroundColor: color }]} />
      <Text style={styles.treatmentText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FBF9',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FBF9',
    gap: 12,
  },
  loadingText: {
    color: '#88A070',
    fontSize: 14,
  },
  heroContainer: {
    height: 280,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  heroInfo: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    marginBottom: 8,
  },
  statusChipText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroDiseaseName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  heroPlantName: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A3318',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  cardText: {
    fontSize: 14,
    color: '#3D5A3A',
    lineHeight: 22,
  },
  greenBorder: {
    borderLeftWidth: 4,
    borderLeftColor: '#2D5A27',
  },
  redBorder: {
    borderLeftWidth: 4,
    borderLeftColor: '#CD5C5C',
  },
  yellowBorder: {
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  subSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3D5A3A',
    marginBottom: 8,
  },
  treatmentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  treatmentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 5,
  },
  treatmentText: {
    flex: 1,
    fontSize: 14,
    color: '#3D5A3A',
    lineHeight: 21,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  tipBullet: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFF8E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#3D5A3A',
    lineHeight: 21,
  },
  confidenceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  confidenceLeft: {
    alignItems: 'center',
    minWidth: 70,
  },
  confidenceLabel: {
    fontSize: 11,
    color: '#88A070',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  confidenceValue: {
    fontSize: 32,
    fontWeight: '800',
    marginTop: 2,
  },
  confidenceBarContainer: {
    flex: 1,
  },
  confidenceBarBg: {
    height: 10,
    backgroundColor: '#E8EDE8',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 6,
  },
  confidenceBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  confidenceBarLabel: {
    fontSize: 12,
    color: '#88A070',
    fontWeight: '500',
  },
  chatContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  chatMessages: {
    maxHeight: 300,
    minHeight: 180,
  },
  messageBubble: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 2,
  },
  userBubble: {
    justifyContent: 'flex-end',
  },
  assistantBubble: {
    justifyContent: 'flex-start',
    gap: 8,
  },
  botAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2D5A27',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  messageContent: {
    maxWidth: '75%',
    borderRadius: 16,
    padding: 10,
  },
  userContent: {
    backgroundColor: '#2D5A27',
    borderBottomRightRadius: 4,
    marginLeft: 'auto',
  },
  assistantContent: {
    backgroundColor: '#F0F5F0',
    borderBottomLeftRadius: 4,
    minWidth: 48,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userText: {
    color: '#FFFFFF',
  },
  assistantText: {
    color: '#1A3318',
  },
  chatInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#E8EDE8',
  },
  chatInput: {
    flex: 1,
    backgroundColor: '#F0F5F0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1A3318',
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2D5A27',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: {
    backgroundColor: '#88A070',
  },
});
