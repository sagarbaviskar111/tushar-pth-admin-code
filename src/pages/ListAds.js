import React, { useState, useEffect } from 'react';
import BASE_API_URL from '../utils/apiConfig';
import './AddJob.css';

const ListAds = () => {
    const [ads, setAds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchAds = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${BASE_API_URL}/api/ads`);
            if (!response.ok) {
                throw new Error('Failed to fetch ads');
            }
            const data = await response.json();
            setAds(data);
        } catch (err) {
            setError('Error loading ads: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAds();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this Ad?")) return;
        
        try {
            const response = await fetch(`${BASE_API_URL}/api/ads`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id })
            });
            if (!response.ok) {
                throw new Error('Failed to delete ad');
            }
            // Refresh list
            fetchAds();
        } catch (err) {
            alert('Error deleting ad: ' + err.message);
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '100%' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>List of Ads</h1>
            <p style={{ color: '#64748b', marginBottom: '24px', fontSize: '14px' }}>
                Manage all active promotional ads showing on the Main Website.
            </p>

            {error && <div style={{ color: 'red', marginBottom: '15px' }}>{error}</div>}

            {loading ? (
                <p>Loading Ads...</p>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                    {ads.length === 0 ? (
                        <p style={{ color: '#64748b' }}>No ads available. Create one from the Ads Management page.</p>
                    ) : (
                        ads.map(ad => (
                            <div key={ad.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '15px', backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    <span style={{ 
                                        backgroundColor: ad.placement === 'popup' ? '#8b5cf6' : '#f59e0b', 
                                        color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' 
                                    }}>
                                        {ad.placement.toUpperCase()}
                                    </span>
                                    <button 
                                        onClick={() => handleDelete(ad.id)} 
                                        style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                                    >
                                        Delete
                                    </button>
                                </div>
                                <h3 style={{ margin: '10px 0', fontSize: '18px', color: '#1e293b' }}>{ad.title}</h3>
                                {ad.imageUrl && (
                                    <img src={ad.imageUrl} alt={ad.title} style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '4px', marginBottom: '10px' }} />
                                )}
                                <p style={{ color: '#475569', fontSize: '14px', marginBottom: '10px' }}>{ad.description}</p>
                                <a href={ad.link} target="_blank" rel="noopener noreferrer" style={{ color: '#0ea5e9', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>
                                    🔗 View Ad Link
                                </a>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default ListAds;
