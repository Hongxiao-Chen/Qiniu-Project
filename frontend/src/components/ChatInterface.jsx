import React, { useState, useEffect, useRef } from 'react';
import './ChatInterface.css';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;
if (recognition) {
  recognition.continuous = false;
  recognition.lang = 'cmn-CN';
  recognition.interimResults = false;
}

function ChatInterface({ character }) {
  const [messages, setMessages] = useState([
    { role: 'model', parts: [{ text: `你好，我是${character.name}。有什么想对我说的吗？` }] }
  ]);
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState('');
  const audioRef = useRef(null);
  const chatHistoryRef = useRef(null);

  useEffect(() => {
    // 自动向下
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [messages]);

  const handleMicClick = () => {
    if (!recognition) {
      setError("抱歉，你的浏览器不支持语音识别。");
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
      setError('');
    }
  };

  useEffect(() => {
    if (!recognition) return;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      const userMessage = { role: 'user', parts: [{ text: transcript }] };
      setMessages(prev => [...prev, userMessage]);
      setIsThinking(true);
      getAIResponse([...messages, userMessage]);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      setError(`语音识别错误: ${event.error}`);
      setIsListening(false);
    };

    return () => {
      recognition.onresult = null;
      recognition.onend = null;
      recognition.onerror = null;
    };
  }, [messages, character.id]);

  const getAIResponse = async (currentHistory) => {
    try {
      // 1. LLM文字返回
      const chatRes = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ characterId: character.id, history: currentHistory })
      });
      if (!chatRes.ok) throw new Error('Failed to get AI text response.');
      const { text } = await chatRes.json();
      
      const aiMessage = { role: 'model', parts: [{ text }] };
      setMessages(prev => [...prev, aiMessage]);

      // 2. TTS语音返回
      const ttsRes = await fetch('http://localhost:3001/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      if (!ttsRes.ok) throw new Error('Failed to get AI audio response.');
      const { audioUrl } = await ttsRes.json();
      
      // 3. 播放音频
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
      }

    } catch (err) {
      setError(err.message);
      setMessages(prev => [...prev, { role: 'model', parts: [{ text: '抱歉，我好像出了一些问题。' }] }]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="chat-interface">
      <div className="chat-history" ref={chatHistoryRef}>
        {messages.map((msg, index) => (
          <div key={index} className={`chat-message ${msg.role === 'user' ? 'user-message' : 'ai-message'}`}>
            <p>{msg.parts[0].text}</p>
          </div>
        ))}
        {isThinking && <div className="chat-message ai-message"><p>思考中...</p></div>}
      </div>
      <div className="chat-controls">
        {error && <p className="error-text">{error}</p>}
        <button
          className={`mic-button ${isListening ? 'listening' : ''} ${isThinking ? 'thinking' : ''}`}
          onClick={handleMicClick}
          disabled={isThinking}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 14q.825 0 1.413-.588T14 12V6q0-.825-.588-1.413T12 4q-.825 0-1.413.588T10 6v6q0 .825.588 1.413T12 14Zm-1 7v-3.075q-2.6-.35-4.3-2.325T5 11H7q0 2.075 1.463 3.538T12 16q2.075 0 3.538-1.463T17 11h2q0 2.625-1.7 4.6T13 17.925V21h-2Z"/>
          </svg>
        </button>
        <p className="mic-status">
          {isThinking ? '正在生成回复...' : isListening ? '请说话...' : '点击麦克风开始对话'}
        </p>
      </div>
      <audio ref={audioRef} hidden />
    </div>
  );
}

export default ChatInterface;