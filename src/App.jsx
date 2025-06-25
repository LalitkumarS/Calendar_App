// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MonthlyCalendar from "./components/MonthlyCalendar";
import DashboardAnalytics from "./pages/DashboardAnalytics";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MonthlyCalendar />} />
        <Route path="/dashboard" element={<DashboardAnalytics />} />
      </Routes>
    </Router>
  );
};

export default App;
