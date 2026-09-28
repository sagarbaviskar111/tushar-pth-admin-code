import React, { useState } from 'react';
import BASE_API_URL from '../utils/apiConfig';
import './AddJob.css'; // Reusing styles

const AdsManagement = () => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        placement: 'popup',
        link: '',
        imageUrl: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({
                    ...formData,
                    imageUrl: reader.result // This is the base64 string
                });
            };
            reader.readAsDataURL(file);
        } else {
            setFormData({
                ...formData,
                imageUrl: ''
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setError('');

        try {
            // Send the Ad data to our newly created API endpoint
            const response = await fetch(`${BASE_API_URL}/api/ads`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                throw new Error('Failed to create ad');
            }

            setMessage('Ad added successfully! You can view it in the List of Ads.');
            setFormData({
                title: '',
                description: '',
                placement: 'popup',
                link: '',
                imageUrl: ''
            });
            // Reset file input
            document.getElementById('ad-image-upload').value = '';
        } catch (err) {
            setError(err.message || 'Error creating ad');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="formContainer">
            <h1 className="title">Ads Management</h1>
            <p style={{ color: '#64748b', marginBottom: '20px' }}>
                Create new promotional ads here. They will automatically be sent to the Main Website.
            </p>

            {message && <div style={{ color: 'green', marginBottom: '15px', padding: '10px', backgroundColor: '#e6ffe6', borderRadius: '4px' }}>{message}</div>}
            {error && <div style={{ color: 'red', marginBottom: '15px', padding: '10px', backgroundColor: '#ffe6e6', borderRadius: '4px' }}>{error}</div>}

            <form onSubmit={handleSubmit} className="form">
                <label className="label">Ad Placement Type:
                    <select name="placement" value={formData.placement} onChange={handleChange} className="input" required disabled={loading}>
                        <option value="popup">Website Popup Ad</option>
                        <option value="inline">Inline / Near Apply Now Button</option>
                    </select>
                </label>

                <label className="label">Ad Title / Event Name:
                    <input type="text" name="title" value={formData.title} onChange={handleChange} className="input" disabled={loading} placeholder="e.g. Mega Job Fair 2026" />
                </label>

                <label className="label">Description (HTML supported):
                    <textarea name="description" value={formData.description} onChange={handleChange} className="textarea" disabled={loading} placeholder="Enter ad description here... You can use HTML tags like <b>bold</b>, <br/>, etc."></textarea>
                </label>

                <label className="label">Ad Link (URL):
                    <input type="url" name="link" value={formData.link} onChange={handleChange} className="input" disabled={loading} placeholder="e.g. https://google.com/form" />
                </label>

                <label className="label">Ad Image (Upload):
                    <input type="file" id="ad-image-upload" accept="image/*" onChange={handleFileChange} className="input" disabled={loading} />
                </label>

                {formData.imageUrl && (
                    <div style={{ marginBottom: '15px' }}>
                        <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '5px' }}>Image Preview:</p>
                        <img src={formData.imageUrl} alt="Preview" style={{ maxWidth: '200px', borderRadius: '4px', border: '1px solid #e2e8f0' }} />
                    </div>
                )}

                <button type="submit" className="submitButton" disabled={loading} style={{ backgroundColor: '#0ea5e9' }}>
                    {loading ? 'Publishing...' : 'Publish Ad'}
                </button>
            </form>
        </div>
    );
};

export default AdsManagement;
