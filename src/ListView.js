import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './App.css';
import './ListView.css'; // 新しく作成したCSSファイルをインポート
import { FaArrowDown, FaArrowUp } from 'react-icons/fa';

function ListView({ onSelectFile }) {
  const [files, setFiles] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        console.log('Fetching files from API...'); // デバッグ用のログ
        const response = await fetch('http://localhost:3000/api/files');
        const data = await response.json();
        console.log('Files fetched:', data); // デバッグ用のログ
        setFiles(data);
      } catch (error) {
        console.error('Error fetching files:', error);
      }
    };

    fetchFiles();
  }, []);

  const handleFileClick = async (fileId) => {
    console.log('File clicked:', fileId); // デバッグ用のログ

    // サーバーにfileIdを送信
    await fetch('http://localhost:3000/api/logFileId', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fileId }),
    });

    await onSelectFile(fileId);
    navigate(`/?file-id=${fileId}`);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  const handleNewSlide = () => {
    window.open('http://localhost:3001/', '_blank');
  };

  return (
    <div className="App">
      <div className="header">
        <div className="logo"><span className="icon">📄</span>FOR UNOTE</div>
        <div className="toolbar">
          <button 
            style={{ backgroundColor: '#fff', border: '1px solid #b0c4de' }} 
            onClick={handleNewSlide}
            onMouseDown={(e) => e.target.style.backgroundColor = '#e0e0e0'}
            onMouseUp={(e) => e.target.style.backgroundColor = '#fff'}
          >
            New
          </button>
        </div>
      </div>
      <div className="container">
        <div className="file-list">
          {files.map((file, index) => (
            <div 
              key={index} 
              className="file-item" 
              onClick={() => {
                console.log('File item clicked:', file); // デバッグ用のログ
                handleFileClick(file.id);
              }}
            >
              <span className="icon">📄</span> {/* アイコンを表示 */}
              <span className="file-id">{file.id}</span> {/* idを表示 */}
              {file.file} {/* file名称を表示 */}
            </div>
          ))}
        </div>
      </div>
      <div className="scroll-buttons">
        <button 
          className="scroll-to-top" 
          onClick={scrollToTop}
        >
          <FaArrowUp />
        </button>
        <button 
          className="scroll-to-bottom" 
          onClick={scrollToBottom}
        >
          <FaArrowDown />
        </button>
      </div>
    </div>
  );
}

export default ListView;
