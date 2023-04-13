import React, { useState, useEffect } from 'react'
import './App.css'
import clearsky from './img/clear_sky.png';
import cloudy from './img/cloudy.png';
import halfcloudy from './img/half_cloudy.png';
import rain from './img/rain.png';
import snow from './img/snow.png';
import thunder from './img/thunder.png';

const dataUrl =[
  ["Helsinki", "https://api.open-meteo.com/v1/forecast?latitude=60.1697&longitude=25.73&hourly=temperature_2m,precipitation_probability,precipitation,weathercode&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum&current_weather=true&forecast_days=3&timezone=auto"],
  ["Jyväskylä", "https://api.open-meteo.com/v1/forecast?latitude=62.24&longitude=25.72&hourly=temperature_2m,precipitation_probability,precipitation,weathercode&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum&current_weather=true&forecast_days=3&timezone=auto"],
  ["Tampere", "https://api.open-meteo.com/v1/forecast?latitude=61.50&longitude=23.79&hourly=temperature_2m,precipitation_probability,precipitation,weathercode&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum&current_weather=true&forecast_days=3&timezone=auto"],
  ["Tukholma", "https://api.open-meteo.com/v1/forecast?latitude=59.33&longitude=18.07&hourly=temperature_2m,precipitation_probability,precipitation,weathercode&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum&current_weather=true&forecast_days=3&timezone=auto"]
]; 
 


function App() {
  
  const n = dataUrl.length;

  const [page, setPage] = useState(0);
  const [weatherData, setWeatherData] = useState(Array.from({length: n},()=> Array.from({length: n}, () => null)));


  useEffect(() => {

    for(let i = 0; i < dataUrl.length; i++){
      getWeatherData(i);
    }
    
  }, []);


  const getWeatherData = async (i) => {
    const response = await fetch(dataUrl[i][1]);
    const jsonData = await response.json();
    let weatherDataCopy = [...weatherData]
    weatherDataCopy[i][0] = dataUrl[i][0];
    weatherDataCopy[i][1] = jsonData;
    setWeatherData(weatherDataCopy);
  };

  function changePage(i){
    setPage(i);
  }

    if(page == 0){
      return (
      
      <div className="App">    
        <MainPage data={weatherData} movePage={(i) => changePage(i)} />
      </div>
      )
    }
    else{
      return (
        <div>
          <WeatherPage data={weatherData} dataIndex={(page - 1)} movePage={(i) => changePage(i)} />
        </div>
      )
    }
  }

function MainPage({data, movePage}){

  let buttons = [];
  for (let i = 0; i < data.length; i++) {
    buttons.push(<ChangePageButton data={data} movePage ={movePage} targetPageIndex={(i +1)} key={i}/>);   
  }

  return(
    <div>
      <h1>Sääpalvelu</h1>
      <p>Valitse kaupunki:</p>
      <div className='mainPage'>
          {buttons}
      </div>
    </div>

  )
}

function WeatherPage({data, dataIndex, movePage}){
  const [activeTab, setActiveTab] = useState(1);
  function changeTab(tab){
    setActiveTab(tab);
  }

  return(
    <div>
      <h1>Sää: {data[dataIndex][0]}</h1>
      <div className="tabsDiv">
        <ul className ="tabsList">
          <li className={activeTab === 1 ? "active" : ""} onClick={() => changeTab(1)} >Päivän sää</li>
          <li className={activeTab === 2 ? "active" : ""} onClick={() => changeTab(2)}>Tuntiennuste</li>
        </ul>
      </div>
      <div className="tabContent">
        {activeTab == 1 ? <DailyWeather data={data} dataIndex={dataIndex} /> : <HourlyWeather data={data} dataIndex={dataIndex} />} 
        <ChangePageButton data={data} movePage ={movePage} targetPageIndex={0} />
      </div>
    </div>

  );
}

function HourlyWeather({data, dataIndex}){
 
  let hourAmount = data[dataIndex][1].hourly.time.length;
  let weatherTimes = new Array();
  let hourImgAndDesc = Array.from({length: hourAmount},()=> Array.from({length: 2}, () => null));
  
  let hourReports = [];
  let hoursShownAtOnce = 6;
  const [firstHourIndex, setFirstHourIndex] = useState(0);

  for(let i = 0; i < hourAmount; i++){
    let currentDate = new Date(data[dataIndex][1].hourly.time[i]);
    weatherTimes.push(currentDate);
    let weatherCode = data[dataIndex][1].hourly.weathercode[i];
    let [weatherImage, weatherDescription] = CheckWeatherCode(weatherCode);
    hourImgAndDesc[i][0] = weatherImage;
    hourImgAndDesc[i][1] = weatherDescription;
  }
  function HandleButton(increment){
    let newIndex = firstHourIndex + increment;
    setFirstHourIndex(newIndex);
  }
  for(let i = firstHourIndex; i < (firstHourIndex + hoursShownAtOnce); i++){
    hourReports.push(<HourlyWeatherData imagesAndDescriptions={hourImgAndDesc} weatherTimes={weatherTimes} data={data} dataIndex={dataIndex} hourIndex={i} key={i} />)
  }

  return(
    <div className="hourlyWeatherReports">
      <button disabled={firstHourIndex <= 0} onClick={() => HandleButton(-1)}>Edellinen</button>
      {hourReports}
      <button disabled={firstHourIndex > (hourAmount - hoursShownAtOnce - 1)} onClick={() => HandleButton(+1)}>Seuraava</button>
    </div>
  );
}

function HourlyWeatherData({imagesAndDescriptions, weatherTimes, data, dataIndex, hourIndex}){
  return(
    <div className="hourReport">
      <h4> {weatherTimes[hourIndex].getDate()}.{weatherTimes[hourIndex].getMonth() +1}</h4>
      <h4> {weatherTimes[hourIndex].getHours()}:00 </h4>
      <img src={imagesAndDescriptions[hourIndex][0]} alt={imagesAndDescriptions[hourIndex][1]} className="weatherImage" />
      <p>{imagesAndDescriptions[hourIndex][1]}</p>
      <p>Lämpötila: {data[dataIndex][1].hourly.temperature_2m[hourIndex]}°C</p>
    </div>
  );
}



function DailyWeather({data, dataIndex}){
  const [toggle, setToggle] = useState(false);
  function handleToggle(e){
      let checked = e.target.checked;
      setToggle(checked);
  }
  return(
    <div>
    <DailyWeatherData data={data} dataIndex={dataIndex} checked={toggle} />
      <p>Näytä kolmen päivän sää: 
      <label className="switch">
        <input type="checkbox" onChange={(e) => handleToggle(e)} />
        <span className="slider round"></span>
      </label> </p>
    </div>
  );
}


function DailyWeatherData({data, dataIndex, checked}){ 
  let weatherDates = new Array();
  let imagesAndDescriptions = Array.from({length: 3},()=> Array.from({length: 2}, () => null));

  for(let i = 0; i < data[dataIndex][1].daily.time.length; i++){
    let currentDate = new Date(data[dataIndex][1].daily.time[i]);
    weatherDates.push(currentDate);
    let weatherCode = data[dataIndex][1].daily.weathercode[i];
    let [weatherImage, weatherDescription] = CheckWeatherCode(weatherCode);
    imagesAndDescriptions[i][0] = weatherImage;
    imagesAndDescriptions[i][1] = weatherDescription;
  }

  if(checked){

    return(
      <div className="dailyWeatherReports">
        <div className="dayReport">
          <h3>{weatherDates[0].getDate()}.{weatherDates[0].getMonth() +1} </h3>
          <img src={imagesAndDescriptions[0][0]} alt={imagesAndDescriptions[0][1]} className="weatherImage" />
          <p>{imagesAndDescriptions[0][1]}</p>
          <p>Ylin lämpötila: {data[dataIndex][1].daily.temperature_2m_max[0]}°C</p>
          <p>Alin lämpötila: {data[dataIndex][1].daily.temperature_2m_min[0]}°C</p>
        </div>
        <div className="dayReport">
          <h3>{weatherDates[1].getDate()}.{weatherDates[1].getMonth() +1} </h3>
          <img src={imagesAndDescriptions[1][0]} alt={imagesAndDescriptions[1][1]} className="weatherImage" />
          <p>{imagesAndDescriptions[1][1]}</p>
          <p>Ylin lämpötila: {data[dataIndex][1].daily.temperature_2m_max[1]}°C</p>
          <p>Alin lämpötila: {data[dataIndex][1].daily.temperature_2m_min[1]}°C</p>
        </div>
        <div className="dayReport">
          <h3>{weatherDates[2].getDate()}.{weatherDates[2].getMonth() +1} </h3>
          <img src={imagesAndDescriptions[2][0]} alt={imagesAndDescriptions[2][1]} className="weatherImage" />
          <p>{imagesAndDescriptions[2][1]}</p>
          <p>Ylin lämpötila: {data[dataIndex][1].daily.temperature_2m_max[2]}°C</p>
          <p>Alin lämpötila: {data[dataIndex][1].daily.temperature_2m_min[2]}°C</p>
        </div>
      </div>
    );
  }
  else{
    return(
      <div className="dayReport">
        <img src={imagesAndDescriptions[0][0]} alt={imagesAndDescriptions[0][1]} className="weatherImage" />
        <p>{imagesAndDescriptions[0][1]}</p>
        <p>Ylin lämpötila: {data[dataIndex][1].daily.temperature_2m_max[0]}°C</p>
        <p>Alin lämpötila: {data[dataIndex][1].daily.temperature_2m_min[0]}°C</p>
      </div>
    );
  }

}

function ChangePageButton({data, movePage, targetPageIndex}){

  let buttonText = "";
  if(targetPageIndex == 0)
    buttonText = "Palaa etusivulle"
  else
    buttonText = data[targetPageIndex -1][0];

  return(
    <div className="pageButtonDiv">
      <button  onClick={()=> movePage(targetPageIndex)}>
        {buttonText}
      </button>
    </div>

  );
}


function CheckWeatherCode(weatherCode){
  let image;
  let description;

  switch(weatherCode){
    case 0:
      image = clearsky;
      description = 'Aurinkoista';
      break;
    case 1: case 2: case 3:
      image = halfcloudy;
      description = "Puolipilvistä";
      break;
    case 45: case 48:
      image = cloudy;
      description = "Pilvistä";
      break;
    case 51: case 53: case 55: 
      image = rain;
      description = "Pientä tihkusadetta";
      break;
    case 56: case 57:
      image = rain;
      description = "Kylmää tihkusadetta";
      break;     
    case 61: case 63: case 65:
      image = rain;
      description = "Sadetta";
      break;
    case 66: 
    case 67: 
      image = rain;
      description = "Kylmää sadetta";
      break;
    case 80: case 81: case 92:
      image = rain;
      description = "Kaatosadetta";
      break;
    case 71: case 73: case 75: case 77: 
      image = snow;
      description = "Lumisadetta";
      break;
    case 85: case 86:
      image = snow;
      description = "Lumimyrsky";
      break;
    case 95: case 96:
      image = thunder;
      description = "Ukkosta";
      break; 
    case 99:
      image = thunder;
      description = "Ukkosmyrsky";
      break; 
  }

  return [image, description];
}


export default App
