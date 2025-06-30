# Tennis Vereinsmeisterschaft 2025 - TV Reicheneck

Eine moderne Web-Anwendung zur Verwaltung der Tennis-Vereinsmeisterschaft des TV Reicheneck.

## 🎾 Features

- **Gruppenphase**: 3 Gruppen mit je 4 Spielern
- **Automatische Tabellen**: Punkte, Siege, Niederlagen, Sätze
- **K.O.-Phase**: 8 qualifizierte Spieler (3 Gruppensieger + 3 Gruppenzweite + 2 beste Gruppendritten)
- **Tennis-Score-Validierung**: Korrekte Überprüfung aller Tennis-Ergebnisse
- **Admin-Modus**: Erweiterte Verwaltungsfunktionen
- **Responsive Design**: Funktioniert auf allen Geräten
- **Demo-Modus**: Sofort einsatzbereit mit Beispieldaten

## 🚀 Installation

### Voraussetzungen
- Node.js (Version 14 oder höher)
- npm oder yarn

### Setup
```bash
# Repository klonen
git clone https://github.com/tv-reicheneck/tennis-meisterschaft-2025.git
cd tennis-meisterschaft-2025

# Abhängigkeiten installieren
npm install

# Beispiel-Umgebungsdatei kopieren
cp .env.example .env
# .env mit deinen Airtable Daten befuellen


### Airtable einrichten
In der `.env` Datei muessen drei Variablen gesetzt sein, damit die App auf
deine Airtable Basis zugreifen kann:

```env
REACT_APP_AIRTABLE_BASE_ID=deine_base_id
REACT_APP_AIRTABLE_TABLE_NAME=Matches
REACT_APP_AIRTABLE_API_KEY=dein_api_key
```

Beim Deploy auf Netlify muessen dieselben Variablen in den Build Settings
hinterlegt werden.

# Tailwind CSS konfigurieren
npx tailwindcss init -p

# Entwicklungsserver starten
npm start
```

Die Anwendung ist dann unter `http://localhost:3000` verfügbar.

## 📱 Verwendung

### Anmeldung
- **Standard-PIN**: `2025` - Normale Ergebnis-Eingabe
- **Admin-PIN**: `9999` - Erweiterte Verwaltung

### Navigation
- **Überblick**: Gesamtansicht aller Gruppen und K.O.-Phase
- **Gruppen**: Detaillierte Gruppentabellen
- **Endrunde**: Qualifikation und Endrunden-Matches
- **Finale**: Finale der besten 2 Spieler
- **Eingabe**: Match-Ergebnisse eintragen

### Punktesystem
- **Sieg**: 2 Punkte
- **Niederlage**: 1 Punkt (für Teilnahme)
- **Nicht gespielt**: 0 Punkte

## 🏗️ Technischer Aufbau

### Technologien
- **React** 18.2.0 - UI Framework
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **JavaScript ES6+** - Programmierung

### Projektstruktur
```
src/
├── components/
│   └── TennisChampionship.jsx
├── styles/
│   └── index.css
├── App.js
└── index.js
```

### Features im Detail

#### Tennis-Score-Validierung
- Korrekte Satz-Ergebnisse (6:0, 6:1, 6:2, 6:3, 6:4, 7:5, 7:6)
- Tiebreak-Validierung bei 6:6
- Match-Tiebreak bei 1:1 Sätzen (bis 10, mindestens 2 Punkte Vorsprung)

#### Qualifikationssystem
- **3 Gruppensieger** (1. Plätze aller Gruppen)
- **3 Gruppenzweite** (2. Plätze aller Gruppen)
- **2 beste Gruppendritten** (beste 3. Plätze nach Punkten/Satzverhältnis)

## 🔧 Konfiguration

### Gruppen anpassen
In `TennisChampionship.jsx` die `GROUPS` Konstante bearbeiten:

```javascript
const GROUPS = {
  A: ['Spieler1', 'Spieler2', 'Spieler3', 'Spieler4'],
  B: ['Spieler5', 'Spieler6', 'Spieler7', 'Spieler8'],
  C: ['Spieler9', 'Spieler10', 'Spieler11', 'Spieler12']
};
```

### PINs ändern
```javascript
const correctPin = '2025';  // Standard-PIN
const adminPin = '9999';    // Admin-PIN
```

## 📊 Google Sheets Integration

Für dauerhafte Datenspeicherung kann eine Google Sheets Integration implementiert werden:

1. Google Apps Script erstellen
2. API-Endpunkte für CRUD-Operationen
3. `GOOGLE_APPS_SCRIPT_URL` in der App konfigurieren

## 🚀 Deployment

### GitHub Pages
```bash
npm run build
# Build-Ordner zu GitHub Pages deployen
```

### Netlify/Vercel
1. Repository zu Netlify/Vercel verbinden
2. Build-Befehl: `npm run build`
3. Publish-Ordner: `build`

## 🐛 Bekannte Limitationen

- **Demo-Modus**: Daten werden nur lokal gespeichert
- **Session-Storage**: Daten gehen beim Browser-Reload verloren
- **Google Sheets**: Funktioniert nur mit korrekter Backend-Integration

## 🤝 Beitragen

1. Fork des Repositories
2. Feature-Branch erstellen (`git checkout -b feature/neue-funktion`)
3. Änderungen committen (`git commit -am 'Neue Funktion hinzugefügt'`)
4. Branch pushen (`git push origin feature/neue-funktion`)
5. Pull Request erstellen

## 📝 Lizenz

MIT License - siehe [LICENSE](LICENSE) Datei für Details.

## 👨‍💻 Entwickelt für

**TV Reicheneck** - Tennis-Vereinsmeisterschaft 2025

---

**Viel Erfolg bei der Vereinsmeisterschaft! 🎾🏆**
