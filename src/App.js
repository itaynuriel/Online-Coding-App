import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Lobby from './Lobby';
import CodeBlockPage from './CodeBlockPage';

function App() {
  return (
    <Router>
      <Routes>
        {/* Default route to the Lobby page */}
        <Route path="/" element={<Lobby />} />
        {/* Route for individual Code Block pages */}
        <Route path="/codeblock/:id" element={<CodeBlockPage />} />
      </Routes>
    </Router>
  );
}

export default App;
