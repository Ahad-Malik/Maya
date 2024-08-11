import React, { useState, useContext } from 'react';
import './Sidebar.css';
import { assets } from '../../assets/assets';
import { Context } from '../../context/Context';
import HelpModal from '../HelpModal/HelpModal';
import MeetMayaModal from '../MeetMayaModal/MeetMayaModal';

const Sidebar = React.memo(() => {
  const [extended, setExtended] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [meetMayaModalOpen, setMeetMayaModalOpen] = useState(false);
  const { resetToDefaultView, setModalOpen } = useContext(Context);

  const handleNewChat = () => {
    resetToDefaultView();
  };

  const handleSettingsClick = () => {
    setModalOpen(true);
  };

  const handleHelpClick = () => {
    setHelpModalOpen(true);
  };

  const handleMeetMayaClick = () => {
    setMeetMayaModalOpen(true);
  };

  return (
    <>
      <div className={`sidebar ${extended ? 'extended' : ''}`}>
        <div className="top">
          <img
            onClick={() => setExtended(prev => !prev)}
            className="menu"
            src={assets.menu_icon}
            alt=""
          />
          <div className="new-chat" onClick={handleNewChat}>
            <img src={assets.refresh} alt='' />
            <p className="new-chat-text">New Chat</p>
          </div>
          {extended && (
            <div className="recent">
              <p className="recent-title">Recent</p>
              <div className="recent-entry">
                <img src={assets.message_icon} alt='' />
                <p>Who is Ahad?</p>
              </div>
            </div>
          )}
        </div>
        <div className="bottom">
        <div className="bottom-item recent-entry" onClick={handleHelpClick}>
            <img src={assets.question_icon} alt="" />
            <p>Help</p>
          </div>
          <div className="bottom-item recent-entry" onClick={handleMeetMayaClick}>
            <img src={assets.face_icon} alt="" />
            <p>Meet Maya</p>
          </div>
          <div className="bottom-item recent-entry" onClick={handleSettingsClick}>
            <img src={assets.setting_icon} alt="" />
            <p>Settings</p>
          </div>
        </div>
      </div>
      <HelpModal isOpen={helpModalOpen} onClose={() => setHelpModalOpen(false)} />
      <MeetMayaModal isOpen={meetMayaModalOpen} onClose={() => setMeetMayaModalOpen(false)} />
    </>
  );
});

export default Sidebar;