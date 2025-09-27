import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ChatInterface from '../components/ChatInterface';
import './ChatPage.css';

function ChatPage() {
  const { characterId } = useParams();
  const [character, setCharacter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`http://localhost:3001/api/characters/${characterId}`)
      .then(res => {
        if (!res.ok) throw new Error('Character not found');
        return res.json();
      })
      .then(data => {
        setCharacter(data);
        setLoading(false);
      })
      .catch(err => {
        setError('无法加载角色信息。');
        setLoading(false);
      });
  }, [characterId]);

  if (loading) return <div className="chat-page-status">加载中...</div>;
  if (error) return <div className="chat-page-status error-message">{error}</div>;

  return (
    <div className="chat-page-container">
      <div className="chat-header">
         <Link to="/" className="back-button">&larr; 返回</Link>
         <h2>与 {character.name} 对话</h2>
         <div className="character-avatar">
            <img src={character.image} alt={character.name} />
         </div>
      </div>
      <ChatInterface character={character} />
    </div>
  );
}

export default ChatPage;