import React, { useState, useEffect } from 'react';
import BASE_API_URL from '../utils/apiConfig';
import './AddJob.css';

const ListSEOArticles = () => {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchArticles = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${BASE_API_URL}/api/articles`);
            if (!response.ok) {
                throw new Error('Failed to fetch articles');
            }
            const data = await response.json();
            setArticles(data);
        } catch (err) {
            setError('Error loading articles: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchArticles();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this SEO Article?")) return;
        
        try {
            const response = await fetch(`${BASE_API_URL}/api/articles?id=${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) {
                throw new Error('Failed to delete article');
            }
            // Refresh list
            fetchArticles();
        } catch (err) {
            alert('Error deleting article: ' + err.message);
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '100%' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>List of SEO Articles</h1>
            <p style={{ color: '#64748b', marginBottom: '24px', fontSize: '14px' }}>
                Manage all your highly optimized blog posts.
            </p>

            {error && <div style={{ color: 'red', marginBottom: '15px' }}>{error}</div>}

            {loading ? (
                <p>Loading Articles...</p>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderRadius: '8px', overflow: 'hidden' }}>
                        <thead style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                            <tr>
                                <th style={{ padding: '12px 15px', textAlign: 'left', color: '#475569', fontWeight: '600' }}>Blog Title</th>
                                <th style={{ padding: '12px 15px', textAlign: 'left', color: '#475569', fontWeight: '600' }}>URL Slug</th>
                                <th style={{ padding: '12px 15px', textAlign: 'left', color: '#475569', fontWeight: '600' }}>Primary Keyword</th>
                                <th style={{ padding: '12px 15px', textAlign: 'left', color: '#475569', fontWeight: '600' }}>Date Published</th>
                                <th style={{ padding: '12px 15px', textAlign: 'left', color: '#475569', fontWeight: '600' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {articles.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>No articles found. Create one from the Add Article page.</td>
                                </tr>
                            ) : (
                                articles.map(article => (
                                    <tr key={article.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '12px 15px', color: '#1e293b', fontWeight: '500' }}>{article.blogTitle}</td>
                                        <td style={{ padding: '12px 15px', color: '#64748b' }}>/blog/{article.slug}</td>
                                        <td style={{ padding: '12px 15px' }}>
                                            <span style={{ backgroundColor: '#e0f2fe', color: '#0369a1', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>
                                                {article.primaryKeyword}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px 15px', color: '#64748b' }}>{new Date(article.createdAt).toLocaleDateString()}</td>
                                        <td style={{ padding: '12px 15px' }}>
                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                <a 
                                                    href={`https://pharmatalenthub.in/blog/${article.slug}`} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    style={{ backgroundColor: '#10b981', color: 'white', padding: '6px 12px', borderRadius: '4px', textDecoration: 'none', fontSize: '13px' }}
                                                >
                                                    View Live
                                                </a>
                                                <button 
                                                    onClick={() => handleDelete(article.id)} 
                                                    style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default ListSEOArticles;
