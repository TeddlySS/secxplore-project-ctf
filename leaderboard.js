// leaderboard.js
import { supabase } from './supabaseClient.js';
import { setupNavUser } from './navAuth.js';

let currentUserData = null;
let leaderboardData = [];

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

// Get current user data
async function getCurrentUser() {
    try {
        const { data: authData, error: authError } = await supabase.auth.getUser();
        
        if (authError || !authData.user) {
            return null;
        }

        const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('user_id, username, email')
            .eq('email', authData.user.email)
            .single();

        if (profileError) {
            console.error('Error getting current user:', profileError);
            return null;
        }

        return profile;
    } catch (error) {
        console.error('Error getting current user:', error);
        return null;
    }
}

// Load leaderboard from database
async function loadLeaderboard() {
    try {
        // Get leaderboard data using the function we created
        const { data, error } = await supabase.rpc('get_leaderboard', {
            limit_count: 50
        });

        if (error) {
            console.error('Error loading leaderboard:', error);
            showFallbackData();
            return;
        }

        if (!data || data.length === 0) {
            showFallbackData();
            return;
        }

        leaderboardData = data.map(user => ({
            rank: user.rank,
            name: user.display_name || user.username,
            username: user.username,
            solved: user.challenges_solved || 0,
            points: user.score || 0,
            user_id: user.user_id
        }));

        // Get current user to highlight
        currentUserData = await getCurrentUser();

        // Render leaderboard
        renderLeaderboard();
    } catch (error) {
        console.error('Error loading leaderboard:', error);
        showFallbackData();
    }
}

// Show fallback data if database fails
function showFallbackData() {
    leaderboardData = [
        { rank: 1, name: 'CyberNinja', username: 'CN', solved: 24, points: 5420 },
        { rank: 2, name: 'SecurityPro', username: 'SP', solved: 22, points: 4850 },
        { rank: 3, name: 'HackDefender', username: 'HD', solved: 20, points: 4200 },
    ];
    renderLeaderboard();
}

// Get rank class for styling
function getRankClass(rank) {
    if (rank === 1) return 'gold';
    if (rank === 2) return 'silver';
    if (rank === 3) return 'bronze';
    return '';
}

// Get item class for top 3
function getItemClass(rank) {
    if (rank <= 3) return `top-3 rank-${rank}`;
    return '';
}

// Render top 3 podium
function renderTopThree() {
    const podiumContainer = document.getElementById('podium');
    if (!podiumContainer) return;

    const topThree = leaderboardData.slice(0, 3);
    
    const podiumHTML = `
        ${topThree[1] ? `
        <div class="podium-item second" data-rank="2">
            <div class="rank-badge silver">
                <span class="rank-number">2</span>
            </div>
            <div class="player-avatar">
                <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(topThree[1].name)}&size=200&background=c0c0c0&color=fff&bold=true" alt="${topThree[1].name}">
            </div>
            <div class="player-info">
                <div class="player-name">${topThree[1].name}</div>
                <div class="player-stats">
                    <span class="stat-item">
                        <i class="fas fa-trophy"></i>
                        ${topThree[1].solved} solved
                    </span>
                    <span class="stat-item">
                        <i class="fas fa-star"></i>
                        ${topThree[1].points} pts
                    </span>
                </div>
            </div>
        </div>
        ` : ''}
        
        ${topThree[0] ? `
        <div class="podium-item first" data-rank="1">
            <div class="rank-badge gold">
                <span class="rank-number">1</span>
                <i class="fas fa-crown"></i>
            </div>
            <div class="player-avatar">
                <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(topThree[0].name)}&size=200&background=ffd700&color=fff&bold=true" alt="${topThree[0].name}">
            </div>
            <div class="player-info">
                <div class="player-name">${topThree[0].name}</div>
                <div class="player-stats">
                    <span class="stat-item">
                        <i class="fas fa-trophy"></i>
                        ${topThree[0].solved} solved
                    </span>
                    <span class="stat-item">
                        <i class="fas fa-star"></i>
                        ${topThree[0].points} pts
                    </span>
                </div>
            </div>
        </div>
        ` : ''}
        
        ${topThree[2] ? `
        <div class="podium-item third" data-rank="3">
            <div class="rank-badge bronze">
                <span class="rank-number">3</span>
            </div>
            <div class="player-avatar">
                <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(topThree[2].name)}&size=200&background=cd7f32&color=fff&bold=true" alt="${topThree[2].name}">
            </div>
            <div class="player-info">
                <div class="player-name">${topThree[2].name}</div>
                <div class="player-stats">
                    <span class="stat-item">
                        <i class="fas fa-trophy"></i>
                        ${topThree[2].solved} solved
                    </span>
                    <span class="stat-item">
                        <i class="fas fa-star"></i>
                        ${topThree[2].points} pts
                    </span>
                </div>
            </div>
        </div>
        ` : ''}
    `;
    
    podiumContainer.innerHTML = podiumHTML;
}

// Render leaderboard list
function renderLeaderboardList() {
    const leaderboardList = document.getElementById('leaderboardList');
    if (!leaderboardList) return;

    const startRank = 4;
    const endRank = 24;
    const visibleData = leaderboardData.slice(startRank - 1, endRank);

    leaderboardList.innerHTML = visibleData.map(player => {
        const isCurrentUser = currentUserData && player.user_id === currentUserData.user_id;
        
        return `
            <div class="leaderboard-item ${getItemClass(player.rank)} ${isCurrentUser ? 'current-user' : ''}">
                <div class="rank ${getRankClass(player.rank)}">${player.rank}</div>
                <div class="player">
                    <div class="avatar">
                        <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(player.name)}&size=100&background=00ff88&color=0a0e27&bold=true" alt="${player.name}">
                    </div>
                    <div class="player-details">
                        <div class="name">${player.name} ${isCurrentUser ? '<span class="you-badge">YOU</span>' : ''}</div>
                        <div class="username">@${player.username}</div>
                    </div>
                </div>
                <div class="stats">
                    <div class="stat">
                        <div class="stat-value">${player.solved}</div>
                        <div class="stat-label">Solved</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value">${player.points}</div>
                        <div class="stat-label">Points</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Render current user card
function renderCurrentUserCard() {
    const currentUserCard = document.getElementById('currentUserCard');
    if (!currentUserCard || !currentUserData) return;

    const userRank = leaderboardData.find(p => p.user_id === currentUserData.user_id);
    
    if (!userRank) {
        currentUserCard.style.display = 'none';
        return;
    }

    currentUserCard.innerHTML = `
        <div class="current-user-content">
            <div class="rank ${getRankClass(userRank.rank)}">${userRank.rank}</div>
            <div class="player">
                <div class="avatar">
                    <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(userRank.name)}&size=100&background=00ff88&color=0a0e27&bold=true" alt="${userRank.name}">
                </div>
                <div class="player-details">
                    <div class="name">${userRank.name} <span class="you-badge">YOU</span></div>
                    <div class="username">@${userRank.username}</div>
                </div>
            </div>
            <div class="stats">
                <div class="stat">
                    <div class="stat-value">${userRank.solved}</div>
                    <div class="stat-label">Solved</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${userRank.points}</div>
                    <div class="stat-label">Points</div>
                </div>
            </div>
        </div>
    `;
    currentUserCard.style.display = 'block';
}

// Main render function
function renderLeaderboard() {
    renderTopThree();
    renderLeaderboardList();
    renderCurrentUserCard();
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    createParticles();
    await setupNavUser();
    await loadLeaderboard();
});