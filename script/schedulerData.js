window.SchedulerData = (() => {
    const NS = 'skala.scheduler';

    let scheduleCache = null;

    async function loadSchedule() {
        if (scheduleCache) return scheduleCache;
        const response = await fetch('../schedule.json');
        if (!response.ok) throw new Error(`HTTP 에러 발생! 상태코드: ${response.status}`);
        scheduleCache = await response.json();
        return scheduleCache;
    }

    function isHolidayEntry(entry) {
        if (!entry) return false;
        if (entry.startTime == null) return true;
        const c = entry.content || '';
        return c.includes('연휴') || c.includes('대체휴일') || c.includes('자체휴강');
    }

    function buildClassMap(schedule) {
        const map = {};
        Object.keys(schedule).forEach((monthKey) => {
            (schedule[monthKey] || []).forEach((entry) => { map[entry.date] = entry; });
        });
        return map;
    }

    function flattenClasses(schedule) {
        const all = [];
        Object.keys(schedule).forEach((monthKey) => {
            (schedule[monthKey] || []).forEach((entry) => all.push(entry));
        });
        all.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
        return all;
    }

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

        getTodos: (iso) => readJSON(`${NS}.todos.${iso}`, []),
        setTodos: (iso, list) => writeJSON(`${NS}.todos.${iso}`, list),

        getEvents,
        setEvents,
        addEvent: (event) => { const list = getEvents(); list.push(event); setEvents(list); },
        removeEvent: (id) => setEvents(getEvents().filter((e) => e.id !== id)),

        getView: () => {
            try { return localStorage.getItem(`${NS}.view`) || 'weekly'; }
            catch (error) { return 'weekly'; }
        },
        setView: (mode) => {
            try { localStorage.setItem(`${NS}.view`, mode); }
            catch (error) { }
        },
    };
})();
