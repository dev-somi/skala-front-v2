// 1. "Let's Explore!" 클릭 시 #portraits로 스크롤하면서 카드 웨이브 애니메이션을 트리거
function initHeroWave() {
    const heroCta = document.querySelector('.hero-cta');
    const portraitGrid = document.querySelector('.portrait-grid');
    if (!heroCta || !portraitGrid) return;

    const portraitsSection = document.getElementById('portraits');
    if (!portraitsSection) return;

    heroCta.addEventListener('click', (event) => {
        event.preventDefault();

        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        portraitsSection.scrollIntoView({
            behavior: prefersReducedMotion ? 'auto' : 'smooth',
            block: 'start',
        });

        // 같은 클래스를 다시 추가해도 애니메이션이 재시작되도록 리플로우를 강제한다
        portraitGrid.classList.remove('is-waving');
        void portraitGrid.offsetWidth;
        portraitGrid.classList.add('is-waving');
    });
}

// 2. 웨이브 애니메이션이 끝나면 클래스를 제거해 다음 클릭에 대비한다
document.addEventListener('animationend', (event) => {
    if (event.animationName === 'portrait-pop-in') {
        event.target.closest('.portrait-grid')?.classList.remove('is-waving');
    }
});

window.addEventListener('DOMContentLoaded', initHeroWave);
