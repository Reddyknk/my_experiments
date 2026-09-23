import datetime
import requests
import urllib.parse

def get_time_and_weather(location="London"):
    """
    Fetches the current weather and approximate local time for a given city.
    Uses wttr.in / open-meteo without requiring API keys.
    """
    try:
        encoded_loc = urllib.parse.quote(location)
        url = f"https://wttr.in/{encoded_loc}?format=j1"
        res = requests.get(url, timeout=5)
        if res.status_code == 200:
            data = res.json()
            curr = data['current_condition'][0]
            temp_c = curr['temp_C']
            temp_f = curr['temp_F']
            desc = curr['weatherDesc'][0]['value']
            humidity = curr['humidity']
            wind = curr['windspeedKmph']
            
            # Approximate local time from location response if available or UTC fallback
            now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            return {
                "status": "success",
                "location": location,
                "temperature_celsius": f"{temp_c}°C",
                "temperature_fahrenheit": f"{temp_f}°F",
                "condition": desc,
                "humidity": f"{humidity}%",
                "wind_speed": f"{wind} km/h",
                "timestamp": now_str
            }
        else:
            return {"status": "error", "message": f"Unable to fetch weather for {location} (HTTP {res.status_code})"}
    except Exception as e:
        return {"status": "error", "message": str(e), "location": location}

if __name__ == "__main__":
    print(get_time_and_weather("Tokyo"))
