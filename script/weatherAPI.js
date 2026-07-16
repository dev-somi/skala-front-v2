// 실시간 날씨 - 데이터 담당 모듈. fetch/매핑 함수만 export하고 DOM은 건드리지 않는다.

export const CITY_LIST = [
    { name: "서울특별시", lat: 37.5665, lon: 126.9780 },
    { name: "부산광역시", lat: 35.1796, lon: 129.0756 },
    { name: "인천광역시", lat: 37.4563, lon: 126.7052 },
    { name: "대구광역시", lat: 35.8714, lon: 128.6014 },
    { name: "대전광역시", lat: 36.3504, lon: 127.3845 },
    { name: "광주광역시", lat: 35.1595, lon: 126.8526 },
    { name: "울산광역시", lat: 35.5384, lon: 129.3114 },
    { name: "제주특별자치도", lat: 33.4996, lon: 126.5312 }
];

// 위/경도로 Open-Meteo 현재 날씨(기온/습도/날씨코드/낮밤/풍속)를 가져온다.
export async function fetchWeatherData(lat, lon) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,is_day,wind_speed_10m`;

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP 에러 발생! 상태코드: ${response.status}`);
    }

    const data = await response.json();
    return data.current;
}

// Open-Meteo의 weather_code를 사람이 읽을 텍스트/이모지로 변환한다.
export function getWeatherStatus(code) {
    const codeMap = {
        0: { text: "맑음", emoji: "☀️" },
        1: { text: "대체로 맑음", emoji: "🌤️" },
        2: { text: "구름 조금", emoji: "⛅" },
        3: { text: "흐림", emoji: "☁️" },
        45: { text: "안개", emoji: "🌫️" },
        48: { text: "착빙성 안개", emoji: "🌫️" },
        51: { text: "가벼운 이슬비", emoji: "🌧️" },
        53: { text: "이슬비", emoji: "🌧️" },
        55: { text: "강한 이슬비", emoji: "🌧️" },
        61: { text: "약한 비", emoji: "🌧️" },
        63: { text: "보통 비", emoji: "☔" },
        65: { text: "강한 비", emoji: "🌧️" },
        71: { text: "약한 눈", emoji: "❄️" },
        73: { text: "보통 눈", emoji: "❄️" },
        75: { text: "강한 눈", emoji: "☃️" },
        95: { text: "뇌우", emoji: "⚡" }
    };
    return codeMap[code] || { text: "알 수 없음", emoji: "🌡️" };
}
