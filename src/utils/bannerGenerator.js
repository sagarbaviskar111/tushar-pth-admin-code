export const generateJobBanner = async (jobData, logoUrl, theme = 'theme1') => {
    return new Promise(async (resolve, reject) => {
        const canvas = document.createElement('canvas');
        canvas.width = 1200;
        canvas.height = 630;
        const ctx = canvas.getContext('2d');

        // Theme Definitions
        const themes = {
            theme1: { // Corporate Wave (Like ICON plc)
                bgLoadColor: '#0284c7',
                rightTint: 'rgba(2, 132, 199, 0.4)',
                headerBg: '#ffffff',
                titleColor: '#0f172a',
                accentColor: '#0284c7',
                pillBg: '#ffffff',
                pillText: '#334155',
                pillShadow: 'rgba(0,0,0,0.15)',
                contentBg: '#f8fafc',
                contentBorder: '#cbd5e1',
                contentText: '#475569',
                btnBg: '#f59e0b',
                footerBg: '#0f172a',
                footerText: '#cbd5e1',
                wave: true,
                diagonal: false
            },
            theme2: { // Dark Premium (Slate & Gold)
                bgLoadColor: '#0f172a',
                rightTint: 'rgba(15, 23, 42, 0.7)',
                headerBg: '#1e293b',
                titleColor: '#f8fafc',
                accentColor: '#fbbf24', // Amber/Gold
                pillBg: '#334155',
                pillText: '#f1f5f9',
                pillShadow: 'rgba(0,0,0,0.4)',
                contentBg: '#0f172a',
                contentBorder: '#fbbf24',
                contentText: '#cbd5e1',
                btnBg: '#fbbf24',
                footerBg: '#000000',
                footerText: '#fbbf24',
                wave: false,
                diagonal: false
            },
            theme3: { // Modern Teal Split
                bgLoadColor: '#0f766e',
                rightTint: 'rgba(15, 118, 110, 0.5)',
                headerBg: '#f0fdfa',
                titleColor: '#0f766e',
                accentColor: '#0d9488',
                pillBg: '#ffffff',
                pillText: '#134e4a',
                pillShadow: 'rgba(15, 118, 110, 0.2)',
                contentBg: '#ffffff',
                contentBorder: '#99f6e4',
                contentText: '#334155',
                btnBg: '#0f766e',
                footerBg: '#134e4a',
                footerText: '#ccfbf1',
                wave: false,
                diagonal: true
            }
        };

        const t = themes[theme] || themes.theme1;

        // 1. Load Background Image
        const loadBgImage = () => new Promise((res) => {
            const bgImage = new Image();
            bgImage.crossOrigin = 'Anonymous';
            bgImage.onload = () => res(bgImage);
            bgImage.onerror = () => res(null);
            const safeCompanyName = encodeURIComponent(jobData.company || 'Corporate');
            bgImage.src = `https://image.pollinations.ai/prompt/modern%20corporate%20office%20building%20exterior%20daylight%20for%20${safeCompanyName}?width=1200&height=630&nologo=true`;
        });

        const bgImg = await loadBgImage();
        
        if (bgImg) {
            ctx.drawImage(bgImg, 0, 0, 1200, 630);
            ctx.fillStyle = t.rightTint;
            ctx.fillRect(0, 0, 1200, 630);
        } else {
            ctx.fillStyle = t.bgLoadColor;
            ctx.fillRect(0, 0, 1200, 630);
        }

        // Base Left Background
        if (t.wave) {
            ctx.fillStyle = t.headerBg;
            ctx.beginPath();
            ctx.moveTo(0, 0); ctx.lineTo(750, 0);
            ctx.bezierCurveTo(650, 200, 800, 400, 650, 630);
            ctx.lineTo(0, 630); ctx.fill();
            ctx.strokeStyle = '#0ea5e9';
            ctx.lineWidth = 8;
            ctx.beginPath();
            ctx.moveTo(740, -10); ctx.bezierCurveTo(640, 200, 790, 400, 640, 640);
            ctx.stroke();
        } else if (t.diagonal) {
            ctx.fillStyle = t.headerBg;
            ctx.beginPath();
            ctx.moveTo(0, 0); ctx.lineTo(850, 0); ctx.lineTo(650, 630); ctx.lineTo(0, 630); ctx.fill();
            ctx.strokeStyle = t.accentColor;
            ctx.lineWidth = 15;
            ctx.beginPath();
            ctx.moveTo(850, 0); ctx.lineTo(650, 630); ctx.stroke();
        } else {
            // Half solid split for Dark theme
            ctx.fillStyle = t.headerBg;
            ctx.fillRect(0, 0, 700, 630);
            ctx.fillStyle = t.accentColor;
            ctx.fillRect(700, 0, 5, 630);
        }

        // 2. HEADER SECTION (Left Side)
        const companyName = jobData.company || 'Company Name';
        const positionName = jobData.positionName || 'Open Position';
        
        ctx.fillStyle = t.titleColor;
        ctx.font = 'bold 50px "Segoe UI", sans-serif';
        ctx.fillText(companyName, 50, 90);
        
        ctx.fillStyle = t.accentColor;
        ctx.font = 'bold 44px "Segoe UI", sans-serif';
        ctx.fillText('is Hiring!', 50, 145);

        ctx.fillStyle = t.titleColor;
        ctx.font = 'bold 56px "Segoe UI", sans-serif';
        const maxPosWidth = 600;
        const words = positionName.split(' ');
        let line = '';
        let startY = 220;
        for(let i = 0; i < words.length; i++) {
            const testLine = line + words[i] + ' ';
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxPosWidth && i > 0) {
                ctx.fillText(line, 50, startY);
                line = words[i] + ' ';
                startY += 65;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, 50, startY);

        // 3. MIDDLE STATS ROW
        const statsY = 320;
        ctx.shadowColor = t.pillShadow;
        ctx.shadowBlur = 15;
        ctx.shadowOffsetY = 5;
        ctx.fillStyle = t.pillBg;
        ctx.roundRect(40, statsY, 1120, 80, 40);
        ctx.fill();
        ctx.shadowColor = 'transparent';

        const statCols = [
            { icon: '💼', label: 'Position', val: positionName },
            { icon: '🏢', label: 'Organization', val: companyName },
            { icon: '🎓', label: 'Qualification', val: jobData.qualification },
            { icon: '⭐', label: 'Experience', val: jobData.experience },
            { icon: '📍', label: 'Location', val: jobData.location },
            { icon: '💰', label: 'Salary', val: jobData.salary }
        ];

        const colWidth = 1120 / 6;
        statCols.forEach((stat, index) => {
            const x = 50 + (index * colWidth);
            const y = statsY + 45;
            
            ctx.fillStyle = t.accentColor;
            ctx.font = '24px Arial';
            ctx.fillText(stat.icon, x + 10, y + 5);

            ctx.fillStyle = t.accentColor;
            ctx.font = 'bold 14px "Segoe UI", sans-serif';
            ctx.fillText(stat.label.toUpperCase(), x + 45, y - 10);

            ctx.fillStyle = t.pillText;
            ctx.font = 'bold 14px "Segoe UI", sans-serif';
            let displayVal = stat.val || 'N/A';
            if (displayVal.length > 20) displayVal = displayVal.substring(0, 18) + '..';
            ctx.fillText(displayVal, x + 45, y + 10);

            if (index < 5) {
                ctx.strokeStyle = t.contentBorder;
                ctx.lineWidth = 1;
                ctx.beginPath(); ctx.moveTo(x + colWidth - 10, statsY + 20); ctx.lineTo(x + colWidth - 10, statsY + 60); ctx.stroke();
            }
        });

        // 4. CONTENT AREA (Responsibilities, Skills, Apply Now)
        const contentY = 440;
        
        ctx.fillStyle = t.contentBg;
        ctx.strokeStyle = t.contentBorder;
        ctx.lineWidth = 1;
        ctx.roundRect(40, contentY, 350, 110, 10);
        ctx.fill(); ctx.stroke();

        ctx.fillStyle = t.titleColor;
        ctx.font = 'bold 16px "Segoe UI", sans-serif';
        ctx.fillText('KEY RESPONSIBILITIES', 55, contentY + 25);
        ctx.fillStyle = t.contentText;
        ctx.font = '14px "Segoe UI", sans-serif';
        const resps = Array.isArray(jobData.responsibilities) ? jobData.responsibilities : ['Manage documentation'];
        resps.slice(0, 3).forEach((r, idx) => {
            let text = r.length > 40 ? r.substring(0, 38) + '...' : r;
            ctx.fillText(`• ${text}`, 55, contentY + 50 + (idx * 22));
        });

        ctx.fillStyle = t.contentBg;
        ctx.roundRect(410, contentY, 350, 110, 10);
        ctx.fill(); ctx.stroke();

        ctx.fillStyle = t.titleColor;
        ctx.font = 'bold 16px "Segoe UI", sans-serif';
        ctx.fillText('KEY SKILLS', 425, contentY + 25);
        ctx.fillStyle = t.contentText;
        ctx.font = '14px "Segoe UI", sans-serif';
        const sks = Array.isArray(jobData.skills) ? jobData.skills : ['Communication'];
        sks.slice(0, 3).forEach((s, idx) => {
            let text = s.length > 40 ? s.substring(0, 38) + '...' : s;
            ctx.fillText(`• ${text}`, 425, contentY + 50 + (idx * 22));
        });

        // APPLY NOW Button
        const btnX = 820; const btnY = contentY + 20;
        ctx.fillStyle = t.btnBg;
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 15; ctx.shadowOffsetY = 5;
        ctx.roundRect(btnX, btnY, 300, 70, 35); ctx.fill();
        ctx.shadowColor = 'transparent';
        
        ctx.fillStyle = (theme === 'theme2') ? '#0f172a' : '#ffffff';
        ctx.font = 'bold 30px "Segoe UI", sans-serif';
        ctx.fillText('APPLY NOW ➔', btnX + 50, btnY + 45);

        // 5. FOOTER
        ctx.fillStyle = t.footerBg;
        ctx.fillRect(0, 580, 1200, 50);

        ctx.fillStyle = t.footerText;
        ctx.font = '14px "Segoe UI", sans-serif';
        ctx.fillText('🌐 Global Presence', 50, 610);
        ctx.fillText('🛡️ Quality Driven', 250, 610);
        ctx.fillText('👥 World-Class Team', 450, 610);
        
        ctx.font = 'bold 18px "Segoe UI", sans-serif';
        ctx.fillText('Find more pharma jobs at: www.pharmatalenthub.in', 700, 612);

        // Draw Logo if available
        const finishCanvas = () => {
            canvas.toBlob((blob) => {
                if (blob) { resolve(new File([blob], 'generated-banner.png', { type: 'image/png' })); } 
                else { reject(new Error('Canvas toBlob failed')); }
            }, 'image/png', 1.0);
        };

        if (logoUrl) {
            const logo = new Image();
            logo.crossOrigin = 'Anonymous';
            logo.onload = () => {
                ctx.shadowColor = 'rgba(0,0,0,0.2)';
                ctx.shadowBlur = 15;
                ctx.fillStyle = '#ffffff';
                ctx.beginPath(); ctx.arc(1090, 100, 80, 0, Math.PI * 2); ctx.fill();
                ctx.shadowColor = 'transparent';
                ctx.drawImage(logo, 1030, 40, 120, 120);
                finishCanvas();
            };
            logo.onerror = () => finishCanvas();
            logo.src = logoUrl;
        } else {
            finishCanvas();
        }
    });
};
