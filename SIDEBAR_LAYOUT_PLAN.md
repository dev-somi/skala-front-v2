# 캘린더 페이지 사이드바 대시보드 레이아웃 개편

## Context

현재 세 캘린더 페이지(주별 `myClass.html`, 월별 `myMonthlyClass.html`, 휴일 `myHoliday.html`)는 상단에 전역 nav + 가로형 `.calendar-subnav`(주별/월별/휴일 전환 버튼)를 두고, 그 아래 `<main>`에 콘텐츠를 세로로 쌓는 구조다.

레퍼런스 캘린더 대시보드 UI(왼쪽 둥근 카드 사이드바 + 오른쪽 가변폭 메인)처럼 개편하려 한다. 사용자와 합의된 방향:
- **3개 캘린더 페이지 모두** 동일한 사이드바 레이아웃 적용
- **전역 top nav(`#nav-placeholder`)는 페이지 최상단에 기존 그대로 유지** — `script/nav.js` / `html/partials/nav.html` / `css/nav.css` 는 손대지 않는다
- 기존 `.calendar-subnav`(주별/월별/휴일)를 **왼쪽 사이드바 안으로 옮겨 세로 메뉴로 재배치**, 활성 상태는 기존 `[aria-current="page"]` 노랑 하이라이트 규칙 그대로 재사용
- 사이드바 상단에 **실제 오늘 날짜**(큰 일(日) 숫자 + "July 2026" 형태 월·연도)를 JS(`new Date()`)로 표시
- 색/그림자/여백은 전부 `css/variables.css`의 기존 뉴브루탈리즘 토큰 재사용, 하드코딩 색상 금지

기대 결과: 세 페이지가 좌측 고정폭 사이드바 + 우측 가변폭 콘텐츠의 대시보드 형태로 통일되고, 주간 그리드/월별 테이블/휴일 카드는 시각적 재설계 없이 넓어진 컬럼에 자연스럽게 리플로우된다.

## 변경 대상 파일

- `html/myClass.html`, `html/myMonthlyClass.html`, `html/myHoliday.html` — 마크업 재구성
- `css/layout.css` — 사이드바 레이아웃 CSS 신규 추가(파일 끝, 100번째 줄 이후)
- `css/style.css` — 휴일 페이지 본문 가독성용 소규모 규칙 1개
- `script/sidebarDate.js` — **신규 파일**(오늘 날짜 렌더링)

> 손대지 않음: `script/nav.js`, `html/partials/nav.html`, `css/nav.css`, `script/weekView.js`, `script/monthlyView.js`, `css/components.css`. (components.css/layout.css의 기존 `.btn-pill`/`.brutal-box` 중복은 이번 범위 밖 — 신규 선택자를 충분히 스코프해 충돌 회피)

## 1. HTML 재구성 (세 페이지 공통 패턴)

`<header>`에서 `.calendar-subnav`를 제거하고 `#nav-placeholder`만 남긴다. `<main>` → `<main class="calendar-layout">`로 바꾸고, 그 첫 자식으로 `<aside class="calendar-sidebar">`(오늘 날짜 블록 + 세로 subnav)를 추가한 뒤, **기존 `<section>`은 그대로** 두 번째 자식으로 둔다(별도 래퍼 div 없음 — 2열 그리드는 `main.calendar-layout` 자체에 건다).

### `myClass.html` before → after (헤더/메인 부분)

```html
<header>
    <div id="nav-placeholder"></div>
</header>

<main class="calendar-layout">
    <aside class="calendar-sidebar" aria-label="캘린더 사이드바">
        <time class="sidebar-date" id="sidebar-date">
            <span class="sidebar-date__day" id="sidebar-today-day">16</span>
            <span class="sidebar-date__month" id="sidebar-today-month">July 2026</span>
        </time>
        <nav aria-label="캘린더 보기 전환" class="calendar-subnav">
            <a href="myClass.html" class="btn-pill" aria-current="page">📖 주별</a>
            <a href="myMonthlyClass.html" class="btn-pill">🗓️ 월별</a>
            <a href="myHoliday.html" class="btn-pill">🎉 휴일</a>
        </nav>
    </aside>

    <section id="week-section" aria-labelledby="week-title">
        <!-- 기존 내용 그대로 (h1, .week-nav, #week-grid) -->
    </section>
</main>
```

- `.calendar-subnav` 마크업(페이지별 `aria-current="page"` 위치 포함)은 클래스명 변경 없이 그대로 복사 — 기존 활성화 CSS가 무수정으로 동작.
- `<time>` + span 두 개는 시맨틱 목적(HTML 과제 성격) + `datetime` 속성 세팅 지점. 하드코딩된 "16"/"July 2026"은 초기 플레이스홀더이며 JS가 실제 값으로 덮어씀.
- `weekView.js`/`monthlyView.js`는 `#week-grid`/`#sched_tbl` 등 id로만 접근하고 `<main>`/`<section>`을 건드리지 않아 이 구조 변경에 영향 없음(확인 완료).

### `myMonthlyClass.html` / `myHoliday.html`
동일 패턴. 사이드바 블록은 그대로 복사하되 `aria-current="page"`를 각각 월별/휴일 링크에 둔다. 두 번째 자식 `<section>`(`#month-section` 테이블 / `#holiday-section` 3개 `.brutal-box`)은 내용 무수정.

## 2. CSS — `css/layout.css` 끝에 신규 블록 추가

```css
/* ===== 캘린더 사이드바 대시보드 레이아웃 (주별/월별/휴일 공용) ===== */
/* main.calendar-layout(0,1,1) 이 전역 `main,.container{max-width:860px}`(0,0,1) 를
   상세도로 이겨 !important 없이 덮어씀. (style.css의 main.home-main 과 동일 패턴) */
main.calendar-layout {
  max-width: 1200px;          /* .navbar 의 max-width 와 폭 정렬 */
  margin: 0 auto;
  padding: var(--space-lg) var(--space-md);
  display: grid;
  grid-template-columns: 260px 1fr;
  align-items: start;
  gap: var(--space-lg);
}

.calendar-sidebar {
  background: var(--color-white);
  border: var(--border-width) solid var(--color-border);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-hard-lg);
  padding: var(--space-lg) var(--space-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.sidebar-date { display: block; text-align: center; }
.sidebar-date__day {
  display: block;
  font-family: var(--font-heading);
  font-size: 4rem; font-weight: 800; line-height: 1;
  color: var(--color-text);
}
.sidebar-date__month {
  display: block; margin-top: var(--space-sm);
  font-family: var(--font-heading);
  font-size: 1.1rem; font-weight: 700;
  color: var(--color-text);
}

/* 사이드바 안에서만 subnav 를 세로 메뉴로. components.css 의 가로 기본형은 유지. */
.calendar-sidebar .calendar-subnav {
  flex-direction: column; flex-wrap: nowrap;
  justify-content: flex-start; padding: 0;
}
.calendar-sidebar .calendar-subnav .btn-pill {
  justify-content: flex-start; width: 100%;
}

@media (max-width: 700px) {           /* 프로젝트 표준 브레이크포인트 */
  main.calendar-layout { grid-template-columns: 1fr; }
  .calendar-sidebar .calendar-subnav {
    flex-direction: row; flex-wrap: wrap; justify-content: center;
  }
  .calendar-sidebar .calendar-subnav .btn-pill { width: auto; }
}
```

- `260px` 사이드바 폭 / `1200px` 캡은 레이아웃 치수(디자인 토큰 아님) — 기존 `.navbar max-width:1200px`, `.trip-grid-container` 등과 동일하게 하드코딩이 관례. 색/테두리/그림자/여백/반경은 전부 토큰 사용.
- 세로 메뉴 재배치를 `.calendar-sidebar .calendar-subnav`로 스코프해 `components.css` 원본과 기존 중복 `.btn-pill` 규칙을 건드리지 않음.
- (옵션) 월별 긴 테이블 스크롤 시 사이드바 고정을 원하면 `.calendar-sidebar`에 `position: sticky; top: var(--space-lg);` 추가 — 필수 아님.

## 3. CSS — `css/style.css` 휴일 페이지 가독성 (line 587 근처)

기존 `#holiday-section section { ... }`(line 588) **바로 앞**에 삽입:

```css
#holiday-section {
  max-width: 640px;   /* 넓어진 본문 컬럼에서 문단 텍스트가 과도하게 길어지지 않도록 */
}
```

`#week-section`/`#month-section`은 그리드/테이블이 넓은 폭의 이득을 보므로 캡 없이 유동 유지.

## 4. 신규 파일 — `script/sidebarDate.js`

기존 `nav.js`/`footer.js` 코드 스타일(최상위 const/function, `DOMContentLoaded`, 한글 주석, ES 모듈 아님) 따름. `calendarUtils.js`에 **의존하지 않음**(휴일 페이지는 calendarUtils 미로드).

```js
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
```

## 5. 스크립트 로드 순서

| 페이지 | 순서 |
|---|---|
| `myClass.html` | calendarUtils → weekView → **sidebarDate** → nav → footer |
| `myMonthlyClass.html` | calendarUtils → monthlyView → **sidebarDate** → nav → footer |
| `myHoliday.html` | **sidebarDate** → nav → footer |

`calendarUtils.js` → 뷰 스크립트 의존 순서는 그대로 유지. `sidebarDate.js`는 다른 스크립트와 순서 의존이 없어 뷰 스크립트 뒤에 배치.

## 6. 검증 방법

CLAUDE.md대로 `file://` 직접 열기는 `fetch()` CORS로 막히므로 **로컬 서버(VS Code Live Server 등)로 서빙**해 확인:

1. `myClass.html` — 좌측 사이드바 카드에 오늘 날짜(현재 기준 큰 "16" + "July 2026")가 뜨고, 그 아래 주별/월별/휴일 세로 메뉴에서 "주별"이 노랑 하이라이트. 우측에 주간 그리드가 넓어진 폭으로 정상 렌더링되고 이전/다음 주 이동 동작.
2. `myMonthlyClass.html` — 동일 사이드바, "월별" 하이라이트, 우측 월별 테이블 `width:100%` 리플로우 정상, 날짜 클릭 시 `myClass.html?date=` 이동 유지.
3. `myHoliday.html` — 동일 사이드바("휴일" 하이라이트), 우측 3개 `.brutal-box` 카드가 640px 캡 내에서 읽기 좋게 표시. (이 페이지가 calendarUtils 없이도 날짜 렌더링되는지 = sidebarDate 독립성 확인 지점)
4. 브라우저 폭을 700px 아래로 줄여 사이드바가 상단으로 스택되고 subnav가 가로 배치로 되돌아가는지 확인.
5. 콘솔에 에러 없는지, 전역 top nav(`#nav-placeholder`)와 footer가 세 페이지 모두 기존대로 정상 주입되는지 확인.
