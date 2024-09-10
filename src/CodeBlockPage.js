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
      console.log(`Received solution: ${solution}`); // Debugging to verify the solution is received
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

  // Normalizing code and solution for better comparison
  useEffect(() => {
    const normalizedCode = code.replace(/\s+/g, ' ').trim();   // Normalize spaces and trim code
    const normalizedSolution = solution.replace(/\s+/g, ' ').trim();   // Normalize spaces and trim solution

    console.log("Student's Code:", normalizedCode); // Debugging to see the student's code
    console.log("Expected Solution:", normalizedSolution); // Debugging to see the expected solution

    // Compare the normalized code with the normalized solution
    if (normalizedCode === normalizedSolution) {
      setShowSmiley(true); // Show smiley if the code matches the solution
    } else {
      setShowSmiley(false); // Hide smiley if no match
    }
  }, [code, solution]); // Effect runs when code or solution changes

  const codeTitles = {
    "1": "Async Case",
    "2": "Promises",
    "3": "Closures",
    "4": "Callbacks"
  };

  return (
    <div className="codeblock-container">
      <h1>{codeTitles[id] || `Code Block ${id}`}</h1>
      <p>Role: {isMentor ? 'Mentor' : 'Student'}</p>
      <p>Students in Room: {studentsInRoom}</p>
      <Editor
        height="400px"
        language="javascript"
        value={code}
        onChange={handleCodeChange}
        options={{ readOnly: !canEdit }}
      />
      {showSmiley && <div className="smiley-face" style={{ fontSize: '100px' }}>😊</div>}
    </div>
  );
};

export default CodeBlockPage;
