import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Calendar from './calendar';
import PublicCalendar from './publicCalendar';


function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Calendar />} />
                <Route path='/view-calendar' element={<PublicCalendar/>}/>
                
            </Routes>
        </Router>
    );
}

export default App;
