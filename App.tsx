import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { getChatResponse, GeminiError } from './lib/gemini';
import { MessageCircle, Sparkles } from 'lucide-react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { WelcomeScreen } from './components/WelcomeScreen';

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  error?: boolean;
  timestamp: Date;
}

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateMessageId = () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;

    const newMessage: Message = {
      id: generateMessageId(),
      text: message,
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setIsLoading(true);

    try {
      const response = await getChatResponse(message);
      const botMessage: Message = {
        id: generateMessageId(),
        text: response,
        isBot: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage = error instanceof GeminiError
        ? error.message
        : 'An unexpected error occurred. Please try again.';
      
      const errorBotMessage: Message = {
        id: generateMessageId(),
        text: errorMessage,
        isBot: true,
        error: true,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorBotMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-blue-500" />
              <h1 className="text-xl font-semibold">mist.ai</h1>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto min-h-[calc(100vh-4rem)] flex flex-col bg-white shadow-sm">
          <div className="flex-1 overflow-y-auto">
            {messages.length === 0 ? (
              <WelcomeScreen onExampleClick={handleSendMessage} />
            ) : (
              <div className="space-y-4 py-4">
                {messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    message={message.text}
                    isBot={message.isBot}
                    error={message.error}
                    timestamp={message.timestamp}
                  />
                ))}
                {isLoading && (
                  <ChatMessage
                    message="Thinking..."
                    isBot={true}
                    timestamp={new Date()}
                    isLoading={true}
                  />
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
          <ChatInput
            onSendMessage={handleSendMessage}
            disabled={isLoading}
          />
        </main>
      </div>
    </ErrorBoundary>
  );
}

export default App;