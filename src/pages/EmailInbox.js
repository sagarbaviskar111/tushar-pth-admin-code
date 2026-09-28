import React, { useState, useEffect } from 'react';
import './AddJob.css';

const EmailInbox = () => {
    const [emails, setEmails] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedEmail, setSelectedEmail] = useState(null);
    const [folder, setFolder] = useState('INBOX');

    const fetchEmails = async (targetFolder) => {
        setLoading(true);
        try {
            const res = await fetch(`https://pharmatalenthub.in/api/email/inbox?folder=${targetFolder}&limit=20`);
            const data = await res.json();
            if (res.ok) {
                setEmails(data.emails || []);
            } else {
                console.error("Failed to fetch emails", data.error);
            }
        } catch (err) {
            console.error("Error fetching emails", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmails(folder);
    }, [folder]);

    return (
        <div style={{ width: '100%', boxSizing: 'border-box', padding: '20px', fontFamily: "'Inter', sans-serif" }}>
            <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1e293b', margin: '0 0 20px 0' }}>
                Email Inbox (recruitment@pharmatalenthub.in)
            </h1>

            <div style={{ display: 'flex', gap: '20px' }}>
                {/* Sidebar */}
                <div style={{ width: '250px', backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)', border: '1px solid rgba(226, 232, 240, 0.8)' }}>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        <li 
                            onClick={() => { setFolder('INBOX'); setSelectedEmail(null); }}
                            style={{ padding: '10px 15px', cursor: 'pointer', borderRadius: '8px', backgroundColor: folder === 'INBOX' ? '#e0f2fe' : 'transparent', color: folder === 'INBOX' ? '#0369a1' : '#475569', fontWeight: folder === 'INBOX' ? '600' : '400', marginBottom: '5px' }}
                        >
                            📥 Inbox
                        </li>
                        <li 
                            onClick={() => { setFolder('INBOX.Sent'); setSelectedEmail(null); }}
                            style={{ padding: '10px 15px', cursor: 'pointer', borderRadius: '8px', backgroundColor: folder === 'INBOX.Sent' ? '#e0f2fe' : 'transparent', color: folder === 'INBOX.Sent' ? '#0369a1' : '#475569', fontWeight: folder === 'INBOX.Sent' ? '600' : '400' }}
                        >
                            📤 Sent Items
                        </li>
                    </ul>
                </div>

                {/* Email List */}
                <div style={{ flex: 1, backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)', border: '1px solid rgba(226, 232, 240, 0.8)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    {loading && <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>⏳ Fetching emails...</div>}
                    {!loading && emails.length === 0 && <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>📭 No emails found.</div>}
                    
                    {!loading && emails.length > 0 && !selectedEmail && (
                        <div style={{ overflowY: 'auto', flex: 1 }}>
                            {emails.map((email, idx) => (
                                <div 
                                    key={idx} 
                                    onClick={() => setSelectedEmail(email)}
                                    style={{ padding: '15px 20px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: 'background-color 0.2s' }}
                                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                        <span style={{ fontWeight: 'bold', color: '#334155' }}>{folder === 'INBOX' ? email.from : email.to}</span>
                                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>{new Date(email.date).toLocaleString()}</span>
                                    </div>
                                    <div style={{ color: '#0f172a', fontWeight: '500', marginBottom: '5px' }}>{email.subject || '(No Subject)'}</div>
                                    <div style={{ color: '#64748b', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {email.text ? email.text.substring(0, 100) : 'No preview'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Email View */}
                    {selectedEmail && (
                        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
                            <button onClick={() => setSelectedEmail(null)} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', padding: 0, marginBottom: '20px', fontWeight: 'bold' }}>
                                &larr; Back to List
                            </button>
                            <h2 style={{ margin: '0 0 15px 0', color: '#0f172a' }}>{selectedEmail.subject}</h2>
                            <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <div style={{ marginBottom: '5px' }}><strong>From:</strong> {selectedEmail.from}</div>
                                <div style={{ marginBottom: '5px' }}><strong>To:</strong> {selectedEmail.to}</div>
                                <div><strong>Date:</strong> {new Date(selectedEmail.date).toLocaleString()}</div>
                            </div>
                            <div style={{ backgroundColor: '#fff', padding: '20px', border: '1px solid #e2e8f0', borderRadius: '8px', minHeight: '300px' }}>
                                {selectedEmail.html ? (
                                    <div dangerouslySetInnerHTML={{ __html: selectedEmail.html }} />
                                ) : (
                                    <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0 }}>{selectedEmail.text}</pre>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EmailInbox;
