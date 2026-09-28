import React, { useState } from 'react';
import BASE_API_URL from '../utils/apiConfig';
import validators from '../utils/validators';

const DepartmentForm = () => {
    const [departmentName, setDepartmentName] = useState('');
    const [errors, setErrors] = useState([]);
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setErrors([]);
        setSuccessMessage('');
        setLoading(true);

        const token = localStorage.getItem('token');

        // Validate department data
        const validation = validators.validateDepartment({ name: departmentName });
        if (!validation.isValid) {
            setErrors(validation.errors);
            setLoading(false);
            return;
        }

        if (!token) {
            setErrors(['Authentication token not found. Please login again.']);
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`${BASE_API_URL}/api/departments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name: departmentName }),
            });

            if (!response.ok) {
                const responseData = await response.json();
                const errorMsg = responseData.message || 'Failed to add department';
                setErrors([errorMsg]);
                setLoading(false);
                return;
            }

            await response.json();
            setSuccessMessage('Department added successfully!');
            setDepartmentName('');
            setErrors([]);
        } catch (error) {
            console.error('Error adding department:', error);
            setErrors(['An error occurred while adding the department. Please try again.']);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <h2 style={styles.title}>Add Department</h2>
            
            {errors.length > 0 && (
                <div style={styles.errorContainer}>
                    {errors.map((error, index) => (
                        <p key={index} style={styles.error}>• {error}</p>
                    ))}
                </div>
            )}
            
            {successMessage && (
                <p style={styles.success}>{successMessage}</p>
            )}
            
            <form onSubmit={handleSubmit} style={styles.form}>
                <div style={styles.formGroup}>
                    <label htmlFor="departmentName" style={styles.label}>
                        Department Name: *
                    </label>
                    <input
                        type="text"
                        id="departmentName"
                        value={departmentName}
                        onChange={(e) => setDepartmentName(e.target.value)}
                        style={styles.input}
                        placeholder="Enter department name"
                        disabled={loading}
                    />
                </div>
                
                <button 
                    type="submit" 
                    style={styles.submitButton}
                    disabled={loading}
                >
                    {loading ? 'Adding...' : 'Add Department'}
                </button>
            </form>
        </div>
    );
};

const styles = {
    container: {
        maxWidth: '500px',
        margin: '20px auto',
        padding: '20px',
        border: '1px solid #ddd',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        backgroundColor: '#fff',
    },
    title: {
        marginBottom: '20px',
        color: '#333',
        textAlign: 'center',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
    },
    formGroup: {
        marginBottom: '15px',
    },
    label: {
        display: 'block',
        marginBottom: '8px',
        color: '#555',
        fontWeight: '500',
    },
    input: {
        width: '100%',
        padding: '10px',
        border: '1px solid #ddd',
        borderRadius: '4px',
        fontSize: '16px',
        boxSizing: 'border-box',
    },
    errorContainer: {
        marginBottom: '15px',
        padding: '12px',
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
    },
    submitButton: {
        padding: '10px',
        backgroundColor: '#28a745',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        fontSize: '16px',
        cursor: 'pointer',
        fontWeight: '500',
    },
};

export default DepartmentForm;
