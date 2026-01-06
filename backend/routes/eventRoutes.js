import express from "express";
import Event from "../models/Event.js";


const router = express.Router();

// Create Event
router.post("/", async (req, res) => {
  try {
    const { title, description, location, userId, date } = req.body;

    // Validate input
    if (!title || !userId) {
      return res.status(400).json({ message: "Title and userId are required" });
    }

    // Convert date string to Date object if provided
    let eventDate;
    if (date) {
      eventDate = new Date(date);
      if (isNaN(eventDate)) eventDate = undefined; // invalid date fallback
    }

    // Create the event
    const event = await Event.create({
      title,
      description: description || "",
      location: location || "",
      date: eventDate,
      createdBy: userId,
    });

    return res.status(201).json({ success: true, data: event });
  } catch (error) {
    console.error("Error creating event:", error);
    return res.status(500).json({ message: "Server error while creating event" });
  }
});
  

// Get all events
router.get("/", async (req, res) => {
    try {
      // Just fetch all events as they are
      const events = await Event.find(); 
      res.status(200).json({ success: true, data: events });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: err.message });
    }
  })

// RSVP to Event
router.post("/:id/rsvp", async (req, res) => {
    try {
      const { status, userId } = req.body;
  
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "User ID is required"
        });
      }
  
      const event = await Event.findById(req.params.id);
      if (!event) {
        return res.status(404).json({
          success: false,
          message: "Event not found"
        });
      }
  
      const existingRsvp = event.rsvps.find(
        r => r.user.toString() === userId
      );
  
      if (existingRsvp) {
        existingRsvp.status = status;
      } else {
        event.rsvps.push({ user: userId, status });
      }
  
      await event.save();
  
      res.status(200).json({
        success: true,
        data: event
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        success: false,
        message: err.message
      });
    }
  });
  

export default router;
