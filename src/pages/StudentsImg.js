import React, { useState, useEffect } from 'react';
import BASE_API_URL from '../utils/apiConfig';
import './AddJob.css'; // Reusing styles

const StudentsImg = () => {
    const [images, setImages] = useState([]);
    const [selectedFiles, setSelectedFiles] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        fetchImages();
    }, []);

    const fetchImages = async () => {
        try {
            const response = await fetch(`${BASE_API_URL}/api/studentsimg?admin=true`);
            const data = await response.json();
            if (Array.isArray(data)) {
                setImages(data);
            } else {
                setImages([]);
            }
        } catch (err) {
            console.error('Error fetching student images:', err);
        }
    };

    const handleFileChange = (e) => {
        setSelectedFiles(e.target.files);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!selectedFiles || selectedFiles.length === 0) {
            setError('Please select at least one image');
            return;
        }

        if (selectedFiles.length > 10) {
            setError('You can only upload up to 10 images at once.');
            return;
        }

        setLoading(true);
        setMessage('');
        setError('');

        try {
            const formPayload = new FormData();
            for (let i = 0; i < selectedFiles.length; i++) {
                formPayload.append('images', selectedFiles[i]);
            }

            const token = localStorage.getItem('token');
            const response = await fetch(`${BASE_API_URL}/api/studentsimg`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formPayload
            });

            if (!response.ok) {
                throw new Error('Failed to upload images');
            }

            setMessage('Images uploaded successfully!');
            setSelectedFiles(null);
            // Reset the file input field
            e.target.reset();
            fetchImages();
        } catch (err) {
            setError(err.message || 'Error uploading images');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this student image?")) return;
        setLoading(true);
        setMessage('');
        setError('');
        
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${BASE_API_URL}/api/studentsimg/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to delete image');
            }

            setMessage('Image deleted successfully!');
            fetchImages();
        } catch (err) {
            setError(err.message || 'Error deleting image');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="formContainer">
            <h1 className="title">Happy Students Images Management</h1>
            
            <h2>Upload New Images</h2>
            {message && <div style={{ color: 'green', marginBottom: '15px' }}>{message}</div>}
            {error && <div style={{ color: 'red', marginBottom: '15px' }}>{error}</div>}

            <form onSubmit={handleSubmit} className="form" style={{ marginBottom: '30px' }}>
                <label className="label">Images (Select up to 10):
                    <input 
                        type="file" 
                        name="images" 
                        accept="image/*" 
                        multiple 
                        onChange={handleFileChange} 
                        className="input" 
                        required 
                        disabled={loading} 
                    />
                </label>

                <button type="submit" className="submitButton" disabled={loading}>
                    {loading ? 'Uploading Images...' : 'Upload Images'}
                </button>
            </form>

            <h2>Current Images ({images.length})</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginTop: '20px' }}>
                {images.length > 0 ? (
                    images.map((img, index) => {
                        const imgUrl = typeof img === 'string' ? img : (img.imageUrl || img.image);
                        const id = typeof img === 'string' ? null : img._id;
                        return (
                            <div key={id || index} style={{ border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                                <img src={imgUrl} alt={`Student ${index}`} style={{ width: '200px', height: '200px', objectFit: 'cover' }} />
                                {id ? (
                                    <button 
                                        onClick={() => handleDelete(id)}
                                        style={{ backgroundColor: '#dc3545', color: 'white', padding: '10px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                                        disabled={loading}
                                    >
                                        Delete
                                    </button>
                                ) : (
                                    <div style={{ padding: '10px', textAlign: 'center', fontSize: '12px', color: '#666' }}>
                                        (Image ID missing)
                                    </div>
                                )}
                            </div>
                        );
                    })
                ) : (
                    <p>No images found.</p>
                )}
            </div>
        </div>
    );
};

export default StudentsImg;
