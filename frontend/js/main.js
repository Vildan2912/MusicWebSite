// js/main.js

window.catalogTracks = [];

function updateAuthUI() {
    const authButtons = document.getElementById('authButtons');
    if (!authButtons) return;

    const isAuthenticated = AuthService.isAuthenticated();
    const user = AuthService.getUser();

    if (isAuthenticated && user) {
        authButtons.innerHTML = `
            <span class="user-greeting">Привет, ${user.username || user.email}!</span>
            <button class="btn-logout" onclick="handleLogout()">Выйти</button>
        `;
    } else {
        // Определяем, где мы находимся (в корне или в pages)
        const isInPages = window.location.pathname.includes('/pages/');
        const loginPath = isInPages ? 'login.html' : 'pages/login.html';
        const registerPath = isInPages ? 'register.html' : 'pages/register.html';
        
        authButtons.innerHTML = `
            <button class="btn" onclick="window.location.href='${loginPath}'">Войти</button>
            <button class="btn btn-primary" onclick="window.location.href='${registerPath}'">Регистрация</button>
        `;
    }
}

async function handleLogout() {
    await AuthService.logout();
    // Определяем, где мы находимся
    const isInPages = window.location.pathname.includes('/pages/');
    window.location.href = isInPages ? '../index.html' : 'index.html';
}

function handlePremiumClick() {
    const isAuthenticated = AuthService.isAuthenticated();
    
    if (!isAuthenticated) {
        alert('Пожалуйста, войдите в систему для оформления премиум подписки');
        const isInPages = window.location.pathname.includes('/pages/');
        window.location.href = isInPages ? 'login.html' : 'pages/login.html';
    } else {
        alert('Функция оформления премиум подписки будет доступна скоро!');
    }
}

function updateHeroForAuth() {
    const isAuthenticated = AuthService.isAuthenticated();
    const user = AuthService.getUser();
    
    const welcomeTitle = document.getElementById('welcomeTitle');
    const welcomeSubtitle = document.getElementById('welcomeSubtitle');
    const heroButtons = document.getElementById('heroButtons');
    
    if (!welcomeTitle) return;
    
    if (isAuthenticated && user) {
        welcomeTitle.innerHTML = `С возвращением, <br><span>${user.username || 'меломан'}</span>`;
        welcomeSubtitle.textContent = 'Вся музыка уже ждет тебя!';
        if (heroButtons) {
            heroButtons.innerHTML = `
                <button class="btn btn-primary btn-large" onclick="window.location.href='pages/music.html'">В каталог</button>
                <button class="btn btn-large" onclick="window.location.href='pages/listener-cabinet.html'">Мои плейлисты</button>
            `;
        }
        
        const premiumCard = document.getElementById('premiumCard');
        if (premiumCard && !user.isPremium) {
            premiumCard.innerHTML = `
                <h3>🎧 Премиум</h3>
                <p>Оформи подписку и слушай без рекламы</p>
                <button class="btn btn-primary" onclick="handlePremiumClick()">Оформить</button>
            `;
        }
    }
}

// js/main.js
async function loadPopularTracks() {
    const container = document.getElementById('popularTracksGrid');
    if (!container) return;
    
    try {
        const tracks = await TracksService.getPopularTracks(5);
        
        container.innerHTML = '';
        tracks.forEach(track => {
            const card = document.createElement('div');
            card.className = 'track-card';
            card.innerHTML = `
                <a href="pages/track.html?id=${track.id}" class="track-card-link">
                    <img src="${track.cover}" alt="${track.title}" class="track-cover" onerror="this.src='https://picsum.photos/id/100/300/300'">
                </a>
                <div class="track-info">
                    <a href="pages/track.html?id=${track.id}" class="track-card-link">
                        <div class="track-title">${escapeHtml(track.title)}</div>
                        <div class="track-artist">${escapeHtml(track.artist)}</div>
                        <div class="track-duration">${track.duration}</div>
                    </a>
                    <div class="track-actions">
                        <button class="btn btn-primary play-now-btn" data-id="${track.id}">▶ Воспроизвести</button>
                    </div>
                </div>
            `;
            
            const playBtn = card.querySelector('.play-now-btn');
            playBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (window.player) {
                    window.player.playTrack(track, tracks);
                }
            });
            
            container.appendChild(card);
        });
    } catch (error) {
        console.error('Ошибка загрузки треков:', error);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    updateAuthUI();
    updateHeroForAuth();
    
    if (document.getElementById('popularTracksGrid')) {
        await loadPopularTracks();
    }
    
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const errorElement = document.getElementById('errorMessage');
            
            const submitButton = event.target.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;
            submitButton.textContent = 'Вход...';
            submitButton.disabled = true;
            
            const result = await AuthService.login(email, password);
            
            if (result.success) {
                window.location.href = '../index.html';
            } else {
                errorElement.textContent = result.error;
                errorElement.style.display = 'block';
                submitButton.textContent = originalText;
                submitButton.disabled = false;
            }
        });
    }
    
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            
            const username = document.getElementById('username').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const errorElement = document.getElementById('errorMessage');
            const successElement = document.getElementById('successMessage');
            
            errorElement.style.display = 'none';
            successElement.style.display = 'none';
            
            const submitButton = event.target.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;
            submitButton.textContent = 'Регистрация...';
            submitButton.disabled = true;
            
            const result = await AuthService.register({
                username, email, password, confirmPassword
            });
            
            if (result.success) {
                successElement.textContent = result.data.message || 'Регистрация прошла успешно!';
                successElement.style.display = 'block';
                event.target.reset();
                
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            } else {
                errorElement.textContent = result.error;
                errorElement.style.display = 'block';
            }
            
            submitButton.textContent = originalText;
            submitButton.disabled = false;
        });
    }
});
