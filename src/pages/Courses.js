import React, { useState, useEffect } from 'react';
import BASE_API_URL from '../utils/apiConfig';
import './AddJob.css';

const Courses = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    // Form states
    const [courseName, setCourseName] = useState('CRPV');
    const [pdf, setPdf] = useState(null);
    const [feesPdf, setFeesPdf] = useState(null);
    const [youtubeLink, setYoutubeLink] = useState('');
    const [enrollGoogleLink, setEnrollGoogleLink] = useState('');
    const [whatsappLink, setWhatsappLink] = useState('');

    const courseOptions = ['CRPV', 'CRDM', 'CRPVDM', 'CRRA', 'CRMW'];

    useEffect(() => {
        fetchCourses();
    }, []);

    useEffect(() => {
        if (!courses || courses.length === 0) return;
        
        const selectedCourseObj = courses.find((c) => Object.keys(c)[0] === courseName);
        if (selectedCourseObj) {
            const data = selectedCourseObj[courseName];
            setYoutubeLink(data?.youtubeLink || '');
            setEnrollGoogleLink(data?.enrollGoogleLink || '');
            setWhatsappLink(data?.whatsappLink || '');
        } else {
            setYoutubeLink('');
            setEnrollGoogleLink('');
            setWhatsappLink('');
        }
    }, [courseName, courses]);

    const fetchCourses = async () => {
        try {
            const response = await fetch(`${BASE_API_URL}/api/courses`);
            if (response.ok) {
                const data = await response.json();
                setCourses(data);
            }
        } catch (err) {
            console.error('Error fetching courses:', err);
        }
    };

    const handleSyllabusFileChange = (e) => setPdf(e.target.files[0]);
    const handleFeesFileChange = (e) => setFeesPdf(e.target.files[0]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setError('');

        try {
            const formPayload = new FormData();
            formPayload.append('courseName', courseName);
            if (pdf) formPayload.append('pdf', pdf);
            if (feesPdf) formPayload.append('feesPdf', feesPdf);
            if (youtubeLink) formPayload.append('youtubeLink', youtubeLink);
            if (enrollGoogleLink) formPayload.append('enrollGoogleLink', enrollGoogleLink);
            if (whatsappLink) formPayload.append('whatsappLink', whatsappLink);

            // Fetch doesn't automatically send cookies unless specified, assuming standard token auth if needed
            const token = localStorage.getItem('token');
            const headers = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const response = await fetch(`${BASE_API_URL}/api/courses`, {
                method: 'POST',
                headers,
                body: formPayload
            });

            if (!response.ok) {
                throw new Error('Failed to create/update course');
            }

            setMessage('Course created/updated successfully!');
            // Reset form
            setPdf(null);
            setFeesPdf(null);
            setYoutubeLink('');
            setEnrollGoogleLink('');
            setWhatsappLink('');
            e.target.reset(); // reset file input visually
            
            fetchCourses();
        } catch (err) {
            setError(err.message || 'Error saving course');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (deleteCourseName) => {
        if (!window.confirm(`Are you sure you want to delete the course ${deleteCourseName}?`)) return;
        setLoading(true);
        setMessage('');
        setError('');
        
        try {
            const token = localStorage.getItem('token');
            const headers = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const response = await fetch(`${BASE_API_URL}/api/courses/${deleteCourseName}`, {
                method: 'DELETE',
                headers
            });

            if (!response.ok) {
                throw new Error('Failed to delete course');
            }

            setMessage('Course deleted successfully!');
            fetchCourses();
        } catch (err) {
            setError(err.message || 'Error deleting course');
        } finally {
            setLoading(false);
        }
    };

    // Helper to extract common values from the nested course object
    const getCourseData = (courseObj) => {
        const key = Object.keys(courseObj)[0];
        return { name: key, ...courseObj[key] };
    };

    return (
        <div className="formContainer">
            <h1 className="title">Course Management</h1>
            
            <h2>Create or Update a Course</h2>
            {message && <div style={{ color: 'green', marginBottom: '15px' }}>{message}</div>}
            {error && <div style={{ color: 'red', marginBottom: '15px' }}>{error}</div>}

            <form onSubmit={handleSubmit} className="form" style={{ marginBottom: '30px' }}>
                <label className="label">Course Name:
                    <select 
                        value={courseName}
                        onChange={(e) => setCourseName(e.target.value)}
                        className="input"
                        required
                        disabled={loading}
                    >
                        {courseOptions.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                </label>

                <label className="label">Syllabus PDF:
                    <input 
                        type="file" 
                        accept="application/pdf" 
                        onChange={handleSyllabusFileChange} 
                        className="input" 
                        disabled={loading} 
                    />
                </label>

                <label className="label">Fees PDF:
                    <input 
                        type="file" 
                        accept="application/pdf" 
                        onChange={handleFeesFileChange} 
                        className="input" 
                        disabled={loading} 
                    />
                </label>

                <label className="label">YouTube Link:
                    <input 
                        type="url" 
                        value={youtubeLink}
                        onChange={(e) => setYoutubeLink(e.target.value)}
                        className="input"
                        placeholder="https://youtu.be/..."
                        disabled={loading} 
                    />
                </label>

                <label className="label">Enroll Now Google Link:
                    <input 
                        type="url" 
                        value={enrollGoogleLink}
                        onChange={(e) => setEnrollGoogleLink(e.target.value)}
                        className="input"
                        placeholder="https://forms.gle/..."
                        disabled={loading} 
                    />
                </label>

                <label className="label">WhatsApp Group Link:
                    <input 
                        type="url" 
                        value={whatsappLink}
                        onChange={(e) => setWhatsappLink(e.target.value)}
                        className="input"
                        placeholder="https://chat.whatsapp.com/..."
                        disabled={loading} 
                    />
                </label>

                <button type="submit" className="submitButton" disabled={loading}>
                    {loading ? 'Saving...' : 'Save Course'}
                </button>
            </form>

            <h2>Current Courses ({courses?.length || 0})</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
                {courses && courses.length > 0 ? (
                    courses.map((course, index) => {
                        const data = getCourseData(course);
                        return (
                            <div key={data._id || index} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h3 style={{ marginTop: 0 }}>{data.name}</h3>
                                    {data.pdf && <p style={{ margin: '5px 0' }}><strong>Syllabus:</strong> <a href={data.pdf.startsWith('http') ? data.pdf : `${BASE_API_URL}/${data.pdf}`} target="_blank" rel="noreferrer">View Syllabus</a></p>}
                                    {data.feesPdf && <p style={{ margin: '5px 0' }}><strong>Fees PDF:</strong> <a href={data.feesPdf.startsWith('http') ? data.feesPdf : `${BASE_API_URL}/${data.feesPdf}`} target="_blank" rel="noreferrer">View Fees</a></p>}
                                    {data.youtubeLink && <p style={{ margin: '5px 0' }}><strong>YouTube:</strong> <a href={data.youtubeLink} target="_blank" rel="noreferrer">{data.youtubeLink}</a></p>}
                                    {data.enrollGoogleLink && <p style={{ margin: '5px 0' }}><strong>Enroll Now:</strong> <a href={data.enrollGoogleLink} target="_blank" rel="noreferrer">{data.enrollGoogleLink}</a></p>}
                                    {data.whatsappLink && <p style={{ margin: '5px 0' }}><strong>WhatsApp:</strong> <a href={data.whatsappLink} target="_blank" rel="noreferrer">{data.whatsappLink}</a></p>}
                                </div>
                                <button 
                                    onClick={() => handleDelete(data.name)}
                                    style={{ backgroundColor: '#dc3545', color: 'white', padding: '10px 15px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', height: 'fit-content' }}
                                    disabled={loading}
                                >
                                    Delete
                                </button>
                            </div>
                        );
                    })
                ) : (
                    <p>No courses found.</p>
                )}
            </div>
        </div>
    );
};

export default Courses;
