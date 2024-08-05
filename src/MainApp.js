import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { useLocation } from 'react-router-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { FaArrowUp, FaArrowDown } from 'react-icons/fa';
import Modal from './Modal'; 

function MainApp({ selectedFile }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const contentSet = useRef(false);
  const [fileName, setFileName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [summary, setSummary] = useState('');
  const location = useLocation();
  const contentEditableRef = useRef(null);
  const [menuPosition, setMenuPosition] = useState({ top: 1000, left: 150 });
  const [showMenu, setShowMenu] = useState(false);
  const [showModal, setShowModal] = useState(false); // ここでshowModalとsetShowModalを定義
  const [modalContent, setModalContent] = useState(''); 

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
  };

  const handlePDFExport = async () => {
    const input = document.getElementById('pdf-content');
    const canvas = await html2canvas(input, { scale: 2 }); // 高解像度でキャプチャ
    const imgData = canvas.toDataURL('image/jpeg', 0.5); // JPEG形式で圧縮
    const pdf = new jsPDF();
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
  
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${fileName || 'document'}.pdf`);
  };

  const handleModeChange = () => {
    if (contentEditableRef.current) {
      const plainText = contentEditableRef.current.innerText;
      contentEditableRef.current.innerHTML = plainText;
      setContent(plainText);
    }
  };

  const handleKeyDown = (e) => {
    if (e.metaKey && e.key === 'm') {
      e.preventDefault();
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const selectedText = range.toString(); // 選択された文字列を取得

        // サーバーに選択された文字列を送信
        fetch('http://localhost:3000/api/logSelectedText', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ selectedText }),
        });

        const rect = range.getBoundingClientRect();

        console.log('Rect:', rect);
        // サーバーにrangeとrectを送信
        fetch('http://localhost:3000/api/logSelection', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ range, rect }),
        });
        // rectの値がすべて0の場合は現在のカーソル位置のすぐ右に表示
        if ((rect.width === 0 && rect.height === 0 && rect.top === 0 && rect.right === 0 && rect.bottom === 0 && rect.left === 0) || selectedText.length > 0) {
          const cursorPosition = selection.getRangeAt(0).getBoundingClientRect();
           setMenuPosition({ top: cursorPosition.top + 10 + window.scrollY, left: cursorPosition.left + window.scrollX + 720 });
          //setMenuPosition({ top: rect.top + window.scrollY - 20, left: rect.right + window.scrollX + 20 });
        } else {
          setMenuPosition({ top: rect.top + window.scrollY - 20, left: rect.right + window.scrollX + 20 });
        }
      }
      setShowMenu((prevShowMenu) => !prevShowMenu);
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const fetchFileData = async (fileId) => {
      try {
        const response = await fetch(`http://localhost:3000/api/files/${fileId}`);
        if (response.ok) {
          const data = await response.json();
          setTitle(data.title);
          if (!contentSet.current) {
            setContent(data.content);
            if (contentEditableRef.current) {
              contentEditableRef.current.innerHTML = data.content;
            }
            contentSet.current = true;
          }
          setFileName(data.file);
        } else {
          const errorText = await response.text();
          console.error('Failed to fetch file data:', errorText);
        }
      } catch (error) {
        console.error('Error fetching file data:', error);
      }
    };

    const params = new URLSearchParams(location.search);
    const fileId = params.get('file-id');
    if (fileId) {
      fetchFileData(fileId);
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = {
      fileId: selectedFile?.id,
      title,
      content: contentEditableRef.current.innerHTML,
      file: fileName
    };
    console.log('Sending data:', data);

    try {
      const response = await fetch('http://localhost:3000/api/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        const responseData = await response.json();
        console.log('Received response:', responseData);
        setTitle(responseData.title);
        setContent(responseData.content);
        if (contentEditableRef.current) {
          contentEditableRef.current.innerHTML = responseData.content;
        }
        console.log('Data saved successfully');
        setErrorMessage('');
      } else {
        const errorText = await response.text();
        console.error('Failed to save data:', errorText);
        setErrorMessage(`Failed to save data: ${errorText}`);
      }
    } catch (error) {
      console.error('Error:', error);
      setErrorMessage(`Error: ${error.message}`);
    }
  };

  const handleNewSlide = () => {
    window.open('http://localhost:3001/', '_blank');
  };

  // const changeFontSize = (increase) => {
  //   const selection = window.getSelection();
  //   if (!selection.rangeCount) return;

  //   const range = selection.getRangeAt(0);
  //   const span = document.createElement('span');
  //   const currentSize = window.getComputedStyle(range.startContainer.parentElement).fontSize;
  //   const newSize = increase ? parseInt(currentSize) + 2 : parseInt(currentSize) - 2;

  //   span.style.fontSize = `${newSize}px`;
  //   span.appendChild(range.extractContents());
  //   range.insertNode(span);

  //   const newRange = document.createRange();
  //   newRange.setStart(span, 0);
  //   newRange.setEnd(span, span.childNodes.length);
  //   selection.removeAllRanges();
  //   selection.addRange(newRange);
  // };

  const handleSummary = async () => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const selectedText = selection.toString();
      console.log('選択されたテキスト:', selectedText); // 選択されたテキストをログに記録
      try {
        console.log('要約APIを呼び出します');
        const response = await fetch('http://localhost:3000/api/summarize', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: selectedText }),
        });

        console.log('要約APIのレスポンスステータス:', response.status);
        if (response.ok) {
          const data = await response.json();
          const summary = data.summary;

          // デバッグ用ログ
          console.log('Summary:', summary);

          // サーバーにログを送信
          await fetch('http://localhost:3000/api/logSummary', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ summary }),
          });

          // モーダルの内容を設定して表示
          setModalContent(summary);
          setShowModal(true);
          console.log('モーダルを表示します');
        } else {
          console.error('Failed to fetch summary:', response.statusText);
        }
      } catch (error) {
        console.error('Error fetching summary:', error);
      }
    }
  };

  const handlePlainText = () => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const plainText = range.toString();
      range.deleteContents();
      const textNode = document.createTextNode(plainText);
      range.insertNode(textNode);
      range.selectNodeContents(textNode);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  };

  const handleAsk = async () => {
    const question = prompt('質問を入力してください:');
    const contextId = prompt('使用するコンテキストのIDを入力してください:');
  
    if (!question || !contextId) {
      alert('質問とコンテキストのIDが必要です');
      return;
    }
  
    try {
      const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question, contextId }),
      });
  
      if (response.ok) {
        const data = await response.json();
        console.log('\n回答:\n', data.answer);
        setModalContent(data.answer); // モーダルの内容を設定
        setShowModal(true); // モーダルを表示
      } else {
        const errorText = await response.text();
        console.error('質問の送信に失敗しました:', errorText);
        alert('質問の送信に失敗しました');
      }
    } catch (error) {
      console.error('質問の送信エラー:', error);
      alert('質問の送信に失敗しました');
    }
  };

  const handleNewSummary = async () => {
    const selectedText = prompt('要約するテキストを入力してください:');
  
    if (!selectedText) {
      alert('要約するテキストが必要です');
      return;
    }
  
    try {
      const response = await fetch('http://localhost:3000/api/newSummarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: selectedText }),
      });
  
      if (response.ok) {
        const data = await response.json();
        console.log('\n要約:\n', data.summary);
        setModalContent(data.summary.replace(/\n/g, '<br>')); // モーダルの内容を設定
        setShowModal(true); // モーダルを表示
      } else {
        const errorText = await response.text();
        console.error(`要約の送信に失敗しました: ${response.status} ${response.statusText} - ${errorText}`);
        alert(`要約の送信に失敗しました: ${response.status} ${response.statusText} - ${errorText}`);
  
        // サーバーにエラーログを送信
        await fetch('http://localhost:3000/api/logError', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            errorText,
            status: response.status,
            statusText: response.statusText,
          }),
        });
      }
    } catch (error) {
      console.error('要約の送信エラー:', error);
      alert('要約の送信に失敗しました');
  
      // サーバーにエラーログを送信
      await fetch('http://localhost:3000/api/logError', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          errorText: error.message,
          status: 'Network Error',
          statusText: 'Network Error',
          stack: error.stack, // エラースタックトレースを追加
        }),
      });
    }
  };

  const changeFontSize = (size) => {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const span = document.createElement('span');
    span.style.fontSize = `${size}px`;
    span.appendChild(range.extractContents());
    range.insertNode(span);

    const newRange = document.createRange();
    newRange.setStart(span, 0);
    newRange.setEnd(span, span.childNodes.length);
    selection.removeAllRanges();
    selection.addRange(newRange);
  };

  const handleFontSizeChange = (e) => {
    const size = e.target.value;
    changeFontSize(size);
  };

  const handleSQL = async () => {
    const question = prompt('どんなSQLを提案してほしいか？');
    const contextIds = prompt('使用するコンテキストのIDをカンマ区切りで入力してください:');
  
    if (!question || !contextIds) {
      alert('質問とコンテキストのIDが必要です');
      return;
    }
  
    const contextIdArray = contextIds.split(',').map(id => id.trim());
    let combinedContent = '';
  
    try {
      for (const contextId of contextIdArray) {
        const response = await fetch(`http://localhost:3000/api/files/${contextId}`);
        if (response.ok) {
          const data = await response.json();
          combinedContent += data.content + '\n';
        } else {
          const errorText = await response.text();
          console.error(`Failed to fetch file data for ID ${contextId}:`, errorText);
        }
      }
  
      const response = await fetch('http://localhost:3000/api/sqlChat', { // 新しいAPIエンドポイントを使用
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question, context: combinedContent }),
      });
  
      if (response.ok) {
        const data = await response.json();
        console.log('\n回答:\n', data.answer);
        setModalContent(data.answer.replace(/\n/g, '<br>')); // モーダルの内容を設定
        setShowModal(true); // モーダルを表示
      } else {
        const errorText = await response.text();
        console.error('質問の送信に失敗しました:', errorText);
        alert('質問の送信に失敗しました');
      }
    } catch (error) {
      console.error('質問の送信エラー:', error);
      alert('質問の送信に失敗しました');
    }
  };

  return (
    <div className="App">
      <div className="header fixed-header">
        <div className="left-section">
          <span className="icon">📄</span>
          <span
            className="file-id-label"
            style={{
              marginLeft: '10px',
              fontSize: '28px',
              verticalAlign: 'middle',
            }}
          >
            {selectedFile?.id || ''}
          </span>
          <input
            type="text"
            className="file-name"
            style={{
              width: '1000px',
              height: '30px',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              borderBottom: '1px solid #e0e0e0',
              marginLeft: '10px',
              fontSize: '28px',
            }}
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
          />
        </div>
        <div className="toolbar">
          <button
            style={{
              backgroundColor: '#fff',
              border: '1px solid #b0c4de',
            }}
            onClick={handleNewSlide}
            onMouseDown={(e) => (e.target.style.backgroundColor = '#e0e0e0')}
            onMouseUp={(e) => (e.target.style.backgroundColor = '#fff')}
          >
            New
          </button>
          {/* <button
            style={{
              backgroundColor: '#fff',
              border: '1px solid #b0c4de',
            }}
            onClick={handleModeChange}
            onMouseDown={(e) => (e.target.style.backgroundColor = '#e0e0e0')}
            onMouseUp={(e) => (e.target.style.backgroundColor = '#fff')}
          >
            Plain
          </button> */}
          <button
            style={{
              backgroundColor: '#fff',
              border: '1px solid #b0c4de',
            }}
            onClick={handlePDFExport}
            onMouseDown={(e) => (e.target.style.backgroundColor = '#e0e0e0')}
            onMouseUp={(e) => (e.target.style.backgroundColor = '#fff')}
          >
            PDF
          </button>
          <button
            style={{
              backgroundColor: '#fff',
              border: '1px solid #b0c4de',
            }}
            onClick={handleSubmit}
            onMouseDown={(e) => (e.target.style.backgroundColor = '#e0e0e0')}
            onMouseUp={(e) => (e.target.style.backgroundColor = '#fff')}
          >
            Save
          </button>
        </div>
      </div>
      <div className="container" id="pdf-content">
        <div className="main-content" style={{ paddingTop: '5px' }}>
          <div className="slide">
            {/* <input
              type="text"
              className="title transparent-background"
              placeholder=""
              value={`${title}`}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: '100%',
                borderTop: 'none',
                borderLeft: 'none',
                borderRight: 'none',
                borderBottom: '1px solid #b0c4de',
                fontSize: '24px',
                marginBottom: '5px',
              }}
            /> */}
            <div
              className="content notebook-background"
              contentEditable="true"
              data-=""
              ref={contentEditableRef}
              style={{
                minHeight: 'calc(100vh - 200px)',
                borderTop: 'none',
                borderLeft: 'none',
                borderRight: 'none',
                borderBottom: '1px solid #e0e0e0',
              }}
            ></div>
          </div>
          {errorMessage && <div className="error-message">{errorMessage}</div>}
        </div>
        <button className="scroll-to-top" onClick={scrollToTop}>
          <FaArrowUp />
        </button>
        <button className="scroll-to-bottom" onClick={scrollToBottom}>
          <FaArrowDown />
        </button>
        {showMenu && (
          <div
          className="selection-menu"
          style={{
            position: 'absolute',
            top: `${menuPosition.top}px`,
            left: `${menuPosition.left}px`,
            backgroundColor: '#fff',
            border: '1px solid #b0c4de',
            padding: '5px',
            zIndex: 1000,
          }}
        >
          <select style={{ margin: '1px' }} onChange={handleFontSizeChange} defaultValue="20">
            {Array.from({ length: 100 }, (_, i) => i + 1).map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <button style={{ margin: '1px' }} onClick={handlePlainText}>Plain</button>
          <button style={{ margin: '1px' }} onClick={() => document.execCommand('bold', false, null)}>Bold</button>
          <button style={{ margin: '1px' }} onClick={() => document.execCommand('underline', false, null)}>Underline</button>
          <button style={{ margin: '1px' }} onClick={handleAsk}>Ask</button>
          <button style={{ margin: '1px' }} onClick={handleSummary}>Summary</button>
          <button style={{ margin: '1px' }} onClick={handleSQL}>SQL</button> 
          {/* <button style={{ margin: '1px' }} onClick={handleNewSummary}>New Summary</button> 新しい要約ボタンを追加 */}
        </div>
        )}
      </div>
      <Modal show={showModal} onClose={() => setShowModal(false)}>
          <div style={{ textAlign: 'left' }}>
              <p dangerouslySetInnerHTML={{ __html: modalContent }}></p>
          </div>
      </Modal>
    </div>
  );
}

export default MainApp;
