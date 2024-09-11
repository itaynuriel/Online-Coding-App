import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Editor } from '@monaco-editor/react';
import { io } from 'socket.io-client';
import './CodeBlockPage.css';

const CodeBlockPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);
  const [code, setCode] = useState('// Write your code here\n');
  const [isMentor, setIsMentor] = useState(false);
  const [canEdit, setCanEdit] = useState(true);
  const [studentsInRoom, setStudentsInRoom] = useState(1);
  const [solution, setSolution] = useState(''); // Solution state
  const [showSmiley, setShowSmiley] = useState(false); // Smiley face state

  // Function to convert escape characters like \n into actual newlines
const formatCode = (str) => {
    return str.replace(/\\n/g, '\n');
  };

  useEffect(() => {
    const fetchCodeBlock = async () => {
      try {
        const response = await fetch(`http://localhost:4000/api/getCodeBlocks`);
        const codeBlocks = await response.json();
        const selectedBlock = codeBlocks.find(block => block._id === id); // Match the room id with the block id
        if (selectedBlock) {
            setCode(formatCode(selectedBlock.code)); // Set the code with proper formatting
            setSolution(formatCode(selectedBlock.solution)); // Set the solution with proper formatting
          }
      } catch (err) {
        console.error("Error fetching code block: ", err);
      }
    };

    fetchCodeBlock();
  }, [id]);



  useEffect(() => {
    const newSocket = io('http://localhost:4000');
    setSocket(newSocket);
    newSocket.emit('join-room', { roomId: id });

    newSocket.on('assign-role', (data) => {
      setIsMentor(data.role === 'mentor');
      setCanEdit(data.editable);
    });

    newSocket.on('code-update', (newCode) => {
      setCode(newCode);
    });

    newSocket.on('student-count', (count) => {
      setStudentsInRoom(count);
    });

    newSocket.on('mentor-left', () => {
      alert('The mentor has left the room. Redirecting to lobby.');
      navigate('/');
    });

    newSocket.on('solution', (solution) => {
      console.log("Received solution: ", solution); 
      setSolution(solution); // Set solution when received from server
    });

    return () => {
      newSocket.close();
    };
  }, [id, navigate]);

  const handleCodeChange = (newCode) => {
    setCode(newCode);
    if (canEdit) {
      socket.emit('code-update', { roomId: id, code: newCode });
    }
  };

  // Controlled normalization to only trim and remove unnecessary whitespaces
  const normalizeCode = (str) => {
    return str
      .replace(/\/\/.*$/gm, '')       // Remove single-line comments
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
      .replace(/[ ]{2,}/g, ' ')       // Replace multiple spaces with one
      .trim();                         // Trim leading
  };

  useEffect(() => {
    const normalizedCode = normalizeCode(code);
    const normalizedSolution = normalizeCode(solution);

    console.log("Student's Code:", normalizedCode);

    // Check if the normalized code and solution match
    if (normalizedCode && normalizedCode === normalizedSolution) {
      setShowSmiley(true); // Show smiley if code matches solution
    } else {
      setShowSmiley(false); // Hide smiley if there's no match
    }
  }, [code, solution]); // Effect runs when code or solution changes

  const codeTitles = {
    "66e0432df71179d1da9f32c6": "Async Case",
    "66e0432df71179d1da9f32c7": "Promises",
    "66e0432df71179d1da9f32c8": "Closures",
    "66e0432df71179d1da9f32c9": "Callbacks"
  };

  const currentTitle = codeTitles[id] || "Unknown Code Block"; 

  return (
    <div className="codeblock-container">
      <h1>{currentTitle}</h1>
      <p>Role: {isMentor ? 'Mentor' : 'Student'}</p>
      <p>Students in Room: {studentsInRoom}</p>

      <Editor
        height="400px"
        language="javascript"
        value={code}
        onChange={handleCodeChange}
        options={{ readOnly: !canEdit }}
      />
      {showSmiley && <div className="smiley-face" style={{ fontSize: '150px' }}>😊</div>}
    </div>
  );
};

export default CodeBlockPage;
