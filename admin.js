// admin.js
import { supabase } from './supabaseClient.js';
import { setupNavUser } from './navAuth.js';

const state = {
    currentSection: 'dashboard',
    challenges: [],
    users: [],
    submissions: [],
    hints: [],
    selectedChallenge: null,
    currentUser: null
};

// ==========================================
// Initialization
// ==========================================

document.addEventListener('DOMContentLoaded', async () => {
    await initializeAdmin();
    setupEventListeners();
});

async function initializeAdmin() {
    // Check if user is admin
    const { data: authData, error: authError } = await supabase.auth.getUser();
    
    if (authError || !authData.user) {
        alert('กรุณาเข้าสู่ระบบ');
        window.location.href = 'login.html';
        return;
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('email', authData.user.email)
        .single();

    if (profileError || !profile) {
        alert('ไม่สามารถโหลดข้อมูลผู้ใช้ได้');
        window.location.href = 'home.html';
        return;
    }

    if (profile.role !== 'admin') {
        alert('คุณไม่มีสิทธิ์เข้าถึงหน้านี้');
        window.location.href = 'home.html';
        return;
    }

    state.currentUser = profile;
    document.getElementById('adminUsername').textContent = profile.username;
    
    await setupNavUser();
    showSection('dashboard');
}

function setupEventListeners() {
    // Challenge form
    const challengeForm = document.getElementById('challengeForm');
    if (challengeForm) {
        challengeForm.addEventListener('submit', handleChallengeSubmit);
    }
    
    // Hint form
    const hintForm = document.getElementById('hintForm');
    if (hintForm) {
        hintForm.addEventListener('submit', handleHintSubmit);
    }
}

// ==========================================
// Navigation
// ==========================================

function showSection(sectionName) {
    // Update active menu item
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    const activeItem = document.querySelector(`[onclick="showSection('${sectionName}')"]`);
    if (activeItem) activeItem.classList.add('active');
    
    // Update active section
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.remove('active');
    });
    const activeSection = document.getElementById(`section-${sectionName}`);
    if (activeSection) activeSection.classList.add('active');
    
    state.currentSection = sectionName;
    
    // Load section data
    loadSectionData(sectionName);
}

async function loadSectionData(sectionName) {
    switch(sectionName) {
        case 'dashboard':
            await loadDashboardData();
            break;
        case 'challenges':
            await loadChallenges();
            break;
        case 'hints':
            await loadHintsChallenges();
            break;
        case 'users':
            await loadUsers();
            break;
        case 'submissions':
            await loadSubmissions();
            break;
    }
}

// ==========================================
// Dashboard Functions
// ==========================================

async function loadDashboardData() {
    try {
        // Get total challenges
        const { count: totalChallenges } = await supabase
            .from('challenges')
            .select('*', { count: 'exact', head: true });

        // Get total users
        const { count: totalUsers } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'active');

        // Get total submissions
        const { count: totalSubmissions } = await supabase
            .from('submissions')
            .select('*', { count: 'exact', head: true });

        // Calculate solve rate
        const { count: correctSubmissions } = await supabase
            .from('submissions')
            .select('*', { count: 'exact', head: true })
            .eq('is_correct', true);

        const solveRate = totalSubmissions > 0 
            ? ((correctSubmissions / totalSubmissions) * 100).toFixed(1)
            : 0;

        // Update dashboard stats
        document.getElementById('totalChallenges').textContent = totalChallenges || 0;
        document.getElementById('totalUsers').textContent = totalUsers || 0;
        document.getElementById('totalSubmissions').textContent = totalSubmissions || 0;
        document.getElementById('solveRate').textContent = solveRate + '%';

        // Load recent activity
        await loadRecentActivity();
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

async function loadRecentActivity() {
    try {
        // Get recent submissions
        const { data: recentSubmissions } = await supabase
            .from('submissions')
            .select(`
                *,
                users!inner(username),
                challenges!inner(title)
            `)
            .order('submitted_at', { ascending: false })
            .limit(5);

        const activityList = document.getElementById('recentActivityList');
        if (!activityList) return;

        if (!recentSubmissions || recentSubmissions.length === 0) {
            activityList.innerHTML = '<p>ยังไม่มีกิจกรรม</p>';
            return;
        }

        activityList.innerHTML = recentSubmissions.map(sub => {
            const icon = sub.is_correct ? '🎉' : '❌';
            const action = sub.is_correct ? 'solved' : 'attempted';
            const timeAgo = getTimeAgo(new Date(sub.submitted_at));
            
            return `
                <div class="activity-item">
                    <span class="activity-icon">${icon}</span>
                    <span class="activity-text">
                        User "${sub.users.username}" ${action} "${sub.challenges.title}"
                    </span>
                    <span class="activity-time">${timeAgo}</span>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading recent activity:', error);
    }
}

function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 60) return seconds + ' seconds ago';
    if (seconds < 3600) return Math.floor(seconds / 60) + ' minutes ago';
    if (seconds < 86400) return Math.floor(seconds / 3600) + ' hours ago';
    return Math.floor(seconds / 86400) + ' days ago';
}

// ==========================================
// Challenges Management
// ==========================================

async function loadChallenges() {
    try {
        const { data, error } = await supabase
            .from('challenges')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        state.challenges = data || [];
        renderChallengesList();
    } catch (error) {
        console.error('Error loading challenges:', error);
        showToast('ไม่สามารถโหลดข้อมูลโจทย์ได้', 'error');
    }
}

function renderChallengesList() {
    const tbody = document.querySelector('#challengesTable tbody');
    if (!tbody) return;

    if (state.challenges.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">ยังไม่มีโจทย์</td></tr>';
        return;
    }

    tbody.innerHTML = state.challenges.map(challenge => `
        <tr>
            <td>${challenge.challenge_id}</td>
            <td>${challenge.title}</td>
            <td><span class="badge badge-${challenge.category}">${challenge.category}</span></td>
            <td><span class="badge badge-${challenge.difficulty}">${challenge.difficulty}</span></td>
            <td>${challenge.score_base}</td>
            <td><span class="badge ${challenge.is_active ? 'badge-success' : 'badge-danger'}">${challenge.is_active ? 'Active' : 'Inactive'}</span></td>
            <td>
                <button class="btn-icon" onclick="editChallenge(${challenge.challenge_id})" title="Edit">✏️</button>
                <button class="btn-icon" onclick="deleteChallenge(${challenge.challenge_id})" title="Delete">🗑️</button>
            </td>
        </tr>
    `).join('');
}

async function handleChallengeSubmit(e) {
    e.preventDefault();
    
    const formData = {
        code: document.getElementById('challengeCode').value.trim(),
        title: document.getElementById('challengeTitle').value.trim(),
        description: document.getElementById('challengeDescription').value.trim(),
        category: document.getElementById('challengeCategory').value,
        difficulty: document.getElementById('challengeDifficulty').value,
        score_base: parseInt(document.getElementById('challengePoints').value),
        flag: document.getElementById('challengeFlag').value.trim(),
        flag_format: document.getElementById('flagFormat').value.trim(),
        challenge_url: document.getElementById('challengeUrl').value.trim(),
        is_active: document.getElementById('isActive').checked,
        visibility: document.getElementById('visibility').value,
    };

    try {
        const { error } = await supabase
            .from('challenges')
            .insert(formData);

        if (error) throw error;

        showToast('เพิ่มโจทย์สำเร็จ!', 'success');
        document.getElementById('challengeForm').reset();
        await loadChallenges();
    } catch (error) {
        console.error('Error adding challenge:', error);
        showToast('ไม่สามารถเพิ่มโจทย์ได้: ' + error.message, 'error');
    }
}

async function deleteChallenge(challengeId) {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบโจทย์นี้?')) return;

    try {
        const { error } = await supabase
            .from('challenges')
            .delete()
            .eq('challenge_id', challengeId);

        if (error) throw error;

        showToast('ลบโจทย์สำเร็จ!', 'success');
        await loadChallenges();
    } catch (error) {
        console.error('Error deleting challenge:', error);
        showToast('ไม่สามารถลบโจทย์ได้: ' + error.message, 'error');
    }
}

// ==========================================
// Users Management
// ==========================================

async function loadUsers() {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        state.users = data || [];
        renderUsersList();
    } catch (error) {
        console.error('Error loading users:', error);
        showToast('ไม่สามารถโหลดข้อมูลผู้ใช้ได้', 'error');
    }
}

function renderUsersList() {
    const tbody = document.querySelector('#usersTable tbody');
    if (!tbody) return;

    if (state.users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">ยังไม่มีผู้ใช้</td></tr>';
        return;
    }

    tbody.innerHTML = state.users.map(user => `
        <tr>
            <td>${user.user_id}</td>
            <td>${user.username}</td>
            <td>${user.email}</td>
            <td>${user.score}</td>
            <td><span class="badge badge-${user.role}">${user.role}</span></td>
            <td><span class="badge ${user.status === 'active' ? 'badge-success' : 'badge-danger'}">${user.status}</span></td>
        </tr>
    `).join('');
}

// ==========================================
// Submissions Management
// ==========================================

async function loadSubmissions() {
    try {
        const { data, error } = await supabase
            .from('submissions')
            .select(`
                *,
                users!inner(username),
                challenges!inner(title)
            `)
            .order('submitted_at', { ascending: false })
            .limit(100);

        if (error) throw error;

        state.submissions = data || [];
        renderSubmissionsList();
    } catch (error) {
        console.error('Error loading submissions:', error);
        showToast('ไม่สามารถโหลดข้อมูล submissions ได้', 'error');
    }
}

function renderSubmissionsList() {
    const tbody = document.querySelector('#submissionsTable tbody');
    if (!tbody) return;

    if (state.submissions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">ยังไม่มี submissions</td></tr>';
        return;
    }

    tbody.innerHTML = state.submissions.map(sub => `
        <tr>
            <td>${sub.submission_id}</td>
            <td>${sub.users.username}</td>
            <td>${sub.challenges.title}</td>
            <td><code>${sub.flag_submitted}</code></td>
            <td><span class="badge ${sub.is_correct ? 'badge-success' : 'badge-danger'}">${sub.is_correct ? 'Correct' : 'Wrong'}</span></td>
            <td>${new Date(sub.submitted_at).toLocaleString()}</td>
        </tr>
    `).join('');
}

// ==========================================
// Hints Management
// ==========================================

async function loadHintsChallenges() {
    await loadChallenges();
    populateHintChallengeSelect();
}

function populateHintChallengeSelect() {
    const select = document.getElementById('hintChallengeId');
    if (!select) return;

    select.innerHTML = '<option value="">เลือกโจทย์</option>' +
        state.challenges.map(c => 
            `<option value="${c.challenge_id}">${c.title}</option>`
        ).join('');
}

async function handleHintSubmit(e) {
    e.preventDefault();
    
    const formData = {
        challenge_id: parseInt(document.getElementById('hintChallengeId').value),
        name: document.getElementById('hintName').value.trim(),
        text: document.getElementById('hintText').value.trim(),
        cost: parseInt(document.getElementById('hintCost').value),
        order_index: parseInt(document.getElementById('hintOrder').value),
    };

    try {
        const { error } = await supabase
            .from('hints')
            .insert(formData);

        if (error) throw error;

        showToast('เพิ่ม hint สำเร็จ!', 'success');
        document.getElementById('hintForm').reset();
    } catch (error) {
        console.error('Error adding hint:', error);
        showToast('ไม่สามารถเพิ่ม hint ได้: ' + error.message, 'error');
    }
}

// ==========================================
// Toast Notification
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

// ==========================================
// Make functions global
// ==========================================

window.showSection = showSection;
window.editChallenge = async (id) => { /* TODO */ };
window.deleteChallenge = deleteChallenge;