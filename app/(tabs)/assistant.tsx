import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Button, Text, TextInput, Card, ActivityIndicator, Chip } from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export default function AssistantScreen() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileUri, setFileUri] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const pickPdf = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
      if (res.assets && res.assets[0]) {
        setFileName(res.assets[0].name);
        setFileUri(res.assets[0].uri);
        
        // Add welcome message
        const welcomeMsg: Message = {
          id: Date.now(),
          role: 'assistant',
          content: `Hello! I've loaded "${res.assets[0].name}". You can now ask me questions about this PDF. Try asking:\n\n• Summarize this document\n• What are the key points?\n• Explain chapter 2\n• Create flashcards from this content`,
          timestamp: new Date().toLocaleTimeString(),
        };
        setMessages([welcomeMsg]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load PDF');
    }
  };

  const quickQuestions = [
    'Summarize this document',
    'What are the key points?',
    'Create study notes',
    'Generate flashcards',
  ];

  const askAI = async (customQuestion?: string) => {
    const questionText = customQuestion || question;
    if (!questionText.trim()) {
      Alert.alert('Empty Question', 'Please enter a question');
      return;
    }

    // Add user message
    const userMsg: Message = {
      id: Date.now(),
      role: 'user',
      content: questionText,
      timestamp: new Date().toLocaleTimeString(),
    };
    setMessages([...messages, userMsg]);
    setQuestion('');
    setLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: Date.now() + 1,
        role: 'assistant',
        content: generateAIResponse(questionText),
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, aiResponse]);
      setLoading(false);
    }, 1500);
  };

  const generateAIResponse = (question: string): string => {
    const lowerQ = question.toLowerCase();
    
    if (lowerQ.includes('summarize') || lowerQ.includes('summary')) {
      return `📝 **Summary of ${fileName}**\n\nThis PDF contains important information organized into several sections:\n\n1. **Introduction**: Overview of the main topic\n2. **Key Concepts**: Core ideas and principles\n3. **Examples**: Practical applications\n4. **Conclusion**: Final thoughts and recommendations\n\nThe document emphasizes practical learning and provides actionable insights for students.`;
    }
    
    if (lowerQ.includes('key points') || lowerQ.includes('main points')) {
      return `🎯 **Key Points**:\n\n✓ Understanding fundamental concepts is crucial\n✓ Practice makes perfect - apply what you learn\n✓ Review regularly to retain information\n✓ Connect new knowledge with existing understanding\n✓ Ask questions when something is unclear`;
    }
    
    if (lowerQ.includes('flashcard') || lowerQ.includes('flash card')) {
      return `🃏 **Generated Flashcards**:\n\n**Card 1**\nQ: What is the main topic?\nA: [Key concept from the document]\n\n**Card 2**\nQ: Why is this important?\nA: [Significance and applications]\n\n**Card 3**\nQ: How can this be applied?\nA: [Practical examples]\n\nWould you like more flashcards on specific topics?`;
    }
    
    if (lowerQ.includes('notes') || lowerQ.includes('note')) {
      return `📚 **Study Notes**:\n\n## Main Topics\n- Topic 1: Core concepts and definitions\n- Topic 2: Important principles\n- Topic 3: Applications and examples\n\n## Important Points\n→ Remember to review regularly\n→ Practice with examples\n→ Connect concepts together\n\n## Action Items\n☐ Review chapter summary\n☐ Complete practice exercises\n☐ Discuss with study group`;
    }
    
    return `I understand you're asking about "${question}". \n\nBased on the PDF content, here's what I can tell you:\n\nThis is a demonstration of the AI Assistant feature. In a production environment, this would:\n\n1. Extract text from your PDF using OCR\n2. Send the context to an AI model (OpenAI, Claude, etc.)\n3. Generate intelligent, context-aware responses\n4. Provide summaries, explanations, and study aids\n\nThe AI can help you:\n• Understand complex topics\n• Create study materials\n• Answer specific questions\n• Generate practice questions\n\nFeel free to ask more questions!`;
  };

  const clearChat = () => {
    Alert.alert(
      'Clear Chat',
      'Remove all messages?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: () => setMessages([]) }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Card style={styles.headerCard}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.title}>🤖 AI Assistant for PDFs</Text>
          <Text style={styles.subtitle}>
            Chat with your PDF - ask questions, get summaries, create study materials
          </Text>
        </Card.Content>
      </Card>

      <Button 
        mode="contained" 
        onPress={pickPdf} 
        icon="file-pdf-box"
        style={styles.button}
      >
        {fileName ? 'Change PDF' : 'Pick PDF to Chat'}
      </Button>

      {fileName && (
        <>
          <Card style={styles.infoCard}>
            <Card.Content>
              <Text variant="titleMedium">📄 {fileName}</Text>
              <Text style={styles.chatCount}>{messages.length} messages</Text>
            </Card.Content>
          </Card>

          <ScrollView style={styles.chatContainer} contentContainerStyle={styles.chatContent}>
            {messages.map((msg) => (
              <View
                key={msg.id}
                style={[
                  styles.messageBubble,
                  msg.role === 'user' ? styles.userBubble : styles.assistantBubble
                ]}
              >
                <Text style={styles.messageRole}>
                  {msg.role === 'user' ? '👤 You' : '🤖 AI Assistant'}
                </Text>
                <Text style={styles.messageText}>{msg.content}</Text>
                <Text style={styles.messageTime}>{msg.timestamp}</Text>
              </View>
            ))}
            {loading && (
              <View style={styles.loadingBubble}>
                <ActivityIndicator size="small" />
                <Text style={styles.loadingText}>AI is thinking...</Text>
              </View>
            )}
          </ScrollView>

          {messages.length === 0 && (
            <View style={styles.quickQuestionsContainer}>
              <Text variant="titleSmall" style={styles.quickTitle}>Quick Questions:</Text>
              <View style={styles.quickButtons}>
                {quickQuestions.map((q, index) => (
                  <Chip
                    key={index}
                    onPress={() => askAI(q)}
                    style={styles.quickChip}
                  >
                    {q}
                  </Chip>
                ))}
              </View>
            </View>
          )}

          <View style={styles.inputContainer}>
            <TextInput
              mode="outlined"
              value={question}
              onChangeText={setQuestion}
              placeholder="Ask a question about your PDF..."
              style={styles.input}
              multiline
              right={
                <TextInput.Icon
                  icon="send"
                  onPress={() => askAI()}
                  disabled={!question.trim() || loading}
                />
              }
            />
          </View>

          {messages.length > 0 && (
            <Button 
              mode="outlined" 
              onPress={clearChat}
              icon="delete"
              textColor="#ff595e"
              style={styles.clearButton}
            >
              Clear Chat
            </Button>
          )}
        </>
      )}

      {!fileName && (
        <Card style={styles.emptyCard}>
          <Card.Content style={styles.emptyContent}>
            <Text variant="headlineMedium">🤖</Text>
            <Text variant="titleMedium">No PDF loaded</Text>
            <Text style={styles.emptyText}>
              Pick a PDF to start chatting with AI and get instant answers to your questions
            </Text>
          </Card.Content>
        </Card>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 16, backgroundColor: '#f8f9fa' },
  headerCard: { backgroundColor: '#f0f0f0', borderRadius: 16 },
  title: { fontWeight: 'bold', color: '#6c757d' },
  subtitle: { opacity: 0.7, marginTop: 4 },
  button: { borderRadius: 12 },
  infoCard: { backgroundColor: '#fff', borderRadius: 12, elevation: 2 },
  chatCount: { opacity: 0.7, marginTop: 4 },
  chatContainer: { flex: 1, maxHeight: 400 },
  chatContent: { gap: 12, paddingBottom: 12 },
  messageBubble: { padding: 12, borderRadius: 12, maxWidth: '85%' },
  userBubble: { alignSelf: 'flex-end', backgroundColor: '#0fb5b1' },
  assistantBubble: { alignSelf: 'flex-start', backgroundColor: '#f8f9fa' },
  messageRole: { fontSize: 12, fontWeight: 'bold', marginBottom: 4 },
  messageText: { lineHeight: 20 },
  messageTime: { fontSize: 10, opacity: 0.6, marginTop: 4 },
  loadingBubble: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12 },
  loadingText: { opacity: 0.7 },
  quickQuestionsContainer: { gap: 8 },
  quickTitle: { fontWeight: '600' },
  quickButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quickChip: {},
  inputContainer: { },
  input: { },
  clearButton: { borderRadius: 12 },
  emptyCard: { backgroundColor: '#f8f9fa', borderRadius: 12, marginTop: 24 },
  emptyContent: { alignItems: 'center', paddingVertical: 32 },
  emptyText: { textAlign: 'center', opacity: 0.7, marginTop: 8 }
});
