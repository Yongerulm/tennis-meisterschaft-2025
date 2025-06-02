# 🎾 Regelwerk Integration in Tennis-App

## 1. Neuen Tab hinzufügen

In `TennisChampionship.jsx` erweitern Sie die Navigation um einen "Regeln" Tab:

```jsx
// Bestehende Navigation erweitern
<nav className="flex flex-wrap justify-center gap-2 mb-8 md:mb-12">
  <TabButton
    id="overview"
    label="Überblick"
    icon={Trophy}
    isActive={activeTab === 'overview'}
    onClick={() => setActiveTab('overview')}
  />
  <TabButton
    id="groups"
    label="Gruppen"
    icon={Users}
    isActive={activeTab === 'groups'}
    onClick={() => setActiveTab('groups')}
  />
  <TabButton
    id="semifinal"
    label="Endrunde"
    icon={Trophy}
    isActive={activeTab === 'semifinal'}
    onClick={() => setActiveTab('semifinal')}
  />
  <TabButton
    id="final"
    label="Finale"
    icon={Trophy}
    isActive={activeTab === 'final'}
    onClick={() => setActiveTab('final')}
  />
  <TabButton
    id="entry"  
    label="Eingabe"
    icon={Plus}
    isActive={activeTab === 'entry'}
    onClick={() => setActiveTab('entry')}
  />
  {/* NEU: Regeln Tab */}
  <TabButton
    id="rules"
    label="Regeln"
    icon={FileText}
    isActive={activeTab === 'rules'}
    onClick={() => setActiveTab('rules')}
  />
</nav>
```

## 2. Import für FileText Icon hinzufügen

```jsx
import { Users, Trophy, Plus, Calendar, MapPin, User, AlertTriangle, Settings, Trash2, RefreshCw, FileText } from 'lucide-react';
```

## 3. Regelwerk-Komponente erstellen

```jsx
const RulesContent = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-light text-gray-800 mb-4">
            🎾 Regelwerk Tennis Vereinsmeisterschaft 2025
          </h1>
          <h2 className="text-xl text-gray-600">TV Reicheneck</h2>
        </div>

        {/* Content */}
        <div className="prose prose-lg max-w-none">
          
          {/* 1. Turniermodus */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4 border-b-2 border-blue-200 pb-2">
              📋 1. Turniermodus und Teilnehmer
            </h2>
            
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-700 mb-3">1.1 Teilnehmerzahl</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li><strong>12 Spieler</strong> nehmen an der Vereinsmeisterschaft teil</li>
                <li>Anmeldeschluss: <strong>25. Mai 2025</strong></li>
              </ul>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-700 mb-3">1.2 Gruppeneinteilung</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li><strong>3 Gruppen</strong> mit je <strong>4 Spielern</strong></li>
                <li><strong>Gruppe A:</strong> Henning, Julia, Fabi, Michael</li>
                <li><strong>Gruppe B:</strong> Markus, Thomas, Gunter, Bernd</li>
                <li><strong>Gruppe C:</strong> Sascha, Herbert, Sven, Jose</li>
              </ul>
            </div>
          </section>

          {/* 2. Turnierablauf */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4 border-b-2 border-blue-200 pb-2">
              🏆 2. Turnierablauf
            </h2>
            
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-700 mb-3">2.1 Gruppenphase</h3>
              <p className="text-gray-600 mb-2"><strong>Zeitraum:</strong> Bis zum <strong>30. Juni 2025</strong></p>
              
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <h4 className="font-medium text-blue-800 mb-2">Spielmodus:</h4>
                <ul className="list-disc list-inside space-y-1 text-blue-700">
                  <li><strong>Jeder gegen jeden</strong> innerhalb der Gruppe</li>
                  <li><strong>6 Matches</strong> pro Gruppe (bei 4 Spielern)</li>
                  <li><strong>Gesamt 18 Gruppenspiele</strong></li>
                </ul>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">Spieltermine:</h4>
                <ul className="list-disc list-inside space-y-1 text-green-700">
                  <li>Termine werden zwischen den Spielern <strong>eigenständig vereinbart</strong></li>
                  <li>Spiele können <strong>täglich</strong> zwischen 8:00 und 22:00 Uhr stattfinden</li>
                  <li>Bei Terminproblemen entscheidet die Turnierleitung</li>
                </ul>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-700 mb-3">2.2 Endrunde (K.O.-Phase)</h3>
              <p className="text-gray-600 mb-2"><strong>Zeitraum:</strong> <strong>1. - 31. Juli 2025</strong></p>
              
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-medium text-yellow-800 mb-2">Qualifikation:</h4>
                <p className="text-yellow-700 mb-2"><strong>8 Spieler</strong> qualifizieren sich:</p>
                <ul className="list-disc list-inside space-y-1 text-yellow-700">
                  <li><strong>3 Gruppensieger</strong> (1. Platz jeder Gruppe)</li>
                  <li><strong>3 Gruppenzweite</strong> (2. Platz jeder Gruppe)</li>
                  <li><strong>2 beste Gruppendritten</strong> (beste 3. Plätze nach Punkten/Satzverhältnis)</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 3. Spielregeln */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4 border-b-2 border-blue-200 pb-2">
              🎾 3. Spielregeln
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-700 mb-3">3.1 Spielformat</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li><strong>Best-of-3-Sätze</strong> (erster Spieler mit 2 Sätzen gewinnt)</li>
                  <li>Normale Tennis-Regeln nach <strong>ITF/DTB-Bestimmungen</strong></li>
                  <li><strong>Keine Vorteile</strong> (Deuce-Regel wie üblich)</li>
                </ul>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-700 mb-3">3.2 Match-Tiebreak</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>Bei <strong>1:1 Sätzen</strong> → <strong>Match-Tiebreak bis 10 Punkte</strong></li>
                  <li>Mindestens <strong>2 Punkte Vorsprung</strong> erforderlich</li>
                  <li>Ersetzt den dritten Satz</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 4. Punktesystem */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4 border-b-2 border-blue-200 pb-2">
              📊 4. Punktesystem
            </h2>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-blue-800 mb-4">4.1 Gruppenpunkte</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">2</div>
                  <span className="text-blue-700"><strong>Sieg:</strong> 2 Punkte</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-yellow-500 text-white rounded-full flex items-center justify-center font-bold">1</div>
                  <span className="text-blue-700"><strong>Niederlage:</strong> 1 Punkt (Teilnahme-Bonus)</span>
                </div>
              </div>
            </div>
          </section>

          {/* 5. Kontakt */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4 border-b-2 border-blue-200 pb-2">
              📞 5. Kontakt und Organisation
            </h2>
            
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-blue-800 mb-4">Turnierleitung</h3>
              <div className="space-y-2 text-blue-700">
                <div className="flex items-center space-x-3">
                  <span className="font-medium">📞 Telefon:</span>
                  <a href="tel:01622303210" className="hover:underline">01622303210</a>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="font-medium">📧 E-Mail:</span>
                  <a href="mailto:markus.vaitl@gmx.de" className="hover:underline">markus.vaitl@gmx.de</a>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="font-medium">🕐 Erreichbarkeit:</span>
                  <span>Täglich 18:00-20:00 Uhr</span>
                </div>
              </div>
            </div>
          </section>

          {/* App-Hinweis */}
          <section className="mb-8">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-green-800 mb-4">📱 Ergebnis-App</h3>
              <div className="space-y-2 text-green-700">
                <p><strong>PIN für Eingabe:</strong> 2025</p>
                <p><strong>Eingabe:</strong> Sofort nach Spielende in die App eintragen</p>
                <p><strong>Format:</strong> Satz 1, Satz 2, (Match-Tiebreak falls nötig)</p>
              </div>
            </div>
          </section>

        </div>
        
        {/* Footer */}
        <div className="text-center mt-12 pt-8 border-t border-gray-200">
          <h2 className="text-2xl font-light text-gray-800 mb-4">
            🏆 Viel Erfolg bei der Vereinsmeisterschaft 2025!
          </h2>
          <p className="text-lg text-gray-600">
            <strong>Möge der/die Beste gewinnen!</strong> 🎾
          </p>
          <p className="text-sm text-gray-500 mt-4">
            Stand: Juni 2025 | TV Reicheneck | Änderungen vorbehalten
          </p>
        </div>
      </div>
    </div>
  );
};
```

## 4. Case für "rules" in renderContent() hinzufügen

```jsx
const renderContent = () => {
  switch (activeTab) {
    case 'overview':
      return (
        // ... bestehender Overview Code
      );

    case 'groups':
      return (
        // ... bestehender Groups Code
      );

    case 'semifinal':
      return (
        // ... bestehender Semifinal Code
      );

    case 'final':
      return (
        // ... bestehender Final Code
      );

    case 'entry':
      return (
        // ... bestehender Entry Code
      );

    // NEU: Rules Case
    case 'rules':
      return (
        <div>
          <h2 className="text-2xl md:text-3xl font-light text-gray-800 mb-8 text-center">Regelwerk</h2>
          <RulesContent />
        </div>
      );

    default:
      return null;
  }
};
```

## 5. Alternative: Externes Regelwerk-PDF

Falls Sie lieber ein PDF verwenden möchten:

```jsx
case 'rules':
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 text-center">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Regelwerk</h2>
        <p className="text-gray-600 mb-6">
          Das vollständige Regelwerk können Sie hier herunterladen:
        </p>
        <a 
          href="/regelwerk-2025.pdf" 
          target="_blank"
          className="inline-flex items-center px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <FileText className="mr-2" size={20} />
          Regelwerk herunterladen (PDF)
        </a>
      </div>
    </div>
  );
```

Das war's! Ihre App hat jetzt einen vollständigen Regeln-Tab mit dem kompletten Regelwerk in schöner, responsiver Darstellung. 🎾

---

## 🎾 Regelwerk Tennis Vereinsmeisterschaft 2025
## TV Reicheneck

---

## 📋 1. Turniermodus und Teilnehmer

### 1.1 Teilnehmerzahl
- **12 Spieler** nehmen an der Vereinsmeisterschaft teil
- Anmeldeschluss: **25. Mai 2025**

### 1.2 Gruppeneinteilung
- **3 Gruppen** mit je **4 Spielern**
- **Gruppe A:** Henning, Julia, Fabi, Michael
- **Gruppe B:** Markus, Thomas, Gunter, Bernd  
- **Gruppe C:** Sascha, Herbert, Sven, Jose

---

## 🏆 2. Turnierablauf

### 2.1 Gruppenphase
**Zeitraum:** Bis zum **30. Juni 2025**

#### Spielmodus:
- **Jeder gegen jeden** innerhalb der Gruppe
- **6 Matches** pro Gruppe (bei 4 Spielern)
- **Gesamt 18 Gruppenspiele**

#### Spieltermine:
- Termine werden zwischen den Spielern **eigenständig vereinbart**
- Spiele können **täglich** zwischen 8:00 und 22:00 Uhr stattfinden
- Bei Terminproblemen entscheidet die Turnierleitung

### 2.2 Endrunde (K.O.-Phase)
**Zeitraum:** **1. - 31. Juli 2025**

#### Qualifikation:
**8 Spieler** qualifizieren sich:
- **3 Gruppensieger** (1. Platz jeder Gruppe)
- **3 Gruppenzweite** (2. Platz jeder Gruppe)
- **2 beste Gruppendritten** (beste 3. Plätze nach Punkten/Satzverhältnis)

---

## 🎾 3. Spielregeln

### 3.1 Spielformat
- **Best-of-3-Sätze** (erster Spieler mit 2 Sätzen gewinnt)
- Normale Tennis-Regeln nach **ITF/DTB-Bestimmungen**
- **Keine Vorteile** (Deuce-Regel wie üblich)

### 3.2 Satzregeln
#### Reguläre Sätze:
- Satz gewonnen bei **6 Games** mit mindestens **2 Games Vorsprung**
- Bei **6:6** → **Tiebreak bis 7 Punkte** (mindestens 2 Punkte Vorsprung)
- **Maximum:** 7:6 nach Tiebreak

#### Match-Tiebreak:
- Bei **1:1 Sätzen** → **Match-Tiebreak bis 10 Punkte**
- Mindestens **2 Punkte Vorsprung** erforderlich
- Ersetzt den dritten Satz

### 3.3 Aufschlagregeln
- **2 Aufschläge** pro Punkt
- Aufschlagwechsel alle **2 Punkte** im Tiebreak
- Im Match-Tiebreak: Aufschlagwechsel alle **2 Punkte**
- Seitenwechsel im Match-Tiebreak nach **6 Punkten**

---

## 📊 4. Punktesystem

### 4.1 Gruppenpunkte
- **Sieg:** 2 Punkte
- **Niederlage:** 1 Punkt (Teilnahme-Bonus)
- **Nicht angetreten:** 0 Punkte

### 4.2 Tabellenplatz-Ermittlung
**Reihenfolge bei Punktgleichheit:**
1. **Direkter Vergleich** (Kopf-an-Kopf)
2. **Satzverhältnis** (gewonnene:verlorene Sätze)
3. **Spielverhältnis** (gewonnene:verlorene Spiele)
4. **Los-Entscheidung**

### 4.3 Beste Gruppendritten
**Vergleich aller 3. Plätze:**
1. **Punkte** aus Gruppenspielen
2. **Satzverhältnis**
3. **Spielverhältnis**  
4. **Los-Entscheidung**

---

## ⚡ 5. Endrunde (K.O.-Phase)

### 5.1 Achtelfinale
- **8 qualifizierte Spieler**
- Paarungen nach **Auslosung** oder **gesetzter Reihenfolge**
- **Direkter K.O.:** Verlierer scheidet aus

### 5.2 Halbfinale
- **4 verbliebene Spieler**
- **Kreuz-Paarungen** der Gewinner

### 5.3 Finale
- **2 Finalisten**
- Spiel um **Platz 1** und **Platz 2**

### 5.4 Spiel um Platz 3
- Verlierer der Halbfinals
- **Optional** (je nach Interesse der Spieler)

---

## 📅 6. Termine und Fristen

### 6.1 Wichtige Termine
| Phase | Zeitraum | Frist |
|-------|----------|-------|
| **Anmeldung** | Bis 25. Mai 2025 | Verbindlich |
| **Gruppenphase** | 26. Mai - 30. Juni 2025 | Alle Spiele |
| **Qualifikation steht fest** | 30. Juni 2025 | Automatisch |
| **Endrunde** | 1. - 31. Juli 2025 | Alle K.O.-Spiele |
| **Finale** | Bis 31. Juli 2025 | Spätester Termin |

### 6.2 Terminvereinbarung
- **Eigenverantwortlich** zwischen den Spielern
- **Vorschlag:** Mindestens 3 Terminoptionen anbieten
- Bei **Uneinigkeit:** Turnierleitung entscheidet verbindlich
- **Absagen:** Mindestens 24h vorher (außer Krankheit/Notfall)

---

## 🏟️ 7. Spielbedingungen

### 7.1 Spielort
- **TV Reicheneck Tennisanlage**
- **Plätze 1 und 2** stehen zur Verfügung, müssen aber eigenverantwortlich reserviert werden

### 7.2 Platzbuchung
- **Online-Buchungssystem**

### 7.3 Ausrüstung
- **Eigene Schläger und Bälle** mitbringen
- **Empfehlung:** 3 neue Bälle pro Match

---

## 📱 8. Ergebnismeldung

### 8.1 Meldepflicht
- **Sofort nach Spielende** in die App eintragen
- **PIN für Eingabe:** 2025
- **Format:** Satz 1, Satz 2, (Match-Tiebreak falls nötig)

### 8.2 Protest und Einsprüche
- **Einspruchsfrist:** 24 Stunden nach Ergebniseintragung
- **Entscheidung** binnen 48 Stunden
- **Bei Unregelmäßigkeiten:** Match wird wiederholt

---

## 🎖️ 9. Preise und Ehrungen

### 9.1 Siegerehrung
- **Termin:** Direkt nach dem Finale
- **Ort:** Vereinsheim TV Reicheneck

### 9.2 Preise
- **1. Platz:** Wanderpokal + Sachpreis
- **2. Platz:** Sachpreis
- **3. Platz:** Sachpreis

---

## ⚖️ 10. Besondere Bestimmungen

### 10.1 Verletzung/Krankheit
- **Vor Turnierbeginn:** Nachrückerregelung möglich
- **Während der Gruppenphase:** Restliche Spiele werden als 0:2-Niederlagen gewertet
- **Während der Endrunde:** Gegner kommt eine Runde weiter

### 10.2 Unsportliches Verhalten
- **Verwarnung** bei erstem Vergehen
- **Spielverlust** bei schwerem Vergehen
- **Turnier-Ausschluss** bei wiederholtem Fehlverhalten

### 10.3 Schiedsrichter
- **Selbst-Schiedsrichterei** (jeder Spieler pfeift selbst)
- Bei **umstrittenen Entscheidungen:** Punkt wiederholen
- **Streitfälle:** Turnierleitung hinzuziehen

### 10.4 Wetter
- **Regen:** Spiel wird unterbrochen, Fortsetzung möglich
- **Sturm/Gewitter:** Sofortiger Spielabbruch
- **Extremhitze:** Schatten-/Trinkpausen nach jedem Satz

---

## 📞 11. Kontakt und Organisation

### 11.1 Turnierleitung
**[Name der Turnierleitung]**
- **Telefon:** 01622303210
- **E-Mail:** markus.vaitl@gmx.de
- **Erreichbarkeit:** Täglich 18:00-20:00 Uhr

### 11.2 Technischer Support (App)
- **Technische Probleme** mit der Ergebnis-App

### 11.3 Notfall-Kontakt
- **Bei Verletzungen:** Sofort 112 anrufen

---

## ✅ 12. Teilnahme-Bestätigung

**Mit der Anmeldung zur Vereinsmeisterschaft bestätigen alle Teilnehmer:**

- ✅ Kenntnis und Anerkennung dieses Regelwerks
- ✅ Eigenverantwortliche Terminvereinbarung
- ✅ Pünktliche und korrekte Ergebnismeldung
- ✅ Fair Play und sportliches Verhalten
- ✅ Teilnahme an eigene Kosten (Platzmiete, Bälle)

---

## 🏆 Viel Erfolg bei der Vereinsmeisterschaft 2025!

**Möge der/die Beste gewinnen!** 🎾

---

*Stand: Juni 2025 | TV Reicheneck*  
*Änderungen vorbehalten | Bei Fragen wenden Sie sich an die Turnierleitung*# 🎾 Regelwerk Tennis Vereinsmeisterschaft 2025
## TV Reicheneck

---

## 📋 1. Turniermodus und Teilnehmer

### 1.1 Teilnehmerzahl
- **12 Spieler** nehmen an der Vereinsmeisterschaft teil
- Anmeldeschluss: **25. Mai 2025**

### 1.2 Gruppeneinteilung
- **3 Gruppen** mit je **4 Spielern**
- **Gruppe A:** Henning, Julia, Fabi, Michael
- **Gruppe B:** Markus, Thomas, Gunter, Bernd  
- **Gruppe C:** Sascha, Herbert, Sven, Jose

---

## 🏆 2. Turnierablauf

### 2.1 Gruppenphase
**Zeitraum:** Bis zum **30. Juni 2025**

#### Spielmodus:
- **Jeder gegen jeden** innerhalb der Gruppe
- **6 Matches** pro Gruppe (bei 4 Spielern)
- **Gesamt 18 Gruppenspiele**

#### Spieltermine:
- Termine werden zwischen den Spielern **eigenständig vereinbart**
- Spiele können **täglich** zwischen 8:00 und 22:00 Uhr stattfinden
- Bei Terminproblemen entscheidet die Turnierleitung

### 2.2 Endrunde (K.O.-Phase)
**Zeitraum:** **1. - 31. Juli 2025**

#### Qualifikation:
**8 Spieler** qualifizieren sich:
- **3 Gruppensieger** (1. Platz jeder Gruppe)
- **3 Gruppenzweite** (2. Platz jeder Gruppe)
- **2 beste Gruppendritten** (beste 3. Plätze nach Punkten/Satzverhältnis)

---

## 🎾 3. Spielregeln

### 3.1 Spielformat
- **Best-of-3-Sätze** (erster Spieler mit 2 Sätzen gewinnt)
- Normale Tennis-Regeln nach **ITF/DTB-Bestimmungen**
- **Keine Vorteile** (Deuce-Regel wie üblich)

### 3.2 Satzregeln
#### Reguläre Sätze:
- Satz gewonnen bei **6 Games** mit mindestens **2 Games Vorsprung**
- Bei **6:6** → **Tiebreak bis 7 Punkte** (mindestens 2 Punkte Vorsprung)
- **Maximum:** 7:6 nach Tiebreak

#### Match-Tiebreak:
- Bei **1:1 Sätzen** → **Match-Tiebreak bis 10 Punkte**
- Mindestens **2 Punkte Vorsprung** erforderlich
- Ersetzt den dritten Satz

### 3.3 Aufschlagregeln
- **2 Aufschläge** pro Punkt
- Aufschlagwechsel alle **2 Punkte** im Tiebreak
- Im Match-Tiebreak: Aufschlagwechsel alle **2 Punkte**
- Seitenwechsel im Match-Tiebreak nach **6 Punkten**

---

## 📊 4. Punktesystem

### 4.1 Gruppenpunkte
- **Sieg:** 2 Punkte
- **Niederlage:** 1 Punkt (Teilnahme-Bonus)
- **Nicht angetreten:** 0 Punkte

### 4.2 Tabellenplatz-Ermittlung
**Reihenfolge bei Punktgleichheit:**
1. **Direkter Vergleich** (Kopf-an-Kopf)
2. **Satzverhältnis** (gewonnene:verlorene Sätze)
3. **Spielverhältnis** (gewonnene:verlorene Spiele)
4. **Los-Entscheidung**

### 4.3 Beste Gruppendritten
**Vergleich aller 3. Plätze:**
1. **Punkte** aus Gruppenspielen
2. **Satzverhältnis**
3. **Spielverhältnis**  
4. **Los-Entscheidung**

---

## ⚡ 5. Endrunde (K.O.-Phase)

### 5.1 Achtelfinale
- **8 qualifizierte Spieler**
- Paarungen nach **Auslosung** oder **gesetzter Reihenfolge**
- **Direkter K.O.:** Verlierer scheidet aus

### 5.2 Halbfinale
- **4 verbliebene Spieler**
- **Kreuz-Paarungen** der Gewinner

### 5.3 Finale
- **2 Finalisten**
- Spiel um **Platz 1** und **Platz 2**

### 5.4 Spiel um Platz 3
- Verlierer der Halbfinals
- **Optional** (je nach Interesse der Spieler)

---

## 📅 6. Termine und Fristen

### 6.1 Wichtige Termine
| Phase | Zeitraum | Frist |
|-------|----------|-------|
| **Anmeldung** | Bis 25. Mai 2025 | Verbindlich |
| **Gruppenphase** | 26. Mai - 30. Juni 2025 | Alle Spiele |
| **Qualifikation steht fest** | 30. Juni 2025 | Automatisch |
| **Endrunde** | 1. - 31. Juli 2025 | Alle K.O.-Spiele |
| **Finale** | Bis 31. Juli 2025 | Spätester Termin |

### 6.2 Terminvereinbarung
- **Eigenverantwortlich** zwischen den Spielern
- **Vorschlag:** Mindestens 3 Terminoptionen anbieten
- Bei **Uneinigkeit:** Turnierleitung entscheidet verbindlich
- **Absagen:** Mindestens 24h vorher (außer Krankheit/Notfall)

---

## 🏟️ 7. Spielbedingungen

### 7.1 Spielort
- **TV Reicheneck Tennisanlage**
- **Plätze 1 und 2** stehen zur Verfügung, müssen aber eigenverantwortlich reserviert werden

### 7.2 Platzbuchung
- **Online-Buchungssystem**

### 7.3 Ausrüstung
- **Eigene Schläger und Bälle** mitbringen
- **Empfehlung:** 3 neue Bälle pro Match

---

## 📱 8. Ergebnismeldung

### 8.1 Meldepflicht
- **Sofort nach Spielende** in die App eintragen
- **PIN für Eingabe:** 2025
- **Format:** Satz 1, Satz 2, (Match-Tiebreak falls nötig)

### 8.2 Protest und Einsprüche
- **Einspruchsfrist:** 24 Stunden nach Ergebniseintragung
- **Entscheidung** binnen 48 Stunden
- **Bei Unregelmäßigkeiten:** Match wird wiederholt

---

## 🎖️ 9. Preise und Ehrungen

### 9.1 Siegerehrung
- **Termin:** Direkt nach dem Finale
- **Ort:** Vereinsheim TV Reicheneck

### 9.2 Preise
- **1. Platz:** Wanderpokal + Sachpreis
- **2. Platz:** Sachpreis
- **3. Platz:** Sachpreis

---

## ⚖️ 10. Besondere Bestimmungen

### 10.1 Verletzung/Krankheit
- **Vor Turnierbeginn:** Nachrückerregelung möglich
- **Während der Gruppenphase:** Restliche Spiele werden als 0:2-Niederlagen gewertet
- **Während der Endrunde:** Gegner kommt eine Runde weiter

### 10.2 Unsportliches Verhalten
- **Verwarnung** bei erstem Vergehen
- **Spielverlust** bei schwerem Vergehen
- **Turnier-Ausschluss** bei wiederholtem Fehlverhalten

### 10.3 Schiedsrichter
- **Selbst-Schiedsrichterei** (jeder Spieler pfeift selbst)
- Bei **umstrittenen Entscheidungen:** Punkt wiederholen
- **Streitfälle:** Turnierleitung hinzuziehen

### 10.4 Wetter
- **Regen:** Spiel wird unterbrochen, Fortsetzung möglich
- **Sturm/Gewitter:** Sofortiger Spielabbruch
- **Extremhitze:** Schatten-/Trinkpausen nach jedem Satz

---

## 📞 11. Kontakt und Organisation

### 11.1 Turnierleitung
**[Name der Turnierleitung]**
- **Telefon:** 01622303210
- **E-Mail:** markus.vaitl@gmx.de
- **Erreichbarkeit:** Täglich 18:00-20:00 Uhr

### 11.2 Technischer Support (App)
- **Technische Probleme** mit der Ergebnis-App

### 11.3 Notfall-Kontakt
- **Bei Verletzungen:** Sofort 112 anrufen

---

## ✅ 12. Teilnahme-Bestätigung

**Mit der Anmeldung zur Vereinsmeisterschaft bestätigen alle Teilnehmer:**

- ✅ Kenntnis und Anerkennung dieses Regelwerks
- ✅ Eigenverantwortliche Terminvereinbarung
- ✅ Pünktliche und korrekte Ergebnismeldung
- ✅ Fair Play und sportliches Verhalten
- ✅ Teilnahme an eigene Kosten (Platzmiete, Bälle)

---

## 🏆 Viel Erfolg bei der Vereinsmeisterschaft 2025!

**Möge der/die Beste gewinnen!** 🎾

---

*Stand: Juni 2025 | TV Reicheneck*  
*Änderungen vorbehalten | Bei Fragen wenden Sie sich an die Turnierleitung*
