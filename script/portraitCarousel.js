// 1. 캐로셀에 필요한 DOM 요소 참조 및 상태 변수
const portraitTrack = document.getElementById('portrait-track');
const portraitPrevButton = document.getElementById('portrait-prev');
const portraitNextButton = document.getElementById('portrait-next');
const portraitDots = document.getElementById('portrait-dots');

let scrollSyncTimer = null; // 스크롤/리사이즈 이벤트 디바운스용 타이머

// 2. 카드 개수만큼 하단 위치 표시 점(dot) 동적 생성
function renderPortraitDots() {
    if (!portraitTrack || !portraitDots) return;

    const cards = portraitTrack.querySelectorAll('li');

    cards.forEach((card, index) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'carousel-dot';
        dot.setAttribute('aria-label', `${index + 1}번째 포트레이트로 이동`);
        dot.setAttribute('aria-current', index === 0 ? 'true' : 'false');
        dot.dataset.index = index;

        portraitDots.appendChild(dot);
    });
}

// 3. 특정 인덱스의 카드로 부드럽게 스크롤 이동
function scrollToPortrait(index) {
    if (!portraitTrack) return;

    const cards = portraitTrack.querySelectorAll('li');
    const targetCard = cards[index];
    if (!targetCard) return;

    portraitTrack.scrollTo({ left: targetCard.offsetLeft, behavior: 'smooth' });
}

// 4. 현재 스크롤 위치와 가장 가까운 카드의 인덱스 계산
function getCurrentPortraitIndex() {
    const cards = Array.from(portraitTrack.querySelectorAll('li'));
    let closestIndex = 0;
    let closestDistance = Infinity;

    cards.forEach((card, index) => {
        const distance = Math.abs(card.offsetLeft - portraitTrack.scrollLeft);
        if (distance < closestDistance) {
            closestDistance = distance;
            closestIndex = index;
        }
    });

    return closestIndex;
}

// 5. 스크롤 위치에 맞춰 점(dot) 활성 상태 및 이전/다음 버튼 비활성 상태 동기화
function syncPortraitCarouselState() {
    if (!portraitTrack || !portraitDots || !portraitPrevButton || !portraitNextButton) return;

    const currentIndex = getCurrentPortraitIndex();

    portraitDots.querySelectorAll('.carousel-dot').forEach((dot, index) => {
        dot.setAttribute('aria-current', index === currentIndex ? 'true' : 'false');
    });

    const maxScrollLeft = portraitTrack.scrollWidth - portraitTrack.clientWidth;
    portraitPrevButton.disabled = portraitTrack.scrollLeft <= 0;
    portraitNextButton.disabled = portraitTrack.scrollLeft >= maxScrollLeft - 1;
}

// 6. 이전 버튼 클릭 시 한 칸 앞 카드로 이동
portraitPrevButton?.addEventListener('click', () => {
    scrollToPortrait(Math.max(getCurrentPortraitIndex() - 1, 0));
});

// 7. 다음 버튼 클릭 시 한 칸 뒤 카드로 이동
portraitNextButton?.addEventListener('click', () => {
    const lastIndex = portraitTrack.querySelectorAll('li').length - 1;
    scrollToPortrait(Math.min(getCurrentPortraitIndex() + 1, lastIndex));
});

// 8. 점(dot) 클릭 시 해당 카드로 이동 (이벤트 위임)
portraitDots?.addEventListener('click', (event) => {
    const dot = event.target.closest('.carousel-dot');
    if (!dot) return;

    scrollToPortrait(Number(dot.dataset.index));
});

// 9. 스크롤이 끝난 뒤(디바운스) 점/버튼 상태 동기화
portraitTrack?.addEventListener('scroll', () => {
    clearTimeout(scrollSyncTimer);
    scrollSyncTimer = setTimeout(syncPortraitCarouselState, 100);
});

// 10. 화면 크기 변경 시에도 점/버튼 상태 재확인 (카드 폭이 반응형으로 바뀌므로)
window.addEventListener('resize', () => {
    clearTimeout(scrollSyncTimer);
    scrollSyncTimer = setTimeout(syncPortraitCarouselState, 150);
});

// 11. 페이지가 로드되면 점 초기 렌더링 및 버튼 상태 초기화
window.addEventListener('DOMContentLoaded', () => {
    renderPortraitDots();
    syncPortraitCarouselState();
});
