import React, { useState, useEffect } from 'react';
import BASE_API_URL from '../utils/apiConfig';
import './AddJob.css'; // Reusing styles

const AdmissionOpen = () => {
    const [currentAdmission, setCurrentAdmission] = useState(null);
    const [formData, setFormData] = useState({
        subheading: '',
        title: '',
        description: '',
        batchDate: '',
        time: '',
        formLink: '',
        badgeText: ''
    });
    const [imageFile, setImageFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        fetchCurrentAdmission();
    }, []);

    const fetchCurrentAdmission = async () => {
        try {
            const response = await fetch(`${BASE_API_URL}/api/admissionopen`);
            const data = await response.json();
            if (data && data._id) {
                setCurrentAdmission(data);
            } else {
                setCurrentAdmission(null);
            }
        } catch (err) {
            console.error('Error fetching admission open:', err);
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
            const response = await fetch(`${BASE_API_URL}/api/admissionopen`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formPayload
            });

            if (!response.ok) {
                throw new Error('Failed to upload admission details');
            }

            setMessage('Admission details added successfully!');
            setFormData({
                subheading: '',
                title: '',
                description: '',
                batchDate: '',
                time: '',
                formLink: '',
                badgeText: ''
            });
            setImageFile(null);
            fetchCurrentAdmission();
        } catch (err) {
            setError(err.message || 'Error uploading admission details');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this banner?")) return;
        setLoading(true);
        setMessage('');
        setError('');
        
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${BASE_API_URL}/api/admissionopen/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to delete admission banner');
            }

            setMessage('Admission banner deleted successfully!');
            fetchCurrentAdmission();
        } catch (err) {
            setError(err.message || 'Error deleting admission banner');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="formContainer">
            <h1 className="title">Admission Open Management</h1>
            
            {currentAdmission && (
                <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                    <h2>Current Admission Banner</h2>
                    <p><strong>Title:</strong> {currentAdmission.title}</p>
                    <p><strong>Subheading:</strong> {currentAdmission.subheading}</p>
                    <p><strong>Description:</strong> {currentAdmission.description}</p>
                    <p><strong>Batch Date:</strong> {currentAdmission.batchDate}</p>
                    <p><strong>Time:</strong> {currentAdmission.time}</p>
                    <p><strong>Badge:</strong> {currentAdmission.badgeText}</p>
                    <p><strong>Link:</strong> <a href={currentAdmission.formLink} target="_blank" rel="noreferrer">Form Link</a></p>
                    {currentAdmission.imageUrl && (
                        <div style={{ marginTop: '10px' }}>
                            <img src={currentAdmission.imageUrl} alt="Admission" style={{ maxWidth: '300px', borderRadius: '8px' }} />
                        </div>
                    )}
                    <button 
                        onClick={() => handleDelete(currentAdmission._id)} 
                        style={{ marginTop: '15px', backgroundColor: '#dc3545', color: 'white', padding: '10px 15px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        disabled={loading}
                    >
                        Delete Banner
                    </button>
                </div>
            )}

            <h2>Add New Admission Banner</h2>
            {message && <div style={{ color: 'green', marginBottom: '15px' }}>{message}</div>}
            {error && <div style={{ color: 'red', marginBottom: '15px' }}>{error}</div>}

            <form onSubmit={handleSubmit} className="form">
                <label className="label">Badge Text:
                    <input type="text" name="badgeText" value={formData.badgeText} onChange={handleChange} className="input" required disabled={loading} />
                </label>
                <label className="label">Subheading:
                    <input type="text" name="subheading" value={formData.subheading} onChange={handleChange} className="input" required disabled={loading} />
                </label>
                <label className="label">Title:
                    <input type="text" name="title" value={formData.title} onChange={handleChange} className="input" required disabled={loading} />
                </label>
                <label className="label">Description:
                    <textarea name="description" value={formData.description} onChange={handleChange} className="textarea" required disabled={loading}></textarea>
                </label>
                <label className="label">Batch Date:
                    <input type="text" name="batchDate" value={formData.batchDate} onChange={handleChange} className="input" required disabled={loading} />
                </label>
                <label className="label">Time:
                    <input type="text" name="time" value={formData.time} onChange={handleChange} className="input" required disabled={loading} />
                </label>
                <label className="label">Form Link:
                    <input type="url" name="formLink" value={formData.formLink} onChange={handleChange} className="input" required disabled={loading} />
                </label>
                <label className="label">Image (Max 1 image):
                    <input type="file" name="image" accept="image/*" onChange={handleFileChange} className="input" required disabled={loading} />
                </label>

                <button type="submit" className="submitButton" disabled={loading}>
                    {loading ? 'Submitting...' : 'Upload Admission Banner'}
                </button>
            </form>
        </div>
    );
};

export default AdmissionOpen;
