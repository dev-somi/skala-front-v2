// html/myClass.html 전용: URL의 ?date=YYYY-MM-DD를 기준으로 해당 주(월~토)의
// 강의 시간표를 <table>로 그린다. schedule.json에는 일요일 데이터가 없어
// 일요일 열은 항상 빈 칸으로 표시되지만, 표기는 일~토 7개로 맞춘다.
// 2시간 이상 이어지는 강의는 rowspan으로 셀을 합치되, 12~13시는 점심시간으로
// 항상 분리해 표시한다(그 시간을 가로지르는 강의는 앞/뒤로 나뉘어 렌더링됨).

const GRID_START_HOUR = 9;
const GRID_END_HOUR = 18;
const LUNCH_HOUR = 12;
const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];
// WEEKDAY_LABELS[i]는 그 주 월요일 기준 (i - 1)일 오프셋 (일요일은 -1, 토요일은 5)
const SUNDAY_OFFSET = -1;

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
        tbody.innerHTML = `<tr><td colspan="8" class="class-table__error">⚠️ 로컬 보안 정책(CORS)으로 인해 데이터를 불러오지 못했습니다. VS Code의 Live Server로 실행해 주세요.</td></tr>`;
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

// thead: 시간 열 + 일~토 요일/날짜 열을 채운다.
function buildTableHead(monday) {
    const headerRow = document.getElementById('week-table-header');
    let html = `<th scope="col">시간</th>`;

    WEEKDAY_LABELS.forEach((label, i) => {
        const date = CalendarUtils.addDays(monday, SUNDAY_OFFSET + i);
        html += `<th scope="col">${label}<span class="class-table__date">${date.getMonth() + 1}/${date.getDate()}</span></th>`;
    });

    headerRow.innerHTML = html;
}

// schedule.json은 월 단위 키로 저장되므로 일요일~토요일이 걸치는 월을 모두 확인한다.
// 반환값: 인덱스(0=일 ~ 6=토)별 해당 날짜의 강의 항목(없으면 null).
function collectEntriesByDay(allSchedules, monday) {
    const dayDates = WEEKDAY_LABELS.map((_, i) => CalendarUtils.addDays(monday, SUNDAY_OFFSET + i));
    const monthKeys = new Set(dayDates.map((d) => String(d.getMonth() + 1)));

    const entriesByDate = {};
    monthKeys.forEach((key) => {
        (allSchedules[key] || []).forEach((item) => {
            entriesByDate[item.date] = item;
        });
    });

    return dayDates.map((date) => entriesByDate[CalendarUtils.formatISODate(date)] || null);
}

// 강의 항목 하나를 렌더링 가능한 시간 구간(segment)으로 변환한다.
// 휴일은 하루 전체(GRID_START_HOUR~GRID_END_HOUR)를 그대로 한 구간으로 유지하지만,
// 일반 강의는 12~13시(점심시간)를 가로지르면 앞/뒤 두 구간으로 쪼갠다.
function buildSegments(entry) {
    if (!entry) return [];

    const holiday = isHolidayContent(entry.content) || entry.startTime == null;
    if (holiday) {
        return [{ entry, holiday: true, unspecified: false, startHour: GRID_START_HOUR, endHour: GRID_END_HOUR }];
    }

    const hasTime = Boolean(entry.startTime && entry.endTime);
    const unspecified = !hasTime;
    const startHour = Number((hasTime ? entry.startTime : '09:00').slice(0, 2));
    const endHour = Number((hasTime ? entry.endTime : '18:00').slice(0, 2));

    const segments = [];
    if (startHour < LUNCH_HOUR) {
        segments.push({ entry, holiday: false, unspecified, startHour, endHour: Math.min(endHour, LUNCH_HOUR) });
    }
    if (endHour > LUNCH_HOUR + 1) {
        segments.push({
            entry, holiday: false, unspecified,
            startHour: Math.max(startHour, LUNCH_HOUR + 1), endHour,
            continued: startHour < LUNCH_HOUR,
        });
    }
    return segments;
}

function renderSegmentCell(segment) {
    const { entry, holiday, unspecified, startHour, endHour, continued } = segment;
    const rowspan = Math.max(1, endHour - startHour);
    const teacherLabel = entry.teacher && entry.teacher !== '-' ? entry.teacher : '';
    const timeLabel = holiday ? '' : `${String(startHour).padStart(2, '0')}:00~${String(endHour).padStart(2, '0')}:00`;

    const td = document.createElement('td');
    if (rowspan > 1) td.rowSpan = rowspan;
    td.className = 'class-table__cell' +
        (holiday ? ' class-table__cell--holiday' : '') +
        (unspecified ? ' class-table__cell--unspecified' : '');

    td.innerHTML = `
        ${timeLabel ? `<span class="class-table__time">${timeLabel}</span>` : ''}
        <span class="class-table__content">${continued ? '↳ ' : ''}${entry.content}</span>
        ${teacherLabel ? `<span class="class-table__teacher">${teacherLabel}</span>` : ''}
        ${unspecified ? `<span class="class-table__hint">⚠ 시간 미지정 (기본값)</span>` : ''}
    `;
    return td;
}

// tbody: 시간(09~17시) 행마다 요일 열의 <td>를 채우고, 2시간 이상 이어지는 강의는
// 시작 시간 행에서만 rowspan으로 셀을 합치고 이후 행은 건너뛴다.
// 12시 행은 점심시간으로 고정되어 강의 rowspan이 지나가지 않는 한 전용 셀로 표시된다.
function renderTableBody(entriesByDay) {
    const tbody = document.getElementById('week-table-body');
    tbody.innerHTML = '';

    const segmentsByDay = entriesByDay.map(buildSegments);
    // 요일별 다음에 렌더링할 구간의 인덱스, 그리고 이전 rowspan에 걸려 건너뛰어야 할 남은 행 수
    const nextSegmentIndex = new Array(entriesByDay.length).fill(0);
    const skipRemaining = new Array(entriesByDay.length).fill(0);

    for (let hour = GRID_START_HOUR; hour < GRID_END_HOUR; hour++) {
        const tr = document.createElement('tr');
        const isLunch = hour === LUNCH_HOUR;
        tr.innerHTML = `<th scope="row">${isLunch ? '점심' : `${hour}:00`}</th>`;

        segmentsByDay.forEach((segments, dayIndex) => {
            if (skipRemaining[dayIndex] > 0) {
                skipRemaining[dayIndex]--;
                return;
            }

            if (isLunch) {
                const td = document.createElement('td');
                td.className = 'class-table__cell class-table__cell--lunch';
                td.innerHTML = `<span class="class-table__content">🍚 점심시간</span>`;
                tr.appendChild(td);
                return;
            }

            const segment = segments[nextSegmentIndex[dayIndex]];
            if (!segment || segment.startHour !== hour) {
                tr.appendChild(document.createElement('td'));
                return;
            }

            tr.appendChild(renderSegmentCell(segment));
            const rowspan = Math.max(1, segment.endHour - segment.startHour);
            if (rowspan > 1) skipRemaining[dayIndex] = rowspan - 1;
            nextSegmentIndex[dayIndex]++;
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
