export const CITY_LIST = [
    { name: "서울특별시", lat: 37.5665, lon: 126.9780 },
    { name: "부산광역시", lat: 35.1796, lon: 129.0756 },
    { name: "인천광역시", lat: 37.4563, lon: 126.7052 },
    { name: "대구광역시", lat: 35.8714, lon: 128.6014 },
    { name: "대전광역시", lat: 36.3504, lon: 127.3845 },
    { name: "광주광역시", lat: 35.1595, lon: 126.8526 },
    { name: "울산광역시", lat: 35.5384, lon: 129.3114 },
    { name: "제주특별자치도", lat: 33.4996, lon: 126.5312 },
    { name: "세종특별자치시", lat: 36.4800, lon: 127.2890 },
    { name: "경기도(수원시)", lat: 37.2636, lon: 127.0286 },
    { name: "강원특별자치도(춘천시)", lat: 37.8813, lon: 127.7298 },
    { name: "충청북도(청주시)", lat: 36.6424, lon: 127.4890 },
    { name: "충청남도(천안시)", lat: 36.8151, lon: 127.1139 },
    { name: "전북특별자치도(전주시)", lat: 35.8242, lon: 127.1480 },
    { name: "전라남도(목포시)", lat: 34.8118, lon: 126.3922 },
    { name: "경상북도(포항시)", lat: 36.0190, lon: 129.3435 },
    { name: "경상남도(창원시)", lat: 35.2281, lon: 128.6811 }
];

export async function fetchWeatherData(lat, lon) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,is_day,wind_speed_10m`;

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP 에러 발생! 상태코드: ${response.status}`);
    }

    const data = await response.json();
    return data.current;
}

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
