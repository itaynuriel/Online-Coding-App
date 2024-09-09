import './Lobby.css';
import React from 'react';
import { useNavigate } from 'react-router-dom';

const Lobby = () => {
  const navigate = useNavigate();

  // code blocks with id
  const codeBlocks = [
    { id: 1, title: "Async Case" },
    { id: 2, title: "Promises" },
    { id: 3, title: "Closures" },
    { id: 4, title: "Callbacks" },
  ];

  return (
    <div className="lobby-container">
      <h1>Choose code block</h1>
      <ul>
        {codeBlocks.map((block) => (
          <li key={block.id}>
            <button onClick={() => navigate(`/codeblock/${block.id}`)}>
              {block.title}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Lobby;
