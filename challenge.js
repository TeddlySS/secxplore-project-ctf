// challenge.js - Hybrid Version (รองรับทั้ง Hardcoded + Database)
import { supabase } from './supabaseClient.js';
import { setupNavUser } from './navAuth.js';

let currentUser = null;
let databaseChallenges = []; // โจทย์จาก database
let hardcodedChallenges = {}; // โจทย์แบบเดิม
let userProgress = {};

const HINT_PENALTY = 10;

// ==========================================
// Authentication
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

// ==========================================
// Load Challenges (Both Hardcoded + Database)
// ==========================================

async function loadAllChallenges() {
    try {
        // 1. Load challenges from database
        const { data, error } = await supabase
            .from('challenges')
            .select('*')
            .eq('is_active', true)
            .eq('visibility', 'public')
            .order('difficulty', { ascending: true });

        if (!error && data) {
            databaseChallenges = data;
        }

        // 2. Load hardcoded challenges (interactive ones)
        loadHardcodedChallenges();

        // 3. Load user progress
        if (currentUser) {
            await loadUserProgress();
        }

        // 4. Render all challenges
        renderAllChallenges();
    } catch (error) {
        console.error('Error loading challenges:', error);
    }
}

function loadHardcodedChallenges() {
    // โจทย์แบบเดิมที่มี interactive UI
    hardcodedChallenges = {
        web: [
            {
                id: 'sql-injection',
                name: 'SQL Injection Login Bypass',
                description: 'ระบบ login มีช่องโหว่ SQL Injection ที่ต้องใช้เทคนิคขั้นสูง bypass ด้วย comment และ logic manipulation',
                points: 100,
                difficulty: 'easy',
                category: 'web',
                flag: 'CTF{sql_1nj3ct10n_byp4ss}',
                interactive: true,
                interactiveId: 'sqlInjection'
            },
            {
                id: 'cmd-injection',
                name: 'Command Injection Shell',
                description: 'Web app ที่รัน system commands โดยไม่ filter input ให้หา flag ที่ซ่อนอยู่ในระบบไฟล์',
                points: 250,
                difficulty: 'medium',
                category: 'web',
                flag: 'CTF{c0mm4nd_1nj3ct10n_pwn3d}',
                interactive: true,
                interactiveId: 'cmdInjection'
            },
            {
                id: 'xss-stealer',
                name: 'XSS Cookie Stealer',
                description: 'หาช่องโหว่ XSS และสร้าง payload ที่ซับซ้อนเพื่อ bypass XSS filter และ steal admin session',
                points: 350,
                difficulty: 'hard',
                category: 'web',
                flag: 'CTF{xss_c00k13_st34l3r}',
                interactive: true,
                interactiveId: 'xssStealer'
            },
            {
                id: 'jwt-hack',
                name: 'JWT Token Manipulation',
                description: 'แก้ไข JWT token โดยใช้ช่องโหว่ Algorithm Confusion เพื่อเข้าถึงข้อมูลของ admin',
                points: 400,
                difficulty: 'expert',
                category: 'web',
                flag: 'CTF{jwt_alg0r1thm_c0nfus10n}',
                interactive: true,
                interactiveId: 'jwtHack'
            }
        ],
        crypto: [
            {
                id: 'multi-cipher',
                name: 'Multi-Layer Cipher',
                description: 'ข้อความถูกเข้ารหัสด้วย Caesar, Base64, และ ROT13 ซ้อนกัน ต้องถอดรหัสทีละชั้น',
                points: 100,
                difficulty: 'easy',
                category: 'crypto',
                flag: 'CTF{mult1_l4y3r_c1ph3r}',
                interactive: true,
                interactiveId: 'multiCipher'
            },
            {
                id: 'xor-bruteforce',
                name: 'XOR Brute Force',
                description: 'ข้อความถูกเข้ารหัสด้วย XOR single-byte key ให้ brute force หา key และถอดรหัส',
                points: 300,
                difficulty: 'medium',
                category: 'crypto',
                flag: 'CTF{x0r_s1ngl3_byt3}',
                interactive: true,
                interactiveId: 'xorKnown'
            }
        ],
        forensics: [
            {
                id: 'exif-data',
                name: 'Hidden Birthday Message',
                description: 'รูปภาพ Happy Birthday มีข้อมูลที่ซ่อนอยู่ใน EXIF metadata ให้ใช้เครื่องมือวิเคราะห์หา flag',
                points: 100,
                difficulty: 'easy',
                category: 'forensics',
                flag: 'CTF{ex1f_h1dd3n_m3ss4g3}',
                interactive: true,
                interactiveId: 'birthdayExif'
            }
        ]
    };
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

        userProgress = {};
        if (data) {
            data.forEach(progress => {
                userProgress[progress.challenge_id] = progress;
            });
        }
    } catch (error) {
        console.error('Error loading user progress:', error);
    }
}

// ==========================================
// Render Challenges
// ==========================================

function renderAllChallenges() {
    const categories = ['web', 'crypto', 'forensics', 'pwn', 'reverse', 'misc'];
    
    categories.forEach(category => {
        const container = document.querySelector(`#${category}-challenges .challenges-grid`);
        if (!container) return;

        // รวมโจทย์จาก database + hardcoded
        const dbChallenges = databaseChallenges.filter(c => c.category === category);
        const hcChallenges = hardcodedChallenges[category] || [];
        
        const allChallenges = [
            ...dbChallenges.map(c => ({
                ...c,
                isDatabase: true
            })),
            ...hcChallenges.map(c => ({
                ...c,
                isDatabase: false,
                challenge_id: c.id
            }))
        ];

        if (allChallenges.length === 0) {
            container.innerHTML = '<p style="color: #888; text-align: center; grid-column: 1/-1;">ยังไม่มีโจทย์ในหมวดนี้</p>';
            return;
        }

        container.innerHTML = allChallenges.map(challenge => {
            const progress = userProgress[challenge.challenge_id];
            const isSolved = progress?.is_solved || false;
            const attempts = progress?.attempts_count || 0;

            return `
                <div class="challenge-card ${isSolved ? 'solved' : ''}" data-challenge-id="${challenge.challenge_id}">
                    <div class="challenge-header">
                        <h3 class="challenge-title">${challenge.title || challenge.name}</h3>
                        <span class="difficulty-badge ${challenge.difficulty}">${challenge.difficulty}</span>
                        ${!challenge.isDatabase ? '<span class="interactive-badge">🎮 Interactive</span>' : ''}
                    </div>
                    <p class="challenge-description">${challenge.description}</p>
                    <div class="challenge-meta">
                        <span class="points">
                            <i class="fas fa-star"></i> ${challenge.score_base || challenge.points} pts
                        </span>
                        ${attempts > 0 ? `<span class="attempts">${attempts} attempts</span>` : ''}
                        ${isSolved ? '<span class="solved-badge"><i class="fas fa-check"></i> Solved</span>' : ''}
                    </div>
                    <button class="challenge-btn" onclick="${challenge.interactive ? `openInteractiveChallenge('${challenge.interactiveId}')` : `openChallengeModal('${challenge.challenge_id}', ${challenge.isDatabase})`}">
                        ${isSolved ? 'View Challenge' : 'Start Challenge'}
                    </button>
                </div>
            `;
        }).join('');
    });
}

// ==========================================
// Modal for Database Challenges
// ==========================================

async function openChallengeModal(challengeId, isDatabase) {
    const authUser = await requireChallengeAuth();
    if (!authUser) return;

    if (isDatabase) {
        await openDatabaseChallengeModal(challengeId);
    } else {
        // Fallback for non-interactive hardcoded challenges
        await openDatabaseChallengeModal(challengeId);
    }
}

async function openDatabaseChallengeModal(challengeId) {
    const challenge = databaseChallenges.find(c => c.challenge_id === parseInt(challengeId));
    if (!challenge) return;

    // Load hints
    const { data: hints } = await supabase
        .from('hints')
        .select('*')
        .eq('challenge_id', challengeId)
        .order('order_index', { ascending: true });

    // Load unlocked hints
    const { data: unlockedHints } = await supabase
        .from('user_hints')
        .select('hint_id')
        .eq('user_id', currentUser.user_id)
        .eq('challenge_id', challengeId);

    const unlockedHintIds = new Set(unlockedHints?.map(h => h.hint_id) || []);
    const progress = userProgress[challengeId];
    const isSolved = progress?.is_solved || false;

    // Render modal
    const modal = document.getElementById('challengeModal');
    const modalContent = document.getElementById('modalChallengeContent');
    
    modalContent.innerHTML = `
        <div class="modal-header">
            <h2>${challenge.title}</h2>
            <span class="difficulty-badge ${challenge.difficulty}">${challenge.difficulty}</span>
            <button class="close-modal" onclick="closeChallengeModal()">&times;</button>
        </div>
        
        <div class="modal-body">
            <div class="challenge-info">
                <p><strong>Category:</strong> ${challenge.category}</p>
                <p><strong>Points:</strong> ${challenge.score_base}</p>
                ${challenge.challenge_url ? `<p><strong>URL:</strong> <a href="${challenge.challenge_url}" target="_blank">${challenge.challenge_url}</a></p>` : ''}
                ${challenge.tags && challenge.tags.length > 0 ? `<p><strong>Tags:</strong> ${challenge.tags.join(', ')}</p>` : ''}
            </div>
            
            <div class="challenge-description">
                <h3>Description</h3>
                <p>${challenge.description}</p>
            </div>

            ${hints && hints.length > 0 ? `
            <div class="hints-section">
                <h3>Hints</h3>
                ${hints.map(hint => `
                    <div class="hint-item" id="hint-${hint.hint_id}">
                        <div class="hint-header">
                            <span class="hint-name">${hint.name}</span>
                            <span class="hint-cost">-${hint.cost} pts</span>
                        </div>
                        ${unlockedHintIds.has(hint.hint_id) ? `
                            <div class="hint-content unlocked">
                                <p>${hint.text}</p>
                            </div>
                        ` : `
                            <button class="hint-unlock-btn" onclick="unlockHint(${hint.hint_id}, ${challenge.challenge_id}, ${hint.cost})">
                                Unlock Hint
                            </button>
                        `}
                    </div>
                `).join('')}
            </div>
            ` : ''}

            <div class="flag-submission">
                <h3>Submit Flag</h3>
                ${challenge.flag_format ? `<p class="flag-format">Format: <code>${challenge.flag_format}</code></p>` : ''}
                <div class="flag-input-group">
                    <input type="text" id="flagInput" placeholder="Enter flag here..." ${isSolved ? 'disabled' : ''}>
                    <button onclick="submitFlag(${challengeId})" ${isSolved ? 'disabled' : ''}>
                        ${isSolved ? 'Already Solved' : 'Submit'}
                    </button>
                </div>
                <div id="flagResult"></div>
            </div>
        </div>
    `;

    modal.style.display = 'flex';
}

function closeChallengeModal() {
    const modal = document.getElementById('challengeModal');
    if (modal) modal.style.display = 'none';
}

// ==========================================
// Interactive Challenges (แบบเดิม)
// ==========================================

function openInteractiveChallenge(interactiveId) {
    // เปิด UI ของโจทย์ interactive แบบเดิม
    const section = document.getElementById(interactiveId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Highlight animation
        section.style.animation = 'highlight 1s ease';
        setTimeout(() => {
            section.style.animation = '';
        }, 1000);
    }
}

// ==========================================
// Hint System
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
            alert('ไม่สามารถปลดล็อก hint ได้');
            return;
        }

        openDatabaseChallengeModal(challengeId);
        showToast('ปลดล็อก hint สำเร็จ!', 'success');
    } catch (error) {
        console.error('Error unlocking hint:', error);
        alert('เกิดข้อผิดพลาดในการปลดล็อก hint');
    }
}

// ==========================================
// Flag Submission
// ==========================================

async function submitFlag(challengeId) {
    if (!currentUser) {
        alert('กรุณาเข้าสู่ระบบก่อน');
        return;
    }

    const flagInput = document.getElementById('flagInput');
    const flagResult = document.getElementById('flagResult');
    const submittedFlag = flagInput.value.trim();

    if (!submittedFlag) {
        flagResult.innerHTML = '<p class="error">กรุณากรอก flag</p>';
        return;
    }

    const challenge = databaseChallenges.find(c => c.challenge_id === challengeId);
    if (!challenge) return;

    const isCorrect = submittedFlag === challenge.flag;

    // Count hints used
    const { count: hintsUsedCount } = await supabase
        .from('user_hints')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', currentUser.user_id)
        .eq('challenge_id', challengeId);

    const hintsUsed = hintsUsedCount || 0;
    const pointsEarned = isCorrect ? Math.max(0, challenge.score_base - (hintsUsed * 10)) : 0;

    try {
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
            flagResult.innerHTML = '<p class="error">เกิดข้อผิดพลาดในการส่ง flag</p>';
            return;
        }

        if (isCorrect) {
            flagResult.innerHTML = `
                <p class="success">
                    <i class="fas fa-check-circle"></i> 
                    ถูกต้อง! คุณได้รับ ${pointsEarned} คะแนน
                </p>
            `;
            flagInput.disabled = true;
            
            await loadUserProgress();
            renderAllChallenges();
            
            showToast(`🎉 ยินดีด้วย! คุณทำโจทย์ "${challenge.title}" สำเร็จ`, 'success');
            
            setTimeout(() => {
                closeChallengeModal();
            }, 2000);
        } else {
            flagResult.innerHTML = '<p class="error"><i class="fas fa-times-circle"></i> Flag ไม่ถูกต้อง ลองใหม่อีกครั้ง</p>';
        }
    } catch (error) {
        console.error('Error submitting flag:', error);
        flagResult.innerHTML = '<p class="error">เกิดข้อผิดพลาดในการส่ง flag</p>';
    }
}

// ==========================================
// Toast & Particles
// ==========================================

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 100);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
}

function createParticles() {
    const particlesContainer = document.getElementById('particles');
    if (!particlesContainer) return;
    
    for (let i = 0; i < 100; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 15 + 's';
        particle.style.animationDuration = (Math.random() * 10 + 10) + 's';
        particlesContainer.appendChild(particle);
    }
}

// ==========================================
// Initialize
// ==========================================

document.addEventListener('DOMContentLoaded', async () => {
    createParticles();
    await setupNavUser();
    await ensureUserRow();
    await loadAllChallenges();
    
    // โหลด interactive challenges UI แบบเดิม (ถ้ามี)
    if (typeof initializeInteractiveChallenges === 'function') {
        initializeInteractiveChallenges();
    }
});

// Make functions global
window.openChallengeModal = openChallengeModal;
window.closeChallengeModal = closeChallengeModal;
window.openInteractiveChallenge = openInteractiveChallenge;
window.unlockHint = unlockHint;
window.submitFlag = submitFlag;