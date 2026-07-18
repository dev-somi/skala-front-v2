import {fetchWeatherData, getWeatherStatus, CITY_LIST} from './weatherAPI.js';

const trigger = document.getElementById('weather-trigger');
const dialog = document.getElementById('weather-dialog');
const closeBtn = dialog.querySelector('.dialog-close');
const citySelect = document.getElementById('weather-city-select');
const weatherBoxEl = document.getElementById('weather-box');

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

    weatherBoxEl.innerHTML = '<p>로딩 중… ⏳</p>';

    try {
        const weather = await fetchWeatherData(city.lat, city.lon);
        const status = getWeatherStatus(weather.weather_code);
        const dayNightEmoji = weather.is_day === 1 ? '☀️' : '🌙';
        const lat = city.lat.toFixed(2);
        const lon = city.lon.toFixed(2);

        weatherBoxEl.innerHTML = `
            <h3>${dayNightEmoji} ${city.name} 실시간 날씨</h3>
            <p>🌐 위도: ${lat} / 경도: ${lon}</p>
            <p>상태: ${status.emoji} <strong>${status.text}</strong></p>
            <p>🌡️ 기온: <strong>${weather.temperature_2m}°C</strong></p>
            <p>💧 습도: <strong>${weather.relative_humidity_2m}%</strong></p>
            <p>💨 풍속: <strong>${weather.wind_speed_10m} km/h</strong></p>
        `;

        window.StatusBarTicker.updateText(`📅 오늘 날짜: ${todayText}  |  📍 현재 위치: ${city.name} (위도 ${lat}, 경도 ${lon})  |  ${status.emoji} 날씨: ${status.text} (🌡️ ${weather.temperature_2m}°C / 💧 ${weather.relative_humidity_2m}% / 💨 ${weather.wind_speed_10m} km/h)`);
        window.StatusBarTicker.flash();
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
    window.StatusBarTicker.flash();
});

dialog.addEventListener('click', (event) => {
    if (event.target === dialog) {
        dialog.close();
        window.StatusBarTicker.flash();
    }
});

populateCitySelect();

function initWithSeoulFallback() {
    const DEFAULT_CITY_INDEX = 0;
    citySelect.value = String(DEFAULT_CITY_INDEX);
    updateCityWeather(CITY_LIST[DEFAULT_CITY_INDEX]);
}

// CITY_LIST 중 최단 거리 도시를 찾는 용도라 Haversine 없이 단순 유클리드 거리로도 충분하다
function getSquaredDistance(lat1, lon1, lat2, lon2) {
    return (lat1 - lat2) ** 2 + (lon1 - lon2) ** 2;
}

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

function initWithGeolocation() {
    if (!navigator.geolocation) {
        initWithSeoulFallback();
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const {latitude, longitude} = position.coords;
            const nearestIndex = findNearestCityIndex(latitude, longitude);
            citySelect.value = String(nearestIndex);
            updateCityWeather(CITY_LIST[nearestIndex]);
        },
        (error) => {
            console.error('위치 정보 가져오기 실패:', error.message);
            initWithSeoulFallback();
        },
        {enableHighAccuracy: true, timeout: 10000}
    );
}

initWithGeolocation();
