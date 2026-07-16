// 캘린더(주별/월별) 페이지가 공통으로 쓰는 순수 날짜 계산 헬퍼 모음.
// 번들러가 없는 프로젝트라 ES 모듈(import) 대신 전역 네임스페이스로 노출한다.
window.CalendarUtils = (() => {
    const DAY_MS = 24 * 60 * 60 * 1000;

    // "YYYY-MM-DD" -> Date. new Date(str)는 UTC 자정으로 해석되어
    // 음수 UTC 오프셋 지역에서 하루가 밀리므로 로컬 타임존 기준으로 직접 생성한다.
    function parseISODate(iso) {
        const [y, m, d] = iso.split('-').map(Number);
        return new Date(y, m - 1, d);
    }

    function formatISODate(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    function addDays(date, days) {
        return new Date(date.getTime() + days * DAY_MS);
    }

    // 주어진 날짜가 속한 주의 월요일 (schedule.json에 일요일 데이터가 없으므로
    // 월~토 6일 창을 기준으로 주별 뷰를 구성한다)
    function getMondayOfWeek(date) {
        const day = date.getDay(); // 0=일 ~ 6=토
        const diffToMonday = day === 0 ? -6 : 1 - day;
        const monday = addDays(date, diffToMonday);
        monday.setHours(0, 0, 0, 0);
        return monday;
    }

    function getSaturdayOfWeek(date) {
        return addDays(getMondayOfWeek(date), 5);
    }

    function getDaysInMonth(year, monthIndex0) {
        return new Date(year, monthIndex0 + 1, 0).getDate();
    }

    // 해당 월 1일의 요일 (0=일 ~ 6=토)
    function getFirstWeekdayOfMonth(year, monthIndex0) {
        return new Date(year, monthIndex0, 1).getDay();
    }

    // 월별 달력 그리드(일~토 7열)를 주 단위 배열로 반환.
    // 각 칸은 해당 월 날짜면 {date, iso}, 앞/뒤 여백 칸이면 null.
    // 31일이 토요일에 시작하는 달처럼 6주가 필요한 경우 자동으로 6행을 만든다.
    function buildMonthMatrix(year, monthIndex0) {
        const firstWeekday = getFirstWeekdayOfMonth(year, monthIndex0);
        const daysInMonth = getDaysInMonth(year, monthIndex0);

        const cells = [];
        for (let i = 0; i < firstWeekday; i++) {
            cells.push(null);
        }
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, monthIndex0, day);
            cells.push({ date, iso: formatISODate(date) });
        }
        while (cells.length % 7 !== 0) {
            cells.push(null);
        }

        const weeks = [];
        for (let i = 0; i < cells.length; i += 7) {
            weeks.push(cells.slice(i, i + 7));
        }
        return weeks;
    }

    // schedule.json은 "7"~"12" 월 데이터만 있으므로 이 범위로 고정한다.
    const MIN_MONTH = 7;
    const MAX_MONTH = 12;

    function clampMonth(monthNum) {
        return Math.min(MAX_MONTH, Math.max(MIN_MONTH, monthNum));
    }

    return {
        parseISODate,
        formatISODate,
        addDays,
        getMondayOfWeek,
        getSaturdayOfWeek,
        getDaysInMonth,
        getFirstWeekdayOfMonth,
        buildMonthMatrix,
        clampMonth,
        MIN_MONTH,
        MAX_MONTH,
    };
})();
