import React, { Component, ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Share,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  copied: boolean;
}

// Inner component so we can use hooks for safe area
function ErrorScreen({
  error,
  errorInfo,
  onReset,
}: {
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  onReset: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [copied, setCopied] = React.useState(false);

  const technicalDetails = [
    `Error: ${error?.name ?? 'UnknownError'}`,
    `Message: ${error?.message ?? 'No message available'}`,
    `\nStack Trace:\n${error?.stack ?? 'No stack trace'}`,
    errorInfo?.componentStack
      ? `\nComponent Stack:\n${errorInfo.componentStack}`
      : '',
  ]
    .filter(Boolean)
    .join('\n');

  const handleCopyError = async () => {
    try {
      await Share.share({
        message: technicalDetails,
        title: 'Agroscan Error Report',
      });
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Share dismissed — not a real error
    }
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconWrapper}>
          <Ionicons name="warning" size={40} color="#C0392B" />
        </View>
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.subtitle}>
          An unexpected error occurred. You can try to recover or share the
          technical details with support.
        </Text>
      </View>

      {/* Error preview card */}
      <ScrollView
        style={styles.errorCard}
        contentContainerStyle={styles.errorCardContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.errorLabelRow}>
          <Ionicons name="code-slash-outline" size={14} color="#88A070" />
          <Text style={styles.errorLabel}>Technical Details</Text>
        </View>
        <Text style={styles.errorText} selectable>
          {technicalDetails}
        </Text>
      </ScrollView>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.copyButton, copied && styles.copyButtonSuccess]}
          onPress={handleCopyError}
          activeOpacity={0.8}
        >
          <Ionicons
            name={copied ? 'checkmark-circle-outline' : 'share-social-outline'}
            size={18}
            color={copied ? '#2D5A27' : '#FFFFFF'}
          />
          <Text style={[styles.copyButtonText, copied && styles.copyButtonTextSuccess]}>
            {copied ? 'Shared!' : 'Copy Error'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.resetButton}
          onPress={onReset}
          activeOpacity={0.8}
        >
          <Ionicons name="refresh-outline" size={18} color="#2D5A27" />
          <Text style={styles.resetButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>

      {/* Brand footer */}
      <View style={styles.footer}>
        <Ionicons name="leaf" size={14} color="#B8D4B0" />
        <Text style={styles.footerText}>Agroscan</Text>
      </View>
    </View>
  );
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      copied: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    if (__DEV__) {
      console.error('[ErrorBoundary] Caught error:', error);
      console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      copied: false,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorScreen
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onReset={this.handleReset}
        />
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FBF9',
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FDECEA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F5C6C2',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A3318',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#88A070',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },
  errorCard: {
    flex: 1,
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8F0E8',
    marginBottom: 24,
    maxHeight: 240,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  errorCardContent: {
    padding: 16,
  },
  errorLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  errorLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#88A070',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  errorText: {
    fontSize: 11,
    color: '#4A3728',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 18,
  },
  actions: {
    width: '100%',
    gap: 12,
    marginBottom: 24,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2D5A27',
    borderRadius: 14,
    paddingVertical: 15,
    shadowColor: '#2D5A27',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  copyButtonSuccess: {
    backgroundColor: '#EBF5E8',
    shadowColor: 'transparent',
    elevation: 0,
    borderWidth: 1,
    borderColor: '#2D5A27',
  },
  copyButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  copyButtonTextSuccess: {
    color: '#2D5A27',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 15,
    borderWidth: 1.5,
    borderColor: '#2D5A27',
  },
  resetButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2D5A27',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 13,
    color: '#B8D4B0',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
