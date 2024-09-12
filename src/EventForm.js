import React, { useState } from 'react';

const EventForm = ({ selectedDate, onClose, onEventCreated }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [type, setType] = useState('meeting');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (type === 'meeting' && startTime && endTime) {
            const start = new Date(`1970-01-01T${startTime}:00`);
            const end = new Date(`1970-01-01T${endTime}:00`);
            const duration = (end - start) / 1000 / 60 / 60; // Duration in hours

            if (duration > 1) {
                setError('Meeting duration cannot exceed 1 hour.');
                return;
            }
        }
        setError('');
        const newEvent = {
            title,
            date: selectedDate,
            description,
            startTime: type === 'meeting' ? startTime : null,
            endTime: type === 'meeting' ? endTime : null,
            type,
        };

        onEventCreated(newEvent);
    };

    return (
        <form onSubmit={handleSubmit}>
            <h2>Add Event</h2>
            <input 
                type="text" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="Event Title" 
                required 
            />
            {type === 'meeting' && (
                <>
                    <input 
                        type="time" 
                        value={startTime} 
                        onChange={(e) => setStartTime(e.target.value)} 
                        placeholder="Start Time" 
                        required 
                    />
                    <input 
                        type="time" 
                        value={endTime} 
                        onChange={(e) => setEndTime(e.target.value)} 
                        placeholder="End Time" 
                        required 
                    />
                    {error && <p style={{ color: 'red' }}>{error}</p>}
                </>
            )}
            <select value={type} onChange={(e) => setType(e.target.value)}>
                <option value="meeting">Meeting</option>
                <option value="birthday">Birthday</option>
            </select>
            <textarea 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                placeholder="Description" 
            />
            <button type="submit">Save</button>
            <button type="button" onClick={onClose}>Cancel</button>
        </form>
    );
};

export default EventForm;
