import React, { useState, useEffect } from 'react';
import './AddJob.css';
import BASE_API_URL from '../utils/apiConfig';
import EmailComposer from '../components/EmailComposer';

const extractNameFromEmail = (email) => {
    if (!email || email === 'Unknown') return 'Unknown';
    const localPart = email.split('@')[0];
    // Some basic filtering of common non-name words (hr, careers, info, admin, contact)
    const lowerLocal = localPart.toLowerCase();
    if (['hr', 'careers', 'info', 'admin', 'contact', 'jobs', 'recruitment', 'support'].includes(lowerLocal)) {
        return 'HR Department';
    }
    // Remove numbers from the end
    const cleanLocal = localPart.replace(/[0-9]+$/, '');
    // Split by dot, underscore, or hyphen
    const parts = cleanLocal.split(/[._-]/).filter(p => p.length > 0);
    if (parts.length > 0) {
        return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ');
    }
    return 'Unknown';
};

const HRDatabase = () => {
    const [hrData, setHrData] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [departments, setDepartments] = useState([]);
    const [isComposerOpen, setIsComposerOpen] = useState(false);

    useEffect(() => {
        // Load data from localStorage
        let initialData = [];
        const stored = localStorage.getItem('hrDatabase');
        if (stored) {
            try {
                initialData = JSON.parse(stored);
                // Retroactively fix 'Unknown' names
                let changed = false;
                initialData = initialData.map(hr => {
                    if (hr.hrName === 'Unknown' && hr.hrEmail && hr.hrEmail !== 'Unknown') {
                        changed = true;
                        return { ...hr, hrName: extractNameFromEmail(hr.hrEmail) };
                    }
                    return hr;
                });
                if (changed) {
                    localStorage.setItem('hrDatabase', JSON.stringify(initialData));
                }
                setHrData(initialData);
            } catch (e) {
                console.error("Failed to parse HR Database");
            }
        }

        const loadData = async () => {
            let deptMap = {};
            try {
                const response = await fetch(`${BASE_API_URL}/api/departments`);
                if (response.ok) {
                    const data = await response.json();
                    setDepartments(data);
                    data.forEach(d => { deptMap[d._id] = d.name; });
                }
            } catch (error) {
                console.error('Error fetching departments:', error);
            }

            try {
                setLoading(true);
                let allJobs = [];
                let currentPage = 1;
                let totalPages = 1;

                let response = await fetch(`https://pharmatalenthub.in/api/jobs?page=${currentPage}`);
                let data = await response.json();
                
                if (data.totalPages) {
                    totalPages = data.totalPages;
                    allJobs = allJobs.concat(data.jobs);
                    for (let i = 2; i <= totalPages && i <= 50; i++) {
                        let res = await fetch(`https://pharmatalenthub.in/api/jobs?page=${i}`);
                        let resData = await res.json();
                        if (resData.jobs) {
                            allJobs = allJobs.concat(resData.jobs);
                        }
                    }
                } else if (data.jobs) {
                    allJobs = data.jobs;
                } else if (Array.isArray(data)) {
                    allJobs = data;
                }

                let updatedData = [...initialData];
                let hasNewData = false;

                allJobs.forEach(job => {
                    let emailsToCapture = [];

                    const link = job.applicationLink || job.applylink || '';
                    if (link.toLowerCase().includes('mailto:')) {
                        const cleanEmail = link.replace(/mailto:/i, '').split('?')[0].trim();
                        if (cleanEmail) emailsToCapture.push(cleanEmail);
                    } else {
                        const linkMatches = link.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi);
                        if (linkMatches) emailsToCapture.push(...linkMatches);
                    }

                    if (job.hrEmail) {
                        const match = job.hrEmail.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/i);
                        if (match) emailsToCapture.push(match[0]);
                    }

                    emailsToCapture = [...new Set(emailsToCapture.map(e => e.toLowerCase()))];

                    emailsToCapture.forEach(email => {
                        let parsedName = job.hrName && job.hrName !== 'Unknown' ? job.hrName : extractNameFromEmail(email);

                        // Resolve department ID to Name
                        let domainName = 'Unknown';
                        if (job.department) {
                            domainName = deptMap[job.department] || job.department;
                        }

                        const newEntry = {
                            hrName: parsedName,
                            hrEmail: email,
                            companyName: job.company || 'Unknown',
                            location: job.location || 'Unknown',
                            contactNumber: job.hrContact || 'Unknown',
                            domain: domainName
                        };

                        const existingIndex = updatedData.findIndex(hr => hr.hrEmail.toLowerCase() === email);
                        if (existingIndex >= 0) {
                            const existing = updatedData[existingIndex];
                            if (existing.hrName === 'Unknown' || existing.hrName === 'HR Department') { 
                                if (newEntry.hrName !== 'Unknown' && newEntry.hrName !== 'HR Department') {
                                    existing.hrName = newEntry.hrName; hasNewData = true; 
                                }
                            }
                            if (existing.companyName === 'Unknown' && newEntry.companyName !== 'Unknown') { existing.companyName = newEntry.companyName; hasNewData = true; }
                            if (existing.contactNumber === 'Unknown' && newEntry.contactNumber !== 'Unknown') { existing.contactNumber = newEntry.contactNumber; hasNewData = true; }
                            if ((!existing.domain || existing.domain === 'Unknown' || existing.domain.length === 24) && newEntry.domain !== 'Unknown') { 
                                existing.domain = newEntry.domain; hasNewData = true; 
                            }
                            
                            if (existing.location === 'Unknown' && newEntry.location !== 'Unknown') {
                                existing.location = newEntry.location;
                                hasNewData = true;
                            } else if (newEntry.location !== 'Unknown' && existing.location !== 'Unknown') {
                                const currentLocs = existing.location.split(',').map(l => l.trim().toLowerCase());
                                const newLocs = newEntry.location.split(',').map(l => l.trim());
                                newLocs.forEach(nl => {
                                    if (!currentLocs.includes(nl.toLowerCase())) {
                                        existing.location += `, ${nl}`;
                                        hasNewData = true;
                                    }
                                });
                            }
                        } else {
                            updatedData.push(newEntry);
                            hasNewData = true;
                        }
                    });
                });

                if (hasNewData) {
                    localStorage.setItem('hrDatabase', JSON.stringify(updatedData));
                    setHrData(updatedData);
                }
            } catch (err) {
                console.error("Auto-fetch live jobs failed", err);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    const saveToLocalStorage = (data) => {
        localStorage.setItem('hrDatabase', JSON.stringify(data));
        setHrData(data);
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setLoading(true);
        const reader = new FileReader();
        reader.onload = (event) => {
            const csvText = event.target.result;
            const lines = csvText.split('\n').filter(line => line.trim() !== '');
            if (lines.length > 1) {
                const newEntries = [];
                for (let i = 1; i < lines.length; i++) {
                    const line = lines[i];
                    let cols = [];
                    let curVal = '';
                    let inQuotes = false;
                    for (let j = 0; j < line.length; j++) {
                        let char = line[j];
                        if (inQuotes) {
                            if (char === '"') {
                                if (line[j+1] === '"') {
                                    curVal += '"'; j++;
                                } else {
                                    inQuotes = false;
                                }
                            } else {
                                curVal += char;
                            }
                        } else {
                            if (char === '"') {
                                inQuotes = true;
                            } else if (char === ',') {
                                cols.push(curVal.trim());
                                curVal = '';
                            } else {
                                curVal += char;
                            }
                        }
                    }
                    cols.push(curVal.trim());
                    
                    if (cols.length >= 2) {
                        let email = cols[1] || 'Unknown';
                        let parsedName = cols[0] && cols[0] !== 'Unknown' ? cols[0] : extractNameFromEmail(email);

                        newEntries.push({
                            hrName: parsedName,
                            hrEmail: email,
                            companyName: cols[2] || 'Unknown',
                            location: cols[3] || 'Unknown',
                            contactNumber: cols[4] || 'Unknown'
                        });
                    }
                }

                let updatedData = [...hrData];
                newEntries.forEach(newEntry => {
                    const existingIndex = updatedData.findIndex(hr => hr.hrEmail.toLowerCase() === newEntry.hrEmail.toLowerCase() && hr.hrEmail !== 'Unknown');
                    if (existingIndex >= 0) {
                        const existing = updatedData[existingIndex];
                        if (existing.hrName === 'Unknown' && newEntry.hrName !== 'Unknown') existing.hrName = newEntry.hrName;
                        if (existing.companyName === 'Unknown' && newEntry.companyName !== 'Unknown') existing.companyName = newEntry.companyName;
                        
                        if (existing.location === 'Unknown' && newEntry.location !== 'Unknown') {
                            existing.location = newEntry.location;
                        } else if (newEntry.location !== 'Unknown' && existing.location !== 'Unknown') {
                            const currentLocs = existing.location.split(',').map(l => l.trim().toLowerCase());
                            const newLocs = newEntry.location.split(',').map(l => l.trim());
                            newLocs.forEach(nl => {
                                if (!currentLocs.includes(nl.toLowerCase())) {
                                    existing.location += `, ${nl}`;
                                }
                            });
                        }
                        
                        if (existing.contactNumber === 'Unknown' && newEntry.contactNumber !== 'Unknown') existing.contactNumber = newEntry.contactNumber;
                    } else {
                        updatedData.push(newEntry);
                    }
                });

                saveToLocalStorage(updatedData);
                alert("CSV Imported Successfully!");
            }
            setLoading(false);
            e.target.value = null;
        };
        reader.onerror = () => {
            alert("Error reading file");
            setLoading(false);
        };
        reader.readAsText(file);
    };

    const handleExport = () => {
        const header = ["HR Name", "Email IDs", "Company Name", "Location", "Contact Number", "Domain"];
        const rows = hrData.map(hr => [
            `"${hr.hrName || 'Unknown'}"`,
            `"${hr.hrEmail || 'Unknown'}"`,
            `"${hr.companyName || 'Unknown'}"`,
            `"${hr.location || 'Unknown'}"`,
            `"${hr.contactNumber || 'Unknown'}"`,
            `"${hr.domain || 'Unknown'}"`
        ]);
        
        const csvContent = "data:text/csv;charset=utf-8," 
            + header.join(",") + "\n" 
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "hr_database.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const LOCATION_GROUPS = {
        "Mumbai (MMR)": ["Mumbai", "Bombay", "Navi Mumbai", "Thane", "Kalyan"],
        "Delhi NCR": ["Delhi", "New Delhi", "Noida", "Gurgaon", "Gurugram", "Faridabad", "Ghaziabad"],
        "Bangalore": ["Bangalore", "Bengaluru"],
        "Pune": ["Pune", "Pimpri", "Chinchwad"],
        "Ahmedabad": ["Ahmedabad", "Bhat", "Sanand", "Gandhinagar"],
        "Vadodara": ["Vadodara", "Baroda"],
        "Chennai": ["Chennai", "Madras"],
        "Hyderabad": ["Hyderabad", "Secunderabad"],
        "Kolkata": ["Kolkata", "Calcutta"],
        "Chandigarh Tricity": ["Chandigarh", "Mohali", "Panchkula", "Zirakpur"],
        "Baddi-Nalagarh": ["Baddi", "Nalagarh"],
        "Vapi-Daman": ["Vapi", "Daman", "Silvassa"],
        "Indore": ["Indore", "Pithampur"],
        "Goa": ["Goa", "Panaji", "Verna", "Margao"],
        "Lucknow": ["Lucknow"],
        "Jaipur": ["Jaipur"],
        "Kochi": ["Kochi", "Ernakulam", "Cochin"],
        "Thiruvananthapuram": ["Thiruvananthapuram", "Trivandrum"],
        "Visakhapatnam": ["Visakhapatnam", "Vizag"],
        "Bhopal": ["Bhopal", "Mandideep"],
        "Patna": ["Patna"],
        "Surat": ["Surat"],
        "Rajkot": ["Rajkot"],
        "Nashik": ["Nashik", "Nasik"],
        "Aurangabad": ["Aurangabad", "Chhatrapati Sambhajinagar"],
        "Nagpur": ["Nagpur"],
        "Haridwar-Roorkee": ["Haridwar", "Roorkee"],
        "Dehradun": ["Dehradun"],
        "Guwahati": ["Guwahati"],
        "Bhubaneswar": ["Bhubaneswar"],
        "Coimbatore": ["Coimbatore"]
    };

    const uniqueLocations = Array.from(new Set(
        hrData.flatMap(hr => {
            const locStr = (hr.location || '').toLowerCase();
            const matchedGroups = [];
            for (const [groupName, aliases] of Object.entries(LOCATION_GROUPS)) {
                if (aliases.some(alias => locStr.includes(alias.toLowerCase()))) {
                    matchedGroups.push(groupName);
                }
            }
            return matchedGroups;
        })
    )).sort();

    const filteredData = hrData.filter(hr => {
        const term = searchTerm.toLowerCase();
        return (hr.hrName && hr.hrName.toLowerCase().includes(term)) ||
               (hr.hrEmail && hr.hrEmail.toLowerCase().includes(term)) ||
               (hr.companyName && hr.companyName.toLowerCase().includes(term)) ||
               (hr.location && hr.location.toLowerCase().includes(term));
    });

    const columns = [
        { title: 'HR Name', key: 'hrName', width: '15%' },
        { title: 'Email ID', key: 'hrEmail', width: '20%' },
        { title: 'Company Name', key: 'companyName', width: '15%' },
        { title: 'Location', key: 'location', width: '15%' },
        { title: 'Contact Number', key: 'contactNumber', width: '15%' },
        { title: 'Domain', key: 'domain', width: '20%' },
    ];

    return (
        <div style={{ width: '100%', boxSizing: 'border-box', padding: '20px', fontFamily: "'Inter', sans-serif" }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1e293b', margin: '0 0 8px 0' }}>
                        HR Database
                    </h1>
                    <p style={{ color: '#64748b', margin: 0, fontSize: '15px' }}>
                        Capture and manage HR contact details automatically extracted from job postings.
                    </p>
                </div>
                <div style={{ background: '#f1f5f9', padding: '8px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: '600', color: '#475569' }}>
                    📊 {hrData.length} Records Found
                </div>
            </div>

            <div style={{ 
                display: 'flex', 
                gap: '15px', 
                marginBottom: '30px', 
                flexWrap: 'wrap', 
                alignItems: 'center',
                backgroundColor: '#ffffff',
                padding: '20px',
                borderRadius: '12px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                border: '1px solid rgba(226, 232, 240, 0.8)'
            }}>
                <div style={{ flex: '1 1 250px' }}>
                    <input 
                        type="text" 
                        placeholder="🔍 Search by Name, Email, Company, or Location..." 
                        style={{ 
                            width: '100%', padding: '12px 15px', border: '1px solid #cbd5e1', 
                            borderRadius: '8px', fontSize: '15px', outline: 'none', transition: 'all 0.2s',
                            boxSizing: 'border-box'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                        onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                {/* Domain and Location Dropdowns moved to EmailComposer */}

                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                    <button 
                        onClick={() => setIsComposerOpen(true)}
                        style={{ 
                            backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '12px 20px', 
                            borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px',
                            transition: 'background-color 0.2s', boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                            whiteSpace: 'nowrap'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#059669'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#10b981'}
                    >
                        📧 Draft Email Campaign
                    </button>
                    <button 
                        onClick={() => {
                            if (window.confirm("Are you sure you want to reset the HR Database? This will remove all manually imported data. The page will reload to fetch fresh data from live jobs.")) {
                                localStorage.removeItem('hrDatabase');
                                window.location.reload();
                            }
                        }}
                        style={{ 
                            backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '12px 20px', 
                            borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px',
                            transition: 'background-color 0.2s', boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)',
                            whiteSpace: 'nowrap'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
                    >
                        🗑️ Reset Database
                    </button>

                    <label style={{ 
                        display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0,
                        backgroundColor: '#3b82f6', color: '#fff', padding: '12px 20px', borderRadius: '8px',
                        fontWeight: '600', fontSize: '14px', transition: 'background-color 0.2s',
                        boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)', whiteSpace: 'nowrap'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
                    >
                        {loading ? '⏳ Importing...' : '📥 Import CSV'}
                        <input type="file" accept=".csv" onChange={handleFileUpload} style={{ display: 'none' }} disabled={loading} />
                    </label>

                    <button 
                        onClick={handleExport} 
                        disabled={hrData.length === 0}
                        style={{ 
                            display: 'flex', alignItems: 'center', gap: '8px', cursor: hrData.length === 0 ? 'not-allowed' : 'pointer', 
                            margin: 0, backgroundColor: hrData.length === 0 ? '#94a3b8' : '#10b981', color: '#fff', 
                            padding: '12px 20px', borderRadius: '8px', fontWeight: '600', fontSize: '14px',
                            border: 'none', transition: 'background-color 0.2s',
                            boxShadow: hrData.length === 0 ? 'none' : '0 2px 8px rgba(16, 185, 129, 0.3)', whiteSpace: 'nowrap'
                        }}
                        onMouseOver={(e) => hrData.length > 0 && (e.currentTarget.style.backgroundColor = '#059669')}
                        onMouseOut={(e) => hrData.length > 0 && (e.currentTarget.style.backgroundColor = '#10b981')}
                    >
                        📤 Export CSV
                    </button>
                </div>
            </div>

            <div style={{ 
                backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)', 
                border: '1px solid rgba(226, 232, 240, 0.8)', width: '100%', overflow: 'hidden'
            }}>
                <div style={{ overflowX: 'auto', width: '100%' }}>
                    <table style={{ width: '100%', minWidth: '800px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px', tableLayout: 'fixed' }}>
                        <thead style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                            <tr>
                                <th style={{ width: '15%', padding: '16px 20px', color: '#475569', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase', fontSize: '12px' }}>HR Name</th>
                                <th style={{ width: '20%', padding: '16px 20px', color: '#475569', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase', fontSize: '12px' }}>Email ID</th>
                                <th style={{ width: '15%', padding: '16px 20px', color: '#475569', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase', fontSize: '12px' }}>Company Name</th>
                                <th style={{ width: '15%', padding: '16px 20px', color: '#475569', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase', fontSize: '12px' }}>Location</th>
                                <th style={{ width: '15%', padding: '16px 20px', color: '#475569', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase', fontSize: '12px' }}>Contact Number</th>
                                <th style={{ width: '20%', padding: '16px 20px', color: '#475569', fontWeight: '700', letterSpacing: '0.5px', textTransform: 'uppercase', fontSize: '12px' }}>Domain</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.length > 0 ? (
                                filteredData.map((hr, idx) => (
                                    <tr key={idx} style={{ 
                                        borderBottom: '1px solid #e2e8f0',
                                        backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                                        transition: 'background-color 0.2s'
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = idx % 2 === 0 ? '#ffffff' : '#f8fafc'}
                                    >
                                        <td style={{ padding: '15px', fontSize: '14px', color: '#334155', fontWeight: '500' }}>{hr.hrName}</td>
                                        <td style={{ padding: '15px', fontSize: '14px', color: '#2563eb' }}>
                                            <a href={`mailto:${hr.hrEmail}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                                                {hr.hrEmail}
                                            </a>
                                        </td>
                                        <td style={{ padding: '15px', fontSize: '14px', color: '#334155' }}>
                                            <span style={{ display: 'inline-block', backgroundColor: '#e2e8f0', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '600', color: '#475569' }}>
                                                {hr.companyName}
                                            </span>
                                        </td>
                                        <td style={{ padding: '15px', fontSize: '14px', color: '#64748b' }}>{hr.location}</td>
                                        <td style={{ padding: '15px', fontSize: '14px', color: '#64748b' }}>{hr.contactNumber}</td>
                                        <td style={{ padding: '15px', fontSize: '14px', color: '#64748b' }}>
                                            <span style={{ display: 'inline-block', backgroundColor: '#dcfce7', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '600', color: '#166534', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                                                {hr.domain || 'Unknown'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={columns.length} style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '15px' }}>
                                        <div style={{ fontSize: '40px', marginBottom: '10px' }}>📭</div>
                                        No HR data found matching your search or filter.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <EmailComposer 
                isOpen={isComposerOpen} 
                onClose={() => setIsComposerOpen(false)} 
                recipients={filteredData}
                departments={departments}
                uniqueLocations={uniqueLocations}
                locationGroups={LOCATION_GROUPS}
            />
        </div>
    );
};

export default HRDatabase;
