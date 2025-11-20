// navAuth.js - Improved with session sync
import { supabase } from './supabaseClient.js';

export async function setupNavUser() {
  const signInBtn = document.getElementById('navSignInBtn');
  const profileBtn = document.getElementById('navProfileBtn');
  const avatarImg = document.getElementById('navAvatar');
  const usernameSpan = document.getElementById('navUsername');

  if (!signInBtn || !profileBtn) {
    return;
  }

  try {
    // ใช้ getSession() แทน getUser() เพื่อให้ได้ session ที่ accurate กว่า
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      showSignIn();
      return;
    }

    if (!session || !session.user) {
      // ยังไม่ล็อกอิน → โชว์ Sign In
      showSignIn();
      return;
    }

    const authUser = session.user;

    // ค่า default จาก auth
    let displayName =
      authUser.user_metadata?.full_name ||
      authUser.user_metadata?.name ||
      authUser.email?.split('@')[0] ||
      'Player';

    let avatarUrl =
      authUser.user_metadata?.avatar_url ||
      authUser.user_metadata?.picture ||
      null;

    // ลองไปดึงจาก table users อีกที
    try {
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('display_name, username, avatar')
        .eq('email', authUser.email)
        .maybeSingle();

      if (!profileError && profile) {
        if (profile.display_name) displayName = profile.display_name;
        if (profile.username && !authUser.user_metadata?.full_name) {
          displayName = profile.username;
        }
        if (profile.avatar) avatarUrl = profile.avatar;
      }
    } catch (e) {
      console.warn('load profile for nav error:', e);
    }

    // ถ้าไม่มีรูปเลย ใช้ ui-avatars แทน
    if (!avatarUrl) {
      const encoded = encodeURIComponent(displayName || 'Player');
      avatarUrl = `https://ui-avatars.com/api/?name=${encoded}&size=200&background=00ff88&color=0a0e27&bold=true`;
    }

    // อัปเดต UI
    avatarImg.src = avatarUrl;
    usernameSpan.textContent = displayName;

    signInBtn.style.display = 'none';
    profileBtn.style.display = 'inline-flex';

  } catch (error) {
    console.error('Setup nav user error:', error);
    showSignIn();
  }

  // Helper function to show sign in button
  function showSignIn() {
    signInBtn.style.display = 'inline-flex';
    profileBtn.style.display = 'none';
  }
}

// Listen for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth state changed:', event, session?.user?.email);
  
  // รีเฟรช navigation ทุกครั้งที่ auth state เปลี่ยน
  if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
    setupNavUser();
  } else if (event === 'SIGNED_OUT') {
    const signInBtn = document.getElementById('navSignInBtn');
    const profileBtn = document.getElementById('navProfileBtn');
    if (signInBtn && profileBtn) {
      signInBtn.style.display = 'inline-flex';
      profileBtn.style.display = 'none';
    }
  }
});
