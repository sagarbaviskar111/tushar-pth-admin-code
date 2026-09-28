import React, { useState } from 'react';
import './AddJob.css'; // Reusing styles
import BASE_API_URL from '../utils/apiConfig';

const SEOArticleForm = () => {
    const [formData, setFormData] = useState({
        metaTitle: '',
        metaDescription: '',
        slug: '',
        primaryKeyword: '',
        schemaMarkup: '',
        blogTitle: '',
        content: '',
        imageUrl: '',
        author: 'Admin'
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
                    imageUrl: reader.result
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
            const response = await fetch(`${BASE_API_URL}/api/articles`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || 'Failed to create article');
            }

            setMessage('SEO Article published successfully! It is now live on the website.');
            setFormData({
                metaTitle: '',
                metaDescription: '',
                slug: '',
                primaryKeyword: '',
                schemaMarkup: '',
                blogTitle: '',
                content: '',
                imageUrl: '',
                author: 'Admin'
            });
            document.getElementById('article-image-upload').value = '';
        } catch (err) {
            setError(err.message || 'Error publishing article');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="formContainer" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h1 className="title">Add Advanced SEO Article</h1>
            <p style={{ color: '#64748b', marginBottom: '20px' }}>
                Fill out the SEO metadata and content below to publish a highly optimized blog post.
            </p>

            {message && <div style={{ color: '#155724', marginBottom: '15px', padding: '10px', backgroundColor: '#d4edda', borderRadius: '4px', border: '1px solid #c3e6cb' }}>{message}</div>}
            {error && <div style={{ color: '#721c24', marginBottom: '15px', padding: '10px', backgroundColor: '#f8d7da', borderRadius: '4px', border: '1px solid #f5c6cb' }}>{error}</div>}

            <form onSubmit={handleSubmit} className="form">
                
                <h3 style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', marginTop: '20px' }}>1. SEO Configuration</h3>
                
                <label className="label">Meta Title (Max 60 chars):
                    <input type="text" name="metaTitle" value={formData.metaTitle} onChange={handleChange} className="input" maxLength="60" required disabled={loading} placeholder="e.g. Top 10 Pharma Jobs in India 2026" />
                    <small style={{ color: '#94a3b8' }}>{formData.metaTitle.length}/60</small>
                </label>

                <label className="label">Meta Description (Max 158 chars):
                    <textarea name="metaDescription" value={formData.metaDescription} onChange={handleChange} className="textarea" maxLength="158" rows="2" required disabled={loading} placeholder="e.g. Discover the best pharmaceutical careers and vacancies available across major cities in India..."></textarea>
                    <small style={{ color: '#94a3b8' }}>{formData.metaDescription.length}/158</small>
                </label>

                <label className="label">URL Slug:
                    <input type="text" name="slug" value={formData.slug} onChange={handleChange} className="input" required disabled={loading} placeholder="e.g. top-10-pharma-jobs" />
                    <small style={{ color: '#94a3b8' }}>This will be your URL: pharmatalenthub.in/blog/<strong>{formData.slug || 'your-slug'}</strong></small>
                </label>

                <label className="label">Primary Keyword:
                    <input type="text" name="primaryKeyword" value={formData.primaryKeyword} onChange={handleChange} className="input" required disabled={loading} placeholder="e.g. pharma jobs india" />
                </label>

                <label className="label">Schema Markup (JSON-LD format):
                    <textarea name="schemaMarkup" value={formData.schemaMarkup} onChange={handleChange} className="textarea" rows="4" disabled={loading} placeholder='e.g. { "@context": "https://schema.org", "@type": "Article", ... }'></textarea>
                </label>

                <h3 style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', marginTop: '30px' }}>2. Blog Content</h3>

                <label className="label">Blog Title (H1):
                    <input type="text" name="blogTitle" value={formData.blogTitle} onChange={handleChange} className="input" required disabled={loading} placeholder="e.g. The Ultimate Guide to Pharma Jobs in India" />
                </label>

                <label className="label">Author Name:
                    <input type="text" name="author" value={formData.author} onChange={handleChange} className="input" required disabled={loading} placeholder="e.g. John Doe" />
                </label>

                <label className="label">Cover Image:
                    <input type="file" id="article-image-upload" accept="image/*" onChange={handleFileChange} className="input" disabled={loading} />
                </label>
                {formData.imageUrl && (
                    <div style={{ marginBottom: '15px' }}>
                        <img src={formData.imageUrl} alt="Preview" style={{ maxWidth: '200px', borderRadius: '4px', border: '1px solid #e2e8f0' }} />
                    </div>
                )}

                <label className="label">Content (HTML Supported):
                    <textarea name="content" value={formData.content} onChange={handleChange} className="textarea" rows="10" required disabled={loading} placeholder="Write your blog content here... You can use HTML tags like <h2>, <p>, <b>, <ul>, etc."></textarea>
                </label>

                <button type="submit" className="submitButton" disabled={loading} style={{ backgroundColor: '#10b981', marginTop: '20px' }}>
                    {loading ? 'Publishing...' : 'Publish SEO Article'}
                </button>
            </form>
        </div>
    );
};

export default SEOArticleForm;
