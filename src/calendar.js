import { gapi } from 'gapi-script';
import React, { useEffect, useState } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './Calendar.css'; 

const CLIENT_ID = '362129864986-nfo00hocjp0gm5th4l7fq7as3650p1g2.apps.googleusercontent.com';
const API_KEY = 'AIzaSyBlpvy6B0oCAx3gKiPbWYTue4dSuBIPoeQ';
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"];
const SCOPES = "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events";

const GoogleCalendar = () => {
    const localizer = momentLocalizer(moment);
    const [isSignedIn, setIsSignedIn] = useState(false);
    const [events, setEvents] = useState([]);
    const [emails, setEmails] = useState('');  // Changed to handle multiple emails
    const [availableTimes, setAvailableTimes] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [meetingDetails, setMeetingDetails] = useState({
        title: '',
        startTime: '',
        endTime: ''
    });

    useEffect(() => {
        const initClient = () => {
            gapi.client.init({
                apiKey: API_KEY,
                clientId: CLIENT_ID,
                discoveryDocs: DISCOVERY_DOCS,
                scope: SCOPES
            }).then(() => {
                const authInstance = gapi.auth2.getAuthInstance();
                setIsSignedIn(authInstance.isSignedIn.get());
                authInstance.isSignedIn.listen(setIsSignedIn);

                if (authInstance.isSignedIn.get()) {
                    listUpcomingEvents();
                } else {
                    handleSignIn();
                }
            }).catch(error => {
                console.error('Error initializing Google API client:', error);
            });
        };

        gapi.load('client:auth2', initClient);
    }, []);

    const listUpcomingEvents = () => {
        gapi.client.calendar.events.list({
            calendarId: 'primary',
            timeMin: (new Date()).toISOString(),
            showDeleted: false,
            singleEvents: true,
            maxResults: 50,
            orderBy: 'startTime'
        }).then(response => {
            const events = response.result.items.map(event => ({
                id: event.id,
                title: event.summary,
                start: new Date(event.start.dateTime || event.start.date),
                end: new Date(event.end.dateTime || event.end.date),
            }));
            setEvents(events);
        });
    };

    const searchAvailableTimes = () => {
        const emailList = emails.split(',').map(email => email.trim());  // Split emails by comma
        
        if (emailList.length === 0) {
            alert('Please enter at least one email to search.');
            return;
        }

        const timeMin = new Date().toISOString();
        const timeMax = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();  // Next 7 days

        Promise.all(
            emailList.map(email =>
                gapi.client.calendar.freebusy.query({
                    resource: {
                        timeMin,
                        timeMax,
                        items: [{ id: email }]
                    }
                }).then(response => {
                    const busySlots = response.result.calendars[email]?.busy || [];
                    return { email, busySlots };
                }).catch(error => {
                    console.error('Error fetching availability for email:', email, error);
                    return { email, busySlots: [] };  // Return empty if error
                })
            )
        ).then(allResponses => {
            const mergedBusySlots = mergeBusySlots(allResponses.map(resp => resp.busySlots));
            const freeSlots = calculateFreeSlots(mergedBusySlots, timeMin, timeMax);
            setAvailableTimes(freeSlots);
        });
    };

    const mergeBusySlots = (busySlotsArray) => {
        const merged = [];
        busySlotsArray.flat().sort((a, b) => new Date(a.start) - new Date(b.start)).forEach(slot => {
            if (merged.length === 0 || new Date(slot.start) > new Date(merged[merged.length - 1].end)) {
                merged.push(slot);
            } else {
                merged[merged.length - 1].end = new Date(Math.max(new Date(merged[merged.length - 1].end), new Date(slot.end)));
            }
        });
        return merged;
    };

    const calculateFreeSlots = (busySlots, timeMin, timeMax) => {
        const freeSlots = [];
        let lastEndTime = new Date(timeMin);

        busySlots.forEach(slot => {
            const startTime = new Date(slot.start);
            if (lastEndTime < startTime) {
                freeSlots.push({
                    start: lastEndTime,
                    end: startTime
                });
            }
            lastEndTime = new Date(slot.end);
        });

        if (lastEndTime < new Date(timeMax)) {
            freeSlots.push({
                start: lastEndTime,
                end: new Date(timeMax)
            });
        }

        return freeSlots;
    };

    const handleSignIn = () => {
        gapi.auth2.getAuthInstance().signIn();
    };

    const handleSignOut = () => {
        gapi.auth2.getAuthInstance().signOut();
    };

    const scheduleMeeting = () => {
        if (!meetingDetails.title || !selectedSlot) {
            alert('Please select a time slot and provide a meeting title.');
            return;
        }

        const emailList = emails.split(',').map(email => email.trim());  // Get the list of emails

        gapi.client.calendar.events.insert({
            calendarId: 'primary',  
            resource: {
                summary: meetingDetails.title,
                start: {
                    dateTime: new Date(selectedSlot.start).toISOString(),
                    timeZone: 'UTC'
                },
                end: {
                    dateTime: new Date(selectedSlot.end).toISOString(),
                    timeZone: 'UTC'
                },
                attendees: emailList.map(email => ({ email })),  // Schedule with multiple attendees
                conferenceData: {
                    createRequest: {
                        requestId: "sample123",  // Unique ID for each request
                        conferenceSolutionKey: {
                            type: "hangoutsMeet"
                        }
                    }
                }
            },
            sendUpdates: 'all'
        }).then(response => {
            alert('Meeting scheduled successfully, and invitation sent to ' + emails + '!');
            setMeetingDetails({ title: '', startTime: '', endTime: '' });
            listUpcomingEvents();  // Refresh the calendar
        }).catch(error => {
            alert('Error scheduling meeting: ' + error.message);
        });
    };

    return (
        <div className="container">
            <header className="header">
                <div className="header-title">
                    <img src="./assets/logo-acumen.png" alt="Logo" className="logo" />
                    <h1 className="cal"><span className='ac'>ACUMEN</span> CALENDAR</h1>
                </div>
                {isSignedIn && (
                    <div className="header-right">
                        <button onClick={handleSignOut}>Sign Out</button>
                    </div>
                )}
            </header>
    
            {isSignedIn ? (
                <div>
                    <div>
                        <h2>Search for people's available time:</h2>
                        <input
                            type="text"
                            placeholder="Enter emails (comma separated)"
                            value={emails}
                            onChange={(e) => setEmails(e.target.value)}
                        />
                        <button onClick={searchAvailableTimes}>Search</button>
                    </div>
    
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
    
                    <div className="calendar-container">
                        <h2>Calendar View:</h2>
                        <Calendar
                            localizer={localizer}
                            events={events}
                            startAccessor="start"
                            endAccessor="end"
                            style={{ height: 500 }}
                        />
                    </div>
    
                    <h2>Schedule a Meeting</h2>
                    <div>
                        <input
                            type="text"
                            placeholder="Meeting Title"
                            value={meetingDetails.title}
                            onChange={(e) => setMeetingDetails({ ...meetingDetails, title: e.target.value })}
                        />
                        <button onClick={scheduleMeeting}>Schedule Meeting</button>
                    </div>
                </div>
            ) : (
                <div>
                    <button onClick={handleSignIn}>Sign In with Google</button>
                </div>
            )}
        </div>
    );
    
};

export default GoogleCalendar;
