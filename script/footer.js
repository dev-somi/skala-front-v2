// 1. 푸터 조각 파일 경로
const FOOTER_FRAGMENT_PATH = 'partials/footer.html';

// 2. fetch 실패 시(예: file://로 직접 열었을 때의 CORS 문제) 사용할 대체 마크업
//    partials/footer.html과 동일한 내용을 하드코딩해 안전망으로 유지합니다.
const FALLBACK_FOOTER_HTML = `
    <footer>

        <!-- 상태 표시바: 사이드바 성격의 부가 정보 제공 -->
        <aside class="status-bar" aria-label="현재 접속 정보">
            <p>오늘 날짜: 2026년 7월 15일 | 현재 위치: 광주광역시 광산구 | 시간: 오후 8:30</p>
        </aside>

        <!-- 사이트 정보 및 저작권 -->
        <div class="site-info">
            <p>A curated collection of Som's dreams and small adventures.</p>
            <h2>Som's Digital Home</h2>
            <p>This is a space for sharing memories and creative projects, built in a charming, hand-drawn style.</p>

            <p><small>All designs and content belong to Som. &copy; 2026 Som. Let's keep exploring!</small></p>
        </div>

    </footer>
`;

// 3. 푸터 조각을 불러와 placeholder에 삽입
async function loadFooter() {
    const placeholder = document.getElementById('footer-placeholder');
    if (!placeholder) return;

    try {
        const response = await fetch(FOOTER_FRAGMENT_PATH);

        if (!response.ok) {
            throw new Error(`HTTP 에러 발생! 상태코드: ${response.status}`);
        }

        placeholder.innerHTML = await response.text();
    } catch (error) {
        console.error("푸터를 불러오는 중 오류가 발생했습니다:", error);

        // [예외 처리] 로컬 파일(더블클릭)로 열었을 때를 대비한 하드코딩 백업 마크업
        placeholder.innerHTML = FALLBACK_FOOTER_HTML;
    }
}

// 4. 페이지가 로드되면 최초 실행
window.addEventListener('DOMContentLoaded', () => {
    loadFooter();
});
