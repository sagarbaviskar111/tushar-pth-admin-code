import React, { useState, useEffect } from 'react';
import BASE_API_URL from '../utils/apiConfig';
import './AddJob.css'; // Reusing styles

const EventBanner = () => {
    const [currentEvent, setCurrentEvent] = useState(null);
    const [formData, setFormData] = useState({
        badgeText: '',
        eventName: '',
        description: '',
        date: '',
        time: '',
        link: ''
    });
    const [imageFile, setImageFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        fetchCurrentEvent();
    }, []);

    const fetchCurrentEvent = async () => {
        try {
            const response = await fetch(`${BASE_API_URL}/api/eventbanner`);
            const data = await response.json();
            if (data && data._id) {
                setCurrentEvent(data);
            } else {
                setCurrentEvent(null);
            }
        } catch (err) {
            console.error('Error fetching event banner:', err);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleFileChange = (e) => {
        setImageFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setError('');

        try {
            const formPayload = new FormData();
            for (const key in formData) {
                formPayload.append(key, formData[key]);
            }
            if (imageFile) {
                formPayload.append('image', imageFile);
            }

            const token = localStorage.getItem('token');
            const response = await fetch(`${BASE_API_URL}/api/eventbanner`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formPayload
            });

            if (!response.ok) {
                throw new Error('Failed to upload event banner details');
            }

            setMessage('Event banner added successfully!');
            setFormData({
                badgeText: '',
                eventName: '',
                description: '',
                date: '',
                time: '',
                link: ''
            });
            setImageFile(null);
            fetchCurrentEvent();
        } catch (err) {
            setError(err.message || 'Error uploading event banner details');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this event banner?")) return;
        setLoading(true);
        setMessage('');
        setError('');
        
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${BASE_API_URL}/api/eventbanner/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to delete event banner');
            }

            setMessage('Event banner deleted successfully!');
            fetchCurrentEvent();
        } catch (err) {
            setError(err.message || 'Error deleting event banner');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="formContainer">
            <h1 className="title">Event Banner Management</h1>
            
            {currentEvent && (
                <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                    <h2>Current Event Banner</h2>
                    <p><strong>Event Name:</strong> {currentEvent.eventName}</p>
                    <p><strong>Description:</strong> {currentEvent.description}</p>
                    <p><strong>Date:</strong> {currentEvent.date}</p>
                    <p><strong>Time:</strong> {currentEvent.time}</p>
                    <p><strong>Badge:</strong> {currentEvent.badgeText}</p>
                    <p><strong>Link:</strong> <a href={currentEvent.link} target="_blank" rel="noreferrer">Form Link</a></p>
                    {currentEvent.imageUrl && (
                        <div style={{ marginTop: '10px' }}>
                            <img src={currentEvent.imageUrl} alt="Event Banner" style={{ maxWidth: '300px', borderRadius: '8px' }} />
                        </div>
                    )}
                    <button 
                        onClick={() => handleDelete(currentEvent._id)} 
                        style={{ marginTop: '15px', backgroundColor: '#dc3545', color: 'white', padding: '10px 15px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        disabled={loading}
                    >
                        Delete Banner
                    </button>
                </div>
            )}

            <h2>Add New Event Banner</h2>
            {message && <div style={{ color: 'green', marginBottom: '15px' }}>{message}</div>}
            {error && <div style={{ color: 'red', marginBottom: '15px' }}>{error}</div>}

            <form onSubmit={handleSubmit} className="form">
                <label className="label">Badge Text:
                    <input type="text" name="badgeText" value={formData.badgeText} onChange={handleChange} className="input" required disabled={loading} />
                </label>
                <label className="label">Event Name:
                    <input type="text" name="eventName" value={formData.eventName} onChange={handleChange} className="input" required disabled={loading} />
                </label>
                <label className="label">Description:
                    <textarea name="description" value={formData.description} onChange={handleChange} className="textarea" required disabled={loading}></textarea>
                </label>
                <label className="label">Date:
                    <input type="text" name="date" value={formData.date} onChange={handleChange} className="input" required disabled={loading} />
                </label>
                <label className="label">Time:
                    <input type="text" name="time" value={formData.time} onChange={handleChange} className="input" required disabled={loading} />
                </label>
                <label className="label">Link:
                    <input type="url" name="link" value={formData.link} onChange={handleChange} className="input" required disabled={loading} />
                </label>
                <label className="label">Image (Max 1 image):
                    <input type="file" name="image" accept="image/*" onChange={handleFileChange} className="input" required disabled={loading} />
                </label>

                <button type="submit" className="submitButton" disabled={loading}>
                    {loading ? 'Submitting...' : 'Upload Event Banner'}
                </button>
            </form>
        </div>
    );
};

export default EventBanner;
