import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Context } from '../../context/Context';
import { assets } from '../../assets/assets';
import './ScheduleModal.css';
import { debounce } from 'lodash';

const ScheduleModal = ({ isOpen, onClose }) => {
  const { tasks, addTask, updateTask, deleteTask, fetchTasks, scheduleAudioResponse  } = React.useContext(Context);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [newTask, setNewTask] = useState('');
  const modalRef = useRef();
  const inputRef = useRef();
  const listRef = useRef(null);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const [filteredTasks, setFilteredTasks] = useState([]);

  useEffect(() => {
    if (isOpen) {
      const currentTime = Date.now();
      if (currentTime - lastFetchTime > 5000) {
        fetchTasks(); 
        setLastFetchTime(currentTime);
      }
    }
  }, [isOpen, fetchTasks, lastFetchTime]);

  useEffect(() => {
    const selectedDateString = selectedDate.toISOString().split('T')[0];
    const filtered = tasks.filter(task => task.date === selectedDateString);
    setFilteredTasks(filtered);
  }, [tasks, selectedDate]);

  const debouncedFetchTasks = useCallback(
    debounce(() => {
      fetchTasks();
    }, 300),
    [fetchTasks]
  );

  useEffect(() => {
    debouncedFetchTasks();
  }, [debouncedFetchTasks]);

  useEffect(() => {
    if (isOpen) {
      setSelectedDate(new Date()); // Reset to today's date
      fetchTasks();
    }
  }, [isOpen, fetchTasks]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  const getDaysArray = () => {
    const currentDate = new Date(selectedDate);
    currentDate.setDate(currentDate.getDate() - 3);
    return Array.from({ length: 8 }, (_, i) => {
      const day = new Date(currentDate);
      day.setDate(day.getDate() + i);
      return day;
    });
  };

  const handlePrevDay = () => {
    setSelectedDate(new Date(selectedDate.setDate(selectedDate.getDate() - 1)));
  };

  const handleNextDay = () => {
    setSelectedDate(new Date(selectedDate.setDate(selectedDate.getDate() + 1)));
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
  };

  const handleAddTask = () => {
    if (newTask.trim() !== '') {
      const newTaskObject = {
        text: newTask,
        date: selectedDate.toISOString().split('T')[0],
        completed: false
      };
      addTask(newTaskObject);
      setNewTask('');
      inputRef.current.focus();
      fetchTasks();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTask();
    }
  };

  const handleToggleComplete = (taskId, completed) => {
    updateTask(taskId, { completed: !completed });
  };

  const handleDeleteTask = (taskId) => {
    deleteTask(taskId);
  };

  const isToday = (date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isTomorrow = (date) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return (
      date.getDate() === tomorrow.getDate() &&
      date.getMonth() === tomorrow.getMonth() &&
      date.getFullYear() === tomorrow.getFullYear()
    );
  };

  const getTasksHeader = () => {
    if (isToday(selectedDate)) {
      return 'Tasks for Today';
    } else if (isTomorrow(selectedDate)) {
      return 'Tasks for Tomorrow';
    } else {
      return `Tasks for ${selectedDate.toDateString()}`;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="schedule-modal-overlay">
      <div className="schedule-modal" ref={modalRef}>
        <div className="schedule-modal-header">
          <h2>
            <img src={assets.calendar} alt="Calendar" className="header-icon" />
            Schedule
          </h2>
          <button onClick={onClose} className="close-button">×</button>
        </div>
        {scheduleAudioResponse && (
          <div className="audio-player">
            <audio controls src={scheduleAudioResponse}>
              Your browser does not support the audio element.
            </audio>
          </div>
        )}
        <div className="calendar-container">
          <button onClick={handlePrevDay} className="nav-button">
            <img src={assets.left} alt="Previous" />
          </button>
          <div className="calendar-strip">
            {getDaysArray().map((day, index) => (
              <div
                key={index}
                className={`calendar-day ${
                  day.toDateString() === selectedDate.toDateString() ? 'selected' : ''
                }`}
                onClick={() => handleDateClick(day)}
              >
                <div className="day-name">{daysOfWeek[day.getDay()]}</div>
                <div className="day-number">{day.getDate()}</div>
              </div>
            ))}
          </div>
          <button onClick={handleNextDay} className="nav-button">
            <img src={assets.right} alt="Next" />
          </button>
        </div>
        <div className="add-task">
          <input
            ref={inputRef}
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Add a new task"
          />
          <button onClick={handleAddTask} className="add-task-button">
            <img src={assets.plus} alt="Add" />
          </button>
        </div>
        <div className="todo-list" ref={listRef}>
          <h3>{getTasksHeader()}</h3>
          {filteredTasks.length > 0 ? (
            <ul>
              {filteredTasks.map((task) => (
                <li key={task.id} className={task.completed ? 'completed' : ''}>
                  <div className="task-content">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => handleToggleComplete(task.id, task.completed)}
                      className="task-checkbox"
                    />
                    <span>{task.text}</span>
                  </div>
                  <button onClick={() => handleDeleteTask(task.id)} className="delete-task">
                    <img src={assets.trash} alt="Delete" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="no-tasks">No tasks scheduled</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScheduleModal;
