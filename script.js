const apiKey = "71cbdccda3e6532a044d5291a131c2c0";

const searchBtn = document.getElementById("searchBtn");
const cityInput = document.getElementById("cityInput");
const loader = document.getElementById("loader");
const recentContainer = document.getElementById("recentSearches");
const unitToggle = document.getElementById("unitToggle");

let unit = "metric";


// ---------------- LOADER ----------------

function showLoader() {
    if (loader) loader.classList.remove("display-hidden");
}

function hideLoader() {
    if (loader) loader.classList.add("display-hidden");
}


// ---------------- SEARCH BUTTON ----------------

searchBtn.addEventListener("click", async () => {

    const city = cityInput.value.trim();

    if (!city) return;

    showLoader();

    try {

        await getWeather(city);
        await getForecast(city);

        saveSearch(city);

    } finally {

        hideLoader();

    }

});


// ---------------- ENTER KEY SUPPORT ----------------

cityInput.addEventListener("keydown", (event) => {

    if (event.key === "Enter") {

        searchBtn.click();

    }

});


// ---------------- WEATHER REQUEST ----------------

async function getWeather(city) {

    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=${unit}`;

    try {

        const response = await fetch(url);
        const data = await response.json();

        if (data.cod == 404) {

            alert("City not found!");
            document.getElementById("weatherDisplay").classList.add("display-hidden");
            return;

        }

        displayWeather(data);

    } catch (error) {

        console.error("Weather fetch error:", error);

    }

}


// ---------------- DISPLAY WEATHER ----------------

function displayWeather(data) {

    document.getElementById("weatherDisplay").classList.remove("display-hidden");

    document.getElementById("cityName").textContent = data.name;

    document.getElementById("description").textContent =
        data.weather[0].description;

    document.getElementById("temp").textContent =
        Math.round(data.main.temp);

    document.getElementById("humidity").textContent =
        data.main.humidity;

    document.getElementById("wind").textContent =
        data.wind.speed;

    const iconCode = data.weather[0].icon;

    document.getElementById("weatherIcon").src =
        `https://openweathermap.org/img/wn/${iconCode}@2x.png`;

    updateTheme(data.weather[0].main);

}


// ---------------- BACKGROUND THEME ----------------

function updateTheme(condition) {

    const body = document.body;

    switch (condition) {

        case "Rain":
        case "Drizzle":
        case "Thunderstorm":
            body.style.background =
                "linear-gradient(135deg, #4b6cb7 0%, #182848 100%)";
            break;

        case "Clear":
            body.style.background =
                "linear-gradient(135deg, #2980b9 0%, #6dd5fa 100%)";
            break;

        case "Clouds":
            body.style.background =
                "linear-gradient(135deg, #757f9a 0%, #d7dde8 100%)";
            break;

        case "Snow":
            body.style.background =
                "linear-gradient(135deg, #e6e9f0 0%, #eef1f5 100%)";
            break;

        default:
            body.style.background =
                "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)";

    }

}


// ---------------- GEOLOCATION ----------------

window.onload = function () {

    renderSearches();

    if (navigator.geolocation) {

        navigator.geolocation.getCurrentPosition(success, error);

    }

};


async function success(position) {

    const lat = position.coords.latitude;
    const lon = position.coords.longitude;

    document.getElementById("locationStatus").textContent =
        "Showing weather for your current location";

    const url =
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${unit}`;

    try {

        const response = await fetch(url);
        const data = await response.json();

        displayWeather(data);

        getForecast({ lat, lon }, true);

    } catch (err) {

        console.error("Location weather error:", err);

    }

}

function error() {

    const status = document.getElementById("locationStatus");

    if (status) {
        status.textContent =
            "Location access denied. Please search for a city.";
    }

}


// ---------------- FORECAST ----------------

async function getForecast(cityOrCoords, isCoords = false) {

    let url;

    if (isCoords) {

        url =
            `https://api.openweathermap.org/data/2.5/forecast?lat=${cityOrCoords.lat}&lon=${cityOrCoords.lon}&appid=${apiKey}&units=${unit}`;

    } else {

        url =
            `https://api.openweathermap.org/data/2.5/forecast?q=${cityOrCoords}&appid=${apiKey}&units=${unit}`;

    }

    try {

        const response = await fetch(url);
        const data = await response.json();

        if (data.cod !== "200") {

            console.error("Forecast not found");
            return;

        }

        displayForecast(data);

    } catch (error) {

        console.error("Forecast error:", error);

    }

}


// ---------------- DISPLAY FORECAST ----------------

function displayForecast(data) {

    const container = document.getElementById("forecastContainer");

    container.innerHTML = "";

    container.classList.remove("display-hidden");

    const dailyData = data.list.filter(item =>
        item.dt_txt.includes("12:00:00")
    );

    dailyData.forEach(day => {

        const date = new Date(day.dt * 1000);

        const dayName = date.toLocaleDateString("en-US", {
            weekday: "short"
        });

        container.innerHTML += `

        <div class="forecast-item">

            <p>${dayName}</p>

            <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}.png">

            <p class="forecast-temp">${Math.round(day.main.temp)}°</p>

        </div>

        `;

    });

}


// ---------------- RECENT SEARCH ----------------

function saveSearch(city) {

    let searches =
        JSON.parse(localStorage.getItem("recentCities")) || [];

    if (!searches.includes(city)) {

        searches.unshift(city);

    }

    searches = searches.slice(0, 5);

    localStorage.setItem("recentCities", JSON.stringify(searches));

    renderSearches();

}


function renderSearches() {

    if (!recentContainer) return;

    recentContainer.innerHTML = "";

    const searches =
        JSON.parse(localStorage.getItem("recentCities")) || [];

    searches.forEach(city => {

        const btn = document.createElement("button");

        btn.textContent = city;

        btn.onclick = () => {

            cityInput.value = city;

            searchBtn.click();

        };

        recentContainer.appendChild(btn);

    });

}


// ---------------- UNIT TOGGLE ----------------

if (unitToggle) {

    unitToggle.addEventListener("click", () => {

        unit = unit === "metric" ? "imperial" : "metric";

        const city = cityInput.value;

        if (city) {

            getWeather(city);
            getForecast(city);

        }

    });

}