import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Calendar from './calendar';
import MeetingForm from './MeetingForm';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Calendar />} />
                <Route path="/add-meeting" element={<MeetingForm />} />
            </Routes>
        </Router>
    );
}

export default App;
