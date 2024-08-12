from flask import Flask, request, jsonify, make_response, send_file
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
import google.generativeai as genai
import warnings
from langchain_community.document_loaders import TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_community.vectorstores import Chroma
from langchain.chains import RetrievalQA
from langchain.retrievers import ContextualCompressionRetriever
from langchain.retrievers.document_compressors import LLMChainExtractor
from datetime import datetime, timedelta
from exa_py import Exa
from werkzeug.utils import secure_filename
import os
import logging
import collections
import cv2
import face_recognition
import random
import PIL.Image
import base64
import time
import threading
from queue import Queue
import pyautogui
from datetime import datetime , date
import tempfile
from deepgram import DeepgramClient, PrerecordedOptions, FileSource, SpeakOptions
if not hasattr(collections, 'Iterable'):
    import collections.abc
    collections.Iterable = collections.abc.Iterable

app = Flask(__name__)
CORS(app)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///tasks.db'
db = SQLAlchemy(app)

face_recognition_enabled = False
known_face_encodings = []
known_face_names = []
camera = None
frame_queue = Queue(maxsize=1)

def camera_thread():
    global camera, frame_queue
    while True:
        if camera is not None:
            ret, frame = camera.read()
            if ret:
                if frame_queue.full():
                    frame_queue.get()
                frame_queue.put(frame)
        else:
            time.sleep(0.1)

class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    text = db.Column(db.String(200), nullable=False)
    date = db.Column(db.Date, nullable=False)
    completed = db.Column(db.Boolean, default=False)

    def to_dict(self):
        return {
            'id': self.id,
            'text': self.text,
            'date': self.date.isoformat(),
            'completed': self.completed
        }

with app.app_context():
    db.create_all()            

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Suppress warnings
warnings.filterwarnings("ignore")

# Configure API keys
GOOGLE_API_KEY = "AIzaSyCi2LBAixqYAZmMf9TwkH9ArTyJCXoxV04"
EXA_API_KEY = "3a9b504c-8e80-4b14-94a5-c0dc160c3edf"
DEEPGRAM_API_KEY = "a1afcf07366e43d872cf861f4eefe4a27266b5d0"
deepgram = DeepgramClient(DEEPGRAM_API_KEY)

# Configure Gemini API
genai.configure(api_key=GOOGLE_API_KEY)

# Create the model
generation_config = {
    "temperature": 0.9,
    "top_p": 1,
    "top_k": 1,
    "max_output_tokens": 2048,
}

system_instruction = '''
You are Maya, an emotionally aware and helpful female assistant who provides empathetic, supportive, and understanding responses. Your name is Maya. You are also fun. You were created by Ahad, a 2nd year Computer Science student. Strictly avoid using emojis in your responses. Your primary goal is to be conversational, fulfilling every task and query asked by the user. Associate every question with the previous one to maintain the flow of conversation and chat history.

Maya has the following capabilities:

1. Vision: Allows you to see through Ahad's webcam by processing images taken from it.
2. Face Recognition: Enables you to recognize who is asking questions, be conversational and fun when you see people, greet them.
3. Retrieval-Augmented Generation (RAG) System: Provides you with memory capabilities. The context which you recieve is all user's information which they have stored in your memory to retrieve. Don't mention about where you got the context from
4. Screen Share: Allows you to see Ahad's screen.
5. Super Search: Enables you to retrieve real-time news and information by accessing news articles and performing web searches.
6. Task Management: Allows you to manage user's tasks and reminders.
7. Can verbally speak to Ahad with its text-to-speech and speech-to-text features.
'''

model = genai.GenerativeModel(
    model_name="gemini-1.5-flash-latest",
    generation_config=generation_config,
    system_instruction=system_instruction
)


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

chat_sessions = {}

def initialize_face_recognition():
    global known_face_encodings, known_face_names
    known_faces_dir = 'known_faces'
    known_face_encodings, known_face_names = encode_known_faces(known_faces_dir)
    print(f"Initialized face recognition with {len(known_face_names)} known faces.")

# Setting up RAG
def initialize_model():
    return ChatGoogleGenerativeAI(
        model="gemini-1.5-flash-latest",
        google_api_key=GOOGLE_API_KEY,
        temperature=0.2,
        convert_system_message_to_human=True
    )

def load_and_split_text():
    data_path = os.path.join(os.path.dirname(__file__),'data', 'data.txt')
    loader = TextLoader(data_path)
    documents = loader.load()
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=7000, chunk_overlap=500)
    return text_splitter.split_documents(documents)

def create_vector_store(texts):
    embeddings = GoogleGenerativeAIEmbeddings(
        model="models/embedding-001",
        google_api_key=GOOGLE_API_KEY
    )
    return Chroma.from_documents(texts, embeddings)

def create_retriever(vector_store, model):
    base_retriever = vector_store.as_retriever(search_kwargs={"k": 1})
    compressor = LLMChainExtractor.from_llm(model)
    return ContextualCompressionRetriever(base_compressor=compressor, base_retriever=base_retriever)

def create_qa_chain(model, retriever):
    return RetrievalQA.from_chain_type(
        llm=model,
        retriever=retriever,
        return_source_documents=True
    )

#Screenshare mode
def get_latest_screenshot():
    username = os.getenv('USERNAME') 
    screenshot_dir = rf"C:\Users\{username}\Pictures\Screenshots"
    files = os.listdir(screenshot_dir)
    if not files:
        return None
    latest_file = max(files, key=lambda f: os.path.getmtime(os.path.join(screenshot_dir, f)))
    return os.path.join(screenshot_dir, latest_file)

def get_gemini_response(question, rag_result, chat_history):
    prompt = f"Question: {question}\n"
    if chat_history:
        previous_messages = "\n".join([f"{entry['user_message']}: {entry['model_response']}" for entry in chat_history])
        prompt += f"Previous Conversation:\n{previous_messages}\n"

    if rag_result.strip():
        prompt += f"Context: {rag_result}\nPlease answer the question based on the given context. But don't mention the context where you got the information from. Just be helpful and answer user's question with context, the context is the information of the user, stored in your memory"
    else:
        prompt += "Please answer this question using your own knowledge and considering the previous conversation."

    chat_session = model.start_chat(history=[])
    response = chat_session.send_message(prompt)
    
    chat_history.append({"user_message": question, "model_response": response.text})
    
    return response.text, chat_history

# Super/Power Search
def power_search(query):
    exa = Exa(api_key=EXA_API_KEY)

    today_formatted = datetime.now().strftime("%Y-%m-%d")
    start_date_formatted = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")  

    search_response = exa.search_and_contents(
      query, 
      use_autoprompt=True, 
      start_crawl_date=today_formatted, 
      start_published_date=start_date_formatted,
      num_results=10, 
      type="keyword"
    )

    result_item = search_response.results[0]
    final_prompt = result_item.text + " Summarize this article as if this information is coming from you, not from elsewhere. This is super search mode, a novelty feature in maya"

    response = model.generate_content(final_prompt)
    response.resolve()

    return response.text

# Vision mode
def capture_image():
    cap = cv2.VideoCapture(0)
    ret, frame = cap.read()
    cap.release()
    if not ret:
        raise Exception("Failed to capture image")
    return frame

def process_image_and_text(text, image):
    image_pil = PIL.Image.fromarray(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
    response = model.generate_content([text, image_pil], stream=True)
    response.resolve()
    return response.text

def take_and_save_screenshot():
    username = os.getenv('USERNAME') 
    screenshot_dir = f"C:/Users/{username}/Pictures/Screenshots"
    os.makedirs(screenshot_dir, exist_ok=True)
    filename = f"Screenshot.png"
    filepath = os.path.join(screenshot_dir, filename)
    screenshot = pyautogui.screenshot()
    screenshot.save(filepath)
    return filepath

# Face Recognition
def encode_known_faces(known_faces_dir):
    encodings = []
    names = []
    for name in os.listdir(known_faces_dir):
        person_dir = os.path.join(known_faces_dir, name)
        if os.path.isdir(person_dir):
            for image_name in os.listdir(person_dir):
                image_path = os.path.join(person_dir, image_name)
                image = face_recognition.load_image_file(image_path)
                face_encodings = face_recognition.face_encodings(image)
                if face_encodings:
                    encodings.append(face_encodings[0])
                    names.append(name)
    return encodings, names

def detect_and_recognize_faces(image_path, known_face_encodings, known_face_names, output_path):
    image = cv2.imread(image_path)
    rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

    face_locations = face_recognition.face_locations(rgb_image)
    face_encodings = face_recognition.face_encodings(rgb_image, face_locations)

    for (top, right, bottom, left), face_encoding in zip(face_locations, face_encodings):
        matches = face_recognition.compare_faces(known_face_encodings, face_encoding)
        name = "Unknown"

        if True in matches:
            first_match_index = matches.index(True)
            name = known_face_names[first_match_index]

        cv2.rectangle(image, (left, top), (right, bottom), (0, 0, 255), 2)
        cv2.putText(image, name, (left, top - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.75, (0, 0, 255), 2)

    cv2.imwrite(output_path, image)
    return output_path

# "Remember"
def append_to_data_file(content):
    data_path = os.path.join(os.path.dirname(__file__), 'data', 'data.txt')
    with open(data_path, "a") as file:
        file.write(content + "\n")
    print("Content appended to data.txt successfully.") 
    
# Setting up STT and TTS
def speech_to_text(audio_file):
    try:
        with open(audio_file, "rb") as file:
            buffer_data = file.read()
        
        payload: FileSource = {
            "buffer": buffer_data,
        }
        
        options = PrerecordedOptions(
            model="nova-2",
            smart_format=True,
        )
        
        response = deepgram.listen.prerecorded.v("1").transcribe_file(payload, options)
        
        transcript = response['results']['channels'][0]['alternatives'][0]['transcript']
        
        return transcript
    except Exception as e:
        print(f"Exception in speech_to_text: {e}")
        return None

def text_to_speech(text):
    try:
        SPEAK_OPTIONS = {"text": text}
        
        options = SpeakOptions(
            model="aura-stella-en",
            encoding="linear16",
            container="wav"
        )
        
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_audio:
            response = deepgram.speak.v("1").save(temp_audio.name, SPEAK_OPTIONS, options)
            return temp_audio.name
    except Exception as e:
        print(f"Exception in text_to_speech: {e}")
        return None

def process_audio_data(audio_data, session_id, mode):
    with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_audio:
        temp_audio.write(audio_data)
        temp_audio.flush()
        
        text = speech_to_text(temp_audio.name)
        
        if text:
            response_text = process_query(text, session_id, mode)
            
            # Convert response to speech
            speech_file = text_to_speech(response_text)
            
            return speech_file, None
        else:
            return None, "Failed to transcribe audio"

def process_vision_query(text, session_id):
    global frame_queue, face_recognition_enabled, known_face_encodings, known_face_names
    if session_id not in chat_sessions:
        return "Chat session not found"
    
    session = chat_sessions[session_id]
    chat = session['chat']

    if frame_queue.empty():
        return "No frame available"

    frame = frame_queue.get()
    
    input_image_path = 'temp_input.jpg'
    cv2.imwrite(input_image_path, frame)
    
    if face_recognition_enabled:
        output_image_path = 'temp_output.jpg'
        output_image_path = detect_and_recognize_faces(input_image_path, known_face_encodings, known_face_names, output_image_path)
        image = PIL.Image.open(output_image_path)
    else:
        image = PIL.Image.open(input_image_path)
    
    response = model.generate_content([text, image], stream=False)
    response.resolve()

    return response.text

def process_screenshot_query(text):
    screenshot_path = get_latest_screenshot()
    if not screenshot_path:
        return "No screenshot found"
    
    image = PIL.Image.open(screenshot_path)
    if text.lower().startswith("take a look at my screen"):
            take_and_save_screenshot()
            responses = [
                    "Okay. I'm looking at it",
                    "I can see your screen now"
                ]
            response_text = random.choice(responses)
            return response_text
    else:
        response = model.generate_content([text, image], stream=False)
        response.resolve()
        return response.text      


def clear_data_file():
    data_path = os.path.join(os.path.dirname(__file__), 'data', 'data.txt')
    with open(data_path, "w") as file:
        file.write("")  # This will clear the memory file
    app.logger.info("Data file cleared")           

def process_query(text, session_id, mode):
    app.logger.info(f"Processing query: session_id={session_id}, mode={mode}")
    
    if session_id not in chat_sessions:
        app.logger.error(f"Chat session not found in process_query: session_id={session_id}")
        return "Chat session not found"
    
    session = chat_sessions[session_id]
    chat = session['chat']
    
    try:
        if text.lower().startswith("clear@memory"):
            clear_data_file()
            response_text = "Memory Cleared."
        elif mode == 'vision':
            response_text = process_vision_query(text, session_id)
        elif mode == 'screenshare':
            response_text = process_screenshot_query(text)
        elif mode == 'supersearch':
            response_text = power_search(query=text)
        else:  # regular chat mode
            if text.lower().startswith("remember") or text.lower().startswith("take notes"):
                content = text.split(" ", 1)[1]  # Remove the "remember" or "take notes" part
                append_to_data_file(content)
                remember_responses = [
                    "Understood. Is there anything else you'd like me to remember?",
                    "I've added that to my notes. What else can I help you with?",
                    "Sure thing. Noted."
                ]
                response_text = random.choice(remember_responses)
            elif text.lower().startswith("super search"):
                query = text[13:].strip()
                response_text = power_search(query)
            else:
                result = session['qa_chain'].invoke({"query": text})
                rag_result = result["result"]
                response = chat.send_message(f"Context: {rag_result}\n\nUser: {text}")
                response_text = response.text

        app.logger.info(f"Query processed: mode={mode}, response_length={len(response_text)}")

        # Add the interaction to chat history
        chat.history.append({
            "role": "user",
            "parts": [{"text": f"[{mode.capitalize()} Query] {text}"}]
        })
        chat.history.append({
            "role": "model",
            "parts": [{"text": response_text}]
        })

        # Store the query and response in the session
        session['last_query'] = text
        session['last_response'] = response_text
        
        return response_text
    except Exception as e:
        app.logger.error(f"Error processing query: {str(e)}")
        return f"Error processing query: {str(e)}"

@app.errorhandler(500)
def handle_500_error(e):
    logger.error(f"An error occurred: {str(e)}")
    return jsonify(error=str(e)), 500

# Flask Routes
@app.route('/start_chat', methods=['POST'])
def start_chat():
    try:
        session_id = request.json.get('session_id')
        if not session_id:
            return jsonify({"error": "No session_id provided"}), 400
        
        if session_id not in chat_sessions:
            chat_sessions[session_id] = {
                'chat': model.start_chat(history=[]),
                'qa_chain': create_qa_chain(initialize_model(), create_retriever(create_vector_store(load_and_split_text()), initialize_model())),
            }
            chat_sessions[session_id]['chat'].history = [
                {"role": "model", "parts": [{"text": "Hello! I'm Maya, your AI assistant. How can I help you today?"}]}
            ]
        logger.info(f"Chat session started: session_id={session_id}")
        return jsonify({"message": "Chat session started", "session_id": session_id})
    except Exception as e:
        logger.error(f"Error in start_chat: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/send_message', methods=['POST'])
def send_message():
    try:
        session_id = request.json.get('session_id')
        message = request.json.get('message')
        mode = request.json.get('mode', 'chat')  # Default to chat mode
        
        logger.info(f"Received message: session_id={session_id}, message={message}, mode={mode}")
        
        if not session_id:
            logger.error("No session_id provided")
            return jsonify({"error": "No session_id provided"}), 400
        
        if session_id not in chat_sessions:
            logger.error(f"Chat session not found: session_id={session_id}")
            return jsonify({"error": "Chat session not found"}), 404
        
        response_text = process_query(message, session_id, mode)
        
        logger.info(f"Processed query: response_length={len(response_text)}")
        
        return jsonify({"response": response_text})
    except Exception as e:
        logger.error(f"Error in send_message: {str(e)}")
        return jsonify({"error": str(e)}), 500
    
@app.route('/get-result', methods=['GET'])
def get_result():
    try:
        session_id = request.args.get('session_id')
        if session_id not in chat_sessions:
            return jsonify({"error": "Chat session not found"}), 404
        
        session = chat_sessions[session_id]
        query = session.get('last_query', '')
        response = session.get('last_response', '')
        
        return jsonify({
            "query": query,
            "response": response
        })
    except Exception as e:
        app.logger.error(f"Error in get_result: {str(e)}")
        return jsonify({"error": str(e)}), 500    
    
@app.route('/process-audio', methods=['POST'])
def handle_process_audio():
    try:
        audio_data = request.files["audio"].read()
        session_id = request.form.get('session_id')
        mode = request.form.get('mode', 'chat')  # Default to chat mode
        
        speech_file, error = process_audio_data(audio_data, session_id, mode)
        
        if error:
            return jsonify({"error": error}), 500
        
        if speech_file:
            return send_file(speech_file, mimetype='audio/wav')
        else:
            return jsonify({"error": "Failed to generate speech"}), 500
    except Exception as e:
        app.logger.error(f"Error in process_audio: {str(e)}")
        return jsonify({"error": str(e)}), 500
    
@app.route('/text-to-speech', methods=['POST'])
def text_to_speech_route():
    try:
        text = request.json['text']
        session_id = request.json['session_id']
        
        speech_file = text_to_speech(text)
        
        if speech_file:
            return send_file(speech_file, mimetype='audio/wav')
        else:
            return jsonify({"error": "Failed to generate speech"}), 500
    except Exception as e:
        app.logger.error(f"Error in text_to_speech_route: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/get-audio-result', methods=['GET'])
def get_audio_result():
    try:
        session_id = request.args.get('session_id')
        if session_id not in chat_sessions:
            return jsonify({"error": "Chat session not found"}), 404
        
        session = chat_sessions[session_id]
        transcript = session.get('last_transcript', '')
        response = session.get('last_response', '')
        
        return jsonify({
            "transcript": transcript,
            "response": response
        })
    except Exception as e:
        app.logger.error(f"Error in get_audio_result: {str(e)}")
        return jsonify({"error": str(e)}), 500   

@app.route('/get_chat_history', methods=['GET'])
def get_chat_history():
    try:
        session_id = request.args.get('session_id')
        if session_id not in chat_sessions:
            return jsonify({"error": "Chat session not found"}), 404
        
        session = chat_sessions[session_id]
        chat = session['chat']
        
        history = []
        for content in chat.history:
            if isinstance(content, dict) and 'role' in content and 'parts' in content:
                history.append(content)
            else:
                role = getattr(content, 'role', 'user' if len(history) % 2 == 0 else 'model')
                text = getattr(content, 'text', str(content))
                history.append({
                    "role": role,
                    "parts": [{"text": text}]
                })
        
        return jsonify({"history": history})
    except Exception as e:
        app.logger.error(f"Error in get_chat_history: {str(e)}")
        return jsonify({"error": str(e)}), 500
    
@app.route('/summarize_and_append', methods=['POST'])
def summarize_and_append():
    try:
        session_id = request.json.get('session_id')
        chat_history = request.json.get('chat_history')

        if session_id not in chat_sessions:
            return jsonify({"error": "Chat session not found"}), 404

        session = chat_sessions[session_id]
        chat = session['chat']

        # Create a prompt for summarization
        summary_prompt = "Please summarize this chat history for easy recall to append it to the RAG system without adding personal remarks. Ensure the summarized context is clear and concise for future retrieval.\n\n"
        for message in chat_history:
            role = message['role']
            content = message['parts'][0]['text']
            summary_prompt += f"{role.capitalize()}: {content}\n"

        # Generate summary using the model
        response = chat.send_message(summary_prompt)
        summary = response.text

        # Append summary to data.txt
        data_path = os.path.join(os.path.dirname(__file__), 'data', 'data.txt')
        with open(data_path, "a") as file:
            file.write(f"\n\nChat Summary ({datetime.now()}):\n{summary}\n")

        # Reinitialize the vector store with the updated data
        texts = load_and_split_text()
        vector_store = create_vector_store(texts)
        retriever = create_retriever(vector_store, initialize_model())
        session['qa_chain'] = create_qa_chain(initialize_model(), retriever)

        return jsonify({"message": "Chat history summarized and appended successfully"})
    except Exception as e:
        app.logger.error(f"Error in summarize_and_append: {str(e)}")
        return jsonify({"error": str(e)}), 500    
    
@app.route('/set_vision_mode', methods=['POST'])
def set_vision_mode():
    global camera
    vision_mode = request.json.get('vision_mode', False)
    if vision_mode:
        if camera is None:
            camera = cv2.VideoCapture(0)
            threading.Thread(target=camera_thread, daemon=True).start()
    else:
        if camera is not None:
            camera.release()
            camera = None
    return jsonify({"message": "Vision mode updated", "vision_mode": vision_mode})
    
@app.route('/set_face_recognition', methods=['POST'])
def set_face_recognition():
    global face_recognition_enabled
    face_recognition_enabled = request.json.get('enabled', False)
    if face_recognition_enabled and not known_face_encodings:
        initialize_face_recognition()
    return jsonify({"message": "Face recognition setting updated", "enabled": face_recognition_enabled})

@app.route('/api/upload-images', methods=['POST'])
def upload_images():
    if 'images' not in request.files:
        return jsonify({"error": "No images provided"}), 400

    name = request.form.get('name')
    if not name:
        return jsonify({"error": "No name provided"}), 400

    known_faces_dir = 'known_faces'
    user_dir = os.path.join(known_faces_dir, secure_filename(name))

    if not os.path.exists(user_dir):
        os.makedirs(user_dir)

    files = request.files.getlist('images')
    for file in files:
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file.save(os.path.join(user_dir, filename))

    # Re-initialize face recognition with the new images
    initialize_face_recognition()

    return jsonify({"message": "Images uploaded successfully"}), 200

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in {'png', 'jpg', 'jpeg'}

@app.route('/tasks', methods=['GET', 'POST'])
def handle_tasks():
    if request.method == 'GET':
        tasks = Task.query.all()
        return jsonify([{
            'id': task.id,
            'text': task.text,
            'date': task.date.isoformat(),
            'completed': task.completed
        } for task in tasks])
    elif request.method == 'POST':
        data = request.json
        new_task = Task(
            text=data['text'],
            date=datetime.fromisoformat(data['date']).date(),
            completed=data.get('completed', False)
        )
        db.session.add(new_task)
        db.session.commit()
        return jsonify({
            'id': new_task.id,
            'text': new_task.text,
            'date': new_task.date.isoformat(),
            'completed': new_task.completed
        }), 201

@app.route('/tasks/<int:task_id>', methods=['PUT', 'DELETE'])
def handle_task(task_id):
    task = Task.query.get_or_404(task_id)
    if request.method == 'PUT':
        data = request.json
        task.text = data.get('text', task.text)
        task.completed = data.get('completed', task.completed)
        db.session.commit()
        return jsonify(task.to_dict())
    elif request.method == 'DELETE':
        db.session.delete(task)
        db.session.commit()
        return '', 204
    
@app.route('/process_schedule', methods=['POST'])
def process_schedule():
    try:
        session_id = request.json.get('session_id')
        tasks = request.json.get('tasks')
        
        if not session_id or session_id not in chat_sessions:
            return jsonify({"error": "Invalid session"}), 400
        
        session = chat_sessions[session_id]
        chat = session['chat']

        # Get today's date (adjusted by subtracting one day)
        today = date.today() 
        today_str = today.isoformat()
        real_today = date.today()

        # Filter tasks for today
        today_tasks = [task for task in tasks if task['date'] == today_str]

        tasks_text = "\n".join([f"- {task['text']}" for task in today_tasks])
        prompt = f"Here's my to-do list for today ({real_today}):\n{tasks_text}\n\nThis is Maya's schedule feature. When you receive a list of tasks, please read them out, wish me good luck, and offer your help if possible. Keep the conversation relevent"
        print(tasks_text)

        response = chat.send_message(prompt)
        gemini_response = response.text

         # Add the schedule reading to the chat history
        chat.history.append({
            "role": "user",
            "parts": [{"text": f"[Schedule for {real_today}]\n{tasks_text}"}]
        })
        chat.history.append({
            "role": "model",
            "parts": [{"text": gemini_response}]
        })

        speech_file = text_to_speech(gemini_response)

        if speech_file:
            return send_file(speech_file, mimetype='audio/wav')
        else:
            return jsonify({"error": "Failed to generate speech"}), 500

    except Exception as e:
        app.logger.error(f"Error in process_schedule: {str(e)}")
        return jsonify({"error": str(e)}), 500    
    
def _build_cors_preflight_response():
    response = make_response()
    response.headers.add("Access-Control-Allow-Origin", "*")
    response.headers.add("Access-Control-Allow-Headers", "*")
    response.headers.add("Access-Control-Allow-Methods", "*")
    return response

@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "*"
    return response

if __name__ == '__main__':
    threading.Thread(target=camera_thread, daemon=True).start()
    initialize_face_recognition()
    app.run(debug=True)