// js/utils/helpers.js
function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

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

function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function createTrackCard(track, onPlayClick) {
    const card = document.createElement('div');
    card.className = 'track-card';
    card.innerHTML = `
        <a href="pages/track.html?id=${track.id}" class="track-card-link">
            <img src="${track.cover}" alt="${track.title}" class="track-cover">
        </a>
        <div class="track-info">
            <a href="pages/track.html?id=${track.id}" class="track-card-link">
                <div class="track-title">${escapeHtml(track.title)}</div>
                <div class="track-artist">${escapeHtml(track.artist)}</div>
                <div class="track-duration">${track.duration}</div>
            </a>
            <button class="btn btn-primary play-button" data-id="${track.id}">▶ Слушать</button>
        </div>
    `;
    
    const playBtn = card.querySelector('.play-button');
    playBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (onPlayClick) onPlayClick(track.id);
    });
    
    return card;
}

function playTrack(trackId, playlist = null) {
    TracksService.getTrackById(trackId).then(track => {
        if (track && window.player) {
            const tracks = playlist || window.catalogTracks;
            window.player.playTrack(track, tracks);
        }
    });
}