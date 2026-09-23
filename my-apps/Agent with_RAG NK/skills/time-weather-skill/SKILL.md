---
name: time-weather-skill
description: Get current local time and real-time weather information for any major city using public Open-Meteo & wttr.in APIs (no API key required).
trigger_queries:
  - "What is the time and weather in Paris?"
  - "Check the current weather forecast for Tokyo"
  - "What time is it in New York right now?"
---

# Time and Weather Skill
This skill provides real-time time zone calculations and public weather forecast lookups.

## Executable Tool Function
- Python Function: `env_tools.get_time_and_weather(location)`
- Arguments:
  - `location` (string): The city or location name (e.g. "Paris", "Tokyo", "London", "New York").
