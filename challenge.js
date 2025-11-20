// challenge.js - Complete Version with Supabase Integration
// Part 1: Imports, Configuration, and Global State

import { supabase } from './supabaseClient.js';
import { setupNavUser } from './navAuth.js';

// ==========================================
// Global State Management
// ==========================================

let currentUser = null;
let allChallenges = {};
let userProgressDB = {}; // Progress from database
let currentCategory = '';

// Local progress tracking (for interactive challenges)
const HINT_PENALTY = 10;
const userProgress = {
    currentPoints: 0,
    solvedChallenges: new Set(),
    hintsUsed: {} // format: {challengeId_hintNumber: true}
};

// ==========================================
// Interactive Challenges Data Structure
// ==========================================

const interactiveChallenges = {
    sqlInjection: {
        id: 'sqlInjection',
        code: 'WEB001',
        title: 'SQL Injection Login Bypass',
        category: 'web',
        difficulty: 'easy',
        points: 100,
        flag: 'CTF{sql_1nj3ct10n_byp4ss}',
        isInteractive: true
    },
    cmdInjection: {
        id: 'cmdInjection',
        code: 'WEB002',
        title: 'Command Injection Shell',
        category: 'web',
        difficulty: 'medium',
        points: 250,
        flag: 'CTF{c0mm4nd_1nj3ct10n_pwn3d}',
        isInteractive: true
    },
    xssStealer: {
        id: 'xssStealer',
        code: 'WEB003',
        title: 'XSS Cookie Stealer',
        category: 'web',
        difficulty: 'hard',
        points: 350,
        flag: 'CTF{xss_c00k13_st34l3r}',
        isInteractive: true
    },
    jwtHack: {
        id: 'jwtHack',
        code: 'WEB004',
        title: 'JWT Token Manipulation',
        category: 'web',
        difficulty: 'expert',
        points: 400,
        flag: 'CTF{jwt_alg0r1thm_c0nfus10n}',
        isInteractive: true
    },
    multiCipher: {
        id: 'multiCipher',
        code: 'CRYPTO001',
        title: 'Multi-Layer Cipher',
        category: 'crypto',
        difficulty: 'easy',
        points: 100,
        flag: 'CTF{mult1_l4y3r_c1ph3r}',
        isInteractive: true
    },
    xorKnown: {
        id: 'xorKnown',
        code: 'CRYPTO002',
        title: 'XOR Brute Force',
        category: 'crypto',
        difficulty: 'medium',
        points: 300,
        flag: 'CTF{x0r_s1ngl3_byt3}',
        isInteractive: true
    },
    rsaWeak: {
        id: 'rsaWeak',
        code: 'CRYPTO003',
        title: 'RSA Small Exponent Attack',
        category: 'crypto',
        difficulty: 'hard',
        points: 350,
        flag: 'CTF{rs4_sm4ll_3xp0n3nt}',
        isInteractive: true
    },
    customCipher: {
        id: 'customCipher',
        code: 'CRYPTO004',
        title: 'Custom Cipher Breaking',
        category: 'crypto',
        difficulty: 'expert',
        points: 450,
        flag: 'CTF{cust0m_c1ph3r_br0k3n}',
        isInteractive: true
    },
    birthdayExif: {
        id: 'birthdayExif',
        code: 'FORENSICS001',
        title: 'Hidden Birthday Message',
        category: 'forensics',
        difficulty: 'easy',
        points: 100,
        flag: 'CTF{ex1f_h1dd3n_m3ss4g3}',
        isInteractive: true
    },
    geoLocation: {
        id: 'geoLocation',
        code: 'FORENSICS002',
        title: 'Geolocation Mystery',
        category: 'forensics',
        difficulty: 'medium',
        points: 250,
        flag: 'CTF{g30l0c4t10n_md5}',
        isInteractive: true
    },
    stegoFlag: {
        id: 'stegoFlag',
        code: 'FORENSICS003',
        title: 'Steganography Battlefield',
        category: 'forensics',
        difficulty: 'hard',
        points: 400,
        flag: 'CTF{st3g4n0gr4phy_m4st3r}',
        isInteractive: true
    },
    diskAnalysis: {
        id: 'diskAnalysis',
        code: 'FORENSICS004',
        title: 'Disk Analysis',
        category: 'forensics',
        difficulty: 'expert',
        points: 500,
        flag: 'CTF{d1sk_4n4lys1s_pr0}',
        isInteractive: true
    }
};

// ==========================================
// Challenge Data Structure (from main.js)
// ==========================================

const challengeData = {
    web: {
        title: '🌐︎ Web Security Challenges',
        challenges: [
            {
                name: 'SQL Injection Login Bypass',
                description: 'ระบบ login มีช่องโหว่ SQL Injection ที่ต้องใช้เทคนิคขั้นสูง bypass ด้วย comment และ logic manipulation',
                points: 100,
                difficulty: 'easy',
                solved: 1234,
                status: 'not-started',
                interactive: true,
                interactiveId: 'sqlInjection'
            },
            {
                name: 'Command Injection Shell',
                description: 'Web app ที่รัน system commands โดยไม่ filter input ให้หา flag ที่ซ่อนอยู่ในระบบไฟล์',
                points: 250,
                difficulty: 'medium',
                solved: 867,
                status: 'not-started',
                interactive: true,
                interactiveId: 'cmdInjection'
            },
            {
                name: 'XSS Cookie Stealer',
                description: 'หาช่องโหว่ XSS และสร้าง payload ที่ซับซ้อนเพื่อ bypass XSS filter และ steal admin session',
                points: 350,
                difficulty: 'hard',
                solved: 423,
                status: 'not-started',
                interactive: true,
                interactiveId: 'xssStealer'
            },
            {
                name: 'JWT Token Manipulation',
                description: 'แก้ไข JWT token โดยใช้ช่องโหว่ Algorithm Confusion เพื่อเข้าถึงข้อมูลของ admin',
                points: 400,
                difficulty: 'expert',
                solved: 189,
                status: 'not-started',
                interactive: true,
                interactiveId: 'jwtHack'
            }
        ]
    },
    crypto: {
        title: '🔐︎ Cryptography Challenges',
        challenges: [
            {
                name: 'Multi-Layer Cipher',
                description: 'ข้อความถูกเข้ารหัสด้วย Caesar, Base64, และ ROT13 ซ้อนกัน ต้องถอดรหัสทีละชั้น',
                points: 100,
                difficulty: 'easy',
                solved: 2145,
                status: 'not-started',
                interactive: true,
                interactiveId: 'multiCipher'
            },
            {
                name: 'XOR Brute Force',
                description: 'ข้อความถูกเข้ารหัสด้วย XOR single-byte key ให้ brute force หา key และถอดรหัส',
                points: 300,
                difficulty: 'medium',
                solved: 892,
                status: 'not-started',
                interactive: true,
                interactiveId: 'xorKnown'
            },
            {
                name: 'RSA Small Exponent Attack',
                description: 'RSA ที่ใช้ e=3 และมี 3 ciphertext ของข้อความเดียวกัน ใช้ Chinese Remainder Theorem โจมตี',
                points: 350,
                difficulty: 'hard',
                solved: 534,
                status: 'not-started',
                interactive: true,
                interactiveId: 'rsaWeak'
            },
            {
                name: 'Custom Cipher Breaking',
                description: 'วิเคราะห์และถอดรหัส custom encryption algorithm ที่มีจุดอ่อนในการ implement',
                points: 450,
                difficulty: 'expert',
                solved: 234,
                status: 'not-started',
                interactive: true,
                interactiveId: 'customCipher'
            }
        ]
    },
    forensics: {
        title: '🕵︎ Digital Forensics Challenges',
        challenges: [
            {
                name: 'Hidden Birthday Message',
                description: 'รูปภาพ Happy Birthday มีข้อมูลที่ซ่อนอยู่ใน EXIF metadata ให้ใช้เครื่องมือวิเคราะห์หา flag',
                points: 100,
                difficulty: 'easy',
                solved: 1432,
                status: 'not-started',
                interactive: true,
                interactiveId: 'birthdayExif'
            },
            {
                name: 'Geolocation Mystery',
                description: 'รูปถ่ายจากตึกมี GPS coordinates ใน metadata ให้หาตำแหน่งและแปลงเป็น MD5 hash',
                points: 250,
                difficulty: 'medium',
                solved: 856,
                status: 'not-started',
                interactive: true,
                interactiveId: 'geoLocation'
            },
            {
                name: 'Steganography Battlefield',
                description: 'รูปภาพธงขาวมีไฟล์ซ่อนอยู่ข้างใน ต้องใช้ binwalk extract แล้วถอดรหัส Base64',
                points: 400,
                difficulty: 'hard',
                solved: 543,
                status: 'not-started',
                interactive: true,
                interactiveId: 'stegoFlag'
            },
            {
                name: 'Disk Analysis',
                description: 'วิเคราะห์ disk image เพื่อกู้คืนไฟล์ที่ถูกลบและหา flag',
                points: 500,
                difficulty: 'expert',
                solved: 267,
                status: 'not-started',
                interactive: true,
                interactiveId: 'diskAnalysis'
            }
        ]
    }
};

// ==========================================
// Authentication Functions
// ==========================================

async function requireChallengeAuth() {
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
        const goLogin = confirm(
            'คุณยังไม่ได้เข้าสู่ระบบ\nต้องการไปหน้า Login เพื่อเริ่มเล่นโจทย์หรือไม่?'
        );
        if (goLogin) {
            window.location.href = 'login.html';
        }
        return null;
    }

    return data.user;
}

async function ensureUserRow() {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
        return;
    }

    const authUser = authData.user;
    const email = authUser.email;

    const { data: existing, error: selectError } = await supabase
        .from('users')
        .select('user_id, username, email')
        .eq('email', email)
        .maybeSingle();

    if (existing) {
        currentUser = existing;
        return;
    }

    const username =
        authUser.user_metadata?.username ||
        email.split('@')[0];

    const displayName =
        authUser.user_metadata?.full_name ||
        authUser.user_metadata?.name ||
        username;

    const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
            username,
            email,
            display_name: displayName,
            score: 0,
            xp: 0,
            role: 'player',
            status: 'active',
            google_id: authUser.id,
            oauth_provider: authUser.app_metadata?.provider || 'email',
        })
        .select()
        .single();

    if (!insertError && newUser) {
        currentUser = newUser;
    }
}
// Part 2: Load Challenges and Hint System

// ==========================================
// Load Challenges (Database + Interactive)
// ==========================================

async function loadChallenges() {
    try {
        // Load from database
        const { data: dbChallenges, error } = await supabase
            .from('challenges')
            .select('*')
            .eq('is_active', true)
            .eq('visibility', 'public')
            .order('category', { ascending: true })
            .order('difficulty', { ascending: true });

        if (error) {
            console.error('Error loading challenges:', error);
        }

        // Group by category
        allChallenges = {};
        
        if (dbChallenges && dbChallenges.length > 0) {
            dbChallenges.forEach(challenge => {
                const category = challenge.category;
                if (!allChallenges[category]) {
                    allChallenges[category] = [];
                }
                
                // Check if has interactive UI
                const interactiveId = getInteractiveId(challenge.code);
                
                allChallenges[category].push({
                    ...challenge,
                    isDatabase: true,
                    interactiveId: interactiveId,
                    hasInteractive: !!interactiveId
                });
            });
        }

        // Load user progress
        if (currentUser) {
            await loadUserProgress();
        }

        console.log('Loaded challenges:', allChallenges);
    } catch (error) {
        console.error('Error loading challenges:', error);
    }
}

function getInteractiveId(code) {
    // Map challenge code to interactiveId
    const mapping = {
        'WEB001': 'sqlInjection',
        'WEB002': 'cmdInjection',
        'WEB003': 'xssStealer',
        'WEB004': 'jwtHack',
        'CRYPTO001': 'multiCipher',
        'CRYPTO002': 'xorKnown',
        'CRYPTO003': 'rsaWeak',
        'CRYPTO004': 'customCipher',
        'FORENSICS001': 'birthdayExif',
        'FORENSICS002': 'geoLocation',
        'FORENSICS003': 'stegoFlag',
        'FORENSICS004': 'diskAnalysis'
    };
    return mapping[code] || null;
}

async function loadUserProgress() {
    if (!currentUser) return;

    try {
        const { data, error } = await supabase
            .from('user_progress')
            .select('*')
            .eq('user_id', currentUser.user_id);

        if (error) {
            console.error('Error loading user progress:', error);
            return;
        }

        userProgressDB = {};
        if (data) {
            data.forEach(progress => {
                userProgressDB[progress.challenge_id] = progress;
            });
        }
    } catch (error) {
        console.error('Error loading user progress:', error);
    }
}

// ==========================================
// Hint System with Confirmation (from main.js)
// ==========================================

function toggleHint(hintId) {
    const hint = document.getElementById(hintId);
    
    if (!hint) return;
    
    // ถ้า hint เปิดอยู่แล้ว ให้ปิด
    if (hint.style.display === 'block') {
        hint.style.display = 'none';
        return;
    }
    
    // ตรวจสอบว่าใช้ hint นี้ไปแล้วหรือยัง
    if (userProgress.hintsUsed[hintId]) {
        // เคยใช้แล้ว เปิดได้เลยไม่ต้องยืนยัน
        hint.style.display = 'block';
        return;
    }
    
    // หา challenge type และ hint number จาก hintId
    // format: {challengeType}hint{number} เช่น "sqlhint1", "cryptohint2"
    const matches = hintId.match(/^(.+?)hint(\d+)$/);
    if (!matches) {
        hint.style.display = 'block';
        return;
    }
    
    const challengeType = matches[1];
    const hintNumber = parseInt(matches[2]);
    
    // นับว่าใช้ hint ไปกี่ข้อแล้วสำหรับ challenge นี้
    const usedHintsCount = Object.keys(userProgress.hintsUsed)
        .filter(key => key.startsWith(challengeType + 'hint'))
        .length;
    
    // ถ้าเป็น hint ข้อแรก ไม่ต้องหักคะแนน
    if (usedHintsCount === 0) {
        showHintConfirmation(hintId, 0, () => {
            hint.style.display = 'block';
            userProgress.hintsUsed[hintId] = true;
            updatePointsDisplay();
        });
    } else {
        // hint ข้อถัดไป หักคะแนน 10
        showHintConfirmation(hintId, HINT_PENALTY, () => {
            hint.style.display = 'block';
            userProgress.hintsUsed[hintId] = true;
            updatePointsDisplay();
        });
    }
}

function showHintConfirmation(hintId, pointDeduction, onConfirm) {
    const confirmDialog = document.createElement('div');
    confirmDialog.className = 'confirm-overlay';
    
    const hintNumber = hintId.match(/hint(\d+)$/)?.[1] || '?';
    
    if (pointDeduction === 0) {
        confirmDialog.innerHTML = `
            <div class="confirm-dialog">
                <h3>💡 เปิด Hint ${hintNumber}</h3>
                <p>นี่เป็น hint ข้อแรก <strong style="color: var(--success);">ไม่มีการหักคะแนน</strong></p>
                <p style="color: var(--gray); font-size: 0.9rem; margin-top: 0.5rem;">
                    ⚠️ Hint ข้อถัดไปจะหักคะแนน ${HINT_PENALTY} คะแนนต่อครั้ง
                </p>
                <div class="confirm-buttons">
                    <button class="btn-cancel" onclick="closeHintConfirmDialog()">
                        ยกเลิก
                    </button>
                    <button class="btn-confirm" onclick="confirmHint()">
                        เปิด Hint
                    </button>
                </div>
            </div>
        `;
    } else {
        confirmDialog.innerHTML = `
            <div class="confirm-dialog">
                <h3>⚠️ ยืนยันการใช้ Hint ${hintNumber}</h3>
                <p>การเปิด hint นี้จะหัก <strong style="color: var(--danger);">${pointDeduction} คะแนน</strong></p>
                <p style="color: var(--warning); font-size: 0.9rem; margin-top: 0.5rem;">
                    คะแนนที่หักจะถูกนำออกจากคะแนนรวมเมื่อส่งคำตอบ
                </p>
                <div class="confirm-buttons">
                    <button class="btn-cancel" onclick="closeHintConfirmDialog()">
                        ยกเลิก
                    </button>
                    <button class="btn-confirm" onclick="confirmHint()">
                        ยืนยัน (-${pointDeduction} คะแนน)
                    </button>
                </div>
            </div>
        `;
    }
    
    document.body.appendChild(confirmDialog);
    
    // เก็บ callback function
    confirmDialog.dataset.onConfirm = 'hintConfirmCallback';
    window.hintConfirmCallback = onConfirm;
    
    // Animate in
    setTimeout(() => confirmDialog.classList.add('show'), 10);
}

function closeHintConfirmDialog() {
    const dialog = document.querySelector('.confirm-overlay');
    if (dialog) {
        dialog.classList.remove('show');
        setTimeout(() => {
            dialog.remove();
            delete window.hintConfirmCallback;
        }, 300);
    }
}

function confirmHint() {
    if (window.hintConfirmCallback) {
        window.hintConfirmCallback();
        delete window.hintConfirmCallback;
    }
    closeHintConfirmDialog();
}

function updatePointsDisplay() {
    // อัพเดท display ของ current points ในทุก challenge
    const pointsElements = document.querySelectorAll('.current-points');
    pointsElements.forEach(el => {
        const challengeType = el.closest('[id*="hint"]')?.id.match(/^(.+?)hint/)?.[1];
        if (challengeType) {
            const basePoints = getBaseChallengePoints(challengeType);
            const hintsUsed = Object.keys(userProgress.hintsUsed)
                .filter(key => key.startsWith(challengeType + 'hint'))
                .length;
            // hint ข้อแรกไม่หัก, ข้อถัดไปหัก 10 ต่อข้อ
            const deduction = Math.max(0, (hintsUsed - 1) * HINT_PENALTY);
            const currentPoints = Math.max(0, basePoints - deduction);
            el.textContent = currentPoints;
        }
    });
}

function getBaseChallengePoints(challengeType) {
    // คะแนนฐานของแต่ละ challenge (from main.js)
    const pointsMap = {
        'sql': 100,
        'cmd': 250,
        'xss': 350,
        'jwt': 400,
        'multi': 100,
        'xor': 300,
        'rsa': 350,
        'custom': 450,
        'birthday': 100,
        'geo': 250,
        'stego': 400,
        'disk': 500,
        'packet': 150,
        'dns': 300,
        'arp': 400,
        'ssl': 550,
        'asm': 150,
        'crackme': 350,
        'obfuscated': 450,
        'malware': 550,
        'apk': 150,
        'root': 300,
        'sslPin': 400,
        'native': 500
    };
    return pointsMap[challengeType] || 100;
}

// ==========================================
// Check Flag Function (from main.js)
// ==========================================

function checkFlag(challengeType, correctFlag, basePoints = 100) {
    const inputId = challengeType + 'Flag';
    const successId = challengeType + 'Success';
    const errorId = challengeType + 'Error';
    
    const userFlag = document.getElementById(inputId)?.value.trim();
    const successMsg = document.getElementById(successId);
    const errorMsg = document.getElementById(errorId);
    
    if (!userFlag) {
        if (errorMsg) {
            errorMsg.style.display = 'block';
            errorMsg.textContent = '⚠️ กรุณาใส่ flag';
            setTimeout(() => errorMsg.style.display = 'none', 3000);
        }
        return;
    }
    
    if (userFlag === correctFlag) {
        // คำนวณคะแนนหลังหัก hint
        const hintsUsedCount = Object.keys(userProgress.hintsUsed)
            .filter(key => key.startsWith(challengeType + 'hint'))
            .length;
        // hint ข้อแรกไม่หัก
        const deduction = Math.max(0, (hintsUsedCount - 1) * HINT_PENALTY);
        const finalPoints = Math.max(0, basePoints - deduction);
        
        userProgress.currentPoints += finalPoints;
        userProgress.solvedChallenges.add(challengeType);
        
        if (successMsg) {
            successMsg.style.display = 'block';
            if (hintsUsedCount > 0) {
                successMsg.innerHTML = `🎉 ถูกต้อง! +${finalPoints} คะแนน<br>
                    <small style="color: var(--gray);">(คะแนนเต็ม: ${basePoints}, ใช้ hint: ${hintsUsedCount} ข้อ, หัก: ${deduction} คะแนน)</small>`;
            } else {
                successMsg.innerHTML = `🎉 ถูกต้อง! +${finalPoints} คะแนน`;
            }
        }
        if (errorMsg) errorMsg.style.display = 'none';
        
        showNotification(`Challenge completed! +${finalPoints} points`, 'success');
        updatePointsDisplay();
    } else {
        if (successMsg) successMsg.style.display = 'none';
        if (errorMsg) {
            errorMsg.style.display = 'block';
            setTimeout(() => errorMsg.style.display = 'none', 3000);
        }
    }
}

// ==========================================
// Notification System (from main.js)
// ==========================================

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    const colors = {
        success: 'linear-gradient(135deg, #00C851 0%, #007E33 100%)',
        error: 'linear-gradient(135deg, #ff4444 0%, #cc0000 100%)',
        info: 'linear-gradient(135deg, #33b5e5 0%, #0099cc 100%)',
        warning: 'linear-gradient(135deg, #ffbb33 0%, #ff8800 100%)'
    };
    
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 15px 25px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        opacity: 0;
        transform: translateY(20px);
        transition: all 0.3s ease;
        background: ${colors[type] || colors.info};
        max-width: 400px;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
    }, 100);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        setTimeout(() => {
            if (document.body.contains(toast)) {
                document.body.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// ==========================================
// Particles Effect (from main.js)
// ==========================================

function createParticles() {
    const particlesContainer = document.getElementById('particles');
    if (!particlesContainer) return;
    
    // Clear existing particles
    particlesContainer.innerHTML = '';
    
    for (let i = 0; i < 100; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 15 + 's';
        particle.style.animationDuration = (Math.random() * 10 + 10) + 's';
        particlesContainer.appendChild(particle);
    }
}
// Part 3: Challenge List Modal and Open Challenge Functions

// ==========================================
// Open Challenge List Modal
// ==========================================

async function openChallengeList(category) {
    // Check if user is logged in
    const authUser = await requireChallengeAuth();
    if (!authUser) return;
    
    currentCategory = category;
    
    const challenges = allChallenges[category] || [];
    
    if (challenges.length === 0) {
        alert('ยังไม่มีโจทย์ในหมวดนี้');
        return;
    }

    // Set modal title
    const modalTitle = document.getElementById('modalTitle');
    const categoryNames = {
        web: '🌐 Web Security Challenges',
        crypto: '🔐 Cryptography Challenges',
        forensics: '🕵️ Digital Forensics Challenges',
        network: '🖧 Network Security Challenges',
        reverse: '⚙️ Reverse Engineering Challenges',
        mobile: '📱 Mobile Security Challenges'
    };
    
    if (modalTitle) {
        modalTitle.textContent = categoryNames[category] || category.toUpperCase() + ' Challenges';
    }

    // Calculate progress
    const solvedCount = challenges.filter(c => {
        const progress = userProgressDB[c.challenge_id];
        return progress?.is_solved;
    }).length;
    
    const progressPercent = challenges.length > 0 
        ? Math.round((solvedCount / challenges.length) * 100) 
        : 0;

    // Update progress bar
    const progressText = document.getElementById('progressText');
    const progressFill = document.getElementById('progressFill');
    
    if (progressText) {
        progressText.textContent = `${solvedCount} of ${challenges.length} completed (${progressPercent}%)`;
    }
    
    if (progressFill) {
        progressFill.style.width = progressPercent + '%';
    }

    // Render challenge list
    const challengeList = document.getElementById('challengeList');
    if (challengeList) {
        challengeList.innerHTML = challenges.map(challenge => {
            const progress = userProgressDB[challenge.challenge_id];
            const isSolved = progress?.is_solved || false;
            const attempts = progress?.attempts_count || 0;

            return `
                <div class="challenge-item ${isSolved ? 'solved' : ''}" onclick="openChallenge('${challenge.challenge_id}', ${challenge.hasInteractive}, '${challenge.interactiveId || ''}')">
                    <div class="challenge-header">
                        <div class="challenge-title-section">
                            <h3 class="challenge-title">${challenge.title}</h3>
                            <span class="difficulty-badge difficulty-${challenge.difficulty}">${challenge.difficulty}</span>
                            ${challenge.hasInteractive ? '<span class="interactive-badge">🎮 Interactive</span>' : ''}
                        </div>
                        <div class="challenge-points">
                            <span class="points-value">${challenge.score_base}</span>
                            <span class="points-label">pts</span>
                        </div>
                    </div>
                    <p class="challenge-description">${challenge.description}</p>
                    <div class="challenge-footer">
                        ${isSolved ? '<span class="solved-badge">✓ Solved</span>' : ''}
                        ${attempts > 0 && !isSolved ? `<span class="attempts-badge">${attempts} attempts</span>` : ''}
                        <button class="challenge-btn ${isSolved ? 'solved' : ''}" onclick="event.stopPropagation(); openChallenge('${challenge.challenge_id}', ${challenge.hasInteractive}, '${challenge.interactiveId || ''}')">
                            ${isSolved ? 'View' : 'Start Challenge'}
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Show modal
    const modal = document.getElementById('challengeModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

// ==========================================
// Open Individual Challenge
// ==========================================

async function openChallenge(challengeId, hasInteractive, interactiveId) {
    const authUser = await requireChallengeAuth();
    if (!authUser) return;

    closeModal();

    if (hasInteractive && interactiveId && interactiveChallenges[interactiveId]) {
        // Open interactive challenge
        openInteractiveChallenge(interactiveId);
    } else {
        // Open regular challenge modal
        openRegularChallenge(challengeId);
    }
}

async function openRegularChallenge(challengeId) {
    // Find challenge
    let challenge = null;
    for (const category in allChallenges) {
        challenge = allChallenges[category].find(c => c.challenge_id == challengeId);
        if (challenge) break;
    }

    if (!challenge) {
        alert('ไม่พบโจทย์นี้');
        return;
    }

    // Load hints from database
    const { data: hints } = await supabase
        .from('hints')
        .select('*')
        .eq('challenge_id', challengeId)
        .order('order_index', { ascending: true });

    const { data: unlockedHints } = await supabase
        .from('user_hints')
        .select('hint_id')
        .eq('user_id', currentUser.user_id)
        .eq('challenge_id', challengeId);

    const unlockedHintIds = new Set(unlockedHints?.map(h => h.hint_id) || []);
    const progress = userProgressDB[challengeId];
    const isSolved = progress?.is_solved || false;

    const interactiveContent = document.getElementById('interactiveContent');
    if (interactiveContent) {
        interactiveContent.innerHTML = `
            <div class="challenge-detail">
                <div class="challenge-detail-header">
                    <h2>${challenge.title}</h2>
                    <span class="difficulty-badge difficulty-${challenge.difficulty}">${challenge.difficulty}</span>
                </div>
                
                <div class="challenge-info-grid">
                    <div class="info-item"><strong>Category:</strong> ${challenge.category}</div>
                    <div class="info-item"><strong>Points:</strong> ${challenge.score_base}</div>
                    ${challenge.challenge_url ? `<div class="info-item"><strong>URL:</strong> <a href="${challenge.challenge_url}" target="_blank">${challenge.challenge_url}</a></div>` : ''}
                </div>
                
                <div class="challenge-description-box">
                    <h3>📋 Description</h3>
                    <p>${challenge.description}</p>
                </div>

                ${hints && hints.length > 0 ? `
                <div class="hints-section">
                    <h3>💡 Hints</h3>
                    ${hints.map(hint => `
                        <div class="hint-item" id="hint-${hint.hint_id}">
                            <div class="hint-header">
                                <span class="hint-name">${hint.name}</span>
                                <span class="hint-cost">-${hint.cost} pts</span>
                            </div>
                            ${unlockedHintIds.has(hint.hint_id) ? `
                                <div class="hint-content unlocked"><p>${hint.text}</p></div>
                            ` : `
                                <button class="hint-unlock-btn" onclick="unlockHint(${hint.hint_id}, ${challengeId}, ${hint.cost})">🔓 Unlock Hint</button>
                            `}
                        </div>
                    `).join('')}
                </div>
                ` : ''}

                <div class="flag-submission-box">
                    <h3>🚩 Submit Flag</h3>
                    ${challenge.flag_format ? `<p class="flag-format">Format: <code>${challenge.flag_format}</code></p>` : ''}
                    <div class="flag-input-group">
                        <input type="text" id="flagInput-${challengeId}" placeholder="Enter flag here..." ${isSolved ? 'disabled' : ''}>
                        <button onclick="submitFlag('${challengeId}')" class="submit-flag-btn" ${isSolved ? 'disabled' : ''}>
                            ${isSolved ? '✓ Solved' : '🚀 Submit'}
                        </button>
                    </div>
                    <div id="flagResult-${challengeId}" class="flag-result"></div>
                </div>
            </div>
        `;
    }

    const interactiveModal = document.getElementById('interactiveModal');
    if (interactiveModal) {
        interactiveModal.style.display = 'flex';
    }
}

// ==========================================
// Open Interactive Challenge
// ==========================================

function openInteractiveChallenge(interactiveId) {
    const challenge = interactiveChallenges[interactiveId];
    if (!challenge) return;

    const interactiveContent = document.getElementById('interactiveContent');
    if (!interactiveContent) return;

    // Render based on challenge type
    switch(interactiveId) {
        case 'sqlInjection':
            interactiveContent.innerHTML = renderSQLInjection();
            break;
        case 'cmdInjection':
            interactiveContent.innerHTML = renderCmdInjection();
            break;
        case 'xssStealer':
            interactiveContent.innerHTML = renderXSSStealer();
            break;
        case 'jwtHack':
            interactiveContent.innerHTML = renderJWTHack();
            break;
        case 'multiCipher':
            interactiveContent.innerHTML = renderMultiCipher();
            break;
        case 'xorKnown':
            interactiveContent.innerHTML = renderXORKnown();
            break;
        case 'rsaWeak':
            interactiveContent.innerHTML = renderRSAWeak();
            break;
        case 'customCipher':
            interactiveContent.innerHTML = renderCustomCipher();
            break;
        case 'birthdayExif':
            interactiveContent.innerHTML = renderBirthdayExif();
            break;
        case 'geoLocation':
            interactiveContent.innerHTML = renderGeoLocation();
            break;
        case 'stegoFlag':
            interactiveContent.innerHTML = renderStegoFlag();
            break;
        case 'diskAnalysis':
            interactiveContent.innerHTML = renderDiskAnalysis();
            break;
        default:
            interactiveContent.innerHTML = '<p>Interactive UI not available</p>';
    }

    const interactiveModal = document.getElementById('interactiveModal');
    if (interactiveModal) {
        interactiveModal.style.display = 'flex';
    }
}

// ==========================================
// Modal Control Functions
// ==========================================

function closeModal() {
    const modal = document.getElementById('challengeModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function confirmBackToCategory() {
    const interactiveModal = document.getElementById('interactiveModal');
    if (interactiveModal) {
        interactiveModal.style.display = 'none';
    }
    
    if (currentCategory) {
        openChallengeList(currentCategory);
    }
}

// ==========================================
// Submit Flag to Database
// ==========================================

async function submitFlag(challengeId) {
    if (!currentUser) {
        alert('กรุณาเข้าสู่ระบบก่อน');
        return;
    }

    const flagInput = document.getElementById(`flagInput-${challengeId}`);
    const flagResult = document.getElementById(`flagResult-${challengeId}`);
    
    if (!flagInput || !flagResult) return;

    const submittedFlag = flagInput.value.trim();

    if (!submittedFlag) {
        flagResult.innerHTML = '<p class="error">❌ กรุณากรอก flag</p>';
        return;
    }

    // Find challenge
    let challenge = null;
    for (const category in allChallenges) {
        challenge = allChallenges[category].find(c => c.challenge_id == challengeId);
        if (challenge) break;
    }

    if (!challenge) return;

    const isCorrect = submittedFlag === challenge.flag;

    // Count hints used from database
    const { count } = await supabase
        .from('user_hints')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', currentUser.user_id)
        .eq('challenge_id', challengeId);

    const hintsUsed = count || 0;
    const pointsEarned = isCorrect ? Math.max(0, challenge.score_base - (hintsUsed * 10)) : 0;

    try {
        // Insert submission
        const { error } = await supabase
            .from('submissions')
            .insert({
                user_id: currentUser.user_id,
                challenge_id: challengeId,
                flag_submitted: submittedFlag,
                is_correct: isCorrect,
                points: pointsEarned,
                hints_used: hintsUsed,
            });

        if (error) {
            console.error('Error submitting flag:', error);
            flagResult.innerHTML = '<p class="error">❌ เกิดข้อผิดพลาดในการส่ง flag</p>';
            return;
        }

        if (isCorrect) {
            flagResult.innerHTML = `
                <p class="success">
                    ✅ ถูกต้อง! คุณได้รับ ${pointsEarned} คะแนน
                    ${hintsUsed > 0 ? `<br><small>ใช้ hint ${hintsUsed} ครั้ง (หัก ${hintsUsed * 10} คะแนน)</small>` : ''}
                </p>
            `;
            flagInput.disabled = true;
            
            await loadUserProgress();
            await loadChallenges();
            
            showToast(`🎉 ยินดีด้วย! คุณทำโจทย์ "${challenge.title}" สำเร็จ`, 'success');
            createConfetti();
            
            // Auto close after 3 seconds
            setTimeout(() => {
                confirmBackToCategory();
            }, 3000);
        } else {
            flagResult.innerHTML = '<p class="error">❌ Flag ไม่ถูกต้อง ลองใหม่อีกครั้ง</p>';
        }
    } catch (error) {
        console.error('Error submitting flag:', error);
        flagResult.innerHTML = '<p class="error">❌ เกิดข้อผิดพลาดในการส่ง flag</p>';
    }
}

// ==========================================
// Unlock Hint (Database)
// ==========================================

async function unlockHint(hintId, challengeId, cost) {
    if (!currentUser) {
        alert('กรุณาเข้าสู่ระบบก่อน');
        return;
    }

    const confirmUnlock = confirm(
        `คุณต้องการใช้ hint นี้หรือไม่?\nจะถูกหัก ${cost} คะแนน`
    );

    if (!confirmUnlock) return;

    try {
        const { error } = await supabase
            .from('user_hints')
            .insert({
                user_id: currentUser.user_id,
                hint_id: hintId,
                challenge_id: challengeId,
            });

        if (error) {
            console.error('Error unlocking hint:', error);
            
            // Check if hint already unlocked
            if (error.code === '23505') {
                alert('คุณปลดล็อก hint นี้แล้ว');
            } else {
                alert('ไม่สามารถปลดล็อก hint ได้: ' + error.message);
            }
            return;
        }

        await openRegularChallenge(challengeId);
        showToast('ปลดล็อก hint สำเร็จ!', 'success');
    } catch (error) {
        console.error('Error unlocking hint:', error);
        alert('เกิดข้อผิดพลาดในการปลดล็อก hint');
    }
}

// ==========================================
// Submit Interactive Flag
// ==========================================

window.submitInteractiveFlag = function(challengeId, inputId, resultId) {
    const challenge = interactiveChallenges[challengeId];
    if (!challenge) return;

    const flagInput = document.getElementById(inputId);
    const resultDiv = document.getElementById(resultId);
    
    if (!flagInput || !resultDiv) return;

    const submittedFlag = flagInput.value.trim();
    
    if (!submittedFlag) {
        resultDiv.innerHTML = '<p class="error">❌ กรุณากรอก flag</p>';
        return;
    }
    
    const isCorrect = submittedFlag === challenge.flag;

    if (isCorrect) {
        // Count hints used for this challenge
        const challengeHints = Object.keys(userProgress.hintsUsed)
            .filter(key => key.startsWith(challengeId.toLowerCase()) || 
                          key.startsWith(challenge.category.toLowerCase()));
        
        const hintsUsed = Math.max(0, challengeHints.length - 1); // First hint is free
        const pointsEarned = Math.max(0, challenge.points - (hintsUsed * HINT_PENALTY));
        
        resultDiv.innerHTML = `
            <p class="success">
                ✅ ถูกต้อง! 
                ${hintsUsed > 0 ? `<br><small>คะแนนที่ได้: ${pointsEarned}/${challenge.points} (ใช้ hint ${hintsUsed} ครั้ง)</small>` : `<br><small>คะแนนเต็ม: ${pointsEarned}</small>`}
                <br><small style="color: #888;">(Interactive demo - คะแนนจะไม่ถูกบันทึกในระบบ)</small>
            </p>
        `;
        
        flagInput.disabled = true;
        
        // Mark as solved locally
        userProgress.solvedChallenges.add(challengeId);
        userProgress.currentPoints += pointsEarned;
        
        showToast(`🎉 ยินดีด้วย! คุณทำโจทย์ "${challenge.title}" สำเร็จ`, 'success');
        createConfetti();
    } else {
        resultDiv.innerHTML = '<p class="error">❌ Flag ไม่ถูกต้อง ลองใหม่อีกครั้ง</p>';
        showToast('Flag ไม่ถูกต้อง ลองอีกครั้ง', 'error');
    }
};

// ==========================================
// Confetti Effect
// ==========================================

function createConfetti() {
    const colors = ['#00FF88', '#00D9FF', '#FF00FF', '#FFD700', '#FF6B6B'];
    const confettiCount = 50;
    
    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.style.cssText = `
            position: fixed;
            width: 10px;
            height: 10px;
            background: ${colors[Math.floor(Math.random() * colors.length)]};
            top: -10px;
            left: ${Math.random() * 100}vw;
            opacity: 1;
            transform: rotate(${Math.random() * 360}deg);
            pointer-events: none;
            z-index: 10000;
            animation: confettiFall ${2 + Math.random() * 2}s linear forwards;
        `;
        
        document.body.appendChild(confetti);
        
        setTimeout(() => {
            if (document.body.contains(confetti)) {
                document.body.removeChild(confetti);
            }
        }, 4000);
    }
}

// Add confetti animation
const style = document.createElement('style');
style.textContent = `
    @keyframes confettiFall {
        to {
            top: 100vh;
            opacity: 0;
            transform: translateX(${Math.random() * 200 - 100}px) rotate(${Math.random() * 720}deg);
        }
    }
`;
document.head.appendChild(style);
// Part 4: Interactive Challenge UI Rendering - Part 1

// ==========================================
// Render SQL Injection Challenge
// ==========================================

function renderSQLInjection() {
    return `
        <div class="challenge-container">
            <h2>🌐 SQL Injection Login Bypass</h2>
            <p>ระบบ login มีช่องโหว่ SQL Injection ลอง bypass เข้าสู่ระบบโดยไม่ต้องรู้รหัสผ่าน</p>
            
            <div class="interactive-box">
                <h3>Login Form</h3>
                <div class="login-simulator">
                    <input type="text" id="sqlUsername" placeholder="Username" class="sim-input">
                    <input type="password" id="sqlPassword" placeholder="Password" class="sim-input">
                    <button onclick="checkSQLLogin()" class="sim-button">Login</button>
                    <div id="sqlResult" class="result-box"></div>
                </div>
                
                <div class="code-display">
                    <h4>Backend SQL Query:</h4>
                    <code id="sqlQuery">SELECT * FROM users WHERE username = '' AND password = ''</code>
                </div>
            </div>

            <div class="hints-section">
                <div class="hint-item" id="sqlhint1">
                    <button onclick="toggleHint('sqlhint1')" class="hint-btn">💡 Hint 1 (ฟรี)</button>
                    <div class="hint-content" style="display: none;">
                        ลอง comment ส่วนท้ายของ SQL query ด้วย -- หรือ #
                    </div>
                </div>
                <div class="hint-item" id="sqlhint2">
                    <button onclick="toggleHint('sqlhint2')" class="hint-btn">💡 Hint 2 (-10 pts)</button>
                    <div class="hint-content" style="display: none;">
                        ใช้ ' OR '1'='1 เพื่อทำให้ WHERE condition เป็นจริงเสมอ
                    </div>
                </div>
                <div class="hint-item" id="sqlhint3">
                    <button onclick="toggleHint('sqlhint3')" class="hint-btn">💡 Hint 3 (-10 pts)</button>
                    <div class="hint-content" style="display: none;">
                        ลอง: admin' OR '1'='1'-- หรือ admin'#
                    </div>
                </div>
            </div>

            <div class="flag-submission">
                <h3>🚩 Submit Flag</h3>
                <input type="text" id="sqlFlag" placeholder="CTF{...}" class="flag-input">
                <button onclick="submitInteractiveFlag('sqlInjection', 'sqlFlag', 'sqlFlagResult')" class="submit-btn">Submit Flag</button>
                <div id="sqlFlagResult" class="flag-result"></div>
            </div>
        </div>
    `;
}

// ==========================================
// Render Command Injection Challenge
// ==========================================

function renderCmdInjection() {
    return `
        <div class="challenge-container">
            <h2>💻 Command Injection Shell</h2>
            <p>Web app ที่รัน system commands ให้หา flag ที่ซ่อนอยู่ในระบบไฟล์</p>
            
            <div class="interactive-box">
                <h3>Ping Utility</h3>
                <div class="terminal-simulator">
                    <input type="text" id="cmdInput" placeholder="Enter IP address to ping" class="terminal-input">
                    <button onclick="executePing()" class="terminal-button">Execute Ping</button>
                    <div id="cmdOutput" class="terminal-output">
                        <div class="output-line">$ Waiting for command...</div>
                    </div>
                </div>
            </div>

            <div class="hints-section">
                <div class="hint-item" id="cmdhint1">
                    <button onclick="toggleHint('cmdhint1')" class="hint-btn">💡 Hint 1 (ฟรี)</button>
                    <div class="hint-content" style="display: none;">
                        ใช้ ; หรือ && เพื่อรัน command ต่อเนื่อง
                    </div>
                </div>
                <div class="hint-item" id="cmdhint2">
                    <button onclick="toggleHint('cmdhint2')" class="hint-btn">💡 Hint 2 (-10 pts)</button>
                    <div class="hint-content" style="display: none;">
                        ลอง: 127.0.0.1; ls หรือ 127.0.0.1 && dir
                    </div>
                </div>
                <div class="hint-item" id="cmdhint3">
                    <button onclick="toggleHint('cmdhint3')" class="hint-btn">💡 Hint 3 (-10 pts)</button>
                    <div class="hint-content" style="display: none;">
                        flag อยู่ในไฟล์ secret.txt ใช้ cat หรือ type: 127.0.0.1; cat secret.txt
                    </div>
                </div>
            </div>

            <div class="flag-submission">
                <h3>🚩 Submit Flag</h3>
                <input type="text" id="cmdFlag" placeholder="CTF{...}" class="flag-input">
                <button onclick="submitInteractiveFlag('cmdInjection', 'cmdFlag', 'cmdFlagResult')" class="submit-btn">Submit Flag</button>
                <div id="cmdFlagResult" class="flag-result"></div>
            </div>
        </div>
    `;
}

// ==========================================
// Render XSS Challenge
// ==========================================

function renderXSSStealer() {
    return `
        <div class="challenge-container">
            <h2>🎯 XSS Cookie Stealer</h2>
            <p>หาช่องโหว่ XSS และสร้าง payload เพื่อ steal cookie</p>
            
            <div class="interactive-box">
                <h3>Comment Section</h3>
                <div class="xss-simulator">
                    <textarea id="xssInput" placeholder="Enter your comment..." class="xss-textarea"></textarea>
                    <button onclick="submitXSSComment()" class="xss-button">Post Comment</button>
                    <div id="xssDisplay" class="xss-display">
                        <p class="xss-note">🔒 XSS Filter Active: &lt;script&gt; tags are blocked</p>
                    </div>
                </div>
            </div>

            <div class="hints-section">
                <div class="hint-item" id="xsshint1">
                    <button onclick="toggleHint('xsshint1')" class="hint-btn">💡 Hint 1 (ฟรี)</button>
                    <div class="hint-content" style="display: none;">
                        ลอง &lt;script&gt;alert(1)&lt;/script&gt; ดูว่า filter อะไรบ้าง
                    </div>
                </div>
                <div class="hint-item" id="xsshint2">
                    <button onclick="toggleHint('xsshint2')" class="hint-btn">💡 Hint 2 (-10 pts)</button>
                    <div class="hint-content" style="display: none;">
                        ใช้ event handlers เช่น &lt;img src=x onerror="alert(1)"&gt;
                    </div>
                </div>
                <div class="hint-item" id="xsshint3">
                    <button onclick="toggleHint('xsshint3')" class="hint-btn">💡 Hint 3 (-10 pts)</button>
                    <div class="hint-content" style="display: none;">
                        ลอง: &lt;img src=x onerror="alert(document.cookie)"&gt;
                    </div>
                </div>
            </div>

            <div class="flag-submission">
                <h3>🚩 Submit Flag</h3>
                <input type="text" id="xssFlag" placeholder="CTF{...}" class="flag-input">
                <button onclick="submitInteractiveFlag('xssStealer', 'xssFlag', 'xssFlagResult')" class="submit-btn">Submit Flag</button>
                <div id="xssFlagResult" class="flag-result"></div>
            </div>
        </div>
    `;
}

// ==========================================
// Render JWT Challenge
// ==========================================

function renderJWTHack() {
    return `
        <div class="challenge-container">
            <h2>🔐 JWT Token Manipulation</h2>
            <p>แก้ไข JWT token โดยใช้ช่องโหว่ Algorithm Confusion เพื่อเข้าถึงข้อมูลของ admin</p>
            
            <div class="interactive-box">
                <h3>JWT Decoder</h3>
                <div class="jwt-simulator">
                    <label>Current JWT Token:</label>
                    <textarea id="jwtToken" class="jwt-textarea">eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiZ3Vlc3QiLCJyb2xlIjoidXNlciIsImlhdCI6MTYxNjIzOTAyMn0.xxxxxxxxxxx</textarea>
                    <button onclick="decodeJWT()" class="jwt-button">Decode JWT</button>
                    <div id="jwtDecoded" class="jwt-result"></div>
                </div>
                
                <div class="jwt-info">
                    <h4>ℹ️ JWT Structure</h4>
                    <p>JWT มี 3 ส่วนแบ่งด้วย จุด (.)</p>
                    <ul>
                        <li><strong>Header:</strong> ข้อมูล algorithm และ type</li>
                        <li><strong>Payload:</strong> ข้อมูลผู้ใช้และ claims</li>
                        <li><strong>Signature:</strong> ลายเซ็นยืนยันความถูกต้อง</li>
                    </ul>
                </div>
            </div>

            <div class="hints-section">
                <div class="hint-item" id="jwthint1">
                    <button onclick="toggleHint('jwthint1')" class="hint-btn">💡 Hint 1 (ฟรี)</button>
                    <div class="hint-content" style="display: none;">
                        JWT แต่ละส่วนเป็น Base64 encoded ลอง decode Header และ Payload
                    </div>
                </div>
                <div class="hint-item" id="jwthint2">
                    <button onclick="toggleHint('jwthint2')" class="hint-btn">💡 Hint 2 (-10 pts)</button>
                    <div class="hint-content" style="display: none;">
                        ลองเปลี่ยน algorithm จาก "HS256" เป็น "none" และลบ signature ออก
                    </div>
                </div>
                <div class="hint-item" id="jwthint3">
                    <button onclick="toggleHint('jwthint3')" class="hint-btn">💡 Hint 3 (-10 pts)</button>
                    <div class="hint-content" style="display: none;">
                        เปลี่ยน role เป็น "admin" แล้ว encode กลับเป็น Base64
                    </div>
                </div>
            </div>

            <div class="flag-submission">
                <h3>🚩 Submit Flag</h3>
                <input type="text" id="jwtFlag" placeholder="CTF{...}" class="flag-input">
                <button onclick="submitInteractiveFlag('jwtHack', 'jwtFlag', 'jwtFlagResult')" class="submit-btn">Submit Flag</button>
                <div id="jwtFlagResult" class="flag-result"></div>
            </div>
        </div>
    `;
}

// ==========================================
// Render Multi-Layer Cipher Challenge
// ==========================================

function renderMultiCipher() {
    return `
        <div class="challenge-container">
            <h2>🔐 Multi-Layer Cipher</h2>
            <p>ข้อความถูกเข้ารหัส 3 ชั้น: Caesar → Base64 → ROT13 ต้องถอดรหัสทีละชั้น</p>
            
            <div class="interactive-box">
                <h3>Encrypted Message</h3>
                <div class="cipher-box">
                    <code class="encrypted-text" style="font-size: 1.2em;">PGS{zhyg1_y4l3e_p1cu3e}</code>
                </div>
                
                <div class="decoder-section">
                    <h4>🛠️ Decoder Tools</h4>
                    
                    <div class="decoder-tool">
                        <label>Step 1 - ROT13 Decode:</label>
                        <input type="text" id="rot13Input" placeholder="Paste encrypted text" class="decoder-input">
                        <button onclick="decodeROT13()" class="decoder-btn">Decode ROT13</button>
                        <div id="rot13Output" class="decoder-output"></div>
                    </div>
                    
                    <div class="decoder-tool">
                        <label>Step 2 - Base64 Decode:</label>
                        <input type="text" id="base64Input" placeholder="Paste ROT13 result" class="decoder-input">
                        <button onclick="decodeBase64()" class="decoder-btn">Decode Base64</button>
                        <div id="base64Output" class="decoder-output"></div>
                    </div>
                    
                    <div class="decoder-tool">
                        <label>Step 3 - Caesar Decode:</label>
                        <input type="text" id="caesarInput" placeholder="Paste Base64 result" class="decoder-input">
                        <input type="number" id="caesarShift" placeholder="Shift" value="13" class="shift-input">
                        <button onclick="decodeCaesar()" class="decoder-btn">Decode Caesar</button>
                        <div id="caesarOutput" class="decoder-output"></div>
                    </div>
                </div>
            </div>

            <div class="hints-section">
                <div class="hint-item" id="multihint1">
                    <button onclick="toggleHint('multihint1')" class="hint-btn">💡 Hint 1 (ฟรี)</button>
                    <div class="hint-content" style="display: none;">
                        ถอดรหัสทีละชั้น เริ่มจาก ROT13 ก่อน (shift 13 ตัว)
                    </div>
                </div>
                <div class="hint-item" id="multihint2">
                    <button onclick="toggleHint('multihint2')" class="hint-btn">💡 Hint 2 (-10 pts)</button>
                    <div class="hint-content" style="display: none;">
                        หลัง ROT13 จะได้ Base64 string ให้ decode ต่อ
                    </div>
                </div>
                <div class="hint-item" id="multihint3">
                    <button onclick="toggleHint('multihint3')" class="hint-btn">💡 Hint 3 (-10 pts)</button>
                    <div class="hint-content" style="display: none;">
                        ชั้นสุดท้ายเป็น Caesar cipher ลอง shift 13 อีกครั้ง
                    </div>
                </div>
            </div>

            <div class="flag-submission">
                <h3>🚩 Submit Flag</h3>
                <input type="text" id="multiFlag" placeholder="CTF{...}" class="flag-input">
                <button onclick="submitInteractiveFlag('multiCipher', 'multiFlag', 'multiFlagResult')" class="submit-btn">Submit Flag</button>
                <div id="multiFlagResult" class="flag-result"></div>
            </div>
        </div>
    `;
}

// ==========================================
// Render XOR Brute Force Challenge
// ==========================================

function renderXORKnown() {
    return `
        <div class="challenge-container">
            <h2>🔑 XOR Brute Force</h2>
            <p>ข้อความถูกเข้ารหัสด้วย XOR single-byte key ให้ brute force หา key และถอดรหัส</p>
            
            <div class="interactive-box">
                <h3>Encrypted Hex String</h3>
                <div class="cipher-box">
                    <code class="encrypted-text" style="font-size: 1.2em;">1c060b1e454c1e1a454c151b0a1e</code>
                </div>
                
                <div class="xor-tool">
                    <h4>🔓 XOR Decoder</h4>
                    <label>Try XOR Key (0-255):</label>
                    <input type="number" id="xorKey" placeholder="Enter key" min="0" max="255" class="xor-input">
                    <button onclick="tryXORKey()" class="xor-btn">Try Decode</button>
                    <button onclick="bruteForceXOR()" class="xor-btn" style="background: var(--danger);">Auto Brute Force</button>
                    <div id="xorOutput" class="xor-output"></div>
                </div>
            </div>

            <div class="hints-section">
                <div class="hint-item" id="xorhint1">
                    <button onclick="toggleHint('xorhint1')" class="hint-btn">💡 Hint 1 (ฟรี)</button>
                    <div class="hint-content" style="display: none;">
                        Single-byte key มีค่าระหว่าง 0-255 แค่ 256 possibilities
                    </div>
                </div>
                <div class="hint-item" id="xorhint2">
                    <button onclick="toggleHint('xorhint2')" class="hint-btn">💡 Hint 2 (-10 pts)</button>
                    <div class="hint-content" style="display: none;">
                        ลอง brute force ทีละตัว ผลลัพธ์ที่ถูกต้องจะเป็น readable text
                    </div>
                </div>
                <div class="hint-item" id="xorhint3">
                    <button onclick="toggleHint('xorhint3')" class="hint-btn">💡 Hint 3 (-10 pts)</button>
                    <div class="hint-content" style="display: none;">
                        กด Auto Brute Force เพื่อลองทุก key อัตโนมัติ
                    </div>
                </div>
            </div>

            <div class="flag-submission">
                <h3>🚩 Submit Flag</h3>
                <input type="text" id="xorFlag" placeholder="CTF{...}" class="flag-input">
                <button onclick="submitInteractiveFlag('xorKnown', 'xorFlag', 'xorFlagResult')" class="submit-btn">Submit Flag</button>
                <div id="xorFlagResult" class="flag-result"></div>
            </div>
        </div>
    `;
}
// Part 5: Interactive Challenge Rendering Part 2 & Logic Functions

// ==========================================
// Render RSA Weak Challenge
// ==========================================

function renderRSAWeak() {
    return `
        <div class="challenge-container">
            <h2>🔐 RSA Small Exponent Attack</h2>
            <p>RSA ที่ใช้ e=3 พร้อม ciphertext ให้ใช้ Chinese Remainder Theorem โจมตี</p>
            
            <div class="interactive-box">
                <h3>📊 RSA Parameters</h3>
                <div class="rsa-info">
                    <div class="info-row">
                        <strong>Public Exponent (e):</strong> <code>3</code>
                    </div>
                    <div class="info-row">
                        <strong>Modulus n1:</strong> <code style="font-size: 0.8em;">25195908475657893494027183240048398571429282126204...</code>
                    </div>
                    <div class="info-row">
                        <strong>Ciphertext c1:</strong> <code style="font-size: 0.8em;">2205316413931134031046440767620541984801...</code>
                    </div>
                </div>
                
                <div class="rsa-explanation">
                    <h4>⚠️ ช่องโหว่</h4>
                    <p>เมื่อ e=3 และข้อความเดียวกันถูกเข้ารหัสด้วย modulus ต่างกัน 3 ครั้ง สามารถใช้ Chinese Remainder Theorem คำนวณ m³ แล้วหาราก cube root</p>
                </div>
            </div>

            <div class="hints-section">
                <div class="hint-item" id="rsahint1">
                    <button onclick="toggleHint('rsahint1')" class="hint-btn">💡 Hint 1 (ฟรี)</button>
                    <div class="hint-content" style="display: none;">
                        เมื่อ e=3 และ message m เล็ก m³ อาจน้อยกว่า n ทำให้ถอดรหัสได้โดยไม่ต้องรู้ private key
                    </div>
                </div>
                <div class="hint-item" id="rsahint2">
                    <button onclick="toggleHint('rsahint2')" class="hint-btn">💡 Hint 2 (-10 pts)</button>
                    <div class="hint-content" style="display: none;">
                        ใช้ Chinese Remainder Theorem (CRT) รวม 3 ciphertext เพื่อหา m³ mod (n1*n2*n3)
                    </div>
                </div>
                <div class="hint-item" id="rsahint3">
                    <button onclick="toggleHint('rsahint3')" class="hint-btn">💡 Hint 3 (-10 pts)</button>
                    <div class="hint-content" style="display: none;">
                        หลังได้ m³ แล้ว หาราก cube root เพื่อได้ plaintext: CTF{rs4_sm4ll_3xp0n3nt}
                    </div>
                </div>
            </div>

            <div class="flag-submission">
                <h3>🚩 Submit Flag</h3>
                <input type="text" id="rsaFlag" placeholder="CTF{...}" class="flag-input">
                <button onclick="submitInteractiveFlag('rsaWeak', 'rsaFlag', 'rsaFlagResult')" class="submit-btn">Submit Flag</button>
                <div id="rsaFlagResult" class="flag-result"></div>
            </div>
        </div>
    `;
}

// ==========================================
// Render Custom Cipher Challenge
// ==========================================

function renderCustomCipher() {
    return `
        <div class="challenge-container">
            <h2>🔐 Custom Cipher Breaking</h2>
            <p>วิเคราะห์และถอดรหัส custom encryption algorithm ที่มีจุดอ่อนในการ implement</p>
            
            <div class="interactive-box">
                <h3>🔒 Encrypted Message</h3>
                <div class="cipher-box">
                    <code class="encrypted-text" style="font-size: 1.2em;">Pxvwrp_p1sk3e_se0r3n</code>
                </div>
                
                <div class="cipher-analysis">
                    <h4>📊 Pattern Analysis</h4>
                    <ul>
                        <li>Message length: 21 characters</li>
                        <li>Contains mix of uppercase, lowercase, and numbers</li>
                        <li>Appears to use substitution + transposition</li>
                        <li>Pattern suggests CTF flag format</li>
                    </ul>
                </div>
                
                <div class="cipher-tools">
                    <h4>🔧 Analysis Tools</h4>
                    <button onclick="analyzeFrequency()" class="tool-btn">Frequency Analysis</button>
                    <button onclick="tryCommonSubstitutions()" class="tool-btn">Common Substitutions</button>
                    <button onclick="reverseString()" class="tool-btn">Reverse String</button>
                    <div id="analysisOutput" class="analysis-output"></div>
                </div>
            </div>

            <div class="hints-section">
                <div class="hint-item" id="customhint1">
                    <button onclick="toggleHint('customhint1')" class="hint-btn">💡 Hint 1 (ฟรี)</button>
                    <div class="hint-content" style="display: none;">
                        ลองวิเคราะห์ pattern ของตัวอักษร อาจเป็น substitution cipher แบบง่าย
                    </div>
                </div>
                <div class="hint-item" id="customhint2">
                    <button onclick="toggleHint('customhint2')" class="hint-btn">💡 Hint 2 (-10 pts)</button>
                    <div class="hint-content" style="display: none;">
                        ตัวอักษรแต่ละตัวถูกเลื่อน (shift) ตามตำแหน่ง (position-based shift)
                    </div>
                </div>
                <div class="hint-item" id="customhint3">
                    <button onclick="toggleHint('customhint3')" class="hint-btn">💡 Hint 3 (-10 pts)</button>
                    <div class="hint-content" style="display: none;">
                        ลอง shift แต่ละตัวอักษรด้วยค่า index ของมัน: char[i] = char[i] - i
                    </div>
                </div>
            </div>

            <div class="flag-submission">
                <h3>🚩 Submit Flag</h3>
                <input type="text" id="customFlag" placeholder="CTF{...}" class="flag-input">
                <button onclick="submitInteractiveFlag('customCipher', 'customFlag', 'customFlagResult')" class="submit-btn">Submit Flag</button>
                <div id="customFlagResult" class="flag-result"></div>
            </div>
        </div>
    `;
}

// ==========================================
// Render Forensics Challenges
// ==========================================

function renderBirthdayExif() {
    return `
        <div class="challenge-container">
            <h2>🕵️ Hidden Birthday Message</h2>
            <p>รูปภาพ Happy Birthday มีข้อมูลที่ซ่อนอยู่ใน EXIF metadata ให้ใช้เครื่องมือวิเคราะห์หา flag</p>
            
            <div class="interactive-box">
                <h3>📷 Image File</h3>
                <div class="image-container">
                    <img src="https://via.placeholder.com/600x400/1a1a2e/00ff88?text=Happy+Birthday+%F0%9F%8E%89" alt="Birthday" class="challenge-image">
                </div>
                
                <div class="exif-info">
                    <h4>🔍 EXIF Data Viewer</h4>
                    <button onclick="viewExifData()" class="tool-btn">Extract EXIF Data</button>
                    <div id="exifOutput" class="exif-output"></div>
                </div>
            </div>

            <div class="hints-section">
                <div class="hint-item" id="birthdayhint1">
                    <button onclick="toggleHint('birthdayhint1')" class="hint-btn">💡 Hint 1 (ฟรี)</button>
                    <div class="hint-content" style="display: none;">
                        ใช้ exiftool หรือ online EXIF viewer เพื่อดู metadata
                    </div>
                </div>
                <div class="hint-item" id="birthdayhint2">
                    <button onclick="toggleHint('birthdayhint2')" class="hint-btn">💡 Hint 2 (-10 pts)</button>
                    <div class="hint-content" style="display: none;">
                        ตรวจสอบ Comment field หรือ User Comment ใน EXIF data
                    </div>
                </div>
                <div class="hint-item" id="birthdayhint3">
                    <button onclick="toggleHint('birthdayhint3')" class="hint-btn">💡 Hint 3 (-10 pts)</button>
                    <div class="hint-content" style="display: none;">
                        Flag ซ่อนอยู่ใน Artist field: CTF{ex1f_h1dd3n_m3ss4g3}
                    </div>
                </div>
            </div>

            <div class="flag-submission">
                <h3>🚩 Submit Flag</h3>
                <input type="text" id="birthdayFlag" placeholder="CTF{...}" class="flag-input">
                <button onclick="submitInteractiveFlag('birthdayExif', 'birthdayFlag', 'birthdayFlagResult')" class="submit-btn">Submit Flag</button>
                <div id="birthdayFlagResult" class="flag-result"></div>
            </div>
        </div>
    `;
}

function renderGeoLocation() {
    return `
        <div class="challenge-container">
            <h2>🗺️ Geolocation Mystery</h2>
            <p>รูปถ่ายจากตึกมี GPS coordinates ใน metadata ให้หาตำแหน่งและแปลงเป็น MD5 hash</p>
            
            <div class="interactive-box">
                <h3>📍 Photo Analysis</h3>
                <div class="image-container">
                    <img src="https://via.placeholder.com/600x400/1a1a2e/00ff88?text=Mystery+Location+%F0%9F%8F%99%EF%B8%8F" alt="Location" class="challenge-image">
                </div>
                
                <div class="gps-info">
                    <h4>🛰️ GPS Coordinates Found</h4>
                    <div class="gps-data">
                        <p><strong>Latitude:</strong> <code>13.7563° N</code></p>
                        <p><strong>Longitude:</strong> <code>100.5018° E</code></p>
                    </div>
                    
                    <button onclick="openGoogleMaps()" class="tool-btn">🗺️ Open in Google Maps</button>
                    <button onclick="reverseGeocode()" class="tool-btn">📍 Reverse Geocode</button>
                    <div id="locationOutput" class="location-output"></div>
                </div>
            </div>

            <div class="hints-section">
                <div class="hint-item" id="geohint1">
                    <button onclick="toggleHint('geohint1')" class="hint-btn">💡 Hint 1 (ฟรี)</button>
                    <div class="hint-content" style="display: none;">
                        ใช้ GPS coordinates ค้นหาตำแหน่งบน Google Maps
                    </div>
                </div>
                <div class="hint-item" id="geohint2">
                    <button onclick="toggleHint('geohint2')" class="hint-btn">💡 Hint 2 (-10 pts)</button>
                    <div class="hint-content" style="display: none;">
                        ตำแหน่งคือ "Bangkok" เมื่อได้ชื่อเมืองแล้ว แปลงเป็น MD5 hash
                    </div>
                </div>
                <div class="hint-item" id="geohint3">
                    <button onclick="toggleHint('geohint3')" class="hint-btn">💡 Hint 3 (-10 pts)</button>
                    <div class="hint-content" style="display: none;">
                        Flag format: CTF{MD5("Bangkok")} = CTF{g30l0c4t10n_md5}
                    </div>
                </div>
            </div>

            <div class="flag-submission">
                <h3>🚩 Submit Flag</h3>
                <input type="text" id="geoFlag" placeholder="CTF{...}" class="flag-input">
                <button onclick="submitInteractiveFlag('geoLocation', 'geoFlag', 'geoFlagResult')" class="submit-btn">Submit Flag</button>
                <div id="geoFlagResult" class="flag-result"></div>
            </div>
        </div>
    `;
}

function renderStegoFlag() {
    return `
        <div class="challenge-container">
            <h2>🎨 Steganography Battlefield</h2>
            <p>รูปภาพธงขาวมีไฟล์ซ่อนอยู่ข้างใน ต้องใช้ binwalk extract แล้วถอดรหัส Base64</p>
            
            <div class="interactive-box">
                <h3>🏳️ Flag Image</h3>
                <div class="image-container">
                    <img src="https://via.placeholder.com/600x400/ffffff/000000?text=White+Flag" alt="Flag" class="challenge-image">
                </div>
                
                <div class="stego-tools">
                    <h4>🔧 Steganography Tools</h4>
                    <button onclick="extractHiddenFile()" class="tool-btn">Extract Hidden File</button>
                    <button onclick="checkLSB()" class="tool-btn">Check LSB</button>
                    <button onclick="runStrings()" class="tool-btn">Run Strings</button>
                    <div id="stegoOutput" class="stego-output"></div>
                </div>
            </div>

            <div class="hints-section">
                <div class="hint-item" id="stegohint1">
                    <button onclick="toggleHint('stegohint1')" class="hint-btn">💡 Hint 1 (ฟรี)</button>
                    <div class="hint-content" style="display: none;">
                        ใช้ binwalk หรือ foremost เพื่อ extract ไฟล์ที่ซ่อนอยู่
                    </div>
                </div>
                <div class="hint-item" id="stegohint2">
                    <button onclick="toggleHint('stegohint2')" class="hint-btn">💡 Hint 2 (-10 pts)</button>
                    <div class="hint-content" style="display: none;">
                        หลัง extract แล้วจะได้ไฟล์ .txt ที่มี Base64 encoded string
                    </div>
                </div>
                <div class="hint-item" id="stegohint3">
                    <button onclick="toggleHint('stegohint3')" class="hint-btn">💡 Hint 3 (-10 pts)</button>
                    <div class="hint-content" style="display: none;">
                        Decode Base64 string จะได้ flag: CTF{st3g4n0gr4phy_m4st3r}
                    </div>
                </div>
            </div>

            <div class="flag-submission">
                <h3>🚩 Submit Flag</h3>
                <input type="text" id="stegoFlag" placeholder="CTF{...}" class="flag-input">
                <button onclick="submitInteractiveFlag('stegoFlag', 'stegoFlag', 'stegoFlagResult')" class="submit-btn">Submit Flag</button>
                <div id="stegoFlagResult" class="flag-result"></div>
            </div>
        </div>
    `;
}

function renderDiskAnalysis() {
    return `
        <div class="challenge-container">
            <h2>💾 Disk Analysis</h2>
            <p>วิเคราะห์ disk image เพื่อกู้คืนไฟล์ที่ถูกลบและหา flag</p>
            
            <div class="interactive-box">
                <h3>🔍 Disk Image Info</h3>
                <div class="disk-info">
                    <p><strong>File:</strong> <code>evidence.dd</code></p>
                    <p><strong>Size:</strong> 512 MB</p>
                    <p><strong>Filesystem:</strong> EXT4</p>
                    <p><strong>Status:</strong> Contains deleted files</p>
                </div>
                
                <div class="disk-tools">
                    <h4>🛠️ Forensics Tools</h4>
                    <button onclick="mountDisk()" class="tool-btn">Mount Disk</button>
                    <button onclick="recoverFiles()" class="tool-btn">Recover Deleted Files</button>
                    <button onclick="searchStrings()" class="tool-btn">Search Strings</button>
                    <div id="diskOutput" class="disk-output"></div>
                </div>
            </div>

            <div class="hints-section">
                <div class="hint-item" id="diskhint1">
                    <button onclick="toggleHint('diskhint1')" class="hint-btn">💡 Hint 1 (ฟรี)</button>
                    <div class="hint-content" style="display: none;">
                        ใช้ Autopsy หรือ FTK Imager เพื่อวิเคราะห์ disk image
                    </div>
                </div>
                <div class="hint-item" id="diskhint2">
                    <button onclick="toggleHint('diskhint2')" class="hint-btn">💡 Hint 2 (-10 pts)</button>
                    <div class="hint-content" style="display: none;">
                        ใช้ extundelete หรือ photorec เพื่อกู้คืนไฟล์ที่ถูกลบ
                    </div>
                </div>
                <div class="hint-item" id="diskhint3">
                    <button onclick="toggleHint('diskhint3')" class="hint-btn">💡 Hint 3 (-10 pts)</button>
                    <div class="hint-content" style="display: none;">
                        Flag อยู่ในไฟล์ชื่อ secret.txt ที่ถูกลบไปแล้ว: CTF{d1sk_4n4lys1s_pr0}
                    </div>
                </div>
            </div>

            <div class="flag-submission">
                <h3>🚩 Submit Flag</h3>
                <input type="text" id="diskFlag" placeholder="CTF{...}" class="flag-input">
                <button onclick="submitInteractiveFlag('diskAnalysis', 'diskFlag', 'diskFlagResult')" class="submit-btn">Submit Flag</button>
                <div id="diskFlagResult" class="flag-result"></div>
            </div>
        </div>
    `;
}
// ==========================================
// Network Security Challenges - Render Functions
// ==========================================

function renderPacketBasic() {
    return `
        <div class="challenge-container">
            <h2>🖧 Packet Sniffer Basic</h2>
            <p>วิเคราะห์ HTTP packets และหา credentials ที่ส่งแบบ plaintext</p>
            
            <div class="interactive-box">
                <h3>📡 Network Traffic Capture</h3>
                <div class="packet-viewer">
                    <div class="packet-controls">
                        <button onclick="capturePackets()" class="tool-btn">Start Capture</button>
                        <button onclick="stopCapture()" class="tool-btn">Stop Capture</button>
                        <button onclick="filterHTTP()" class="tool-btn">Filter HTTP</button>
                        <button onclick="exportPCAP()" class="tool-btn">Export PCAP</button>
                    </div>
                    <div id="packetDisplay" class="packet-display">
                        <div class="packet-header">Waiting for packets...</div>
                    </div>
                </div>
                
                <div class="packet-details">
                    <h4>📦 Packet Details</h4>
                    <div id="packetInfo" class="packet-info">
                        <p>Click on a packet to view details</p>
                    </div>
                </div>
            </div>

            <div class="hints-section">
                <div class="hint-item" id="packethint1">
                    <button onclick="toggleHint('packethint1')" class="hint-btn">💡 Hint 1 (ฟรี)</button>
                    <div class="hint-content" style="display: none;">
                        มองหา HTTP POST request ที่ส่ง login credentials
                    </div>
                </div>
                <div class="hint-item" id="packethint2">
                    <button onclick="toggleHint('packethint2')" class="hint-btn">💡 Hint 2 (-10 pts)</button>
                    <div class="hint-content" style="display: none;">
                        ข้อมูล username และ password ถูกส่งแบบ Base64 encoded
                    </div>
                </div>
                <div class="hint-item" id="packethint3">
                    <button onclick="toggleHint('packethint3')" class="hint-btn">💡 Hint 3 (-10 pts)</button>
                    <div class="hint-content" style="display: none;">
                        Decode Base64: YWRtaW46cDRzc3cwcmQ= → admin:p4ssw0rd → Flag: CTF{p4ck3t_sn1ff3r_b4s1c}
                    </div>
                </div>
            </div>

            <div class="flag-submission">
                <h3>🚩 Submit Flag</h3>
                <input type="text" id="packetFlag" placeholder="CTF{...}" class="flag-input">
                <button onclick="submitInteractiveFlag('packetBasic', 'packetFlag', 'packetFlagResult')" class="submit-btn">Submit Flag</button>
                <div id="packetFlagResult" class="flag-result"></div>
            </div>
        </div>
    `;
}

function renderDNSTunnel() {
    return `
        <div class="challenge-container">
            <h2>🌐 DNS Tunneling Extract</h2>
            <p>Data ถูก exfiltrate ผ่าน DNS queries ให้ decode และ reconstruct ข้อมูลต้นฉบับ</p>
            
            <div class="interactive-box">
                <h3>🔍 DNS Query Log</h3>
                <div class="dns-viewer">
                    <div class="log-display" id="dnsLog">
                        <div class="log-entry">14:32:01 - Query: NGU0.6D30.646E.example.com</div>
                        <div class="log-entry">14:32:02 - Query: 735F.3474.3734.example.com</div>
                        <div class="log-entry">14:32:03 - Query: 6E6E.3331.5F33.example.com</div>
                        <div class="log-entry">14:32:04 - Query: 7874.7234.6374.example.com</div>
                        <div class="log-entry">14:32:05 - Query: 0000.0000.0000.example.com (END)</div>
                    </div>
                    
                    <div class="dns-tools">
                        <h4>🛠️ Extraction Tools</h4>
                        <button onclick="extractDNSData()" class="tool-btn">Extract Data</button>
                        <button onclick="decodeDNSHex()" class="tool-btn">Decode Hex</button>
                        <button onclick="reconstructDNS()" class="tool-btn">Reconstruct Message</button>
                        <div id="dnsOutput" class="dns-output"></div>
                    </div>
                </div>
            </div>

            <div class="hints-section">
                <div class="hint-item" id="dnshint1">
                    <button onclick="toggleHint('dnshint1')" class="hint-btn">💡 Hint 1 (ฟรี)</button>
                    <div class="hint-content" style="display: none;">
                        แต่ละ subdomain เป็น hex encoded data ที่ต้อง decode
                    </div>
                </div>
                <div class="hint-item" id="dnshint2">
                    <button onclick="toggleHint('dnshint2')" class="hint-btn">💡 Hint 2 (-10 pts)</button>
                    <div class="hint-content" style="display: none;">
                        รวม hex strings จากทุก query แล้ว decode เป็น ASCII
                    </div>
                </div>
                <div class="hint-item" id="dnshint3">
                    <button onclick="toggleHint('dnshint3')" class="hint-btn">💡 Hint 3 (-10 pts)</button>
                    <div class="hint-content" style="display: none;">
                        Decoded message: "dns_tunn31_3xtr4ct" → Flag: CTF{dns_tunn31_3xtr4ct}
                    </div>
                </div>
            </div>

            <div class="flag-submission">
                <h3>🚩 Submit Flag</h3>
                <input type="text" id="dnsFlag" placeholder="CTF{...}" class="flag-input">
                <button onclick="submitInteractiveFlag('dnsTunnel', 'dnsFlag', 'dnsFlagResult')" class="submit-btn">Submit Flag</button>
                <div id="dnsFlagResult" class="flag-result"></div>
            </div>
        </div>
    `;
}

function renderARPSpoof() {
    return `
        <div class="challenge-container">
            <h2>🎭 ARP Spoofing Attack</h2>
            <p>จำลอง ARP spoofing attack และ intercept traffic ระหว่าง victim กับ gateway</p>
            
            <div class="interactive-box">
                <h3>🖧 Network Topology</h3>
                <div class="network-diagram">
                    <div class="network-node victim">
                        <div class="node-icon">💻</div>
                        <div class="node-label">Victim<br>192.168.1.100</div>
                    </div>
                    <div class="network-node attacker">
                        <div class="node-icon">🎭</div>
                        <div class="node-label">Attacker (You)<br>192.168.1.50</div>
                    </div>
                    <div class="network-node gateway">
                        <div class="node-icon">🌐</div>
                        <div class="node-label">Gateway<br>192.168.1.1</div>
                    </div>
                </div>
                
                <div class="arp-controls">
                    <h4>⚙️ Attack Controls</h4>
                    <button onclick="sendARPReply()" class="tool-btn">Send ARP Reply</button>
                    <button onclick="enableForwarding()" class="tool-btn">Enable IP Forwarding</button>
                    <button onclick="interceptTraffic()" class="tool-btn">Intercept Traffic</button>
                    <div id="arpOutput" class="arp-output"></div>
                </div>
                
                <div class="captured-traffic">
                    <h4>📦 Captured Traffic</h4>
                    <div id="trafficLog" class="traffic-log">
                        <p class="text-muted">Start the attack to capture traffic...</p>
                    </div>
                </div>
            </div>

            <div class="hints-section">
                <div class="hint-item" id="arphint1">
                    <button onclick="toggleHint('arphint1')" class="hint-btn">💡 Hint 1 (ฟรี)</button>
                    <div class="hint-content" style="display: none;">
                        ต้องส่ง ARP reply เพื่อบอก victim ว่า gateway อยู่ที่ MAC address ของ attacker
                    </div>
                </div>
                <div class="hint-item" id="arphint2">
                    <button onclick="toggleHint('arphint2')" class="hint-btn">💡 Hint 2 (-10 pts)</button>
                    <div class="hint-content" style="display: none;">
                        Enable IP forwarding เพื่อ relay traffic และไม่ให้ victim สังเกตุ
                    </div>
                </div>
                <div class="hint-item" id="arphint3">
                    <button onclick="toggleHint('arphint3')" class="hint-btn">💡 Hint 3 (-10 pts)</button>
                    <div class="hint-content" style="display: none;">
                        ใน captured traffic จะเห็น password: CTF{4rp_sp00f1ng_4tt4ck}
                    </div>
                </div>
            </div>

            <div class="flag-submission">
                <h3>🚩 Submit Flag</h3>
                <input type="text" id="arpFlag" placeholder="CTF{...}" class="flag-input">
                <button onclick="submitInteractiveFlag('arpSpoof', 'arpFlag', 'arpFlagResult')" class="submit-btn">Submit Flag</button>
                <div id="arpFlagResult" class="flag-result"></div>
            </div>
        </div>
    `;
}

function renderSSLStrip() {
    return `
        <div class="challenge-container">
            <h2>🔓 SSL Strip Analysis</h2>
            <p>วิเคราะห์ HTTPS traffic ที่ถูก downgrade เป็น HTTP ด้วย SSL stripping</p>
            
            <div class="interactive-box">
                <h3>🔒 SSL Strip Scenario</h3>
                <div class="ssl-diagram">
                    <div class="connection-flow">
                        <div class="flow-item">Client → <span class="http">HTTP</span> → Attacker</div>
                        <div class="flow-item">Attacker → <span class="https">HTTPS</span> → Server</div>
                    </div>
                </div>
                
                <div class="ssl-capture">
                    <h4>📡 Intercepted Requests</h4>
                    <div class="request-log">
                        <div class="request-entry">
                            <strong>Client Request:</strong><br>
                            GET http://bank.example.com/login HTTP/1.1<br>
                            Host: bank.example.com<br>
                            User-Agent: Mozilla/5.0
                        </div>
                        <div class="request-entry highlighted">
                            <strong>Login POST (Downgraded):</strong><br>
                            POST http://bank.example.com/auth HTTP/1.1<br>
                            Content-Type: application/x-www-form-urlencoded<br>
                            <code>username=admin&password=s3cur3_p4ssw0rd</code>
                        </div>
                    </div>
                    
                    <div class="ssl-tools">
                        <h4>🔧 Analysis Tools</h4>
                        <button onclick="analyzeSSL()" class="tool-btn">Analyze SSL Strip</button>
                        <button onclick="extractCredentials()" class="tool-btn">Extract Credentials</button>
                        <button onclick="checkHSTS()" class="tool-btn">Check HSTS</button>
                        <div id="sslOutput" class="ssl-output"></div>
                    </div>
                </div>
            </div>

            <div class="hints-section">
                <div class="hint-item" id="sslhint1">
                    <button onclick="toggleHint('sslhint1')" class="hint-btn">💡 Hint 1 (ฟรี)</button>
                    <div class="hint-content" style="display: none;">
                        SSL Stripping ทำให้ victim ใช้ HTTP แทน HTTPS โดยไม่รู้ตัว
                    </div>
                </div>
                <div class="hint-item" id="sslhint2">
                    <button onclick="toggleHint('sslhint2')" class="hint-btn">💡 Hint 2 (-10 pts)</button>
                    <div class="hint-content" style="display: none;">
                        ดู POST request ที่ส่ง login credentials แบบ plaintext
                    </div>
                </div>
                <div class="hint-item" id="sslhint3">
                    <button onclick="toggleHint('sslhint3')" class="hint-btn">💡 Hint 3 (-10 pts)</button>
                    <div class="hint-content" style="display: none;">
                        Password ที่ดักจับได้: s3cur3_p4ssw0rd → Flag: CTF{ssl_str1p_4n4lys1s}
                    </div>
                </div>
            </div>

            <div class="flag-submission">
                <h3>🚩 Submit Flag</h3>
                <input type="text" id="sslFlag" placeholder="CTF{...}" class="flag-input">
                <button onclick="submitInteractiveFlag('sslStrip', 'sslFlag', 'sslFlagResult')" class="submit-btn">Submit Flag</button>
                <div id="sslFlagResult" class="flag-result"></div>
            </div>
        </div>
    `;
}
// ==========================================
// Reverse Engineering Challenges - Render Functions
// ==========================================

function renderASMPassword() {
    return `
        <div class="challenge-container">
            <h2>⚙️ Assembly Password Check</h2>
            <p>Program ตรวจสอบ password โดยใช้ assembly code ให้วิเคราะห์ algorithm และหา password</p>
            
            <div class="interactive-box">
                <h3>📜 Assembly Code</h3>
                <div class="asm-viewer">
                    <pre class="asm-code"><code>
check_password:
    push    rbp
    mov     rbp, rsp
    mov     QWORD PTR [rbp-8], rdi
    mov     DWORD PTR [rbp-12], 0
    jmp     .L2
.L3:
    mov     eax, DWORD PTR [rbp-12]
    movsxd  rdx, eax
    mov     rax, QWORD PTR [rbp-8]
    add     rax, rdx
    movzx   eax, BYTE PTR [rax]
    movsx   edx, al
    mov     eax, DWORD PTR [rbp-12]
    add     eax, 13                    ; Caesar shift by 13
    cmp     edx, eax
    jne     .L4
    add     DWORD PTR [rbp-12], 1
.L2:
    mov     eax, DWORD PTR [rbp-12]
    cmp     eax, 7                     ; Length check
    jle     .L3
    mov     eax, 1                     ; Return true
    jmp     .L5
.L4:
    mov     eax, 0                     ; Return false
.L5:
    pop     rbp
    ret
                    </code></pre>
                </div>
                
                <div class="asm-tools">
                    <h4>🔧 Analysis Tools</h4>
                    <button onclick="decompileASM()" class="tool-btn">Decompile to C</button>
                    <button onclick="traceExecution()" class="tool-btn">Trace Execution</button>
                    <button onclick="reverseAlgorithm()" class="tool-btn">Reverse Algorithm</button>
                    <div id="asmOutput" class="asm-output"></div>
                </div>
                
                <div class="password-tester">
                    <h4>🔐 Password Tester</h4>
                    <input type="text" id="asmPassword" placeholder="Enter password" class="test-input">
                    <button onclick="testPassword()" class="tool-btn">Test Password</button>
                    <div id="testResult" class="test-result"></div>
                </div>
            </div>

            <div class="hints-section">
                <div class="hint-item" id="asmhint1">
                    <button onclick="toggleHint('asmhint1')" class="hint-btn">💡 Hint 1 (ฟรี)</button>
                    <div class="hint-content" style="display: none;">
                        Algorithm เช็คว่าแต่ละ character + 13 ตรงกับ index หรือไม่
                    </div>
                </div>
                <div class="hint-item" id="asmhint2">
                    <button onclick="toggleHint('asmhint2')" class="hint-btn">💡 Hint 2 (-10 pts)</button>
                    <div class="hint-content" style="display: none;">
                        Password length = 8 characters, character[i] = i - 13 (in ASCII)
                    </div>
                </div>
                <div class="hint-item" id="asmhint3">
                    <button onclick="toggleHint('asmhint3')" class="hint-btn">💡 Hint 3 (-10 pts)</button>
                    <div class="hint-content" style="display: none;">
                        Correct password หาได้จาก algorithm → Flag: CTF{4sm_p4ssw0rd_ch3ck}
                    </div>
                </div>
            </div>

            <div class="flag-submission">
                <h3>🚩 Submit Flag</h3>
                <input type="text" id="asmFlag" placeholder="CTF{...}" class="flag-input">
                <button onclick="submitInteractiveFlag('asmPassword', 'asmFlag', 'asmFlagResult')" class="submit-btn">Submit Flag</button>
                <div id="asmFlagResult" class="flag-result"></div>
            </div>
        </div>
    `;
}

function renderCrackMe() {
    return `
        <div class="challenge-container">
            <h2>🔓 Binary Crackme</h2>
            <p>Binary ที่ validate serial key ด้วย mathematical operations ให้ reverse algorithm</p>
            
            <div class="interactive-box">
                <h3>💻 Crackme Binary</h3>
                <div class="binary-info">
                    <p><strong>Filename:</strong> crackme.exe</p>
                    <p><strong>Size:</strong> 15,360 bytes</p>
                    <p><strong>Type:</strong> PE32 executable (console) x86</p>
                    <p><strong>Protection:</strong> None</p>
                </div>
                
                <div class="disassembly-view">
                    <h4>📄 Key Validation Function</h4>
                    <pre class="disasm-code"><code>
validate_serial:
    ; Input: Serial key in EAX
    mov     ebx, eax
    xor     edx, edx
    mov     ecx, 1337          ; Magic number
    
    ; Check 1: Divisibility
    div     ecx
    test    edx, edx
    jnz     fail
    
    ; Check 2: Range
    cmp     eax, 0x1000
    jl      fail
    cmp     eax, 0x10000
    jg      fail
    
    ; Check 3: Custom algorithm
    mov     eax, ebx
    shr     eax, 4
    xor     eax, 0x4242
    cmp     eax, 0x1337
    jne     fail
    
success:
    mov     eax, 1
    ret
fail:
    xor     eax, eax
    ret
                    </code></pre>
                </div>
                
                <div class="keygen-section">
                    <h4>🔑 Serial Key Generator</h4>
                    <button onclick="analyzeChecks()" class="tool-btn">Analyze Checks</button>
                    <button onclick="calculateSerial()" class="tool-btn">Calculate Valid Serial</button>
                    <button onclick="generateKeygen()" class="tool-btn">Generate Keygen</button>
                    <div id="keygenOutput" class="keygen-output"></div>
                </div>
                
                <div class="serial-tester">
                    <h4>🧪 Test Serial Key</h4>
                    <input type="text" id="serialKey" placeholder="Enter serial key" class="test-input">
                    <button onclick="validateSerial()" class="tool-btn">Validate</button>
                    <div id="serialResult" class="test-result"></div>
                </div>
            </div>

            <div class="hints-section">
                <div class="hint-item" id="crackmehint1">
                    <button onclick="toggleHint('crackmehint1')" class="hint-btn">💡 Hint 1 (ฟรี)</button>
                    <div class="hint-content" style="display: none;">
                        Serial key ต้องหาร 1337 ลงตัวและอยู่ในช่วง 0x1000-0x10000
                    </div>
                </div>
                <div class="hint-item" id="crackmehint2">
                    <button onclick="toggleHint('crackmehint2')" class="hint-btn">💡 Hint 2 (-10 pts)</button>
                    <div class="hint-content" style="display: none;">
                        หลังผ่าน check 1-2 แล้ว ต้อง (serial >> 4) XOR 0x4242 = 0x1337
                    </div>
                </div>
                <div class="hint-item" id="crackmehint3">
                    <button onclick="toggleHint('crackmehint3')" class="hint-btn">💡 Hint 3 (-10 pts)</button>
                    <div class="hint-content" style="display: none;">
                        Valid serial: 87445 → Flag: CTF{cr4ckm3_s3r14l_k3y}
                    </div>
                </div>
            </div>

            <div class="flag-submission">
                <h3>🚩 Submit Flag</h3>
                <input type="text" id="crackmeFlag" placeholder="CTF{...}" class="flag-input">
                <button onclick="submitInteractiveFlag('crackme', 'crackmeFlag', 'crackmeFlagResult')" class="submit-btn">Submit Flag</button>
                <div id="crackmeFlagResult" class="flag-result"></div>
            </div>
        </div>
    `;
}
// ==========================================
// Reverse Engineering (ต่อ)
// ==========================================

function renderObfuscated() {
    return `
        <div class="challenge-container">
            <h2>🌀 Obfuscated Code Analysis</h2>
            <p>Code ที่ถูก obfuscate ด้วย string encoding และ control flow flattening</p>
            
            <div class="interactive-box">
                <h3>🔐 Obfuscated Code</h3>
                <div class="code-viewer">
                    <pre class="obfuscated-code"><code>function _0x4f2a(){const _0x3d2b=['toString','charCodeAt',
'fromCharCode','split','length','join'];return _0x4f2a=
function(){return _0x3d2b;};return _0x4f2a();}
(function(_0x5e8c23,_0x2d4f87){const _0x4a2c1b=_0x2e4f,
_0x3f1d2a=_0x5e8c23();while(!![]){try{const _0x1b4e3c=
-parseInt(_0x4a2c1b(0x1a0))/0x1+-parseInt(_0x4a2c1b(0x1a1))
/0x2*(parseInt(_0x4a2c1b(0x1a2))/0x3);if(_0x1b4e3c===
_0x2d4f87)break;else _0x3f1d2a['push'](_0x3f1d2a['shift']());}
catch(_0x5a2b1c){_0x3f1d2a['push'](_0x3f1d2a['shift']());}}}
(_0x4f2a,0x3d2f8));

function checkFlag(_0x1f3a2b){const _0x2c4d=_0x1e2f;
let _0x4b2c1a=_0x1f3a2b[_0x2c4d(0x1a3)]('');
for(let _0x5c1d=0x0;_0x5c1d&lt;_0x4b2c1a[_0x2c4d(0x1a4)];_0x5c1d++){
_0x4b2c1a[_0x5c1d]=String[_0x2c4d(0x1a2)](_0x4b2c1a[_0x5c1d]
[_0x2c4d(0x1a1)](0x0)^0x42);}
return _0x4b2c1a[_0x2c4d(0x1a5)]('')===
'\\x16\\x36\\x1d\\x04\\x2c\\x20\\x27\\x15\\x31\\x29\\x2e\\x12\\x00\\x2d\\x14\\x01\\x29\\x11\\x35\\x2c\\x20\\x2e\\x14\\x01';}</code></pre>
                </div>
                
                <div class="deobfuscation-tools">
                    <h4>🛠️ Deobfuscation Tools</h4>
                    <button onclick="beautifyCode()" class="tool-btn">Beautify Code</button>
                    <button onclick="renameVariables()" class="tool-btn">Rename Variables</button>
                    <button onclick="decodeStrings()" class="tool-btn">Decode Strings</button>
                    <button onclick="simplifyControlFlow()" class="tool-btn">Simplify Control Flow</button>
                    <div id="deobfuscatedCode" class="deobfuscated-output"></div>
                </div>
                
                <div class="analysis-section">
                    <h4>📊 Code Analysis</h4>
                    <div id="analysisResults" class="analysis-results"></div>
                </div>
            </div>

            <div class="hints-section">
                <div class="hint-item" id="obfuscatedhint1">
                    <button onclick="toggleHint('obfuscatedhint1')" class="hint-btn">💡 Hint 1 (ฟรี)</button>
                    <div class="hint-content" style="display: none;">
                        Code ใช้ hex encoding และ XOR encryption กับค่า 0x42
                    </div>
                </div>
                <div class="hint-item" id="obfuscatedhint2">
                    <button onclick="toggleHint('obfuscatedhint2')" class="hint-btn">💡 Hint 2 (-10 pts)</button>
                    <div class="hint-content" style="display: none;">
                        Decode hex string แล้ว XOR แต่ละ byte ด้วย 0x42
                    </div>
                </div>
                <div class="hint-item" id="obfuscatedhint3">
                    <button onclick="toggleHint('obfuscatedhint3')" class="hint-btn">💡 Hint 3 (-10 pts)</button>
                    <div class="hint-content" style="display: none;">
                        Decoded string: "CTF{obfusc4t3d_c0d3}" → This is the flag!
                    </div>
                </div>
            </div>

            <div class="flag-submission">
                <h3>🚩 Submit Flag</h3>
                <input type="text" id="obfuscatedFlag" placeholder="CTF{...}" class="flag-input">
                <button onclick="submitInteractiveFlag('obfuscated', 'obfuscatedFlag', 'obfuscatedFlagResult')" class="submit-btn">Submit Flag</button>
                <div id="obfuscatedFlagResult" class="flag-result"></div>
            </div>
        </div>
    `;
}

function renderMalwareAnalysis() {
    return `
        <div class="challenge-container">
            <h2>🦠 Malware Behavior Analysis</h2>
            <p>วิเคราะห์ malware sample และหา C2 server address ที่ซ่อนอยู่ในโค้ด</p>
            
            <div class="interactive-box">
                <h3>⚠️ Malware Sample</h3>
                <div class="warning-box">
                    <p>⚠️ <strong>WARNING:</strong> This is a sandboxed simulation. Do not run real malware!</p>
                </div>
                
                <div class="malware-info">
                    <h4>📋 Sample Information</h4>
                    <table class="info-table">
                        <tr><td><strong>MD5:</strong></td><td>a3f2e1d4c5b6a7e8f9d0c1b2a3e4d5f6</td></tr>
                        <tr><td><strong>SHA256:</strong></td><td>1234567890abcdef...</td></tr>
                        <tr><td><strong>File Type:</strong></td><td>PE32 executable</td></tr>
                        <tr><td><strong>Size:</strong></td><td>245,760 bytes</td></tr>
                        <tr><td><strong>Packer:</strong></td><td>UPX (detected)</td></tr>
                    </table>
                </div>
                
                <div class="behavior-analysis">
                    <h4>🔬 Behavioral Analysis</h4>
                    <div class="behavior-log">
                        <div class="log-entry">Registry: Creates key HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run</div>
                        <div class="log-entry">Network: DNS query to update.windowsdefender[.]org</div>
                        <div class="log-entry">Network: TCP connection attempt to 185.220.101.42:443</div>
                        <div class="log-entry">File: Creates %TEMP%\\svchost32.exe</div>
                        <div class="log-entry">Process: Injects code into explorer.exe</div>
                    </div>
                </div>
                
                <div class="strings-analysis">
                    <h4>📝 Interesting Strings</h4>
                    <pre class="strings-output">
kernel32.dll
CreateProcessA
WriteProcessMemory
VirtualAllocEx
aHR0cDovLzE4NS4yMjAuMTAxLjQyOjgwODAvcGF5bG9hZA==
POST /beacon HTTP/1.1
User-Agent: Mozilla/5.0
cmd.exe /c
                    </pre>
                </div>
                
                <div class="analysis-tools">
                    <h4>🛠️ Analysis Tools</h4>
                    <button onclick="unpackMalware()" class="tool-btn">Unpack UPX</button>
                    <button onclick="analyzeStrings()" class="tool-btn">Analyze Strings</button>
                    <button onclick="decodeC2()" class="tool-btn">Decode C2 Address</button>
                    <button onclick="extractIOCs()" class="tool-btn">Extract IOCs</button>
                    <div id="malwareOutput" class="malware-output"></div>
                </div>
            </div>

            <div class="hints-section">
                <div class="hint-item" id="malwarehint1">
                    <button onclick="toggleHint('malwarehint1')" class="hint-btn">💡 Hint 1 (ฟรี)</button>
                    <div class="hint-content" style="display: none;">
                        มี Base64 encoded string ในส่วน strings analysis
                    </div>
                </div>
                <div class="hint-item" id="malwarehint2">
                    <button onclick="toggleHint('malwarehint2')" class="hint-btn">💡 Hint 2 (-10 pts)</button>
                    <div class="hint-content" style="display: none;">
                        Decode: aHR0cDovLzE4NS4yMjAuMTAxLjQyOjgwODAvcGF5bG9hZA== → http://185.220.101.42:8080/payload
                    </div>
                </div>
                <div class="hint-item" id="malwarehint3">
                    <button onclick="toggleHint('malwarehint3')" class="hint-btn">💡 Hint 3 (-10 pts)</button>
                    <div class="hint-content" style="display: none;">
                        C2 Server IP: 185.220.101.42 → Flag: CTF{m4lw4r3_4n4lys1s_c2}
                    </div>
                </div>
            </div>

            <div class="flag-submission">
                <h3>🚩 Submit Flag</h3>
                <input type="text" id="malwareFlag" placeholder="CTF{...}" class="flag-input">
                <button onclick="submitInteractiveFlag('malwareAnalysis', 'malwareFlag', 'malwareFlagResult')" class="submit-btn">Submit Flag</button>
                <div id="malwareFlagResult" class="flag-result"></div>
            </div>
        </div>
    `;
}

// ==========================================
// Mobile Security Challenges
// ==========================================

function renderAPKAnalysis() {
    return `
        <div class="challenge-container">
            <h2>📱 APK String Analysis</h2>
            <p>Decompile APK และหา hardcoded API key ที่ซ่อนอยู่ใน strings</p>
            
            <div class="interactive-box">
                <h3>📦 APK Information</h3>
                <div class="apk-info">
                    <table class="info-table">
                        <tr><td><strong>Package:</strong></td><td>com.example.secureapp</td></tr>
                        <tr><td><strong>Version:</strong></td><td>1.2.3 (Build 45)</td></tr>
                        <tr><td><strong>Min SDK:</strong></td><td>21 (Android 5.0)</td></tr>
                        <tr><td><strong>Size:</strong></td><td>8.5 MB</td></tr>
                        <tr><td><strong>Signature:</strong></td><td>SHA256withRSA</td></tr>
                    </table>
                </div>
                
                <div class="decompile-section">
                    <h4>🔍 Decompiled Code</h4>
                    <div class="code-tabs">
                        <button onclick="showAPKTab('manifest')" class="tab-btn active">AndroidManifest.xml</button>
                        <button onclick="showAPKTab('main')" class="tab-btn">MainActivity.java</button>
                        <button onclick="showAPKTab('api')" class="tab-btn">ApiClient.java</button>
                        <button onclick="showAPKTab('strings')" class="tab-btn">strings.xml</button>
                    </div>
                    
                    <div id="apkCodeView" class="code-view">
                        <pre class="apk-code"><code>
// ApiClient.java (Decompiled from DEX)
package com.example.secureapp;

import okhttp3.OkHttpClient;
import okhttp3.Request;

public class ApiClient {
    private static final String BASE_URL = "https://api.example.com";
    private static final String API_KEY = getKey();
    
    private static String getKey() {
        // Obfuscated API key
        byte[] encoded = new byte[]{
            0x41, 0x50, 0x49, 0x5f, 0x6b, 0x33, 0x79, 0x5f,
            0x73, 0x33, 0x63, 0x72, 0x33, 0x74, 0x5f, 0x34,
            0x70, 0x31, 0x6b, 0x33, 0x79
        };
        return new String(encoded);
    }
    
    public String makeRequest(String endpoint) {
        Request request = new Request.Builder()
            .url(BASE_URL + endpoint)
            .addHeader("X-API-Key", API_KEY)
            .build();
        // ... rest of code
    }
}
                        </code></pre>
                    </div>
                </div>
                
                <div class="apk-tools">
                    <h4>🛠️ Analysis Tools</h4>
                    <button onclick="decompileAPK()" class="tool-btn">Decompile APK</button>
                    <button onclick="extractStrings()" class="tool-btn">Extract Strings</button>
                    <button onclick="decodeAPIKey()" class="tool-btn">Decode API Key</button>
                    <button onclick="searchSecrets()" class="tool-btn">Search Secrets</button>
                    <div id="apkOutput" class="apk-output"></div>
                </div>
            </div>

            <div class="hints-section">
                <div class="hint-item" id="apkhint1">
                    <button onclick="toggleHint('apkhint1')" class="hint-btn">💡 Hint 1 (ฟรี)</button>
                    <div class="hint-content" style="display: none;">
                        ใช้ apktool หรือ jadx เพื่อ decompile APK file
                    </div>
                </div>
                <div class="hint-item" id="apkhint2">
                    <button onclick="toggleHint('apkhint2')" class="hint-btn">💡 Hint 2 (-10 pts)</button>
                    <div class="hint-content" style="display: none;">
                        API key ถูก encode เป็น byte array ใน getKey() method
                    </div>
                </div>
                <div class="hint-item" id="apkhint3">
                    <button onclick="toggleHint('apkhint3')" class="hint-btn">💡 Hint 3 (-10 pts)</button>
                    <div class="hint-content" style="display: none;">
                        Decoded bytes: "API_k3y_s3cr3t_4p1k3y" → Flag: CTF{4pk_str1ng_4n4lys1s}
                    </div>
                </div>
            </div>

            <div class="flag-submission">
                <h3>🚩 Submit Flag</h3>
                <input type="text" id="apkFlag" placeholder="CTF{...}" class="flag-input">
                <button onclick="submitInteractiveFlag('apkAnalysis', 'apkFlag', 'apkFlagResult')" class="submit-btn">Submit Flag</button>
                <div id="apkFlagResult" class="flag-result"></div>
            </div>
        </div>
    `;
}

function renderRootDetection() {
    return `
        <div class="challenge-container">
            <h2>🔓 Root Detection Bypass</h2>
            <p>Android app มี root detection ให้ bypass mechanism และรัน app บน rooted device</p>
            
            <div class="interactive-box">
                <h3>🛡️ Root Detection Mechanism</h3>
                <div class="detection-code">
                    <h4>📄 SecurityCheck.java</h4>
                    <pre class="detection-code-view"><code>
public class SecurityCheck {
    
    public static boolean isDeviceRooted() {
        // Check 1: Common root files
        if (checkRootFiles()) return true;
        
        // Check 2: Superuser app
        if (checkSuperuserApp()) return true;
        
        // Check 3: Test-keys build
        if (checkBuildTags()) return true;
        
        // Check 4: Execute su command
        if (checkSuCommand()) return true;
        
        return false;
    }
    
    private static boolean checkRootFiles() {
        String[] rootFiles = {
            "/system/app/Superuser.apk",
            "/system/xbin/su",
            "/system/bin/su",
            "/sbin/su",
            "/data/local/xbin/su",
            "/data/local/bin/su"
        };
        
        for (String file : rootFiles) {
            if (new File(file).exists()) {
                return true;
            }
        }
        return false;
    }
    
    private static boolean checkSuCommand() {
        Process process = null;
        try {
            process = Runtime.getRuntime().exec("su");
            return true;
        } catch (Exception e) {
            return false;
        }
    }
    
    // Flag is revealed when bypass is successful
    private static String getFlag() {
        return "CTF{r00t_d3t3ct10n_byp4ss}";
    }
}
                    </code></pre>
                </div>
                
                <div class="bypass-tools">
                    <h4>🔧 Bypass Tools</h4>
                    <button onclick="patchSMali()" class="tool-btn">Patch Smali Code</button>
                    <button onclick="hookWithFrida()" class="tool-btn">Hook with Frida</button>
                    <button onclick="modifyAPK()" class="tool-btn">Modify & Rebuild APK</button>
                    <button onclick="testBypass()" class="tool-btn">Test Bypass</button>
                    <div id="bypassOutput" class="bypass-output"></div>
                </div>
                
                <div class="frida-script">
                    <h4>📝 Frida Script Example</h4>
                    <pre class="frida-code"><code>
Java.perform(function() {
    var SecurityCheck = Java.use("com.example.secureapp.SecurityCheck");
    
    SecurityCheck.isDeviceRooted.implementation = function() {
        console.log("[*] Root check bypassed!");
        return false; // Always return false
    };
    
    SecurityCheck.getFlag.implementation = function() {
        var flag = this.getFlag();
        console.log("[*] Flag captured: " + flag);
        return flag;
    };
});
                    </code></pre>
                </div>
            </div>

            <div class="hints-section">
                <div class="hint-item" id="roothint1">
                    <button onclick="toggleHint('roothint1')" class="hint-btn">💡 Hint 1 (ฟรี)</button>
                    <div class="hint-content" style="display: none;">
                        ใช้ Frida เพื่อ hook isDeviceRooted() method และ return false
                    </div>
                </div>
                <div class="hint-item" id="roothint2">
                    <button onclick="toggleHint('roothint2')" class="hint-btn">💡 Hint 2 (-10 pts)</button>
                    <div class="hint-content" style="display: none;">
                        หรือใช้ apktool patch smali code ให้ return 0 (false) แทน 1 (true)
                    </div>
                </div>
                <div class="hint-item" id="roothint3">
                    <button onclick="toggleHint('roothint3')" class="hint-btn">💡 Hint 3 (-10 pts)</button>
                    <div class="hint-content" style="display: none;">
                        เมื่อ bypass สำเร็จ getFlag() จะ return: CTF{r00t_d3t3ct10n_byp4ss}
                    </div>
                </div>
            </div>

            <div class="flag-submission">
                <h3>🚩 Submit Flag</h3>
                <input type="text" id="rootFlag" placeholder="CTF{...}" class="flag-input">
                <button onclick="submitInteractiveFlag('rootDetection', 'rootFlag', 'rootFlagResult')" class="submit-btn">Submit Flag</button>
                <div id="rootFlagResult" class="flag-result"></div>
            </div>
        </div>
    `;
}

function renderSSLPinning() {
    return `
        <div class="challenge-container">
            <h2>🔒 SSL Pinning Bypass</h2>
            <p>Mobile app ใช้ SSL Certificate Pinning ให้ bypass เพื่อ intercept HTTPS traffic</p>
            
            <div class="interactive-box">
                <h3>📱 SSL Pinning Implementation</h3>
                <div class="pinning-code">
                    <h4>📄 NetworkSecurityConfig.xml</h4>
                    <pre class="xml-code"><code>
&lt;?xml version="1.0" encoding="utf-8"?&gt;
&lt;network-security-config&gt;
    &lt;domain-config cleartextTrafficPermitted="false"&gt;
        &lt;domain includeSubdomains="true"&gt;api.example.com&lt;/domain&gt;
        &lt;pin-set expiration="2025-12-31"&gt;
            &lt;pin digest="SHA-256"&gt;7HIpactkIAq2Y49orFOOQKurWxmmSFZhBCoQYcRhJ3Y=&lt;/pin&gt;
            &lt;pin digest="SHA-256"&gt;YLh1dUR9y6Kja30RrAn7JKnbQG/uEtLMkBgFF2Fuihg=&lt;/pin&gt;
        &lt;/pin-set&gt;
    &lt;/domain-config&gt;
&lt;/network-security-config&gt;
                    </code></pre>
                    
                    <h4>📄 Custom Certificate Pinning (Code)</h4>
                    <pre class="java-code"><code>
public class ApiClient {
    private static OkHttpClient createClient() {
        CertificatePinner certificatePinner = new CertificatePinner.Builder()
            .add("api.example.com", 
                 "sha256/7HIpactkIAq2Y49orFOOQKurWxmmSFZhBCoQYcRhJ3Y=")
            .add("api.example.com", 
                 "sha256/YLh1dUR9y6Kja30RrAn7JKnbQG/uEtLMkBgFF2Fuihg=")
            .build();
        
        return new OkHttpClient.Builder()
            .certificatePinner(certificatePinner)
            .build();
    }
}
                    </code></pre>
                </div>
                
                <div class="bypass-methods">
                    <h4>🛠️ Bypass Methods</h4>
                    <div class="method-tabs">
                        <button onclick="showBypassMethod('frida')" class="method-btn active">Frida</button>
                        <button onclick="showBypassMethod('objection')" class="method-btn">Objection</button>
                        <button onclick="showBypassMethod('xposed')" class="method-btn">Xposed</button>
                        <button onclick="showBypassMethod('manual')" class="method-btn">Manual Patch</button>
                    </div>
                    
                    <div id="bypassMethodContent" class="method-content">
                        <h5>Frida Script for SSL Pinning Bypass</h5>
                        <pre class="bypass-script"><code>
Java.perform(function() {
    // OkHttp3 CertificatePinner bypass
    var CertificatePinner = Java.use("okhttp3.CertificatePinner");
    CertificatePinner.check.overload('java.lang.String', 
        'java.util.List').implementation = function() {
        console.log("[*] SSL Pinning bypassed for: " + arguments[0]);
        return;
    };
    
    // TrustManager bypass
    var TrustManager = Java.use("javax.net.ssl.X509TrustManager");
    var SSLContext = Java.use("javax.net.ssl.SSLContext");
    
    var TrustManagers = [TrustManager.$new()];
    var SSLContext_init = SSLContext.init.overload(
        '[Ljavax.net.ssl.KeyManager;',
        '[Ljavax.net.ssl.TrustManager;',
        'java.security.SecureRandom'
    );
    
    SSLContext_init.implementation = function(keyManager, trustManager, secureRandom) {
        console.log("[*] SSLContext.init() bypassed");
        SSLContext_init.call(this, keyManager, TrustManagers, secureRandom);
    };
});
                        </code></pre>
                    </div>
                </div>
                
                <div class="intercept-section">
                    <h4>🎯 Intercepted Traffic</h4>
                    <button onclick="startInterception()" class="tool-btn">Start Burp Suite</button>
                    <button onclick="captureRequest()" class="tool-btn">Capture Request</button>
                    <div id="interceptedData" class="intercepted-data">
                        <p>Start interception to view HTTPS traffic...</p>
                    </div>
                </div>
            </div>

            <div class="hints-section">
                <div class="hint-item" id="sslhint1">
                    <button onclick="toggleHint('sslhint1')" class="hint-btn">💡 Hint 1 (ฟรี)</button>
                    <div class="hint-content" style="display: none;">
                        ใช้ Frida + objection เพื่อ bypass SSL pinning แบบ runtime
                    </div>
                </div>
                <div class="hint-item" id="sslhint2">
                    <button onclick="toggleHint('sslhint2')" class="hint-btn">💡 Hint 2 (-10 pts)</button>
                    <div class="hint-content" style="display: none;">
                        Command: objection -g com.example.app explore --startup-command "android sslpinning disable"
                    </div>
                </div>
                <div class="hint-item" id="sslhint3">
                    <button onclick="toggleHint('sslhint3')" class="hint-btn">💡 Hint 3 (-10 pts)</button>
                    <div class="hint-content" style="display: none;">
                        หลัง bypass แล้ว intercept request จะเห็น flag: CTF{ssl_p1nn1ng_byp4ss}
                    </div>
                </div>
            </div>

            <div class="flag-submission">
                <h3>🚩 Submit Flag</h3>
                <input type="text" id="sslPinFlag" placeholder="CTF{...}" class="flag-input">
                <button onclick="submitInteractiveFlag('sslPinning', 'sslPinFlag', 'sslPinFlagResult')" class="submit-btn">Submit Flag</button>
                <div id="sslPinFlagResult" class="flag-result"></div>
            </div>
        </div>
    `;
}

function renderNativeLib() {
    return `
        <div class="challenge-container">
            <h2>🔧 Native Library Analysis</h2>
            <p>Android app ใช้ native library (.so file) ให้ reverse และหา flag ที่ซ่อนอยู่</p>
            
            <div class="interactive-box">
                <h3>📚 Native Library Info</h3>
                <div class="native-info">
                    <table class="info-table">
                        <tr><td><strong>Library:</strong></td><td>libnative-lib.so</td></tr>
                        <tr><td><strong>Architecture:</strong></td><td>ARM64-v8a</td></tr>
                        <tr><td><strong>Size:</strong></td><td>1.2 MB</td></tr>
                        <tr><td><strong>Stripped:</strong></td><td>No (symbols present)</td></tr>
                    </table>
                </div>
                
                <div class="jni-code">
                    <h4>📄 JNI Bridge (Java)</h4>
                    <pre class="java-code"><code>
public class NativeLib {
    static {
        System.loadLibrary("native-lib");
    }
    
    public native String getSecretKey();
    public native boolean validateLicense(String key);
    public native String decryptFlag(byte[] encrypted);
}
                    </code></pre>
                </div>
                
                <div class="native-disasm">
                    <h4>🔍 Disassembly (IDA/Ghidra)</h4>
                    <pre class="disasm-code"><code>
Java_com_example_app_NativeLib_getSecretKey:
    SUB     SP, SP, #0x20
    STP     X29, X30, [SP, #0x10]
    
    ; String obfuscation
    ADRP    X0, #encrypted_data@PAGE
    ADD     X0, X0, #encrypted_data@PAGEOFF
    MOV     X1, #0x20
    BL      _xor_decrypt
    
    ; X0 now contains decrypted string
    MOV     X2, X0
    LDR     X0, [X19]
    LDR     X1, [X0, #0x298]  ; NewStringUTF
    BLR     X1
    
    LDP     X29, X30, [SP, #0x10]
    ADD     SP, SP, #0x20
    RET

encrypted_data:
    .byte 0x1F, 0x16, 0x1D, 0x5E, 0x27, 0x10, 0x33, 0x16
    .byte 0x21, 0x04, 0x36, 0x14, 0x5F, 0x27, 0x04, 0x37
    .byte 0x21, 0x36, 0x14, 0x5F, 0x27, 0x04, 0x27, 0x5D

_xor_decrypt:
    ; XOR each byte with 0x42
    MOV     X2, #0
.loop:
    CMP     X2, X1
    B.GE    .done
    LDRB    W3, [X0, X2]
    EOR     W3, W3, #0x42
    STRB    W3, [X0, X2]
    ADD     X2, X2, #1
    B       .loop
.done:
    RET
                    </code></pre>
                </div>
                
                <div class="native-tools">
                    <h4>🛠️ Analysis Tools</h4>
                    <button onclick="loadInGhidra()" class="tool-btn">Load in Ghidra</button>
                    <button onclick="extractStrings()" class="tool-btn">Extract Strings</button>
                    <button onclick="decryptNative()" class="tool-btn">Decrypt Data</button>
                    <button onclick="callNativeFunction()" class="tool-btn">Call Native Function</button>
                    <div id="nativeOutput" class="native-output"></div>
                </div>
            </div>

            <div class="hints-section">
                <div class="hint-item" id="nativehint1">
                    <button onclick="toggleHint('nativehint1')" class="hint-btn">💡 Hint 1 (ฟรี)</button>
                    <div class="hint-content" style="display: none;">
                        ใช้ Ghidra หรือ IDA Pro เพื่อ disassemble .so file
                    </div>
                </div>
                <div class="hint-item" id="nativehint2">
                    <button onclick="toggleHint('nativehint2')" class="hint-btn">💡 Hint 2 (-10 pts)</button>
                    <div class="hint-content" style="display: none;">
                        Data ถูก XOR encrypt ด้วยค่า 0x42 ใน _xor_decrypt function
                    </div>
                </div>
                <div class="hint-item" id="nativehint3">
                    <button onclick="toggleHint('nativehint3')" class="hint-btn">💡 Hint 3 (-10 pts)</button>
                    <div class="hint-content" style="display: none;">
                        XOR decrypt ทุก byte แล้วได้: "CTF{n4t1v3_l1br4ry_r3v}" 
                    </div>
                </div>
            </div>

            <div class="flag-submission">
                <h3>🚩 Submit Flag</h3>
                <input type="text" id="nativeFlag" placeholder="CTF{...}" class="flag-input">
                <button onclick="submitInteractiveFlag('nativeLib', 'nativeFlag', 'nativeFlagResult')" class="submit-btn">Submit Flag</button>
                <div id="nativeFlagResult" class="flag-result"></div>
            </div>
        </div>
    `;
}

// ==========================================
// Interactive Challenge Logic Functions
// ==========================================

// SQL Injection
window.checkSQLLogin = function() {
    const username = document.getElementById('sqlUsername').value;
    const password = document.getElementById('sqlPassword').value;
    const result = document.getElementById('sqlResult');
    const query = document.getElementById('sqlQuery');
    
    query.textContent = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
    
    if (username.includes("'") || username.toLowerCase().includes('or') || 
        username.includes('--') || username.includes('#') ||
        username.toLowerCase().includes('union') ||
        (username.toLowerCase().includes('admin') && (username.includes("'") || username.includes('--')))) {
        result.innerHTML = '<p class="success">✅ Login successful! Flag revealed: CTF{sql_1nj3ct10n_byp4ss}</p>';
        result.style.color = 'var(--success)';
    } else if (username === '' || password === '') {
        result.innerHTML = '<p class="error">❌ Please enter username and password</p>';
        result.style.color = 'var(--danger)';
    } else {
        result.innerHTML = '<p class="error">❌ Login failed! Invalid credentials.</p>';
        result.style.color = 'var(--danger)';
    }
};

// Command Injection
window.executePing = function() {
    const input = document.getElementById('cmdInput').value;
    const output = document.getElementById('cmdOutput');
    
    if (!input) {
        output.innerHTML = '<div class="output-line error">Error: Please enter an IP address</div>';
        return;
    }
    
    output.innerHTML = `<div class="output-line">$ ping ${input}</div>`;
    
    if (input.includes(';') || input.includes('&&') || input.includes('||') || input.includes('|')) {
        const commands = input.split(/[;&|]+/);
        commands.forEach(cmd => {
            cmd = cmd.trim();
            if (cmd.toLowerCase().includes('ls') || cmd.toLowerCase().includes('dir')) {
                output.innerHTML += `<div class="output-line">secret.txt</div>`;
                output.innerHTML += `<div class="output-line">index.html</div>`;
                output.innerHTML += `<div class="output-line">config.php</div>`;
            } else if (cmd.toLowerCase().includes('cat secret.txt') || cmd.toLowerCase().includes('type secret.txt')) {
                output.innerHTML += `<div class="output-line success">🚩 Flag found: CTF{c0mm4nd_1nj3ct10n_pwn3d}</div>`;
            } else if (cmd.toLowerCase().includes('whoami')) {
                output.innerHTML += `<div class="output-line">www-data</div>`;
            } else if (cmd.toLowerCase().includes('pwd')) {
                output.innerHTML += `<div class="output-line">/var/www/html</div>`;
            } else if (cmd.includes('ping')) {
                output.innerHTML += `<div class="output-line">PING ${cmd.replace('ping', '').trim()} (127.0.0.1) 56(84) bytes of data.</div>`;
                output.innerHTML += `<div class="output-line">64 bytes from 127.0.0.1: icmp_seq=1 ttl=64 time=0.050 ms</div>`;
            }
        });
    } else {
        output.innerHTML += `<div class="output-line">PING ${input} (127.0.0.1) 56(84) bytes of data.</div>`;
        output.innerHTML += `<div class="output-line">64 bytes from 127.0.0.1: icmp_seq=1 ttl=64 time=0.050 ms</div>`;
    }
};

// XSS
window.submitXSSComment = function() {
    const input = document.getElementById('xssInput').value;
    const display = document.getElementById('xssDisplay');
    
    if (!input) {
        display.innerHTML = '<p class="xss-note">⚠️ Please enter a comment</p>';
        return;
    }
    
    let sanitized = input.replace(/<script>/gi, '[BLOCKED]').replace(/<\/script>/gi, '[BLOCKED]');
    
    if (input.toLowerCase().includes('onerror') || input.toLowerCase().includes('onload') || 
        input.toLowerCase().includes('onclick') || input.toLowerCase().includes('onfocus') ||
        input.toLowerCase().includes('onmouseover')) {
        display.innerHTML = `
            <p class="xss-note">🔒 XSS Filter Active: &lt;script&gt; tags are blocked</p>
            <div class="comment-display">
                <p><strong>Your comment:</strong></p>
                <div class="xss-success">✅ XSS Detected! Event handler bypass successful!</div>
                <div class="xss-success">🚩 Flag: CTF{xss_c00k13_st34l3r}</div>
            </div>
        `;
    } else {
        display.innerHTML = `
            <p class="xss-note">🔒 XSS Filter Active: &lt;script&gt; tags are blocked</p>
            <div class="comment-display">
                <p><strong>Your comment:</strong></p>
                <p>${sanitized}</p>
            </div>
        `;
    }
};
// Part 6: Crypto and Forensics Interactive Logic Functions

// ==========================================
// JWT Functions
// ==========================================

window.decodeJWT = function() {
    const token = document.getElementById('jwtToken').value;
    const output = document.getElementById('jwtDecoded');
    
    try {
        const parts = token.split('.');
        if (parts.length !== 3) {
            output.innerHTML = '<p class="error">Invalid JWT format</p>';
            return;
        }
        
        const header = JSON.parse(atob(parts[0]));
        const payload = JSON.parse(atob(parts[1]));
        
        output.innerHTML = `
            <div class="jwt-decoded">
                <h4>Header:</h4>
                <pre>${JSON.stringify(header, null, 2)}</pre>
                <h4>Payload:</h4>
                <pre>${JSON.stringify(payload, null, 2)}</pre>
                <p class="success">💡 Hint: ลองเปลี่ยน role เป็น "admin" และ algorithm เป็น "none"</p>
                <p class="success">🚩 Flag: CTF{jwt_alg0r1thm_c0nfus10n}</p>
            </div>
        `;
    } catch (e) {
        output.innerHTML = '<p class="error">Error decoding JWT</p>';
    }
};

// ==========================================
// Crypto Decoder Functions
// ==========================================

window.decodeROT13 = function() {
    const input = document.getElementById('rot13Input').value;
    const output = document.getElementById('rot13Output');
    
    if (!input) {
        output.innerHTML = '<p class="error">Please enter text to decode</p>';
        return;
    }
    
    const decoded = input.replace(/[a-zA-Z]/g, c => 
        String.fromCharCode((c <= 'Z' ? 90 : 122) >= (c = c.charCodeAt(0) + 13) ? c : c - 26)
    );
    output.innerHTML = `<p class="success">Result: <code>${decoded}</code></p>`;
};

window.decodeBase64 = function() {
    const input = document.getElementById('base64Input').value;
    const output = document.getElementById('base64Output');
    
    if (!input) {
        output.innerHTML = '<p class="error">Please enter Base64 text</p>';
        return;
    }
    
    try {
        const decoded = atob(input);
        output.innerHTML = `<p class="success">Result: <code>${decoded}</code></p>`;
    } catch (e) {
        output.innerHTML = '<p class="error">Error: Invalid Base64</p>';
    }
};

window.decodeCaesar = function() {
    const input = document.getElementById('caesarInput').value;
    const shift = parseInt(document.getElementById('caesarShift').value) || 13;
    const output = document.getElementById('caesarOutput');
    
    if (!input) {
        output.innerHTML = '<p class="error">Please enter text to decode</p>';
        return;
    }
    
    const decoded = input.replace(/[a-zA-Z]/g, c => {
        const code = c.charCodeAt(0);
        const base = code >= 65 && code <= 90 ? 65 : 97;
        return String.fromCharCode(((code - base - shift + 26) % 26) + base);
    });
    output.innerHTML = `<p class="success">Result: <code>${decoded}</code></p>`;
};

// ==========================================
// XOR Functions
// ==========================================

window.tryXORKey = function() {
    const key = parseInt(document.getElementById('xorKey').value);
    const output = document.getElementById('xorOutput');
    
    if (isNaN(key) || key < 0 || key > 255) {
        output.innerHTML = '<p class="error">Please enter a valid key (0-255)</p>';
        return;
    }
    
    const encrypted = '1c060b1e454c1e1a454c151b0a1e';
    const bytes = encrypted.match(/.{1,2}/g).map(byte => parseInt(byte, 16));
    const decrypted = bytes.map(b => String.fromCharCode(b ^ key)).join('');
    
    const isPrintable = /^[\x20-\x7E]+$/.test(decrypted);
    
    if (isPrintable) {
        output.innerHTML = `
            <p class="success">Key ${key}: <code>${decrypted}</code></p>
            ${decrypted.includes('CTF') ? '<p class="success">🚩 Flag found!</p>' : ''}
        `;
    } else {
        output.innerHTML = `<p>Key ${key}: Not readable text</p>`;
    }
};

window.bruteForceXOR = function() {
    const output = document.getElementById('xorOutput');
    const encrypted = '1c060b1e454c1e1a454c151b0a1e';
    const bytes = encrypted.match(/.{1,2}/g).map(byte => parseInt(byte, 16));
    
    let results = '<h4>Brute Force Results:</h4>';
    let flagFound = false;
    
    for (let key = 0; key < 256; key++) {
        const decrypted = bytes.map(b => String.fromCharCode(b ^ key)).join('');
        const isPrintable = /^[\x20-\x7E]+$/.test(decrypted);
        
        if (isPrintable && decrypted.length > 5) {
            results += `<p>Key ${key}: <code>${decrypted}</code></p>`;
            if (decrypted.includes('CTF')) {
                results += '<p class="success">🚩 Flag found!</p>';
                flagFound = true;
            }
        }
    }
    
    output.innerHTML = results;
};

// ==========================================
// Custom Cipher Analysis Functions
// ==========================================

window.analyzeFrequency = function() {
    const output = document.getElementById('analysisOutput');
    output.innerHTML = `
        <h5>Frequency Analysis:</h5>
        <p>Most common: p(3), e(3), s(2), r(2)</p>
        <p>Suggests English text with substitution</p>
    `;
};

window.tryCommonSubstitutions = function() {
    const output = document.getElementById('analysisOutput');
    output.innerHTML = `
        <h5>Common Substitutions:</h5>
        <p>Trying ROT13: Ckigdc_c1fx3r_fr0e3a</p>
        <p>Trying Caesar: Not matching...</p>
    `;
};

window.reverseString = function() {
    const output = document.getElementById('analysisOutput');
    output.innerHTML = `
        <h5>Reversed String:</h5>
        <p>n3r0es_e3ks1c_potsxP</p>
        <p class="success">💡 Try decoding with position-based shift!</p>
    `;
};

// ==========================================
// EXIF Data Functions
// ==========================================

window.viewExifData = function() {
    const output = document.getElementById('exifOutput');
    output.innerHTML = `
        <div class="exif-data">
            <h5>📋 EXIF Metadata:</h5>
            <table style="width: 100%; color: var(--text);">
                <tr><td><strong>Camera:</strong></td><td>Canon EOS 5D</td></tr>
                <tr><td><strong>Date Taken:</strong></td><td>2024:01:15 14:23:45</td></tr>
                <tr><td><strong>Resolution:</strong></td><td>600x400</td></tr>
                <tr><td><strong>Artist:</strong></td><td style="color: var(--primary);">CTF{ex1f_h1dd3n_m3ss4g3}</td></tr>
                <tr><td><strong>Comment:</strong></td><td>Happy Birthday!</td></tr>
                <tr><td><strong>Software:</strong></td><td>Adobe Photoshop CS6</td></tr>
            </table>
        </div>
    `;
};

// ==========================================
// Geolocation Functions
// ==========================================

window.openGoogleMaps = function() {
    window.open('https://www.google.com/maps?q=13.7563,100.5018', '_blank');
};

window.reverseGeocode = function() {
    const output = document.getElementById('locationOutput');
    output.innerHTML = `
        <div class="location-info">
            <h5>📍 Location Found:</h5>
            <p><strong>City:</strong> Bangkok</p>
            <p><strong>Country:</strong> Thailand</p>
            <p><strong>Landmark:</strong> Near Grand Palace</p>
            <p style="color: var(--primary); margin-top: 10px;">
                💡 Hint: Convert "Bangkok" to MD5 hash for the flag
            </p>
        </div>
    `;
};

// ==========================================
// Steganography Functions
// ==========================================

window.extractHiddenFile = function() {
    const output = document.getElementById('stegoOutput');
    output.innerHTML = `
        <div class="stego-result">
            <h5>🔍 Extraction Results:</h5>
            <p class="success">✅ Found hidden file: secret.txt</p>
            <p>File size: 128 bytes</p>
            <p>Content type: Text</p>
            <div style="margin-top: 10px; padding: 10px; background: rgba(0,0,0,0.3); border-radius: 5px;">
                <strong>File contents (Base64):</strong><br>
                <code>Q1RGe3N0M2c0bjBncjRwaHlfbTRzdDNyfQ==</code>
            </div>
            <p style="color: var(--primary); margin-top: 10px;">
                💡 Decode this Base64 string to get the flag!
            </p>
        </div>
    `;
};

window.checkLSB = function() {
    const output = document.getElementById('stegoOutput');
    output.innerHTML = `
        <div class="stego-result">
            <h5>🔬 LSB Analysis:</h5>
            <p>Checking least significant bits...</p>
            <p class="success">✅ Hidden data detected in LSB!</p>
            <p>Pattern: Binary sequence found</p>
            <p style="color: var(--warning);">
                ⚠️ Try extracting the hidden file first
            </p>
        </div>
    `;
};

window.runStrings = function() {
    const output = document.getElementById('stegoOutput');
    output.innerHTML = `
        <div class="stego-result">
            <h5>📄 Strings Output:</h5>
            <pre style="max-height: 200px; overflow-y: auto; background: rgba(0,0,0,0.3); padding: 10px; border-radius: 5px;">
PNG
IHDR
gAMA
bKGD
pHYs
IDAT
secret.txt
Q1RGe3N0M2c0bjBncjRwaHlfbTRzdDNyfQ==
IEND
            </pre>
            <p class="success">✅ Found Base64 string in image!</p>
        </div>
    `;
};

// ==========================================
// Disk Analysis Functions
// ==========================================

window.mountDisk = function() {
    const output = document.getElementById('diskOutput');
    output.innerHTML = `
        <div class="disk-result">
            <h5>💿 Mounting Disk Image...</h5>
            <p class="success">✅ Disk mounted successfully at /mnt/evidence</p>
            <p>Filesystem: EXT4</p>
            <p>Mount point: /mnt/evidence</p>
            <p>Status: Read-only</p>
            <div style="margin-top: 10px;">
                <strong>Directory listing:</strong>
                <pre style="background: rgba(0,0,0,0.3); padding: 10px; border-radius: 5px;">
drwxr-xr-x  2 root root 4096 Jan 15 10:30 documents
drwxr-xr-x  2 root root 4096 Jan 15 10:31 photos
-rw-r--r--  1 root root 1024 Jan 15 10:32 notes.txt
                </pre>
            </div>
        </div>
    `;
};

window.recoverFiles = function() {
    const output = document.getElementById('diskOutput');
    output.innerHTML = `
        <div class="disk-result">
            <h5>🔄 Recovering Deleted Files...</h5>
            <p>Scanning filesystem for deleted inodes...</p>
            <p class="success">✅ Found 3 deleted files:</p>
            <ul style="margin-left: 20px;">
                <li>secret.txt (256 bytes) - <span style="color: var(--success);">Recoverable</span></li>
                <li>backup.zip (2.1 MB) - <span style="color: var(--warning);">Partially recoverable</span></li>
                <li>temp.log (512 bytes) - <span style="color: var(--danger);">Overwritten</span></li>
            </ul>
            <div style="margin-top: 10px; padding: 10px; background: rgba(0,255,136,0.1); border-left: 3px solid var(--success); border-radius: 5px;">
                <strong>secret.txt contents:</strong><br>
                <code>CTF{d1sk_4n4lys1s_pr0}</code>
            </div>
        </div>
    `;
};
// Part 4: Interactive Logic Functions for Network, Reverse Engineering, and Mobile Challenges

// ==========================================
// Network Challenge Functions
// ==========================================

// Packet Sniffer Basic
window.capturePackets = function() {
    const display = document.getElementById('packetDisplay');
    
    const packets = [
        { time: '14:32:01.234', proto: 'TCP', src: '192.168.1.100:52341', dst: '10.0.0.5:80', info: 'SYN' },
        { time: '14:32:01.256', proto: 'TCP', src: '10.0.0.5:80', dst: '192.168.1.100:52341', info: 'SYN, ACK' },
        { time: '14:32:01.257', proto: 'HTTP', src: '192.168.1.100:52341', dst: '10.0.0.5:80', info: 'GET /index.html' },
        { time: '14:32:02.123', proto: 'HTTP', src: '192.168.1.100:52342', dst: '10.0.0.5:80', info: 'POST /login', highlight: true },
        { time: '14:32:02.234', proto: 'HTTP', src: '10.0.0.5:80', dst: '192.168.1.100:52342', info: '200 OK' },
    ];
    
    display.innerHTML = '<div class="packet-header">Captured Packets:</div>';
    packets.forEach((packet, i) => {
        display.innerHTML += `
            <div class="packet-row ${packet.highlight ? 'highlight' : ''}" onclick="showPacketDetails(${i})">
                <span class="packet-time">${packet.time}</span>
                <span class="packet-proto">${packet.proto}</span>
                <span class="packet-src">${packet.src}</span>
                <span class="packet-dst">${packet.dst}</span>
                <span class="packet-info">${packet.info}</span>
            </div>
        `;
    });
};

window.showPacketDetails = function(index) {
    const info = document.getElementById('packetInfo');
    
    if (index === 3) { // POST /login packet
        info.innerHTML = `
            <h5>📦 Packet #${index + 1} Details:</h5>
            <pre class="packet-detail">
POST /login HTTP/1.1
Host: 10.0.0.5
Content-Type: application/x-www-form-urlencoded
Content-Length: 38
Authorization: Basic YWRtaW46cDRzc3cwcmQ=

username=admin&password=p4ssw0rd
            </pre>
            <p class="success">💡 Found Base64 encoded credentials in Authorization header!</p>
            <p class="success">Decoded: admin:p4ssw0rd</p>
            <p class="success">🚩 Flag: CTF{p4ck3t_sn1ff3r_b4s1c}</p>
        `;
    } else {
        info.innerHTML = `
            <h5>📦 Packet #${index + 1} Details:</h5>
            <p>Standard TCP/HTTP packet - no sensitive data found.</p>
        `;
    }
};

window.filterHTTP = function() {
    showToast('Filtering HTTP packets...', 'info');
    setTimeout(() => {
        showPacketDetails(3);
    }, 500);
};

window.stopCapture = function() {
    showToast('Capture stopped', 'info');
};

window.exportPCAP = function() {
    showToast('PCAP exported to download folder', 'success');
};

// DNS Tunneling
window.extractDNSData = function() {
    const output = document.getElementById('dnsOutput');
    const hexData = ['4E54', '6D30', '646E', '735F', '3474', '3734', '6E6E', '3331', '5F33', '7874', '7234', '6374'];
    
    output.innerHTML = `
        <h5>📝 Extracted Hex Data:</h5>
        <p><code>${hexData.join(' ')}</code></p>
        <p class="success">✅ Successfully extracted ${hexData.length} hex chunks</p>
    `;
};

window.decodeDNSHex = function() {
    const output = document.getElementById('dnsOutput');
    const hexString = '4E546D30646E735F34747734746E6E33315F33787472346374';
    
    let decoded = '';
    for (let i = 0; i < hexString.length; i += 2) {
        decoded += String.fromCharCode(parseInt(hexString.substr(i, 2), 16));
    }
    
    output.innerHTML = `
        <h5>🔓 Decoded Hex:</h5>
        <p>Combined hex: <code>${hexString}</code></p>
        <p>Decoded ASCII: <code>${decoded}</code></p>
    `;
};

window.reconstructDNS = function() {
    const output = document.getElementById('dnsOutput');
    
    output.innerHTML = `
        <h5>✅ Reconstructed Message:</h5>
        <p class="success">Message: <code>dns_tunn31_3xtr4ct</code></p>
        <p class="success">🚩 Flag: <code>CTF{dns_tunn31_3xtr4ct}</code></p>
    `;
};

// ARP Spoofing
window.sendARPReply = function() {
    const output = document.getElementById('arpOutput');
    
    output.innerHTML = `
        <div class="arp-result">
            <p class="success">✅ ARP Reply sent!</p>
            <p>Target: 192.168.1.100 (Victim)</p>
            <p>Spoofed: 192.168.1.1 is at aa:bb:cc:dd:ee:ff (Your MAC)</p>
            <p style="color: var(--warning);">⚠️ Victim's ARP cache poisoned!</p>
        </div>
    `;
};

window.enableForwarding = function() {
    const output = document.getElementById('arpOutput');
    
    output.innerHTML = `
        <div class="arp-result">
            <p class="success">✅ IP Forwarding enabled!</p>
            <p>Command: echo 1 > /proc/sys/net/ipv4/ip_forward</p>
            <p>Traffic will be relayed transparently</p>
        </div>
    `;
};

window.interceptTraffic = function() {
    const trafficLog = document.getElementById('trafficLog');
    
    trafficLog.innerHTML = `
        <div class="traffic-entry">
            <strong>HTTP Request:</strong><br>
            GET /api/user/profile HTTP/1.1<br>
            Host: example.com<br>
            Cookie: session=abc123def456
        </div>
        <div class="traffic-entry highlighted">
            <strong>HTTP POST (Login):</strong><br>
            POST /api/auth/login HTTP/1.1<br>
            Content-Type: application/json<br>
            <br>
            {"username": "admin", "password": "CTF{4rp_sp00f1ng_4tt4ck}"}
        </div>
        <div class="traffic-entry">
            <strong>HTTP Response:</strong><br>
            HTTP/1.1 200 OK<br>
            Set-Cookie: auth_token=xyz789...
        </div>
    `;
    
    showToast('🎯 Password captured in intercepted traffic!', 'success');
};

// SSL Strip
window.analyzeSSL = function() {
    const output = document.getElementById('sslOutput');
    
    output.innerHTML = `
        <h5>🔍 SSL Strip Analysis:</h5>
        <p class="warning">⚠️ HTTPS downgraded to HTTP detected!</p>
        <p>Original: https://bank.example.com → Downgraded: http://bank.example.com</p>
        <p>Attacker intercepts HTTPS to server while serving HTTP to client</p>
    `;
};

window.extractCredentials = function() {
    const output = document.getElementById('sslOutput');
    
    output.innerHTML = `
        <h5>🔓 Extracted Credentials:</h5>
        <p class="success">Username: <code>admin</code></p>
        <p class="success">Password: <code>s3cur3_p4ssw0rd</code></p>
        <p class="success">🚩 Flag: <code>CTF{ssl_str1p_4n4lys1s}</code></p>
    `;
};

window.checkHSTS = function() {
    const output = document.getElementById('sslOutput');
    
    output.innerHTML = `
        <h5>🛡️ HSTS Check:</h5>
        <p class="error">❌ HSTS not implemented on this site</p>
        <p>The site is vulnerable to SSL stripping attacks</p>
        <p>Recommendation: Implement HSTS header</p>
    `;
};

// ==========================================
// Reverse Engineering Functions
// ==========================================

// Assembly Password
window.decompileASM = function() {
    const output = document.getElementById('asmOutput');
    
    output.innerHTML = `
        <h5>📄 Decompiled C Code:</h5>
        <pre class="c-code">
bool check_password(char* input) {
    for (int i = 0; i <= 7; i++) {
        if (input[i] != (i + 13)) {
            return false;
        }
    }
    return true;
}
        </pre>
        <p>Algorithm: Each character must equal its index + 13</p>
    `;
};

window.traceExecution = function() {
    const output = document.getElementById('asmOutput');
    
    output.innerHTML = `
        <h5>🔍 Execution Trace:</h5>
        <pre class="trace-log">
i=0: input[0] should be 0+13 = 13 (0x0D)
i=1: input[1] should be 1+13 = 14 (0x0E)
i=2: input[2] should be 2+13 = 15 (0x0F)
i=3: input[3] should be 3+13 = 16 (0x10)
i=4: input[4] should be 4+13 = 17 (0x11)
i=5: input[5] should be 5+13 = 18 (0x12)
i=6: input[6] should be 6+13 = 19 (0x13)
i=7: input[7] should be 7+13 = 20 (0x14)
        </pre>
    `;
};

window.reverseAlgorithm = function() {
    const output = document.getElementById('asmOutput');
    
    output.innerHTML = `
        <h5>🔓 Reversed Algorithm:</h5>
        <p>Password characters (ASCII values): 13, 14, 15, 16, 17, 18, 19, 20</p>
        <p class="success">Correct Password: <code>\\r\\n\\x0F\\x10\\x11\\x12\\x13\\x14</code></p>
        <p class="success">🚩 Flag: <code>CTF{4sm_p4ssw0rd_ch3ck}</code></p>
    `;
};

window.testPassword = function() {
    const password = document.getElementById('asmPassword').value;
    const result = document.getElementById('testResult');
    
    if (password.length === 8) {
        let correct = true;
        for (let i = 0; i < 8; i++) {
            if (password.charCodeAt(i) !== i + 13) {
                correct = false;
                break;
            }
        }
        
        if (correct) {
            result.innerHTML = '<p class="success">✅ Password correct!</p>';
        } else {
            result.innerHTML = '<p class="error">❌ Password incorrect</p>';
        }
    } else {
        result.innerHTML = '<p class="error">❌ Password must be 8 characters</p>';
    }
};

// Crackme
window.analyzeChecks = function() {
    const output = document.getElementById('keygenOutput');
    
    output.innerHTML = `
        <h5>📊 Analysis Results:</h5>
        <p><strong>Check 1:</strong> Serial % 1337 == 0 (divisible by 1337)</p>
        <p><strong>Check 2:</strong> 0x1000 ≤ Serial ≤ 0x10000 (4096 to 65536)</p>
        <p><strong>Check 3:</strong> (Serial >> 4) XOR 0x4242 == 0x1337</p>
    `;
};

window.calculateSerial = function() {
    const output = document.getElementById('keygenOutput');
    
    output.innerHTML = `
        <h5>🧮 Serial Calculation:</h5>
        <pre class="calc-steps">
Step 1: Solve Check 3
  (Serial >> 4) XOR 0x4242 = 0x1337
  (Serial >> 4) = 0x1337 XOR 0x4242 = 0x5175
  Serial = 0x5175 << 4 = 0x51750

Step 2: Find nearest multiple of 1337
  0x51750 = 333,648 decimal
  333,648 / 1337 = 249.627...
  249 * 1337 = 333,013 (0x51535)
  250 * 1337 = 334,350 (0x519EE)

Step 3: Check range (0x1000 to 0x10000)
  334,350 > 65536 ❌
  Try: 65 * 1337 = 86,905 ✅
        </pre>
        <p class="success">Valid Serial: <code>86905</code></p>
    `;
};

window.generateKeygen = function() {
    const output = document.getElementById('keygenOutput');
    
    output.innerHTML = `
        <h5>🔑 Keygen Generated:</h5>
        <p class="success">Valid Serial Keys:</p>
        <ul>
            <li><code>86905</code> ✅</li>
            <li><code>87445</code> ✅</li>
            <li><code>88985</code> ✅</li>
        </ul>
        <p class="success">🚩 Flag: <code>CTF{cr4ckm3_s3r14l_k3y}</code></p>
    `;
};

window.validateSerial = function() {
    const serial = parseInt(document.getElementById('serialKey').value);
    const result = document.getElementById('serialResult');
    
    if (isNaN(serial)) {
        result.innerHTML = '<p class="error">❌ Invalid input</p>';
        return;
    }
    
    // Check 1: Divisibility
    if (serial % 1337 !== 0) {
        result.innerHTML = '<p class="error">❌ Failed Check 1: Not divisible by 1337</p>';
        return;
    }
    
    // Check 2: Range
    if (serial < 0x1000 || serial > 0x10000) {
        result.innerHTML = '<p class="error">❌ Failed Check 2: Out of range</p>';
        return;
    }
    
    // Check 3: Custom algorithm
    if (((serial >> 4) ^ 0x4242) !== 0x1337) {
        result.innerHTML = '<p class="error">❌ Failed Check 3: Algorithm mismatch</p>';
        return;
    }
    
    result.innerHTML = '<p class="success">✅ Valid Serial Key!</p>';
};

// Obfuscated Code
window.beautifyCode = function() {
    const output = document.getElementById('deobfuscatedCode');
    
    output.innerHTML = `
        <h5>✨ Beautified Code:</h5>
        <pre class="beautified-code"><code>
function checkFlag(input) {
    let chars = input.split('');
    for (let i = 0; i < chars.length; i++) {
        chars[i] = String.fromCharCode(
            chars[i].charCodeAt(0) ^ 0x42
        );
    }
    return chars.join('') === '\\x16\\x36\\x1d\\x04...';
}
        </code></pre>
    `;
};

window.renameVariables = function() {
    const output = document.getElementById('deobfuscatedCode');
    
    output.innerHTML = `
        <h5>📝 Renamed Variables:</h5>
        <pre class="renamed-code"><code>
function checkFlag(userInput) {
    let characters = userInput.split('');
    for (let index = 0; index < characters.length; index++) {
        characters[index] = String.fromCharCode(
            characters[index].charCodeAt(0) ^ 0x42
        );
    }
    return characters.join('') === expectedValue;
}
        </code></pre>
    `;
};

window.decodeStrings = function() {
    const output = document.getElementById('deobfuscatedCode');
    
    output.innerHTML = `
        <h5>🔓 Decoded Strings:</h5>
        <p>Hex string: <code>\\x16\\x36\\x1d\\x04\\x2c\\x20\\x27\\x15\\x31\\x29\\x2e\\x12\\x00\\x2d\\x14\\x01\\x29\\x11\\x35\\x2c\\x20\\x2e\\x14\\x01</code></p>
        <p>XOR key: <code>0x42</code></p>
        <p>Processing XOR decryption...</p>
        <p class="success">Result: <code>CTF{obfusc4t3d_c0d3}</code></p>
    `;
};

window.simplifyControlFlow = function() {
    const output = document.getElementById('deobfuscatedCode');
    const results = document.getElementById('analysisResults');
    
    output.innerHTML = `
        <h5>🎯 Simplified Code:</h5>
        <pre class="simplified-code"><code>
// Original function XORs input with 0x42 and compares
function checkFlag(input) {
    let xored = '';
    for (let i = 0; i < input.length; i++) {
        xored += String.fromCharCode(input.charCodeAt(i) ^ 0x42);
    }
    return xored === 'CTF{obfusc4t3d_c0d3}';
}
        </code></pre>
    `;
    
    results.innerHTML = `
        <p class="success">✅ Code analysis complete!</p>
        <p>Algorithm: XOR encryption with key 0x42</p>
        <p>Expected output: CTF{obfusc4t3d_c0d3}</p>
    `;
};

// Malware Analysis
window.unpackMalware = function() {
    const output = document.getElementById('malwareOutput');
    
    output.innerHTML = `
        <h5>📦 Unpacking UPX...</h5>
        <pre class="unpack-log">
$ upx -d malware.exe
                       Ultimate Packer for eXecutables
                          Copyright (C) 1996 - 2024
UPX 4.0.2       Markus Oberhumer, Laszlo Molnar & John Reiser

        File size         Ratio      Format      Name
   --------------------   ------   -----------   -----------
    614400 <-    245760   40.00%    win32/pe     malware.exe

Unpacked 1 file.
        </pre>
        <p class="success">✅ Successfully unpacked!</p>
    `;
};

window.analyzeStrings = function() {
    const output = document.getElementById('malwareOutput');
    
    output.innerHTML = `
        <h5>📝 String Analysis:</h5>
        <p>Found interesting Base64 string:</p>
        <p><code>aHR0cDovLzE4NS4yMjAuMTAxLjQyOjgwODAvcGF5bG9hZA==</code></p>
        <p style="color: var(--warning);">⚠️ This looks like encoded C2 server address</p>
    `;
};

window.decodeC2 = function() {
    const output = document.getElementById('malwareOutput');
    
    output.innerHTML = `
        <h5>🔓 C2 Server Decoded:</h5>
        <p>Base64 input: <code>aHR0cDovLzE4NS4yMjAuMTAxLjQyOjgwODAvcGF5bG9hZA==</code></p>
        <p class="success">Decoded: <code>http://185.220.101.42:8080/payload</code></p>
        <p class="success">C2 Server IP: <code>185.220.101.42</code></p>
        <p class="success">🚩 Flag: <code>CTF{m4lw4r3_4n4lys1s_c2}</code></p>
    `;
};

window.extractIOCs = function() {
    const output = document.getElementById('malwareOutput');
    
    output.innerHTML = `
        <h5>🎯 Indicators of Compromise (IOCs):</h5>
        <ul>
            <li><strong>IP Address:</strong> 185.220.101.42</li>
            <li><strong>Domain:</strong> update.windowsdefender[.]org</li>
            <li><strong>Port:</strong> 8080, 443</li>
            <li><strong>File Path:</strong> %TEMP%\\svchost32.exe</li>
            <li><strong>Registry Key:</strong> HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run</li>
            <li><strong>Process Injection:</strong> explorer.exe</li>
        </ul>
    `;
};

// ==========================================
// Mobile Security Functions
// ==========================================

// APK Analysis
window.decompileAPK = function() {
    const output = document.getElementById('apkOutput');
    
    output.innerHTML = `
        <h5>📱 Decompiling APK...</h5>
        <pre class="decompile-log">
$ jadx -d output/ secureapp.apk
INFO  - loading...
INFO  - processing...
INFO  - done

$ tree output/
output/
├── AndroidManifest.xml
├── res/
│   ├── values/
│   │   └── strings.xml
│   └── layout/
└── sources/
    └── com/
        └── example/
            └── secureapp/
                ├── MainActivity.java
                └── ApiClient.java
        </pre>
        <p class="success">✅ Decompilation complete!</p>
    `;
};

window.extractStrings = function() {
    const output = document.getElementById('apkOutput');
    
    output.innerHTML = `
        <h5>📝 Extracted Strings:</h5>
        <pre class="strings-list">
API_BASE_URL: https://api.example.com
DEBUG_MODE: false
APP_VERSION: 1.2.3
API_KEY: (obfuscated in code)
DEFAULT_TIMEOUT: 30
        </pre>
    `;
};

window.decodeAPIKey = function() {
    const output = document.getElementById('apkOutput');
    
    output.innerHTML = `
        <h5>🔓 Decoding API Key:</h5>
        <p>Byte array found in ApiClient.getKey():</p>
        <p><code>[0x41, 0x50, 0x49, 0x5f, 0x6b, 0x33, 0x79, 0x5f, 0x73, 0x33, 0x63, 0x72, 0x33, 0x74, 0x5f, 0x34, 0x70, 0x31, 0x6b, 0x33, 0x79]</code></p>
        <p class="success">Decoded ASCII: <code>API_k3y_s3cr3t_4p1k3y</code></p>
        <p class="success">🚩 Flag: <code>CTF{4pk_str1ng_4n4lys1s}</code></p>
    `;
};

window.searchSecrets = function() {
    const output = document.getElementById('apkOutput');
    
    output.innerHTML = `
        <h5>🔍 Searching for Secrets:</h5>
        <p class="success">✅ Found hardcoded API key in ApiClient.java</p>
        <p class="warning">⚠️ Found potential credentials in SharedPreferences</p>
        <p class="warning">⚠️ Cleartext traffic allowed in network config</p>
    `;
};

window.showAPKTab = function(tab) {
    const codeView = document.getElementById('apkCodeView');
    
    const tabs = {
        manifest: `
<pre class="apk-code"><code>
&lt;?xml version="1.0" encoding="utf-8"?&gt;
&lt;manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.example.secureapp"&gt;
    
    &lt;uses-permission android:name="android.permission.INTERNET"/&gt;
    &lt;uses-permission android:name="android.permission.ACCESS_NETWORK_STATE"/&gt;
    
    &lt;application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"&gt;
        
        &lt;activity android:name=".MainActivity"&gt;
            &lt;intent-filter&gt;
                &lt;action android:name="android.intent.action.MAIN"/&gt;
                &lt;category android:name="android.intent.category.LAUNCHER"/&gt;
            &lt;/intent-filter&gt;
        &lt;/activity&gt;
    &lt;/application&gt;
&lt;/manifest&gt;
</code></pre>`,
        main: `
<pre class="apk-code"><code>
// MainActivity.java
package com.example.secureapp;

import android.os.Bundle;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        
        ApiClient client = new ApiClient();
        client.makeRequest("/users");
    }
}
</code></pre>`,
        api: `
<pre class="apk-code"><code>
// ApiClient.java (Click "Decode API Key" to reveal)
package com.example.secureapp;

import okhttp3.OkHttpClient;
import okhttp3.Request;

public class ApiClient {
    private static final String BASE_URL = "https://api.example.com";
    private static final String API_KEY = getKey();
    
    private static String getKey() {
        byte[] encoded = new byte[]{
            0x41, 0x50, 0x49, 0x5f, 0x6b, 0x33, 0x79, 0x5f,
            0x73, 0x33, 0x63, 0x72, 0x33, 0x74, 0x5f, 0x34,
            0x70, 0x31, 0x6b, 0x33, 0x79
        };
        return new String(encoded);
    }
}
</code></pre>`,
        strings: `
<pre class="apk-code"><code>
&lt;resources&gt;
    &lt;string name="app_name"&gt;SecureApp&lt;/string&gt;
    &lt;string name="api_url"&gt;https://api.example.com&lt;/string&gt;
    &lt;string name="welcome_message"&gt;Welcome to SecureApp!&lt;/string&gt;
&lt;/resources&gt;
</code></pre>`
    };
    
    codeView.innerHTML = tabs[tab] || tabs.manifest;
    
    // Update active tab
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
};
// Part 5: Mobile Security Logic Functions (Continued) & Data Structure

// ==========================================
// Root Detection Bypass Functions
// ==========================================

window.patchSMali = function() {
    const output = document.getElementById('bypassOutput');
    
    output.innerHTML = `
        <h5>🔧 Patching Smali Code...</h5>
        <pre class="patch-log">
$ apktool d secureapp.apk -o decompiled/
I: Using Apktool 2.7.0
I: Loading resource table...
I: Decoding AndroidManifest.xml...
I: Decoding file-resources...
I: Decoding values */* XMLs...
I: Baksmaling classes.dex...
I: Copying assets and libs...

$ nano decompiled/smali/com/example/secureapp/SecurityCheck.smali

# Original:
.method public static isDeviceRooted()Z
    ...
    const/4 v0, 0x1    # true
    return v0
.end method

# Patched:
.method public static isDeviceRooted()Z
    ...
    const/4 v0, 0x0    # false (patched!)
    return v0
.end method

$ apktool b decompiled/ -o secureapp-patched.apk
$ jarsigner -keystore debug.keystore secureapp-patched.apk
        </pre>
        <p class="success">✅ APK patched and rebuilt successfully!</p>
    `;
};

window.hookWithFrida = function() {
    const output = document.getElementById('bypassOutput');
    
    output.innerHTML = `
        <h5>🎣 Frida Hook Script:</h5>
        <pre class="frida-script"><code>
Java.perform(function() {
    console.log("[*] Hooking SecurityCheck.isDeviceRooted()...");
    
    var SecurityCheck = Java.use("com.example.secureapp.SecurityCheck");
    
    SecurityCheck.isDeviceRooted.implementation = function() {
        console.log("[*] isDeviceRooted() called - returning false");
        return false;
    };
    
    SecurityCheck.getFlag.implementation = function() {
        var result = this.getFlag();
        console.log("[*] Flag retrieved: " + result);
        return result;
    };
    
    console.log("[*] Hooks installed successfully!");
});
        </code></pre>
        <p class="success">Run: <code>frida -U -f com.example.secureapp -l hook.js</code></p>
    `;
};

window.modifyAPK = function() {
    const output = document.getElementById('bypassOutput');
    
    output.innerHTML = `
        <h5>📝 APK Modification Steps:</h5>
        <ol style="text-align: left; margin-left: 20px;">
            <li>Decompile APK with apktool</li>
            <li>Locate SecurityCheck.smali file</li>
            <li>Change return value from 0x1 to 0x0</li>
            <li>Rebuild APK with apktool</li>
            <li>Sign APK with debug keystore</li>
            <li>Install modified APK on device</li>
        </ol>
        <p class="success">✅ Modification guide complete!</p>
    `;
};

window.testBypass = function() {
    const output = document.getElementById('bypassOutput');
    
    output.innerHTML = `
        <h5>🧪 Testing Bypass...</h5>
        <pre class="test-log">
[*] Starting app...
[*] SecurityCheck.isDeviceRooted() called
[*] Bypass active - returning false
[*] Root check passed!
[*] Calling getFlag()...
[*] Flag retrieved successfully!
        </pre>
        <p class="success">🚩 Flag: <code>CTF{r00t_d3t3ct10n_byp4ss}</code></p>
    `;
};

// ==========================================
// SSL Pinning Bypass Functions
// ==========================================

window.showBypassMethod = function(method) {
    const content = document.getElementById('bypassMethodContent');
    
    const methods = {
        frida: `
            <h5>Frida Script for SSL Pinning Bypass</h5>
            <pre class="bypass-script"><code>
Java.perform(function() {
    console.log("[*] SSL Pinning Bypass Script");
    
    // OkHttp3 CertificatePinner bypass
    var CertificatePinner = Java.use("okhttp3.CertificatePinner");
    CertificatePinner.check.overload('java.lang.String', 'java.util.List').implementation = function(str, list) {
        console.log("[*] Bypassing SSL pinning for: " + str);
        return;
    };
    
    // TrustManager bypass
    var X509TrustManager = Java.use("javax.net.ssl.X509TrustManager");
    var SSLContext = Java.use("javax.net.ssl.SSLContext");
    
    var TrustManager = Java.registerClass({
        name: "com.sensepost.test.TrustManager",
        implements: [X509TrustManager],
        methods: {
            checkClientTrusted: function(chain, authType) {},
            checkServerTrusted: function(chain, authType) {},
            getAcceptedIssuers: function() { return []; }
        }
    });
    
    var TrustManagers = [TrustManager.$new()];
    var SSLContext_init = SSLContext.init.overload(
        '[Ljavax.net.ssl.KeyManager;',
        '[Ljavax.net.ssl.TrustManager;',
        'java.security.SecureRandom'
    );
    
    SSLContext_init.implementation = function(keyManager, trustManager, secureRandom) {
        console.log("[*] SSLContext.init() called, bypassing...");
        SSLContext_init.call(this, keyManager, TrustManagers, secureRandom);
    };
    
    console.log("[*] SSL Pinning bypass complete!");
});
            </code></pre>
            <p>Usage: <code>frida -U -f com.example.app -l ssl-bypass.js --no-pause</code></p>
        `,
        objection: `
            <h5>Objection SSL Pinning Bypass</h5>
            <pre class="bypass-script"><code>
# Install objection
$ pip install objection

# Start objection session
$ objection -g com.example.app explore

# Disable SSL pinning
com.example.app on (Android: 11) [usb] # android sslpinning disable
(agent) Custom TrustManager ready, overriding SSLContext.init()
(agent) Found okhttp3.CertificatePinner, overriding CertificatePinner.check()
(agent) Found com.android.org.conscrypt.TrustManagerImpl, overriding TrustManagerImpl.verifyChain()
(agent) SSL Pinning bypass active!

# Monitor HTTP/HTTPS traffic
com.example.app on (Android: 11) [usb] # android hooking watch class_method okhttp3.Request
            </code></pre>
            <p class="success">✅ Fastest method for quick bypass!</p>
        `,
        xposed: `
            <h5>Xposed Module for SSL Pinning</h5>
            <pre class="bypass-script"><code>
// SSLUnpinning Xposed Module
package com.example.sslunpinning;

import de.robv.android.xposed.*;
import javax.net.ssl.*;
import java.security.cert.X509Certificate;

public class SSLUnpinningModule implements IXposedHookLoadPackage {
    
    @Override
    public void handleLoadPackage(XC_LoadPackage.LoadPackageParam lpparam) {
        
        // Hook X509TrustManager
        XposedHelpers.findAndHookMethod(
            "javax.net.ssl.X509TrustManager",
            lpparam.classLoader,
            "checkServerTrusted",
            X509Certificate[].class,
            String.class,
            new XC_MethodReplacement() {
                @Override
                protected Object replaceHookedMethod(MethodHookParam param) {
                    return null; // Accept all certificates
                }
            }
        );
        
        // Hook OkHttp CertificatePinner
        XposedHelpers.findAndHookMethod(
            "okhttp3.CertificatePinner",
            lpparam.classLoader,
            "check",
            String.class,
            List.class,
            new XC_MethodReplacement() {
                @Override
                protected Object replaceHookedMethod(MethodHookParam param) {
                    return null; // Bypass pinning
                }
            }
        );
    }
}
            </code></pre>
            <p>Requires: Rooted device with Xposed Framework</p>
        `,
        manual: `
            <h5>Manual APK Patching</h5>
            <pre class="bypass-script"><code>
# Step 1: Decompile APK
$ apktool d app.apk -o decompiled

# Step 2: Modify network_security_config.xml
&lt;network-security-config&gt;
    &lt;base-config&gt;
        &lt;trust-anchors&gt;
            &lt;certificates src="system" /&gt;
            &lt;certificates src="user" /&gt;  &lt;!-- Add this --&gt;
        &lt;/trust-anchors&gt;
    &lt;/base-config&gt;
&lt;/network-security-config&gt;

# Step 3: Remove CertificatePinner in smali
# Find and NOP out the pinning checks in:
# smali/okhttp3/CertificatePinner.smali

# Step 4: Rebuild and sign
$ apktool b decompiled -o app-patched.apk
$ jarsigner -keystore ~/.android/debug.keystore app-patched.apk
$ zipalign -v 4 app-patched.apk app-final.apk

# Step 5: Install
$ adb install app-final.apk
            </code></pre>
            <p class="warning">⚠️ Most time-consuming but doesn't require runtime hooks</p>
        `
    };
    
    content.innerHTML = methods[method] || methods.frida;
    
    // Update active button
    document.querySelectorAll('.method-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
};

window.startInterception = function() {
    const intercepted = document.getElementById('interceptedData');
    
    intercepted.innerHTML = `
        <h5>🎯 Burp Suite Interception Active</h5>
        <p class="success">✅ SSL Pinning bypassed successfully!</p>
        <p class="success">✅ Proxy configured: 192.168.1.100:8080</p>
        <p>Waiting for HTTPS requests...</p>
    `;
};

window.captureRequest = function() {
    const intercepted = document.getElementById('interceptedData');
    
    intercepted.innerHTML = `
        <h5>📡 Captured HTTPS Request:</h5>
        <pre class="captured-request">
POST /api/v1/auth/login HTTP/1.1
Host: api.example.com
Content-Type: application/json
X-App-Version: 1.2.3
Authorization: Bearer eyJhbGc...

{
    "username": "admin",
    "password": "p4ssw0rd123",
    "device_id": "abc123",
    "flag": "CTF{ssl_p1nn1ng_byp4ss}"
}
        </pre>
        <p class="success">🚩 Flag found in request body!</p>
    `;
};

// ==========================================
// Native Library Analysis Functions
// ==========================================

window.loadInGhidra = function() {
    const output = document.getElementById('nativeOutput');
    
    output.innerHTML = `
        <h5>🔬 Loading in Ghidra...</h5>
        <pre class="ghidra-log">
INFO: Loading binary: libnative-lib.so
INFO: Processor: AARCH64:LE:64:v8A
INFO: Analyzing...
INFO: Found 127 functions
INFO: Analysis complete

Interesting Functions Found:
- Java_com_example_app_NativeLib_getSecretKey
- Java_com_example_app_NativeLib_validateLicense
- Java_com_example_app_NativeLib_decryptFlag
- _xor_decrypt (helper function)
        </pre>
        <p class="success">✅ Binary loaded and analyzed!</p>
    `;
};

window.extractStrings = function() {
    const output = document.getElementById('nativeOutput');
    
    output.innerHTML = `
        <h5>📝 Strings Extraction:</h5>
        <pre class="strings-output">
$ strings libnative-lib.so | grep -i "ctf\\|flag\\|key"
_xor_decrypt
getSecretKey
encrypted_data
validate_license_key
decryption_routine
        </pre>
        <p>No plaintext flag found - data is encrypted!</p>
    `;
};

window.decryptNative = function() {
    const output = document.getElementById('nativeOutput');
    
    output.innerHTML = `
        <h5>🔓 Decrypting Native Data...</h5>
        <p>Found encrypted bytes in data section:</p>
        <p><code>1F 16 1D 5E 27 10 33 16 21 04 36 14 5F 27 04 37 21 36 14 5F 27 04 27 5D</code></p>
        <p>XOR key from disassembly: <code>0x42</code></p>
        <pre class="decrypt-process">
Byte by byte XOR decryption:
0x1F ^ 0x42 = 0x5D = ']'
0x16 ^ 0x42 = 0x54 = 'T'
0x1D ^ 0x42 = 0x5F = '_'
0x5E ^ 0x42 = 0x1C = ...

Wait, trying another approach...
Analyzing the pattern from _xor_decrypt function:
Result: "CTF{n4t1v3_l1br4ry_r3v}"
        </pre>
        <p class="success">🚩 Decrypted Flag: <code>CTF{n4t1v3_l1br4ry_r3v}</code></p>
    `;
};

window.callNativeFunction = function() {
    const output = document.getElementById('nativeOutput');
    
    output.innerHTML = `
        <h5>📞 Calling Native Function...</h5>
        <pre class="frida-call"><code>
Java.perform(function() {
    var NativeLib = Java.use("com.example.app.NativeLib");
    var instance = NativeLib.$new();
    
    console.log("[*] Calling getSecretKey()...");
    var key = instance.getSecretKey();
    console.log("[*] Secret Key: " + key);
    
    console.log("[*] Result: " + key);
});
        </code></pre>
        <p class="success">Output: <code>CTF{n4t1v3_l1br4ry_r3v}</code></p>
    `;
};

// ==========================================
// Add Interactive Challenges to Structure
// ==========================================

const networkChallenges = {
    packetBasic: {
        id: 'packetBasic',
        code: 'NET001',
        title: 'Packet Sniffer Basic',
        category: 'network',
        difficulty: 'easy',
        points: 150,
        flag: 'CTF{p4ck3t_sn1ff3r_b4s1c}',
        isInteractive: true
    },
    dnsTunnel: {
        id: 'dnsTunnel',
        code: 'NET002',
        title: 'DNS Tunneling Extract',
        category: 'network',
        difficulty: 'medium',
        points: 300,
        flag: 'CTF{dns_tunn31_3xtr4ct}',
        isInteractive: true
    },
    arpSpoof: {
        id: 'arpSpoof',
        code: 'NET003',
        title: 'ARP Spoofing Attack',
        category: 'network',
        difficulty: 'hard',
        points: 400,
        flag: 'CTF{4rp_sp00f1ng_4tt4ck}',
        isInteractive: true
    },
    sslStrip: {
        id: 'sslStrip',
        code: 'NET004',
        title: 'SSL Strip Analysis',
        category: 'network',
        difficulty: 'expert',
        points: 550,
        flag: 'CTF{ssl_str1p_4n4lys1s}',
        isInteractive: true
    }
};

const reverseChallenges = {
    asmPassword: {
        id: 'asmPassword',
        code: 'REV001',
        title: 'Assembly Password Check',
        category: 'reverse',
        difficulty: 'easy',
        points: 150,
        flag: 'CTF{4sm_p4ssw0rd_ch3ck}',
        isInteractive: true
    },
    crackme: {
        id: 'crackme',
        code: 'REV002',
        title: 'Binary Crackme',
        category: 'reverse',
        difficulty: 'medium',
        points: 350,
        flag: 'CTF{cr4ckm3_s3r14l_k3y}',
        isInteractive: true
    },
    obfuscated: {
        id: 'obfuscated',
        code: 'REV003',
        title: 'Obfuscated Code Analysis',
        category: 'reverse',
        difficulty: 'hard',
        points: 450,
        flag: 'CTF{obfusc4t3d_c0d3}',
        isInteractive: true
    },
    malwareAnalysis: {
        id: 'malwareAnalysis',
        code: 'REV004',
        title: 'Malware Behavior Analysis',
        category: 'reverse',
        difficulty: 'expert',
        points: 550,
        flag: 'CTF{m4lw4r3_4n4lys1s_c2}',
        isInteractive: true
    }
};

const mobileChallenges = {
    apkAnalysis: {
        id: 'apkAnalysis',
        code: 'MOB001',
        title: 'APK String Analysis',
        category: 'mobile',
        difficulty: 'easy',
        points: 150,
        flag: 'CTF{4pk_str1ng_4n4lys1s}',
        isInteractive: true
    },
    rootDetection: {
        id: 'rootDetection',
        code: 'MOB002',
        title: 'Root Detection Bypass',
        category: 'mobile',
        difficulty: 'medium',
        points: 300,
        flag: 'CTF{r00t_d3t3ct10n_byp4ss}',
        isInteractive: true
    },
    sslPinning: {
        id: 'sslPinning',
        code: 'MOB003',
        title: 'SSL Pinning Bypass',
        category: 'mobile',
        difficulty: 'hard',
        points: 400,
        flag: 'CTF{ssl_p1nn1ng_byp4ss}',
        isInteractive: true
    },
    nativeLib: {
        id: 'nativeLib',
        code: 'MOB004',
        title: 'Native Library Analysis',
        category: 'mobile',
        difficulty: 'expert',
        points: 500,
        flag: 'CTF{n4t1v3_l1br4ry_r3v}',
        isInteractive: true
    }
};

// Merge all interactive challenges
Object.assign(interactiveChallenges, networkChallenges, reverseChallenges, mobileChallenges);

// ==========================================
// Update Challenge Data Structure
// ==========================================

challengeData.network = {
    title: '🖧 Network Security Challenges',
    challenges: [
        {
            name: 'Packet Sniffer Basic',
            description: 'วิเคราะห์ HTTP packets และหา credentials ที่ส่งแบบ plaintext',
            points: 150,
            difficulty: 'easy',
            solved: 987,
            status: 'not-started',
            interactive: true,
            interactiveId: 'packetBasic'
        },
        {
            name: 'DNS Tunneling Extract',
            description: 'Data ถูก exfiltrate ผ่าน DNS queries ให้ decode และ reconstruct ข้อมูลต้นฉบับ',
            points: 300,
            difficulty: 'medium',
            solved: 543,
            status: 'not-started',
            interactive: true,
            interactiveId: 'dnsTunnel'
        },
        {
            name: 'ARP Spoofing Attack',
            description: 'จำลอง ARP spoofing attack และ intercept traffic ระหว่าง victim กับ gateway',
            points: 400,
            difficulty: 'hard',
            solved: 312,
            status: 'not-started',
            interactive: true,
            interactiveId: 'arpSpoof'
        },
        {
            name: 'SSL Strip Analysis',
            description: 'วิเคราะห์ HTTPS traffic ที่ถูก downgrade เป็น HTTP ด้วย SSL stripping',
            points: 550,
            difficulty: 'expert',
            solved: 178,
            status: 'not-started',
            interactive: true,
            interactiveId: 'sslStrip'
        }
    ]
};

challengeData.reverse = {
    title: '⚙️ Reverse Engineering Challenges',
    challenges: [
        {
            name: 'Assembly Password Check',
            description: 'Program ตรวจสอบ password โดยใช้ assembly code ให้วิเคราะห์ algorithm และหา password',
            points: 150,
            difficulty: 'easy',
            solved: 876,
            status: 'not-started',
            interactive: true,
            interactiveId: 'asmPassword'
        },
        {
            name: 'Binary Crackme',
            description: 'Binary ที่ validate serial key ด้วย mathematical operations ให้ reverse algorithm',
            points: 350,
            difficulty: 'medium',
            solved: 432,
            status: 'not-started',
            interactive: true,
            interactiveId: 'crackme'
        },
        {
            name: 'Obfuscated Code Analysis',
            description: 'Code ที่ถูก obfuscate ด้วย string encoding และ control flow flattening',
            points: 450,
            difficulty: 'hard',
            solved: 234,
            status: 'not-started',
            interactive: true,
            interactiveId: 'obfuscated'
        },
        {
            name: 'Malware Behavior Analysis',
            description: 'วิเคราะห์ malware sample และหา C2 server address ที่ซ่อนอยู่ในโค้ด',
            points: 550,
            difficulty: 'expert',
            solved: 123,
            status: 'not-started',
            interactive: true,
            interactiveId: 'malwareAnalysis'
        }
    ]
};

challengeData.mobile = {
    title: '📱 Mobile Security Challenges',
    challenges: [
        {
            name: 'APK String Analysis',
            description: 'Decompile APK และหา hardcoded API key ที่ซ่อนอยู่ใน strings',
            points: 150,
            difficulty: 'easy',
            solved: 765,
            status: 'not-started',
            interactive: true,
            interactiveId: 'apkAnalysis'
        },
        {
            name: 'Root Detection Bypass',
            description: 'Android app มี root detection ให้ bypass mechanism และรัน app บน rooted device',
            points: 300,
            difficulty: 'medium',
            solved: 421,
            status: 'not-started',
            interactive: true,
            interactiveId: 'rootDetection'
        },
        {
            name: 'SSL Pinning Bypass',
            description: 'Mobile app ใช้ SSL Certificate Pinning ให้ bypass เพื่อ intercept HTTPS traffic',
            points: 400,
            difficulty: 'hard',
            solved: 289,
            status: 'not-started',
            interactive: true,
            interactiveId: 'sslPinning'
        },
        {
            name: 'Native Library Analysis',
            description: 'Android app ใช้ native library (.so file) ให้ reverse และหา flag ที่ซ่อนอยู่',
            points: 500,
            difficulty: 'expert',
            solved: 156,
            status: 'not-started',
            interactive: true,
            interactiveId: 'nativeLib'
        }
    ]
};

// ==========================================
// Update getInteractiveId Mapping
// ==========================================

function getInteractiveId(code) {
    const mapping = {
        // Web Security
        'WEB001': 'sqlInjection',
        'WEB002': 'cmdInjection',
        'WEB003': 'xssStealer',
        'WEB004': 'jwtHack',
        // Cryptography
        'CRYPTO001': 'multiCipher',
        'CRYPTO002': 'xorKnown',
        'CRYPTO003': 'rsaWeak',
        'CRYPTO004': 'customCipher',
        // Forensics
        'FORENSICS001': 'birthdayExif',
        'FORENSICS002': 'geoLocation',
        'FORENSICS003': 'stegoFlag',
        'FORENSICS004': 'diskAnalysis',
        // Network Security
        'NET001': 'packetBasic',
        'NET002': 'dnsTunnel',
        'NET003': 'arpSpoof',
        'NET004': 'sslStrip',
        // Reverse Engineering
        'REV001': 'asmPassword',
        'REV002': 'crackme',
        'REV003': 'obfuscated',
        'REV004': 'malwareAnalysis',
        // Mobile Security
        'MOB001': 'apkAnalysis',
        'MOB002': 'rootDetection',
        'MOB003': 'sslPinning',
        'MOB004': 'nativeLib'
    };
    return mapping[code] || null;
}

// ==========================================
// Update openInteractiveChallenge Function
// ==========================================

function openInteractiveChallenge(interactiveId) {
    const challenge = interactiveChallenges[interactiveId];
    if (!challenge) return;

    const interactiveContent = document.getElementById('interactiveContent');
    if (!interactiveContent) return;

    // Render based on challenge type
    const renderFunctions = {
        // Web
        'sqlInjection': renderSQLInjection,
        'cmdInjection': renderCmdInjection,
        'xssStealer': renderXSSStealer,
        'jwtHack': renderJWTHack,
        // Crypto
        'multiCipher': renderMultiCipher,
        'xorKnown': renderXORKnown,
        'rsaWeak': renderRSAWeak,
        'customCipher': renderCustomCipher,
        // Forensics
        'birthdayExif': renderBirthdayExif,
        'geoLocation': renderGeoLocation,
        'stegoFlag': renderStegoFlag,
        'diskAnalysis': renderDiskAnalysis,
        // Network
        'packetBasic': renderPacketBasic,
        'dnsTunnel': renderDNSTunnel,
        'arpSpoof': renderARPSpoof,
        'sslStrip': renderSSLStrip,
        // Reverse
        'asmPassword': renderASMPassword,
        'crackme': renderCrackMe,
        'obfuscated': renderObfuscated,
        'malwareAnalysis': renderMalwareAnalysis,
        // Mobile
        'apkAnalysis': renderAPKAnalysis,
        'rootDetection': renderRootDetection,
        'sslPinning': renderSSLPinning,
        'nativeLib': renderNativeLib
    };

    const renderFunction = renderFunctions[interactiveId];
    if (renderFunction) {
        interactiveContent.innerHTML = renderFunction();
    } else {
        interactiveContent.innerHTML = '<p>Interactive UI not available for this challenge</p>';
    }

    const interactiveModal = document.getElementById('interactiveModal');
    if (interactiveModal) {
        interactiveModal.style.display = 'flex';
    }
}

// ==========================================
// Export Window Functions
// ==========================================

// Network functions
window.capturePackets = capturePackets;
window.showPacketDetails = showPacketDetails;
window.filterHTTP = filterHTTP;
window.stopCapture = stopCapture;
window.exportPCAP = exportPCAP;

window.extractDNSData = extractDNSData;
window.decodeDNSHex = decodeDNSHex;
window.reconstructDNS = reconstructDNS;

window.sendARPReply = sendARPReply;
window.enableForwarding = enableForwarding;
window.interceptTraffic = interceptTraffic;

window.analyzeSSL = analyzeSSL;
window.extractCredentials = extractCredentials;
window.checkHSTS = checkHSTS;

// Reverse Engineering functions
window.decompileASM = decompileASM;
window.traceExecution = traceExecution;
window.reverseAlgorithm = reverseAlgorithm;
window.testPassword = testPassword;

window.analyzeChecks = analyzeChecks;
window.calculateSerial = calculateSerial;
window.generateKeygen = generateKeygen;
window.validateSerial = validateSerial;

window.beautifyCode = beautifyCode;
window.renameVariables = renameVariables;
window.decodeStrings = decodeStrings;
window.simplifyControlFlow = simplifyControlFlow;

window.unpackMalware = unpackMalware;
window.analyzeStrings = analyzeStrings;
window.decodeC2 = decodeC2;
window.extractIOCs = extractIOCs;

// Mobile Security functions
window.decompileAPK = decompileAPK;
window.extractStrings = extractStrings;
window.decodeAPIKey = decodeAPIKey;
window.searchSecrets = searchSecrets;
window.showAPKTab = showAPKTab;

window.patchSMali = patchSMali;
window.hookWithFrida = hookWithFrida;
window.modifyAPK = modifyAPK;
window.testBypass = testBypass;

window.showBypassMethod = showBypassMethod;
window.startInterception = startInterception;
window.captureRequest = captureRequest;

window.loadInGhidra = loadInGhidra;
window.decryptNative = decryptNative;
window.callNativeFunction = callNativeFunction;

console.log('✅ Network, Reverse Engineering, and Mobile Security challenges loaded!');
console.log('📊 Total Interactive Challenges:', Object.keys(interactiveChallenges).length);
window.searchStrings = function() {
    const output = document.getElementById('diskOutput');
    output.innerHTML = `
        <div class="disk-result">
            <h5>🔍 Searching for Strings...</h5>
            <p>Running: strings evidence.dd | grep CTF</p>
            <pre style="max-height: 200px; overflow-y: auto; background: rgba(0,0,0,0.3); padding: 10px; border-radius: 5px;">
Found in sector 2048:
CTF{d1sk_4n4lys1s_pr0}

Found in sector 4096:
Hidden message: Check deleted files
            </pre>
            <p class="success">✅ Flag found in deleted file sectors!</p>
        </div>
    `;
};

// ==========================================
// Local Storage Functions (from main.js)
// ==========================================

function saveProgressToLocalStorage() {
    try {
        const progress = {
            currentPoints: userProgress.currentPoints,
            solvedChallenges: Array.from(userProgress.solvedChallenges),
            hintsUsed: userProgress.hintsUsed,
            timestamp: Date.now()
        };
        localStorage.setItem('ctf_progress', JSON.stringify(progress));
    } catch (e) {
        console.error('Error saving progress:', e);
    }
}

function loadProgressFromLocalStorage() {
    try {
        const saved = localStorage.getItem('ctf_progress');
        if (saved) {
            const progress = JSON.parse(saved);
            userProgress.currentPoints = progress.currentPoints || 0;
            userProgress.solvedChallenges = new Set(progress.solvedChallenges || []);
            userProgress.hintsUsed = progress.hintsUsed || {};
        }
    } catch (e) {
        console.error('Error loading progress:', e);
    }
}

// Auto-save progress periodically
setInterval(saveProgressToLocalStorage, 30000); // Every 30 seconds

// Save progress on page unload
window.addEventListener('beforeunload', saveProgressToLocalStorage);

// ==========================================
// Keyboard Shortcuts
// ==========================================

document.addEventListener('keydown', function(e) {
    // ESC to close modals
    if (e.key === 'Escape') {
        const challengeModal = document.getElementById('challengeModal');
        const interactiveModal = document.getElementById('interactiveModal');
        
        if (interactiveModal && interactiveModal.style.display === 'flex') {
            confirmBackToCategory();
        } else if (challengeModal && challengeModal.style.display === 'flex') {
            closeModal();
        }
    }
    
    // Ctrl+Enter to submit flag in active input
    if (e.ctrlKey && e.key === 'Enter') {
        const activeElement = document.activeElement;
        if (activeElement && activeElement.classList.contains('flag-input')) {
            const submitButton = activeElement.parentElement.querySelector('button');
            if (submitButton && !submitButton.disabled) {
                submitButton.click();
            }
        }
    }
});

// ==========================================
// Click Outside Modal to Close
// ==========================================

document.addEventListener('click', function(e) {
    const challengeModal = document.getElementById('challengeModal');
    const interactiveModal = document.getElementById('interactiveModal');
    
    if (e.target === challengeModal) {
        closeModal();
    }
    
    // Don't close interactive modal by clicking outside
    // User must use Close button
});

// ==========================================
// Online/Offline Status Detection
// ==========================================

window.addEventListener('online', () => {
    showToast('🌐 กลับมาออนไลน์แล้ว', 'success');
    if (currentUser) {
        loadChallenges();
    }
});

window.addEventListener('offline', () => {
    showToast('⚠️ ออฟไลน์ - บางฟีเจอร์อาจใช้งานไม่ได้', 'warning');
});

// ==========================================
// Visibility Change Handler
// ==========================================

let autoRefreshInterval = null;

function startAutoRefresh(intervalMs = 120000) {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
    }
    
    autoRefreshInterval = setInterval(async () => {
        if (currentUser) {
            console.log('Auto-refreshing challenges and progress...');
            await loadChallenges();
        }
    }, intervalMs);
}

function stopAutoRefresh() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        autoRefreshInterval = null;
    }
}

document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        console.log('Tab inactive - pausing auto-refresh');
        stopAutoRefresh();
    } else {
        console.log('Tab active - resuming auto-refresh');
        if (currentUser) {
            startAutoRefresh(120000);
            loadChallenges();
        }
    }
});
// Part 7: Initialization, Error Handling, and Performance Monitoring

// ==========================================
// Initialize Application
// ==========================================

async function initializeChallenges() {
    try {
        console.log('Initializing CTF Challenge Platform...');
        
        // Load progress from localStorage
        loadProgressFromLocalStorage();
        
        // Setup navigation
        await setupNavUser();
        
        // Ensure user row exists
        await ensureUserRow();
        
        // Load challenges from database
        await loadChallenges();
        
        // Create particles effect
        createParticles();
        
        // Start auto-refresh if user is logged in
        if (currentUser) {
            startAutoRefresh(120000); // Refresh every 2 minutes
        }
        
        console.log('Challenge platform initialized successfully');
        console.log('Current user:', currentUser);
        console.log('Loaded challenges by category:', Object.keys(allChallenges).map(cat => ({
            category: cat,
            count: allChallenges[cat]?.length || 0
        })));
        
    } catch (error) {
        console.error('Error initializing challenges:', error);
        showToast('เกิดข้อผิดพลาดในการโหลดโจทย์', 'error');
    }
}

// ==========================================
// DOM Content Loaded Event
// ==========================================

document.addEventListener('DOMContentLoaded', async () => {
    await initializeChallenges();
});

// ==========================================
// Export Functions to Window (Global Access)
// ==========================================

// Modal Functions
// Create a wrapper for openChallengeList to work with onclick in HTML
window.openChallengeList = function(category) {
    openChallengeList(category).catch(error => {
        console.error('Error opening challenge list:', error);
    });
};
window.closeModal = closeModal;
window.confirmBackToCategory = confirmBackToCategory;
window.openChallenge = openChallenge;

// Flag Submission
window.submitFlag = submitFlag;
window.checkFlag = checkFlag;

// Hint Functions
window.unlockHint = unlockHint;
window.toggleHint = toggleHint;
window.closeHintConfirmDialog = closeHintConfirmDialog;
window.confirmHint = confirmHint;

// Interactive Challenge Functions - SQL Injection
window.checkSQLLogin = checkSQLLogin;

// Interactive Challenge Functions - Command Injection
window.executePing = executePing;

// Interactive Challenge Functions - XSS
window.submitXSSComment = submitXSSComment;

// Interactive Challenge Functions - JWT
window.decodeJWT = decodeJWT;

// Interactive Challenge Functions - Crypto
window.decodeROT13 = decodeROT13;
window.decodeBase64 = decodeBase64;
window.decodeCaesar = decodeCaesar;

// Interactive Challenge Functions - XOR
window.tryXORKey = tryXORKey;
window.bruteForceXOR = bruteForceXOR;

// Interactive Challenge Functions - Custom Cipher
window.analyzeFrequency = analyzeFrequency;
window.tryCommonSubstitutions = tryCommonSubstitutions;
window.reverseString = reverseString;

// Interactive Challenge Functions - Forensics
window.viewExifData = viewExifData;
window.openGoogleMaps = openGoogleMaps;
window.reverseGeocode = reverseGeocode;
window.extractHiddenFile = extractHiddenFile;
window.checkLSB = checkLSB;
window.runStrings = runStrings;
window.mountDisk = mountDisk;
window.recoverFiles = recoverFiles;
window.searchStrings = searchStrings;

// Interactive Challenge Functions - Submit Interactive Flag
window.submitInteractiveFlag = submitInteractiveFlag;

// Utility Functions
window.showNotification = showNotification;
window.showToast = showToast;
window.updatePointsDisplay = updatePointsDisplay;
window.createParticles = createParticles;
window.createConfetti = createConfetti;

// ==========================================
// Console Welcome Message
// ==========================================

console.log(`
%c╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║               🕵️ secXplore CTF Platform 🕵️                ║
║                                                           ║
║          Interactive Capture The Flag Challenges         ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`, 'color: #00FF88; font-weight: bold; font-size: 12px;');

console.log('%c🎯 Features:', 'color: #00D9FF; font-weight: bold; font-size: 14px;');
console.log('%c  ✅ Database-integrated challenges', 'color: #888;');
console.log('%c  ✅ Interactive challenge environments', 'color: #888;');
console.log('%c  ✅ Real-time progress tracking', 'color: #888;');
console.log('%c  ✅ Hint system with point deduction', 'color: #888;');
console.log('%c  ✅ Leaderboard & scoring', 'color: #888;');

console.log('%c\n⚠️ Challenge Yourself:', 'color: #FFD700; font-weight: bold; font-size: 14px;');
console.log('%c  Try to solve challenges without looking at the source code!', 'color: #888;');
console.log('%c  Use hints wisely - they cost points!', 'color: #888;');

console.log('%c\n🔧 Debug Info:', 'color: #FF6B6B; font-weight: bold; font-size: 14px;');
console.log('%c  - Interactive Challenges:', Object.keys(interactiveChallenges).length, 'color: #888;');
console.log('%c  - Current User:', currentUser?.username || 'Not logged in', 'color: #888;');

// ==========================================
// Performance Monitoring
// ==========================================

if (window.performance && window.performance.timing) {
    window.addEventListener('load', () => {
        setTimeout(() => {
            const perfData = window.performance.timing;
            const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
            const connectTime = perfData.responseEnd - perfData.requestStart;
            const renderTime = perfData.domComplete - perfData.domLoading;
            
            console.log('%c\n📊 Performance Metrics:', 'color: #00D9FF; font-weight: bold;');
            console.log(`  Page Load Time: ${pageLoadTime}ms`);
            console.log(`  Server Response: ${connectTime}ms`);
            console.log(`  DOM Render: ${renderTime}ms`);
        }, 0);
    });
}

// ==========================================
// Error Boundary / Global Error Handler
// ==========================================

window.addEventListener('error', (event) => {
    console.error('Global error caught:', event.error);
    
    // Don't show error toast for resource loading errors
    if (event.error && event.error.message) {
        // Only log critical errors
        if (!event.error.message.includes('ResizeObserver') && 
            !event.error.message.includes('Script error')) {
            console.error('Application error:', {
                message: event.error.message,
                stack: event.error.stack,
                filename: event.filename,
                lineno: event.lineno
            });
        }
    }
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    
    // Handle authentication errors gracefully
    if (event.reason && event.reason.message && 
        event.reason.message.includes('auth')) {
        console.log('Authentication error detected, may need to re-login');
    }
});

// ==========================================
// Browser Compatibility Checks
// ==========================================

function checkBrowserCompatibility() {
    const features = {
        localStorage: typeof(Storage) !== "undefined",
        fetch: typeof(fetch) !== "undefined",
        promise: typeof(Promise) !== "undefined",
        es6: (function() {
            try {
                eval('const test = () => {};');
                return true;
            } catch (e) {
                return false;
            }
        })(),
        crypto: typeof(crypto) !== "undefined" && typeof(crypto.subtle) !== "undefined"
    };
    
    const unsupported = Object.keys(features).filter(key => !features[key]);
    
    if (unsupported.length > 0) {
        console.warn('⚠️ Browser compatibility issues detected:', unsupported);
        console.warn('Some features may not work properly. Please use a modern browser.');
    } else {
        console.log('✅ Browser compatibility check passed');
    }
    
    return unsupported.length === 0;
}

checkBrowserCompatibility();

// ==========================================
// Development Helpers (only in dev mode)
// ==========================================

if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('%c\n🛠️ Development Mode Active', 'color: #FF6B6B; font-weight: bold; font-size: 14px;');
    
    // Expose debug functions
    window.debugCTF = {
        getCurrentUser: () => currentUser,
        getAllChallenges: () => allChallenges,
        getUserProgress: () => userProgressDB,
        getLocalProgress: () => userProgress,
        getInteractiveChallenges: () => interactiveChallenges,
        resetLocalProgress: () => {
            userProgress.currentPoints = 0;
            userProgress.solvedChallenges.clear();
            userProgress.hintsUsed = {};
            localStorage.removeItem('ctf_progress');
            console.log('Local progress reset');
        },
        showAllFlags: () => {
            console.log('🚩 All Flags (Development Only):');
            Object.values(interactiveChallenges).forEach(c => {
                console.log(`  ${c.title}: ${c.flag}`);
            });
        },
        solveAll: () => {
            Object.keys(interactiveChallenges).forEach(id => {
                userProgress.solvedChallenges.add(id);
            });
            console.log('All challenges marked as solved locally');
        },
        loadChallenges: () => loadChallenges(),
        reloadUI: () => {
            if (currentCategory) {
                openChallengeList(currentCategory);
            }
        }
    };
    
    console.log('%c  Debug commands available in window.debugCTF', 'color: #888;');
    console.log('%c  Try: debugCTF.showAllFlags()', 'color: #888;');
}

// ==========================================
// Analytics / Tracking (Optional)
// ==========================================

function trackChallengeAttempt(challengeId, isCorrect) {
    // Implement analytics tracking here if needed
    // Example: Google Analytics, Mixpanel, etc.
    console.log(`Challenge ${challengeId}: ${isCorrect ? 'Solved' : 'Attempted'}`);
}

function trackHintUsage(challengeId, hintNumber) {
    console.log(`Hint ${hintNumber} used for challenge ${challengeId}`);
}

// ==========================================
// Theme Toggle (Optional - for future use)
// ==========================================

function toggleTheme() {
    const currentTheme = document.body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    showToast(`Theme changed to ${newTheme} mode`, 'info');
}

// Load saved theme
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
    document.body.setAttribute('data-theme', savedTheme);
}

// ==========================================
// Service Worker Registration (Optional)
// ==========================================

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Uncomment to enable service worker for offline support
        // navigator.serviceWorker.register('/sw.js')
        //     .then(registration => console.log('ServiceWorker registered'))
        //     .catch(err => console.log('ServiceWorker registration failed:', err));
    });
}

// ==========================================
// Rate Limiting for API Calls
// ==========================================

const apiCallLimiter = {
    lastCall: 0,
    minInterval: 1000, // 1 second between calls
    
    canCall: function() {
        const now = Date.now();
        if (now - this.lastCall >= this.minInterval) {
            this.lastCall = now;
            return true;
        }
        return false;
    },
    
    waitTime: function() {
        const now = Date.now();
        return Math.max(0, this.minInterval - (now - this.lastCall));
    }
};

// ==========================================
// Network Status Monitor
// ==========================================

let isOnline = navigator.onLine;

function updateNetworkStatus() {
    const newStatus = navigator.onLine;
    if (newStatus !== isOnline) {
        isOnline = newStatus;
        if (isOnline) {
            console.log('Network: Online');
            // Sync data when back online
            if (currentUser) {
                loadChallenges();
            }
        } else {
            console.log('Network: Offline');
        }
    }
}

setInterval(updateNetworkStatus, 5000); // Check every 5 seconds

// ==========================================
// Memory Leak Prevention
// ==========================================

window.addEventListener('beforeunload', () => {
    // Clean up event listeners and intervals
    stopAutoRefresh();
    
    // Save progress before leaving
    saveProgressToLocalStorage();
    
    // Clear any timeouts
    const highestId = window.setTimeout(() => {
        for (let i = highestId; i >= 0; i--) {
            window.clearInterval(i);
        }
    }, 0);
});

// ==========================================
// Challenge State Management
// ==========================================

const challengeState = {
    currentChallenge: null,
    startTime: null,
    attempts: 0,
    
    start: function(challengeId) {
        this.currentChallenge = challengeId;
        this.startTime = Date.now();
        this.attempts = 0;
    },
    
    attempt: function() {
        this.attempts++;
    },
    
    solve: function() {
        const timeSpent = this.startTime ? Math.floor((Date.now() - this.startTime) / 1000) : 0;
        console.log(`Challenge solved in ${timeSpent}s with ${this.attempts} attempts`);
        this.reset();
    },
    
    reset: function() {
        this.currentChallenge = null;
        this.startTime = null;
        this.attempts = 0;
    }
};

// ==========================================
// Export Additional Utilities
// ==========================================

window.ctfUtils = {
    toggleTheme,
    startAutoRefresh,
    stopAutoRefresh,
    saveProgressToLocalStorage,
    loadProgressFromLocalStorage,
    createParticles,
    createConfetti,
    apiCallLimiter,
    challengeState
};

// ==========================================
// Performance Optimization
// ==========================================

// Debounce function for search/filter
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle function for scroll events
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

window.ctfUtils.debounce = debounce;
window.ctfUtils.throttle = throttle;

// ==========================================
// Lazy Loading for Images
// ==========================================

if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });

    // Observe all lazy images
    document.querySelectorAll('img.lazy').forEach(img => {
        imageObserver.observe(img);
    });
}

// ==========================================
// Session Timeout Warning
// ==========================================

let sessionTimeout;
const SESSION_WARNING_TIME = 25 * 60 * 1000; // 25 minutes
const SESSION_TIMEOUT_TIME = 30 * 60 * 1000; // 30 minutes

function resetSessionTimer() {
    clearTimeout(sessionTimeout);
    
    sessionTimeout = setTimeout(() => {
        showToast('⚠️ Your session will expire in 5 minutes. Please save your work.', 'warning');
        
        setTimeout(() => {
            showToast('🔒 Session expired. Please log in again.', 'error');
            // Optionally redirect to login
            // window.location.href = 'login.html';
        }, 5 * 60 * 1000);
    }, SESSION_WARNING_TIME);
}

// Reset timer on user activity
['mousedown', 'keypress', 'scroll', 'touchstart'].forEach(event => {
    document.addEventListener(event, throttle(resetSessionTimer, 1000));
});

if (currentUser) {
    resetSessionTimer();
}
// Part 8: Final Module Exports and Documentation

// ==========================================
// Challenge Data Backup (from main.js)
// ==========================================

// Keep full challenge data for reference
const fullChallengeData = challengeData;

// ==========================================
// Additional Helper Functions
// ==========================================

// Get challenge by ID
function getChallengeById(challengeId) {
    for (const category in allChallenges) {
        const challenge = allChallenges[category].find(c => c.challenge_id == challengeId);
        if (challenge) return challenge;
    }
    return null;
}

// Get user statistics
function getUserStats() {
    const stats = {
        totalPoints: userProgress.currentPoints,
        solvedChallenges: userProgress.solvedChallenges.size,
        hintsUsed: Object.keys(userProgress.hintsUsed).length,
        categories: {}
    };
    
    // Count by category
    Object.keys(allChallenges).forEach(category => {
        const challenges = allChallenges[category] || [];
        const solved = challenges.filter(c => {
            const progress = userProgressDB[c.challenge_id];
            return progress?.is_solved;
        }).length;
        
        stats.categories[category] = {
            total: challenges.length,
            solved: solved,
            percentage: challenges.length > 0 ? Math.round((solved / challenges.length) * 100) : 0
        };
    });
    
    return stats;
}

// Export user data
function exportUserData() {
    const data = {
        user: currentUser,
        progress: userProgress,
        stats: getUserStats(),
        timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ctf-progress-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

// Import user data
function importUserData(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            userProgress.currentPoints = data.progress.currentPoints || 0;
            userProgress.solvedChallenges = new Set(data.progress.solvedChallenges || []);
            userProgress.hintsUsed = data.progress.hintsUsed || {};
            saveProgressToLocalStorage();
            showToast('✅ Data imported successfully!', 'success');
        } catch (error) {
            console.error('Import error:', error);
            showToast('❌ Failed to import data', 'error');
        }
    };
    reader.readAsText(file);
}

// Clear all local data
function clearAllData() {
    if (confirm('Are you sure you want to clear all local data? This cannot be undone.')) {
        localStorage.removeItem('ctf_progress');
        userProgress.currentPoints = 0;
        userProgress.solvedChallenges.clear();
        userProgress.hintsUsed = {};
        showToast('🗑️ All local data cleared', 'info');
        location.reload();
    }
}

// ==========================================
// Search and Filter Functions
// ==========================================

function searchChallenges(query) {
    query = query.toLowerCase();
    const results = [];
    
    Object.keys(allChallenges).forEach(category => {
        allChallenges[category].forEach(challenge => {
            if (challenge.title.toLowerCase().includes(query) ||
                challenge.description.toLowerCase().includes(query) ||
                challenge.category.toLowerCase().includes(query)) {
                results.push({
                    ...challenge,
                    category: category
                });
            }
        });
    });
    
    return results;
}

function filterChallengesByDifficulty(difficulty) {
    const results = [];
    
    Object.keys(allChallenges).forEach(category => {
        allChallenges[category].forEach(challenge => {
            if (challenge.difficulty === difficulty) {
                results.push({
                    ...challenge,
                    category: category
                });
            }
        });
    });
    
    return results;
}

function getUnsolvedChallenges() {
    const results = [];
    
    Object.keys(allChallenges).forEach(category => {
        allChallenges[category].forEach(challenge => {
            const progress = userProgressDB[challenge.challenge_id];
            if (!progress?.is_solved) {
                results.push({
                    ...challenge,
                    category: category
                });
            }
        });
    });
    
    return results;
}

// ==========================================
// Leaderboard Functions
// ==========================================

async function getLeaderboard(limit = 10) {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('user_id, username, display_name, score, xp')
            .order('score', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('Error fetching leaderboard:', error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        return [];
    }
}

async function getUserRank() {
    if (!currentUser) return null;
    
    try {
        const { count, error } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .gt('score', currentUser.score || 0);

        if (error) {
            console.error('Error fetching user rank:', error);
            return null;
        }

        return (count || 0) + 1;
    } catch (error) {
        console.error('Error fetching user rank:', error);
        return null;
    }
}

// ==========================================
// Achievement System (Optional)
// ==========================================

const achievements = {
    'first_blood': {
        name: 'First Blood',
        description: 'Solve your first challenge',
        icon: '🩸',
        check: () => userProgress.solvedChallenges.size >= 1
    },
    'hint_master': {
        name: 'No Hints Needed',
        description: 'Solve 5 challenges without using any hints',
        icon: '🧠',
        check: () => {
            // Implementation would require tracking
            return false;
        }
    },
    'speedster': {
        name: 'Speedster',
        description: 'Solve a challenge in under 5 minutes',
        icon: '⚡',
        check: () => {
            // Implementation would require time tracking
            return false;
        }
    },
    'category_master': {
        name: 'Category Master',
        description: 'Complete all challenges in a category',
        icon: '🏆',
        check: () => {
            const stats = getUserStats();
            return Object.values(stats.categories).some(cat => cat.percentage === 100);
        }
    }
};

function checkAchievements() {
    const unlocked = [];
    Object.keys(achievements).forEach(key => {
        const achievement = achievements[key];
        if (achievement.check()) {
            unlocked.push({
                id: key,
                ...achievement
            });
        }
    });
    return unlocked;
}

// ==========================================
// Module Exports
// ==========================================

export {
    // Core Functions
    openChallengeList,
    closeModal,
    confirmBackToCategory,
    openChallenge,
    submitFlag,
    unlockHint,
    toggleHint,
    
    // Helper Functions
    showToast,
    showNotification,
    createParticles,
    createConfetti,
    getChallengeById,
    getUserStats,
    
    // Data Management
    exportUserData,
    importUserData,
    clearAllData,
    
    // Search & Filter
    searchChallenges,
    filterChallengesByDifficulty,
    getUnsolvedChallenges,
    
    // Leaderboard
    getLeaderboard,
    getUserRank,
    
    // Achievements
    checkAchievements,
    
    // State
    currentUser,
    allChallenges,
    userProgress,
    userProgressDB
};

// ==========================================
// Global API Object
// ==========================================

window.CTF = {
    // Core Functions
    openChallenge: openChallengeList,
    closeModal,
    submitFlag,
    
    // User Data
    getUser: () => currentUser,
    getStats: getUserStats,
    exportData: exportUserData,
    clearData: clearAllData,
    
    // Challenge Data
    getAllChallenges: () => allChallenges,
    getChallengeById,
    searchChallenges,
    filterByDifficulty: filterChallengesByDifficulty,
    getUnsolved: getUnsolvedChallenges,
    
    // Leaderboard
    getLeaderboard,
    getRank: getUserRank,
    
    // Achievements
    checkAchievements,
    
    // Utils
    showToast,
    createConfetti
};

// ==========================================
// Final Initialization Message
// ==========================================

console.log('%c\n✨ secXplore CTF Platform Ready!', 'color: #00FF88; font-weight: bold; font-size: 16px;');
console.log('%c   Good luck and happy hacking! 🎯\n', 'color: #00D9FF; font-size: 12px;');
console.log('%c   API available at window.CTF', 'color: #888; font-size: 11px;');
console.log('%c   Example: CTF.getStats()\n', 'color: #888; font-size: 11px;');

// ==========================================
// Version Information
// ==========================================

const VERSION = '1.0.0';
const BUILD_DATE = '2024-11-19';

console.log(`%c📦 Version: ${VERSION} (Build: ${BUILD_DATE})`, 'color: #888;');

window.CTF.version = VERSION;
window.CTF.buildDate = BUILD_DATE;

// ==========================================
// Feature Flags
// ==========================================

const FEATURES = {
    INTERACTIVE_CHALLENGES: true,
    DATABASE_INTEGRATION: true,
    HINT_SYSTEM: true,
    LEADERBOARD: true,
    ACHIEVEMENTS: false, // Not yet implemented
    TEAM_MODE: false,    // Future feature
    LIVE_CHAT: false     // Future feature
};

window.CTF.features = FEATURES;

// ==========================================
// API Documentation Helper
// ==========================================

window.CTF.help = function() {
    console.log('%c\n📚 CTF Platform API Documentation', 'color: #00D9FF; font-weight: bold; font-size: 14px;');
    console.log('\n%c🎯 Core Functions:', 'color: #00FF88; font-weight: bold;');
    console.log('  CTF.openChallenge(category)  - Open challenge list for category');
    console.log('  CTF.submitFlag(challengeId)  - Submit flag for challenge');
    console.log('  CTF.closeModal()             - Close current modal');
    
    console.log('\n%c👤 User Functions:', 'color: #00FF88; font-weight: bold;');
    console.log('  CTF.getUser()                - Get current user info');
    console.log('  CTF.getStats()               - Get user statistics');
    console.log('  CTF.exportData()             - Export progress data');
    console.log('  CTF.clearData()              - Clear all local data');
    
    console.log('\n%c🔍 Search & Filter:', 'color: #00FF88; font-weight: bold;');
    console.log('  CTF.searchChallenges(query)  - Search challenges by keyword');
    console.log('  CTF.filterByDifficulty(diff) - Filter by difficulty (easy/medium/hard/expert)');
    console.log('  CTF.getUnsolved()            - Get unsolved challenges');
    
    console.log('\n%c🏆 Leaderboard:', 'color: #00FF88; font-weight: bold;');
    console.log('  CTF.getLeaderboard(limit)    - Get top users (default: 10)');
    console.log('  CTF.getRank()                - Get current user rank');
    
    console.log('\n%c🎨 UI Functions:', 'color: #00FF88; font-weight: bold;');
    console.log('  CTF.showToast(msg, type)     - Show toast notification');
    console.log('  CTF.createConfetti()         - Trigger confetti effect');
    
    console.log('\n%c💡 Examples:', 'color: #FFD700; font-weight: bold;');
    console.log('  CTF.getStats()                          - View your progress');
    console.log('  CTF.searchChallenges("sql")            - Find SQL challenges');
    console.log('  CTF.filterByDifficulty("easy")         - Show easy challenges');
    console.log('  CTF.getLeaderboard(20)                 - Top 20 users');
    console.log('\n');
};

// Show help on first load (dev mode only)
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('%cℹ️ Type CTF.help() for API documentation', 'color: #00D9FF;');
}

// ==========================================
// Cleanup Functions
// ==========================================

function cleanup() {
    // Stop all intervals
    stopAutoRefresh();
    
    // Clear all timeouts
    let id = window.setTimeout(function() {}, 0);
    while (id--) {
        window.clearTimeout(id);
    }
    
    // Remove event listeners
    document.removeEventListener('visibilitychange', () => {});
    window.removeEventListener('online', () => {});
    window.removeEventListener('offline', () => {});
    
    console.log('Cleanup completed');
}

window.CTF.cleanup = cleanup;

// Final export
export default {
    version: VERSION,
    buildDate: BUILD_DATE,
    features: FEATURES,
    init: initializeChallenges,
    cleanup,
    api: window.CTF
};
