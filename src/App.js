import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import './App.css';
import ListView from './ListView';  // ListViewをインポート
import MainApp from './MainApp';    // MainAppをインポート

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

function App() {
  const [selectedFile, setSelectedFile] = useState(null);

  const handleSelectFile = async (fileId) => {
    try {
      console.log('Fetching file data for fileId:', fileId); // デバッグ用のログ
      const response = await fetch(`http://localhost:3000/api/files/${fileId}`);
      const data = await response.json();
      console.log('File data fetched:', data); // デバッグ用のログ
      setSelectedFile(data);
    } catch (error) {
      console.error('Error fetching file data:', error);
    }
  };

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/list" element={<ListView onSelectFile={handleSelectFile} />} /> {/* ListViewのルート */}
          <Route path="/" element={<MainAppWrapper onSelectFile={handleSelectFile} selectedFile={selectedFile} />} /> {/* MainAppのルート */}
        </Routes>
      </div>
    </Router>
  );
}

function MainAppWrapper({ onSelectFile, selectedFile }) {
  const query = useQuery();
  const fileId = query.get('file-id');

  useEffect(() => {
    if (fileId) {
      onSelectFile(fileId);
    }
  }, [fileId, onSelectFile]);

  return <MainApp selectedFile={selectedFile} />;
}

export default App;