import React, { useState, useEffect, useRef } from "react";
import events from "../data/events.json";
import EventModal from "./EventModal";
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameDay
} from "date-fns";
import {
  DragDropContext,
  Droppable,
  Draggable
} from "react-beautiful-dnd";
import "../styles/calendar.css";

const statusOptions = [
  "Critical",
  "High Priority",
  "Medium Priority",
  "Low Priority",
  "Reminder",
  "Scheduled"
];

const priorityIcons = {
  "Critical": "🔴",
  "High Priority": "🟠",
  "Medium Priority": "🟡",
  "Low Priority": "🟢",
  "Reminder": "🔔",
  "Scheduled": "📅"
};

const MonthlyCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [userEvents, setUserEvents] = useState([]);
  const [hoveredDay, setHoveredDay] = useState(null);
  const [clickedEvent, setClickedEvent] = useState(null);
  const [filterPriority, setFilterPriority] = useState("All");
  const [viewMode, setViewMode] = useState("monthly");
  const calendarRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem("userEvents");
    if (stored) setUserEvents(JSON.parse(stored));
  }, []);

  useEffect(() => {
    localStorage.setItem("userEvents", JSON.stringify(userEvents));
  }, [userEvents]);
const handleClick = (date) => {
  const dateStr = format(date, "yyyy-MM-dd");
  const holiday = events.find((e) => e.date === dateStr);
  const personalEvents = userEvents.filter((e) => e.date === dateStr);

  setSelectedDate(date);
  setClickedEvent({ date, holiday, events: personalEvents });
};


  const handleEventSubmit = (eventData) => {
  const isUpdate = clickedEvent && clickedEvent.id;
  const eventDateStr = format(selectedDate, "yyyy-MM-dd");

  // If event has time range like "13:00 - 15:00"
  if (eventData.time?.includes(" - ")) {
    const [newStart, newEnd] = eventData.time.split(" - ").map(t => new Date(`${eventDateStr}T${t}`));

    const conflictingEvent = userEvents.find(e => {
      if (isUpdate && e.id === clickedEvent.id) return false;
      if (e.date !== eventDateStr || !e.time || !e.time.includes(" - ")) return false;

      const [start, end] = e.time.split(" - ").map(t => new Date(`${eventDateStr}T${t}`));
      return newStart < end && newEnd > start; // Overlap check
    });

    if (conflictingEvent) {
      const confirm = window.confirm(
        `⚠️ Conflict with "${conflictingEvent.name}" at ${conflictingEvent.time}.\nProceed anyway?`
      );
      if (!confirm) return;
    }
  }

  if (isUpdate) {
    setUserEvents((prev) =>
      prev.map((e) => (e.id === clickedEvent.id ? { ...e, ...eventData } : e))
    );
  } else {
    const newEvent = {
      ...eventData,
      date: eventDateStr,
      id: uuidv4()
    };
    setUserEvents((prev) => [...prev, newEvent]);
  }

  setSelectedDate(null);
  setClickedEvent(null);
};


  const handleDeleteEvent = (eventToDelete) => {
    setUserEvents((prev) => prev.filter((e) => e.id !== eventToDelete.id));
    setSelectedDate(null);
    setClickedEvent(null);
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const { destination, draggableId } = result;
    const draggedEvent = userEvents.find(e => e.id === draggableId);
    if (!draggedEvent) return;

    const updatedEvent = { ...draggedEvent, date: destination.droppableId };
    setUserEvents((prev) =>
      prev.map((e) => (e.id === draggableId ? updatedEvent : e))
    );
  };

  const generateCalendar = () => {
  const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 });
  const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });
  const days = [];
  let day = start;

  while (day <= end) {
    for (let i = 0; i < 7; i++) {
      const clonedDate = new Date(day);
      const dateStr = format(clonedDate, "yyyy-MM-dd");
      const holiday = events.find((e) => e.date === dateStr);
      const dayEvents = userEvents.filter((e) => e.date === dateStr);
      const isHighlight = filterPriority !== "All" && dayEvents.some((e) => e.status === filterPriority);

      // Check if there's a time conflict (same time used more than once)
      const timeCounts = {};
      let hasConflict = false;
      for (let ev of dayEvents) {
        if (ev.time) {
          if (!timeCounts[ev.time]) timeCounts[ev.time] = 0;
          timeCounts[ev.time]++;
          if (timeCounts[ev.time] > 1) {
            hasConflict = true;
            break;
          }
        }
      }

      days.push(
        <Droppable droppableId={dateStr} key={dateStr}>
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`calendar-day ${isSameDay(clonedDate, new Date()) ? "today" : ""} 
                ${isHighlight ? "highlight-priority" : ""} 
                ${hasConflict ? "conflict-day" : ""}`}
              onClick={() => handleClick(clonedDate)}
              onMouseEnter={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setHoveredDay({
                  date: clonedDate,
                  holiday,
                  top: rect.top + window.scrollY,
                  left: rect.left + window.scrollX
                });
              }}
              onMouseLeave={() => setHoveredDay(null)}
            >
              <div className="day-number">
                {format(clonedDate, "d")}
                {hasConflict && <span className="conflict-icon">⚠️</span>}
              </div>
              {holiday && <div className="holiday">{holiday.name}</div>}
              {dayEvents
                .filter(e => filterPriority === "All" || e.status === filterPriority)
                .map((event, index) => (
                  <Draggable key={event.id} draggableId={event.id} index={index}>
                    {(provided) => (
                      <div
                        className="personal-event"
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        ref={provided.innerRef}
                        style={{
                          ...provided.draggableProps.style,
                          background: "#f0f4ff",
                          margin: "4px 0",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          fontSize: "0.9em"
                        }}
                      >
                        {priorityIcons[event.status]}{" "}
                        {event.time && <span>{event.time} - </span>}
                        {event.name}
                      </div>
                    )}
                  </Draggable>
                ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      );
      day = addDays(day, 1);
    }
  }
  return days;
};


  const monthStr = format(currentDate, "yyyy-MM");
  const currentMonthEvents = [
    ...events.filter((e) => e.date.startsWith(monthStr)),
    ...userEvents.filter((e) => e.date.startsWith(monthStr))
  ];

  return (
    <div className="calendar-bg">
      <div className="calendar-wrapper" ref={calendarRef}>

        {/* Sidebar */}
        <div className="events-sidebar">
          <h3 className="sidebar-title">Events in {format(currentDate, "MMMM")}</h3>

          <div className="my-2">
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-2 px-4 rounded w-full transition duration-300"
            >
              View Dashboard
            </button>
          </div>

          <div className="event-list">
            {statusOptions.map((priority) => {
              const filteredEvents = currentMonthEvents.filter((e) => e.status === priority);
              return filteredEvents.length > 0 ? (
                <div key={priority}>
                  <h4 className="priority-label">{priority}</h4>
                  {filteredEvents.map((e, index) => (
                    <div
                      key={e.id || index}
                      className="event-item"
                      onClick={() => handleClick(new Date(e.date))}
                    >
                      <strong>{format(new Date(e.date), "dd MMM")}:</strong>{" "}
                      {priorityIcons[e.status]} {e.name}
                      {e.time && <div className="event-time">{e.time}</div>}
                    </div>
                  ))}
                </div>
              ) : null;
            })}
          </div>
        </div>

        {/* Main Calendar */}
        <div className="calendar-main">
          <div className="calendar-header">
            <button className="nav-btn" onClick={() => setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1))}>←</button>
            <h2 style={{ margin: "0 10px" }}>{format(currentDate, "MMMM yyyy")}</h2>
            <button className="nav-btn" onClick={() => setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1))}>→</button>
          </div>

          {/* View Toggle Buttons */}
          <div className="flex gap-4 my-4">
            {["daily", "weekly", "monthly"].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-4 py-2 rounded-full font-medium transition-all duration-300 
                  ${viewMode === mode
                    ? "bg-indigo-600 text-white shadow-md"
                    : "bg-gray-100 hover:bg-indigo-100 text-gray-800"}`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex justify-end mb-4">
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="priority-filter-dropdown"
            >
              <option value="All">All Priorities</option>
              {statusOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {viewMode === "monthly" && (
            <>
              <div className="calendar-days">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <div key={d} className="calendar-day-name">{d}</div>
                ))}
              </div>
              <DragDropContext onDragEnd={onDragEnd}>
                <div className="calendar-grid">{generateCalendar()}</div>
              </DragDropContext>
            </>
          )}

          {viewMode === "weekly" && (
            <div className="weekly-view grid grid-cols-7 gap-4 mt-4">
              {[...Array(7)].map((_, i) => {
                const day = addDays(startOfWeek(currentDate), i);
                const dayStr = format(day, "yyyy-MM-dd");
                const dayEvents = userEvents.filter((e) => e.date === dayStr);
                return (
                  <div key={i} className="border p-2 rounded bg-gray-50">
                    <h4 className="font-bold mb-2">{format(day, "EEE, MMM d")}</h4>
                    {dayEvents.length > 0 ? (
                      dayEvents.map((event) => (
                        <div key={event.id} className="text-sm mb-1 bg-white p-1 rounded shadow-sm">
                          {priorityIcons[event.status]} {event.time && `${event.time} -`} {event.name}
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-400 text-sm">No events</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {viewMode === "daily" && (
            <div className="daily-view mt-4 border rounded p-4 bg-gray-50">
              <h4 className="text-lg font-semibold mb-3">{format(currentDate, "EEEE, MMMM d, yyyy")}</h4>
              {userEvents.filter((e) => e.date === format(currentDate, "yyyy-MM-dd")).length > 0 ? (
                userEvents
                  .filter((e) => e.date === format(currentDate, "yyyy-MM-dd"))
                  .map((event) => (
                    <div key={event.id} className="bg-white p-2 rounded shadow mb-2 text-sm">
                      {priorityIcons[event.status]} {event.time && `${event.time} -`} {event.name}
                    </div>
                  ))
              ) : (
                <p className="text-gray-400 text-sm">No events scheduled for today.</p>
              )}
            </div>
          )}
        </div>
{selectedDate && (
 <EventModal
  date={selectedDate}
  events={userEvents.filter((e) => e.date === format(selectedDate, "yyyy-MM-dd"))}
  onClose={() => {
    setSelectedDate(null);
    setClickedEvent(null);
  }}
  onSubmit={handleEventSubmit}
  onDelete={handleDeleteEvent}
  existingEvent={clickedEvent}
/>

)}


        {hoveredDay && (
          <div
            className="event-card-popup"
            style={{ top: hoveredDay.top + 40, left: hoveredDay.left + 10 }}
          >
            <div className="event-card">
              <div className="event-date">{format(hoveredDay.date, "EEEE, d MMMM yyyy")}</div>
              {hoveredDay.holiday && (
                <div className="event-holiday">🏖 <strong>Holiday:</strong> {hoveredDay.holiday.name}</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MonthlyCalendar;
