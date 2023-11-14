const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const axios = require('axios');
const app = express();
const path = require('path');
const cors = require('cors');

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use('/images', express.static(path.join(__dirname, 'images'), {
  setHeaders: (res, path, stat) => {
    res.set('Content-Type', 'image/png'); // 이미지 파일 확장자에 맞게 설정
  },
}));
const API_KEY = '7d1188304c32f5fd98a19d8e6440523b';


// MongoDB 연결
mongoose.connect('mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+2.0.2', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// MongoDB 스키마 및 모델 정의
const weatherSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  temperature: Number,
  humidity: Number,
  description: String, // 날씨 상태
  weatherIcon: String,
  cityId: Number, // 도시 ID
  flagImage: String, // 국기 이미지
});


const Weather = mongoose.model('Weather', weatherSchema);
;

// Express 설정
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// 라우트
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.get('/api/weather', async (req, res) => {
  try {
    const cityIds = [1816670,1835847,1850147,5039192,2643743];  // 도시 ID
    const weatherDataPromises = cityIds.map(async (cityId) => {
      const response = await axios.get(`http://api.openweathermap.org/data/2.5/weather?id=${cityId}&appid=${API_KEY}&units=metric`);
      const weatherData = {
        temperature: response.data.main.temp,
        humidity: response.data.main.humidity,
        description: response.data.weather[0].description,
        weatherIcon: response.data.weather[0].icon,
        cityId: cityId,
        flagImage: `Image${cityId}`
      };

    // MongoDB에 날씨 정보 저장
    const newWeather = new Weather(weatherData);
    await newWeather.save();

    return weatherData;
    });

    const results = await Promise.all(weatherDataPromises);
    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

// 웹 서버 시작
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});