# 🚀 Setup-Anleitung für GitHub

## 📁 Projektstruktur erstellen

Erstellen Sie diese Ordnerstruktur:

```
tennis-meisterschaft-2025/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   └── TennisChampionship.jsx
│   ├── styles/
│   │   └── index.css
│   ├── App.js
│   └── index.js
├── .gitignore
├── LICENSE
├── README.md
├── package.json
├── tailwind.config.js
└── postcss.config.js
```

## 📋 Schritt-für-Schritt Anleitung

### 1. Repository erstellen
```bash
mkdir tennis-meisterschaft-2025
cd tennis-meisterschaft-2025
git init
```

### 2. Dateien anlegen
Erstellen Sie alle Dateien gemäß der Artefakte:

- ✅ `package.json` (Artefakt 1)
- ✅ `README.md` (Artefakt 2)  
- ✅ `.gitignore` (Artefakt 3)
- ✅ `tailwind.config.js` (Artefakt 4)
- ✅ `postcss.config.js` (Artefakt 5)
- ✅ `src/App.js` (Artefakt 6)
- ✅ `src/index.js` (Artefakt 7)
- ✅ `src/styles/index.css` (Artefakt 8)
- ✅ `public/index.html` (Artefakt 9)
- ✅ `LICENSE` (Artefakt 10)

### 3. React-Komponente hinzufügen
Kopieren Sie den Code aus dem **tennis-championship** Artefakt (v13) in:
```
src/components/TennisChampionship.jsx
```

### 4. Dependencies installieren
```bash
npm install
```

### 5. Entwicklungsserver starten
```bash
npm start
```

### 6. GitHub Repository erstellen
1. Auf GitHub.com neues Repository erstellen
2. Repository-URL kopieren

### 7. Code zu GitHub pushen
```bash
git add .
git commit -m "Initial commit: Tennis Vereinsmeisterschaft 2025"
git branch -M main
git remote add origin https://github.com/IHR-USERNAME/tennis-meisterschaft-2025.git
git push -u origin main
```

## 🔧 Zusätzliche Konfiguration

### GitHub Pages (optional)
Für kostenloses Hosting:
1. Repository Settings → Pages
2. Source: GitHub Actions
3. Datei `.github/workflows/deploy.yml` erstellen:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Build
      run: npm run build
      
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./build
```

### Environment Variables
Erstellen Sie `.env` (wird von .gitignore ignoriert):
```
REACT_APP_GOOGLE_SHEETS_URL=your_google_apps_script_url_here
REACT_APP_VERSION=1.0.0
```

## 📱 Features testen

Nach dem Setup können Sie testen:

1. **PIN-Login**: `2025` (Standard) oder `9999` (Admin)
2. **Match-Eingabe**: Neue Matches hinzufügen
3. **Tabellen**: Automatische Berechnung
4. **Responsive Design**: Verschiedene Bildschirmgrößen testen

## 🆘 Problemlösung

### Node.js Fehler
```bash
# Node.js Version überprüfen
node --version  # Sollte >= 14 sein

# NPM Cache leeren
npm cache clean --force
rm -rf node_modules
npm install
```

### Tailwind CSS Probleme
```bash
# Tailwind neu initialisieren
npx tailwindcss init -p --force
```

### Build Fehler
```bash
# TypeScript Überprüfung überspringen
echo "SKIP_PREFLIGHT_CHECK=true" >> .env
```

## ✅ Fertig!

Ihre Tennis-App ist jetzt auf GitHub und lokal lauffähig! 🎾🚀
