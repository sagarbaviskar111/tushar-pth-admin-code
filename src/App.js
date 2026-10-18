// src/App.js
import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Home from './pages/Home';
import AddJob from './pages/AddJob';
import ListJobs from './pages/ListJobs';
import AddDepartment from './pages/AddDepartment';
import ListDepartments from './pages/ListDepartments';
import Layout from './components/Layout';
import UpdateJob from './pages/UpdateJob';
import AddArticle from './pages/AdminArticleForm';
import EditNews from './pages/EditNews';
import AddNews from './pages/AdminArticleForm';
import NewsList from './pages/ListNews';
import HRDatabase from './pages/HRDatabase';
import AdsManagement from './pages/AdsManagement';
import ListAds from './pages/ListAds';
import SEOArticleForm from './pages/SEOArticleForm';
import ListSEOArticles from './pages/ListSEOArticles';
import EmailInbox from './pages/EmailInbox';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));

  // Update authentication state on login
  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  // Clear authentication state on logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    setIsAuthenticated(false);
  };

  return (
    <Router basename="/superadmin">
      <Routes>
        {/* Redirect to home if authenticated; otherwise, show Login */}
        <Route
          path="/"
          element={
            isAuthenticated ? <Navigate to="/home" /> : <Login onLogin={handleLogin} />
          }
        />
        <Route
          path="/login"
          element={
            isAuthenticated ? <Navigate to="/home" /> : <Login onLogin={handleLogin} />
          }
        />

        {/* Protected Routes with Layout */}
        <Route
          path="/home"
          element={
            isAuthenticated ? (
              <Layout onLogout={handleLogout}>
                <Home />
              </Layout>
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route
          path="/add-job"
          element={
            isAuthenticated ? (
              <Layout onLogout={handleLogout}>
                <AddJob />
              </Layout>
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route
          path="/list-jobs"
          element={
            isAuthenticated ? (
              <Layout onLogout={handleLogout}>
                <ListJobs />
              </Layout>
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route
          path="/add-department"
          element={
            isAuthenticated ? (
              <Layout onLogout={handleLogout}>
                <AddDepartment />
              </Layout>
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route
          path="/list-departments"
          element={
            isAuthenticated ? (
              <Layout onLogout={handleLogout}>
                <ListDepartments />
              </Layout>
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route
          path="/update-job/:id"
          element={
            isAuthenticated ? (
              <Layout onLogout={handleLogout}>
                <UpdateJob />
              </Layout>
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route
          path="/hr-database"
          element={
            isAuthenticated ? (
              <Layout onLogout={handleLogout}>
                <HRDatabase />
              </Layout>
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route
          path="/add-seo-article"
          element={
            isAuthenticated ? (
              <Layout onLogout={handleLogout}>
                <SEOArticleForm />
              </Layout>
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route
          path="/list-seo-articles"
          element={
            isAuthenticated ? (
              <Layout onLogout={handleLogout}>
                <ListSEOArticles />
              </Layout>
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route
          path="/ads-management"
          element={
            isAuthenticated ? (
              <Layout onLogout={handleLogout}>
                <AdsManagement />
              </Layout>
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route
          path="/list-ads"
          element={
            isAuthenticated ? (
              <Layout onLogout={handleLogout}>
                <ListAds />
              </Layout>
            ) : (
              <Navigate to="/" />
            )
          }
        />

<Route
        path="/news"
        element={
            <Layout>
              <NewsList />
            </Layout>
        }
      />

      {/* Add News Page */}
      <Route
        path="/news/add"
        element={
            <Layout>
              <AddNews />
            </Layout>
        }
      />

      {/* Edit News Page */}
      <Route
        path="/news/edit/:id"
        element={
            <Layout>
              <EditNews />
            </Layout>
        }
      />
      
      <Route
        path="/email-inbox"
        element={
          isAuthenticated ? (
            <Layout onLogout={handleLogout}>
              <EmailInbox />
            </Layout>
          ) : (
            <Navigate to="/" />
          )
        }
      />

      </Routes>
    </Router>
  );
}

export default App;




