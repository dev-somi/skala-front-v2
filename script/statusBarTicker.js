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
