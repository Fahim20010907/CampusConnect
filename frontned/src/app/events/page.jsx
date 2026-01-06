"use client";

import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { AuthContext } from "@/context/Authcontext";



const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";


const EventsPage = () => {
  const { user } = useContext(AuthContext);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/events`);
      setEvents(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const createEvent = async () => {
    if (!user) return; // make sure user is logged in
    try {
      const response = await axios.post(`${API_URL}/api/events`, {
        title,
        description,
        location,
        date,
        userId: user.uid,
      });
      console.log("Event created:", response.data);
      setDate("")
      setLocation("")
      setTitle("")
      setDescription("")
    } catch (err) {
      console.error("Error creating event:", err);
    }
  };

  const handleRsvp = async (eventId, status) => {
    if (!user) return alert("Please login first");
  
    try {
      const res = await axios.post(
        `${API_URL}/api/events/${eventId}/rsvp`,
        {
          status,
          userId: user.uid, // 🔑 send userId explicitly
        }
      );
  
      setEvents(events.map(e => e._id === eventId ? res.data.data : e));
    } catch (err) {
      console.error(err);
    }
  };
  

  if (loading) return <p>Loading events...</p>;

  return (
    <div className="max-w-4xl mx-auto mt-10 p-4">
      {user && (
        <div className="mb-6 p-4 bg-white shadow rounded-lg">
          <h2 className="font-bold text-lg mb-2">Create Event</h2>
          <input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} className="border p-2 mb-2 w-full"/>
          <input placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} className="border p-2 mb-2 w-full"/>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="border p-2 mb-2 w-full"/>
          <input placeholder="Location" value={location} onChange={e => setLocation(e.target.value)} className="border p-2 mb-2 w-full"/>
          <button onClick={createEvent} className="bg-green-600 text-white px-4 py-2 rounded">Create</button>
        </div>
      )}

      <h2 className="text-2xl font-bold mb-4">Upcoming Events</h2>
      <div className="space-y-4">
        {events.map(event => (
          <div key={event._id} className="p-4 bg-white shadow rounded-lg">
            <h3 className="text-xl font-semibold">{event.title}</h3>
            <p className="text-gray-500">{event.description}</p>
            <p className="text-gray-400">
  {event.date ? new Date(event.date).toLocaleString() : "No date provided"} - {event.location}
</p>
            <div className="mt-2 flex space-x-2">
              <button onClick={() => handleRsvp(event._id, "Interested")} className="px-3 py-1 bg-blue-100 rounded">Interested</button>
              <button onClick={() => handleRsvp(event._id, "Going")} className="px-3 py-1 bg-green-100 rounded">Going</button>
              <span className="ml-2 text-sm">{event.rsvps?.length || 0} RSVPs</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EventsPage;
