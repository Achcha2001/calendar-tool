import React, { useEffect, useState } from 'react';
import { gapi } from 'gapi-script';

const CLIENT_ID = '362129864986-nfo00hocjp0gm5th4l7fq7as3650p1g2.apps.googleusercontent.com';
const API_KEY = 'AIzaSyBlpvy6B0oCAx3gKiPbWYTue4dSuBIPoeQ';
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"];
const SCOPES = "https://www.googleapis.com/auth/calendar";

const PublicCalendar = () => {
    const [availableTimes, setAvailableTimes] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [userEmail, setUserEmail] = useState('');

    useEffect(() => {
        const initClient = () => {
            gapi.client.init({
                apiKey: API_KEY,
                clientId: CLIENT_ID,
                discoveryDocs: DISCOVERY_DOCS,
                scope: SCOPES
            }).then(() => {
                // Get available time slots
                listAvailableSlots();
            }).catch(error => {
                console.error('Error initializing Google API client:', error);
            });
        };

        gapi.load('client', initClient);
    }, []);

    const listAvailableSlots = () => {
        const timeMin = new Date().toISOString();
        const timeMax = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

        gapi.client.calendar.freebusy.query({
            resource: {
                timeMin,
                timeMax,
                items: [{ id: 'primary' }] // Primary calendar of the user
            }
        }).then(response => {
            const busySlots = response.result.calendars['primary']?.busy || [];
            const freeSlots = calculateHourlyFreeSlots(busySlots, timeMin, timeMax);
            setAvailableTimes(freeSlots);
        });
    };

    const calculateHourlyFreeSlots = (busySlots, timeMin, timeMax) => {
        const freeSlots = [];
        let currentTime = new Date(timeMin);
        const endTime = new Date(timeMax);

        while (currentTime < endTime) {
            const nextHour = new Date(currentTime);
            nextHour.setHours(currentTime.getHours() + 1);

            const isBusy = busySlots.some(slot => {
                const busyStart = new Date(slot.start);
                const busyEnd = new Date(slot.end);
                return (
                    (currentTime >= busyStart && currentTime < busyEnd) ||
                    (nextHour > busyStart && nextHour <= busyEnd)
                );
            });

            if (!isBusy) {
                freeSlots.push({
                    start: new Date(currentTime),
                    end: new Date(nextHour),
                });
            }

            currentTime = nextHour;
        }

        return freeSlots;
    };

    const handleScheduleMeeting = () => {
        if (!selectedSlot || !userEmail) {
            alert('Please select a time slot and provide your email.');
            return;
        }

        // Schedule meeting in the user's calendar
        gapi.client.calendar.events.insert({
            calendarId: 'primary', // The primary calendar to insert the meeting into
            resource: {
                summary: 'Scheduled Meeting', // You can customize the meeting title
                start: {
                    dateTime: new Date(selectedSlot.start).toISOString(),
                    timeZone: 'UTC'
                },
                end: {
                    dateTime: new Date(selectedSlot.end).toISOString(),
                    timeZone: 'UTC'
                },
                attendees: [{ email: userEmail }]
            },
            sendUpdates: 'all'
        }).then(response => {
            alert('Meeting scheduled successfully!');
        }).catch(error => {
            console.error('Error scheduling meeting:', error);
            alert('Error scheduling meeting.');
        });
    };

    return (
        <div>
            <h2>Available Time Slots:</h2>
            <div className="slots-container">
                <ul className="slots-list">
                    {availableTimes.map((slot, index) => (
                        <li key={index} className="slot-item">
                            <button onClick={() => setSelectedSlot(slot)}>
                                {slot.start.toLocaleString()} - {slot.end.toLocaleString()}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>

            {selectedSlot && (
                <div>
                    <h3>Schedule a Meeting</h3>
                    <input
                        type="email"
                        placeholder="Enter your email"
                        value={userEmail}
                        onChange={(e) => setUserEmail(e.target.value)}
                    />
                    <button onClick={handleScheduleMeeting}>Schedule Meeting</button>
                </div>
            )}
        </div>
    );
};

export default PublicCalendar;
