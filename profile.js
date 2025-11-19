// profile.js
import { supabase } from './supabaseClient.js';
import { setupNavUser } from './navAuth.js';

// State Management
let userData = null;
let editMode = false;
let currentPasswordStep = 1;
let otpTimer = null;
let otpTimeLeft = 60;

// Initialize Page
document.addEventListener('DOMContentLoaded', async function() {
    createParticles();
    await setupNavUser();
    await loadUserData();
});

// Create Particles
function createParticles() {
    const particlesContainer = document.getElementById('particles');
    if (!particlesContainer) return;
    
    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 15 + 's';
        particle.style.animationDuration = (Math.random() * 10 + 10) + 's';
        particlesContainer.appendChild(particle);
    }
}

// Load User Data from Database
async function loadUserData() {
    try {
        // Get current auth user
        const { data: authData, error: authError } = await supabase.auth.getUser();
        
        if (authError || !authData.user) {
            window.location.href = 'login.html';
            return;
        }

        const authUser = authData.user;

        // Get user profile from users table
        const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('email', authUser.email)
            .single();

        if (profileError) {
            console.error('Error loading profile:', profileError);
            showToast('ไม่สามารถโหลดข้อมูลโปรไฟล์ได้', 'error');
            return;
        }

        // Get user statistics
        const { data: stats } = await supabase.rpc('get_user_stats', {
            user_id_param: profile.user_id
        });

        const userStats = stats && stats.length > 0 ? stats[0] : {
            total_submissions: 0,
            correct_submissions: 0,
            challenges_solved: 0,
            total_hints_used: 0,
            current_rank: 0,
            accuracy: 0
        };

        // Format date
        const memberSince = new Date(profile.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // Set userData
        userData = {
            user_id: profile.user_id,
            username: profile.username,
            displayName: profile.display_name || profile.username,
            email: profile.email,
            avatar: profile.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.display_name || profile.username)}&size=200&background=00ff88&color=0a0e27&bold=true`,
            role: profile.role,
            score: profile.score || 0,
            xp: profile.xp || 0,
            rank: userStats.current_rank || 0,
            solvedChallenges: userStats.challenges_solved || 0,
            totalSubmissions: userStats.total_submissions || 0,
            accuracy: userStats.accuracy || 0,
            memberSince: memberSince,
            twoFactorEnabled: false
        };

        // Update UI
        updateUI();
    } catch (error) {
        console.error('Error loading user data:', error);
        showToast('เกิดข้อผิดพลาดในการโหลดข้อมูล', 'error');
    }
}

// Update UI with user data
function updateUI() {
    if (!userData) return;

    // Profile header
    document.getElementById('displayUsername').textContent = '@' + userData.username;
    document.getElementById('userRole').textContent = userData.role.charAt(0).toUpperCase() + userData.role.slice(1);
    document.getElementById('userScore').textContent = userData.score;
    document.getElementById('userRank').textContent = '#' + userData.rank;
    document.getElementById('solvedChallenges').textContent = userData.solvedChallenges;
    
    // Account info
    document.getElementById('username').value = userData.username;
    document.getElementById('displayName').value = userData.displayName;
    document.getElementById('email').value = userData.email;
    document.getElementById('memberSince').value = userData.memberSince;
    document.getElementById('userEmail').textContent = userData.email;
    
    // Avatar
    document.getElementById('avatarPreview').src = userData.avatar;
    
    // 2FA
    const twoFactorToggle = document.getElementById('twoFactorToggle');
    if (twoFactorToggle) {
        twoFactorToggle.checked = userData.twoFactorEnabled;
    }

    // Stats (if elements exist)
    const totalSubmissionsEl = document.getElementById('totalSubmissions');
    const accuracyEl = document.getElementById('accuracy');
    
    if (totalSubmissionsEl) totalSubmissionsEl.textContent = userData.totalSubmissions;
    if (accuracyEl) accuracyEl.textContent = userData.accuracy.toFixed(1) + '%';
}

// ====================================
// Avatar Management
// ====================================

function handleAvatarChange(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        showToast('กรุณาเลือกไฟล์รูปภาพ', 'error');
        return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showToast('ขนาดรูปภาพต้องไม่เกิน 5MB', 'error');
        return;
    }
    
    // Preview image
    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById('avatarPreview').src = e.target.result;
        uploadAvatar(file);
    };
    reader.readAsDataURL(file);
}

async function uploadAvatar(file) {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${userData.user_id}-${Math.random()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: true
            });

        if (uploadError) {
            console.error('Upload error:', uploadError);
            showToast('อัปโหลดรูปภาพไม่สำเร็จ', 'error');
            return;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);

        const avatarUrl = urlData.publicUrl;

        // Update user profile
        const { error: updateError } = await supabase
            .from('users')
            .update({ avatar: avatarUrl })
            .eq('user_id', userData.user_id);

        if (updateError) {
            console.error('Update error:', updateError);
            showToast('บันทึกรูปภาพไม่สำเร็จ', 'error');
            return;
        }

        userData.avatar = avatarUrl;
        showToast('อัปเดตรูปโปรไฟล์สำเร็จ!', 'success');
    } catch (error) {
        console.error('Avatar upload error:', error);
        showToast('เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ', 'error');
    }
}

// ====================================
// Account Edit Mode
// ====================================

function toggleEditMode() {
    editMode = !editMode;
    
    const displayNameInput = document.getElementById('displayName');
    const editBtn = document.getElementById('editAccountBtn');
    const actions = document.getElementById('accountActions');
    
    if (!displayNameInput || !editBtn || !actions) return;
    
    if (editMode) {
        displayNameInput.disabled = false;
        editBtn.textContent = '✖ Cancel';
        editBtn.classList.add('btn-secondary');
        editBtn.classList.remove('btn-edit');
        actions.style.display = 'flex';
    } else {
        displayNameInput.disabled = true;
        editBtn.textContent = '✏️ Edit';
        editBtn.classList.remove('btn-secondary');
        editBtn.classList.add('btn-edit');
        actions.style.display = 'none';
        
        // Reset to original value
        displayNameInput.value = userData.displayName;
    }
}

async function saveAccountChanges() {
    const displayNameInput = document.getElementById('displayName');
    const newDisplayName = displayNameInput.value.trim();
    
    if (!newDisplayName) {
        showToast('กรุณากรอกชื่อที่แสดง', 'error');
        return;
    }

    try {
        const { error } = await supabase
            .from('users')
            .update({ display_name: newDisplayName })
            .eq('user_id', userData.user_id);

        if (error) {
            console.error('Update error:', error);
            showToast('บันทึกข้อมูลไม่สำเร็จ', 'error');
            return;
        }

        userData.displayName = newDisplayName;
        showToast('บันทึกข้อมูลสำเร็จ!', 'success');
        toggleEditMode();
        updateUI();
    } catch (error) {
        console.error('Save error:', error);
        showToast('เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error');
    }
}

// ====================================
// Password Change
// ====================================

function showPasswordModal() {
    const modal = document.getElementById('passwordModal');
    if (modal) {
        modal.style.display = 'flex';
        currentPasswordStep = 1;
        updatePasswordStep();
    }
}

function closePasswordModal() {
    const modal = document.getElementById('passwordModal');
    if (modal) {
        modal.style.display = 'none';
        resetPasswordForm();
    }
}

function updatePasswordStep() {
    document.querySelectorAll('.password-step').forEach(step => {
        step.classList.remove('active');
    });
    
    const currentStep = document.getElementById(`passwordStep${currentPasswordStep}`);
    if (currentStep) {
        currentStep.classList.add('active');
    }
}

function resetPasswordForm() {
    currentPasswordStep = 1;
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmNewPassword').value = '';
    updatePasswordStep();
}

async function verifyCurrentPassword() {
    const currentPassword = document.getElementById('currentPassword').value;
    
    if (!currentPassword) {
        showToast('กรุณากรอกรหัสผ่านปัจจุบัน', 'error');
        return;
    }

    try {
        // Verify by attempting to sign in
        const { error } = await supabase.auth.signInWithPassword({
            email: userData.email,
            password: currentPassword,
        });

        if (error) {
            showToast('รหัสผ่านไม่ถูกต้อง', 'error');
            return;
        }

        currentPasswordStep = 2;
        updatePasswordStep();
    } catch (error) {
        console.error('Verify password error:', error);
        showToast('เกิดข้อผิดพลาดในการยืนยันรหัสผ่าน', 'error');
    }
}

async function changePassword() {
    const newPassword = document.getElementById('newPassword').value;
    const confirmNewPassword = document.getElementById('confirmNewPassword').value;
    
    if (!newPassword || !confirmNewPassword) {
        showToast('กรุณากรอกรหัสผ่านให้ครบ', 'error');
        return;
    }
    
    if (newPassword.length < 8) {
        showToast('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร', 'error');
        return;
    }
    
    if (newPassword !== confirmNewPassword) {
        showToast('รหัสผ่านไม่ตรงกัน', 'error');
        return;
    }

    try {
        const { error } = await supabase.auth.updateUser({
            password: newPassword
        });

        if (error) {
            console.error('Update password error:', error);
            showToast('เปลี่ยนรหัสผ่านไม่สำเร็จ', 'error');
            return;
        }

        showToast('เปลี่ยนรหัสผ่านสำเร็จ!', 'success');
        closePasswordModal();
    } catch (error) {
        console.error('Change password error:', error);
        showToast('เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน', 'error');
    }
}

// ====================================
// Logout
// ====================================

async function logout() {
    if (!confirm('คุณต้องการออกจากระบบหรือไม่?')) return;

    try {
        const { error } = await supabase.auth.signOut();
        
        if (error) {
            console.error('Logout error:', error);
            showToast('ออกจากระบบไม่สำเร็จ', 'error');
            return;
        }

        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Logout error:', error);
        showToast('เกิดข้อผิดพลาดในการออกจากระบบ', 'error');
    }
}

// ====================================
// Toast Notification
// ====================================

function showToast(message, type = 'info') {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    // Add to body
    document.body.appendChild(toast);
    
    // Show toast
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    // Remove toast
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// ====================================
// Make functions global
// ====================================

window.handleAvatarChange = handleAvatarChange;
window.toggleEditMode = toggleEditMode;
window.saveAccountChanges = saveAccountChanges;
window.showPasswordModal = showPasswordModal;
window.closePasswordModal = closePasswordModal;
window.verifyCurrentPassword = verifyCurrentPassword;
window.changePassword = changePassword;
window.logout = logout;