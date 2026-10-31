# Entwicklung

Der Launcher besteht aus HTML, CSS und JavaScript unter `src/`. `build.py` erstellt
das signierte Tizen-Webpaket; `install.sh` installiert es auf einem vorbereiteten
Monitor. App-IDs und Gerätefunktionen sind modellabhängig.

## Vorschau

```sh
python3 -m http.server 8766 --bind 127.0.0.1 --directory src
```

http://localhost:8766 öffnen. Die Vorschau benötigt keinen Monitor; native
TV-Funktionen stehen dort nicht zur Verfügung.

## Prüfen und bauen

[Tests und Geräteprüfung](TESTING.md). `bash build.sh` erzeugt das WGT-Paket.
Der lokale Autorenschlüssel in `.signing/` muss für spätere Updates erhalten
bleiben und gehört nicht ins Repository.

Die Oberfläche bleibt deutschsprachig. Datenschutz und optionales Debloat sind
separat unter [Samsung Smart Monitor Privacy](https://github.com/LabDennis/samsung-smart-monitor-privacy) dokumentiert.
