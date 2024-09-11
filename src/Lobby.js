import './Lobby.css';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL = "https://backend-online-coding-app.up.railway.app"

const Lobby = () => {
  const navigate = useNavigate();
  const [codeBlocks, setCodeBlocks] = useState([])

  async function getCodeBlocks() {
    const res = await fetch(`${BACKEND_URL}/api/getCodeBlocks`);
    
    setCodeBlocks(await res.json())
  }
  useEffect(() => {
    getCodeBlocks()
  }, [])

  // Weak code blocks with id
//   const codeBlocks = [
//     { id: 1, title: "Async Case" },
//     { id: 2, title: "Promises" },
//     { id: 3, title: "Closures" },
//     { id: 4, title: "Callbacks" },
//   ];

  return (
    <div className="lobby-container">
      <h1>Choose code block</h1>
      <ul>
        {codeBlocks.map((block) => (
          <li key={block.id}>
            <button onClick={() => navigate(`/codeblock/${block._id}`)}>
              {block.title}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Lobby;
