// html/myClass.html 전용: URL의 ?date=YYYY-MM-DD를 기준으로 해당 주(월~토)의
// 시간대별 절대좌표 그리드를 그린다. schedule.json에는 일요일 데이터가 없어
// 요일 열은 월~토 6개로 고정한다.

const GRID_START_HOUR = 8;  // 2026-08-29 특강처럼 08:00 시작 데이터가 있어 08시부터 시작
const GRID_END_HOUR = 18;
const WEEKDAY_LABELS = ['월', '화', '수', '목', '금', '토'];

function getDateFromQuery() {
    const raw = new URLSearchParams(location.search).get('date');
    if (raw) {
        const parsed = CalendarUtils.parseISODate(raw);
        if (!Number.isNaN(parsed.getTime())) return parsed;
    }
    return new Date();
}

function timeToSlot(hhmm) {
    const [h, m] = hhmm.split(':').map(Number);
    return (h - GRID_START_HOUR) * 2 + (m >= 30 ? 1 : 0);
}

function isHolidayContent(content) {
    return content.includes('연휴') || content.includes('대체휴일') || content.includes('자체휴강');
}

async function loadAndRenderWeek() {
    const baseDate = getDateFromQuery();
    const monday = CalendarUtils.getMondayOfWeek(baseDate);
    const saturday = CalendarUtils.getSaturdayOfWeek(baseDate);

    updateWeekHeader(monday, saturday);
    buildGridSkeleton(monday);

    try {
        const response = await fetch('../schedule.json');
        if (!response.ok) throw new Error(`HTTP 에러 발생! 상태코드: ${response.status}`);

        const allSchedules = await response.json();
        const entriesByDate = collectEntriesInRange(allSchedules, monday, saturday);
        renderTimeBlocks(monday, entriesByDate);
    } catch (error) {
        console.error("데이터 로드 중 오류가 발생했습니다:", error);
        const grid = document.getElementById('week-grid');
        const warning = document.createElement('div');
        warning.className = 'week-grid__error';
        warning.style.gridColumn = '1 / -1';
        warning.style.gridRow = '2 / -1';
        warning.textContent = '⚠️ 로컬 보안 정책(CORS)으로 인해 데이터를 불러오지 못했습니다. VS Code의 Live Server로 실행해 주세요.';
        grid.appendChild(warning);
    }
}

function updateWeekHeader(monday, saturday) {
    const label = `${monday.getMonth() + 1}월 ${monday.getDate()}일 ~ ${saturday.getMonth() + 1}월 ${saturday.getDate()}일`;
    document.getElementById('current-week-display').textContent = label;

    const iso = CalendarUtils.formatISODate(monday);
    document.getElementById('prev-week-btn').dataset.targetDate =
        CalendarUtils.formatISODate(CalendarUtils.addDays(monday, -7));
    document.getElementById('next-week-btn').dataset.targetDate =
        CalendarUtils.formatISODate(CalendarUtils.addDays(monday, 7));
    document.getElementById('week-grid').setAttribute('aria-label', `${iso} 주간 수업 시간표`);
}

// 요일 헤더 + 시간 라벨 등 매 주 공통으로 그려지는 뼈대를 채운다.
function buildGridSkeleton(monday) {
    const grid = document.getElementById('week-grid');
    let html = `<div class="week-grid__corner" style="grid-column:1; grid-row:1;" aria-hidden="true"></div>`;

    WEEKDAY_LABELS.forEach((label, i) => {
        const date = CalendarUtils.addDays(monday, i);
        html += `<div class="week-grid__day-header" role="columnheader" style="grid-column:${i + 2}; grid-row:1;">
            ${label} <span class="week-grid__date">${date.getMonth() + 1}/${date.getDate()}</span>
        </div>`;
    });

    for (let h = GRID_START_HOUR; h < GRID_END_HOUR; h++) {
        const rowStart = (h - GRID_START_HOUR) * 2 + 2;
        html += `<div class="week-grid__hour" role="rowheader" style="grid-column:1; grid-row:${rowStart} / span 2;">${h}:00</div>`;
    }

    grid.innerHTML = html;
}

// monday~saturday 범위가 두 월(schedule.json 키)에 걸칠 수 있으므로 두 달치를 모두 확인한다.
function collectEntriesInRange(allSchedules, monday, saturday) {
    const monthKeys = new Set([
        String(monday.getMonth() + 1),
        String(saturday.getMonth() + 1),
    ]);

    const startIso = CalendarUtils.formatISODate(monday);
    const endIso = CalendarUtils.formatISODate(saturday);
    const entries = [];

    monthKeys.forEach((key) => {
        (allSchedules[key] || []).forEach((item) => {
            if (item.date >= startIso && item.date <= endIso) entries.push(item);
        });
    });

    return entries;
}

function renderTimeBlocks(monday, entries) {
    const grid = document.getElementById('week-grid');

    entries.forEach((entry) => {
        const dayIndex = Math.round(
            (CalendarUtils.parseISODate(entry.date) - monday) / (24 * 60 * 60 * 1000)
        );
        if (dayIndex < 0 || dayIndex > 5) return; // 월~토 범위 밖(방어적 처리)

        const holiday = isHolidayContent(entry.content) || entry.startTime == null;
        const hasTime = entry.startTime && entry.endTime;
        const unspecified = !holiday && !hasTime;

        const startSlot = holiday ? 0 : timeToSlot(hasTime ? entry.startTime : '09:00');
        const endSlot = holiday ? (GRID_END_HOUR - GRID_START_HOUR) * 2 : timeToSlot(hasTime ? entry.endTime : '18:00');
        const rowStart = startSlot + 2;
        const span = Math.max(1, endSlot - startSlot);

        const classes = ['time-block'];
        if (holiday) classes.push('time-block--holiday');
        if (unspecified) classes.push('time-block--unspecified');

        const teacherLabel = entry.teacher && entry.teacher !== '-' ? entry.teacher : '';
        const timeLabel = holiday ? '' : `${hasTime ? entry.startTime : '09:00'}~${hasTime ? entry.endTime : '18:00'}`;
        const ariaLabel = [entry.content, teacherLabel, timeLabel].filter(Boolean).join(', ');

        const block = document.createElement('div');
        block.className = classes.join(' ');
        block.setAttribute('role', 'gridcell');
        block.setAttribute('aria-label', ariaLabel);
        block.style.gridColumn = String(dayIndex + 2);
        block.style.gridRow = `${rowStart} / span ${span}`;
        block.innerHTML = `
            ${timeLabel ? `<span class="time-block__time">${timeLabel}</span>` : ''}
            <span class="time-block__content">${entry.content}</span>
            ${teacherLabel ? `<span class="time-block__teacher">${teacherLabel}</span>` : ''}
            ${unspecified ? `<span class="time-block__hint">⚠ 시간 미지정 (기본값)</span>` : ''}
        `;
        grid.appendChild(block);
    });
}

document.getElementById('prev-week-btn').addEventListener('click', (e) => {
    location.href = `myClass.html?date=${e.currentTarget.dataset.targetDate}`;
});
document.getElementById('next-week-btn').addEventListener('click', (e) => {
    location.href = `myClass.html?date=${e.currentTarget.dataset.targetDate}`;
});

window.addEventListener('DOMContentLoaded', () => loadAndRenderWeek());
