import { useState } from 'react';

const Login = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleLoginSubmit = (e) => {
        e.preventDefault();
        setErrors([]);
        setLoading(true);

        // Accept either set of credentials
        const isValidMainAdmin = email === 'admin@pharmatalenthub.in' && password === 'ClinideaEducation@2024';
        const isValidSuperAdmin = email === 'admin@clinidea.in' && password === 'PharmaTalentHub@2024';

        if (!isValidMainAdmin && !isValidSuperAdmin) {
            setErrors(['Invalid credentials. Please use the authorized admin ID and password.']);
            setLoading(false);
            return;
        }

        // Direct Login Success!
        localStorage.setItem('token', 'dummy-token-for-now');
        localStorage.setItem('userEmail', email);
        alert('Login Successful!');
        onLogin();
        setLoading(false);
    };

    return (
        <div style={styles.formContainer}>
            <div style={styles.header}>
                <h1 style={styles.title}>Admin Portal</h1>
                <p style={styles.subtitle}>Secure Access</p>
            </div>

            <form onSubmit={handleLoginSubmit} style={styles.form}>
                <label style={styles.label}>
                    Admin ID:
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={styles.input}
                        placeholder="Enter Admin ID"
                        disabled={loading}
                        required
                    />
                </label>

                <label style={styles.label}>
                    Password:
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={styles.input}
                        placeholder="Enter Password"
                        disabled={loading}
                        required
                    />
                </label>

                {errors.length > 0 && (
                    <div style={styles.errorContainer}>
                        {errors.map((error, index) => (
                            <p key={index} style={styles.error}>{error}</p>
                        ))}
                    </div>
                )}

                <button type="submit" style={styles.submitButton} disabled={loading}>
                    {loading ? 'Logging In...' : 'Login'}
                </button>
            </form>
        </div>
    );
};

// Inline CSS styles
const styles = {
    formContainer: {
        maxWidth: '420px',
        margin: '80px auto',
        padding: '40px 30px',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.05)',
        backgroundColor: '#ffffff',
        fontFamily: 'system-ui, -apple-system, sans-serif'
    },
    header: {
        textAlign: 'center',
        marginBottom: '30px'
    },
    title: {
        margin: '0 0 5px 0',
        color: '#0f172a',
        fontSize: '24px',
        fontWeight: '700'
    },
    subtitle: {
        margin: '0',
        color: '#64748b',
        fontSize: '14px'
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
    },
    label: {
        display: 'flex',
        flexDirection: 'column',
        marginBottom: '20px',
        color: '#334155',
        fontSize: '14px',
        fontWeight: '600'
    },
    input: {
        marginTop: '8px',
        padding: '12px 16px',
        border: '1px solid #cbd5e1',
        borderRadius: '8px',
        fontSize: '15px',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        outline: 'none',
    },
    submitButton: {
        marginTop: '10px',
        padding: '14px',
        backgroundColor: '#2563eb',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '16px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
    },
    errorContainer: {
        backgroundColor: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: '8px',
        padding: '12px',
        marginBottom: '20px'
    },
    error: {
        color: '#ef4444',
        margin: '0',
        fontSize: '14px'
    }
};

export default Login;
