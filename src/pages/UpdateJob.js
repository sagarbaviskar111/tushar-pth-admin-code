import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './UpdateJob.css';
import BASE_API_URL from '../utils/apiConfig';
import validators from '../utils/validators';

const UpdateJob = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [departments, setDepartments] = useState([]);
    const [job, setJob] = useState({
        company: '',
        positionName: '',
        email: '',
        qualification: '',
        experience: '',
        salary: '',
        location: '',
        responsibilities: [],
        tags: '',
        skills: [],
        companyOverview: '',
        department: '',
        applylink: '',
        applicationDeadline: '',
        type: '',
        driveLocation: '',
        driveDate: '',
        driveTime: '',
        driveContactPerson: '',
        driveContactNumber: '',
        commonInterviewQuestions: [],
    });
    const [responsibility, setResponsibility] = useState('');
    const [skill, setSkill] = useState('');
    const [interviewQuestion, setInterviewQuestion] = useState({ question: '', answer: '' });
    const [errors, setErrors] = useState([]);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    // Fetch job details to pre-fill the form
    const fetchJobDetails = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${BASE_API_URL}/api/jobs/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Error fetching job details.');
            }

            const data = await response.json();
            setJob({
                ...data,
                department: data.department ? data.department._id : '',
                commonInterviewQuestions: data.commonInterviewQuestions || []
            });
        } catch (err) {
            setErrors([err.message]);
        }
    };

    // Fetch departments for the dropdown
    const fetchDepartments = async () => {
        try {
            const response = await fetch(`${BASE_API_URL}/api/departments`);
            const data = await response.json();
            setDepartments(data);
        } catch (error) {
            console.error('Error fetching departments:', error);
            setErrors(['Failed to fetch departments']);
        }
    };

    useEffect(() => {
        fetchJobDetails();
        fetchDepartments();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const handleAddResponsibility = () => {
        if (responsibility.trim()) {
            setJob((prevState) => ({
                ...prevState,
                responsibilities: [...prevState.responsibilities, responsibility],
            }));
            setResponsibility('');
        }
    };

    const handleAddSkill = () => {
        if (skill.trim()) {
            setJob((prevState) => ({
                ...prevState,
                skills: [...prevState.skills, skill],
            }));
            setSkill('');
        }
    };

    const handleAddQuestion = () => {
        if (interviewQuestion.question.trim() && interviewQuestion.answer.trim()) {
            setJob((prevState) => ({
                ...prevState,
                commonInterviewQuestions: [...prevState.commonInterviewQuestions, interviewQuestion]
            }));
            setInterviewQuestion({ question: '', answer: '' });
        }
    };


    const handleChange = (e) => {
        setJob({
            ...job,
            [e.target.name]: e.target.value,
        });
    };

    const handleDeleteResponsibility = (index) => {
        setJob({
            ...job,
            responsibilities: job.responsibilities.filter((_, i) => i !== index),
        });
    };

    const handleDeleteSkill = (index) => {
        setJob({
            ...job,
            skills: job.skills.filter((_, i) => i !== index),
        });
    };

    const handleDeleteQuestion = (index) => {
        setJob({
            ...job,
            commonInterviewQuestions: job.commonInterviewQuestions.filter((_, i) => i !== index),
        });
    };

    const handleFileChange = (e) => {
        const { name, files } = e.target;
        if (files && files[0]) {
            const file = files[0];
            const validation = validators.validateFile(file, 'image/*', 5 * 1024 * 1024);
            if (validation.isValid) {
                setJob({
                    ...job,
                    [name]: file,
                });
                setErrors(errors.filter(err => !err.includes(name)));
            } else {
                setErrors([...errors.filter(err => !err.includes(name)), validation.error]);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors([]);
        setSuccess(false);
        setLoading(true);

        // Validate job data
        const validation = validators.validateJobUpdate(job);
        if (!validation.isValid) {
            setErrors(validation.errors);
            setLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setErrors(['Authentication token not found. Please login again.']);
                setLoading(false);
                return;
            }

            const formData = new FormData();

            for (let key in job) {
                if (key === 'responsibilities' || key === 'skills') {
                    if (Array.isArray(job[key])) {
                        job[key].forEach(item => {
                            formData.append(key, item);
                        });
                    }
                } else if (key === 'commonInterviewQuestions') {
                    if (Array.isArray(job[key]) && job[key].length > 0) {
                        formData.append(key, JSON.stringify(job[key]));
                    }
                } else if (job[key] instanceof File) {
                    formData.append(key, job[key]);
                } else if (job[key] !== '') {
                    formData.append(key, job[key]);
                }
            }

            // Log payload size for debugging
            let totalSize = 0;
            for (let pair of formData.entries()) {
                if (pair[1] instanceof File) {
                    totalSize += pair[1].size;
                }
            }
            console.log('Payload file size:', totalSize, 'bytes');

            const response = await fetch(`${BASE_API_URL}/api/jobs/${id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    // DO NOT set Content-Type - browser will set it with boundary
                },
                body: formData,
            });

            if (response.status === 413) {
                setErrors(['File too large. Server rejected payload. Try compressing images.']);
                setLoading(false);
                return;
            }

            if (!response.ok) {
                const responseData = await response.json().catch(() => ({}));
                const errorMsg = responseData.message || responseData.error || 'Failed to update job';
                setErrors([errorMsg]);
                setLoading(false);
                return;
            }

            setSuccess(true);
            alert('Job updated successfully!');
            navigate('/list-jobs');
        } catch (err) {
            setErrors([err.message || 'An error occurred while updating the job. Please try again.']);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="formContainer">
            <h1 className="title">Update Job Details</h1>
            
            {errors.length > 0 && (
                <div style={styles.errorContainer}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#721c24' }}>Errors:</h4>
                    {errors.map((error, index) => (
                        <p key={index} style={styles.error}>• {error}</p>
                    ))}
                </div>
            )}
            
            {success && <p style={styles.success}>Job updated successfully!</p>}
            
            <form onSubmit={handleSubmit} className="form">
                <label className="label">
                    Position Name: *
                    <input type="text" name="positionName" value={job.positionName} onChange={handleChange} className="input" disabled={loading} />
                </label>

                <label className="label">
                    Company Name: *
                    <input type="text" name="company" value={job.company} onChange={handleChange} className="input" disabled={loading} />
                </label>

                <label className="label">
                    Salary: *
                    <input type="text" name="salary" value={job.salary} onChange={handleChange} className="input" placeholder="e.g., 5-8 LPA" disabled={loading} />
                </label>

                <label className="label">
                    Location: *
                    <input type="text" name="location" value={job.location} onChange={handleChange} className="input" disabled={loading} />
                </label>

                <label className="label">
                    Qualification: *
                    <input type="text" name="qualification" value={job.qualification} onChange={handleChange} className="input" disabled={loading} />
                </label>

                <div className="fieldGroup">
                    <label className="label">Responsibilities:</label>
                    <div className="dynamicInput">
                        <input
                            type="text"
                            value={responsibility}
                            onChange={(e) => setResponsibility(e.target.value)}
                            className="input"
                            disabled={loading}
                        />
                        <button
                            type="button"
                            onClick={handleAddResponsibility}
                            className="addButton"
                            disabled={!responsibility.trim() || loading}
                        >
                            Add Responsibility
                        </button>
                    </div>
                    <ul className="list">
                        {job.responsibilities.map((item, index) => (
                            <li key={index} className="listItem">
                                {item}
                                <button
                                    type="button"
                                    className="deleteButton"
                                    onClick={() => handleDeleteResponsibility(index)}
                                    disabled={loading}
                                >
                                    &#10006;
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                <label className="label">
                    Company Overview: *
                    <textarea
                        name="companyOverview"
                        value={job.companyOverview}
                        onChange={handleChange}
                        className="textarea"
                        disabled={loading}
                    ></textarea>
                </label>

                <label className="label">
                    Drive Location:
                    <input type="text" name="driveLocation" value={job.driveLocation} onChange={handleChange} className="input" disabled={loading} />
                </label>

                <label className="label">
                    Drive Date:
                    <input type="date" name="driveDate" value={job.driveDate} onChange={handleChange} className="input" disabled={loading} />
                </label>

                <label className="label">
                    Drive Time:
                    <input type="time" name="driveTime" value={job.driveTime} onChange={handleChange} className="input" disabled={loading} />
                </label>

                <label className="label">
                    Drive Contact Person:
                    <input type="text" name="driveContactPerson" value={job.driveContactPerson} onChange={handleChange} className="input" disabled={loading} />
                </label>

                <label className="label">
                    Drive Contact Number:
                    <input type="tel" name="driveContactNumber" value={job.driveContactNumber} onChange={handleChange} className="input" disabled={loading} />
                </label>

                <label className="label">
                    Apply Link: *
                    <input
                        type="text"
                        name="applylink"
                        value={job.applylink}
                        onChange={handleChange}
                        className="input"
                        placeholder="https://example.com/apply"
                        disabled={loading}
                    />
                </label>

                <label className="label">
                    Email:
                    <input type="email" name="email" value={job.email} onChange={handleChange} className="input" disabled={loading} />
                </label>

                <label className="label">
                    Experience:
                    <input type="text" name="experience" value={job.experience} onChange={handleChange} className="input" placeholder="e.g., 2-3 years" disabled={loading} />
                </label>

                <label className="label">
                    Job Type:
                    <input type="text" name="type" value={job.type} onChange={handleChange} className="input" placeholder="e.g., Full-time, Part-time" disabled={loading} />
                </label>

                <label className="label">
                    Application Deadline:
                    <input type="date" name="applicationDeadline" value={job.applicationDeadline} onChange={handleChange} className="input" disabled={loading} />
                </label>

                <label className="label">
                    HashTags:
                    <input type="text" name="tags" value={job.tags} onChange={handleChange} className="input" placeholder="e.g., #React #NodeJS" disabled={loading} />
                </label>

                <div className="fieldGroup">
                    <label className="label">Skills:</label>
                    <div className="dynamicInput">
                        <input
                            type="text"
                            value={skill}
                            onChange={(e) => setSkill(e.target.value)}
                            className="input"
                            placeholder="e.g., React"
                            disabled={loading}
                        />
                        <button
                            type="button"
                            onClick={handleAddSkill}
                            className="addButton"
                            disabled={!skill.trim() || loading}
                        >
                            Add Skill
                        </button>
                    </div>
                    <ul className="list">
                        {job.skills.map((item, index) => (
                            <li key={index} className="listItem">
                                {item}
                                <button
                                    type="button"
                                    className="deleteButton"
                                    onClick={() => handleDeleteSkill(index)}
                                    disabled={loading}
                                >
                                    &#10006;
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="fieldGroup">
                    <label className="label">Common Interview Questions:</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '15px' }}>
                        <input 
                            type="text" 
                            value={interviewQuestion.question} 
                            onChange={(e) => setInterviewQuestion({ ...interviewQuestion, question: e.target.value })} 
                            className="input" 
                            placeholder="Question (e.g. Why should we hire you?)" 
                            disabled={loading} 
                        />
                        <textarea 
                            value={interviewQuestion.answer} 
                            onChange={(e) => setInterviewQuestion({ ...interviewQuestion, answer: e.target.value })} 
                            className="textarea" 
                            placeholder="Answer" 
                            disabled={loading} 
                        ></textarea>
                        <button type="button" onClick={handleAddQuestion} className="addButton" disabled={!interviewQuestion.question.trim() || !interviewQuestion.answer.trim() || loading} style={{ alignSelf: 'flex-start' }}>
                            Add Question
                        </button>
                    </div>
                    <ul className="list">
                        {(job.commonInterviewQuestions || []).map((item, index) => (
                            <li key={index} className="listItem" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '15px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '5px' }}>
                                    <strong>Q: {item.question}</strong>
                                    <button type="button" className="deleteButton" onClick={() => handleDeleteQuestion(index)} disabled={loading}>
                                        &#10006;
                                    </button>
                                </div>
                                <div style={{ color: '#475569', fontSize: '14px', whiteSpace: 'pre-wrap' }}>A: {item.answer}</div>
                            </li>
                        ))}
                    </ul>
                </div>

                <label className="label">
                    Department: *
                    <select
                        name="department"
                        value={job.department}
                        onChange={handleChange}
                        className="input"
                        disabled={loading}
                    >
                        <option value="">Select Department</option>
                        {departments.map((dept) => (
                            <option key={dept._id} value={dept._id}>
                                {dept.name}
                            </option>
                        ))}
                    </select>
                </label>

                <label className="label">
                    Image (max 5MB):
                    <input
                        type="file"
                        name="image"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="fileInput"
                        disabled={loading}
                    />
                </label>

                <label className="label">
                    Logo (max 5MB):
                    <input
                        type="file"
                        name="logo"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="fileInput"
                        disabled={loading}
                    />
                </label>

                <button type="submit" className="submitButton" disabled={loading}>
                    {loading ? 'Updating...' : 'Update Job'}
                </button>
            </form>
        </div>
    );
};

const styles = {
    errorContainer: {
        marginBottom: '20px',
        padding: '15px',
        backgroundColor: '#f8d7da',
        borderRadius: '4px',
        border: '1px solid #f5c6cb',
    },
    error: {
        color: '#721c24',
        margin: '5px 0',
        fontSize: '14px',
    },
    success: {
        color: '#155724',
        marginBottom: '15px',
        padding: '12px',
        backgroundColor: '#d4edda',
        borderRadius: '4px',
        border: '1px solid #c3e6cb',
        fontSize: '14px',
    }
};

export default UpdateJob;
