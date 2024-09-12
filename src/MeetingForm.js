import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const MeetingForm = () => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(useLocation().state?.date || '');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [notifyBefore, setNotifyBefore] = useState(15); // Notify 15 minutes before by default

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        const newMeeting = {
            title,
            description,
            date,
            startTime,
            endTime,
            notifyBefore,
        };

        try {
            await axios.post('/api/meetings', newMeeting);
            navigate('/');
        } catch (error) {
            console.error('Error creating meeting:', error);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <h2>Add Meeting or Birthday</h2>
            <div>
                <label>Title:</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div>
                <label>Description:</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div>
                <label>Date:</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div>
                <label>Start Time:</label>
                <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
            </div>
            <div>
                <label>End Time:</label>
                <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
            </div>
            <div>
                <label>Notify Before (minutes):</label>
                <input type="number" value={notifyBefore} onChange={(e) => setNotifyBefore(e.target.value)} />
            </div>
            <button type="submit">Add</button>
        </form>
    );
};

export default MeetingForm;
