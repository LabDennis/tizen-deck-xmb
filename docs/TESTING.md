# Tests

## Syntax

```sh
node --check src/app.js
python3 -m py_compile build.py
bash -n build.sh install.sh
```

## JavaScript-Tests

```sh
for test in tests/*.test.js; do node "$test" || exit; done
```

Die Tests prüfen unter anderem Navigation, Controllerbelegung, Audiozustand,
App-Auswahl, Einstellungen, Uhr und Spiellogik.

## Browser-Tests

Die Dateien `tests/*.browser.js` prüfen die Oberfläche mit Playwright/Chromium.
Prüfbereiche: Navigation, Dialoge, Bildschirmgrenzen, Sicherungsimport, Updates
und Flappy Smasnug. Benötigte Browser-Abhängigkeiten separat installieren.

## Am Monitor

Installation und Start, Navigation per Fernbedienung, App-Wechsel, Audio sowie
Standby und Rückkehr auf dem Zielgerät prüfen. USB-Sounds, physische Controller,
DRM-/HDMI-Inhalte und Langzeit-Speicherverhalten benötigen eigene Gerätetests.
Desktop-Browsertests belegen keine vollständige Kompatibilität der Tizen-Webengine.

Tests veröffentlichen keine Schlüssel oder Geräte-Backups und flashen keine Firmware.
