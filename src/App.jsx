import React, { useState, useEffect } from "react";
import "./App.css";
import clearsky from "./img/clear_sky.png";
import cloudy from "./img/cloudy.png";
import halfcloudy from "./img/half_cloudy.png";
import rain from "./img/rain.png";
import snow from "./img/snow.png";
import thunder from "./img/thunder.png";

const dataUrl = [
	[
		"Helsinki",
		"https://api.open-meteo.com/v1/forecast?latitude=60.1697&longitude=25.73&hourly=temperature_2m,precipitation_probability,precipitation,weathercode&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum&current_weather=true&forecast_days=3&timezone=auto",
	],
	[
		"Jyväskylä",
		"https://api.open-meteo.com/v1/forecast?latitude=62.24&longitude=25.72&hourly=temperature_2m,precipitation_probability,precipitation,weathercode&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum&current_weather=true&forecast_days=3&timezone=auto",
	],
	[
		"Tampere",
		"https://api.open-meteo.com/v1/forecast?latitude=61.50&longitude=23.79&hourly=temperature_2m,precipitation_probability,precipitation,weathercode&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum&current_weather=true&forecast_days=3&timezone=auto",
	],
	[
		"Tukholma",
		"https://api.open-meteo.com/v1/forecast?latitude=59.33&longitude=18.07&hourly=temperature_2m,precipitation_probability,precipitation,weathercode&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum&current_weather=true&forecast_days=3&timezone=auto",
	],
];

function App() {
	const [page, setPage] = useState(0);
	const [weatherData, setWeatherData] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		const loadWeatherData = async () => {
			try {
				setIsLoading(true);
				setError("");

				const results = await Promise.all(
					dataUrl.map(async ([cityName, url]) => {
						const response = await fetch(url);
						if (!response.ok) {
							throw new Error(
								`Tietojen haku epäonnistui kaupungille ${cityName}: ${response.status}`,
							);
						}

						const jsonData = await response.json();
						return { cityName, weatherData: jsonData };
					}),
				);

				setWeatherData(results);
			} catch (err) {
				setError(err.message || "Sääennusteiden lataus epäonnistui");
			} finally {
				setIsLoading(false);
			}
		};

		loadWeatherData();
	}, []);

	function changePage(i) {
		setPage(i);
	}

	if (page === 0) {
		return (
			<div className="App">
				<MainPage
					data={weatherData}
					movePage={(i) => changePage(i)}
					isLoading={isLoading}
					error={error}
				/>
			</div>
		);
	}

	return (
		<div className="App">
			<WeatherPage
				data={weatherData}
				dataIndex={page - 1}
				movePage={(i) => changePage(i)}
			/>
		</div>
	);
}

function MainPage({ data, movePage, isLoading, error }) {
	if (isLoading) {
		return (
			<div className="statusBox">
				<h1>Sääpalvelu</h1>
				<p>Ladataan säätietoja...</p>
			</div>
		);
	}

	if (error) {
		return (
			<div className="statusBox">
				<h1>Sääpalvelu</h1>
				<p>{error}</p>
			</div>
		);
	}

	return (
		<div>
			<h1>Sääpalvelu</h1>
			<p>Valitse kaupunki:</p>
			<div className="mainPage">
				{data.map((cityEntry, index) => (
					<ChangePageButton
						data={data}
						movePage={movePage}
						targetPageIndex={index + 1}
						key={cityEntry.cityName}
					/>
				))}
			</div>
		</div>
	);
}

function WeatherPage({ data, dataIndex, movePage }) {
	const [activeTab, setActiveTab] = useState(1);
	const cityName = data[dataIndex]?.cityName || "Kaupunki";

	function changeTab(tab) {
		setActiveTab(tab);
	}

	return (
		<div>
			<h1>Sää: {cityName}</h1>
			<div className="tabsDiv">
				<ul className="tabsList">
					<li
						className={activeTab === 1 ? "active" : ""}
						onClick={() => changeTab(1)}
					>
						Päivän sää
					</li>
					<li
						className={activeTab === 2 ? "active" : ""}
						onClick={() => changeTab(2)}
					>
						Tuntiennuste
					</li>
				</ul>
			</div>
			<div className="tabContent">
				{activeTab === 1 ? (
					<DailyWeather data={data} dataIndex={dataIndex} />
				) : (
					<HourlyWeather data={data} dataIndex={dataIndex} />
				)}
				<ChangePageButton
					data={data}
					movePage={movePage}
					targetPageIndex={0}
				/>
			</div>
		</div>
	);
}

function HourlyWeather({ data, dataIndex }) {
	const cityWeatherData = data[dataIndex]?.weatherData;
	if (!cityWeatherData?.hourly?.time?.length) {
		return <p>Ei tuntitietoja saatavilla.</p>;
	}

	let hourAmount = cityWeatherData.hourly.time.length;
	let weatherTimes = [];
	let hourImgAndDesc = Array.from({ length: hourAmount }, () =>
		Array.from({ length: 2 }, () => null),
	);

	let hourReports = [];
	let hoursShownAtOnce = 4;
	const [firstHourIndex, setFirstHourIndex] = useState(0);

	for (let i = 0; i < hourAmount; i++) {
		let currentDate = new Date(cityWeatherData.hourly.time[i]);
		weatherTimes.push(currentDate);
		let weatherCode = cityWeatherData.hourly.weathercode[i];
		let [weatherImage, weatherDescription] = CheckWeatherCode(weatherCode);
		hourImgAndDesc[i][0] = weatherImage;
		hourImgAndDesc[i][1] = weatherDescription;
	}

	function HandleButton(increment) {
		let newIndex = firstHourIndex + increment;
		setFirstHourIndex(newIndex);
	}

	for (
		let i = firstHourIndex;
		i < Math.min(firstHourIndex + hoursShownAtOnce, hourAmount);
		i++
	) {
		hourReports.push(
			<HourlyWeatherData
				imagesAndDescriptions={hourImgAndDesc}
				weatherTimes={weatherTimes}
				data={data}
				dataIndex={dataIndex}
				hourIndex={i}
				key={i}
			/>,
		);
	}

	return (
		<div className="hourlyWeatherReports">
			<button
				disabled={firstHourIndex <= 0}
				onClick={() => HandleButton(-1)}
			>
				Edellinen
			</button>
			{hourReports}
			<button
				disabled={firstHourIndex > hourAmount - hoursShownAtOnce - 1}
				onClick={() => HandleButton(+1)}
			>
				Seuraava
			</button>
		</div>
	);
}

function HourlyWeatherData({
	imagesAndDescriptions,
	weatherTimes,
	data,
	dataIndex,
	hourIndex,
}) {
	const cityWeatherData = data[dataIndex]?.weatherData;

	return (
		<div className="hourReport">
			<h4>
				{weatherTimes[hourIndex].getDate()}.
				{weatherTimes[hourIndex].getMonth() + 1}
			</h4>
			<h4>{weatherTimes[hourIndex].getHours()}:00</h4>
			<img
				src={imagesAndDescriptions[hourIndex][0]}
				alt={imagesAndDescriptions[hourIndex][1]}
				className="weatherImage"
			/>
			<p>{imagesAndDescriptions[hourIndex][1]}</p>
			<p>
				Lämpötila: {cityWeatherData.hourly.temperature_2m[hourIndex]}°C
			</p>
		</div>
	);
}

function DailyWeather({ data, dataIndex }) {
	const [toggle, setToggle] = useState(false);

	function handleToggle(e) {
		let checked = e.target.checked;
		setToggle(checked);
	}

	return (
		<div>
			<DailyWeatherData
				data={data}
				dataIndex={dataIndex}
				checked={toggle}
			/>
			<p>
				Näytä kolmen päivän sää:
				<label className="switch">
					<input type="checkbox" onChange={(e) => handleToggle(e)} />
					<span className="slider round"></span>
				</label>
			</p>
		</div>
	);
}

function DailyWeatherData({ data, dataIndex, checked }) {
	const cityWeatherData = data[dataIndex]?.weatherData;
	if (!cityWeatherData?.daily?.time?.length) {
		return <p>Ei päivittäisiä tietoja saatavilla.</p>;
	}

	let weatherDates = [];
	const daysToShow = Math.min(3, cityWeatherData.daily.time.length);
	let imagesAndDescriptions = Array.from({ length: daysToShow }, () =>
		Array.from({ length: 2 }, () => null),
	);

	for (let i = 0; i < daysToShow; i++) {
		let currentDate = new Date(cityWeatherData.daily.time[i]);
		weatherDates.push(currentDate);
		let weatherCode = cityWeatherData.daily.weathercode[i];
		let [weatherImage, weatherDescription] = CheckWeatherCode(weatherCode);
		imagesAndDescriptions[i][0] = weatherImage;
		imagesAndDescriptions[i][1] = weatherDescription;
	}

	if (checked) {
		return (
			<div className="dailyWeatherReports">
				{Array.from({ length: daysToShow }, (_, index) => (
					<div className="dayReport" key={index}>
						<h3>
							{weatherDates[index].getDate()}.
							{weatherDates[index].getMonth() + 1}
						</h3>
						<img
							src={imagesAndDescriptions[index][0]}
							alt={imagesAndDescriptions[index][1]}
							className="weatherImage"
						/>
						<p>{imagesAndDescriptions[index][1]}</p>
						<p>
							Ylin lämpötila:{" "}
							{cityWeatherData.daily.temperature_2m_max[index]}°C
						</p>
						<p>
							Alin lämpötila:{" "}
							{cityWeatherData.daily.temperature_2m_min[index]}°C
						</p>
					</div>
				))}
			</div>
		);
	}

	return (
		<div className="dayReport">
			<img
				src={imagesAndDescriptions[0][0]}
				alt={imagesAndDescriptions[0][1]}
				className="weatherImage"
			/>
			<p>{imagesAndDescriptions[0][1]}</p>
			<p>
				Ylin lämpötila: {cityWeatherData.daily.temperature_2m_max[0]}°C
			</p>
			<p>
				Alin lämpötila: {cityWeatherData.daily.temperature_2m_min[0]}°C
			</p>
		</div>
	);
}

function ChangePageButton({ data, movePage, targetPageIndex }) {
	let buttonText = "";
	if (targetPageIndex === 0) {
		buttonText = "Palaa etusivulle";
	} else {
		const cityEntry = data[targetPageIndex - 1];
		const temperature =
			cityEntry?.weatherData?.current_weather?.temperature;
		buttonText = (
			<span className="cityButtonLabel">
				<strong>{cityEntry?.cityName || "Kaupunki"}</strong>
				<span>
					{temperature !== undefined ? `${temperature}°C` : "…"}
				</span>
			</span>
		);
	}

	return (
		<div className="pageButtonDiv">
			<button onClick={() => movePage(targetPageIndex)}>
				{buttonText}
			</button>
		</div>
	);
}

function CheckWeatherCode(weatherCode) {
	let image;
	let description;

	switch (weatherCode) {
		case 0:
			image = clearsky;
			description = "Aurinkoista";
			break;
		case 1:
		case 2:
		case 3:
			image = halfcloudy;
			description = "Puolipilvistä";
			break;
		case 45:
		case 48:
			image = cloudy;
			description = "Pilvistä";
			break;
		case 51:
		case 53:
		case 55:
			image = rain;
			description = "Pientä tihkusadetta";
			break;
		case 56:
		case 57:
			image = rain;
			description = "Kylmää tihkusadetta";
			break;
		case 61:
		case 63:
		case 65:
			image = rain;
			description = "Sadetta";
			break;
		case 66:
		case 67:
			image = rain;
			description = "Kylmää sadetta";
			break;
		case 80:
		case 81:
		case 92:
			image = rain;
			description = "Kaatosadetta";
			break;
		case 71:
		case 73:
		case 75:
		case 77:
			image = snow;
			description = "Lumisadetta";
			break;
		case 85:
		case 86:
			image = snow;
			description = "Lumimyrsky";
			break;
		case 95:
		case 96:
			image = thunder;
			description = "Ukkosta";
			break;
		case 99:
			image = thunder;
			description = "Ukkosmyrsky";
			break;
		default:
			image = clearsky;
			description = "Säätila tuntematon";
			break;
	}

	return [image, description];
}

export default App;
