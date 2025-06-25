import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import data from '../data/events.json'; // adjust path as needed
import '../styles/dashboard.css'; // You can create custom styles

const priorityColors = {
  "Critical": "#ef4444",
  "High Priority": "#f97316",
  "Medium Priority": "#facc15",
  "Low Priority": "#22c55e",
  "Reminder": "#3b82f6",
  "Scheduled": "#8b5cf6"
};

const DashboardAnalytics = () => {
  const [monthlyCount, setMonthlyCount] = useState([]);
  const [priorityCount, setPriorityCount] = useState({});
  const [upcomingEvents, setUpcomingEvents] = useState([]);

  useEffect(() => {
    const byMonth = {};
    const byPriority = {};
    const upcoming = [];

    const today = new Date();

    data.forEach(item => {
      const date = new Date(item.date);
      const monthKey = date.toLocaleString('default', { month: 'short' });

      byMonth[monthKey] = (byMonth[monthKey] || 0) + 1;

      if (item.status) {
        byPriority[item.status] = (byPriority[item.status] || 0) + 1;
      }

      if (date >= today) {
        upcoming.push({ ...item, date });
      }
    });

    const monthlyData = Object.entries(byMonth).map(([month, count]) => ({
      month,
      count
    }));

    setMonthlyCount(monthlyData);
    setPriorityCount(byPriority);
    setUpcomingEvents(
      upcoming.sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 5)
    );
  }, []);

  return (
    <div className="dashboard-container">
      <h2 className="dashboard-title">📊 Event Analytics Dashboard</h2>

      {/* Bar Chart */}
      <div className="dashboard-section">
        <h3>Monthly Event Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyCount}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#6366f1" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Priority Summary */}
      <div className="dashboard-section priority-cards">
        {Object.entries(priorityCount).map(([priority, count]) => (
          <div
            key={priority}
            className="priority-card"
            style={{ backgroundColor: priorityColors[priority] || '#e5e7eb' }}
          >
            <h4>{priority}</h4>
            <p>{count} events</p>
          </div>
        ))}
      </div>

      {/* Upcoming Events */}
      <div className="dashboard-section">
        <h3>🗓️ Upcoming Events</h3>
        <ul className="upcoming-list">
          {upcomingEvents.map((event, index) => (
            <li key={index}>
              <strong>{new Date(event.date).toLocaleDateString()}</strong> - {event.name}{" "}
              {event.status && (
                <span className="event-status">({event.status})</span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default DashboardAnalytics;
