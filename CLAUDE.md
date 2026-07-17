# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

SKALA 프론트엔드 실습 프로젝트(v2). 순수 바닐라 HTML/CSS/JS로만 구현하는 개인 포트폴리오형 정적 사이트입니다.
**라이브러리·프레임워크(React, Vue, jQuery, Bootstrap 등)를 사용하지 않습니다.** npm 패키지, 번들러(Webpack/Vite), 트랜스파일러도 없습니다 — `package.json` 자체가 존재하지 않습니다.

## 실행 방법

빌드/린트/테스트 스크립트가 없습니다. 정적 파일을 브라우저로 직접 열거나 로컬 서버로 서빙하면 됩니다.

- `html/*.html` 파일을 그냥 더블클릭(`file://`)해서 열면 `fetch()`가 CORS 정책에 막혀 `schedule.json`을 못 불러옵니다.
- 따라서 **VS Code의 Live Server 확장 등으로 로컬 서버를 띄워서 확인**하는 것이 정석입니다. (`script/monthlyView.js`, `script/weekView.js`에 `file://`로 열었을 때를 대비한 CORS 실패 안내 문구가 들어있음)

## 디렉터리 구조

```
html/     - 각 페이지 (index.html이 메인 허브)
css/      - 스타일시트 (variables.css / style.css / components.css / layout.css / nav.css)
script/   - 바닐라 JS (nav.js, footer.js, calendarUtils.js, weekView.js, monthlyView.js, sidebarDate.js, upDown.js, grade.js, bag.js, weatherAPI.js, statusBarTicker.js, realtimeInfo.js)
media/    - 이미지/영상/오디오 리소스
docs/     - 기획 문서 (plan.md, 이미 대부분 구현된 초기 기획안 — 현재 구조와 세부적으로 다를 수 있음)
schedule.json - 강의 시간표 데이터 (루트에 위치)
```

`docs/plan.md`는 프로젝트 초기 기획서라 현재 구조(캘린더 3분리, 사이드바 레이아웃 등)를 반영하지 못한 부분이 있습니다. 저장소 루트에 `SIDEBAR_LAYOUT_PLAN.md`처럼 특정 기능 구현을 위해 임시로 추가된 계획 문서가 있을 수 있으니, 새 작업을 시작하기 전 루트 디렉터리도 함께 확인하세요.

## 아키텍처 및 핵심 개념

### 페이지 구성 (`docs/plan.md` 기준 기획, 이후 캘린더는 3페이지 분리로 변경됨)

`index.html`을 메인 허브로 하여 5개 카테고리로 연결되는 구조를 목표로 합니다:
- 프로필 소개 → `myProfile.html`
- 라이프 캘린더 → 애초 계획은 `myClass.html` + `myHoliday.html`을 `myCalendar.html`로 통합하는 것이었으나, 이후 **주별(`myClass.html`) / 월별(`myMonthlyClass.html`) / 휴일(`myHoliday.html`) 3개 페이지로 다시 분리**하는 방향으로 결정됨. `myCalendar.html`은 삭제되었고, nav의 "Calendar" 링크는 `myClass.html`(주별 뷰)을 가리킴. `myClass.html`은 `?date=YYYY-MM-DD` 쿼리 파라미터로 조회 기준일을 받고 `myMonthlyClass.html`의 날짜 클릭 시 이 파라미터를 붙여 이동시킴. 세 페이지는 좌측 사이드바 + 우측 메인 콘텐츠의 대시보드 레이아웃을 공유함(아래 "캘린더 사이드바 대시보드 레이아웃" 절 참고).
- 여행 기록 → `myTrip.html`
- JS 플레이그라운드(미니게임 3종: 업다운 숫자 맞추기 / 성적 계산기 / 내 가방 보기) → `html/jsPlayground.html`. 각 게임은 `<dialog>`로 열리며 `script/upDown.js`, `script/grade.js`, `script/bag.js`가 각각 담당. 날씨(도시 선택) 기능은 계획 당시엔 플레이그라운드 4번째 섹션으로 구상됐으나 실제로는 `index.html`의 별도 다이얼로그(`#weather-dialog`, `script/weatherAPI.js` + `script/realtimeInfo.js`)로 구현됨.
- 멤버십 → `signUp.html` ↔ `signUpResult.html`

새 페이지를 만들거나 nav를 수정할 때는 각 HTML의 `<nav>`가 서로 다른 페이지 집합을 가리키고 있을 수 있으니(현재도 페이지마다 nav 링크가 조금씩 다름) 실제 존재하는 파일 기준으로 정합성을 맞춰야 합니다.

### CSS 디자인 시스템 (뉴브루탈리즘)

`css/variables.css`에 뉴브루탈리즘 스타일의 디자인 토큰이 CSS 커스텀 프로퍼티로 정의되어 있습니다 (`--color-*`, `--shadow-hard`, `--border-width`, `--radius-*`, `--space-*`, `--font-*`). 새 스타일을 추가할 때는 하드코딩된 색상/그림자 값 대신 이 변수를 재사용해야 합니다.

`css/components.css`는 `.brutal-box`, `.btn-pill`, `.nft-card` 같은 재사용 컴포넌트 클래스를 담는 곳이지만, 하단에 `.trip-grid-container`/`.trip-card`처럼 변수를 쓰지 않고 하드코딩된 값으로 작성된 부분도 섞여 있습니다 — 새로 작성할 때는 위쪽의 변수 기반 패턴을 따르는 것이 일관성 있습니다.

`css/layout.css`는 `.brutal-box`/`.btn-pill`/`.nft-card` 등 시그니처 스타일과 푸터 전체 레이아웃, 그리고 캘린더 사이드바 대시보드 레이아웃(`main.calendar-layout`, `.calendar-sidebar` 등, 아래 절 참고)을 담고 있습니다.

**주의:** HTML 파일마다 CSS 링크 경로가 일관되지 않습니다. `html/signUp.html`, `html/signUpResult.html`은 `../css/style.css`를 쓰는 반면 `html/myTrip.html`은 `css/style.css`(상위 이동 없음)를 쓰고, `html/index.html`은 아예 CSS/JS를 링크하지 않은 상태입니다. 페이지를 작업할 때 실제 링크 경로가 올바른지 반드시 확인하세요.

### 시간표 데이터 흐름 (`myClass.html` / `myMonthlyClass.html` + `script/*.js`)

- 데이터는 루트의 `schedule.json`에 월(`"7"`~`"12"`, 문자열 키, 2026년 고정) 단위로 저장되며, 각 항목은 `{date, day, week, content, teacher, startTime, endTime}` 형태입니다. `startTime`/`endTime`은 `"HH:MM"` 24시간제 문자열이며, 공휴일/휴강(`content`에 "연휴"/"대체휴일"/"자체휴강" 포함)은 `null`입니다.
- `script/calendarUtils.js`는 두 뷰가 공유하는 순수 날짜 계산 헬퍼(`window.CalendarUtils`)만 담당합니다 — 모듈 번들러가 없어 `<script>` 로드 순서로 의존성을 해결하므로, `calendarUtils.js`는 반드시 `weekView.js`/`monthlyView.js`보다 먼저 로드되어야 합니다.
- `script/weekView.js`(`myClass.html`용)는 `?date=` 쿼리 파라미터를 읽어 해당 날짜가 속한 월~토 주간을 계산하고, `.week-grid`에 CSS Grid 절대좌표로 시간대별 블록을 렌더링합니다. 이전/다음 주 버튼은 `location.href`를 갱신해 페이지를 다시 로드합니다(SPA 라우팅 없음).
- `script/monthlyView.js`(`myMonthlyClass.html`용, 구 `classScheduler.js`)는 `#sched_tbl`의 `<tbody>`를 `CalendarUtils.buildMonthMatrix()`로 매 렌더링마다 새로 채웁니다(5주/6주 가변). 날짜 셀 클릭 시 `myClass.html?date=YYYY-MM-DD`로 이동합니다. 데이터가 7~12월만 있어 이전/다음 달 버튼은 그 범위 밖에서 비활성화됩니다.
- 두 스크립트 모두 fetch 실패(주로 `file://`로 직접 열었을 때의 CORS 문제) 시 경고 메시지를 표시하는 폴백 로직이 포함되어 있습니다.

### 캘린더 사이드바 대시보드 레이아웃 (`myClass.html` / `myMonthlyClass.html` / `myHoliday.html`)

- 세 페이지 모두 전역 top nav(`#nav-placeholder`)는 `<header>`에 그대로 두고, `<main class="calendar-layout">` 안에 `<aside class="calendar-sidebar">`(오늘 날짜 + 세로 `.calendar-subnav`)와 기존 `<section>`(주간 그리드/월별 테이블/휴일 카드)을 2열 그리드로 배치합니다. CSS는 `css/layout.css` 끝부분의 `main.calendar-layout`/`.calendar-sidebar` 블록이 담당하며, 700px 이하에서는 1열로 스택되고 subnav가 다시 가로 배치로 돌아갑니다.
- 사이드바 상단의 "오늘 날짜"(`#sidebar-today-day`/`#sidebar-today-month`)는 `script/sidebarDate.js`가 `new Date()`로 렌더링합니다. 이 스크립트는 `calendarUtils.js`나 다른 뷰 스크립트에 의존하지 않는 독립 모듈이라 `calendarUtils.js`가 로드되지 않는 `myHoliday.html`에서도 그대로 동작합니다. 세 페이지 모두 뷰 스크립트(`weekView.js`/`monthlyView.js`) 다음, `nav.js`/`footer.js` 이전에 로드합니다.
- `.calendar-subnav`(주별/월별/휴일 전환)는 클래스명이나 `[aria-current="page"]` 강조 규칙을 그대로 유지한 채 사이드바 안으로 옮겨졌을 뿐이라, 새 페이지를 이 레이아웃에 편입시킬 때는 사이드바 마크업 블록을 그대로 복사하고 해당 링크에만 `aria-current="page"`를 주면 됩니다.

## 작업 시 유의사항

- 접근성 속성(`aria-label`, `aria-labelledby`, `scope` 등)이 이미 각 페이지에 꼼꼼히 들어가 있으므로, 마크업 추가/수정 시 이 패턴을 유지하세요.
- 시맨틱 HTML 과제 성격이 강한 프로젝트로, `<table>`/`rowspan`/`colspan`, `<dl>`/`<dt>`/`<dd>`, `<fieldset>`/`<legend>`, `<audio>`/`<video>` 등 특정 태그 사용이 페이지별로 의도적으로 요구됩니다(`docs/plan.md` 참고).
