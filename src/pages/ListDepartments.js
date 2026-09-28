import React, { useEffect, useState } from 'react';
import BASE_API_URL from '../utils/apiConfig';

const DepartmentList = () => {
    const [departments, setDepartments] = useState([]);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Fetch departments when the component mounts
    const fetchDepartments = async () => {
      const token = localStorage.getItem('token'); // Retrieve the token from local storage

      try {
          const response = await fetch(`${BASE_API_URL}/api/departments`, {
              method: 'GET',
              headers: {
                  'Authorization': `Bearer ${token}` // Include the token in the authorization header
              },
          });

          if (!response.ok) {
              throw new Error('Failed to fetch departments');
          }

          const data = await response.json();
          setDepartments(data); // Adjust based on your API response structure
      } catch (error) {
          console.error('Error fetching departments:', error);
          setError(error.message);
      }
    };

    useEffect(() => {
        fetchDepartments();
    }, []);

    // Function to delete a department
    const deleteDepartment = async (departmentId) => {
        const token = localStorage.getItem('token'); // Retrieve the token from local storage

        try {
            const response = await fetch(`${BASE_API_URL}/api/departments/${departmentId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}` // Include the token in the authorization header
                },
            });

            if (!response.ok) {
                throw new Error('Failed to delete the department');
            }

            setDepartments(departments.filter(department => department._id !== departmentId)); // Update state to remove the deleted department
            setSuccessMessage('Department deleted successfully');
            fetchDepartments();

        } catch (error) {
            console.error('Error deleting department:', error);
            setError(error.message);
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            <h2>Department List</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}
            
            <div style={{ overflowX: 'auto', width: '100%', WebkitOverflowScrolling: 'touch' }}>
                <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', marginTop: '20px' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f2f2f2', borderBottom: '2px solid #ddd' }}>
                            <th style={{ padding: '10px', textAlign: 'left' }}>Department Name</th>
                            <th style={{ padding: '10px', textAlign: 'center' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {departments.map(department => (
                            <tr key={department._id} style={{ borderBottom: '1px solid #ddd' }}>
                                <td style={{ padding: '10px' }}>{department.name}</td>
                                <td style={{ padding: '10px', textAlign: 'center' }}>
                                    <button 
                                        onClick={() => deleteDepartment(department._id)}
                                        style={{
                                            backgroundColor: '#ff4d4d',
                                            color: 'white',
                                            padding: '5px 10px',
                                            border: 'none',
                                            borderRadius: '5px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DepartmentList;
