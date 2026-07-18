// 실시간 날씨 - 화면 담당 모듈. weatherAPI.js에서 데이터를 받아와 다이얼로그/티커를 갱신한다.
import { fetchWeatherData, getWeatherStatus, CITY_LIST } from './weatherAPI.js';

const trigger = document.getElementById('weather-trigger');
const dialog = document.getElementById('weather-dialog');
const closeBtn = dialog.querySelector('.dialog-close');
const citySelect = document.getElementById('weather-city-select');
const weatherBoxEl = document.getElementById('weather-box');

const DIALOG_CLOSE_DELAY_MS = 600;
let closeTimeoutId = null;

// select 옵션을 도시 목록으로 채운다 (첫 옵션은 선택 안내용 placeholder)
function populateCitySelect() {
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = '도시를 선택하세요';
    placeholder.disabled = true;
    placeholder.selected = true;
    citySelect.appendChild(placeholder);

    CITY_LIST.forEach((city, index) => {
        const option = document.createElement('option');
        option.value = String(index);
        option.textContent = city.name;
        citySelect.appendChild(option);
    });
}

function formatKoreanDate(date) {
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
}

async function updateCityWeather(city) {
    const todayText = formatKoreanDate(new Date());

    // 이전 선택에서 예약된 "결과 확인 후 자동 닫기"가 남아있다면 취소한다
    if (closeTimeoutId !== null) {
        window.clearTimeout(closeTimeoutId);
        closeTimeoutId = null;
    }

    // 1. 로딩 상태 표시
    weatherBoxEl.innerHTML = '<p>로딩 중… ⏳</p>';

    try {
        // 2. 비동기 데이터 패치
        const weather = await fetchWeatherData(city.lat, city.lon);
        const status = getWeatherStatus(weather.weather_code);
        const dayNightEmoji = weather.is_day === 1 ? '☀️' : '🌙';
        const lat = city.lat.toFixed(2);
        const lon = city.lon.toFixed(2);

        // 3. 다이얼로그 안 상세 카드 렌더링
        weatherBoxEl.innerHTML = `
            <h3>${dayNightEmoji} ${city.name} 실시간 날씨</h3>
            <p>🌐 위도: ${lat} / 경도: ${lon}</p>
            <p>상태: ${status.emoji} <strong>${status.text}</strong></p>
            <p>🌡️ 기온: <strong>${weather.temperature_2m}°C</strong></p>
            <p>💧 습도: <strong>${weather.relative_humidity_2m}%</strong></p>
            <p>💨 풍속: <strong>${weather.wind_speed_10m} km/h</strong></p>
        `;

        // 4. 상태 표시바(티커) 갱신
        window.StatusBarTicker.updateText(`
            📅 오늘 날짜: ${todayText} 
            📍 현재 위치: ${city.name} (위도: ${lat}, 경도: ${lon}) 
            ${status.emoji} 날씨: ${status.text} (🌡️ 온도: ${weather.temperature_2m}°C  💧 습도: ${weather.relative_humidity_2m}%  💨 풍속: ${weather.wind_speed_10m} km/h)
        `);

        // 5. 결과를 잠깐 보여준 뒤 다이얼로그를 닫고, 티커에 플래시 효과를 준다
        closeTimeoutId = window.setTimeout(() => {
            dialog.close();
            window.StatusBarTicker.flash();
            closeTimeoutId = null;
        }, DIALOG_CLOSE_DELAY_MS);
    } catch (error) {
        console.error('날씨 정보를 불러오는 중 오류가 발생했습니다:', error);
        weatherBoxEl.innerHTML = '<p>⚠️ 날씨 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.</p>';
        window.StatusBarTicker.updateText(`📅 오늘 날짜: ${todayText}  📍 ${city.name} (날씨 로드 실패 ❌)`);
    }
}

citySelect.addEventListener('change', () => {
    if (citySelect.value === '') return;
    updateCityWeather(CITY_LIST[Number(citySelect.value)]);
});

trigger.addEventListener('click', () => {
    dialog.showModal();
});

closeBtn.addEventListener('click', () => {
    dialog.close();
});

dialog.addEventListener('click', (event) => {
    if (event.target === dialog) {
        dialog.close();
    }
});

populateCitySelect();

// 서울을 기본값으로 두고 날씨를 가져온다 (Geolocation 미지원/거부/실패 시 fallback으로도 사용)
function initWithSeoulFallback() {
    const DEFAULT_CITY_INDEX = 0; // CITY_LIST[0] === 서울특별시
    citySelect.value = String(DEFAULT_CITY_INDEX);
    updateCityWeather(CITY_LIST[DEFAULT_CITY_INDEX]);
}

// 두 좌표 사이의 대략적인 거리(단위 없는 상대값)를 구한다. CITY_LIST 중 최단 거리 도시를 찾는 용도라
// 정밀한 지구 곡률 계산(Haversine) 없이 단순 유클리드 거리로도 충분하다.
function getSquaredDistance(lat1, lon1, lat2, lon2) {
    return (lat1 - lat2) ** 2 + (lon1 - lon2) ** 2;
}

// 사용자 좌표와 가장 가까운 CITY_LIST 항목의 인덱스를 찾는다.
function findNearestCityIndex(lat, lon) {
    let nearestIndex = 0;
    let nearestDistance = Infinity;

    CITY_LIST.forEach((city, index) => {
        const distance = getSquaredDistance(lat, lon, city.lat, city.lon);
        if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestIndex = index;
        }
    });

    return nearestIndex;
}

// 페이지 진입 시 사용자의 실제 위치와 가장 가까운 CITY_LIST 도시로 매핑해 날씨를 가져오고,
// 위치 정보를 사용할 수 없으면 서울로 대체한다.
// (다이얼로그를 열지 않은 상태에서도 #weather-box/티커는 갱신 가능 - <dialog>는 open 여부와 무관하게 DOM에 존재함)
function initWithGeolocation() {
    if (!navigator.geolocation) {
        initWithSeoulFallback();
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            const nearestIndex = findNearestCityIndex(latitude, longitude);
            citySelect.value = String(nearestIndex);
            updateCityWeather(CITY_LIST[nearestIndex]);
        },
        (error) => {
            console.error('위치 정보 가져오기 실패:', error.message);
            initWithSeoulFallback();
        },
        { enableHighAccuracy: true, timeout: 10000 }
    );
}

initWithGeolocation();
