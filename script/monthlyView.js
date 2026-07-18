let allSchedules = {};
const CAL_YEAR = 2026;
let currentMonth = CalendarUtils.MIN_MONTH;

async function loadScheduleData() {
    const tbody = document.getElementById('month-grid-tbody');

    try {
        const response = await fetch('../schedule.json');

        if (!response.ok) {
            throw new Error(`HTTP 에러 발생! 상태코드: ${response.status}`);
        }

        allSchedules = await response.json();
        renderMonth(currentMonth);
    } catch (error) {
        console.error("데이터 로드 중 오류가 발생했습니다:", error);
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="color: red; font-weight: bold; padding: 20px; text-align: center;">
                    ⚠️ 로컬 보안 정책(CORS)으로 인해 데이터를 불러오지 못했습니다.<br>
                    VS Code에서 'Live Server'를 켜서 실행해 주세요.
                </td>
            </tr>
        `;
    }
}

function isHolidayContent(content) {
    return content.includes('연휴') || content.includes('대체휴일') || content.includes('자체휴강');
}

function renderMonth(monthNum) {
    monthNum = CalendarUtils.clampMonth(monthNum);
    currentMonth = monthNum;

    document.getElementById('current-month').textContent = `${CAL_YEAR}년 ${monthNum}월`;
    document.getElementById('prev-month-btn').disabled = monthNum <= CalendarUtils.MIN_MONTH;
    document.getElementById('next-month-btn').disabled = monthNum >= CalendarUtils.MAX_MONTH;

    const monthData = allSchedules[String(monthNum)] || [];
    const byDate = {};
    monthData.forEach((item) => { byDate[item.date] = item; });

    const weeks = CalendarUtils.buildMonthMatrix(CAL_YEAR, monthNum - 1);
    const tbody = document.getElementById('month-grid-tbody');

    tbody.innerHTML = weeks.map((week) => {
        const cells = week.map((cell, colIndex) => {
            if (!cell) {
                return `<td class="pad" aria-hidden="true"></td>`;
            }

            const entry = byDate[cell.iso];
            const dayNum = cell.date.getDate();
            const weekendClass = colIndex === 0 ? ' class="cal-cell--sun"' : colIndex === 6 ? ' class="cal-cell--sat"' : '';

            if (!entry) {
                return `<td${weekendClass}>
                    <button type="button" class="cal-day-cell" data-date="${cell.iso}" aria-label="${cell.iso}, 등록된 일정 없음">
                        <span class="cal-day-num">${dayNum}</span>
                    </button>
                </td>`;
            }

            const chipClass = isHolidayContent(entry.content) ? 'cal-day-chip cal-day-chip--holiday' : 'cal-day-chip';
            return `<td${weekendClass}>
                <button type="button" class="cal-day-cell" data-date="${cell.iso}" aria-label="${cell.iso}, ${entry.content}">
                    <span class="cal-day-num">${dayNum}</span>
                    <span class="${chipClass}">${entry.content}</span>
                </button>
            </td>`;
        }).join('');

        return `<tr>${cells}</tr>`;
    }).join('');
}

document.getElementById('month-grid-tbody').addEventListener('click', (event) => {
    const btn = event.target.closest('.cal-day-cell');
    if (!btn) return;
    location.href = `myClass.html?date=${btn.getAttribute('data-date')}`;
});

document.getElementById('prev-month-btn').addEventListener('click', () => renderMonth(currentMonth - 1));
document.getElementById('next-month-btn').addEventListener('click', () => renderMonth(currentMonth + 1));

window.addEventListener('DOMContentLoaded', () => loadScheduleData());
