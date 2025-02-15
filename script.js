const apiKey = '9becd813530e5255af06da8b8fd5ff24'; // 請在此處替換成您的 OpenWeatherMap API 金鑰
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const weatherIcon = document.getElementById('weather-icon');
const temperature = document.getElementById('temp');
const humidity = document.getElementById('humidity');
const windSpeed = document.getElementById('wind-speed');
const description = document.querySelector('.description');
const city = document.querySelector('.city');

// 在文件開頭添加城市列表定義
const cities = [
    // 北部
    {name: '台北市', coords: [25.0330, 121.5654]},
    {name: '新北市', coords: [25.0169, 121.4627]},
    {name: '基隆市', coords: [25.1276, 121.7392]},
    {name: '桃園市', coords: [24.9936, 121.3010]},
    {name: '新竹市', coords: [24.8138, 120.9675]},
    {name: '新竹縣', coords: [24.8384, 121.0177]},
    {name: '宜蘭市', coords: [24.7571, 121.7532]},
    
    // 中部
    {name: '台中市', coords: [24.1477, 120.6736]},
    {name: '彰化市', coords: [24.0809, 120.5383]},
    {name: '南投市', coords: [23.9157, 120.6867]},
    {name: '雲林縣', coords: [23.7092, 120.4313]},
    
    // 南部
    {name: '嘉義市', coords: [23.4800, 120.4491]},
    {name: '台南市', coords: [22.9999, 120.2269]},
    {name: '高雄市', coords: [22.6273, 120.3014]},
    {name: '屏東市', coords: [22.6716, 120.4862]},
    
    // 東部
    {name: '台東市', coords: [22.7583, 121.1444]},
    {name: '花蓮市', coords: [23.9772, 121.6044]},
    
    // 離島
    {name: '金門縣', coords: [24.4498, 118.3767]},
    {name: '馬祖', coords: [26.1624, 119.9499]},
    {name: '澎湖縣', coords: [23.5711, 119.5793]},
    {name: '綠島', coords: [22.6612, 121.4766]},
    {name: '蘭嶼', coords: [22.0451, 121.5500]}
];

async function getWeather(cityName) {
    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${apiKey}&units=metric&lang=zh_tw`
        );
        const data = await response.json();

        if (response.ok) {
            updateWeatherUI(data);
            updateSunTimes(data);
            getForecast(cityName);
            getAirQuality(data.coord.lat, data.coord.lon);
            updateTsunamiInfo();
        } else {
            alert('找不到該城市的天氣資訊');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('獲取天氣資訊時發生錯誤');
    }
}

function updateWeatherUI(data) {
    // 更新城市名稱（如果是英文城市名，嘗試轉換為中文）
    city.textContent = data.name === 'Taipei' ? '台北市' : data.name;
    
    // 更新溫度（確保是整數）
    temperature.textContent = Math.round(data.main.temp);
    
    // 更新濕度
    humidity.textContent = `${Math.round(data.main.humidity)}%`;
    
    // 更新風速（轉換為 km/h 並四捨五入到一位小數）
    const windSpeedKmh = (data.wind.speed * 3.6).toFixed(1);
    windSpeed.textContent = `${windSpeedKmh} km/h`;
    
    // 更新天氣描述（確保使用中文描述）
    description.textContent = data.weather[0].description;
    
    // 更新天氣圖標（使用 2x 大小的圖標）
    weatherIcon.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
}

async function getForecast(cityName) {
    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?q=${cityName}&appid=${apiKey}&units=metric&lang=zh_tw`
        );
        const data = await response.json();

        if (response.ok) {
            updateForecastUI(data);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function updateForecastUI(data) {
    const forecastContainer = document.getElementById('forecast-container');
    forecastContainer.innerHTML = '';

    // 每24小時顯示一次預報
    for (let i = 0; i < data.list.length; i += 8) {
        const forecast = data.list[i];
        const date = new Date(forecast.dt * 1000);
        
        const forecastItem = document.createElement('div');
        forecastItem.className = 'forecast-item';
        forecastItem.innerHTML = `
            <div>${date.toLocaleDateString('zh-TW', {weekday: 'short'})}</div>
            <img src="http://openweathermap.org/img/wn/${forecast.weather[0].icon}.png" alt="天氣圖標">
            <div>${Math.round(forecast.main.temp)}°C</div>
        `;
        
        forecastContainer.appendChild(forecastItem);
    }
}

function updateSunTimes(data) {
    const sunrise = new Date(data.sys.sunrise * 1000);
    const sunset = new Date(data.sys.sunset * 1000);
    
    document.getElementById('sunrise').textContent = sunrise.toLocaleTimeString('zh-TW', {
        hour: '2-digit',
        minute: '2-digit'
    });
    document.getElementById('sunset').textContent = sunset.toLocaleTimeString('zh-TW', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

async function getAirQuality(lat, lon) {
    try {
        const response = await fetch('https://data.moenv.gov.tw/api/v2/aqx_p_432?api_key=9e565f9a-84dd-4e79-9097-d403cae1ea75&limit=1000&format=JSON');
        const data = await response.json();
        
        if (data.records && data.records.length > 0) {
            // 找到最近的測站
            const nearestStation = findNearestStation(data.records, lat, lon);
            
            if (nearestStation) {
                updateAirQualityUI(nearestStation);
            } else {
                updateAirQualityError('無法找到最近的測站');
            }
        } else {
            updateAirQualityError('無法獲取空氣品質數據');
        }
    } catch (error) {
        console.error('獲取空氣品質數據時發生錯誤:', error);
        updateAirQualityError('獲取數據時發生錯誤');
    }
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // 地球半徑（公里）
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

function findNearestStation(stations, targetLat, targetLon) {
    try {
        return stations.reduce((nearest, station) => {
            if (!station.latitude || !station.longitude) {
                return nearest;
            }

            const distance = calculateDistance(
                targetLat, 
                targetLon, 
                parseFloat(station.latitude), 
                parseFloat(station.longitude)
            );
            
            if (!nearest || distance < nearest.distance) {
                return { ...station, distance };
            }
            return nearest;
        }, null);
    } catch (error) {
        console.error('尋找最近測站時發生錯誤:', error);
        return null;
    }
}

function updateAirQualityError(message) {
    document.getElementById('aqi-value').textContent = '--';
    document.getElementById('aqi-status').textContent = message;
    document.getElementById('pm25').textContent = '-- µg/m³';
    document.getElementById('pm10').textContent = '-- µg/m³';
}

function updateAirQualityUI(data) {
    try {
        // 解析數據
        const aqi = parseInt(data.aqi) || '--';
        const pm25 = parseFloat(data['pm2.5']) || '--';
        const pm10 = parseFloat(data.pm10) || '--';

        // 更新 UI
        document.getElementById('aqi-value').textContent = aqi;
        document.getElementById('pm25').textContent = pm25 === '--' ? '-- µg/m³' : `${pm25} µg/m³`;
        document.getElementById('pm10').textContent = pm10 === '--' ? '-- µg/m³' : `${pm10} µg/m³`;

        // 更新測站名稱
        const aqiCard = document.querySelector('.aqi-card h3');
        aqiCard.textContent = `空氣品質 (${data.sitename})`;

        // 更新空氣品質狀態
        const aqiStatus = document.getElementById('aqi-status');
        aqiStatus.textContent = data.status;
        
        // 根據空氣品質狀態設置顏色
        const statusColors = {
            '良好': { color: '#009966', bg: 'rgba(0, 153, 102, 0.1)' },
            '普通': { color: '#ffde33', bg: 'rgba(255, 222, 51, 0.1)' },
            '對敏感族群不健康': { color: '#ff9933', bg: 'rgba(255, 153, 51, 0.1)' },
            '對所有族群不健康': { color: '#cc0033', bg: 'rgba(204, 0, 51, 0.1)' },
            '非常不健康': { color: '#660099', bg: 'rgba(102, 0, 153, 0.1)' },
            '危害': { color: '#7e0023', bg: 'rgba(126, 0, 35, 0.1)' }
        };

        const colorSet = statusColors[data.status] || { color: '#ffffff', bg: 'rgba(255, 255, 255, 0.1)' };
        aqiStatus.style.color = colorSet.color;
        aqiStatus.style.backgroundColor = colorSet.bg;

    } catch (error) {
        console.error('更新空氣品質 UI 時發生錯誤:', error);
        updateAirQualityError('更新數據時發生錯誤');
    }
}

searchBtn.addEventListener('click', () => {
    const cityName = searchInput.value.trim();
    if (cityName) {
        getWeather(cityName);
    }
});

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const cityName = searchInput.value.trim();
        if (cityName) {
            getWeather(cityName);
        }
    }
});

// 載入時顯示預設城市的天氣
getWeather('Taipei');

// 修改 updateMainContent 函數，移除收藏城市相關的 case
function updateMainContent(menuItem) {
    const mainContent = document.querySelector('.main-content');
    const gridContainer = document.querySelector('.grid-container');
    
    // 先清除主內容區域的所有自定義內容
    mainContent.innerHTML = '';
    
    switch(menuItem) {
        case 'home':
            // 重新顯示網格容器
            if (gridContainer) {
                gridContainer.style.display = 'grid';
                mainContent.appendChild(gridContainer);
            } else {
                // 如果網格容器不存在，重新載入頁面
                location.reload();
            }
            break;
            
        case 'map':
            if (gridContainer) {
                gridContainer.style.display = 'none';
            }
            const mapHTML = `
                <div class="map-container">
                    <h2>天氣地圖</h2>
                    <div id="weather-map" style="height: 500px; margin-top: 20px; border-radius: 12px;"></div>
                </div>
            `;
            mainContent.innerHTML = mapHTML;
            initWeatherMap();
            break;
            
        case 'settings':
            if (gridContainer) {
                gridContainer.style.display = 'none';
            }
            const settingsHTML = `
                <div class="settings-container">
                    <h2>設定</h2>
                    <div class="settings-list">
                        <div class="settings-group">
                            <h3>一般設定</h3>
                            <div class="settings-item">
                                <span>溫度單位</span>
                                <div class="settings-control">
                                    <select id="temp-unit" onchange="updateTempUnit(this.value)">
                                        <option value="celsius">攝氏 (°C)</option>
                                        <option value="fahrenheit">華氏 (°F)</option>
                                    </select>
                                </div>
                            </div>
                            <div class="settings-item">
                                <span>自動更新</span>
                                <div class="settings-control">
                                    <label class="switch">
                                        <input type="checkbox" id="auto-update" onchange="toggleAutoUpdate(this.checked)">
                                        <span class="slider"></span>
                                    </label>
                                    <button onclick="testAutoUpdate()" class="test-btn">測試更新</button>
                                </div>
                            </div>
                            <div class="settings-item">
                                <span>更新頻率</span>
                                <select id="update-interval" onchange="updateInterval(this.value)">
                                    <option value="300000">5 分鐘</option>
                                    <option value="600000">10 分鐘</option>
                                    <option value="1800000">30 分鐘</option>
                                    <option value="3600000">1 小時</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="settings-group">
                            <h3>通知設定</h3>
                            <div class="settings-item">
                                <span>地震通知</span>
                                <div class="settings-control">
                                    <label class="switch">
                                        <input type="checkbox" id="earthquake-notify" onchange="toggleNotification('earthquake', this.checked)">
                                        <span class="slider"></span>
                                    </label>
                                    <button onclick="testNotification('earthquake')" class="test-btn">測試通知</button>
                                </div>
                            </div>
                            <div class="settings-item">
                                <span>颱風通知</span>
                                <div class="settings-control">
                                    <label class="switch">
                                        <input type="checkbox" id="typhoon-notify" onchange="toggleNotification('typhoon', this.checked)">
                                        <span class="slider"></span>
                                    </label>
                                    <button onclick="testNotification('typhoon')" class="test-btn">測試通知</button>
                                </div>
                            </div>
                            <div class="settings-item">
                                <span>海嘯通知</span>
                                <div class="settings-control">
                                    <label class="switch">
                                        <input type="checkbox" id="tsunami-notify" onchange="toggleNotification('tsunami', this.checked)">
                                        <span class="slider"></span>
                                    </label>
                                    <button onclick="testNotification('tsunami')" class="test-btn">測試通知</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            mainContent.innerHTML = settingsHTML;
            loadSettings();
            break;
    }
}

// 新增設定相關函數
function loadSettings() {
    const settings = JSON.parse(localStorage.getItem('weatherSettings')) || {
        tempUnit: 'celsius',
        autoUpdate: false,
        updateInterval: '300000',
        notifications: {
            earthquake: false,
            typhoon: false,
            tsunami: false
        },
        mapStyle: 'standard'
    };
    
    // 載入所有設定值
    document.getElementById('temp-unit').value = settings.tempUnit;
    document.getElementById('auto-update').checked = settings.autoUpdate;
    document.getElementById('update-interval').value = settings.updateInterval;
    document.getElementById('earthquake-notify').checked = settings.notifications.earthquake;
    document.getElementById('typhoon-notify').checked = settings.notifications.typhoon;
    document.getElementById('tsunami-notify').checked = settings.notifications.tsunami;
    document.getElementById('default-map-style').value = settings.mapStyle;
}

function updateTempUnit(unit) {
    const settings = JSON.parse(localStorage.getItem('weatherSettings')) || {};
    settings.tempUnit = unit;
    localStorage.setItem('weatherSettings', JSON.stringify(settings));
    // 這裡可以添加更新溫度顯示的邏輯
}

function toggleAutoUpdate(enabled) {
    const settings = JSON.parse(localStorage.getItem('weatherSettings')) || {};
    settings.autoUpdate = enabled;
    localStorage.setItem('weatherSettings', JSON.stringify(settings));
    
    if (enabled) {
        // 啟動自動更新
        startAutoUpdate();
    } else {
        // 停止自動更新
        stopAutoUpdate();
    }
}

let autoUpdateInterval;

function startAutoUpdate() {
    const settings = JSON.parse(localStorage.getItem('weatherSettings')) || {};
    const interval = parseInt(settings.updateInterval) || 300000; // 預設 5 分鐘
    
    if (autoUpdateInterval) {
        clearInterval(autoUpdateInterval);
    }
    
    autoUpdateInterval = setInterval(() => {
        const cityName = document.querySelector('.city').textContent;
        getWeather(cityName);
        getTyphoonData();
        getEarthquakeData();
        updateTsunamiInfo();
    }, interval);
}

function stopAutoUpdate() {
    if (autoUpdateInterval) {
        clearInterval(autoUpdateInterval);
    }
}

function updateInterval(interval) {
    const settings = JSON.parse(localStorage.getItem('weatherSettings')) || {};
    settings.updateInterval = interval;
    localStorage.setItem('weatherSettings', JSON.stringify(settings));
    
    if (settings.autoUpdate) {
        stopAutoUpdate();
        startAutoUpdate();
    }
}

function toggleNotification(type, enabled) {
    const settings = JSON.parse(localStorage.getItem('weatherSettings')) || {};
    settings.notifications = settings.notifications || {};
    settings.notifications[type] = enabled;
    localStorage.setItem('weatherSettings', JSON.stringify(settings));
    
    if (enabled) {
        requestNotificationPermission();
    }
}

function updateMapStyle(style) {
    const settings = JSON.parse(localStorage.getItem('weatherSettings')) || {};
    settings.mapStyle = style;
    localStorage.setItem('weatherSettings', JSON.stringify(settings));
    
    // 如果地圖已經初始化，立即更新樣式
    const map = document.querySelector('#weather-map')?._leaflet_map;
    if (map) {
        const layers = {
            'standard': 'streets',
            'satellite': 'hybrid',
            'terrain': 'topo',
            'dark': 'dark'
        };
        
        const mapTilerKey = 'KY4jIP2UPcnz3OmiaAvX';
        const newLayer = L.tileLayer(`https://api.maptiler.com/maps/${layers[style]}/256/{z}/{x}/{y}.png?key=${mapTilerKey}`);
        
        // 移除現有的底圖層
        map.eachLayer((layer) => {
            if (layer instanceof L.TileLayer) {
                map.removeLayer(layer);
            }
        });
        
        // 添加新的底圖層
        newLayer.addTo(map);
    }
}

function resetSettings() {
    if (confirm('確定要重置所有設定嗎？')) {
        localStorage.removeItem('weatherSettings');
        loadSettings();
    }
}

function exportSettings() {
    const settings = JSON.parse(localStorage.getItem('weatherSettings')) || {};
    const dataStr = JSON.stringify(settings, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'weather_settings.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

async function requestNotificationPermission() {
    try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            alert('需要通知權限才能接收提醒');
        }
    } catch (error) {
        console.error('請求通知權限時發生錯誤:', error);
    }
}

// 修改選單點擊事件處理
document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', () => {
        document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        
        // 根據點擊的選單項目更新內容
        const menuType = item.querySelector('span:last-child').textContent;
        switch(menuType) {
            case '主頁':
                updateMainContent('home');
                break;
            case '天氣地圖':
                updateMainContent('map');
                break;
            case '設定':
                updateMainContent('settings');
                break;
        }
    });
});

// 修改天氣地圖相關函數
async function initWeatherMap() {
    // 初始化地圖
    const map = L.map('weather-map', {
        center: [23.5, 121],
        zoom: 7,
        zoomControl: false,
        maxBounds: [
            [20, 115],
            [27, 125]
        ],
        minZoom: 6,
        maxZoom: 18
    });

    // 添加縮放控制
    L.control.zoom({
        position: 'topright'
    }).addTo(map);

    // MapTiler 圖層
    const mapTilerKey = 'KY4jIP2UPcnz3OmiaAvX';
    const mapLayers = {
        '標準地圖': L.tileLayer(`https://api.maptiler.com/maps/streets/256/{z}/{x}/{y}.png?key=${mapTilerKey}`, {
            attribution: '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a>'
        }),
        '衛星地圖': L.tileLayer(`https://api.maptiler.com/maps/hybrid/256/{z}/{x}/{y}.jpg?key=${mapTilerKey}`, {
            attribution: '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a>'
        }),
        '地形圖': L.tileLayer(`https://api.maptiler.com/maps/topo/256/{z}/{x}/{y}.png?key=${mapTilerKey}`, {
            attribution: '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a>'
        }),
        '深色地圖': L.tileLayer(`https://api.maptiler.com/maps/dark/256/{z}/{x}/{y}.png?key=${mapTilerKey}`, {
            attribution: '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a>'
        })
    };

    mapLayers['標準地圖'].addTo(map);

    // 創建天氣圖層群組
    const weatherLayer = L.layerGroup().addTo(map);

    // 添加天氣更新時間顯示
    const timeControl = L.control({position: 'bottomleft'});
    timeControl.onAdd = function(map) {
        const div = L.DomUtil.create('div', 'weather-time-control');
        div.innerHTML = `<div class="weather-time">
            上次更新: ${new Date().toLocaleTimeString('zh-TW')}
            <button onclick="refreshWeatherMap()" class="refresh-btn">
                <span class="material-icons">refresh</span>
            </button>
        </div>`;
        return div;
    };
    timeControl.addTo(map);

    // 為每個城市添加天氣標記
    for (const city of cities) {
        try {
            const response = await fetch(
                `https://api.openweathermap.org/data/2.5/weather?q=${city.name}&appid=${apiKey}&units=metric&lang=zh_tw`
            );
            const data = await response.json();

            if (response.ok) {
                const temp = Math.round(data.main.temp);
                const tempColor = getTempColor(temp);
                
                const weatherIcon = L.divIcon({
                    html: `
                        <div class="weather-marker" style="background: ${tempColor.background}">
                            <div class="city-name">${city.name}</div>
                            <img src="https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png" alt="天氣圖標">
                            <div class="weather-temp" style="color: ${tempColor.text}">${temp}°C</div>
                        </div>
                    `,
                    className: 'weather-icon-marker',
                    iconSize: [80, 100]
                });

                const marker = L.marker(city.coords, {icon: weatherIcon})
                    .bindPopup(`
                        <div class="map-popup">
                            <h3>${city.name}</h3>
                            <img src="https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png" alt="天氣圖標">
                            <p class="weather-desc">${data.weather[0].description}</p>
                            <div class="weather-details">
                                <div class="weather-detail-item">
                                    <span class="material-icons">thermostat</span>
                                    <p>溫度: ${temp}°C</p>
                                </div>
                                <div class="weather-detail-item">
                                    <span class="material-icons">water_drop</span>
                                    <p>濕度: ${data.main.humidity}%</p>
                                </div>
                                <div class="weather-detail-item">
                                    <span class="material-icons">air</span>
                                    <p>風速: ${(data.wind.speed * 3.6).toFixed(1)} km/h</p>
                                </div>
                            </div>
                            <button onclick="viewFavoriteCity('${city.name}')" class="view-details-btn">
                                查看詳細資訊
                            </button>
                        </div>
                    `, {
                        className: 'weather-popup'
                    });
                
                weatherLayer.addLayer(marker);
            }
        } catch (error) {
            console.error(`獲取 ${city.name} 天氣數據時發生錯誤:`, error);
        }
    }

    // 添加海嘯資訊圖層
    const tsunamiLayer = L.layerGroup();
    const tsunamiData = await getTsunamiInfo();
    
    if (tsunamiData && tsunamiData.length > 0) {
        // 只顯示最新的海嘯資訊
        const latestTsunami = tsunamiData[0];
        
        if (latestTsunami.EarthquakeInfo && latestTsunami.EarthquakeInfo.Epicenter) {
            const epicenter = latestTsunami.EarthquakeInfo.Epicenter;
            const magnitude = latestTsunami.EarthquakeInfo.EarthquakeMagnitude.MagnitudeValue;
            
            // 創建震央標記
            const epicenterIcon = L.divIcon({
                html: `
                    <div class="tsunami-marker ${latestTsunami.ReportColor}">
                        <div class="tsunami-icon">
                            <span class="material-icons">warning</span>
                        </div>
                        <div class="magnitude">M${magnitude}</div>
                    </div>
                `,
                className: 'tsunami-icon-marker',
                iconSize: [60, 60]
            });

            // 添加震央標記
            const marker = L.marker([epicenter.EpicenterLatitude, epicenter.EpicenterLongitude], {
                icon: epicenterIcon
            }).bindPopup(`
                <div class="tsunami-popup">
                    <div class="tsunami-header ${latestTsunami.ReportColor}">
                        <span class="material-icons">warning</span>
                        <h3>海嘯${latestTsunami.ReportType}</h3>
                    </div>
                    <div class="tsunami-content">
                        <p><strong>地點：</strong>${epicenter.Location}</p>
                        <p><strong>規模：</strong>M${magnitude}</p>
                        <p><strong>深度：</strong>${latestTsunami.EarthquakeInfo.FocalDepth}公里</p>
                        <p><strong>發生時間：</strong>${latestTsunami.EarthquakeInfo.OriginTime}</p>
                        <p><strong>報告編號：</strong>${latestTsunami.ReportNo}</p>
                        <div class="tsunami-message">
                            ${latestTsunami.ReportContent}
                        </div>
                        <a href="${latestTsunami.Web}" target="_blank" class="tsunami-details-btn">
                            查看詳細資訊
                        </a>
                    </div>
                </div>
            `, {
                className: 'tsunami-popup'
            });

            // 如果是警報狀態，添加影響範圍圓圈
            if (latestTsunami.ReportType.includes('警報')) {
                const impactCircle = L.circle([epicenter.EpicenterLatitude, epicenter.EpicenterLongitude], {
                    color: getReportColor(latestTsunami.ReportColor),
                    fillColor: getReportColor(latestTsunami.ReportColor),
                    fillOpacity: 0.1,
                    radius: 500000 // 500公里半徑
                });
                tsunamiLayer.addLayer(impactCircle);
            }

            tsunamiLayer.addLayer(marker);
        }
    }

    // 更新圖層控制
    const overlayMaps = {
        "天氣資訊": weatherLayer,
        "海嘯資訊": tsunamiLayer
    };

    L.control.layers(mapLayers, overlayMaps, {
        position: 'topright'
    }).addTo(map);

    // 預設顯示海嘯圖層
    tsunamiLayer.addTo(map);
}

// 輔助函數：根據報告顏色獲取對應的色碼
function getReportColor(reportColor) {
    const colorMap = {
        '綠色': '#28a745',
        '黃色': '#ffc107',
        '橙色': '#fd7e14',
        '紅色': '#dc3545'
    };
    return colorMap[reportColor] || '#28a745';
}

// 根據溫度獲取顏色
function getTempColor(temp) {
    if (temp <= 0) return { background: 'rgba(0, 150, 255, 0.9)', text: '#fff' };
    if (temp <= 10) return { background: 'rgba(0, 200, 255, 0.9)', text: '#fff' };
    if (temp <= 20) return { background: 'rgba(0, 255, 200, 0.9)', text: '#000' };
    if (temp <= 25) return { background: 'rgba(255, 255, 0, 0.9)', text: '#000' };
    if (temp <= 30) return { background: 'rgba(255, 150, 0, 0.9)', text: '#fff' };
    return { background: 'rgba(255, 0, 0, 0.9)', text: '#fff' };
}

// 刷新天氣地圖
async function refreshWeatherMap() {
    const weatherMap = document.getElementById('weather-map');
    if (weatherMap) {
        weatherMap.innerHTML = '';
        await initWeatherMap();
    }
}

// 添加海嘯資訊獲取函數
async function getTsunamiInfo() {
    try {
        const response = await fetch('https://opendata.cwa.gov.tw/api/v1/rest/datastore/E-A0014-001?Authorization=CWA-19B695DB-613E-496B-A962-8A9399FD36A3');
        const data = await response.json();
        return data.records.Tsunami;
    } catch (error) {
        console.error('獲取海嘯資訊時發生錯誤:', error);
        return null;
    }
}

// 添加海嘯資訊更新函數
async function updateTsunamiInfo() {
    try {
        const response = await fetch('https://opendata.cwa.gov.tw/api/v1/rest/datastore/E-A0014-001?Authorization=CWA-19B695DB-613E-496B-A962-8A9399FD36A3');
        const data = await response.json();
        
        if (data.records && data.records.Tsunami && data.records.Tsunami.length > 0) {
            const latestTsunami = data.records.Tsunami[0];
            const tsunamiStatus = document.getElementById('tsunami-status');
            const tsunamiContent = document.getElementById('tsunami-content');
            
            // 更新狀態
            tsunamiStatus.className = 'tsunami-status ' + latestTsunami.ReportColor;
            tsunamiStatus.textContent = `${latestTsunami.ReportType} (${latestTsunami.ReportNo})`;
            
            // 更新內容
            let contentHTML = '';
            if (latestTsunami.EarthquakeInfo) {
                const eq = latestTsunami.EarthquakeInfo;
                contentHTML = `
                    <p class="tsunami-location">${eq.Epicenter.Location}</p>
                    <p class="tsunami-time">發生時間: ${eq.OriginTime}</p>
                    <p class="tsunami-magnitude">規模: M${eq.EarthquakeMagnitude.MagnitudeValue}</p>
                    <p class="tsunami-depth">深度: ${eq.FocalDepth}公里</p>
                    <div class="tsunami-message">${latestTsunami.ReportContent}</div>
                    <a href="${latestTsunami.Web}" target="_blank" class="tsunami-link">
                        查看詳細資訊
                        <span class="material-icons">open_in_new</span>
                    </a>
                `;
            } else {
                contentHTML = `
                    <div class="tsunami-message">${latestTsunami.ReportContent}</div>
                    <a href="${latestTsunami.Web}" target="_blank" class="tsunami-link">
                        查看詳細資訊
                        <span class="material-icons">open_in_new</span>
                    </a>
                `;
            }
            tsunamiContent.innerHTML = contentHTML;
        } else {
            document.getElementById('tsunami-status').textContent = '目前無海嘯資訊';
            document.getElementById('tsunami-content').innerHTML = '<p>目前無海嘯警報或消息。</p>';
        }
    } catch (error) {
        console.error('獲取海嘯資訊時發生錯誤:', error);
        document.getElementById('tsunami-status').textContent = '資料載入失敗';
        document.getElementById('tsunami-content').innerHTML = '<p>無法獲取海嘯資訊，請稍後再試。</p>';
    }
}

async function getTyphoonData() {
    try {
        const response = await fetch('https://opendata.cwa.gov.tw/api/v1/rest/datastore/W-C0034-005?Authorization=CWA-19B695DB-613E-496B-A962-8A9399FD36A3');
        const data = await response.json();
        
        if (data.success === "true" && data.records.tropicalCyclones.tropicalCyclone.length > 0) {
            const typhoon = data.records.tropicalCyclones.tropicalCyclone[0];
            updateTyphoonCard(typhoon);
        } else {
            showNoTyphoonMessage();
        }
    } catch (error) {
        console.error('獲取颱風資料時發生錯誤:', error);
    }
}

function updateTyphoonCard(typhoon) {
    const badge = document.querySelector('.typhoon-badge');
    const name = document.querySelector('.typhoon-name');
    const windSpeed = document.querySelector('.wind-speed');
    const pressure = document.querySelector('.pressure');
    const direction = document.querySelector('.direction');
    const speed = document.querySelector('.speed');
    const radius = document.querySelector('.radius-value');
    const forecastList = document.querySelector('.forecast-list');
    
    // 檢查颱風是否已減弱
    const isWeakened = typhoon.forecastData.fix.some(forecast => 
        forecast.stateTransfers?.some(state => 
            state.value.includes('減弱為低氣壓')
        )
    );
    
    // 更新狀態標籤
    badge.textContent = isWeakened ? '已減弱' : '活躍中';
    badge.style.background = isWeakened ? 'rgba(128, 128, 128, 0.2)' : 'rgba(255, 71, 87, 0.2)';
    badge.style.color = isWeakened ? '#808080' : '#ff4757';
    
    // 更新基本資訊
    name.textContent = `${typhoon.cwaTyphoonName} (${typhoon.typhoonName})`;
    
    // 獲取最新觀測資料
    const latestFix = typhoon.analysisData.fix[typhoon.analysisData.fix.length - 1];
    
    // 更新強度資訊
    windSpeed.textContent = `最大風速: ${latestFix.maxWindSpeed}公尺/秒`;
    pressure.textContent = `氣壓: ${latestFix.pressure}百帕`;
    
    // 更新移動資訊
    direction.textContent = `移向: ${getChineseDirection(latestFix.movingDirection)}`;
    speed.textContent = `速度: ${latestFix.movingSpeed}公里/時`;
    
    // 更新暴風半徑
    if (latestFix.circleOf15Ms) {
        radius.textContent = `暴風半徑: ${latestFix.circleOf15Ms.radius}公里`;
    }
    
    // 更新預報資訊
    forecastList.innerHTML = '';
    typhoon.forecastData.fix.forEach(forecast => {
        const time = new Date(forecast.initTime);
        const forecastItem = document.createElement('div');
        forecastItem.className = 'forecast-item';
        
        // 檢查是否有狀態變化
        const stateChange = forecast.stateTransfers?.[0]?.value || '';
        const stateHTML = stateChange ? 
            `<span class="state-change">${stateChange}</span>` : '';
        
        forecastItem.innerHTML = `
            <div class="forecast-time">
                ${time.getMonth() + 1}/${time.getDate()} ${time.getHours()}:00
            </div>
            <div class="forecast-data">
                <span>${forecast.maxWindSpeed}m/s</span>
                <span>${getChineseDirection(forecast.movingDirection)} ${forecast.movingSpeed}km/h</span>
                ${stateHTML}
            </div>
        `;
        forecastList.appendChild(forecastItem);
    });
}

function getChineseDirection(dir) {
    const directions = {
        'N': '北',
        'NNE': '北北東',
        'NE': '東北',
        'ENE': '東北東',
        'E': '東',
        'ESE': '東南東',
        'SE': '東南',
        'SSE': '南南東',
        'S': '南',
        'SSW': '南南西',
        'SW': '西南',
        'WSW': '西南西',
        'W': '西',
        'WNW': '西北西',
        'NW': '西北',
        'NNW': '北北西'
    };
    return directions[dir] || dir;
}

function showNoTyphoonMessage() {
    const typhoonInfo = document.querySelector('.typhoon-info');
    typhoonInfo.innerHTML = '<div class="no-typhoon">目前無活躍颱風</div>';
}

// 在頁面載入時獲取颱風資料
document.addEventListener('DOMContentLoaded', getTyphoonData);

async function getEarthquakeData() {
    try {
        const response = await fetch('https://opendata.cwa.gov.tw/api/v1/rest/datastore/E-A0015-001?Authorization=CWA-19B695DB-613E-496B-A962-8A9399FD36A3');
        const data = await response.json();
        
        if (data.success === "true" && data.records.Earthquake && data.records.Earthquake.length > 0) {
            const latestEarthquake = data.records.Earthquake[0];
            updateEarthquakeCard(latestEarthquake);
        } else {
            showNoEarthquakeMessage();
        }
    } catch (error) {
        console.error('獲取地震資料時發生錯誤:', error);
        showEarthquakeError();
    }
}

function updateEarthquakeCard(earthquake) {
    try {
        // 更新時間
        const timeElement = document.querySelector('.earthquake-time');
        const time = new Date(earthquake.EarthquakeInfo.OriginTime);
        timeElement.textContent = `${time.getMonth() + 1}/${time.getDate()} ${time.getHours()}:${String(time.getMinutes()).padStart(2, '0')}`;

        // 更新規模
        const magnitudeElement = document.querySelector('.earthquake-magnitude');
        magnitudeElement.textContent = `M${earthquake.EarthquakeInfo.EarthquakeMagnitude.MagnitudeValue}`;

        // 更新位置
        const locationElement = document.querySelector('.earthquake-location');
        locationElement.textContent = earthquake.EarthquakeInfo.Epicenter.Location;

        // 更新深度
        const depthElement = document.querySelector('.depth-value');
        depthElement.textContent = `${earthquake.EarthquakeInfo.FocalDepth} 公里`;

        // 更新最大震度
        const intensityElement = document.querySelector('.intensity-value');
        const maxIntensity = earthquake.Intensity.ShakingArea.reduce((max, area) => {
            const intensity = parseInt(area.AreaIntensity);
            return intensity > max ? intensity : max;
        }, 0);
        intensityElement.textContent = `${maxIntensity} 級`;

        // 更新影響區域
        const impactLevelElement = document.querySelector('.impact-level');
        const affectedAreasElement = document.querySelector('.affected-areas');

        // 根據規模設定影響程度
        const magnitude = parseFloat(earthquake.EarthquakeInfo.EarthquakeMagnitude.MagnitudeValue);
        let impactLevel = '';
        if (magnitude >= 6.0) {
            impactLevel = '重大';
        } else if (magnitude >= 5.0) {
            impactLevel = '中度';
        } else {
            impactLevel = '輕微';
        }

        // 取得受影響地區，處理重複地區和疊字問題
        const areaMap = new Map(); // 用於儲存每個地區的最大震度
        
        earthquake.Intensity.ShakingArea
            .filter(area => area.AreaIntensity !== "0")
            .forEach(area => {
                const currentIntensity = parseInt(area.AreaIntensity);
                const existingIntensity = areaMap.get(area.CountyName);
                
                // 如果該地區還沒有記錄，或新的震度更大，則更新記錄
                if (!existingIntensity || currentIntensity > existingIntensity) {
                    areaMap.set(area.CountyName, currentIntensity);
                }
            });

        // 將 Map 轉換為格式化的字串
        const affectedAreas = Array.from(areaMap.entries())
            .map(([county, intensity]) => `${county}: ${intensity}級`)
            .join('、');

        impactLevelElement.textContent = `影響程度：${impactLevel}`;
        affectedAreasElement.textContent = affectedAreas || earthquake.ReportContent || '無詳細影響資訊';

    } catch (error) {
        console.error('更新地震卡片時發生錯誤:', error);
        showEarthquakeError();
    }
}

function showNoEarthquakeMessage() {
    const earthquakeInfo = document.querySelector('.earthquake-info');
    earthquakeInfo.innerHTML = `
        <div style="text-align: center; color: rgba(255, 255, 255, 0.7); padding: 20px;">
            目前無最新地震資訊
        </div>
    `;
}

function showEarthquakeError() {
    const earthquakeInfo = document.querySelector('.earthquake-info');
    earthquakeInfo.innerHTML = `
        <div style="text-align: center; color: rgba(255, 255, 255, 0.7); padding: 20px;">
            無法獲取地震資訊，請稍後再試
        </div>
    `;
}

// 在頁面載入時獲取地震資料
document.addEventListener('DOMContentLoaded', () => {
    getEarthquakeData();
    // 每5分鐘更新一次資料
    setInterval(getEarthquakeData, 5 * 60 * 1000);
});

// 修改通知功能實現
async function setupNotifications() {
    try {
        // 檢查瀏覽器是否支援通知和 Service Worker
        if (!("Notification" in window) || !("serviceWorker" in navigator)) {
            alert("您的瀏覽器不支援通知功能");
            return;
        }

        const settings = JSON.parse(localStorage.getItem('weatherSettings')) || {};
        if (!settings.notifications) return;

        // 註冊 Service Worker
        const registration = await navigator.serviceWorker.register('/service-worker.js');
        console.log('Service Worker 註冊成功');

        // 請求通知權限
        if (Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                alert('需要通知權限才能接收提醒');
                return;
            }
        } else if (Notification.permission === 'denied') {
            alert('通知權限已被封鎖，請在瀏覽器設定中開啟');
            return;
        }

        // 設置地震通知
        if (settings.notifications.earthquake) {
            let lastEarthquakeTime = null;
            
            setInterval(async () => {
                try {
                    const response = await fetch('https://opendata.cwa.gov.tw/api/v1/rest/datastore/E-A0015-001?Authorization=CWA-19B695DB-613E-496B-A962-8A9399FD36A3');
                    const data = await response.json();
                    
                    if (data.success === "true" && data.records.Earthquake && data.records.Earthquake.length > 0) {
                        const latestEarthquake = data.records.Earthquake[0];
                        const earthquakeTime = new Date(latestEarthquake.EarthquakeInfo.OriginTime);
                        
                        if (!lastEarthquakeTime || earthquakeTime > lastEarthquakeTime) {
                            // 使用 Service Worker 發送通知
                            registration.showNotification('新地震通知', {
                                body: `地點：${latestEarthquake.EarthquakeInfo.Epicenter.Location}\n規模：${latestEarthquake.EarthquakeInfo.EarthquakeMagnitude.MagnitudeValue}\n深度：${latestEarthquake.EarthquakeInfo.FocalDepth}公里`,
                                icon: '/images/earthquake-icon.png',
                                badge: '/images/notification-badge.png',
                                vibrate: [200, 100, 200],
                                requireInteraction: true,
                                data: {
                                    url: window.location.origin
                                }
                            });

                            lastEarthquakeTime = earthquakeTime;
                        }
                    }
                } catch (error) {
                    console.error('檢查地震更新時發生錯誤:', error);
                }
            }, 60000);
        }
    } catch (error) {
        console.error('設置通知時發生錯誤:', error);
    }
}

// 修改測試通知函數
async function testNotification(type) {
    try {
        if (!("Notification" in window) || !("serviceWorker" in navigator)) {
            alert("您的瀏覽器不支援通知功能");
            return;
        }

        if (Notification.permission === 'denied') {
            alert('通知權限已被封鎖，請在瀏覽器設定中開啟');
            return;
        }

        const registration = await navigator.serviceWorker.ready;

        if (Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                alert('需要通知權限才能接收提醒');
                return;
            }
        }

        showTestNotification(type, registration);
    } catch (error) {
        console.error('測試通知時發生錯誤:', error);
        alert('無法發送通知，請確認瀏覽器設定');
    }
}

async function showTestNotification(type, registration) {
    const notifications = {
        earthquake: {
            title: '地震通知測試',
            options: {
                body: '這是一則地震通知測試訊息\n位置：花蓮縣秀林鄉\n規模：6.0\n深度：10公里',
                icon: '/images/earthquake-icon.png',
                badge: '/images/notification-badge.png',
                vibrate: [200, 100, 200],
                requireInteraction: true,
                data: {
                    url: window.location.origin
                }
            }
        },
        typhoon: {
            title: '颱風通知測試',
            options: {
                body: '這是一則颱風通知測試訊息\n颱風：小犬\n強度：中度颱風\n距離：500公里',
                icon: '/images/typhoon-icon.png',
                badge: '/images/notification-badge.png',
                vibrate: [200, 100, 200],
                requireInteraction: true,
                data: {
                    url: window.location.origin
                }
            }
        },
        tsunami: {
            title: '海嘯通知測試',
            options: {
                body: '這是一則海嘯通知測試訊息\n警報等級：黃色警報\n影響區域：東部沿海地區\n預計抵達時間：12:00',
                icon: '/images/tsunami-icon.png',
                badge: '/images/notification-badge.png',
                vibrate: [200, 100, 200],
                requireInteraction: true,
                data: {
                    url: window.location.origin
                }
            }
        }
    };

    try {
        const notification = notifications[type];
        await registration.showNotification(notification.title, notification.options);
    } catch (error) {
        console.error('顯示通知時發生錯誤:', error);
        alert('無法顯示通知，請確認瀏覽器設定');
    }
}

// 在頁面載入時初始化通知
document.addEventListener('DOMContentLoaded', () => {
    const settings = JSON.parse(localStorage.getItem('weatherSettings')) || {};
    if (settings.notifications) {
        setupNotifications();
    }
}); 