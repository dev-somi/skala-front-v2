// myTrip.html의 배경음악 버튼: 화면에는 재생 버튼만 보이고, 실제 재생은 숨겨진 유튜브 iframe(YT.Player)이 담당한다.
(function () {
    const VIDEO_ID = 'eliU3I2nDJA';
    let player = null;
    let apiReady = false;

    function injectYouTubeApiScript() {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        document.body.appendChild(tag);
    }

    window.onYouTubeIframeAPIReady = function () {
        player = new YT.Player('bgm-player', {
            height: '0',
            width: '0',
            videoId: VIDEO_ID,
            playerVars: { controls: 0 },
            events: {
                onReady: () => { apiReady = true; }
            }
        });
    };

    document.addEventListener('DOMContentLoaded', () => {
        const btn = document.getElementById('bgm-toggle');
        if (!btn) return;

        injectYouTubeApiScript();

        btn.addEventListener('click', () => {
            if (!apiReady || !player) return;

            if (player.getPlayerState() === YT.PlayerState.PLAYING) {
                player.pauseVideo();
                btn.classList.remove('is-playing');
                btn.setAttribute('aria-pressed', 'false');
                btn.setAttribute('aria-label', '재생');
            } else {
                player.playVideo();
                btn.classList.add('is-playing');
                btn.setAttribute('aria-pressed', 'true');
                btn.setAttribute('aria-label', '일시정지');
            }
        });
    });
})();
