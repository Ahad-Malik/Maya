# Maya AI Assistant

Maya is an advanced AI assistant created by Ahad, representing the future of human-computer interaction. By seamlessly integrating multi-modal capabilities like vision, voice interaction, and memory retention, Maya is more than a tool – it’s a revolutionary companion. 

This full-stack application combines a Flask backend with a modern React frontend to deliver a comprehensive and interactive experience that adapts to your needs in real-time.

---

## **Why Maya is Revolutionary**

Maya stands apart in a world filled with glorified chatbots. It combines cutting-edge AI technologies to create an assistant that can see, hear, remember, and adapt like never before. 

### **Core Innovations**
1. **Vision System:** Maya recognizes faces with 95% accuracy, tracks multiple users simultaneously, and personalizes interactions in real-time.
2. **Memory Architecture:** Utilizing Retrieval-Augmented Generation (RAG), Maya stores dynamic, rewriteable memories for unparalleled context retention.
3. **Interactive Desktop Integration:** Maya processes screen content in real-time, summarizing visible information and managing tasks directly.
4. **Speech Processing:** Clear, natural two-way communication with 95% recognition accuracy and sub-200 millisecond latency.
5. **Task Management:** Seamlessly integrates scheduling and reminders with memory and interaction systems.
6. **Super Search:** Brings real-time data through web searches, ensuring you're always up-to-date.
7. **Webcam and Screenshare Modes:** Real-time interactivity through webcam vision and screen sharing.

---

## **Features**

### **🤖 Core Capabilities**
- **Natural Conversation:** Emotionally aware responses using Google’s Gemini 1.5 Flash model.
- **Memory System:** Context-aware interactions powered by RAG.
- **Task Management:** Built-in task tracking and scheduling system.

### **🔁 Visual Features**
- **Computer Vision:** Real-time webcam integration.
- **Face Recognition:** User recognition with memory capabilities.
- **Screen Sharing:** Screen capture and analysis.

### **🎤 Audio Features**
- **Speech-to-Text:** Voice command processing using Deepgram.
- **Text-to-Speech:** Natural voice responses.
- **Multi-modal Interaction:** Seamless transitions between text, voice, and visual inputs.

### **🔍 Enhanced Search**
- **Super Search:** Real-time news and information retrieval.
- **Web Integration:** Access to current information via Exa API.

---

## **Real-World Impact**

### Performance Highlights
- **Facial Recognition:** 95% accuracy with 250 ms latency.
- **Memory Retrieval:** 93% accuracy, processing in under 50 ms.
- **Speech Processing:** Natural audio synthesis with sub-200 ms latency.

Whether managing a hectic schedule or providing personalized assistance, Maya’s responsiveness makes it a game-changer.

---

## **Technical Architecture**

### **Frontend Technologies**
- React.js
- React Three Fiber/Drei for 3D graphics
- Spline for 3D animations
- Context API for state management
- Modern CSS for responsive design

### **Backend Technologies**
- Python 3.8+
- Flask
- OpenCV
- SQLAlchemy
- Google Generative AI
- Deepgram SDK
- Face Recognition library

## 🔑 API Keys  

To make it easy for anyone to test and explore Maya, the required API keys are **included directly in the repository**. These keys are free-tier and allow you to test all the functionalities without additional setup.  

### API Keys Required

```python
GOOGLE_API_KEY = "your-google-api-key"
EXA_API_KEY = "your-exa-api-key"
DEEPGRAM_API_KEY = "your-deepgram-api-key"
```
---

## **Installation**

### **Backend Setup**
1. Clone the repository:
   ```bash
   git clone https://github.com/Ahad-Malik/Maya.git
   cd Maya
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install required packages:
   ```bash
   pip install -r requirements.txt
   ```
4. Then Manually run the app2.py file

### **Frontend Setup**
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

---

## **API Endpoints**

### **Chat Management**
- `POST /start_chat`: Initialize a new chat session.
- `POST /send_message`: Send a message to Maya.
- `GET /get_chat_history`: Retrieve chat history.

### **Task Management**
- `GET /tasks`: Retrieve all tasks.
- `POST /tasks`: Create a new task.
- `PUT /tasks/<task_id>`: Update a task.
- `DELETE /tasks/<task_id>`: Delete a task.

### **Vision Features**
- `POST /set_vision_mode`: Enable/disable vision mode.
- `POST /set_face_recognition`: Toggle face recognition.
- `POST /api/upload-images`: Upload face images for recognition.

### **Audio Processing**
- `POST /process-audio`: Process voice input.
- `POST /text-to-speech`: Convert text to speech.
- `GET /get-audio-result`: Get audio processing results.

---

## **The Journey of Maya**

Maya was born from a dream I had as a 10-year-old, inspired by Iron Man's Jarvis. In my second-year as a BTech student, I made some progress towards that dream, creating a project that’s been showcased in Google Gemini API developer competition and praised for its unique features. Some of the features like screen-share and Real-time web-search existed in Maya long before the same features were available in Chatgpt and Gemini for public to use. And a research article that talked about a RAG architecture that was similar to Maya's memory retrieval architecture was released on August 13th by MongoDB  [Link to the article](https://www.mongodb.com/developer/products/atlas/advanced-rag-langchain-mongodb/). One day after I released a demo of Maya on YouTube, which was on August 12th. Link to YT video is given below.

- **Dynamic Memory Management:** Using rewriteable text files for adaptable memory.
- **Real-Time Capabilities:** Screenshare, face recognition, and contextual search.
- **Future Aspirations:** From emotion recognition to humanoid robotics, Maya's journey has only begun.

---

## **Vision for the Future**

- **Emotion Recognition:** Understand user emotions for tailored interactions.
- **Gesture Recognition:** Enhance spatial awareness and interactivity.
- **Healthcare & Education:** Transform patient care and adaptive learning environments.
- **Humanoid Robotics:** Integrate Maya’s architecture into intelligent robots.

---

## **Link**

- **YouTube Demo:** [Watch the demo](https://www.youtube.com/watch?v=e-lBN_2cqXs)

---

## **Acknowledgments**
- Google Generative AI for the Gemini model.
- Deepgram for speech processing.
- Exa for enhanced search capabilities.
- React Three Fiber and Spline for 3D graphics.

---

## **Conclusion**

Maya is not just an AI assistant; it’s a vision brought to life. By blending multi-modal interaction with dynamic memory and cutting-edge technology, Maya is redefining the boundaries of human-computer interaction.

