import React from 'react';
import { Routes, Route } from 'react-router-dom';
import CharacterSelection from './pages/CharacterSelection';
import ChatPage from './pages/ChatPage';

function App() {
  return (
    <div className="app-container">
      <header>
        <h1>AI角色扮演</h1>
        <p>与你最爱的角色进行语音对话</p>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<CharacterSelection />} />
          <Route path="/chat/:characterId" element={<ChatPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;