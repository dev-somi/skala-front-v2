# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

SKALA 프론트엔드 실습 프로젝트(v2). 순수 바닐라 HTML/CSS/JS로만 구현하는 개인 포트폴리오형 정적 사이트입니다.
**라이브러리·프레임워크(React, Vue, jQuery, Bootstrap 등)를 사용하지 않습니다.** npm 패키지, 번들러(Webpack/Vite), 트랜스파일러도 없습니다 — `package.json` 자체가 존재하지 않습니다.

## 실행 방법

빌드/린트/테스트 스크립트가 없습니다. 정적 파일을 브라우저로 직접 열거나 로컬 서버로 서빙하면 됩니다.

- `html/*.html` 파일을 그냥 더블클릭(`file://`)해서 열면 `fetch()`가 CORS 정책에 막혀 `schedule.json`을 못 불러옵니다.
- 따라서 **VS Code의 Live Server 확장 등으로 로컬 서버를 띄워서 확인**하는 것이 정석입니다. (`script/classScheduler.js`에 `file://`로 열었을 때를 대비한 하드코딩 폴백 데이터가 들어있음)

## 디렉터리 구조

```
html/     - 각 페이지 (index.html이 메인 허브)
css/      - 스타일시트 (variables.css / style.css / components.css / layout.css)
script/   - 바닐라 JS (현재 classScheduler.js 하나)
media/    - 이미지/영상/오디오 리소스
docs/     - 기획 문서 (plan.md)
schedule.json - 강의 시간표 데이터 (루트에 위치)
```

## 아키텍처 및 핵심 개념

### 페이지 구성 (`docs/plan.md` 기준 기획)

`index.html`을 메인 허브로 하여 5개 카테고리로 연결되는 구조를 목표로 합니다:
- 프로필 소개 → `myProfile.html`
- 라이프 캘린더 → `myClass.html` + `myHoliday.html`을 `myCalendar.html`로 통합 예정 (아직 미완료 — nav 링크는 이미 `myCalendar.html`을 가리키지만 실제 파일은 없음)
- 여행 기록 → `myTrip.html`
- JS 플레이그라운드(미니게임 4종 통합) → `playground.html` (아직 파일 없음, nav에만 링크 존재)
- 멤버십 → `signUp.html` ↔ `signUpResult.html`

새 페이지를 만들거나 nav를 수정할 때는 각 HTML의 `<nav>`가 서로 다른 페이지 집합을 가리키고 있을 수 있으니(현재도 페이지마다 nav 링크가 조금씩 다름) 실제 존재하는 파일 기준으로 정합성을 맞춰야 합니다.

### CSS 디자인 시스템 (뉴브루탈리즘)

`css/variables.css`에 뉴브루탈리즘 스타일의 디자인 토큰이 CSS 커스텀 프로퍼티로 정의되어 있습니다 (`--color-*`, `--shadow-hard`, `--border-width`, `--radius-*`, `--space-*`, `--font-*`). 새 스타일을 추가할 때는 하드코딩된 색상/그림자 값 대신 이 변수를 재사용해야 합니다.

`css/components.css`는 `.brutal-box`, `.btn-pill`, `.nft-card` 같은 재사용 컴포넌트 클래스를 담는 곳이지만, 하단에 `.trip-grid-container`/`.trip-card`처럼 변수를 쓰지 않고 하드코딩된 값으로 작성된 부분도 섞여 있습니다 — 새로 작성할 때는 위쪽의 변수 기반 패턴을 따르는 것이 일관성 있습니다.

`css/layout.css`는 현재 비어있는 스캐폴드 파일입니다.

**주의:** HTML 파일마다 CSS 링크 경로가 일관되지 않습니다. `html/signUp.html`, `html/signUpResult.html`은 `../css/style.css`를 쓰는 반면 `html/myTrip.html`은 `css/style.css`(상위 이동 없음)를 쓰고, `html/index.html`은 아예 CSS/JS를 링크하지 않은 상태입니다. 페이지를 작업할 때 실제 링크 경로가 올바른지 반드시 확인하세요.

### 시간표 데이터 흐름 (`myClass.html` + `script/classScheduler.js`)

- 데이터는 루트의 `schedule.json`에 월(`"7"`~`"12"`, 문자열 키) 단위로 저장되며, 각 항목은 `{date, day, week, content, teacher}` 형태입니다.
- `script/classScheduler.js`가 `fetch('schedule.json')`으로 데이터를 읽어 `#schedule-tbody`에 동적으로 `<tr>`를 렌더링합니다.
- `.month-btn[data-month]` 버튼 클릭 시 해당 월 데이터로 다시 렌더링됩니다.
- `content`에 "연휴"/"대체휴일"/"자체휴강"이 포함되면 `colspan`으로 셀을 병합해 공휴일처럼 표시하는 특수 처리가 있습니다.
- fetch 실패(주로 `file://`로 직접 열었을 때의 CORS 문제) 시 하드코딩된 백업 데이터를 화면에 표시하는 폴백 로직이 포함되어 있습니다.

## 작업 시 유의사항

- 접근성 속성(`aria-label`, `aria-labelledby`, `scope` 등)이 이미 각 페이지에 꼼꼼히 들어가 있으므로, 마크업 추가/수정 시 이 패턴을 유지하세요.
- 시맨틱 HTML 과제 성격이 강한 프로젝트로, `<table>`/`rowspan`/`colspan`, `<dl>`/`<dt>`/`<dd>`, `<fieldset>`/`<legend>`, `<audio>`/`<video>` 등 특정 태그 사용이 페이지별로 의도적으로 요구됩니다(`docs/plan.md` 참고).
