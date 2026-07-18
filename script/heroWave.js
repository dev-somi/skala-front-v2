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

        // classList 재추가만으로는 애니메이션이 재시작되지 않아 리플로우를 강제한다
        portraitGrid.classList.remove('is-waving');
        void portraitGrid.offsetWidth;
        portraitGrid.classList.add('is-waving');
    });
}

document.addEventListener('animationend', (event) => {
    if (event.animationName === 'portrait-pop-in') {
        event.target.closest('.portrait-grid')?.classList.remove('is-waving');
    }
});

window.addEventListener('DOMContentLoaded', initHeroWave);
