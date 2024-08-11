import React, { useContext, useEffect, useRef, Suspense, useMemo, useCallback, useState } from 'react';
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial, Preload, Text as DreiText, Box } from "@react-three/drei";
import * as random from 'maath/random/dist/maath-random.esm';
import './Main.css';
import { assets } from '../../assets/assets';
import { Context } from '../../context/Context';
import Modal from '../Modal/modal';
import Spline from '@splinetool/react-spline';
import ModernBlueWaveform from '../ModernBlueWaveform/ModernBlueWaveform';
import AIProcessingAnimation from '../AIProcessingAnimation/AIProcessingAnimation';
import ScheduleModal from '../Schedule/ScheduleModal';
import HelpModal from '../HelpModal/HelpModal';

const StarField = React.memo(() => {
  const ref = useRef();
  const sphere = useMemo(() => random.inSphere(new Float32Array(5000), { radius: 1.2 }), []);

  useFrame((state, delta) => {
    ref.current.rotation.x -= delta / 10;
    ref.current.rotation.y -= delta / 15;
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere} stride={3} frustumCulled>
        <PointMaterial
          transparent
          color="#f272c8"
          size={0.002}
          sizeAttenuation={true}
          depthWrite={false}
        />
      </Points>
    </group>
  );
});

const Background = () => {
  return (
    <Canvas 
      camera={{ position: [0, 0, 1] }}
      style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%'}}
    >
      <Suspense fallback={null}>
        <StarField />
      </Suspense>
      <Preload all />
    </Canvas>
  );
};

const AudioModeCanvas = React.memo(() => {
  return (
    <div style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%'}}>
      <Spline scene="https://prod.spline.design/DXesucsHN4Y89nDE/scene.splinecode" />
    </div>
  );
});

const AudioModeButton = ({ icon, onClick, isActive }) => (
  <button
    className={`audio-mode-button ${isActive ? 'active' : ''}`}
    onClick={onClick}
  >
    <img src={icon} alt=''/>
  </button>
);

const Main = () => {
  const { 
    onSent, 
    recentPrompt, 
    showResult, 
    setShowResult,
    loading, 
    resultData, 
    setInput, 
    input, 
    visionMode, 
    updateVisionMode,
    setVisionMode,
    powerSearchMode,
    setPowerSearchMode,
    faceRecognition,
    setFaceRecognition,
    resetToDefaultView,
    modalOpen,
    setModalOpen,
    screenshareMode,
    setScreenshareMode,
    audioMode,
    setAudioMode,
    isRecording,
    startRecording,
    stopRecording,
    processQuery,
    processAudioWithMode,
    isSessionLoading, 
    startChat, 
    tasks,
    fetchTasks,
    addTask,
    updateTask,
    deleteTask,
    scheduleModalOpen, 
    setScheduleModalOpen,
    handleScheduleOpen,
    isAIProcessing,
  } = useContext(Context);

  const resultRef = useRef(null);
  const [audioTranscript, setAudioTranscript] = useState('');
  const [modelResponse, setModelResponse] = useState('');
  const [processedAudioResult, setProcessedAudioResult] = useState('');
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [showButtons, setShowButtons] = useState(false);
  const [activeMode, setActiveMode] = useState('chat');
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [audioViewState, setAudioViewState] = useState('idle');

  useEffect(() => {
    if (!isSessionLoading) {
      startChat();
    }
  }, [isSessionLoading, startChat]);

  const handleMouseEnter = useCallback(() => {
    setShowButtons(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setShowButtons(false);
  }, []);
  
  useEffect(() => {
    if (resultRef.current) {
      resultRef.current.scrollTop = resultRef.current.scrollHeight;
    }
  }, [resultData, processedAudioResult]);

  useEffect(() => {
    if (audioMode) {
      processAudioResult(resultData);
    }
  }, [audioTranscript, modelResponse, audioMode, resultData]);

  const processInputBasedOnMode = () => {
    let mode = 'chat';
    if (visionMode) mode = 'vision';
    else if (screenshareMode) mode = 'screenshare';
    else if (powerSearchMode) mode = 'supersearch';
    processQuery(input, mode, faceRecognition);
  };

  const handleSend = useCallback(() => {
    if (input.trim() !== '') {
      processInputBasedOnMode();
      setInput('');
    }
  }, [input, processInputBasedOnMode]);

  const CardButton = ({ text, icon, onClick, isActive }) => (
    <button
      className={`card ${isActive ? 'active' : ''}`}
      onClick={onClick}
    >
      <p>{text}</p>
      <img src={icon} alt=''/>
    </button>
  );

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (audioMode) {
        if (isRecording) {
          stopRecording();
        } else {
          startRecording();
        }
      } else if (input.trim() !== '') {
        handleSend();
      }
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [audioMode, isRecording, input, handleSend, startRecording, stopRecording]);

  const toggleModal = () => {
    setModalOpen(!modalOpen);
  };

  const handleHelpClick = () => {
    setHelpModalOpen(true);
  };

  const toggleFaceRecognition = () => {
    setFaceRecognition(!faceRecognition);
  };

  const toggleAudioMode = () => {
    setAudioMode(!audioMode);
    if (audioMode) {
      setActiveMode('chat');
    }
  };

  const processAudioResult = (text) => {
    let processedText = text.split("**").map((part, index) => 
      index % 2 === 1 ? `<b>${part}</b>` : part
    ).join("");
    
    processedText = processedText.split('\n').map(line => {
      if (line.trim().startsWith('* ')) {
        return '<br>•' + line.slice(2);
      } else {
        return line.replace(/\*(\S[^*]*\S)\*/g, '<i>$1</i>');
      }
    }).join('\n');

    setProcessedAudioResult(processedText);
    setCurrentWordIndex(0);
  };

  useEffect(() => {
    if (audioMode && processedAudioResult) {
      const words = processedAudioResult.split(' ');
      const interval = setInterval(() => {
        if (currentWordIndex < words.length) {
          setCurrentWordIndex(prevIndex => prevIndex + 1);
        } else {
          clearInterval(interval);
        }
      }, 80);

      return () => clearInterval(interval);
    }
  }, [audioMode, processedAudioResult, currentWordIndex]);

  const handleModeChange = (mode) => {
    if (activeMode === mode) {
        setActiveMode('chat');
        updateVisionMode(false);
        setScreenshareMode(false);
        setPowerSearchMode(false);
    } else {
        setActiveMode(mode);
        updateVisionMode(mode === 'vision');
        setScreenshareMode(mode === 'screenshare');
        setPowerSearchMode(mode === 'supersearch');
    }
};

  const handleAudioModeButtonClick = (mode) => {
    if (isRecording) {
      stopRecording();
    }
    handleModeChange(mode);
  };

  useEffect(() => {
    if (audioMode) {
      setShowResult(false);
    }
  }, [audioMode]);

  useEffect(() => {
    if (isRecording) {
      setAudioViewState('listening');
    } else if (isAIProcessing) {
      setAudioViewState('processing');
    } else {
      setAudioViewState('idle');
    }
  }, [isRecording, isAIProcessing]);

  return (
    <div className='main'>
      <Background />
      <div className="nav">
        <p>Maya</p>
        <div className="nav-icons">
          <button onClick={toggleAudioMode} className="audio-toggle">
          <img src={audioMode ? assets.text : assets.sound} alt="Toggle audio mode"/>
          </button>
          <img src={assets.user_icon} alt=''/>
        </div>
      </div>
      <div className={`main-container ${showResult && !audioMode ? 'result-view' : audioMode ? 'audio-view' : 'default'}`}>
        {/* Default View */}
        <div className={`default-view ${!showResult && !audioMode ? '' : 'hidden'}`}>
          <div className="content-wrapper">
          <CardButton
              text="Super Search"
              icon={assets.compass_icon}
              onClick={() => handleModeChange('supersearch')}
              isActive={activeMode === 'supersearch'}
            />
            <div className="greet">
              <p><span>Heyy, Ahad!</span></p>
              <p>How can I help you?</p>
            </div>
            <CardButton
              text={`Vision Mode`}
              icon={assets.bulb_icon}
              onClick={() => handleModeChange('vision')}
              isActive={activeMode === 'vision'}
            />
          </div>
          <div className="bottom-cards">
            <CardButton
              text="Screenshare"
              icon={assets.screenshare}
              onClick={() => handleModeChange('screenshare')}
              isActive={activeMode === 'screenshare'}
            />
            <CardButton
              text="Schedule"
              icon={assets.calendar}
              onClick={handleScheduleOpen}
            />
          </div>
        </div>

        {/* Result View */}
        <div className={`result ${showResult && !audioMode ? '' : 'hidden'}`} ref={resultRef}>
          <div className="result-title">
            <img src={assets.user_icon} alt="" />
            <p>{recentPrompt}</p>
          </div>
          <div className="result-data">
            <img src={assets.maya_icon} alt="" />
            {loading ? (
              <div className="loader">
                <hr />
                <hr />
                <hr />
              </div>
            ) : (
              <p dangerouslySetInnerHTML={{__html: resultData}}></p>
            )}
          </div>
        </div>

        {/* Audio View */}
        <div 
    className={`audio-view ${audioMode ? '' : 'hidden'}`}
    onMouseEnter={handleMouseEnter}
    onMouseLeave={handleMouseLeave}
  >
    {audioViewState === 'idle' && (
      <div style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%'}}>
        <AudioModeCanvas/>
      </div>
    )}
    {audioViewState === 'listening' && (
      <div style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%'}}>
        <ModernBlueWaveform />
      </div>
    )}
    {audioViewState === 'processing' && (
      <div style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%'}}>
        <AIProcessingAnimation />
      </div>
    )}
    <div className={`audio-mode-buttons ${showButtons ? '' : 'hide'}`}>
        <AudioModeButton
              icon={assets.screenshare}
              onClick={() => handleAudioModeButtonClick('screenshare')}
              isActive={activeMode === 'screenshare'}
              label="Screenshare"
            />
          <AudioModeButton
            icon={assets.bulb_icon}
            onClick={() => handleAudioModeButtonClick('vision')}
            isActive={activeMode === 'vision'}
            label="Vision"
          />
            <AudioModeButton
              icon={assets.compass_icon}
              onClick={() => handleAudioModeButtonClick('supersearch')}
              isActive={activeMode === 'supersearch'}
              label="Super Search"
            />
          </div>
      </div>
      {isAIProcessing && <AIProcessingAnimation />}
      </div>

      <div className="main_bottom">
        {!audioMode ? (
          <div className="search-box">
            <input
              onChange={(e) => setInput(e.target.value)}
              value={input}
              type="text"
              placeholder={`Ask Maya a question`}
              onKeyDown={handleKeyDown}
            />
            <div>
              <img onClick={handleSend} src={assets.send_icon} alt="Send"/>
            </div>
          </div>
        ) : (
          <div className="audio-result" ref={resultRef}>
            <p dangerouslySetInnerHTML={{
              __html: processedAudioResult.split(' ').slice(0, currentWordIndex).join(' ')
            }}></p>
          </div>
        )}
      </div>
      
      <Modal
        show={modalOpen}
        onClose={() => setModalOpen(false)}
        faceRecognitionEnabled={faceRecognition}
        toggleFaceRecognition={() => setFaceRecognition(!faceRecognition)}
      />
      <ScheduleModal 
        isOpen={scheduleModalOpen} 
        onClose={() => setScheduleModalOpen(false)}
        tasks={tasks}
        onAddTask={addTask}
        onUpdateTask={updateTask}
        onDeleteTask={deleteTask}
      />
      <HelpModal
        isOpen={helpModalOpen}
        onClose={() => setHelpModalOpen(false)}
      />
    </div>
  );
}

export default Main;