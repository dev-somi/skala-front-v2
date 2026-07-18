// scheduler.html 전용 메인 컨트롤러.
// - 왼쪽 사이드바: My Class(오늘 타임라인) / My Plan(예·복습) 탭, Daily Todo, Upcoming Class
// - 오른쪽 캘린더: 주별/월별 뷰(수업 일정 + 개인 일정), 리로드 없는 인앱 상태 전환
// 순수 날짜 계산은 CalendarUtils(calendarUtils.js), 데이터는 SchedulerData(schedulerData.js) 재사용.

(function () {
    'use strict';

    // 주간 그리드는 기존 .week-grid CSS를 스코프 오버라이드해 08~24시 / 일~토 7일로 표시한다.
    const GRID_START_HOUR = 8;
    const GRID_END_HOUR = 24;
    const MEALTIMES = [
        { hour: 12, label: '점심시간' },
        { hour: 18, label: '저녁시간' },
    ];
    const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];
    const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];
    // 사이드바 타임라인은 요구사항대로 09~18시.
    const TL_START = 9;
    const TL_END = 18;

    const state = {
        today: null,
        todayISO: '',
        cursor: null,        // 캘린더 기준일 (주간=주 안의 아무 날, 월간=달 안의 아무 날)
        viewMode: 'weekly',
        schedule: {},
        classMap: {},        // iso -> 수업 항목
        flatClasses: [],     // 날짜 오름차순 평탄화
        eventsMap: {},       // iso -> 개인 일정 배열
        dialogDate: '',      // 현재 다이얼로그가 편집 중인 날짜
    };

    // ---------- 유틸 ----------

    function stripTime(date) {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return d;
    }

    function escapeHtml(str) {
        return String(str == null ? '' : str)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function genId() {
        return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    }

    function toMinutes(hhmm) {
        const [h, m] = hhmm.split(':').map(Number);
        return h * 60 + m;
    }

    function toFractionalHour(hhmm) {
        const [h, m] = hhmm.split(':').map(Number);
        return h + m / 60;
    }

    // "HH:MM" -> 주간 그리드 30분 슬롯 인덱스(08:00 기준)
    function timeToSlot(hhmm) {
        const [h, m] = hhmm.split(':').map(Number);
        return (h - GRID_START_HOUR) * 2 + (m >= 30 ? 1 : 0);
    }

    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }

    function teacherOf(entry) {
        return entry.teacher && entry.teacher !== '-' ? entry.teacher : '';
    }

    function rebuildEventsMap() {
        const map = {};
        SchedulerData.getEvents().forEach((ev) => {
            (map[ev.date] = map[ev.date] || []).push(ev);
        });
        state.eventsMap = map;
    }

    // ---------- 사이드바: My Class 오늘 타임라인 ----------

    function todayLabelText() {
        const d = state.today;
        return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${DAY_NAMES[d.getDay()]})`;
    }

    function renderTodayTimeline() {
        document.getElementById('class-today-label').textContent = todayLabelText();
        const container = document.getElementById('today-timeline');
        const entry = state.classMap[state.todayISO];

        if (!entry) {
            container.innerHTML = `<p class="sidebar-empty">오늘은 수업이 없어요 🌿</p>`;
            return;
        }
        if (SchedulerData.isHolidayEntry(entry)) {
            container.innerHTML = `<div class="timeline-holiday">🎌 ${escapeHtml(entry.content)}</div>`;
            return;
        }

        const hasTime = entry.startTime && entry.endTime;
        const startH = hasTime ? toFractionalHour(entry.startTime) : 9;
        const endH = hasTime ? toFractionalHour(entry.endTime) : 18;
        const span = TL_END - TL_START;

        let hours = '';
        for (let h = TL_START; h <= TL_END; h++) {
            hours += `<span class="timeline-hour" style="top:${((h - TL_START) / span) * 100}%">${h}:00</span>`;
        }

        const top = ((clamp(startH, TL_START, TL_END) - TL_START) / span) * 100;
        const height = ((clamp(endH, TL_START, TL_END) - clamp(startH, TL_START, TL_END)) / span) * 100;
        const teacher = teacherOf(entry);

        container.innerHTML = `
            <div class="timeline-track">
                ${hours}
                <div class="timeline-block" style="top:${top}%;height:${height}%">
                    <span class="timeline-block__time">${hasTime ? `${entry.startTime}~${entry.endTime}` : '09:00~18:00'}</span>
                    <span class="timeline-block__content">${escapeHtml(entry.content)}</span>
                    ${teacher ? `<span class="timeline-block__teacher">👩‍🏫 ${escapeHtml(teacher)}</span>` : ''}
                </div>
            </div>`;
    }

    // ---------- 사이드바: My Plan 예·복습 ----------

    function renderPlanEditor() {
        document.getElementById('plan-today-label').textContent = todayLabelText();
        const container = document.getElementById('plan-editor');
        const entry = state.classMap[state.todayISO];

        if (!entry || SchedulerData.isHolidayEntry(entry)) {
            container.innerHTML = `<p class="sidebar-empty">오늘은 계획된 일정이 없어요 🌿</p>`;
            return;
        }

        const subject = entry.content;
        const plan = SchedulerData.getPlan(state.todayISO);
        const saved = plan[subject] || { preview: '', review: '' };

        container.innerHTML = `
            <div class="plan-row">
                <h3 class="plan-subject">${escapeHtml(subject)}</h3>
                <label class="plan-field">
                    <span>📖 예습</span>
                    <textarea data-kind="preview" rows="2" placeholder="예습 계획을 적어보세요">${escapeHtml(saved.preview)}</textarea>
                </label>
                <label class="plan-field">
                    <span>🔁 복습</span>
                    <textarea data-kind="review" rows="2" placeholder="복습 계획을 적어보세요">${escapeHtml(saved.review)}</textarea>
                </label>
            </div>`;
    }

    function handlePlanInput(event) {
        const textarea = event.target.closest('textarea[data-kind]');
        if (!textarea) return;
        const entry = state.classMap[state.todayISO];
        if (!entry) return;

        const subject = entry.content;
        const plan = SchedulerData.getPlan(state.todayISO);
        plan[subject] = plan[subject] || { preview: '', review: '' };
        plan[subject][textarea.dataset.kind] = textarea.value;
        SchedulerData.setPlan(state.todayISO, plan);
    }

    // ---------- 사이드바: Daily Todo ----------

    function renderTodos() {
        const ul = document.getElementById('todo-list');
        const todos = SchedulerData.getTodos(state.todayISO);

        if (!todos.length) {
            ul.innerHTML = `<li class="todo-empty">오늘 할 일을 추가해보세요!</li>`;
            return;
        }

        ul.innerHTML = todos.map((t) => `
            <li class="todo-item${t.done ? ' todo-item--done' : ''}">
                <label class="todo-check">
                    <input type="checkbox" ${t.done ? 'checked' : ''} data-id="${t.id}" aria-label="완료 표시">
                    <span class="todo-text">${escapeHtml(t.text)}</span>
                </label>
                <button type="button" class="todo-delete" data-id="${t.id}" aria-label="할 일 삭제">&times;</button>
            </li>`).join('');
    }

    function addTodo(text) {
        const todos = SchedulerData.getTodos(state.todayISO);
        todos.push({ id: genId(), text: text, done: false });
        SchedulerData.setTodos(state.todayISO, todos);
        renderTodos();
    }

    function toggleTodo(id) {
        const todos = SchedulerData.getTodos(state.todayISO);
        const todo = todos.find((t) => t.id === id);
        if (todo) todo.done = !todo.done;
        SchedulerData.setTodos(state.todayISO, todos);
        renderTodos();
    }

    function deleteTodo(id) {
        SchedulerData.setTodos(state.todayISO, SchedulerData.getTodos(state.todayISO).filter((t) => t.id !== id));
        renderTodos();
    }

    // ---------- 사이드바: Upcoming Class ----------

    function renderUpcoming() {
        const container = document.getElementById('upcoming-class');
        const now = new Date();
        const nowMinutes = now.getHours() * 60 + now.getMinutes();

        // 오늘 이후(또는 오늘 중 아직 시작 전)인 가장 가까운 수업 1건.
        const upcoming = state.flatClasses
            .filter((e) => !SchedulerData.isHolidayEntry(e))
            .find((e) => {
                if (e.date > state.todayISO) return true;
                if (e.date === state.todayISO && e.startTime) return toMinutes(e.startTime) > nowMinutes;
                return false;
            });

        if (!upcoming) {
            container.innerHTML = `<p class="sidebar-empty">다가오는 수업이 없어요 🎉</p>`;
            return;
        }

        const target = CalendarUtils.parseISODate(upcoming.date);
        const dday = Math.round((target - stripTime(state.today)) / (24 * 60 * 60 * 1000));
        const ddayLabel = dday === 0 ? 'TODAY' : dday === 1 ? '내일 · D-1' : `D-${dday}`;
        const teacher = teacherOf(upcoming);

        container.innerHTML = `
            <div class="upcoming-item">
                <span class="upcoming-dday">${ddayLabel}</span>
                <p class="upcoming-date">${target.getMonth() + 1}월 ${target.getDate()}일 (${DAY_NAMES[target.getDay()]})</p>
                <p class="upcoming-content">${escapeHtml(upcoming.content)}</p>
                ${upcoming.startTime ? `<p class="upcoming-meta">🕘 ${upcoming.startTime}~${upcoming.endTime}</p>` : ''}
                ${teacher ? `<p class="upcoming-meta">👩‍🏫 ${escapeHtml(teacher)}</p>` : ''}
            </div>`;
    }

    // ---------- 캘린더: 주별 ----------

    function updateRangeLabel(text) {
        document.getElementById('cal-range-label').textContent = text;
    }

    function renderWeekly() {
        const body = document.getElementById('calendar-body');
        const monday = CalendarUtils.getMondayOfWeek(state.cursor);
        const sunday = CalendarUtils.addDays(monday, -1);
        const saturday = CalendarUtils.getSaturdayOfWeek(state.cursor);
        updateRangeLabel(`${sunday.getMonth() + 1}.${sunday.getDate()} ~ ${saturday.getMonth() + 1}.${saturday.getDate()}`);

        const grid = document.createElement('div');
        grid.className = 'week-grid';
        grid.setAttribute('role', 'grid');
        grid.setAttribute('aria-label', '주간 캘린더');

        let html = `<div class="week-grid__corner" style="grid-column:1;grid-row:1;" aria-hidden="true"></div>`;
        WEEKDAY_LABELS.forEach((label, i) => {
            const date = CalendarUtils.addDays(sunday, i);
            const iso = CalendarUtils.formatISODate(date);
            const isToday = iso === state.todayISO;
            html += `<button type="button" class="week-grid__day-header week-grid__day-header--btn${isToday ? ' is-today' : ''}"
                data-date="${iso}" style="grid-column:${i + 2};grid-row:1;" aria-label="${iso} 개인 일정 추가">
                ${label} <span class="week-grid__date">${date.getMonth() + 1}/${date.getDate()}</span>
            </button>`;
        });
        for (let h = GRID_START_HOUR; h < GRID_END_HOUR; h++) {
            const rowStart = (h - GRID_START_HOUR) * 2 + 2;
            html += `<div class="week-grid__hour" role="rowheader" style="grid-column:1;grid-row:${rowStart} / span 2;">${h}:00</div>`;
        }
        grid.innerHTML = html;

        for (let i = 0; i < 7; i++) {
            const iso = CalendarUtils.formatISODate(CalendarUtils.addDays(sunday, i));
            // 요일×시간 칸마다 클릭 가능한 빈 셀을 먼저 깔아둔다(수업/개인 일정 블록이 그 위에 덮어씀).
            for (let h = GRID_START_HOUR; h < GRID_END_HOUR; h++) {
                appendHourCell(grid, i, h, iso);
            }

            const entry = state.classMap[iso];
            const hasClass = entry && !SchedulerData.isHolidayEntry(entry);
            if (hasClass) {
                MEALTIMES.forEach(({ hour, label }) => appendMealBand(grid, i, hour, label));
            }
            if (entry) appendClassBlock(grid, i, entry);
            (state.eventsMap[iso] || []).forEach((ev) => appendEventBlock(grid, i, ev));
        }

        body.replaceChildren(grid);
    }

    // 요일×시간(1시간 단위) 빈 칸: 클릭하면 해당 날짜·시간으로 개인 일정 다이얼로그를 연다.
    function appendHourCell(grid, dayIndex, hour, iso) {
        const rowStart = (hour - GRID_START_HOUR) * 2 + 2;
        const cell = document.createElement('button');
        cell.type = 'button';
        cell.className = 'week-grid__cell';
        cell.dataset.date = iso;
        cell.dataset.time = `${String(hour).padStart(2, '0')}:00`;
        cell.style.gridColumn = String(dayIndex + 2);
        cell.style.gridRow = `${rowStart} / span 2`;
        cell.setAttribute('aria-label', `${iso} ${hour}시, 개인 일정 추가`);
        grid.appendChild(cell);
    }

    // 12~13시(점심시간), 18~19시(저녁시간)를 수업이 있는 날의 해당 요일 칸에만 흰 배경 + 검은 테두리 띠로 표시
    function appendMealBand(grid, dayIndex, startHour, label) {
        const rowStart = (startHour - GRID_START_HOUR) * 2 + 2;
        const band = document.createElement('div');
        band.className = 'week-grid__mealtime';
        band.style.gridColumn = String(dayIndex + 2);
        band.style.gridRow = `${rowStart} / span 2`;
        band.setAttribute('aria-hidden', 'true');
        band.textContent = label;
        grid.appendChild(band);
    }

    // 30분 슬롯 인덱스 -> "HH:MM" (timeToSlot의 역연산, GRID_START_HOUR 기준)
    function slotToTime(slot) {
        const totalMinutes = slot * 30;
        const h = GRID_START_HOUR + Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }

    function appendClassBlock(grid, dayIndex, entry) {
        const holiday = SchedulerData.isHolidayEntry(entry);
        if (holiday) {
            appendClassSegment(grid, dayIndex, entry, 0, (GRID_END_HOUR - GRID_START_HOUR) * 2, true);
            return;
        }

        const hasTime = entry.startTime && entry.endTime;
        const startSlot = timeToSlot(hasTime ? entry.startTime : '09:00');
        const endSlot = timeToSlot(hasTime ? entry.endTime : '18:00');
        const lunchStart = timeToSlot('12:00');
        const lunchEnd = timeToSlot('13:00');

        // 점심시간(12~13시)을 가로지르는 수업은 기존 박스 스타일 그대로 09~12시 / 13~18시 두 박스로 분리
        if (startSlot < lunchStart && endSlot > lunchEnd) {
            appendClassSegment(grid, dayIndex, entry, startSlot, lunchStart, false);
            appendClassSegment(grid, dayIndex, entry, lunchEnd, endSlot, false);
        } else {
            appendClassSegment(grid, dayIndex, entry, startSlot, endSlot, false);
        }
    }

    function appendClassSegment(grid, dayIndex, entry, startSlot, endSlot, holiday) {
        const rowStart = startSlot + 2;
        const span = Math.max(1, endSlot - startSlot);
        const teacher = teacherOf(entry);
        const timeLabel = holiday ? '' : `${slotToTime(startSlot)}~${slotToTime(endSlot)}`;

        const block = document.createElement('div');
        block.className = 'time-block' + (holiday ? ' time-block--holiday' : '');
        block.setAttribute('role', 'gridcell');
        block.style.gridColumn = String(dayIndex + 2);
        block.style.gridRow = `${rowStart} / span ${span}`;
        block.innerHTML = `
            ${timeLabel ? `<span class="time-block__time">${timeLabel}</span>` : ''}
            <span class="time-block__content">${escapeHtml(entry.content)}</span>
            ${teacher ? `<span class="time-block__teacher">${escapeHtml(teacher)}</span>` : ''}`;
        grid.appendChild(block);
    }

    function appendEventBlock(grid, dayIndex, ev) {
        // 시간 있는 일정은 해당 슬롯, 없는 일정은 그리드 최상단에 고정.
        const maxSlot = (GRID_END_HOUR - GRID_START_HOUR) * 2 - 1;
        const slot = ev.time ? clamp(timeToSlot(ev.time), 0, maxSlot) : 0;
        const block = document.createElement('button');
        block.type = 'button';
        block.className = 'time-block time-block--event';
        block.dataset.eventId = ev.id;
        block.dataset.date = ev.date;
        block.style.gridColumn = String(dayIndex + 2);
        block.style.gridRow = `${slot + 2} / span 2`;
        block.setAttribute('aria-label', `개인 일정: ${ev.title}${ev.time ? ` ${ev.time}` : ''}, 클릭하여 관리`);
        block.innerHTML = `
            ${ev.time ? `<span class="time-block__time">${escapeHtml(ev.time)}</span>` : ''}
            <span class="time-block__content">📌 ${escapeHtml(ev.title)}</span>`;
        grid.appendChild(block);
    }

    // ---------- 캘린더: 월별 ----------

    function renderMonthly() {
        const body = document.getElementById('calendar-body');
        const year = state.cursor.getFullYear();
        const month0 = state.cursor.getMonth();
        updateRangeLabel(`${year}년 ${month0 + 1}월`);

        const weeks = CalendarUtils.buildMonthMatrix(year, month0);

        const thead = `<thead><tr>${DAY_NAMES.map((d, i) =>
            `<th scope="col" class="${i === 0 ? 'cal-head--sun' : i === 6 ? 'cal-head--sat' : ''}">${d}</th>`
        ).join('')}</tr></thead>`;

        const tbody = '<tbody>' + weeks.map((week) => '<tr>' + week.map((cell, col) => {
            if (!cell) return `<td class="pad" aria-hidden="true"></td>`;

            const iso = cell.iso;
            const dayNum = cell.date.getDate();
            const isToday = iso === state.todayISO;
            const wkClass = col === 0 ? 'cal-cell--sun' : col === 6 ? 'cal-cell--sat' : '';
            const entry = state.classMap[iso];
            const events = state.eventsMap[iso] || [];

            let chips = '';
            if (entry) {
                const chipClass = SchedulerData.isHolidayEntry(entry) ? 'cal-day-chip cal-day-chip--holiday' : 'cal-day-chip';
                chips += `<span class="${chipClass}">${escapeHtml(entry.content)}</span>`;
            }
            events.forEach((ev) => {
                chips += `<span class="cal-day-chip cal-day-chip--event">📌 ${escapeHtml(ev.title)}</span>`;
            });

            return `<td class="${wkClass}">
                <button type="button" class="cal-day-cell${isToday ? ' cal-day-cell--today' : ''}" data-date="${iso}"
                        aria-label="${iso} 개인 일정 추가${entry ? `, 수업: ${escapeHtml(entry.content)}` : ''}">
                    <span class="cal-day-num">${dayNum}</span>
                    ${chips}
                </button>
            </td>`;
        }).join('') + '</tr>').join('') + '</tbody>';

        const table = document.createElement('table');
        table.className = 'scheduler-month-table';
        table.setAttribute('aria-label', `${year}년 ${month0 + 1}월 캘린더`);
        table.innerHTML = thead + tbody;

        body.replaceChildren(table);
    }

    function renderCalendar() {
        if (state.viewMode === 'weekly') renderWeekly();
        else renderMonthly();
    }

    // ---------- 개인 일정 다이얼로그 ----------

    function openEventDialog(iso, prefillTime) {
        state.dialogDate = iso;
        const d = CalendarUtils.parseISODate(iso);
        document.getElementById('event-dialog-date').textContent =
            `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${DAY_NAMES[d.getDay()]})`;
        document.getElementById('event-title').value = '';
        document.getElementById('event-time').value = prefillTime || '';
        renderEventList(iso);
        document.getElementById('event-dialog').showModal();
        document.getElementById('event-title').focus();
    }


    function renderEventList(iso) {
        const ul = document.getElementById('event-list');
        const events = SchedulerData.getEvents()
            .filter((e) => e.date === iso)
            .sort((a, b) => (a.time || '').localeCompare(b.time || ''));

        if (!events.length) {
            ul.innerHTML = `<li class="event-list__empty">등록된 개인 일정이 없어요.</li>`;
            return;
        }

        ul.innerHTML = events.map((ev) => `
            <li class="event-list__item">
                <span>${ev.time ? `<strong>${escapeHtml(ev.time)}</strong> ` : ''}${escapeHtml(ev.title)}</span>
                <button type="button" class="event-delete-btn" data-event-id="${ev.id}" aria-label="일정 삭제">삭제</button>
            </li>`).join('');
    }

    // ---------- 뷰 전환 ----------

    function setView(mode) {
        state.viewMode = mode;
        SchedulerData.setView(mode);
        document.getElementById('view-weekly').setAttribute('aria-pressed', String(mode === 'weekly'));
        document.getElementById('view-monthly').setAttribute('aria-pressed', String(mode === 'monthly'));
        renderCalendar();
    }

    function moveCursor(delta) {
        if (state.viewMode === 'weekly') {
            state.cursor = CalendarUtils.addDays(state.cursor, delta * 7);
        } else {
            state.cursor = new Date(state.cursor.getFullYear(), state.cursor.getMonth() + delta, 1);
        }
        renderCalendar();
    }

    // ---------- 이벤트 바인딩 ----------

    function bindEvents() {
        document.getElementById('view-weekly').addEventListener('click', () => setView('weekly'));
        document.getElementById('view-monthly').addEventListener('click', () => setView('monthly'));
        document.getElementById('cal-prev').addEventListener('click', () => moveCursor(-1));
        document.getElementById('cal-next').addEventListener('click', () => moveCursor(1));

        // 예·복습 메모 저장 (입력 즉시)
        document.getElementById('plan-editor').addEventListener('input', handlePlanInput);

        // Todo 추가/체크/삭제
        document.getElementById('todo-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const input = document.getElementById('todo-input');
            const text = input.value.trim();
            if (!text) return;
            addTodo(text);
            input.value = '';
            input.focus();
        });
        document.getElementById('todo-list').addEventListener('change', (e) => {
            const cb = e.target.closest('input[type="checkbox"]');
            if (cb) toggleTodo(cb.dataset.id);
        });
        document.getElementById('todo-list').addEventListener('click', (e) => {
            const btn = e.target.closest('.todo-delete');
            if (btn) deleteTodo(btn.dataset.id);
        });

        // 캘린더 클릭 → 개인 일정 다이얼로그
        document.getElementById('calendar-body').addEventListener('click', (e) => {
            const eventBlock = e.target.closest('.time-block--event');
            if (eventBlock) { openEventDialog(eventBlock.dataset.date); return; }
            const dayHeader = e.target.closest('.week-grid__day-header--btn');
            if (dayHeader) { openEventDialog(dayHeader.dataset.date); return; }
            const dayCell = e.target.closest('.cal-day-cell');
            if (dayCell) { openEventDialog(dayCell.dataset.date); return; }
            const hourCell = e.target.closest('.week-grid__cell');
            if (hourCell) { openEventDialog(hourCell.dataset.date, hourCell.dataset.time); }
        });

        // 다이얼로그: 추가 / 삭제 / 닫기
        const dialog = document.getElementById('event-dialog');
        document.getElementById('event-form').addEventListener('submit', (e) => {
            e.preventDefault(); // method="dialog" 자동 닫힘 방지 (추가 후 목록 유지)
            const title = document.getElementById('event-title').value.trim();
            if (!title) return;
            const time = document.getElementById('event-time').value;
            SchedulerData.addEvent({ id: genId(), date: state.dialogDate, time: time || '', title: title });
            document.getElementById('event-title').value = '';
            document.getElementById('event-time').value = '';
            rebuildEventsMap();
            renderEventList(state.dialogDate);
            renderCalendar();
        });
        document.getElementById('event-list').addEventListener('click', (e) => {
            const btn = e.target.closest('.event-delete-btn');
            if (!btn) return;
            SchedulerData.removeEvent(btn.dataset.eventId);
            rebuildEventsMap();
            renderEventList(state.dialogDate);
            renderCalendar();
        });
        dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
        dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
    }

    // ---------- 초기화 ----------

    async function init() {
        state.today = stripTime(new Date());
        state.todayISO = CalendarUtils.formatISODate(state.today);
        state.cursor = new Date(state.today);
        state.viewMode = SchedulerData.getView();

        document.getElementById('calendar-today').textContent = `오늘 · ${todayLabelText()}`;

        try {
            const schedule = await SchedulerData.loadSchedule();
            state.schedule = schedule;
            state.classMap = SchedulerData.buildClassMap(schedule);
            state.flatClasses = SchedulerData.flattenClasses(schedule);
        } catch (error) {
            console.error('수업 데이터를 불러오지 못했습니다:', error);
            document.getElementById('schedule-error').hidden = false;
        }

        rebuildEventsMap();
        bindEvents();

        // 초기 렌더 (setView 가 renderCalendar 호출)
        setView(state.viewMode);
        renderTodayTimeline();
        renderPlanEditor();
        renderTodos();
        renderUpcoming();
    }

    window.addEventListener('DOMContentLoaded', init);
})();
