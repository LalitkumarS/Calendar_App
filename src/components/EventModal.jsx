import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import "../styles/EventModal.css";

const statusOptions = [
  "Critical", "High Priority", "Medium Priority",
  "Low Priority", "Reminder", "Scheduled"
];

const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let min of [0, 30]) {
      const suffix = hour >= 12 ? "PM" : "AM";
      const displayHour = hour % 12 === 0 ? 12 : hour % 12;
      slots.push(
        `${displayHour.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")} ${suffix}`
      );
    }
  }
  return slots;
};

const timeSlots = generateTimeSlots();

const EventModal = ({
  date,
  onClose,
  onSubmit,
  onDelete,
  existingEvent = null,
  events = []
}) => {
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("Critical");
  const [editingId, setEditingId] = useState(null);
  const [mode, setMode] = useState("add");

  useEffect(() => {
    if (existingEvent) {
      setTitle(existingEvent.name || "");
      setTime(existingEvent.time || "");
      setCategory(existingEvent.category || "");
      setStatus(existingEvent.status || "Critical");
      setEditingId(existingEvent.id || null);
    } else {
      resetForm();
    }
  }, [existingEvent]);

  const resetForm = () => {
    setTitle("");
    setTime("");
    setCategory("");
    setStatus("Critical");
    setEditingId(null);
  };

  const handleSave = () => {
    if (title.trim() === "" || time === "") return;

    const eventData = {
      id: editingId || null,
      name: title.trim(),
      time,
      category,
      status,
      date: format(date, "yyyy-MM-dd")
    };

    onSubmit(eventData);
    resetForm();
    setMode("add");
  };

  const handleEdit = (event) => {
    setTitle(event.name);
    setTime(event.time || "");
    setCategory(event.category || "");
    setStatus(event.status);
    setEditingId(event.id);
    setMode("add");
  };

  const handleDelete = (event) => {
    if (onDelete && event.id) {
      onDelete(event);
      if (editingId === event.id) resetForm();
    }
  };

  const checkConflict = (event) =>
    events.filter((e) => e.time === event.time).length > 1;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3 className="modal-title">
          Events on {format(date, "dd MMMM yyyy")}
        </h3>

        {/* Mode Buttons */}
        <div className="event-modal-button-row">
          <div className="left-btn">
            <button
              className={`btn ${mode === "edit" ? "save" : "cancel"}`}
              onClick={() => setMode(mode === "edit" ? "add" : "edit")}
            >
              {mode === "edit" ? "Hide Edit" : "Edit Existing"}
            </button>
          </div>
          <div className="right-btn">
            <button
              className={`btn ${mode === "delete" ? "delete" : "cancel"}`}
              onClick={() => setMode(mode === "delete" ? "add" : "delete")}
            >
              {mode === "delete" ? "Hide Delete" : "Delete Existing"}
            </button>
          </div>
        </div>

        {/* Existing Events */}
        {mode !== "add" && events.length > 0 && (
          <div className="existing-events mb-4">
            <h4 className="text-md font-semibold mb-1">
              Manage Existing Events:
            </h4>
            {events.map((event) => (
              <div
                key={event.id}
                className="bg-gray-100 p-2 rounded mb-2 relative"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <strong>{event.name}</strong>{" "}
                    {checkConflict(event) && (
                      <span className="text-yellow-500 text-sm" title="Conflict">⚠️</span>
                    )}
                    <div className="text-sm">{event.time}</div>
                    <div className="text-sm text-indigo-700">
                      {event.status}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    {mode === "edit" && (
                      <button
                        className="text-blue-600 underline text-sm"
                        onClick={() => handleEdit(event)}
                      >
                        Edit
                      </button>
                    )}
                    {mode === "delete" && (
                      <button
                        className="text-red-600 underline text-sm"
                        onClick={() => handleDelete(event)}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit Form */}
        <h4 className="font-semibold mb-2">
          {editingId ? "Edit Event" : "Add New Event"}
        </h4>

        <input
          type="text"
          placeholder="Event title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="modal-input"
        />

        <select
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="modal-input"
        >
          <option value="">Select time</option>
          {timeSlots.map((slot) => (
            <option key={slot} value={slot}>
              {slot}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Category (e.g. Meeting)"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="modal-input"
        />

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="modal-input"
        >
          {statusOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <div className="modal-buttons">
          <button
            className="btn cancel"
            onClick={() => {
              onClose();
              resetForm();
              setMode("add");
            }}
          >
            Close
          </button>
          <button className="btn save" onClick={handleSave}>
            {editingId ? "Update" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventModal;
