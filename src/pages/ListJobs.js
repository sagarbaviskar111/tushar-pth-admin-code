import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './JobList.css';
import BASE_API_URL from '../utils/apiConfig';

const JobList = () => {
    const [jobs, setJobs] = useState([]);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const navigate = useNavigate();
    const limit = 10; // Number of jobs per page

    // Fetch jobs from API with pagination
    const fetchJobs = async (page = 1) => {
        try {
            const response = await fetch(`${BASE_API_URL}/api/jobs?page=${page}&limit=${limit}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });

            if (!response.ok) {
                throw new Error('Error fetching jobs');
            }

            const data = await response.json();
            setJobs(data.jobs);
            setTotalPages(data.totalPages || 1);
        } catch (err) {
            setError(err.message);
        }
    };

    // Delete job function
    const deleteJob = async (jobId) => {
        try {
            const response = await fetch(`${BASE_API_URL}/api/jobs/${jobId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });

            if (!response.ok) {
                throw new Error('Error deleting job');
            }

            fetchJobs(currentPage);
        } catch (err) {
            setError(err.message);
        }
    };

    // Navigate to update job page
    const editJob = (jobId) => {
        navigate(`/update-job/${jobId}`);
    };

    useEffect(() => {
        fetchJobs(currentPage);
    }, [currentPage]);

    return (
        <div className="job-list-container">
            <h1 className="title">Job Listings</h1>
            {error && <p className="error-message">{error}</p>}
            <div className="table-responsive">
            <table className="job-table">
                <thead>
                    <tr>
                        <th>Position</th>
                        <th>Company</th>
                        <th>Location</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {jobs.map((job) => (
                        <tr key={job._id}>
                            <td>{job.positionName}</td>
                            <td>{job.company}</td>
                            <td>{job.location}</td>
                            <td>
                                <button className="edit-button" onClick={() => editJob(job._id)}>Edit</button>
                                <button className="delete-button" onClick={() => deleteJob(job._id)}>Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            </div>

            {/* Pagination Controls */}
            <div className="pagination">
                <button 
                    className="prev-button" 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                >
                    Previous
                </button>
                <span>Page {currentPage} of {totalPages}</span>
                <button 
                    className="next-button" 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                >
                    Next
                </button>
            </div>
        </div>
    );
};

export default JobList;
