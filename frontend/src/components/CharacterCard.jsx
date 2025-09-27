import React from 'react';
import { Link } from 'react-router-dom';
import './CharacterCard.css';

function CharacterCard({ character }) {
  return (
    <Link to={`/chat/${character.id}`} className="character-card-link">
      <div className="character-card">
        <img src={character.image} alt={character.name} className="character-image" />
        <div className="character-info">
          <h3>{character.name}</h3>
          <p>{character.description}</p>
        </div>
      </div>
    </Link>
  );
}

export default CharacterCard;