import { useEffect, useRef, useState } from 'react';
import './AddJob.css';
import BASE_API_URL, { NEXT_API_URL } from '../utils/apiConfig';
import validators from '../utils/validators';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AI_SYSTEM_PROMPT } from '../utils/aiPrompt';
import { generateJobBanner } from '../utils/bannerGenerator';

// File validation helper
function validateFiles(imageFile, logoFile, maxSizeBytes = 10 * 1024 * 1024, sourceScreenshotFile = null) {
    if (!imageFile) throw new Error('Image file is required.');
    if (!sourceScreenshotFile) throw new Error('Source reference screenshot is required.');
    if (!sourceScreenshotFile.type.startsWith('image/')) throw new Error('Source reference screenshot must be an image file.');
    if (sourceScreenshotFile.size > maxSizeBytes) {
        const maxMB = Math.round(maxSizeBytes / (1024 * 1024));
        throw new Error(`Source reference screenshot exceeds max size of ${maxMB}MB.`);
    }
    if (!imageFile.type.startsWith('image/')) throw new Error('Image must be an image file.');
    if (imageFile.size > maxSizeBytes) {
        const maxMB = Math.round(maxSizeBytes / (1024 * 1024));
        throw new Error(`Image exceeds max size of ${maxMB}MB. Current size: ${Math.round(imageFile.size / (1024 * 1024))}MB.`);
    }
    if (logoFile) {
        if (!logoFile.type.startsWith('image/')) throw new Error('Logo must be an image file.');
        if (logoFile.size > maxSizeBytes) {
            const maxMB = Math.round(maxSizeBytes / (1024 * 1024));
            throw new Error(`Logo exceeds max size of ${maxMB}MB. Current size: ${Math.round(logoFile.size / (1024 * 1024))}MB.`);
        }
    }
    return true;
}

// Look up a logo already saved for this company (from earlier jobs); returns a File or null
async function fetchSavedCompanyLogo(companyName) {
    const company = (companyName || '').trim();
    if (!company) return null;
    try {
        const res = await fetch(`${BASE_API_URL}/api/jobs/company-logo?company=${encodeURIComponent(company)}`);
        if (!res.ok) return null;
        const data = await res.json();
        if (!data.exists) return null;
        const imgRes = await fetch(data.url);
        if (!imgRes.ok) return null;
        const blob = await imgRes.blob();
        return new File([blob], 'saved-logo.png', { type: blob.type || 'image/png' });
    } catch (err) {
        console.warn('Could not load saved company logo', err);
        return null;
    }
}

// Helper to save logo to Next.js backend mapped to company name
function resizeAndSaveLogo(file, companyName) {
    if (!companyName || !file) return;
    try {
        const logoData = new FormData();
        logoData.append('companyName', companyName);
        logoData.append('logo', file);
        
        fetch(`${NEXT_API_URL}/api/company-logos`, {
            method: 'POST',
            body: logoData
        }).catch(err => console.error('Failed to auto-save fetched logo to Next.js API', err));
    } catch(e) {
        console.error('Failed to build logo form data', e);
    }
}

// Build FormData with correct field names
function buildJobFormData(values, imageFile, logoFile, sourceScreenshotFile) {
    const form = new FormData();
    form.append('company', values.company || '');
    form.append('positionName', values.positionName || '');
    form.append('qualification', values.qualification || '');
    form.append('experience', values.experience || '');
    form.append('salary', values.salary || '');
    form.append('location', values.location || '');
    form.append('applylink', values.applylink || '');
    form.append('tags', values.tags || '');
    form.append('companyOverview', values.companyOverview || '');
    if (values.department) form.append('department', values.department);
    form.append('email', values.email || '');
    form.append('driveLocation', values.driveLocation || '');
    form.append('driveDate', values.driveDate || '');
    form.append('driveTime', values.driveTime || '');
    form.append('driveContactPerson', values.driveContactPerson || '');
    form.append('driveContactNumber', values.driveContactNumber || '');
    if (values.applicationDeadline) form.append('applicationDeadline', values.applicationDeadline);
    form.append('type', values.type || '');
    form.append('sourceReferenceLink', values.sourceReferenceLink || '');
    
    // Arrays: append each entry separately
    (values.responsibilities || []).forEach(r => form.append('responsibilities', r));
    (values.skills || []).forEach(s => form.append('skills', s));
    
    if (values.commonInterviewQuestions && values.commonInterviewQuestions.length > 0) {
        form.append('commonInterviewQuestions', JSON.stringify(values.commonInterviewQuestions));
    }

    // Files
    form.append('image', imageFile);
    if (logoFile) form.append('logo', logoFile);
    form.append('sourceReferenceScreenshot', sourceScreenshotFile);

    return form;
}

const AddJob = () => {
    const [departments, setDepartments] = useState([]);
    const [job, setJob] = useState({
        company: '',
        positionName: '',
        qualification: '',
        experience: '',
        salary: '',
        location: '',
        responsibilities: [],
        applylink: '',
        tags: '',
        skills: [],
        companyOverview: '',
        department: '',
        email: '',
        driveLocation: '',
        driveDate: '',
        driveTime: '',
        driveContactPerson: '',
        driveContactNumber: '',
        applicationDeadline: '',
        type: '',
        sourceReferenceLink: '',
        commonInterviewQuestions: []
    });
    const [responsibility, setResponsibility] = useState('');
    const [skill, setSkill] = useState('');
    const [interviewQuestion, setInterviewQuestion] = useState({ question: '', answer: '' });
    const [imageFile, setImageFile] = useState(null);
    const [logoFile, setLogoFile] = useState(null);
    const autoLogoRef = useRef(false);      // true while logoFile was auto-loaded (not user-picked)
    const logoLookupIdRef = useRef(0);      // ignores out-of-order logo lookups while typing
    const [sourceScreenshotFile, setSourceScreenshotFile] = useState(null);
    const [errors, setErrors] = useState([]);
    const [loading, setLoading] = useState(false);

    const [inputMode, setInputMode] = useState('manual'); // 'manual', 'json', or 'ai'
    const [jsonInput, setJsonInput] = useState('');
    const [aiScreenshots, setAiScreenshots] = useState([]);
    const [aiText, setAiText] = useState('');
    const [aiCustomInstructions, setAiCustomInstructions] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [bannerPreviewUrl, setBannerPreviewUrl] = useState(null);
    const [logoPreviewUrl, setLogoPreviewUrl] = useState(null);
    const [bannerTheme, setBannerTheme] = useState('theme1');

    useEffect(() => {
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

        fetchDepartments();
    }, []);

    // Create a local URL for the imageFile if needed in future (removed banner preview UI as requested)
    useEffect(() => {
        // Banner preview removed
    }, [imageFile]);

    // Create a local URL for the logoFile so user can download the logo
    useEffect(() => {
        if (logoFile) {
            const url = URL.createObjectURL(logoFile);
            setLogoPreviewUrl(url);
            return () => URL.revokeObjectURL(url);
        } else {
            setLogoPreviewUrl(null);
        }
    }, [logoFile]);

    const handleAddResponsibility = () => {
        if (responsibility.trim()) {
            setJob((prevState) => ({
                ...prevState,
                responsibilities: [...prevState.responsibilities, responsibility]
            }));
            setResponsibility('');
        }
    };

    const handleAddSkill = () => {
        if (skill.trim()) {
            setJob((prevState) => ({
                ...prevState,
                skills: [...prevState.skills, skill]
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

    const processLogo = (file) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const size = 300;
                canvas.width = size;
                canvas.height = size;
                const ctx = canvas.getContext('2d', { willReadFrequently: true });
                
                ctx.clearRect(0, 0, size, size);
                
                const scale = Math.min((size - 40) / img.width, (size - 40) / img.height);
                const w = img.width * scale;
                const h = img.height * scale;
                const x = (size - w) / 2;
                const y = (size - h) / 2;
                
                ctx.drawImage(img, x, y, w, h);
                
                const imgData = ctx.getImageData(0, 0, size, size);
                const data = imgData.data;
                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    // Make white backgrounds transparent
                    if (r > 240 && g > 240 && b > 240) {
                        data[i + 3] = 0;
                    }
                }
                ctx.putImageData(imgData, 0, 0);
                
                canvas.toBlob((blob) => {
                    if (blob) {
                        resolve(new File([blob], "logo-processed.png", { type: "image/png" }));
                    } else {
                        reject(new Error("Canvas toBlob failed"));
                    }
                }, 'image/png');
            };
            img.onerror = reject;
            img.src = URL.createObjectURL(file);
        });
    };

    const handleChange = async (e) => {
        const { name, value } = e.target;
        setJob((prev) => ({
            ...prev,
            [name]: value,
        }));
        
        if (name === 'company') {
            const lookupId = ++logoLookupIdRef.current;
            const isStale = () => lookupId !== logoLookupIdRef.current;
            const setAutoLogo = (file) => {
                autoLogoRef.current = true;
                setLogoFile(file);
            };
            // Drop a previously auto-loaded logo (never a manually uploaded one) when no logo is found for this company
            const clearAutoLogo = () => {
                if (autoLogoRef.current) {
                    autoLogoRef.current = false;
                    setLogoFile(null);
                }
            };

            if (value.trim().length <= 2) {
                clearAutoLogo();
                return;
            }

            try {
                const savedLogo = await fetchSavedCompanyLogo(value);
                if (isStale()) return;
                if (savedLogo) {
                    setAutoLogo(savedLogo);
                    return;
                }
                let found = false;
                try {
                    const res = await fetch(`${NEXT_API_URL}/api/company-logos?company=${encodeURIComponent(value.trim())}`);
                    const data = await res.json();
                    if (data.exists) {
                        const blobRes = await fetch(`${NEXT_API_URL}${data.url}`);
                        const blob = await blobRes.blob();
                        const file = new File([blob], "auto-logo.png", { type: "image/png" });
                        if (isStale()) return;
                        setAutoLogo(file);
                        found = true;
                    }
                } catch (err) {
                    console.warn("Legacy logo store unavailable", err);
                }
                if (!found) {
                    // Try Clearbit if not found locally
                    const domain = value.trim().toLowerCase().replace(/[^a-z0-9]/g, '') + '.com';
                    const logoUrl = `https://logo.clearbit.com/${domain}`;
                    const logoResponse = await fetch(logoUrl);
                    if (logoResponse.ok) {
                        const blob = await logoResponse.blob();
                        const file = new File([blob], "logo.png", { type: blob.type });
                        const processed = await processLogo(file);
                        if (isStale()) return;
                        setAutoLogo(processed);
                        resizeAndSaveLogo(processed, value.trim());
                        found = true;
                    }
                }
                if (!found && !isStale()) clearAutoLogo();
            } catch (err) {
                console.error("Could not check/load auto logo", err);
                if (!isStale()) clearAutoLogo();
            }
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const validation = validators.validateFile(file, 'image/*', 5 * 1024 * 1024);
            if (validation.isValid) {
                setImageFile(file);
                setErrors(errors.filter(err => !err.includes('image')));
            } else {
                setErrors([...errors.filter(err => !err.includes('image')), validation.error]);
            }
        }
    };

    const handleFileChange2 = async (e) => {
        const file = e.target.files[0];
        if (file) {
            const validation = validators.validateFile(file, 'image/*', 5 * 1024 * 1024);
            if (validation.isValid) {
                autoLogoRef.current = false;
                setLogoFile(file);
                setErrors(errors.filter(err => !err.includes('logo')));
            } else {
                setErrors([...errors.filter(err => !err.includes('logo')), validation.error]);
            }
        }
    };

    const handleSourceScreenshotChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const validation = validators.validateFile(file, 'image/*', 5 * 1024 * 1024);
            if (validation.isValid) {
                setSourceScreenshotFile(file);
                setErrors(errors.filter(err => !err.includes('screenshot')));
            } else {
                setErrors([...errors.filter(err => !err.includes('screenshot')), validation.error]);
            }
        }
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

    const handleJsonApply = () => {
        try {
            let parsedData = JSON.parse(jsonInput);
            
            // If the user pasted an API response containing 'job', extract it
            if (parsedData.job) {
                parsedData = parsedData.job;
            }

            const validation = validators.validateJobCreate(parsedData);
            
            if (!validation.isValid) {
                setErrors(validation.errors);
                return;
            }

            setJob((prev) => ({
                ...prev,
                ...parsedData
            }));
            setErrors([]);
            alert('Fields populated from JSON!');
            setInputMode('manual');
        } catch (error) {
            setErrors(['Invalid JSON format. Please check your input.']);
        }
    };

    const handleAiProcess = async () => {
        if (aiScreenshots.length === 0 && !aiText.trim()) {
            setErrors(['Please provide an image or text for the AI to process.']);
            return;
        }
        
        const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
        if (!apiKey) {
            setErrors(['REACT_APP_GEMINI_API_KEY is missing in your .env file. Please add it to use the AI feature.']);
            return;
        }

        setAiLoading(true);
        setErrors([]);

        try {
            const genAI = new GoogleGenerativeAI(apiKey);
            
            let promptContent = [AI_SYSTEM_PROMPT];

            if (aiCustomInstructions.trim()) {
                promptContent.push("USER CUSTOM INSTRUCTIONS (MUST FOLLOW):\n" + aiCustomInstructions);
            }

            if (aiText.trim()) {
                promptContent.push("Here is the raw text of the job posting:\n" + aiText);
            }

            for (const screenshot of aiScreenshots) {
                const base64Image = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result.split(',')[1]);
                    reader.onerror = reject;
                    reader.readAsDataURL(screenshot);
                });
                
                promptContent.push({
                    inlineData: {
                        data: base64Image,
                        mimeType: screenshot.type
                    }
                });
            }

            const fetchFromGroq = async (modelName) => {
                let contentStr = AI_SYSTEM_PROMPT + "\n\n";
                const nextMonth = new Date();
                nextMonth.setMonth(nextMonth.getMonth() + 1);
                const formattedDeadline = nextMonth.toISOString().split('T')[0];
                contentStr += `CRITICAL RULES UPDATE:\n1. 'applicationDeadline' MUST BE EXACTLY: "${formattedDeadline}".\n2. 'applicationLink': YOU MUST EXTRACT any email address or website link. If an email is found, format it as 'mailto:email@example.com'. If NO link or email exists, use "https://pharmatalenthub.in".\n3. 'hashTags': MUST ALWAYS be 5-7 relevant hashtags.\n4. Walk-in Details: If 'Walk-in' or an interview is mentioned, YOU MUST extract 'driveDate', 'driveTime', and 'driveLocation' (Address). DO NOT MISS the address!\n5. Emojis: DO NOT use any emojis in the content. The post must be purely professional text without emojis.\n\n`;

                if (aiCustomInstructions) contentStr += "USER CUSTOM INSTRUCTIONS:\n" + aiCustomInstructions + "\n\n";
                if (aiText.trim()) contentStr += "Raw Text:\n" + aiText + "\n";
                
                const messages = [{ role: "user", content: contentStr }];

                if (aiScreenshots.length > 0) {
                    if (!modelName.includes("vision")) {
                        throw new Error(`Model ${modelName} does not support vision`);
                    }
                    messages[0].content = [{ type: "text", text: contentStr }];
                    for (const screenshot of aiScreenshots) {
                        const base64Image = await new Promise((resolve, reject) => {
                            const reader = new FileReader();
                            reader.onloadend = () => resolve(reader.result);
                            reader.onerror = reject;
                            reader.readAsDataURL(screenshot);
                        });
                        messages[0].content.push({ type: "image_url", image_url: { url: base64Image } });
                    }
                }

                const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${process.env.REACT_APP_GROQ_API_KEY}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        model: modelName,
                        messages: messages,
                        temperature: 0.1,
                        response_format: { type: "json_object" }
                    })
                });
                
                if (!res.ok) throw new Error("Groq API error: " + res.statusText);
                const data = await res.json();
                return { response: { text: () => data.choices[0].message.content } };
            };

            const groqModels = aiScreenshots.length > 0 
                ? [] // Groq has decommissioned their vision models
                : ['openai/gpt-oss-120b', 'openai/gpt-oss-20b'];
            
            const geminiModels = ['gemini-flash-latest', 'gemini-2.5-flash'];
            
            let result = null;
            let lastError = null;

            // Try Groq models first (fastest)
            if (process.env.REACT_APP_GROQ_API_KEY) {
                for (const modelName of groqModels) {
                    try {
                        result = await fetchFromGroq(modelName);
                        break;
                    } catch (e) {
                        console.warn(`Groq ${modelName} failed:`, e);
                        lastError = e;
                    }
                }
            }

            // Fallback to Gemini if Groq failed or not configured
            if (!result) {
                const nextMonth = new Date();
                nextMonth.setMonth(nextMonth.getMonth() + 1);
                const formattedDeadline = nextMonth.toISOString().split('T')[0];
                promptContent.push(`CRITICAL RULES UPDATE:\n1. 'applicationDeadline' MUST BE EXACTLY: "${formattedDeadline}".\n2. 'applicationLink': YOU MUST EXTRACT any email address or website link. If an email is found, format it as 'mailto:email@example.com'. If NO link or email exists, use "https://pharmatalenthub.in".\n3. 'hashTags': MUST ALWAYS be 5-7 relevant hashtags.\n4. Walk-in Details: If 'Walk-in' or an interview is mentioned, YOU MUST extract 'driveDate', 'driveTime', and 'driveLocation' (Address). DO NOT MISS the address!\n5. Emojis: DO NOT use any emojis in the content. The post must be purely professional text without emojis.`);

                let maxWaitTime = 0;
                for (let attempt = 1; attempt <= 3; attempt++) {
                    for (const modelName of geminiModels) {
                        try {
                            const model = genAI.getGenerativeModel({ model: modelName });
                            result = await model.generateContent(promptContent);
                            break; // Success!
                        } catch (e) {
                            console.warn(`Gemini ${modelName} attempt ${attempt} failed:`, e);
                            lastError = e;
                            
                            if (e.message && (e.message.includes('429') || e.message.includes('503'))) {
                                const retryMatch = e.message.match(/retry in (\d+(\.\d+)?)s/);
                                if (retryMatch) {
                                    const delay = parseFloat(retryMatch[1]) * 1000 + 1000;
                                    if (delay > maxWaitTime) maxWaitTime = delay;
                                } else {
                                    if (16000 > maxWaitTime) maxWaitTime = 16000;
                                }
                            }
                        }
                    }
                    if (result) break;
                    
                    // If all models failed in this attempt and we have a wait time
                    if (maxWaitTime > 0) {
                        const waitTime = Math.min(maxWaitTime, 60000); // Cap at 60s
                        console.log(`All models rate limited/high demand. Waiting ${waitTime/1000} seconds before next attempt...`);
                        await new Promise(resolve => setTimeout(resolve, waitTime));
                        maxWaitTime = 0; // Reset for next attempt
                    }
                }
            }

            if (!result) {
                throw lastError || new Error("All AI models failed (Rate limited or network error).");
            }

            const responseText = result.response.text();
            // Clean up potential markdown blocks if Gemini didn't follow strictly
            let cleanedJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsedData = JSON.parse(cleanedJson);

            // Post-process Application Link for mailto:
            if (parsedData.applicationLink) {
                const link = parsedData.applicationLink.trim();
                // If it looks like an email and doesn't start with mailto:
                if (link.includes('@') && !link.toLowerCase().startsWith('http') && !link.toLowerCase().startsWith('mailto:')) {
                    parsedData.applicationLink = 'mailto:' + link;
                }
            }

            // Fetch Logo
            let fetchedLogoFile = null;
            let logoUrl = null;
            if (parsedData.company) {
                // Logo saved from an earlier job for this company
                fetchedLogoFile = await fetchSavedCompanyLogo(parsedData.company);
                if (fetchedLogoFile) {
                    autoLogoRef.current = true;
                    setLogoFile(fetchedLogoFile);
                } else {
                    // Legacy Next.js logo store
                    try {
                        const res = await fetch(`${NEXT_API_URL}/api/company-logos?company=${encodeURIComponent(parsedData.company.trim())}`);
                        const data = await res.json();
                        if (data.exists) {
                            const blobRes = await fetch(`${NEXT_API_URL}${data.url}`);
                            const blob = await blobRes.blob();
                            fetchedLogoFile = new File([blob], 'auto-logo.png', { type: 'image/png' });
                            autoLogoRef.current = true;
                            setLogoFile(fetchedLogoFile);
                        }
                    } catch(e) {
                        console.warn('Could not fetch auto logo from API', e);
                    }
                }

                // If not found locally, try Clearbit
                if (!fetchedLogoFile) {
                    try {
                        const domain = parsedData.company.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com';
                        logoUrl = `https://logo.clearbit.com/${domain}`;
                        // Fetch as blob
                        const logoResponse = await fetch(logoUrl);
                        if (logoResponse.ok) {
                            const blob = await logoResponse.blob();
                            fetchedLogoFile = new File([blob], 'logo.png', { type: blob.type });
                            
                            try {
                                fetchedLogoFile = await processLogo(fetchedLogoFile);
                            } catch(e) {
                                console.warn('Could not process clearbit logo', e);
                            }

                            autoLogoRef.current = true;
                            setLogoFile(fetchedLogoFile);
                            
                            // Save this newly fetched logo so it's reused!
                            resizeAndSaveLogo(fetchedLogoFile, parsedData.company);
                        } else {
                            logoUrl = null; // Clearbit couldn't find it
                        }
                    } catch(e) {
                        console.warn('Could not fetch logo automatically', e);
                    }
                }
            }

            // Populate form
            const nextMonthDate = new Date();
            nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
            const defaultDeadline = nextMonthDate.toISOString().split('T')[0];
            
            setJob((prev) => ({
                ...prev,
                ...parsedData,
                applylink: parsedData.applicationLink || parsedData.applylink || 'https://pharmatalenthub.in',
                tags: parsedData.hashTags || parsedData.tags || '#PharmaJobs #Hiring #ClinicalResearch #RegulatoryAffairs #HealthcareCareers',
                applicationDeadline: parsedData.applicationDeadline || defaultDeadline,
                responsibilities: Array.isArray(parsedData.responsibilities) ? parsedData.responsibilities : (typeof parsedData.responsibilities === 'string' ? parsedData.responsibilities.split('\n') : []),
                skills: Array.isArray(parsedData.skills) ? parsedData.skills : (typeof parsedData.skills === 'string' ? parsedData.skills.split('\n') : []),
                commonInterviewQuestions: Array.isArray(parsedData.commonInterviewQuestions) ? parsedData.commonInterviewQuestions : []
            }));

            // Auto-capture HR Data
            try {
                let emailsToCapture = [];
                
                // 1. Check hrEmail from AI
                if (parsedData.hrEmail) {
                    const match = parsedData.hrEmail.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/i);
                    if (match) emailsToCapture.push(match[0]);
                }
                
                // 2. Check applicationLink
                const link = parsedData.applicationLink || parsedData.applylink || '';
                if (link.toLowerCase().includes('mailto:')) {
                    const cleanEmail = link.replace(/mailto:/i, '').split('?')[0].trim();
                    if (cleanEmail) emailsToCapture.push(cleanEmail);
                } else {
                    const linkMatches = link.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi);
                    if (linkMatches) emailsToCapture.push(...linkMatches);
                }

                // 3. Remove duplicates
                emailsToCapture = [...new Set(emailsToCapture.map(e => e.toLowerCase()))];

                if (emailsToCapture.length > 0) {
                    let hrDatabase = [];
                    try {
                        const stored = localStorage.getItem('hrDatabase');
                        if (stored) hrDatabase = JSON.parse(stored);
                    } catch (e) {}

                    emailsToCapture.forEach(email => {
                        const newEntry = {
                            hrName: parsedData.hrName || 'Unknown',
                            hrEmail: email,
                            companyName: parsedData.company || 'Unknown',
                            location: parsedData.location || 'Unknown',
                            contactNumber: parsedData.hrContact || 'Unknown'
                        };

                        const existingIndex = hrDatabase.findIndex(hr => hr.hrEmail.toLowerCase() === email);
                        if (existingIndex >= 0) {
                            const existing = hrDatabase[existingIndex];
                            if (existing.hrName === 'Unknown' && newEntry.hrName !== 'Unknown') existing.hrName = newEntry.hrName;
                            if (existing.companyName === 'Unknown' && newEntry.companyName !== 'Unknown') existing.companyName = newEntry.companyName;
                            if (existing.contactNumber === 'Unknown' && newEntry.contactNumber !== 'Unknown') existing.contactNumber = newEntry.contactNumber;
                            
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
                        } else {
                            hrDatabase.push(newEntry);
                        }
                    });

                    localStorage.setItem('hrDatabase', JSON.stringify(hrDatabase));
                    console.log('HR Data captured successfully');
                }
            } catch (hrErr) {
                console.error("Failed to capture HR Data:", hrErr);
            }

            alert('AI Extraction Complete! Form populated and banner generated.');
            setInputMode('manual');
        } catch (error) {
            console.error(error);
            setErrors(['AI processing failed after multiple retries. Please try again. (' + error.message + ')']);
        } finally {
            setAiLoading(false);
        }
    };

    // Removed handleRegenerateBanner function

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors([]);
        setLoading(true);

        try {
            // Validate job data
            const validation = validators.validateJobCreate(job);
            if (!validation.isValid) {
                setErrors(validation.errors);
                setLoading(false);
                return;
            }

            // Validate files
            validateFiles(imageFile, logoFile, 10 * 1024 * 1024, sourceScreenshotFile);

            // Get auth token
            const token = localStorage.getItem('token');
            if (!token) {
                setErrors(['Authentication token not found. Please login again.']);
                setLoading(false);
                return;
            }

            // Build FormData with correct field names
            const formData = buildJobFormData(job, imageFile, logoFile, sourceScreenshotFile);

            // Log file sizes for debugging
            console.log('image size:', imageFile.size, 'bytes');
            if (logoFile) console.log('logo size:', logoFile.size, 'bytes');

            // Upload with proper headers (do NOT set Content-Type manually)
            const response = await fetch(`${BASE_API_URL}/api/jobs`, {
                method: 'POST',
                body: formData,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    // DO NOT set Content-Type - browser will set it with boundary
                },
            });

            if (response.status === 413) {
                setErrors(['File too large. Server rejected payload. Try compressing images or contact admin.']);
                setLoading(false);
                return;
            }

            if (!response.ok) {
                const responseData = await response.json().catch(() => ({}));
                const errorMsg = responseData.message || responseData.error || 'Failed to submit job details';
                setErrors([errorMsg]);
                setLoading(false);
                return;
            }

            if (logoFile && job.company) {
                try {
                    const logoData = new FormData();
                    logoData.append('companyName', job.company);
                    logoData.append('logo', logoFile);
                    
                    fetch(`${NEXT_API_URL}/api/company-logos`, {
                        method: 'POST',
                        body: logoData
                    }).catch(err => console.error('Failed to auto-save logo to Next.js API', err));
                } catch(e) {
                    console.error('Failed to build logo form data', e);
                }
            }

            alert('Job details submitted successfully!');
            setJob({
                company: '',
                positionName: '',
                qualification: '',
                experience: '',
                salary: '',
                location: '',
                responsibilities: [],
                tags: '',
                applylink: '',
                skills: [],
                companyOverview: '',
                department: '',
                email: '',
                driveLocation: '',
                driveDate: '',
                driveTime: '',
                driveContactPerson: '',
                driveContactNumber: '',
                applicationDeadline: '',
                type: '',
                sourceReferenceLink: '',
                commonInterviewQuestions: []
            });
            setImageFile(null);
            setLogoFile(null);
            setSourceScreenshotFile(null);
            setErrors([]);
        } catch (error) {
            console.error('Error:', error);
            setErrors([error.message || 'An error occurred while submitting the form']);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="formContainer">
            <h1 className="title">Job Posting Form</h1>

            <div className="modeToggle">
                <label>
                    <input
                        type="radio"
                        value="manual"
                        checked={inputMode === 'manual'}
                        onChange={() => setInputMode('manual')}
                    /> Manual Entry
                </label>
                <label>
                    <input
                        type="radio"
                        value="json"
                        checked={inputMode === 'json'}
                        onChange={() => setInputMode('json')}
                    /> Paste JSON
                </label>
                <label>
                    <input
                        type="radio"
                        value="ai"
                        checked={inputMode === 'ai'}
                        onChange={() => setInputMode('ai')}
                    /> ✨ AI Upload
                </label>
            </div>

            {errors.length > 0 && (
                <div style={styles.errorContainer}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#721c24' }}>Validation Errors:</h4>
                    {errors.map((error, index) => (
                        <p key={index} style={styles.error}>• {error}</p>
                    ))}
                </div>
            )}

            {inputMode === 'json' && (
                <div className="jsonInputArea">
                    <textarea
                        rows="10"
                        className="textarea"
                        value={jsonInput}
                        onChange={(e) => setJsonInput(e.target.value)}
                        placeholder='Paste your job JSON here...'
                        disabled={loading}
                    ></textarea>
                    <button type="button" className="addButton" onClick={handleJsonApply} disabled={loading}>
                        Apply JSON Data
                    </button>
                </div>
            )}

            {inputMode === 'ai' && (
                <div className="aiInputArea" style={{ marginTop: '20px', padding: '20px', border: '2px dashed #0ea5e9', borderRadius: '8px', textAlign: 'center', backgroundColor: '#f0f9ff' }}>
                    <h3 style={{ color: '#0369a1', marginBottom: '10px' }}>AI Job Extraction</h3>
                    <p style={{ color: '#0284c7', marginBottom: '20px' }}>
                        Upload a screenshot OR paste the raw text of the job posting.<br/>
                        The AI will extract all details, fetch the company logo, and generate a banner automatically!
                    </p>
                    <div style={{ marginBottom: '20px', textAlign: 'left' }}>
                        <label className="label">1. Paste Job Text (Optional)</label>
                        <textarea
                            rows="5"
                            className="textarea"
                            value={aiText}
                            onChange={(e) => setAiText(e.target.value)}
                            placeholder="Paste the job description text here..."
                            disabled={aiLoading}
                        ></textarea>
                    </div>
                    <div style={{ marginBottom: '20px', textAlign: 'left' }}>
                        <label className="label">2. Upload Screenshots (Optional, max 3)</label>
                        <input 
                            type="file" 
                            accept="image/*"
                            multiple
                            onChange={(e) => {
                                const files = Array.from(e.target.files);
                                if (files.length > 3) {
                                    alert("You can only upload up to 3 screenshots at once.");
                                    setAiScreenshots(files.slice(0, 3));
                                } else {
                                    setAiScreenshots(files);
                                }
                            }} 
                            disabled={aiLoading} 
                            className="input"
                            style={{ display: 'inline-block', width: 'auto' }}
                        />
                    </div>
                    <div style={{ marginBottom: '20px', textAlign: 'left' }}>
                        <label className="label">3. Custom Instructions / Prompts (Optional)</label>
                        <textarea
                            rows="3"
                            className="textarea"
                            value={aiCustomInstructions}
                            onChange={(e) => setAiCustomInstructions(e.target.value)}
                            placeholder="e.g., 'Make the salary strictly 5 LPA' or 'Add 5 interview questions about React'"
                            disabled={aiLoading}
                        ></textarea>
                    </div>
                    <button 
                        type="button" 
                        className="addButton" 
                        onClick={handleAiProcess} 
                        disabled={aiLoading || (aiScreenshots.length === 0 && !aiText.trim())}
                        style={{ backgroundColor: '#0ea5e9', color: 'white', padding: '10px 20px', fontSize: '16px', border: 'none', borderRadius: '5px', cursor: aiLoading || (aiScreenshots.length === 0 && !aiText.trim()) ? 'not-allowed' : 'pointer', opacity: aiLoading || (aiScreenshots.length === 0 && !aiText.trim()) ? 0.6 : 1 }}
                    >
                        {aiLoading ? '🤖 AI is processing... (This takes a few seconds)' : '✨ Extract with AI'}
                    </button>
                </div>
            )}

            {inputMode === 'manual' && (
                <form onSubmit={handleSubmit} className="form">
                    <label className="label">Position Name: *
                        <input type="text" name="positionName" value={job.positionName} onChange={handleChange} className="input" disabled={loading} />
                    </label>
                    <label className="label">Company Name: *
                        <input type="text" name="company" value={job.company} onChange={handleChange} className="input" disabled={loading} />
                    </label>
                    <label className="label">Salary: *
                        <input type="text" name="salary" value={job.salary} onChange={handleChange} className="input" placeholder="e.g., 5-8 LPA" disabled={loading} />
                    </label>
                    <label className="label">Location: *
                        <input type="text" name="location" value={job.location} onChange={handleChange} className="input" disabled={loading} />
                    </label>
                    <label className="label">Qualification: *
                        <input type="text" name="qualification" value={job.qualification} onChange={handleChange} className="input" disabled={loading} />
                    </label>

                    <div className="fieldGroup">
                        <label className="label">Responsibilities:</label>
                        <div className="dynamicInput">
                            <input type="text" value={responsibility} onChange={(e) => setResponsibility(e.target.value)} className="input" disabled={loading} />
                            <button type="button" onClick={handleAddResponsibility} className="addButton" disabled={!responsibility.trim() || loading}>
                                Add Responsibility
                            </button>
                        </div>
                        <ul className="list">
                            {job.responsibilities.map((item, index) => (
                                <li key={index} className="listItem">
                                    {item}
                                    <button type="button" className="deleteButton" onClick={() => handleDeleteResponsibility(index)} disabled={loading}>
                                        &#10006;
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <label className="label">Company Overview: *
                        <textarea name="companyOverview" value={job.companyOverview} onChange={handleChange} className="textarea" disabled={loading}></textarea>
                    </label>

                    <label className="label">Application Link: *
                        <input type="text" name="applylink" value={job.applylink} onChange={handleChange} className="input" placeholder="https://example.com/apply" disabled={loading} />
                    </label>

                    <label className="label">Email (Optional):
                        <input type="email" name="email" value={job.email} onChange={handleChange} className="input" disabled={loading} />
                    </label>

                    <label className="label">Experience:
                        <input type="text" name="experience" value={job.experience} onChange={handleChange} className="input" placeholder="e.g., 2-3 years" disabled={loading} />
                    </label>

                    <label className="label">Job Type:
                        <input type="text" name="type" value={job.type} onChange={handleChange} className="input" placeholder="e.g., Full-time, Part-time" disabled={loading} />
                    </label>

                    <label className="label">Application Deadline:
                        <input type="date" name="applicationDeadline" value={job.applicationDeadline} onChange={handleChange} className="input" disabled={loading} />
                    </label>

                    <label className="label">HashTags:
                        <input type="text" name="tags" value={job.tags} onChange={handleChange} className="input" placeholder="e.g., #React #NodeJS" disabled={loading} />
                    </label>

                    <label className="label">Drive Location:
                        <input type="text" name="driveLocation" value={job.driveLocation} onChange={handleChange} className="input" disabled={loading} />
                    </label>

                    <label className="label">Drive Date:
                        <input type="date" name="driveDate" value={job.driveDate} onChange={handleChange} className="input" disabled={loading} />
                    </label>

                    <label className="label">Drive Time:
                        <input type="time" name="driveTime" value={job.driveTime} onChange={handleChange} className="input" disabled={loading} />
                    </label>

                    <label className="label">Drive Contact Person:
                        <input type="text" name="driveContactPerson" value={job.driveContactPerson} onChange={handleChange} className="input" disabled={loading} />
                    </label>

                    <label className="label">Drive Contact Number:
                        <input type="tel" name="driveContactNumber" value={job.driveContactNumber} onChange={handleChange} className="input" disabled={loading} />
                    </label>

                    <div className="fieldGroup">
                        <label className="label">Skills:</label>
                        <div className="dynamicInput">
                            <input type="text" value={skill} onChange={(e) => setSkill(e.target.value)} className="input" placeholder="e.g., React" disabled={loading} />
                            <button type="button" onClick={handleAddSkill} className="addButton" disabled={!skill.trim() || loading}>
                                Add Skill
                            </button>
                        </div>
                        <ul className="list">
                            {job.skills.map((item, index) => (
                                <li key={index} className="listItem">
                                    {item}
                                    <button type="button" className="deleteButton" onClick={() => handleDeleteSkill(index)} disabled={loading}>
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
                            {job.commonInterviewQuestions.map((item, index) => (
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

                    <label className="label">Image Upload: * (max 5MB)
                        <input type="file" accept="image/*" onChange={handleFileChange} className="input" disabled={loading} />
                        {imageFile && <span style={{ marginLeft: '10px', color: '#10b981' }}>✓ Selected: {imageFile.name}</span>}
                    </label>

                    <label className="label">Logo Upload: (max 5MB)
                        <input type="file" accept="image/*" onChange={handleFileChange2} className="input" disabled={loading} />
                        {logoFile && <span style={{ marginLeft: '10px', color: '#10b981' }}>✓ Selected: {logoFile.name}</span>}
                        {logoPreviewUrl && (
                            <div style={{ marginTop: '10px' }}>
                                <img src={logoPreviewUrl} alt="Logo Preview" style={{ width: '100px', height: '100px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #ccc', marginBottom: '10px', display: 'block', backgroundColor: 'white' }} />
                                <a 
                                    href={logoPreviewUrl} 
                                    download="company-logo.png" 
                                    className="addButton" 
                                    style={{ display: 'inline-block', backgroundColor: '#10b981', color: 'white', textDecoration: 'none', padding: '8px 15px', borderRadius: '5px' }}
                                >
                                    ⬇️ Download Logo
                                </a>
                            </div>
                        )}
                    </label>
                    
                    <label className="label">Source Reference Link: (Optional)
                        <input type="text" name="sourceReferenceLink" value={job.sourceReferenceLink} onChange={handleChange} className="input" placeholder="https://example.com/original-job-post" disabled={loading} />
                    </label>

                    <label className="label">Source Reference Screenshot: * (max 5MB)
                        <input type="file" accept="image/*" onChange={handleSourceScreenshotChange} className="input" disabled={loading} />
                        {sourceScreenshotFile && <span style={{ marginLeft: '10px', color: '#10b981' }}>✓ Selected: {sourceScreenshotFile.name}</span>}
                    </label>

                    <label className="label">Department: *
                        <select name="department" value={job.department} onChange={handleChange} className="input" disabled={loading}>
                            <option value="">Select Department</option>
                            {departments.map((dept) => (
                                <option key={dept._id} value={dept._id}>{dept.name}</option>
                            ))}
                        </select>
                    </label>

                    <button type="submit" className="submitButton" disabled={loading}>
                        {loading ? 'Submitting...' : 'Submit Job'}
                    </button>
                </form>
            )}
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
    }
};

export default AddJob;
