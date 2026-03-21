const TIME_ZONE = 'America/Maceio';

// Approx coordinates for Maragogi, AL
const DEFAULT_LAT = -9.012;
const DEFAULT_LON = -35.222;

function mapOpenMeteoWeatherCode(code) {
  const c = Number(code);
  if (Number.isNaN(c)) return 'cloudy';

  if (c === 0) return 'clear';
  if (c === 1 || c === 2) return 'partly_cloudy';
  if (c === 3) return 'cloudy';
  if (c === 45 || c === 48) return 'fog';

  // Drizzle
  if ([51, 53, 55, 56, 57].includes(c)) return 'drizzle';

  // Rain / showers
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(c)) return 'rain';

  // Snow
  if ([71, 73, 75, 77, 85, 86].includes(c)) return 'snow';

  // Thunderstorm
  if ([95, 96, 99].includes(c)) return 'storm';

  return 'cloudy';
}

module.exports = async function handler(req, res) {
  try {
    const lat = typeof req.query?.lat === 'string' ? Number(req.query.lat) : DEFAULT_LAT;
    const lon = typeof req.query?.lon === 'string' ? Number(req.query.lon) : DEFAULT_LON;

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: 'Invalid lat/lon.' }));
      return;
    }

    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.searchParams.set('latitude', String(lat));
    url.searchParams.set('longitude', String(lon));
    url.searchParams.set('current', 'temperature_2m,weather_code,wind_speed_10m');
    url.searchParams.set('timezone', TIME_ZONE);

    const r = await fetch(url.toString(), {
      headers: { 'accept': 'application/json' }
    });

    if (!r.ok) {
      res.statusCode = 502;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: 'Weather upstream error.' }));
      return;
    }

    const data = await r.json();
    const current = data?.current || {};

    const temperatureC = Number(current.temperature_2m);
    const windKmh = Number(current.wind_speed_10m);
    const weatherCode = current.weather_code;

    const conditionKey = mapOpenMeteoWeatherCode(weatherCode);

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
    res.end(
      JSON.stringify({
        location: 'Maragogi, AL',
        timeZone: TIME_ZONE,
        temperatureC: Number.isFinite(temperatureC) ? temperatureC : null,
        windKmh: Number.isFinite(windKmh) ? windKmh : null,
        conditionKey,
        source: 'open-meteo'
      })
    );
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: 'Internal error.' }));
  }
};
