import concurrent.futures
import json
import urllib.request
from pathlib import Path

AIRPORTS = [('EGLL', 'Heathrow'), ('EGKK', 'Gatwick'), ('EGCC', 'Manchester'), ('EGSS', 'Stansted'), ('EGGW', 'Luton'), ('EGBB', 'Birmingham'), ('EGPH', 'Edinburgh'), ('EGPF', 'Glasgow'), ('EGGD', 'Bristol'), ('EGAA', 'Belfast International')]
path = Path('weather.json')
previous = json.loads(path.read_text()).get('airports', {}) if path.exists() else {}

def read_airport(airport):
    station, name = airport
    try:
        request = urllib.request.Request(f'https://tgftp.nws.noaa.gov/data/observations/metar/stations/{station}.TXT', headers={'User-Agent': 'LineLogicWeather/1.0'})
        with urllib.request.urlopen(request, timeout=30) as response:
            lines = response.read().decode().strip().splitlines()
        if len(lines) < 2 or not lines[1].startswith(station + ' '):
            raise ValueError('Unexpected METAR response')
        return station, {'name': name, 'station': station, 'observedAt': lines[0].replace('/', '-').replace(' ', 'T') + ':00Z', 'metar': lines[1]}
    except Exception:
        return station, previous.get(station, {'name': name, 'station': station, 'metar': None})

with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
    airports = dict(pool.map(read_airport, AIRPORTS))
if not any(report.get('metar') for report in airports.values()):
    raise RuntimeError('No METAR reports available')
path.write_text(json.dumps({'airports': airports}, indent=2) + '\n')
