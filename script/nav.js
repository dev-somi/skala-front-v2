// 1. 네비게이션 조각 파일 경로
const NAV_FRAGMENT_PATH = 'partials/nav.html';

// 2. fetch 실패 시(예: file://로 직접 열었을 때의 CORS 문제) 사용할 대체 마크업
//    partials/nav.html과 동일한 내용을 하드코딩해 안전망으로 유지합니다.
const FALLBACK_NAV_HTML = `
    <nav class="navbar" aria-label="메인 네비게이션">
        <a href="index.html" class="logo" aria-label="Som's 홈으로 이동">Som's</a>
        <ul class="nav-links">
            <li class="nav-item"><a href="index.html">Home</a></li>
            <li class="nav-item"><a href="myProfile.html">Profile</a></li>
            <li class="nav-item"><a href="scheduler.html">Calendar</a></li>
            <li class="nav-item"><a href="myTrip.html">Travel</a></li>
            <li class="nav-item"><a href="jsPlayground.html">Playground</a></li>
        </ul>
        <div class="nav-actions">
            <a href="signUp.html" class="btn-signup" aria-label="회원가입 페이지로 이동">Sign Up</a>
        </div>
    </nav>
`;

// 3. 네비게이션 조각을 불러와 placeholder에 삽입
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

        // [예외 처리] 로컬 파일(더블클릭)로 열었을 때를 대비한 하드코딩 백업 마크업
        placeholder.innerHTML = FALLBACK_NAV_HTML;
    }

    highlightActiveLink(placeholder);
}

// 4. 현재 페이지에 해당하는 nav-item에 active 클래스 부여
function highlightActiveLink(placeholder) {
    let currentPage = location.pathname.split('/').pop();
    if (currentPage === '') {
        currentPage = 'index.html';
    }

    placeholder.querySelectorAll('.nav-item').forEach((item) => {
        const link = item.querySelector('a');

        if (link && link.getAttribute('href') === currentPage) {
            item.classList.add('active');
        }
    });
}

// 5. 페이지가 로드되면 최초 실행
window.addEventListener('DOMContentLoaded', () => {
    loadNav();
});
