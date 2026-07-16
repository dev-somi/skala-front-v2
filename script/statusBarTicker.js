// 1. 마퀴 반복 복제 시 텍스트 사이에 넣을 구분자
const MARQUEE_SEPARATOR = '•';

// 2. 구분자 span을 문단 끝에 추가하는 헬퍼
function appendSeparator(paragraph) {
    const separator = document.createElement('span');
    separator.className = 'marquee-separator';
    separator.setAttribute('aria-hidden', 'true');
    separator.textContent = MARQUEE_SEPARATOR;
    paragraph.appendChild(separator);
}

// 3. 개별 .status-bar 요소 하나에 마퀴 구조(track + 복제본)를 구성
function initStatusBarMarquee(statusBar) {
    const originalParagraph = statusBar.querySelector('p');
    if (!originalParagraph) return;

    // 구분자를 원본 문단 끝에 추가 (복제 시 함께 복사됨)
    appendSeparator(originalParagraph);

    // 트랙 래퍼 생성 후 원본 문단을 트랙 안으로 이동
    const track = document.createElement('div');
    track.className = 'marquee-track';
    statusBar.appendChild(track);
    track.appendChild(originalParagraph);

    // 원본을 복제해 두 번째(시각적 전용) 사본 추가 → 무한 루프용
    const clone = originalParagraph.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    track.appendChild(clone);
}

// 4. 페이지가 로드되면 페이지 내 모든 .status-bar에 대해 마퀴 초기화
window.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.status-bar').forEach(initStatusBarMarquee);
});

// 5. 외부(realtimeInfo.js 등)에서 티커 내용을 갱신할 수 있는 공개 API.
//    마퀴는 원본 + 클론(aria-hidden) 두 개의 <p>로 이루어져 있어,
//    한쪽만 바꾸면 두 사본의 내용이 어긋나 보인다. 그래서 트랙 안의 <p> 전체를 갱신한다.
function updateText(html) {
    document.querySelectorAll('.status-bar .marquee-track p').forEach((paragraph) => {
        paragraph.innerHTML = html;
        appendSeparator(paragraph);
    });
}

// 6. 티커가 갱신됐음을 시각적으로 알리는 CSS 플래시 효과 트리거
function flash() {
    document.querySelectorAll('.status-bar').forEach((statusBar) => {
        statusBar.classList.remove('status-bar--updated');
        // 같은 클래스를 다시 추가해도 애니메이션이 재시작되도록 리플로우를 강제한다
        void statusBar.offsetWidth;
        statusBar.classList.add('status-bar--updated');
    });
}

// 플래시 애니메이션이 끝나면 클래스를 제거해 다음 flash() 호출에 대비한다
document.addEventListener('animationend', (event) => {
    if (event.animationName === 'status-bar-flash') {
        event.target.classList.remove('status-bar--updated');
    }
});

window.StatusBarTicker = { updateText, flash };
