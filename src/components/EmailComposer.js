import React, { useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import '../pages/AddJob.css';

const EmailComposer = ({ isOpen, onClose, recipients, departments, uniqueLocations, locationGroups }) => {
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [attachments, setAttachments] = useState([]);
    const [isSending, setIsSending] = useState(false);
    const [progress, setProgress] = useState(0);
    const [total, setTotal] = useState(0);
    
    const [selectedDomain, setSelectedDomain] = useState('');
    const [selectedLocation, setSelectedLocation] = useState('');

    if (!isOpen) return null;

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        setAttachments(files);
    };

    const filteredRecipients = recipients ? recipients.filter(hr => {
        const matchesDomain = selectedDomain ? (hr.domain && hr.domain.toLowerCase() === selectedDomain.toLowerCase()) : true;
        let matchesLocation = true;
        if (selectedLocation && locationGroups && locationGroups[selectedLocation]) {
            const hrLoc = (hr.location || '').toLowerCase();
            matchesLocation = locationGroups[selectedLocation].some(alias => hrLoc.includes(alias.toLowerCase()));
        }
        return matchesDomain && matchesLocation;
    }) : [];

    const handleSend = async () => {
        if (!subject.trim() || !body.trim()) {
            alert('Please enter a subject and body.');
            return;
        }

        if (filteredRecipients.length === 0) {
            alert('No HRs found to send emails to.');
            return;
        }

        if (!window.confirm(`Are you sure you want to send this email to ${filteredRecipients.length} HRs individually?`)) {
            return;
        }

        setIsSending(true);
        setTotal(filteredRecipients.length);
        setProgress(0);

        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < filteredRecipients.length; i++) {
            const hr = filteredRecipients[i];
            
            const formData = new FormData();
            formData.append('to', hr.hrEmail);
            formData.append('subject', subject);
            
            // Personalize the body by replacing placeholders if you want, else send as is
            let personalizedBody = body;
            if (hr.hrName && hr.hrName !== 'Unknown' && hr.hrName !== 'HR Department') {
                personalizedBody = `<p>Dear ${hr.hrName},</p>` + body;
            } else {
                personalizedBody = `<p>Dear Hiring Manager,</p>` + body;
            }
            formData.append('body', personalizedBody);

            for (let j = 0; j < attachments.length; j++) {
                formData.append('attachments', attachments[j]);
            }

            try {
                const res = await fetch('https://pharmatalenthub.in/api/email/send', {
                    method: 'POST',
                    body: formData,
                });
                if (res.ok) {
                    successCount++;
                } else {
                    failCount++;
                }
            } catch (err) {
                failCount++;
            }
            
            setProgress(i + 1);
        }

        setIsSending(false);
        alert(`Campaign complete! Sent: ${successCount}, Failed: ${failCount}`);
        onClose();
    };

    const modules = {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            [{ 'font': [] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'script': 'sub'}, { 'script': 'super' }],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            [{ 'indent': '-1'}, { 'indent': '+1' }],
            ['link', 'image'],
            ['clean']
        ],
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex',
            justifyContent: 'center', alignItems: 'center'
        }}>
            <div style={{
                backgroundColor: 'white', padding: '30px', borderRadius: '12px',
                width: '80%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto',
                boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ margin: 0, color: '#1e293b' }}>Draft Email Campaign</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#64748b' }}>&times;</button>
                </div>
                
                <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                    <select
                        value={selectedDomain}
                        onChange={(e) => setSelectedDomain(e.target.value)}
                        style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
                    >
                        <option value="">All Departments</option>
                        {departments && departments.map((dept, idx) => (
                            <option key={idx} value={dept.name}>{dept.name}</option>
                        ))}
                    </select>

                    <select
                        value={selectedLocation}
                        onChange={(e) => setSelectedLocation(e.target.value)}
                        style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
                    >
                        <option value="">All Locations</option>
                        {uniqueLocations && uniqueLocations.map((loc, idx) => (
                            <option key={idx} value={loc}>{loc}</option>
                        ))}
                    </select>
                </div>

                <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f1f5f9', borderRadius: '8px' }}>
                    <p style={{ margin: 0, fontWeight: 'bold', color: '#334155' }}>
                        Recipients: <span style={{ color: '#2563eb' }}>{filteredRecipients.length} HR(s)</span>
                    </p>
                    <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: '#64748b' }}>Each HR will receive this email individually. They will not see other recipients.</p>
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#334155' }}>Subject Line:</label>
                    <input 
                        type="text" 
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Enter email subject..."
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '15px' }}
                    />
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#334155' }}>Email Body (Rich Text):</label>
                    <div style={{ height: '300px', marginBottom: '40px' }}>
                        <ReactQuill 
                            theme="snow" 
                            value={body} 
                            onChange={setBody} 
                            modules={modules}
                            style={{ height: '100%' }}
                        />
                    </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#334155' }}>Attachments (CVs, JD, etc.):</label>
                    <input 
                        type="file" 
                        multiple 
                        onChange={handleFileChange}
                        style={{ width: '100%', padding: '10px', border: '1px dashed #cbd5e1', borderRadius: '6px' }}
                    />
                    {attachments.length > 0 && (
                        <ul style={{ marginTop: '10px', fontSize: '13px', color: '#475569' }}>
                            {attachments.map((file, idx) => (
                                <li key={idx}>{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</li>
                            ))}
                        </ul>
                    )}
                </div>

                {isSending && (
                    <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e0f2fe', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                        <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', color: '#0369a1' }}>Sending in progress... ({progress} / {total})</p>
                        <div style={{ width: '100%', backgroundColor: '#e2e8f0', borderRadius: '4px', height: '10px' }}>
                            <div style={{ width: `${(progress / total) * 100}%`, backgroundColor: '#0284c7', height: '100%', borderRadius: '4px', transition: 'width 0.3s' }}></div>
                        </div>
                    </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button 
                        onClick={onClose} 
                        disabled={isSending}
                        style={{ padding: '10px 20px', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', color: '#475569' }}
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSend} 
                        disabled={isSending}
                        style={{ padding: '10px 20px', backgroundColor: '#2563eb', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', color: 'white' }}
                    >
                        {isSending ? 'Sending...' : '🚀 Send Campaign'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EmailComposer;
