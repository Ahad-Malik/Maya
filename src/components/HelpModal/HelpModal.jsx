import React from 'react';
import './HelpModal.css';

const HelpModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="help-modal-overlay" onClick={onClose}>
      <div className="help-modal-content" onClick={e => e.stopPropagation()}>
        <h1>Meet Maya: Your Personal Genius!</h1>
        <p>Welcome to Maya, your advanced AI assistant. Here's how to make the most of Maya's features:</p>

        <h2>Conversational AI and Mode Switching</h2>
        <ul>
          <li>Start a conversation with Maya in text mode.</li>
          <li>Switch to audio mode mid-conversation and continue the dialogue.</li>
          <li>Conversation history is maintained across mode switches.</li>
        </ul>

        <h2>Vision Mode</h2>
        <ul>
          <li>Enable Vision Mode from the main interface.</li>
          <li>Show Maya objects, documents, or outfits through your device's camera.</li>
          <li>Ask for descriptions, analysis, or opinions on what Maya sees.</li>
          <li>Maya can recognize multiple objects in a single frame.</li>
        </ul>

        <h2>Face Recognition</h2>
        <ul>
          <li>Upload test face images using the sidebar button.</li>
          <li>Enable face recognition in settings.</li>
          <li>Show Maya different faces (both known and unknown) through the camera.</li>
          <li>Maya can recognize and greet known faces.</li>
        </ul>

        <h2>Screen Share Mode</h2>
        <ul>
          <li>Activate Screen Share mode.</li>
          <li>Share your screen displaying code, diagrams, or research papers.</li>
          <li>Ask Maya to explain content, identify errors, or provide insights.</li>
          <li>Press Windows + PrtScn to take a screenshot during Screen Share mode.</li>
          <li>Maya automatically analyzes screenshots when asked questions in Screen Share mode.</li>
        </ul>

        <h2>Super Search</h2>
        <ul>
          <li>Enable Super Search mode.</li>
          <li>Ask about very recent news events or discoveries.</li>
          <li>Maya provides accurate and timely responses across different domains.</li>
        </ul>

        <h2>Memory and Recall</h2>
        <ul>
          <li>Ask Maya to remember specific information or journal entries.</li>
          <li>Request Maya to recall this information later in the conversation.</li>
          <li>Test with various types of data (personal notes, factual information, to-do lists).</li>
        </ul>

        <h2>Schedule Integration</h2>
        <ul>
          <li>Add tasks to Maya's schedule using the calendar interface.</li>
          <li>Ask Maya about your day's schedule in a conversational manner.</li>
          <li>Maya provides context-aware reminders and task suggestions.</li>
        </ul>

        <h2>Audio Recording</h2>
        <ul>
          <li>Press Enter to start and stop audio recording.</li>
          <li>Audio recording automatically stops after a set duration (e.g., 10 seconds).</li>
        </ul>

        <h2>Chat Summary and Long-Term Memory</h2>
        <ul>
          <li>Locate the chat summary feature in settings.</li>
          <li>Activate the feature for lengthy conversations.</li>
          <li>Request Maya to summarize key points of your conversation.</li>
          <li>Maya can recall information from previous summaries in new conversations.</li>
        </ul>

        <p>Maya is your multisensory, context-aware companion that understands your world and adapts to your needs. Enjoy exploring all of Maya's capabilities!</p>
      </div>
    </div>
  );
};

export default HelpModal;