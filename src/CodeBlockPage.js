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

  return (
    <div className="codeblock-container">
      <h1>Code Block {id}</h1>
      <p>Role: {isMentor ? 'Mentor' : 'Student'}</p>
      <p>Students in Room: {studentsInRoom}</p>
      <Editor
        height="400px"
        language="javascript"
        value={code}
        onChange={handleCodeChange}
        options={{ readOnly: !canEdit }}
      />
    </div>
  );
};

export default CodeBlockPage;
