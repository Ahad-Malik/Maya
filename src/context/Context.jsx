import React, { createContext, useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";

export const Context = createContext();

const ContextProvider = (props) => {
    const [input, setInput] = useState("");
    const [recentPrompt, setRecentPrompt] = useState("");
    const [prevPrompt, setPrevPrompt] = useState([]);
    const [showResult, setShowResult] = useState(false);
    const [loading, setLoading] = useState(false);
    const [resultData, setResultData] = useState("");
    const [sessionId, setSessionId] = useState(() => localStorage.getItem('chatSessionId') || null);
    const [visionMode, setVisionMode] = useState(false);
    const [powerSearchMode, setPowerSearchMode] = useState(false);
    const [faceRecognition, setFaceRecognition] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [chatHistory, setChatHistory] = useState([]);
    const [screenshareMode, setScreenshareMode] = useState(false);
    const [audioMode, setAudioMode] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef(null);
    const recordedChunksRef = useRef([]);
    const [audioTranscript, setAudioTranscript] = useState('');
    const [modelResponse, setModelResponse] = useState('');
    const recordingTimeoutRef = useRef(null);
    const [summarizing, setSummarizing] = useState(false);
    const [isSessionLoading, setIsSessionLoading] = useState(true);
    const [aiVoiceEnabled, setAiVoiceEnabled] = useState(false);
    const [tasks, setTasks] = useState([]);
    const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
    const [scheduleAudioResponse, setScheduleAudioResponse] = useState(null);
    const [isAIProcessing, setIsAIProcessing] = useState(false);
    
    const sessionIdRef = useRef(sessionId);

    useEffect(() => {
        sessionIdRef.current = sessionId;
    }, [sessionId]);

    const delayPara = (index, nextWord) => {
        setTimeout(function () {
            setResultData(prev => prev + nextWord);
        }, 40 * index);
    };

    const startChat = useCallback(async () => {
        try {
            const generatedSessionId = 'session_' + Date.now();
            const response = await axios.post('http://127.0.0.1:5000/start_chat', { session_id: generatedSessionId });
            setSessionId(generatedSessionId);
            localStorage.setItem('chatSessionId', generatedSessionId);
            console.log('Chat started:', response.data);
            getChatHistory(generatedSessionId);
        } catch (error) {
            console.error('Error starting chat:', error);
        } finally {
            setIsSessionLoading(false);
        }
    }, []);

    useEffect(() => {
        const initializeSession = async () => {
            if (!sessionIdRef.current) {
                await startChat();
            }
            setIsSessionLoading(false);
        };
        initializeSession();
    }, [startChat]);

    const processQuery = async (query, mode) => {
        if (!sessionIdRef.current) {
            console.log('No session ID available. Starting a new chat session.');
            await startChat();
            while (!sessionIdRef.current) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }

        setResultData("");
        setLoading(true);
        setShowResult(true);
        setRecentPrompt(query);
        setPrevPrompt(prev => [query, ...prev]);

        try {
            const response = await axios.post('http://127.0.0.1:5000/send_message', {
                session_id: sessionIdRef.current,
                message: query,
                mode: mode,
                face_recognition: faceRecognition
            });
            processResponse(response.data.response);
            getChatHistory(sessionIdRef.current);
            if (aiVoiceEnabled) {
                await processAudioResponse(response.data.response);
            }
        } catch (error) {
            if (error.response && error.response.status === 404) {
                console.log('Session not found. Starting a new chat session.');
                await startChat();
                return processQuery(query, mode);
            }
            console.error('Error processing query:', error);
            setResultData("Error processing query. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const processAudioResponse = async (text) => {
        try {
            const response = await axios.post('http://127.0.0.1:5000/text-to-speech', {
                text: text,
                session_id: sessionIdRef.current
            }, {
                responseType: 'blob'
            });
            const audioUrl = URL.createObjectURL(response.data);
            new Audio(audioUrl).play();
        } catch (error) {
            console.error('Error processing audio response:', error);
        }
    };

    const processAudioWithMode = async (audioBlob, mode) => {       
        if (!sessionIdRef.current) {
            console.log('No session ID available for audio processing. Starting a new chat session.');
            await startChat();
            while (!sessionIdRef.current) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }

        setIsAIProcessing(true);
        const formData = new FormData();
        formData.append('audio', audioBlob);
        formData.append('session_id', sessionIdRef.current);
        formData.append('mode', mode);
        
        try {
            const response = await axios.post('http://127.0.0.1:5000/process-audio', formData, {
                responseType: 'blob'
            });
            const audioUrl = URL.createObjectURL(response.data);
            new Audio(audioUrl).play();
            
            const resultResponse = await axios.get('http://127.0.0.1:5000/get-result', {
                params: { session_id: sessionIdRef.current }
            });
            setAudioTranscript(resultResponse.data.query);
            setModelResponse(resultResponse.data.response);
            setResultData(resultResponse.data.response);
            getChatHistory(sessionIdRef.current);
        } catch (error) {
            if (error.response && error.response.status === 404) {
                console.log('Session not found during audio processing. Starting a new chat session.');
                await startChat();
                return processAudioWithMode(audioBlob, mode);
            }
            console.error('Voice processing failed:', error);
            setResultData("Failed to process voice. Please try again.");
        } finally {
            setLoading(false);
            setIsAIProcessing(false);
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    recordedChunksRef.current.push(event.data);
                }
            };
            mediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
                let mode = 'chat';
                if (visionMode) mode = 'vision';
                else if (screenshareMode) mode = 'screenshare';
                else if (powerSearchMode) mode = 'supersearch';
                processAudioWithMode(audioBlob, mode);
                recordedChunksRef.current = [];
            };
            mediaRecorderRef.current.start();
            setIsRecording(true);
            recordingTimeoutRef.current = setTimeout(() => {
                stopRecording();
            }, 10000);
            setResultData("Listening...");
        } catch (error) {
            console.error('Failed to start listening:', error);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            clearTimeout(recordingTimeoutRef.current);
            setResultData("Processing...");
        }
    };

    const onSent = async () => {
        console.log("onSent called, current input:", input);
        let mode = 'chat';
        if (visionMode) mode = 'vision';
        else if (screenshareMode) mode = 'screenshare';
        else if (powerSearchMode) mode = 'supersearch';
        
        const currentInput = input; // Capture the current input value
        console.log(`Sending message: mode=${mode}, input=${currentInput}`);
        setInput(""); 
        await processQuery(currentInput, mode);
    };

    const processResponse = (response) => {
        let responseArray = response.split("**");
        let newResponse = "";
        for (let i = 0; i < responseArray.length; i++) {
            if (i === 0 || i % 2 !== 1) {
                newResponse += responseArray[i];
            } else {
                let boldContent = responseArray[i];
                if (/^\d+\./.test(boldContent.trim())) {
                    newResponse += "<br><b>" + boldContent + "</b>";
                } else {
                    newResponse += "<b>" + boldContent + "</b>";
                }
            }
        }
        
        let newResponse2 = newResponse.split('\n').map(line => {
            if (line.trim().startsWith('* ')) {
                return '<br>● ' + line.slice(2);
            } else {
                return line.replace(/\*(\S[^*]*\S)\*/g, '<i>$1</i>');
            }
        }).join('\n');
        
        let finalResponseArray = newResponse2.split(" ");
        for (let i = 0; i < finalResponseArray.length; i++) {
            const nextWord = finalResponseArray[i];
            delayPara(i, nextWord + " ");
        }
    };

    const getChatHistory = async (sid) => {
        try {
            const response = await axios.get(`http://127.0.0.1:5000/get_chat_history?session_id=${sid || sessionIdRef.current}`);
            console.log('Chat history:', response.data.history);
            setChatHistory(response.data.history);
        } catch (error) {
            console.error('Error fetching chat history:', error);
        }
    };

    const summarizeAndAppendChatHistory = async () => {
        setSummarizing(true);
        try {
            const historyResponse = await axios.get(`http://127.0.0.1:5000/get_chat_history?session_id=${sessionIdRef.current}`);
            const chatHistory = historyResponse.data.history;
            
            const summaryResponse = await axios.post('http://127.0.0.1:5000/summarize_and_append', {
                session_id: sessionIdRef.current,
                chat_history: chatHistory
            });
            
            console.log('Summary appended:', summaryResponse.data);
        } catch (error) {
            console.error('Error summarizing and appending chat history:', error);
        } finally {
            setSummarizing(false);
        }
    };

    const updateVisionMode = async (enabled) => {
        try {
            const response = await axios.post('http://127.0.0.1:5000/set_vision_mode', {
                vision_mode: enabled
            });
            console.log('Vision mode updated:', response.data);
            setVisionMode(enabled);
        } catch (error) {
            console.error('Error updating vision mode:', error);
        }
    };

    const updateFaceRecognitionSetting = async (enabled) => {
        try {
          const response = await axios.post('http://127.0.0.1:5000/set_face_recognition', {
            enabled: enabled
          });
          console.log('Face recognition setting updated:', response.data);
          setFaceRecognition(enabled);
        } catch (error) {
          console.error('Error updating face recognition setting:', error);
        }
    };

    const fetchTasks = useCallback(async () => {
        try {
            const response = await axios.get('http://localhost:5000/tasks');
            console.log('Fetched tasks:', response.data);
            setTasks(response.data);
        } catch (error) {
            console.error('Error fetching tasks:', error);
        }
    }, []);
      
      const addTask = async (newTask) => {
        try {
          const response = await axios.post('http://localhost:5000/tasks', newTask);
          console.log('Added task:', response.data);
          setTasks(prevTasks => {
            const updatedTasks = [...prevTasks, response.data];
            console.log('Updated tasks state:', updatedTasks);
            return updatedTasks;
          });
        } catch (error) {
          console.error('Error adding task:', error);
        }
      };

    const updateTask = async (taskId, updatedTask) => {
        try {
            const response = await axios.put(`http://localhost:5000/tasks/${taskId}`, updatedTask);
            setTasks(prevTasks => prevTasks.map(task => task.id === taskId ? response.data : task));
        } catch (error) {
            console.error('Error updating task:', error);
        }
    };

    const deleteTask = async (taskId) => {
        try {
            await axios.delete(`http://localhost:5000/tasks/${taskId}`);
            setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
        } catch (error) {
            console.error('Error deleting task:', error);
        }
    };

    const processScheduleWithGemini = async () => {
        try {
            setLoading(true);
            const response = await axios.post('http://127.0.0.1:5000/process_schedule', {
                session_id: sessionIdRef.current,
                tasks: tasks
            }, {
                responseType: 'blob'
            });
            
            const audioUrl = URL.createObjectURL(response.data);
            setScheduleAudioResponse(audioUrl);
            
            new Audio(audioUrl).play();

            // Fetch the updated chat history after processing the schedule
            await getChatHistory(sessionIdRef.current);
        } catch (error) {
            console.error('Error processing schedule with Gemini:', error);
        } finally {
            setLoading(false);
        }
    };
    
      const handleScheduleOpen = async () => {
        setScheduleModalOpen(true);
        await fetchTasks();
        processScheduleWithGemini();
      };

    const resetToDefaultView = () => {
        setShowResult(false);
        setResultData("");
        setInput("");
        setRecentPrompt("");
        setPrevPrompt([]);
        setVisionMode(false);
        setPowerSearchMode(false);
        setScreenshareMode(false);
    };

    return (
        <Context.Provider
            value={{
                onSent,
                setInput,
                input,
                setRecentPrompt,
                recentPrompt,
                prevPrompt,
                setPrevPrompt,
                showResult,
                setShowResult,
                resultData,
                setResultData,
                loading,
                setLoading,
                visionMode,
                updateVisionMode,
                setVisionMode,
                powerSearchMode,
                setPowerSearchMode,
                faceRecognition,
                setFaceRecognition,
                updateFaceRecognitionSetting,
                modalOpen,
                setModalOpen,
                resetToDefaultView,
                getChatHistory,
                chatHistory,
                summarizeAndAppendChatHistory,
                summarizing,
                screenshareMode,
                setScreenshareMode,
                audioMode,
                setAudioMode,
                isRecording,
                startRecording,
                stopRecording,
                audioTranscript,
                modelResponse,
                processQuery,
                processAudioWithMode,
                aiVoiceEnabled,
                setAiVoiceEnabled,
                isAIProcessing,
                setIsAIProcessing,
                isSessionLoading,
                tasks,
                fetchTasks,
                addTask,
                updateTask,
                deleteTask,
                scheduleModalOpen,
                setScheduleModalOpen,
                scheduleAudioResponse,
                handleScheduleOpen,
                startChat
            }}
        >
            {props.children}
        </Context.Provider>
    );
};

export default ContextProvider;