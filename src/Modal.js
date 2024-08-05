import React, { useRef } from 'react';
import './Modal.css';

const Modal = ({ show, onClose, children }) => {
  const contentRef = useRef(null);

  if (!show) {
    return null;
  }

  const handleCopy = () => {
    const textToCopy = contentRef.current.innerText;
    navigator.clipboard.writeText(textToCopy).then(() => {
      // alert('内容がクリップボードにコピーされました');
    }).catch(err => {
      console.error('コピーに失敗しました:', err);
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div ref={contentRef}>
          {children}
        </div>
        <div className="modal-footer">
          <button className="modal-close" onClick={onClose} style={{ marginRight: '1px' }}>閉じる</button>
          <button className="modal-copy" onClick={handleCopy}>コピー</button>
        </div>
      </div>
    </div>
  );
};

export default Modal;