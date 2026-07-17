// 캘린더 사이드바 상단 "오늘 날짜"(일 숫자 + Month Year)를 실시간 렌더링.
// 세 캘린더 페이지 공용. calendarUtils.js 등에 의존하지 않고 단독 동작.
const SIDEBAR_MONTH_NAMES = ['January','February','March','April','May','June',
  'July','August','September','October','November','December'];

function renderSidebarDate() {
    const dayEl = document.getElementById('sidebar-today-day');
    const monthEl = document.getElementById('sidebar-today-month');
    if (!dayEl || !monthEl) return;   // 사이드바 없는 페이지 방어

    const today = new Date();
    dayEl.textContent = today.getDate();
    monthEl.textContent = `${SIDEBAR_MONTH_NAMES[today.getMonth()]} ${today.getFullYear()}`;

    const dateEl = document.getElementById('sidebar-date');
    if (dateEl) {
        const m = String(today.getMonth() + 1).padStart(2, '0');
        const d = String(today.getDate()).padStart(2, '0');
        dateEl.setAttribute('datetime', `${today.getFullYear()}-${m}-${d}`);
    }
}

window.addEventListener('DOMContentLoaded', renderSidebarDate);
