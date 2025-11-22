// login.js
import { supabase } from './supabaseClient.js';
import { setupNavUser } from './navAuth.js';

// ---------- UI helper เล็ก ๆ ----------
function createParticles() {
  const container = document.getElementById('particles');
  if (!container) return;

  for (let i = 0; i < 50; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.left = Math.random() * 100 + '%';
    p.style.animationDelay = Math.random() * 15 + 's';
    p.style.animationDuration = (Math.random() * 10 + 10) + 's';
    container.appendChild(p);
  }
}

function showMessage(msg) {
  alert(msg);
}

// ---------- แปลง username → email (ถ้า login เป็น username) ----------
async function resolveLoginToEmail(loginValue) {
  // ถ้ามี @ อยู่แล้ว ถือว่าเป็น email ตรง ๆ
  if (loginValue.includes('@')) return loginValue;

  // ถ้าเป็น username → ไปหา email ใน table users
  try {
    // เปลี่ยนจาก .single() เป็น .maybeSingle() เพื่อจัดการกรณีไม่พบข้อมูลได้ดีกว่า
    const { data, error } = await supabase
      .from('users')
      .select('email')
      .eq('username', loginValue)
      .maybeSingle();

    console.log('Username lookup result:', { data, error, username: loginValue });

    if (error) {
      console.error('Database error:', error);
      throw new Error('เกิดข้อผิดพลาดในการค้นหาบัญชีผู้ใช้');
    }

    if (!data) {
      throw new Error('ไม่พบบัญชีผู้ใช้สำหรับ username นี้');
    }

    return data.email;
  } catch (err) {
    console.error('Error in resolveLoginToEmail:', err);
    throw err;
  }
}

// ---------- Login ด้วย email/username + password ----------
async function handleLogin(e) {
  e.preventDefault();

  const loginForm = document.getElementById('loginForm');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const loginBtn = document.querySelector('.login-btn');

  if (!loginForm || !usernameInput || !passwordInput || !loginBtn) return;

  const loginValue = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  if (!loginValue || !password) {
    showMessage('กรุณากรอกข้อมูลให้ครบ');
    return;
  }

  loginBtn.disabled = true;
  const originalText = loginBtn.textContent;
  loginBtn.textContent = 'Signing in...';

  try {
    // ถ้าเป็น email ให้ login ตรงๆ ไม่ต้องไป query database
    let email;
    if (loginValue.includes('@')) {
      email = loginValue;
      console.log('Logging in with email:', email);
    } else {
      console.log('Attempting to resolve username:', loginValue);
      email = await resolveLoginToEmail(loginValue);
      console.log('Resolved to email:', email);
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Supabase auth error:', error);
      
      // แสดง error message ที่เข้าใจง่ายขึ้น
      let errorMessage = 'เข้าสู่ระบบไม่สำเร็จ';
      if (error.message.includes('Invalid login credentials')) {
        errorMessage = 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = 'กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ';
      } else {
        errorMessage = error.message;
      }
      
      showMessage(errorMessage);
      return;
    }

    console.log('Login successful:', data.user?.email);

    // เก็บข้อมูลพื้นฐานไว้ใช้ต่อ (optional)
    const user = data.user;
    localStorage.setItem(
      'currentUser',
      JSON.stringify({ id: user.id, email: user.email }),
    );

    // ไปหน้า main
    window.location.href = 'home.html';
  } catch (err) {
    console.error('Login error:', err);
    showMessage(err.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = originalText;
  }
}

// ---------- Google OAuth ----------
async function signInWithGoogle() {
  const googleBtn = document.getElementById('googleSignInBtn');
  if (!googleBtn) return;

  googleBtn.disabled = true;
  const originalHtml = googleBtn.innerHTML;
  googleBtn.innerHTML = 'Connecting to Google...';

  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/challenge.html',
      },
    });

    if (error) {
      console.error('Google OAuth error:', error);
      showMessage(
        'ไม่สามารถเชื่อมต่อ Google ได้: ' + (error.message || 'unknown error'),
      );
    }
    // Supabase จะ redirect ไป Google ให้เอง
  } catch (err) {
    console.error('Google sign in error:', err);
    showMessage('เกิดข้อผิดพลาดในการเชื่อมต่อ Google');
  } finally {
    googleBtn.disabled = false;
    googleBtn.innerHTML = originalHtml;
  }
}

// ---------- เช็ค session เดิม ----------
async function checkExistingSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Session check error:', error);
      return;
    }

    if (session) {
      console.log('Existing session found, redirecting...');
      // ถ้ามี session อยู่แล้ว ส่งไป main ได้เลย
      window.location.href = 'home.html';
    }
  } catch (err) {
    console.error('Error checking session:', err);
  }
}

// ---------- Ready ----------
document.addEventListener('DOMContentLoaded', () => {
  console.log('Login page loaded');
  
  // particles สวย ๆ
  createParticles();

  // bind form
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
    console.log('Login form bound');
  }

  // bind google
  const googleBtn = document.getElementById('googleSignInBtn');
  if (googleBtn) {
    googleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      signInWithGoogle();
    });
    console.log('Google button bound');
  }

  checkExistingSession();
});
