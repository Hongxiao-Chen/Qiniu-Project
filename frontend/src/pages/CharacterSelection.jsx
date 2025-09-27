import React, { useState, useEffect } from 'react';
import CharacterCard from '../components/CharacterCard';
import './CharacterSelection.css';

function CharacterSelection() {
  const [characters, setCharacters] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('http://localhost:3001/api/characters')
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then(data => {
        setCharacters(data);
        setLoading(false);
      })
      .catch(error => {
        setError('无法加载角色列表，请确保后端服务已启动。');
        setLoading(false);
      });
  }, []);

  const filteredCharacters = characters.filter(character =>
    character.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="selection-container">
      <input
        type="text"
        placeholder="搜索角色 (例如：哈利)"
        className="search-bar"
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
      />
      {loading && <p>加载中...</p>}
      {error && <p className="error-message">{error}</p>}
      <div className="character-grid">
        {filteredCharacters.map(character => (
          <CharacterCard key={character.id} character={character} />
        ))}
      </div>
    </div>
  );
}

export default CharacterSelection;