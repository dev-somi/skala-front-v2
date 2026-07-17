// scheduler.html 전용 데이터 레이어. schedule.json fetch/캐시 + localStorage 영속화만 담당하고
// DOM은 건드리지 않는다. 번들러가 없어 ES 모듈 대신 전역 네임스페이스로 노출한다.
// (calendarUtils.js 와 동일한 관례)
window.SchedulerData = (() => {
    const NS = 'skala.scheduler'; // localStorage 키 접두어

    let scheduleCache = null;

    // ----- schedule.json (읽기 전용 수업 데이터) -----

    // 루트 schedule.json 을 한 번만 불러와 캐시한다. file:// 로 열면 CORS로 실패하므로
    // 호출부(scheduler.js)에서 try/catch 후 안내 메시지를 띄운다.
    async function loadSchedule() {
        if (scheduleCache) return scheduleCache;
        const response = await fetch('../schedule.json');
        if (!response.ok) throw new Error(`HTTP 에러 발생! 상태코드: ${response.status}`);
        scheduleCache = await response.json();
        return scheduleCache;
    }

    // 공휴일/휴강(내용에 "연휴"/"대체휴일"/"자체휴강" 포함)이거나 startTime 이 null 인 항목.
    function isHolidayEntry(entry) {
        if (!entry) return false;
        if (entry.startTime == null) return true;
        const c = entry.content || '';
        return c.includes('연휴') || c.includes('대체휴일') || c.includes('자체휴강');
    }

    // "YYYY-MM-DD" -> 수업 항목 으로 바로 조회하기 위한 맵.
    function buildClassMap(schedule) {
        const map = {};
        Object.keys(schedule).forEach((monthKey) => {
            (schedule[monthKey] || []).forEach((entry) => { map[entry.date] = entry; });
        });
        return map;
    }

    // 전월 데이터를 날짜 오름차순 1차원 배열로 평탄화(다음 수업 계산용).
    function flattenClasses(schedule) {
        const all = [];
        Object.keys(schedule).forEach((monthKey) => {
            (schedule[monthKey] || []).forEach((entry) => all.push(entry));
        });
        all.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
        return all;
    }

    // ----- localStorage 래퍼 (JSON parse/저장 실패 방어) -----

    function readJSON(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch (error) {
            console.warn('localStorage 읽기/파싱 실패:', key, error);
            return fallback;
        }
    }

    function writeJSON(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.warn('localStorage 저장 실패:', key, error);
        }
    }

    function getEvents() { return readJSON(`${NS}.events`, []); }
    function setEvents(list) { writeJSON(`${NS}.events`, list); }

    return {
        loadSchedule,
        isHolidayEntry,
        buildClassMap,
        flattenClasses,

        // 날짜별 데일리 투두
        getTodos: (iso) => readJSON(`${NS}.todos.${iso}`, []),
        setTodos: (iso, list) => writeJSON(`${NS}.todos.${iso}`, list),

        // 날짜별 예습/복습 계획 { <과목명>: {preview, review} }
        getPlan: (iso) => readJSON(`${NS}.plan.${iso}`, {}),
        setPlan: (iso, plan) => writeJSON(`${NS}.plan.${iso}`, plan),

        // 개인 캘린더 일정 [{id, date, time, title}]
        getEvents,
        setEvents,
        addEvent: (event) => { const list = getEvents(); list.push(event); setEvents(list); },
        removeEvent: (id) => setEvents(getEvents().filter((e) => e.id !== id)),

        // 마지막으로 본 뷰 상태
        getView: () => {
            try { return localStorage.getItem(`${NS}.view`) || 'weekly'; }
            catch (error) { return 'weekly'; }
        },
        setView: (mode) => {
            try { localStorage.setItem(`${NS}.view`, mode); }
            catch (error) { /* 저장 실패는 무시 (뷰 상태는 부가 정보) */ }
        },
    };
})();
