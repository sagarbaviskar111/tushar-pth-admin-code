const axios = require('axios');
const fs = require('fs');

async function extractHRData() {
    try {
        console.log("Fetching jobs from https://pharmatalenthub.in/api/jobs ...");
        
        let allJobs = [];
        let currentPage = 1;
        let totalPages = 1;

        // Fetch first page to get totalPages
        let response = await axios.get(`https://pharmatalenthub.in/api/jobs?page=${currentPage}`);
        if (response.data.totalPages) {
            totalPages = response.data.totalPages;
            allJobs = allJobs.concat(response.data.jobs);
            console.log(`Page 1 fetched. Total pages: ${totalPages}`);

            // Fetch remaining pages
            for (let i = 2; i <= totalPages; i++) {
                console.log(`Fetching page ${i}...`);
                let res = await axios.get(`https://pharmatalenthub.in/api/jobs?page=${i}`);
                if (res.data.jobs) {
                    allJobs = allJobs.concat(res.data.jobs);
                }
            }
        } else if (response.data.jobs) {
            allJobs = response.data.jobs;
        } else {
            allJobs = response.data;
        }

        if (!Array.isArray(allJobs)) {
            console.error("Expected an array of jobs, but got:", typeof allJobs);
            return;
        }

        console.log(`Found ${allJobs.length} total jobs across all pages. Extracting HR Data...`);

        let hrDatabase = [];

        allJobs.forEach(job => {
            let emailsToCapture = [];

            // 1. Check applicationLink / applylink
            const link = job.applicationLink || job.applylink || '';
            if (link.toLowerCase().includes('mailto:')) {
                const cleanEmail = link.replace(/mailto:/i, '').split('?')[0].trim();
                if (cleanEmail) emailsToCapture.push(cleanEmail);
            } else {
                const linkMatches = link.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi);
                if (linkMatches) emailsToCapture.push(...linkMatches);
            }

            // Also check hrEmail if backend already had this field
            if (job.hrEmail) {
                const match = job.hrEmail.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/i);
                if (match) emailsToCapture.push(match[0]);
            }

            emailsToCapture = [...new Set(emailsToCapture.map(e => e.toLowerCase()))];

            emailsToCapture.forEach(email => {
                const newEntry = {
                    hrName: job.hrName || 'Unknown',
                    hrEmail: email,
                    companyName: job.company || 'Unknown',
                    location: job.location || 'Unknown',
                    contactNumber: job.hrContact || 'Unknown'
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
        });

        console.log(`Extracted ${hrDatabase.length} unique HR contacts.`);

        const header = ["HR Name", "Email IDs", "Company Name", "Location", "Contact Number"];
        const rows = hrDatabase.map(hr => [
            `"${hr.hrName || 'Unknown'}"`,
            `"${hr.hrEmail || 'Unknown'}"`,
            `"${hr.companyName || 'Unknown'}"`,
            `"${hr.location || 'Unknown'}"`,
            `"${hr.contactNumber || 'Unknown'}"`
        ]);
        
        const csvContent = header.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");

        fs.writeFileSync('Past_HR_Database.csv', csvContent);
        console.log("Successfully created Past_HR_Database.csv with ALL pages.");

    } catch (err) {
        console.error("Error fetching jobs:", err.message);
    }
}

extractHRData();
