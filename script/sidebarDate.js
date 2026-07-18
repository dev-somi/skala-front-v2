const SIDEBAR_MONTH_NAMES = ['January','February','March','April','May','June',
  'July','August','September','October','November','December'];

function renderSidebarDate() {
    const dayEl = document.getElementById('sidebar-today-day');
    const monthEl = document.getElementById('sidebar-today-month');
    if (!dayEl || !monthEl) return;

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
