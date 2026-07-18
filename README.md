# Som's Universe — SKALA 프론트엔드 실습 (v2)

바닐라 HTML/CSS/JavaScript로만 구현한 개인 포트폴리오형 정적 사이트입니다.
React, Vue, jQuery, Bootstrap 같은 라이브러리·프레임워크나 번들러(Webpack/Vite)를 사용하지 않으며,
`package.json`도 존재하지 않습니다 — 브라우저가 이해하는 코드를 그대로 작성합니다.

## 실행 방법

이 프로젝트에는 빌드/린트/테스트 스크립트가 없습니다. 정적 파일을 로컬 서버로 서빙하기만 하면 됩니다.

### VS Code Live Server로 실행 (권장)

1. VS Code 확장 마켓에서 **Live Server** 확장을 설치합니다.
2. 프로젝트 루트 폴더를 VS Code로 엽니다.
3. `html/index.html` 파일을 열고, 에디터 우클릭 메뉴 또는 우측 하단 상태 바에서 **"Go Live"** 를 클릭합니다.
4. 브라우저가 자동으로 열리며 `http://127.0.0.1:5500/html/index.html` 형태의 주소로 사이트가 표시됩니다.

### 다른 로컬 서버로 실행

Node.js나 Python이 설치되어 있다면 아래처럼 실행해도 됩니다.

```bash
# Node.js (npx 사용)
npx serve .

# Python 3
python -m http.server 5500
```

이후 브라우저에서 `http://localhost:5500/html/index.html`로 접속합니다.

### ⚠️ 주의: `file://`로 직접 열지 마세요

`html/*.html` 파일을 더블클릭해서 `file://` 프로토콜로 열면, 브라우저의 CORS 정책 때문에
`fetch()`로 `schedule.json`이나 각종 HTML 조각(`partials/*.html`)을 불러오지 못해
캘린더/네비게이션/푸터 등 일부 기능이 정상 동작하지 않습니다. 반드시 로컬 서버를 통해 열어주세요.

## 주요 페이지

| 페이지 | 설명 |
| --- | --- |
| `html/index.html` | 메인 허브. 프로필/캘린더/여행/플레이그라운드/가입/날씨로 이동하는 진입점 |
| `html/myProfile.html` | 프로필 소개 |
| `html/scheduler.html` | 개인 스케줄러 (Weekly/Monthly 캘린더 + Todo + 예·복습, `localStorage`로 저장) |
| `html/myClass.html` / `html/myMonthlyClass.html` / `html/myHoliday.html` | 주별/월별/휴일 캘린더 (사이드바 대시보드 레이아웃 공유) |
| `html/myTrip.html` | 홋카이도 교환학생 여행 기록 (배경음악, 비디오, 눈 내리는 애니메이션) |
| `html/jsPlayground.html` | 미니게임 3종 (업다운 숫자 맞추기 / 성적 계산기 / 내 가방 보기) |
| `html/signUp.html` / `html/signUpResult.html` | 멤버십 가입 폼 |

## 디렉터리 구조

```
html/     - 각 페이지 (index.html이 메인 허브)
css/      - 스타일시트 (variables.css / style.css / components.css / layout.css / nav.css / scheduler.css)
script/   - 바닐라 JS
media/    - 이미지/영상/오디오 리소스
docs/     - 기획 문서
schedule.json - 강의 시간표 데이터 (2026년 7~12월)
```

자세한 아키텍처 설명은 [CLAUDE.md](CLAUDE.md)를 참고하세요.
