import React, { useRef, useEffect, useContext } from 'react';
import { Context } from '../../context/Context';
import './modal.css';

const Modal = ({ show, onClose, faceRecognitionEnabled, toggleFaceRecognition }) => {
  const { updateFaceRecognitionSetting, aiVoiceEnabled, setAiVoiceEnabled } = useContext(Context);
  const modalRef = useRef();
  const { summarizeAndAppendChatHistory, summarizing } = useContext(Context);

  const handleFaceRecognitionToggle = () => {
    updateFaceRecognitionSetting(!faceRecognitionEnabled);
  };

  const handleAiVoiceToggle = () => {
    setAiVoiceEnabled(!aiVoiceEnabled);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (show) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [show, onClose]);

  if (!show) {
    return null;
  }

  return (
    <div className="modal-overlay">
      <div className="modal" ref={modalRef}>
        <div className="modal-header">
          <h3>Settings</h3>
          <button onClick={onClose} className="close-button">&times;</button>
        </div>
        <div className="modal-body">
          <div className="setting-item">
            <span>Face Recognition</span>
            <label className="switch">
              <input
                type="checkbox"
                checked={faceRecognitionEnabled}
                onChange={handleFaceRecognitionToggle}
              />
              <span className="slider round"></span>
            </label>
          </div>
          <div className="setting-item">
            <span>AI Voice during chat mode</span>
            <label className="switch">
              <input
                type="checkbox"
                checked={aiVoiceEnabled}
                onChange={handleAiVoiceToggle}
              />
              <span className="slider round"></span>
            </label>
          </div>
          <div className="setting-item">
            <button 
              onClick={summarizeAndAppendChatHistory}
              disabled={summarizing}
              className="summarize-button"
            >
              {summarizing ? 'Saving...' : 'Save Chat to Memory'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;