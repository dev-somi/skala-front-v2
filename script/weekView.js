// html/myClass.html 전용: URL의 ?date=YYYY-MM-DD를 기준으로 해당 주(월~토)의
// 강의 시간표를 <table>로 그린다. schedule.json에는 일요일 데이터가 없어
// 요일 열은 월~토 6개로 고정한다. 2시간 이상 이어지는 강의는 rowspan으로 셀을 합친다.

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

function isHolidayContent(content) {
    return content.includes('연휴') || content.includes('대체휴일') || content.includes('자체휴강');
}

async function loadAndRenderWeek() {
    const baseDate = getDateFromQuery();
    const monday = CalendarUtils.getMondayOfWeek(baseDate);
    const saturday = CalendarUtils.getSaturdayOfWeek(baseDate);

    updateWeekHeader(monday, saturday);
    buildTableHead(monday);

    try {
        const response = await fetch('../schedule.json');
        if (!response.ok) throw new Error(`HTTP 에러 발생! 상태코드: ${response.status}`);

        const allSchedules = await response.json();
        const entriesByDay = collectEntriesByDay(allSchedules, monday);
        renderTableBody(entriesByDay);
    } catch (error) {
        console.error("데이터 로드 중 오류가 발생했습니다:", error);
        const tbody = document.getElementById('week-table-body');
        tbody.innerHTML = `<tr><td colspan="7" class="class-table__error">⚠️ 로컬 보안 정책(CORS)으로 인해 데이터를 불러오지 못했습니다. VS Code의 Live Server로 실행해 주세요.</td></tr>`;
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
    document.getElementById('week-table').setAttribute('aria-label', `${iso} 주간 수업 시간표`);
}

// thead: 시간 열 + 월~토 요일/날짜 열을 채운다.
function buildTableHead(monday) {
    const headerRow = document.getElementById('week-table-header');
    let html = `<th scope="col">시간</th>`;

    WEEKDAY_LABELS.forEach((label, i) => {
        const date = CalendarUtils.addDays(monday, i);
        html += `<th scope="col">${label}<span class="class-table__date">${date.getMonth() + 1}/${date.getDate()}</span></th>`;
    });

    headerRow.innerHTML = html;
}

// schedule.json은 월 단위 키로 저장되므로 monday~monday+5(토)가 걸치는 월을 모두 확인한다.
// 반환값: 인덱스(0=월 ~ 5=토)별 해당 날짜의 강의 항목(없으면 null).
function collectEntriesByDay(allSchedules, monday) {
    const dayDates = WEEKDAY_LABELS.map((_, i) => CalendarUtils.addDays(monday, i));
    const monthKeys = new Set(dayDates.map((d) => String(d.getMonth() + 1)));

    const entriesByDate = {};
    monthKeys.forEach((key) => {
        (allSchedules[key] || []).forEach((item) => {
            entriesByDate[item.date] = item;
        });
    });

    return dayDates.map((date) => entriesByDate[CalendarUtils.formatISODate(date)] || null);
}

// tbody: 시간(08~17시) 행마다 요일 열의 <td>를 채우고, 2시간 이상 이어지는 강의는
// 시작 시간 행에서만 rowspan으로 셀을 합치고 이후 행은 건너뛴다.
function renderTableBody(entriesByDay) {
    const tbody = document.getElementById('week-table-body');
    tbody.innerHTML = '';

    // 요일별로 이전 rowspan에 걸려 건너뛰어야 할 남은 행 수
    const skipRemaining = new Array(entriesByDay.length).fill(0);

    for (let hour = GRID_START_HOUR; hour < GRID_END_HOUR; hour++) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<th scope="row">${hour}:00</th>`;

        entriesByDay.forEach((entry, dayIndex) => {
            if (skipRemaining[dayIndex] > 0) {
                skipRemaining[dayIndex]--;
                return;
            }

            if (!entry) {
                tr.appendChild(document.createElement('td'));
                return;
            }

            const holiday = isHolidayContent(entry.content) || entry.startTime == null;
            const hasTime = Boolean(entry.startTime && entry.endTime);

            const startHour = holiday ? GRID_START_HOUR : Number((hasTime ? entry.startTime : '09:00').slice(0, 2));
            const endHour = holiday ? GRID_END_HOUR : Number((hasTime ? entry.endTime : '18:00').slice(0, 2));

            if (hour !== startHour) {
                // 이 항목은 아직 시작되지 않았다(휴일 등 이전 행에서 이미 rowspan 처리된 경우는 위에서 걸러짐).
                tr.appendChild(document.createElement('td'));
                return;
            }

            const rowspan = Math.max(1, endHour - startHour);
            const unspecified = !holiday && !hasTime;
            const teacherLabel = entry.teacher && entry.teacher !== '-' ? entry.teacher : '';
            const timeLabel = holiday ? '' : `${hasTime ? entry.startTime : '09:00'}~${hasTime ? entry.endTime : '18:00'}`;

            const td = document.createElement('td');
            if (rowspan > 1) td.rowSpan = rowspan;
            td.className = 'class-table__cell' +
                (holiday ? ' class-table__cell--holiday' : '') +
                (unspecified ? ' class-table__cell--unspecified' : '');

            td.innerHTML = `
                ${timeLabel ? `<span class="class-table__time">${timeLabel}</span>` : ''}
                <span class="class-table__content">${entry.content}</span>
                ${teacherLabel ? `<span class="class-table__teacher">${teacherLabel}</span>` : ''}
                ${unspecified ? `<span class="class-table__hint">⚠ 시간 미지정 (기본값)</span>` : ''}
            `;
            tr.appendChild(td);

            if (rowspan > 1) skipRemaining[dayIndex] = rowspan - 1;
        });

        tbody.appendChild(tr);
    }
}

document.getElementById('prev-week-btn').addEventListener('click', (e) => {
    location.href = `myClass.html?date=${e.currentTarget.dataset.targetDate}`;
});
document.getElementById('next-week-btn').addEventListener('click', (e) => {
    location.href = `myClass.html?date=${e.currentTarget.dataset.targetDate}`;
});

window.addEventListener('DOMContentLoaded', () => loadAndRenderWeek());
