import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions, FlashMode } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { useImageAnalysis } from '@fastshot/ai';
import { addScan } from '@/lib/storage';
import { ScanResult } from '@/lib/types';
import SproutAnimation from '@/components/SproutAnimation';

const { width, height } = Dimensions.get('window');
const FRAME_SIZE = width * 0.75;

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [flashMode, setFlashMode] = useState<FlashMode>('off');
  const [isProcessing, setIsProcessing] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const insets = useSafeAreaInsets();

  const { analyzeImage } = useImageAnalysis();

  // Pulse animation values
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.8);
  const borderPulse = useSharedValue(1);

  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 900, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      false
    );
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(0.5, { duration: 900 }),
        withTiming(1, { duration: 900 })
      ),
      -1,
      false
    );
    borderPulse.value = withRepeat(
      withSequence(
        withTiming(1.04, { duration: 1200 }),
        withTiming(1, { duration: 1200 })
      ),
      -1,
      false
    );
  }, []);

  const frameStyle = useAnimatedStyle(() => ({
    transform: [{ scale: isProcessing ? pulseScale.value : 1 }],
  }));

  const cornerStyle = useAnimatedStyle(() => ({
    opacity: isProcessing ? pulseOpacity.value : 1,
    transform: [{ scale: isProcessing ? borderPulse.value : 1 }],
  }));

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Ionicons name="camera-outline" size={56} color="#88A070" />
        <Text style={styles.permTitle}>Camera Access Needed</Text>
        <Text style={styles.permText}>
          Agroscan needs camera access to analyze your plants
        </Text>
        <TouchableOpacity style={styles.permButton} onPress={requestPermission}>
          <Text style={styles.permButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const parseAIResponse = (raw: string): Partial<ScanResult> => {
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          diseaseName: parsed.diseaseName || parsed.disease_name || 'Unknown Condition',
          plantType: parsed.plantType || parsed.plant_type || 'Unknown Plant',
          confidence: Math.min(100, Math.max(0, Number(parsed.confidence) || 75)),
          description: parsed.description || 'Analysis complete.',
          biologicalTreatment: Array.isArray(parsed.biologicalTreatment)
            ? parsed.biologicalTreatment
            : Array.isArray(parsed.biological_treatment)
            ? parsed.biological_treatment
            : ['Consult a local agronomist for biological treatment options.'],
          chemicalTreatment: Array.isArray(parsed.chemicalTreatment)
            ? parsed.chemicalTreatment
            : Array.isArray(parsed.chemical_treatment)
            ? parsed.chemical_treatment
            : ['Consult a local agronomist for chemical treatment options.'],
          preventionTips: Array.isArray(parsed.preventionTips)
            ? parsed.preventionTips
            : Array.isArray(parsed.prevention_tips)
            ? parsed.prevention_tips
            : ['Maintain good soil health', 'Ensure proper irrigation', 'Rotate crops regularly'],
        };
      }
    } catch (e) {
      console.error('Parse error:', e);
    }
    // Fallback parsing from free text — default to healthy to avoid false positives
    const lowerRaw = raw.toLowerCase();
    const mentionsDisease =
      lowerRaw.includes('blight') ||
      lowerRaw.includes('mildew') ||
      lowerRaw.includes('rust') ||
      lowerRaw.includes('rot') ||
      lowerRaw.includes('spot') ||
      lowerRaw.includes('wilt') ||
      lowerRaw.includes('fungal') ||
      lowerRaw.includes('bacterial') ||
      lowerRaw.includes('virus') ||
      lowerRaw.includes('pest') ||
      lowerRaw.includes('infected') ||
      lowerRaw.includes('disease');
    return {
      diseaseName: mentionsDisease ? 'Disease Detected' : 'Healthy Plant',
      plantType: 'Plant',
      confidence: mentionsDisease ? 65 : 80,
      description: raw.slice(0, 300) || 'Analysis complete. Please re-scan for a more detailed result.',
      biologicalTreatment: mentionsDisease
        ? ['Consult a local agronomist for biological treatment options.']
        : ['No treatment needed - plant appears healthy', 'Continue regular watering schedule', 'Maintain adequate sunlight exposure'],
      chemicalTreatment: mentionsDisease
        ? ['Consult a local agronomist for chemical treatment options.']
        : ['No chemical treatment required', 'Regular fertilization is sufficient'],
      preventionTips: ['Maintain good soil health', 'Ensure proper irrigation', 'Rotate crops regularly'],
    };
  };

  const handleAnalyze = async (imageUri: string) => {
    setIsProcessing(true);
    try {
      const result = await analyzeImage({
        imageUrl: imageUri,
        prompt: `You are an expert plant pathologist performing a precise diagnostic assessment. Your task is to examine the plant image and determine if it is HEALTHY or DISEASED based only on clearly visible symptoms.

STEP 1 — Visual inspection checklist:
- Leaf color: Is it uniformly green? (Healthy) OR yellow/brown/black patches? (Diseased)
- Leaf surface: Is it smooth and clean? (Healthy) OR powdery, spotted, or lesioned? (Diseased)
- Leaf edges: Are they intact? (Healthy) OR scorched, curled, or necrotic? (Diseased)
- Overall vigor: Upright and firm? (Healthy) OR wilting, drooping, stunted? (Diseased)
- Pests/mold: None visible? (Healthy) OR webbing, insects, fungal growth visible? (Diseased)

STEP 2 — Decision rule:
- If 3 or more of the above indicators point to HEALTHY → classify as "Healthy Plant", confidence ≥ 80
- Only classify as diseased if you can clearly name a specific disease with visible evidence
- When in doubt, classify as "Healthy Plant"
- Do NOT assume disease from minor variations in color or lighting

STEP 3 — Respond with ONLY this valid JSON object (no markdown, no extra text):
{
  "diseaseName": "Healthy Plant OR specific disease name (e.g. 'Powdery Mildew', 'Early Blight', 'Leaf Rust')",
  "plantType": "identified plant species (e.g. 'Tomato', 'Rose', 'Wheat', 'Maize')",
  "confidence": 85,
  "description": "2-3 sentences describing what you observed in the image and the plant's condition",
  "biologicalTreatment": ["Only include if diseased, else use ['No treatment needed - plant is healthy', 'Continue regular watering schedule', 'Maintain adequate sunlight exposure']"],
  "chemicalTreatment": ["Only include if diseased, else use ['No chemical treatment required', 'Regular fertilization is sufficient']"],
  "preventionTips": ["Tip specific to this plant type and condition"]
}`,
      });

      if (!result) throw new Error('No analysis result');

      const parsed = parseAIResponse(result);
      const scan: ScanResult = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        imageUri,
        diseaseName: parsed.diseaseName || 'Unknown',
        plantType: parsed.plantType || 'Plant',
        confidence: parsed.confidence || 75,
        description: parsed.description || '',
        biologicalTreatment: parsed.biologicalTreatment || [],
        chemicalTreatment: parsed.chemicalTreatment || [],
        preventionTips: parsed.preventionTips || [],
      };

      await addScan(scan);
      setIsProcessing(false);
      router.replace(`/diagnosis/${scan.id}` as any);
    } catch (err) {
      setIsProcessing(false);
      console.error('Analysis error:', err);
      Alert.alert('Analysis Failed', 'Could not analyze the image. Please try again.', [
        { text: 'OK' },
      ]);
    }
  };

  const takePicture = async () => {
    if (!cameraRef.current || isProcessing) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (photo?.uri) {
        await handleAnalyze(photo.uri);
      }
    } catch (err) {
      console.error('Camera error:', err);
      Alert.alert('Error', 'Failed to capture photo.');
    }
  };

  const pickFromGallery = async () => {
    if (isProcessing) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled && result.assets[0]) {
      await handleAnalyze(result.assets[0].uri);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
        flash={flashMode}
      />

      {/* Dark overlay with leaf frame cutout */}
      <View style={StyleSheet.absoluteFill}>
        {/* Top overlay */}
        <View style={[styles.overlay, { height: (height - FRAME_SIZE) / 2.5 }]} />
        {/* Middle row */}
        <View style={styles.middleRow}>
          <View style={[styles.overlay, { flex: 1 }]} />
          {/* Frame area - transparent */}
          <Animated.View style={[styles.frameContainer, frameStyle, { width: FRAME_SIZE, height: FRAME_SIZE }]}>
            {/* Corner pieces */}
            <Animated.View style={[styles.corner, styles.cornerTL, cornerStyle]} />
            <Animated.View style={[styles.corner, styles.cornerTR, cornerStyle]} />
            <Animated.View style={[styles.corner, styles.cornerBL, cornerStyle]} />
            <Animated.View style={[styles.corner, styles.cornerBR, cornerStyle]} />
            {/* Leaf frame icon */}
            <View style={styles.leafIconContainer}>
              <Ionicons name="leaf-outline" size={32} color="rgba(255,255,255,0.5)" />
              <Text style={styles.frameHint}>
                {isProcessing ? 'Analyzing...' : 'Align leaf here'}
              </Text>
            </View>

            {/* Scanning pulse overlay when processing */}
            {isProcessing && (
              <View style={StyleSheet.absoluteFillObject}>
                <ScanLineAnimation frameSize={FRAME_SIZE} />
              </View>
            )}
          </Animated.View>
          <View style={[styles.overlay, { flex: 1 }]} />
        </View>
        {/* Bottom overlay */}
        <View style={[styles.overlay, { flex: 1 }]} />
      </View>

      {/* Top Controls */}
      <View style={[styles.topControls, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.cameraTitle}>Plant Scanner</Text>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => setFlashMode(flashMode === 'off' ? 'on' : 'off')}
        >
          <Ionicons
            name={flashMode === 'off' ? 'flash-off-outline' : 'flash-outline'}
            size={24}
            color={flashMode === 'on' ? '#FFC107' : '#FFFFFF'}
          />
        </TouchableOpacity>
      </View>

      {/* Processing indicator */}
      {isProcessing && (
        <View style={styles.processingBanner}>
          <SproutAnimation size={40} />
          <View style={styles.processingText}>
            <Text style={styles.processingTitle}>AI Analyzing...</Text>
            <Text style={styles.processingSub}>Identifying plant condition</Text>
          </View>
          <ActivityIndicator color="#2D5A27" />
        </View>
      )}

      {/* Bottom Controls */}
      <View style={[styles.bottomControls, { paddingBottom: insets.bottom + 24 }]}>
        <TouchableOpacity
          style={[styles.galleryButton, isProcessing && styles.disabled]}
          onPress={pickFromGallery}
          disabled={isProcessing}
        >
          <Ionicons name="images-outline" size={26} color="#FFFFFF" />
          <Text style={styles.galleryLabel}>Gallery</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.captureButton, isProcessing && styles.captureDisabled]}
          onPress={takePicture}
          disabled={isProcessing}
          activeOpacity={0.85}
        >
          {isProcessing ? (
            <ActivityIndicator color="#2D5A27" size="large" />
          ) : (
            <View style={styles.captureInner} />
          )}
        </TouchableOpacity>

        <View style={{ width: 70 }} />
      </View>
    </View>
  );
}

function ScanLineAnimation({ frameSize }: { frameSize: number }) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(frameSize - 4, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      false
    );
    opacity.value = withRepeat(
      withSequence(withTiming(0.9, { duration: 900 }), withTiming(0.4, { duration: 900 })),
      -1,
      false
    );
  }, [frameSize]);

  const lineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: 4,
          right: 4,
          height: 2,
          backgroundColor: '#2D5A27',
          borderRadius: 1,
          shadowColor: '#2D5A27',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 1,
          shadowRadius: 4,
          elevation: 4,
        },
        lineStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#F9FBF9',
  },
  overlay: {
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  middleRow: {
    flexDirection: 'row',
    height: FRAME_SIZE,
  },
  frameContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: '#FFFFFF',
  },
  cornerTL: {
    top: 4,
    left: 4,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 8,
  },
  cornerTR: {
    top: 4,
    right: 4,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 8,
  },
  cornerBL: {
    bottom: 4,
    left: 4,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 8,
  },
  cornerBR: {
    bottom: 4,
    right: 4,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 8,
  },
  leafIconContainer: {
    alignItems: 'center',
    gap: 8,
  },
  frameHint: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontWeight: '500',
  },
  topControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  processingBanner: {
    position: 'absolute',
    left: 20,
    right: 20,
    top: '15%',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  processingText: {
    flex: 1,
  },
  processingTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2D5A27',
  },
  processingSub: {
    fontSize: 12,
    color: '#88A070',
    marginTop: 2,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
  },
  galleryButton: {
    width: 70,
    alignItems: 'center',
    gap: 4,
  },
  galleryLabel: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '500',
  },
  captureButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureDisabled: {
    opacity: 0.6,
  },
  captureInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
  },
  disabled: {
    opacity: 0.4,
  },
  permTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A3318',
    marginTop: 16,
    marginBottom: 8,
  },
  permText: {
    fontSize: 14,
    color: '#88A070',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  permButton: {
    backgroundColor: '#2D5A27',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 16,
  },
  permButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
