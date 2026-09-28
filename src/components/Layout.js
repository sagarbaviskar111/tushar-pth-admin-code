// src/components/Layout.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Layout.css';

const Layout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="layout-container">
      {/* Sidebar Toggle Button */}
      <button className="sidebar-toggle" onClick={toggleSidebar}>
        ☰
      </button>
      
      {/* Sidebar */}
      <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <h3>Admin Panel</h3>
        <ul>
          <li>
            <Link to="/home">Home</Link>
          </li>
          <li>
            <Link to="/add-job">Add Job</Link>
          </li>
          <li>
            <Link to="/list-jobs">List Jobs</Link>
          </li>
          <li>
            <Link to="/add-department">Add Department</Link>
          </li>
          <li>
            <Link to="/list-departments">List Departments</Link>
          </li>
          <li>
            <Link to="/add-seo-article">Add SEO Article</Link>
          </li>
          <li>
            <Link to="/list-seo-articles">List SEO Articles</Link>
          </li>
          <li>
            <Link to="/hr-database">HR Database</Link>
          </li>
          <li>
            <Link to="/email-inbox">Email Inbox</Link>
          </li>
          <li>
            <Link to="/ads-management">Ads Management</Link>
          </li>
          <li>
            <Link to="/list-ads">List Of Ads</Link>
          </li>
        </ul>
      </div>

      {/* Main Content */}
      <div className="main-content">{children}</div>
    </div>
  );
};

export default Layout;