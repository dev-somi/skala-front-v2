const NAV_FRAGMENT_PATH = 'partials/nav.html';

// file://로 직접 열면 fetch가 CORS에 막히므로 partials/nav.html과 동일한 내용을 하드코딩해 안전망으로 둔다
const FALLBACK_NAV_HTML = `
    <nav class="navbar" aria-label="메인 네비게이션">
        <a href="index.html" class="logo" aria-label="Som's 홈으로 이동">Som's</a>
        <ul class="nav-links">
            <li class="nav-item"><a href="index.html">Home</a></li>
            <li class="nav-item"><a href="myProfile.html">Profile</a></li>
            <li class="nav-item nav-item--has-dropdown">
                <a href="scheduler.html">Calendar</a>
                <ul class="nav-dropdown">
                    <li><a href="scheduler.html">📅 Scheduler</a></li>
                    <li><a href="myClass.html">📖 나의 강의 일정</a></li>
                </ul>
            </li>
            <li class="nav-item"><a href="myTrip.html">Trip</a></li>
            <li class="nav-item"><a href="jsPlayground.html">Playground</a></li>
        </ul>
        <div class="nav-actions">
            <a href="signUp.html" class="btn-signup" aria-label="회원가입 페이지로 이동">Sign Up</a>
        </div>
    </nav>
`;

async function loadNav() {
    const placeholder = document.getElementById('nav-placeholder');
    if (!placeholder) return;

    try {
        const response = await fetch(NAV_FRAGMENT_PATH);

        if (!response.ok) {
            throw new Error(`HTTP 에러 발생! 상태코드: ${response.status}`);
        }

        placeholder.innerHTML = await response.text();
    } catch (error) {
        console.error("네비게이션 바를 불러오는 중 오류가 발생했습니다:", error);
        placeholder.innerHTML = FALLBACK_NAV_HTML;
    }

    highlightActiveLink(placeholder);
}

function highlightActiveLink(placeholder) {
    let currentPage = location.pathname.split('/').pop();
    if (currentPage === '') {
        currentPage = 'index.html';
    }

    placeholder.querySelectorAll('.nav-item').forEach((item) => {
        const matches = Array.from(item.querySelectorAll('a')).some(
            (link) => link.getAttribute('href') === currentPage
        );

        if (matches) {
            item.classList.add('active');
        }
    });
}

window.addEventListener('DOMContentLoaded', () => {
    loadNav();
});
