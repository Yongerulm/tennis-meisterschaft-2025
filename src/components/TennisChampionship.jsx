import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Users, Trophy, Plus, Calendar, MapPin, User, AlertTriangle, Settings, Trash2, RefreshCw, Wifi, WifiOff, FileText } from 'lucide-react';

const TennisChampionship = () => {
  // State Management
  const [activeTab, setActiveTab] = useState('overview');
  const [loginPin, setLoginPin] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [matches, setMatches] = useState([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [validationErrors, setValidationErrors] = useState([]);
  const [nextMatchId, setNextMatchId] = useState(1000);
  const [connectionStatus, setConnectionStatus] = useState('testing');
  const [errorMessage, setErrorMessage] = useState('');
  
  // New Match Form State
  const [newMatch, setNewMatch] = useState({
    group: 'A',
    koGroup: 'A',
    phase: 'group',
    player1: '',
    player2: '',
    set1Player1: '',
    set1Player2: '',
    set2Player1: '',
    set2Player2: '',
    tiebreakPlayer1: '',
    tiebreakPlayer2: ''
  });

  // Constants
  const GROUPS = {
    A: ['Henning', 'Julia', 'Fabi', 'Michael'],
    B: ['Markus', 'Thomas', 'Gunter', 'Bernd'],
    C: ['Sascha', 'Herbert', 'Sven', 'Jose']
  };

  const correctPin = '2025';
  const adminPin = '9999';

  // Airtable Configuration
  const getEnvVar = (key, fallback = '') => {
    try {
      return (typeof process !== 'undefined' && process.env && process.env[key]) || fallback;
    } catch (error) {
      console.warn(`Environment variable ${key} not available, using fallback`);
      return fallback;
    }
  };

  const AIRTABLE_CONFIG = {
    baseId: getEnvVar('REACT_APP_AIRTABLE_BASE_ID', 'app5txy8Rr2jz0R0i'),
    tableName: getEnvVar('REACT_APP_AIRTABLE_TABLE_NAME', 'Table 1'),
    apiKey: getEnvVar('REACT_APP_AIRTABLE_API_KEY', 'patstaBt42aLHLJBy.1e7e4f8ca1779f0e09e16c92137930ef615d85dc77ecf308f44e35b608a00c83'),
    get apiUrl() {
      return `https://api.airtable.com/v0/${this.baseId}/${this.tableName}`;
    }
  };

  // Demo Data Fallback
  const demoMatches = [
    {
      id: 1,
      group: 'A',
      phase: 'group',
      player1: 'Henning',
      player2: 'Julia',
      set1: { player1: 6, player2: 4 },
      set2: { player1: 3, player2: 6 },
      tiebreak: { player1: 10, player2: 7 },
      winner: 'Henning',
      status: 'completed',
      timestamp: new Date().toISOString()
    },
    {
      id: 2,
      group: 'A',
      phase: 'group',
      player1: 'Fabi',
      player2: 'Michael',
      set1: { player1: 6, player2: 2 },
      set2: { player1: 6, player2: 4 },
      winner: 'Fabi',
      status: 'completed',
      timestamp: new Date().toISOString()
    },
    {
      id: 3,
      group: 'A',
      phase: 'group',
      player1: 'Henning',
      player2: 'Fabi',
      set1: { player1: 6, player2: 3 },
      set2: { player1: 6, player2: 4 },
      winner: 'Henning',
      status: 'completed',
      timestamp: new Date().toISOString()
    },
    {
      id: 4,
      group: 'A',
      phase: 'group',
      player1: 'Julia',
      player2: 'Michael',
      set1: { player1: 6, player2: 4 },
      set2: { player1: 4, player2: 6 },
      tiebreak: { player1: 10, player2: 8 },
      winner: 'Julia',
      status: 'completed',
      timestamp: new Date().toISOString()
    },
    {
      id: 5,
      group: 'A',
      phase: 'group',
      player1: 'Henning',
      player2: 'Michael',
      set1: { player1: 6, player2: 1 },
      set2: { player1: 6, player2: 2 },
      winner: 'Henning',
      status: 'completed',
      timestamp: new Date().toISOString()
    },
    {
      id: 6,
      group: 'A',
      phase: 'group',
      player1: 'Julia',
      player2: 'Fabi',
      set1: { player1: 2, player2: 6 },
      set2: { player1: 3, player2: 6 },
      winner: 'Fabi',
      status: 'completed',
      timestamp: new Date().toISOString()
    }
  ];

  // Airtable API Functions
  const airtableRequest = async (method, endpoint = '', data = null) => {
    if (!AIRTABLE_CONFIG.apiKey) {
      throw new Error('Airtable API Key nicht konfiguriert');
    }

    const url = endpoint ? `${AIRTABLE_CONFIG.apiUrl}/${endpoint}` : AIRTABLE_CONFIG.apiUrl;
    
    const config = {
      method,
      headers: {
        'Authorization': `Bearer ${AIRTABLE_CONFIG.apiKey}`,
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      config.body = JSON.stringify(data);
    }

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Airtable ${method} Error: ${response.status} - ${errorText}`);
    }

    return response.json();
  };

  // Test Airtable Connection
  const testAirtableConnection = async () => {
    try {
      console.log('🎾 Initialisiere Tennis App...');
      setConnectionStatus('testing');
      
      await airtableRequest('GET');
      
      console.log('✅ Airtable Verbindung erfolgreich!');
      setConnectionStatus('connected');
      setErrorMessage('');
      return true;
    } catch (error) {
      console.error('❌ Airtable Verbindung fehlgeschlagen:', error);
      setConnectionStatus('disconnected');
      setErrorMessage(error.message);
      return false;
    }
  };

  // Load Matches from Airtable
  const loadMatches = async () => {
    try {
      if (connectionStatus !== 'connected') {
        setMatches(demoMatches);
        return;
      }

      const response = await airtableRequest('GET');
      
      if (response.records && response.records.length > 0) {
        const airtableMatches = response.records.map(record => ({
          id: record.fields.ID,
          group: record.fields.Gruppe,
          koGroup: record.fields.KOGruppe,
          phase: record.fields.Phase,
          player1: record.fields.Spieler1,
          player2: record.fields.Spieler2,
          set1: {
            player1: record.fields.Satz1_Spieler1 || 0,
            player2: record.fields.Satz1_Spieler2 || 0
          },
          set2: {
            player1: record.fields.Satz2_Spieler1 || 0,
            player2: record.fields.Satz2_Spieler2 || 0
          },
          ...(record.fields.Tiebreak_Spieler1 && {
            tiebreak: {
              player1: record.fields.Tiebreak_Spieler1,
              player2: record.fields.Tiebreak_Spieler2
            }
          }),
          winner: record.fields.Sieger,
          status: record.fields.Status,
          timestamp: record.fields.Date,
          airtableId: record.id
        }));

        setMatches(airtableMatches);
        
        if (airtableMatches.length > 0) {
          const maxId = Math.max(...airtableMatches.map(m => m.id));
          setNextMatchId(maxId + 1);
        }
        
        console.log(`📊 ${airtableMatches.length} Matches von Airtable geladen`);
      } else {
        setMatches([]);
        setNextMatchId(1000);
      }
      
    } catch (error) {
      console.error('❌ Fehler beim Laden der Matches:', error);
      setMatches(demoMatches);
      setErrorMessage(`Laden fehlgeschlagen: ${error.message}`);
    }
  };

  // Save Match to Airtable
  const saveMatchToAirtable = async (matchData) => {
    if (connectionStatus !== 'connected') {
      return matchData;
    }

    try {
      const airtableData = {
        fields: {
          ID: matchData.id,
          Gruppe: matchData.group,
          KOGruppe: matchData.koGroup,
          Phase: matchData.phase,
          Spieler1: matchData.player1,
          Spieler2: matchData.player2,
          Satz1_Spieler1: matchData.set1.player1,
          Satz1_Spieler2: matchData.set1.player2,
          Satz2_Spieler1: matchData.set2.player1,
          Satz2_Spieler2: matchData.set2.player2,
          ...(matchData.tiebreak && {
            Tiebreak_Spieler1: matchData.tiebreak.player1,
            Tiebreak_Spieler2: matchData.tiebreak.player2
          }),
          Sieger: matchData.winner,
          Status: matchData.status,
          Date: new Date().toISOString().split('T')[0]
        }
      };

      const response = await airtableRequest('POST', '', airtableData);
      
      return {
        ...matchData,
        airtableId: response.id
      };
      
    } catch (error) {
      console.error('❌ Fehler beim Speichern in Airtable:', error);
      throw new Error(`Airtable Speichern fehlgeschlagen: ${error.message}`);
    }
  };

  // Delete Match from Airtable
  const deleteMatchFromAirtable = async (match) => {
    if (connectionStatus !== 'connected' || !match.airtableId) {
      return;
    }

    try {
      await airtableRequest('DELETE', match.airtableId);
    } catch (error) {
      console.error('❌ Fehler beim Löschen aus Airtable:', error);
      throw new Error(`Airtable Löschen fehlgeschlagen: ${error.message}`);
    }
  };

  // Initialize Connection and Load Data
  useEffect(() => {
    const initializeApp = async () => {
      const connected = await testAirtableConnection();
      await loadMatches();
    };

    initializeApp();
  }, []);

  useEffect(() => {
    if (connectionStatus === 'connected') {
      loadMatches();
    }
  }, [connectionStatus]);

  // Tennis Score Validation
  const validateTennisScore = useCallback((set1P1, set1P2, set2P1, set2P2, tbP1, tbP2) => {
    const errors = [];
    
    const validateSet = (p1Score, p2Score, setNumber) => {
      const s1 = parseInt(p1Score) || 0;
      const s2 = parseInt(p2Score) || 0;
      
      if (s1 < 0 || s2 < 0) {
        errors.push(`Satz ${setNumber}: Negative Werte sind nicht erlaubt`);
        return false;
      }
      
      if (s1 === 0 && s2 === 0) return true;
      
      if (s1 > 7 || s2 > 7) {
        errors.push(`Satz ${setNumber}: Maximal 7 Games pro Satz möglich`);
        return false;
      }
      
      if ((s1 === 6 && s2 <= 4) || (s2 === 6 && s1 <= 4)) return true;
      if ((s1 === 7 && s2 === 5) || (s2 === 7 && s1 === 5)) return true;
      if ((s1 === 7 && s2 === 6) || (s2 === 7 && s1 === 6)) return true;
      
      if (s1 === 6 && s2 === 6) {
        errors.push(`Satz ${setNumber}: Bei 6:6 muss ein Tiebreak gespielt werden (Ergebnis wäre dann 7:6)`);
        return false;
      }
      
      return true;
    };
    
    validateSet(set1P1, set1P2, 1);
    validateSet(set2P1, set2P2, 2);
    
    const tb1 = parseInt(tbP1) || 0;
    const tb2 = parseInt(tbP2) || 0;
    
    if (tb1 > 0 || tb2 > 0) {
      if (tb1 < 0 || tb2 < 0) {
        errors.push('Match-Tiebreak: Negative Werte sind nicht erlaubt');
      } else if (Math.max(tb1, tb2) < 10) {
        errors.push('Match-Tiebreak: Match-Tiebreak geht normalerweise bis mindestens 10 Punkte');
      } else if (Math.max(tb1, tb2) >= 10 && Math.abs(tb1 - tb2) < 2) {
        errors.push('Match-Tiebreak: Bei 10+ Punkten muss mindestens 2 Punkte Vorsprung bestehen');
      }
    }
    
    return errors;
  }, []);

  // Determine Winner
  const determineWinner = useCallback((matchData) => {
    const set1P1 = parseInt(matchData.set1Player1) || 0;
    const set1P2 = parseInt(matchData.set1Player2) || 0;
    const set2P1 = parseInt(matchData.set2Player1) || 0;
    const set2P2 = parseInt(matchData.set2Player2) || 0;
    const tbP1 = parseInt(matchData.tiebreakPlayer1) || 0;
    const tbP2 = parseInt(matchData.tiebreakPlayer2) || 0;

    const validationErrors = validateTennisScore(set1P1, set1P2, set2P1, set2P2, tbP1, tbP2);
    
    if (validationErrors.length > 0) {
      return { winner: null, errors: validationErrors };
    }

    if (set1P1 === 0 && set1P2 === 0 && set2P1 === 0 && set2P2 === 0) {
      return { winner: null, errors: ['Bitte geben Sie mindestens ein Satz-Ergebnis ein'] };
    }

    let p1Sets = 0, p2Sets = 0;
    
    if (set1P1 > 0 || set1P2 > 0) {
      if (set1P1 > set1P2) p1Sets++; else p2Sets++;
    }
    
    if (set2P1 > 0 || set2P2 > 0) {
      if (set2P1 > set2P2) p1Sets++; else p2Sets++;
    }

    if (p1Sets === 2) return { winner: matchData.player1, errors: [] };
    if (p2Sets === 2) return { winner: matchData.player2, errors: [] };

    if (p1Sets === 1 && p2Sets === 1) {
      if (tbP1 === 0 && tbP2 === 0) {
        return { winner: null, errors: ['Bei 1:1 Sätzen ist ein Match-Tiebreak erforderlich'] };
      }
      return { winner: tbP1 > tbP2 ? matchData.player1 : matchData.player2, errors: [] };
    }

    if (p1Sets === 1 && p2Sets === 0) return { winner: matchData.player1, errors: [] };
    if (p2Sets === 1 && p1Sets === 0) return { winner: matchData.player2, errors: [] };
    
    return { winner: null, errors: ['Ungültiges Match-Ergebnis'] };
  }, [validateTennisScore]);

  // KORRIGIERTE Calculate Group Table nach ITF/USTA Standard
  const calculateGroupTable = useCallback((groupName) => {
    const groupPlayers = GROUPS[groupName];
    const groupMatches = matches.filter(m => m.group === groupName && m.status === 'completed');
    
    const playerStats = {};
    groupPlayers.forEach(player => {
      playerStats[player] = {
        name: player,
        matches: 0,
        wins: 0,
        losses: 0,
        setsWon: 0,
        setsLost: 0,
        gamesWon: 0,
        gamesLost: 0,
        setDifference: 0,
        gameDifference: 0,
        setPercentage: 0,
        gamePercentage: 0
      };
    });

    groupMatches.forEach(match => {
      const p1 = match.player1;
      const p2 = match.player2;
      
      if (playerStats[p1] && playerStats[p2]) {
        playerStats[p1].matches++;
        playerStats[p2].matches++;
        
        let p1Sets = 0, p2Sets = 0;
        
        if (match.set1.player1 > match.set1.player2) p1Sets++; else p2Sets++;
        playerStats[p1].gamesWon += match.set1.player1;
        playerStats[p1].gamesLost += match.set1.player2;
        playerStats[p2].gamesWon += match.set1.player2;
        playerStats[p2].gamesLost += match.set1.player1;
        
        if (match.set2.player1 > match.set2.player2) p1Sets++; else p2Sets++;
        playerStats[p1].gamesWon += match.set2.player1;
        playerStats[p1].gamesLost += match.set2.player2;
        playerStats[p2].gamesWon += match.set2.player2;
        playerStats[p2].gamesLost += match.set2.player1;
        
        if (match.tiebreak) {
          if (match.tiebreak.player1 > match.tiebreak.player2) p1Sets++; else p2Sets++;
        }
        
        playerStats[p1].setsWon += p1Sets;
        playerStats[p1].setsLost += p2Sets;
        playerStats[p2].setsWon += p2Sets;
        playerStats[p2].setsLost += p1Sets;
        
        if (match.winner === p1) {
          playerStats[p1].wins++;
          playerStats[p2].losses++;
        } else if (match.winner === p2) {
          playerStats[p2].wins++;
          playerStats[p1].losses++;
        }
      }
    });

    Object.values(playerStats).forEach(player => {
      const totalSets = player.setsWon + player.setsLost;
      const totalGames = player.gamesWon + player.gamesLost;
      player.setDifference = player.setsWon - player.setsLost;
      player.gameDifference = player.gamesWon - player.gamesLost;
      player.setPercentage = totalSets > 0 ? (player.setsWon / totalSets * 100) : 0;
      player.gamePercentage = totalGames > 0 ? (player.gamesWon / totalGames * 100) : 0;
    });

    return Object.values(playerStats).sort((a, b) => {
      // Primär: Anzahl Siege
      if (b.wins !== a.wins) return b.wins - a.wins;
      
      // Sekundär: Satzdifferenz (nicht Prozentsatz!)
      if (b.setDifference !== a.setDifference) return b.setDifference - a.setDifference;
      
      // Tertiär: Satzprozentsatz
      if (Math.abs(b.setPercentage - a.setPercentage) > 0.1) {
        return b.setPercentage - a.setPercentage;
      }
      
      // Quaternär: Gamedifferenz
      if (b.gameDifference !== a.gameDifference) return b.gameDifference - a.gameDifference;
      
      // Final: Game-Prozentsatz
      return b.gamePercentage - a.gamePercentage;
    });
  }, [matches]);

  const getQualifiedPlayers = useMemo(() => {
    const qualified = [];
    const groupFirsts = [];
    const groupSeconds = [];
    const groupThirds = [];
    
    ['A', 'B', 'C'].forEach(groupName => {
      const table = calculateGroupTable(groupName);
      if (table.length >= 1) {
        groupFirsts.push({
          name: table[0].name,
          group: groupName,
          position: 1,
          wins: table[0].wins,
          setDifference: table[0].setDifference,
          setPercentage: table[0].setPercentage,
          setsWon: table[0].setsWon,
          setsLost: table[0].setsLost
        });
      }
      if (table.length >= 2) {
        groupSeconds.push({
          name: table[1].name,
          group: groupName,
          position: 2,
          wins: table[1].wins,
          setDifference: table[1].setDifference,
          setPercentage: table[1].setPercentage,
          setsWon: table[1].setsWon,
          setsLost: table[1].setsLost
        });
      }
      if (table.length >= 3) {
        groupThirds.push({
          name: table[2].name,
          group: groupName,
          position: 3,
          wins: table[2].wins,
          setPercentage: table[2].setPercentage,
          gamePercentage: table[2].gamePercentage,
          setDifference: table[2].setDifference,
          setsWon: table[2].setsWon,
          setsLost: table[2].setsLost
        });
      }
    });

    // Sortiere jede Positionsgruppe
    groupFirsts.sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (b.setDifference !== a.setDifference) return b.setDifference - a.setDifference;
      return b.setPercentage - a.setPercentage;
    });
    
    groupSeconds.sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (b.setDifference !== a.setDifference) return b.setDifference - a.setDifference;
      return b.setPercentage - a.setPercentage;
    });
    
groupThirds.sort((a, b) => {
  if (b.wins !== a.wins) return b.wins - a.wins;
  if (b.setDifference !== a.setDifference) return b.setDifference - a.setDifference;
  if (Math.abs(b.setPercentage - a.setPercentage) > 0.1) {
    return b.setPercentage - a.setPercentage;
  }
  return b.gamePercentage - a.gamePercentage;
});


    qualified.push(...groupFirsts);
    qualified.push(...groupSeconds);
    qualified.push(...groupThirds.slice(0, 2));

    return qualified;
  }, [calculateGroupTable]);

  // K.O. Gruppen-Verteilung
  const getKOGroups = useMemo(() => {
    if (getQualifiedPlayers.length < 8) {
      return { A: [], B: [] };
    }

    // Sortiere qualifizierte Spieler nach Position und Ranking
    const firsts = getQualifiedPlayers.filter(p => p.position === 1);
    const seconds = getQualifiedPlayers.filter(p => p.position === 2);
    const thirds = getQualifiedPlayers.filter(p => p.position === 3);

    // Verteilung auf K.O.-Gruppen (Snake-Draft für Fairness)
    const koGroupA = [];
    const koGroupB = [];

    // Verteile Gruppensieger: 1->A, 2->B, 3->A
    if (firsts[0]) koGroupA.push(firsts[0]);
    if (firsts[1]) koGroupB.push(firsts[1]);
    if (firsts[2]) koGroupA.push(firsts[2]);

    // Verteile Gruppenzweite: 1->B, 2->A, 3->B
    if (seconds[0]) koGroupB.push(seconds[0]);
    if (seconds[1]) koGroupA.push(seconds[1]);
    if (seconds[2]) koGroupB.push(seconds[2]);

    // Verteile beste Dritte: 1->A, 2->B
    if (thirds[0]) koGroupA.push(thirds[0]);
    if (thirds[1]) koGroupB.push(thirds[1]);

    return { A: koGroupA, B: koGroupB };
  }, [getQualifiedPlayers]);

  const generatePairings = (players) => {
    const pairings = [];
    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        pairings.push([players[i], players[j]]);
      }
    }
    return pairings;
  };

  // K.O. Gruppen-Tabelle berechnen
  const calculateKOGroupTable = useCallback((groupName) => {
    const groupPlayers = getKOGroups[groupName];
    if (!groupPlayers || groupPlayers.length === 0) return [];
    
    const koMatches = matches.filter(m => 
      m.phase === 'semifinal' && 
      m.koGroup === groupName && 
      m.status === 'completed'
    );
    
    const playerStats = {};
    groupPlayers.forEach(player => {
      playerStats[player.name] = {
        name: player.name,
        originalGroup: player.group,
        originalPosition: player.position,
        matches: 0,
        wins: 0,
        losses: 0,
        setsWon: 0,
        setsLost: 0,
        gamesWon: 0,
        gamesLost: 0,
        setDifference: 0,
        gameDifference: 0,
        setPercentage: 0,
        gamePercentage: 0
      };
    });

    koMatches.forEach(match => {
      const p1 = match.player1;
      const p2 = match.player2;
      
      if (playerStats[p1] && playerStats[p2]) {
        playerStats[p1].matches++;
        playerStats[p2].matches++;
        
        let p1Sets = 0, p2Sets = 0;
        
        if (match.set1.player1 > match.set1.player2) p1Sets++; else p2Sets++;
        playerStats[p1].gamesWon += match.set1.player1;
        playerStats[p1].gamesLost += match.set1.player2;
        playerStats[p2].gamesWon += match.set1.player2;
        playerStats[p2].gamesLost += match.set1.player1;
        
        if (match.set2.player1 > match.set2.player2) p1Sets++; else p2Sets++;
        playerStats[p1].gamesWon += match.set2.player1;
        playerStats[p1].gamesLost += match.set2.player2;
        playerStats[p2].gamesWon += match.set2.player2;
        playerStats[p2].gamesLost += match.set2.player1;
        
        if (match.tiebreak) {
          if (match.tiebreak.player1 > match.tiebreak.player2) p1Sets++; else p2Sets++;
        }
        
        playerStats[p1].setsWon += p1Sets;
        playerStats[p1].setsLost += p2Sets;
        playerStats[p2].setsWon += p2Sets;
        playerStats[p2].setsLost += p1Sets;
        
        if (match.winner === p1) {
          playerStats[p1].wins++;
          playerStats[p2].losses++;
        } else if (match.winner === p2) {
          playerStats[p2].wins++;
          playerStats[p1].losses++;
        }
      }
    });

    Object.values(playerStats).forEach(player => {
      const totalSets = player.setsWon + player.setsLost;
      const totalGames = player.gamesWon + player.gamesLost;
      player.setDifference = player.setsWon - player.setsLost;
      player.gameDifference = player.gamesWon - player.gamesLost;
      player.setPercentage = totalSets > 0 ? (player.setsWon / totalSets * 100) : 0;
      player.gamePercentage = totalGames > 0 ? (player.gamesWon / totalGames * 100) : 0;
    });

    return Object.values(playerStats).sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (b.setDifference !== a.setDifference) return b.setDifference - a.setDifference;
      if (Math.abs(b.setPercentage - a.setPercentage) > 0.1) {
        return b.setPercentage - a.setPercentage;
      }
      if (b.gameDifference !== a.gameDifference) return b.gameDifference - a.gameDifference;
      return b.gamePercentage - a.gamePercentage;
    });
  }, [getKOGroups, matches]);

  const KOGroupCard = ({ groupName, players }) => {
    const tableData = useMemo(() => calculateKOGroupTable(groupName), [groupName]);
    const totalMatches = generatePairings(players.map(p => p.name)).length;
    const playedMatches = matches.filter(m => 
      m.phase === 'semifinal' && 
      m.koGroup === groupName && 
      m.status === 'completed'
    ).length;
    
    return (
      <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 p-4 md:p-6 hover:shadow-2xl hover:border-blue-200 transition-all duration-300">
        <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-4 flex items-center justify-between">
          <div className="flex items-center">
            <Trophy className="mr-2 text-blue-500" size={20} />
            K.O. Gruppe {groupName}
          </div>
          <span className="text-sm text-gray-500">
            {playedMatches}/{totalMatches} Matches
          </span>
        </h3>
        
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Tabelle</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-1 text-xs font-medium text-gray-500">Platz</th>
                  <th className="text-left py-2 px-2 text-xs font-medium text-gray-500">Spieler</th>
                  <th className="text-center py-2 px-1 text-xs font-medium text-gray-500">Vorr.</th>
                  <th className="text-center py-2 px-1 text-xs font-medium text-gray-500">S</th>
                  <th className="text-center py-2 px-1 text-xs font-medium text-gray-500">N</th>
                  <th className="text-center py-2 px-1 text-xs font-medium text-gray-500">Sätze</th>
                  <th className="text-center py-2 px-1 text-xs font-medium text-gray-500">Games</th>
                </tr>
              </thead>
              <tbody>
                {tableData.map((player, index) => (
                  <tr key={player.name} className={`border-b border-gray-100 ${
                    index === 0 ? 'bg-green-50' : index === 1 ? 'bg-blue-50' : ''
                  }`}>
                    <td className="py-2 px-1 text-center">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                        index === 0 ? 'bg-yellow-500 text-white' : 
                        index === 1 ? 'bg-gray-400 text-white' : 
                        'bg-gray-200 text-gray-700'
                      }`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="py-2 px-2">
                      <div>
                        <span className="font-medium text-gray-800">{player.name}</span>
                        <span className="text-xs text-gray-500 ml-1">
                          ({player.originalGroup}{player.originalPosition})
                        </span>
                      </div>
                    </td>
                    <td className="py-2 px-1 text-center text-xs text-gray-600">
                      Gr.{player.originalGroup}
                    </td>
                    <td className="py-2 px-1 text-center font-bold text-green-600">{player.wins}</td>
                    <td className="py-2 px-1 text-center text-red-600">{player.losses}</td>
                    <td className="py-2 px-1 text-center text-gray-600 text-xs">
                      {player.setsWon}:{player.setsLost}
                    </td>
                    <td className="py-2 px-1 text-center text-gray-600 text-xs">
                      {player.gamesWon}:{player.gamesLost}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {playedMatches > 0 && (
            <div className="text-xs text-gray-500 mt-2">
              <p>🥇 Platz 1 & 2 qualifizieren sich fürs Finale</p>
            </div>
          )}
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Matches</h4>
          <div className="space-y-2">
            {generatePairings(players.map(p => p.name)).map((pairing, index) => {
              const match = matches.find(m => 
                m.phase === 'semifinal' && 
                m.koGroup === groupName &&
                ((m.player1 === pairing[0] && m.player2 === pairing[1]) || 
                 (m.player1 === pairing[1] && m.player2 === pairing[0]))
              );
              const isCompleted = match && match.status === 'completed';
              
              return (
                <div key={index} className={`p-3 rounded-lg border transition-all duration-200 ${
                  isCompleted ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-800 mb-1">
                        {pairing[0]} vs {pairing[1]}
                      </div>
                      
                      {isCompleted && match.set1 && (
                        <div className="text-sm text-gray-600">
                          <div className="flex flex-wrap items-center gap-2 md:gap-4">
                            <span className="flex items-center space-x-1">
                              <span className="text-xs text-gray-500">Satz 1:</span>
                              <span className="font-mono font-medium">
                                {match.set1.player1}:{match.set1.player2}
                              </span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <span className="text-xs text-gray-500">Satz 2:</span>
                              <span className="font-mono font-medium">
                                {match.set2.player1}:{match.set2.player2}
                              </span>
                            </span>
                            {match.tiebreak && (
                              <span className="flex items-center space-x-1">
                                <span className="text-xs text-gray-500">TB:</span>
                                <span className="font-mono font-medium">
                                  {match.tiebreak.player1}:{match.tiebreak.player2}
                                </span>
                              </span>
                            )}
                          </div>
                          <div className="mt-1 flex items-center">
                            <Trophy className="w-3 h-3 text-yellow-500 mr-1" />
                            <span className="text-xs font-medium text-gray-700">
                              Sieger: {match.winner}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <span className={`px-2 md:px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ml-3 ${
                      isCompleted 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {isCompleted ? 'Gespielt' : 'Ausstehend'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const KOBracket = ({ phase, title }) => {
    if (phase === 'semifinal') {
      if (getQualifiedPlayers.length < 8) {
        return (
          <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 p-6 hover:shadow-2xl hover:border-blue-200 transition-all duration-300">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <Trophy className="mr-2 text-blue-500" size={20} />
              {title}
            </h3>
            <div className="text-center py-12 text-gray-500">
              <Trophy className="mx-auto mb-4 opacity-30" size={48} />
              <p>Gruppenphase noch nicht abgeschlossen</p>
              <p className="text-sm mt-2">Noch {8 - getQualifiedPlayers.length} Plätze offen</p>
            </div>
          </div>
        );
      }

      // K.O.-Phase mit 2 Gruppen
      return (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <KOGroupCard groupName="A" players={getKOGroups.A} />
            <KOGroupCard groupName="B" players={getKOGroups.B} />
          </div>
        </div>
      );
    }

    // Finale
    if (phase === 'final') {
      const koGroupA = calculateKOGroupTable('A');
      const koGroupB = calculateKOGroupTable('B');
      const finalists = [];
      
      if (koGroupA.length >= 2) {
        finalists.push(koGroupA[0], koGroupA[1]);
      }
      if (koGroupB.length >= 2) {
        finalists.push(koGroupB[0], koGroupB[1]);
      }

      if (finalists.length < 4) {
        return (
          <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 p-6 hover:shadow-2xl hover:border-blue-200 transition-all duration-300">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <Trophy className="mr-2 text-blue-500" size={20} />
              {title}
            </h3>
            <div className="text-center py-12 text-gray-500">
              <Trophy className="mx-auto mb-4 opacity-30" size={48} />
              <p>K.O.-Gruppen noch nicht abgeschlossen</p>
            </div>
          </div>
        );
      }

      return (
        <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 p-6 hover:shadow-2xl hover:border-blue-200 transition-all duration-300">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <Trophy className="mr-2 text-blue-500" size={20} />
            {title}
          </h3>
          <div className="text-center py-6">
            <p className="text-gray-600 mb-4">Die Top 2 aus jeder K.O.-Gruppe spielen im Finale</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {finalists.slice(0, 4).map((player, index) => (
                <div key={index} className="bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-300 rounded-lg p-4">
                  <div className="font-semibold text-gray-800">{player.name}</div>
                  <div className="text-sm text-gray-600">
                    K.O. Gruppe {index < 2 ? 'A' : 'B'} - Platz {(index % 2) + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  const getAvailableMatches = useCallback((phase, groupOrKoGroup) => {
    if (phase === 'group') {
      const groupPlayers = GROUPS[groupOrKoGroup];
      const availableMatches = [];
      
      for (let i = 0; i < groupPlayers.length; i++) {
        for (let j = i + 1; j < groupPlayers.length; j++) {
          const player1 = groupPlayers[i];
          const player2 = groupPlayers[j];
          
          const existingMatch = matches.find(m => 
            m.group === groupOrKoGroup && 
            m.status === 'completed' &&
            ((m.player1 === player1 && m.player2 === player2) || 
             (m.player1 === player2 && m.player2 === player1))
          );
          
          if (!existingMatch || isAdminMode) {
            availableMatches.push([player1, player2, !!existingMatch]);
          }
        }
      }
      return availableMatches;
    } else if (phase === 'semifinal') {
      const koGroupPlayers = getKOGroups[groupOrKoGroup];
      if (!koGroupPlayers || koGroupPlayers.length === 0) return [];
      
      const availableMatches = [];
      const playerNames = koGroupPlayers.map(p => p.name);
      
      for (let i = 0; i < playerNames.length; i++) {
        for (let j = i + 1; j < playerNames.length; j++) {
          const player1 = playerNames[i];
          const player2 = playerNames[j];
          
          const existingMatch = matches.find(m => 
            m.phase === 'semifinal' &&
            m.koGroup === groupOrKoGroup && 
            m.status === 'completed' &&
            ((m.player1 === player1 && m.player2 === player2) || 
             (m.player1 === player2 && m.player2 === player1))
          );
          
          if (!existingMatch || isAdminMode) {
            availableMatches.push([player1, player2, !!existingMatch]);
          }
        }
      }
      return availableMatches;
    }
    return [];
  }, [matches, isAdminMode, getKOGroups]);

  const handleLogin = () => {
    if (loginPin === correctPin) {
      setIsAuthenticated(true);
      setIsAdminMode(false);
      setLoginPin('');
    } else if (loginPin === adminPin) {
      setIsAuthenticated(true);
      setIsAdminMode(true);
      setLoginPin('');
    } else {
      alert('Falsche PIN. Versuchen Sie "2025" für normalen Zugang oder "9999" für Admin-Modus.');
    }
  };

  useEffect(() => {
    if (newMatch.player1 && newMatch.player2) {
      const result = determineWinner(newMatch);
      setValidationErrors(result.errors);
    } else {
      setValidationErrors([]);
    }
  }, [newMatch, determineWinner]);

  const resetForm = () => {
    setNewMatch({
      group: 'A',
      koGroup: 'A',
      phase: 'group',
      player1: '',
      player2: '',
      set1Player1: '',
      set1Player2: '',
      set2Player1: '',
      set2Player2: '',
      tiebreakPlayer1: '',
      tiebreakPlayer2: ''
    });
    setValidationErrors([]);
  };

  const addNewMatch = async () => {
    if (!newMatch.player1 || !newMatch.player2) {
      alert('Bitte wählen Sie beide Spieler aus.');
      return;
    }

    setIsLoading(true);

    try {
      const result = determineWinner(newMatch);
      
      if (result.errors.length > 0) {
        alert('Validierungsfehler:\n\n' + result.errors.join('\n'));
        setIsLoading(false);
        return;
      }

      if (!result.winner) {
        alert('Bitte geben Sie gültige Ergebnisse ein.');
        setIsLoading(false);
        return;
      }

      const match = {
        id: nextMatchId,
        group: newMatch.phase === 'group' ? newMatch.group : undefined,
        koGroup: newMatch.phase === 'semifinal' ? newMatch.koGroup : undefined,
        phase: newMatch.phase,
        player1: newMatch.player1,
        player2: newMatch.player2,
        set1: {
          player1: parseInt(newMatch.set1Player1) || 0,
          player2: parseInt(newMatch.set1Player2) || 0
        },
        set2: {
          player1: parseInt(newMatch.set2Player1) || 0,
          player2: parseInt(newMatch.set2Player2) || 0
        },
        ...(newMatch.tiebreakPlayer1 && {
          tiebreak: {
            player1: parseInt(newMatch.tiebreakPlayer1) || 0,
            player2: parseInt(newMatch.tiebreakPlayer2) || 0
          }
        }),
        winner: result.winner,
        status: 'completed',
        timestamp: new Date().toISOString()
      };

      const savedMatch = await saveMatchToAirtable(match);
      
      setMatches(currentMatches => [...currentMatches, savedMatch]);
      setNextMatchId(nextMatchId + 1);
      
      const phaseText = match.phase === 'group' ? `Gruppe ${match.group}` : 
                       match.phase === 'semifinal' ? `K.O. Gruppe ${match.koGroup}` : 'Finale';
      
      const statusText = connectionStatus === 'connected' ? 
        '✅ In Airtable gespeichert!' : 
        '⚠️ Nur lokal gespeichert (Demo-Modus)';
      
      setSuccessMessage(
        `🎾 Match erfolgreich gespeichert!\n\n` +
        `${phaseText}\n` +
        `${match.player1} vs ${match.player2}\n` +
        `Satz 1: ${match.set1.player1}:${match.set1.player2}\n` +
        `Satz 2: ${match.set2.player1}:${match.set2.player2}` +
        (match.tiebreak ? `\nTiebreak: ${match.tiebreak.player1}:${match.tiebreak.player2}` : '') +
        `\n\n🏆 Sieger: ${match.winner}\n\n${statusText}`
      );
      setShowSuccessModal(true);
      resetForm();
      
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      alert(`Fehler beim Speichern: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteMatch = async (matchId) => {
    if (!isAdminMode) {
      alert('Nur im Admin-Modus verfügbar!');
      return;
    }

    const matchToDelete = matches.find(m => m.id === matchId);
    if (!matchToDelete) return;

    const confirmed = window.confirm('Möchten Sie dieses Match wirklich löschen?');
    if (!confirmed) return;

    setIsLoading(true);
    
    try {
      await deleteMatchFromAirtable(matchToDelete);
      
      setMatches(currentMatches => {
        const updatedMatches = currentMatches.filter(m => m.id !== matchId);
        return updatedMatches;
      });
      
      const statusText = connectionStatus === 'connected' ? 
        'Match aus Airtable gelöscht!' : 
        'Match lokal gelöscht (Demo-Modus)';
      
      setSuccessMessage(statusText);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
      alert(`Fehler beim Löschen: ${error.message}`);
    } finally {
      setTimeout(() => setIsLoading(false), 500);
    }
  };

  const retryConnection = async () => {
    setIsLoading(true);
    await testAirtableConnection();
    if (connectionStatus === 'connected') {
      await loadMatches();
    }
    setIsLoading(false);
  };

  // Components
  const ConnectionStatusCard = () => (
    <div className="mb-6 p-4 bg-white rounded-xl shadow-lg border">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700 flex items-center">
          {connectionStatus === 'connected' && <Wifi className="w-4 h-4 text-green-500 mr-2" />}
          {connectionStatus === 'disconnected' && <WifiOff className="w-4 h-4 text-red-500 mr-2" />}
          {connectionStatus === 'testing' && <RefreshCw className="w-4 h-4 text-blue-500 mr-2 animate-spin" />}
          Airtable Status
        </h3>
        <button
          onClick={retryConnection}
          disabled={isLoading || connectionStatus === 'testing'}
          className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors disabled:opacity-50"
        >
          Erneut versuchen
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Verbindung:</span>
          <span className={`font-medium ${
            connectionStatus === 'connected' ? 'text-green-600' : 
            connectionStatus === 'disconnected' ? 'text-red-600' : 'text-blue-600'
          }`}>
            {connectionStatus === 'connected' ? 'Verbunden' : 
             connectionStatus === 'disconnected' ? 'Getrennt' : 'Teste...'}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Modus:</span>
          <span className={`font-medium ${
            connectionStatus === 'connected' ? 'text-green-600' : 'text-yellow-600'
          }`}>
            {connectionStatus === 'connected' ? 'Produktiv' : 'Demo'}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Matches:</span>
          <span className="font-medium text-gray-800">{matches.length}</span>
        </div>
      </div>

      {errorMessage && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <h4 className="text-red-800 font-medium mb-1">Verbindungsfehler:</h4>
          <p className="text-red-700 text-sm">{errorMessage}</p>
        </div>
      )}

      {connectionStatus === 'disconnected' && !errorMessage && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="text-yellow-800 font-medium mb-2">⚠️ Demo-Modus aktiv</h4>
          <ul className="text-yellow-700 text-sm space-y-1">
            <li>• Daten werden nur lokal gespeichert</li>
            <li>• Beim Neuladen gehen Daten verloren</li>
            <li>• Konfigurieren Sie Airtable für permanente Speicherung</li>
          </ul>
        </div>
      )}
    </div>
  );

  const ValidationAlert = ({ errors }) => {
    if (errors.length === 0) return null;

    return (
      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-start space-x-2">
          <AlertTriangle className="text-red-500 mt-0.5 flex-shrink-0" size={18} />
          <div>
            <h4 className="text-red-800 font-medium mb-2">Eingabe-Probleme:</h4>
            <ul className="text-red-700 text-sm space-y-1">
              {errors.map((error, index) => (
                <li key={index} className="flex items-start space-x-1">
                  <span className="text-red-500">•</span>
                  <span>{error}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  };

  const SuccessModal = () => {
    if (!showSuccessModal) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowSuccessModal(false)}>
        <div className="bg-white rounded-2xl p-8 max-w-md mx-4 shadow-2xl transform">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-4">Erfolgreich!</h3>
            <p className="text-gray-600 whitespace-pre-line mb-6">
              {successMessage}
            </p>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full bg-green-500 text-white py-3 rounded-xl font-medium hover:bg-green-600 transition-colors"
            >
              Super! 🎾
            </button>
          </div>
        </div>
      </div>
    );
  };

  const TabButton = ({ id, label, icon: Icon, isActive, onClick }) => (
    <button
      onClick={onClick}
      className={`flex items-center space-x-2 px-4 md:px-6 py-2 md:py-3 rounded-full transition-all duration-300 ${
        isActive 
          ? 'bg-blue-500 text-white shadow-lg transform scale-105' 
          : 'bg-white text-gray-600 hover:bg-gray-50 shadow-md hover:shadow-lg'
      }`}
    >
      <Icon size={18} />
      <span className="font-medium hidden sm:inline">{label}</span>
    </button>
  );

  const GroupCard = ({ groupName, players }) => {
    const tableData = useMemo(() => calculateGroupTable(groupName), [groupName, calculateGroupTable]);
    const totalMatches = generatePairings(players).length;
    const playedMatches = matches.filter(m => m.group === groupName && m.status === 'completed').length;
    
    return (
      <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 p-4 md:p-6 hover:shadow-2xl hover:border-blue-200 transition-all duration-300">
        <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-4 flex items-center justify-between">
          <div className="flex items-center">
            <Users className="mr-2 text-blue-500" size={20} />
            Gruppe {groupName}
          </div>
          <span className="text-sm text-gray-500">
            {playedMatches}/{totalMatches} Matches
          </span>
        </h3>
        
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Tabelle</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-1 text-xs font-medium text-gray-500">Platz</th>
                  <th className="text-left py-2 px-2 text-xs font-medium text-gray-500">Spieler</th>
                  <th className="text-center py-2 px-1 text-xs font-medium text-gray-500">S</th>
                  <th className="text-center py-2 px-1 text-xs font-medium text-gray-500">N</th>
                  <th className="text-center py-2 px-1 text-xs font-medium text-gray-500">Sätze</th>
                  <th className="text-center py-2 px-1 text-xs font-medium text-gray-500">+/-</th>
                  <th className="text-center py-2 px-1 text-xs font-medium text-gray-500">Games</th>
                </tr>
              </thead>
              <tbody>
                {tableData.map((player, index) => (
                  <tr key={player.name} className={`border-b border-gray-100 ${
                    index === 0 ? 'bg-green-50' : index === 2 ? 'bg-yellow-50' : ''
                  }`}>
                    <td className="py-2 px-1 text-center">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                        index === 0 ? 'bg-yellow-500 text-white' : 
                        index === 1 ? 'bg-gray-400 text-white' : 
                        index === 2 ? 'bg-orange-400 text-white' : 
                        'bg-gray-200 text-gray-700'
                      }`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="py-2 px-2 font-medium text-gray-800">{player.name}</td>
                    <td className="py-2 px-1 text-center font-bold text-green-600">{player.wins}</td>
                    <td className="py-2 px-1 text-center text-red-600">{player.losses}</td>
                    <td className="py-2 px-1 text-center text-gray-600 text-xs">
                      {player.setsWon}:{player.setsLost}
                    </td>
                    <td className="py-2 px-1 text-center text-gray-600 text-xs font-medium">
                      {player.setDifference > 0 ? '+' : ''}{player.setDifference}
                    </td>
                    <td className="py-2 px-1 text-center text-gray-600 text-xs">
                      {player.gamesWon}:{player.gamesLost}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {playedMatches > 0 && (
            <div className="text-xs text-gray-500 mt-2 space-y-1">
              <p>🥇 1. Platz • 🥈 2. Platz • 🥉 3. Platz • 8 beste Spieler qualifiziert</p>
              <p>📊 Ranking: Siege → Satzdifferenz → Satz% → Game%</p>
            </div>
          )}
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Matches</h4>
          <div className="space-y-2">
            {generatePairings(players).map((pairing, index) => {
              const match = matches.find(m => 
                m.group === groupName && 
                ((m.player1 === pairing[0] && m.player2 === pairing[1]) || 
                 (m.player1 === pairing[1] && m.player2 === pairing[0]))
              );
              const isCompleted = match && match.status === 'completed';
              
              return (
                <div key={index} className={`p-3 rounded-lg border transition-all duration-200 ${
                  isCompleted ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-800 mb-1">
                        {pairing[0]} vs {pairing[1]}
                      </div>
                      
                      {isCompleted && match.set1 && (
                        <div className="text-sm text-gray-600">
                          <div className="flex flex-wrap items-center gap-2 md:gap-4">
                            <span className="flex items-center space-x-1">
                              <span className="text-xs text-gray-500">Satz 1:</span>
                              <span className="font-mono font-medium">
                                {match.set1.player1}:{match.set1.player2}
                              </span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <span className="text-xs text-gray-500">Satz 2:</span>
                              <span className="font-mono font-medium">
                                {match.set2.player1}:{match.set2.player2}
                              </span>
                            </span>
                            {match.tiebreak && (
                              <span className="flex items-center space-x-1">
                                <span className="text-xs text-gray-500">TB:</span>
                                <span className="font-mono font-medium">
                                  {match.tiebreak.player1}:{match.tiebreak.player2}
                                </span>
                              </span>
                            )}
                          </div>
                          <div className="mt-1 flex items-center">
                            <Trophy className="w-3 h-3 text-yellow-500 mr-1" />
                            <span className="text-xs font-medium text-gray-700">
                              Sieger: {match.winner}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <span className={`px-2 md:px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ml-3 ${
                      isCompleted 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {isCompleted ? 'Gespielt' : 'Ausstehend'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const AdminMatchList = () => {
    const allMatches = [...matches].sort((a, b) => {
      const phaseOrder = { 'group': 1, 'semifinal': 2, 'final': 3 };
      return phaseOrder[a.phase] - phaseOrder[b.phase] || a.id - b.id;
    });

    const getPhaseTitle = (match) => {
      if (match.phase === 'group') return `Gruppe ${match.group}`;
      if (match.phase === 'semifinal') return `K.O. Gruppe ${match.koGroup}`;
      if (match.phase === 'final') return 'Finale';
      return 'Unbekannt';
    };

    return (
      <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6">
        <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-6 flex items-center">
          <Settings className="mr-2 text-blue-500" size={20} />
          Alle Matches verwalten ({allMatches.length})
        </h3>
        
        {allMatches.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Trophy className="mx-auto mb-4 opacity-30" size={48} />
            <p>Noch keine Matches vorhanden</p>
          </div>
        ) : (
          <div className="space-y-3">
            {allMatches.map(match => (
              <div key={match.id} className="border border-gray-200 rounded-lg p-3 md:p-4 hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                        {getPhaseTitle(match)}
                      </span>
                      <span className="font-medium text-gray-800">
                        {match.player1} vs {match.player2}
                      </span>
                      {match.airtableId && connectionStatus === 'connected' && (
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">
                          Airtable
                        </span>
                      )}
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center space-x-1">
                          <span className="text-xs text-gray-500">Satz 1:</span>
                          <span className="font-mono font-medium">
                            {match.set1.player1}:{match.set1.player2}
                          </span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <span className="text-xs text-gray-500">Satz 2:</span>
                          <span className="font-mono font-medium">
                            {match.set2.player1}:{match.set2.player2}
                          </span>
                        </span>
                        {match.tiebreak && (
                          <span className="flex items-center space-x-1">
                            <span className="text-xs text-gray-500">TB:</span>
                            <span className="font-mono font-medium">
                              {match.tiebreak.player1}:{match.tiebreak.player2}
                            </span>
                          </span>
                        )}
                        <span className="flex items-center space-x-1">
                          <Trophy className="w-3 h-3 text-yellow-500" />
                          <span className="text-xs font-medium">
                            {match.winner}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => deleteMatch(match.id)}
                      disabled={isLoading}
                      className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                      title="Match löschen"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Main render content - Part 1
  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div>
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-light text-gray-800 mb-6">
                Vereinsmeisterschaft 2025 TV Reicheneck
              </h1>
              <div className="flex flex-col md:flex-row items-center justify-center space-y-2 md:space-y-0 md:space-x-6 text-gray-600">
                <div className="flex items-center">
                  <MapPin className="mr-2" size={18} />
                  <span>TV Reicheneck</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="mr-2" size={18} />
                  <span>Vorrunde bis 30. Juni 2025</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="mr-2" size={18} />
                  <span>Endrunde bis 31. Juli 2025</span>
                </div>
              </div>
              <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed px-4">
                Willkommen zur diesjährigen Vereinsmeisterschaft! 12 Spieler treten in 3 Gruppen gegeneinander an. 
                Die Endrunde spielen 8 Spieler. Jeweils die 2 Besten aus den 3 Gruppen plus die 2 besten 3ten aus allen Gruppen.
                Gespielt wird im Best-of-3-Format mit Match-Tiebreak bei 1:1 Sätzen.
              </p>
            </div>
            

            <div className="space-y-12 mb-24 md:mb-32">

            <div className="space-y-12 mb-16 md:mb-20">

              <h2 className="text-xl md:text-2xl font-light text-gray-800 text-center mb-8 md:mb-10">K.O.-Phase</h2>

              <KOBracket phase="semifinal" title="K.O.-Gruppen" />

              <div className="mt-12">
                <KOBracket phase="final" title="Finale" />
              </div>
            </div>


            <div className="pt-12 md:pt-16 border-t-2 border-gray-200">

            <div className="pt-8 md:pt-12 border-t-2 border-gray-200">

              <h2 className="text-xl md:text-2xl font-light text-gray-800 mb-8 md:mb-10 text-center">Gruppenphase</h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 md:gap-12 lg:gap-16">
                {Object.entries(GROUPS).map(([groupName, players]) => (
                  <GroupCard key={groupName} groupName={groupName} players={players} />
                ))}
              </div>
            </div>
          </div>
        );

      case 'groups':
        return (
          <div>
            <h2 className="text-2xl md:text-3xl font-light text-gray-800 mb-8 text-center">Gruppenphase</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
              {Object.entries(GROUPS).map(([groupName, players]) => (
                <GroupCard key={groupName} groupName={groupName} players={players} />
              ))}
            </div>
          </div>
        );

      case 'semifinal':
        return (
          <div>
            <h2 className="text-2xl md:text-3xl font-light text-gray-800 mb-8 text-center">Endrunde</h2>
            <div className="max-w-4xl mx-auto">
              <KOBracket phase="semifinal" title="Endrunde" />
              
              {getQualifiedPlayers.length >= 8 && (
                <div className="mt-8 bg-white rounded-2xl shadow-lg p-4 md:p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Qualifizierte Spieler (8)</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Alle Gruppensieger (3)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {getQualifiedPlayers.filter(p => p.position === 1).map((player, index) => (
                          <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                            <div className="font-medium text-gray-800">{player.name}</div>
                            <div className="text-xs text-gray-600">
                              Gruppe {player.group} • 1. Platz ({player.wins} Siege, {player.setDifference > 0 ? '+' : ''}{player.setDifference} Sätze)
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Alle Gruppenzweiten (3)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {getQualifiedPlayers.filter(p => p.position === 2).map((player, index) => (
                          <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                            <div className="font-medium text-gray-800">{player.name}</div>
                            <div className="text-xs text-gray-600">
                              Gruppe {player.group} • 2. Platz ({player.wins} Siege, {player.setDifference > 0 ? '+' : ''}{player.setDifference} Sätze)
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">2 Beste Gruppendritten</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {getQualifiedPlayers.filter(p => p.position === 3).map((player, index) => (
                          <div key={index} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                            <div className="font-medium text-gray-800">{player.name}</div>
                            <div className="text-xs text-gray-600">

                              Gruppe {player.group} • 3. Platz ({player.wins} Siege, {player.setPercentage.toFixed(0)}% Sätze, {player.gamePercentage.toFixed(0)}% Games)

                              Gruppe {player.group} • 3. Platz ({player.wins} Siege, {player.setDifference > 0 ? '+' : ''}{player.setDifference} Sätze)

                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'final':
        return (
          <div>
            <h2 className="text-2xl md:text-3xl font-light text-gray-800 mb-8 text-center">Finale</h2>
            <div className="max-w-lg mx-auto">
              <KOBracket phase="final" title="Finale" />
            </div>
          </div>
        );

      case 'rules':
        return (
          <div>
            <h2 className="text-2xl md:text-3xl font-light text-gray-800 mb-8 text-center">🎾 Regelwerk</h2>
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-gray-800">Tennis Vereinsmeisterschaft 2025 - TV Reicheneck</h3>
            </div>
            
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
                <h3 className="text-xl font-semibold text-green-800 mb-4 flex items-center">
                  <span className="text-green-600 mr-2">✅</span>
                  Turnier-Ranking System
                </h3>
                <p className="text-green-700 mb-4">
                  Diese App verwendet ein optimiertes Ranking-System für Gruppenturniere:
                </p>
                <div className="space-y-3">
                  <div className="flex items-start p-3 bg-white rounded-lg border border-green-100">
                    <span className="text-green-500 mr-3 mt-0.5 text-lg">1️⃣</span>
                    <span className="text-gray-700"><strong>Match-Siege:</strong> Anzahl gewonnener Matches (wichtigster Faktor)</span>
                  </div>
                  <div className="flex items-start p-3 bg-white rounded-lg border border-green-100">
                    <span className="text-green-500 mr-3 mt-0.5 text-lg">2️⃣</span>
                    <span className="text-gray-700"><strong>Satzdifferenz:</strong> Gewonnene minus verlorene Sätze</span>
                  </div>
                  <div className="flex items-start p-3 bg-white rounded-lg border border-green-100">
                    <span className="text-green-500 mr-3 mt-0.5 text-lg">3️⃣</span>
                    <span className="text-gray-700"><strong>Satz-Prozentsatz:</strong> % gewonnener Sätze von allen gespielten</span>
                  </div>
                  <div className="flex items-start p-3 bg-white rounded-lg border border-green-100">
                    <span className="text-green-500 mr-3 mt-0.5 text-lg">4️⃣</span>
                    <span className="text-gray-700"><strong>Game-Differenz:</strong> Gewonnene minus verlorene Games</span>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800 text-sm">
                    <strong>Hinweis:</strong> Die Satzdifferenz ist bei Tennis-Gruppenturnieren das übliche zweite Kriterium nach den Siegen.
                  </p>
                </div>
              </div>

              {/* Vollständiges Regelwerk */}
              <div className="bg-white rounded-2xl shadow-lg p-6 space-y-8">
                
                <div>
                  <h3 className="text-xl font-semibold text-blue-800 mb-4 flex items-center">
                    <span className="text-blue-600 mr-2">📋</span>
                    1. Turniermodus und Teilnehmer
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-800 mb-2">1.1 Teilnehmerzahl</h4>
                      <ul className="text-blue-700 text-sm space-y-1 list-none">
                        <li>• 12 Spieler nehmen an der Vereinsmeisterschaft teil</li>
                        <li>• Anmeldeschluss: 25. Mai 2025</li>
                      </ul>
                    </div>
                    
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-800 mb-2">1.2 Gruppeneinteilung</h4>
                      <ul className="text-blue-700 text-sm space-y-1 list-none">
                        <li>• 3 Gruppen mit je 4 Spielern</li>
                        <li>• <strong>Gruppe A:</strong> Henning, Julia, Fabi, Michael</li>
                        <li>• <strong>Gruppe B:</strong> Markus, Thomas, Gunter, Bernd</li>
                        <li>• <strong>Gruppe C:</strong> Sascha, Herbert, Sven, Jose</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-green-800 mb-4 flex items-center">
                    <span className="text-green-600 mr-2">🗓️</span>
                    2. Turnierablauf
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="bg-green-50 rounded-lg p-4">
                      <h4 className="font-semibold text-green-800 mb-2">2.1 Gruppenphase</h4>
                      <p className="text-yellow-700 text-sm mb-2"><strong>Match-Tiebreak:</strong></p>
                      <ul className="text-yellow-700 text-sm space-y-1 list-none">
                        <li>• Bei 1:1 Sätzen → Match-Tiebreak bis 10 Punkte</li>
                        <li>• Mindestens 2 Punkte Vorsprung erforderlich</li>
                        <li>• Ersetzt den dritten Satz</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-purple-800 mb-4 flex items-center">
                    <span className="text-purple-600 mr-2">📊</span>
                    4. Punktesystem
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="bg-purple-50 rounded-lg p-4">
                      <h4 className="font-semibold text-purple-800 mb-2">4.1 Gruppenpunkte</h4>
                      <ul className="text-purple-700 text-sm space-y-1 list-none">
                        <li>• <strong>Sieg:</strong> 2 Punkte</li>
                        <li>• <strong>Niederlage:</strong> 1 Punkt (Teilnahme-Bonus)</li>
                        <li>• <strong>Nicht angetreten:</strong> 0 Punkte</li>
                      </ul>
                    </div>
                    
                    <div className="bg-purple-50 rounded-lg p-4">
                      <h4 className="font-semibold text-purple-800 mb-2">4.2 Tabellenplatz-Ermittlung</h4>
                      <p className="text-purple-700 text-sm mb-2">Reihenfolge bei gleicher Anzahl von Siegen:</p>
                      <ol className="text-purple-700 text-sm space-y-1 list-none">
                        <li>1. Satzdifferenz (gewonnene minus verlorene Sätze)</li>
                        <li>2. Satz-Prozentsatz (% gewonnener Sätze)</li>
                        <li>3. Game-Differenz (gewonnene minus verlorene Games)</li>
                        <li>4. Game-Prozentsatz (% gewonnener Games)</li>
                      </ol>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-red-800 mb-4 flex items-center">
                    <span className="text-red-600 mr-2">📅</span>
                    6. Termine und Fristen
                  </h3>
                  
                  <div className="bg-red-50 rounded-lg p-4">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-red-200">
                            <th className="text-left py-2 text-red-800">Phase</th>
                            <th className="text-left py-2 text-red-800">Zeitraum</th>
                            <th className="text-left py-2 text-red-800">Frist</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-red-100">
                            <td className="py-2 text-red-700">Anmeldung</td>
                            <td className="py-2 text-red-700">Bis 25. Mai 2025</td>
                            <td className="py-2 text-red-700">Verbindlich</td>
                          </tr>
                          <tr className="border-b border-red-100">
                            <td className="py-2 text-red-700">Gruppenphase</td>
                            <td className="py-2 text-red-700">26. Mai - 30. Juni 2025</td>
                            <td className="py-2 text-red-700">Alle Spiele</td>
                          </tr>
                          <tr>
                            <td className="py-2 text-red-700">Endrunde</td>
                            <td className="py-2 text-red-700">1. - 31. Juli 2025</td>
                            <td className="py-2 text-red-700">Alle K.O.-Spiele</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    
                    <div className="mt-4">
                      <h4 className="font-semibold text-red-800 mb-2">Terminvereinbarung</h4>
                      <ul className="text-red-700 text-sm space-y-1 list-none">
                        <li>• Eigenverantwortlich zwischen den Spielern</li>
                        <li>• Spiele können täglich zwischen 8:00 und 22:00 Uhr stattfinden</li>
                        <li>• Absagen: Mindestens 24h vorher (außer Krankheit/Notfall)</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-indigo-800 mb-4 flex items-center">
                    <span className="text-indigo-600 mr-2">📝</span>
                    8. Ergebnismeldung
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="bg-indigo-50 rounded-lg p-4">
                      <h4 className="font-semibold text-indigo-800 mb-2">8.1 Meldepflicht</h4>
                      <ul className="text-indigo-700 text-sm space-y-1 list-none">
                        <li>• Sofort nach Spielende in die App eintragen</li>
                        <li>• Format: Satz 1, Satz 2, (Match-Tiebreak falls nötig)</li>
                      </ul>
                    </div>
                    
                    <div className="bg-indigo-50 rounded-lg p-4">
                      <h4 className="font-semibold text-indigo-800 mb-2">8.2 Protest und Einsprüche</h4>
                      <ul className="text-indigo-700 text-sm space-y-1 list-none">
                        <li>• Einspruchsfrist: 24 Stunden nach Ergebniseintragung</li>
                        <li>• Entscheidung binnen 48 Stunden</li>
                        <li>• Bei Unregelmäßigkeiten: Match wird wiederholt</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                    <span className="text-gray-600 mr-2">🏆</span>
                    9. Preise und Ehrungen
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-800 mb-2">9.1 Siegerehrung</h4>
                      <ul className="text-gray-700 text-sm space-y-1 list-none">
                        <li>• <strong>Termin:</strong> Direkt nach dem Finale</li>
                        <li>• <strong>Ort:</strong> Vereinsheim TV Reicheneck</li>
                      </ul>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-800 mb-2">9.2 Preise</h4>
                      <ul className="text-gray-700 text-sm space-y-1 list-none">
                        <li>• <strong>1. Platz:</strong> Wanderpokal + Sachpreis</li>
                        <li>• <strong>2. Platz:</strong> Sachpreis</li>
                        <li>• <strong>3. Platz:</strong> Sachpreis</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-orange-800 mb-4 flex items-center">
                    <span className="text-orange-600 mr-2">⚠️</span>
                    10. Besondere Bestimmungen
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="bg-orange-50 rounded-lg p-4">
                      <h4 className="font-semibold text-orange-800 mb-2">10.1 Verletzung/Krankheit</h4>
                      <ul className="text-orange-700 text-sm space-y-1 list-none">
                        <li>• Vor Turnierbeginn: Nachrückerregelung möglich</li>
                        <li>• Während der Gruppenphase: Restliche Spiele werden als 0:2-Niederlagen gewertet</li>
                        <li>• Während der Endrunde: Gegner kommt eine Runde weiter</li>
                      </ul>
                    </div>
                    
                    <div className="bg-orange-50 rounded-lg p-4">
                      <h4 className="font-semibold text-orange-800 mb-2">10.3 Schiedsrichter</h4>
                      <ul className="text-orange-700 text-sm space-y-1 list-none">
                        <li>• Selbst-Schiedsrichterei (jeder Spieler pfeift selbst)</li>
                        <li>• Bei umstrittenen Entscheidungen: Punkt wiederholen</li>
                        <li>• Streitfälle: Turnierleitung hinzuziehen</li>
                      </ul>
                    </div>
                    
                    <div className="bg-orange-50 rounded-lg p-4">
                      <h4 className="font-semibold text-orange-800 mb-2">10.4 Wetter</h4>
                      <ul className="text-orange-700 text-sm space-y-1 list-none">
                        <li>• Regen: Spiel wird unterbrochen, Fortsetzung möglich</li>
                        <li>• Sturm/Gewitter: Sofortiger Spielabbruch</li>
                        <li>• Extremhitze: Schatten-/Trinkpausen nach jedem Satz</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-teal-800 mb-4 flex items-center">
                    <span className="text-teal-600 mr-2">📞</span>
                    11. Kontakt und Organisation
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="bg-teal-50 rounded-lg p-4">
                      <h4 className="font-semibold text-teal-800 mb-2">11.1 Turnierleitung</h4>
                      <ul className="text-teal-700 text-sm space-y-1 list-none">
                        <li>• <strong>Telefon:</strong> 01622303210</li>
                        <li>• <strong>E-Mail:</strong> markus.vaitl@gmx.de</li>
                        <li>• <strong>Erreichbarkeit:</strong> Täglich 18:00-20:00 Uhr</li>
                      </ul>
                    </div>
                    
                    <div className="bg-teal-50 rounded-lg p-4">
                      <h4 className="font-semibold text-teal-800 mb-2">11.3 Notfall-Kontakt</h4>
                      <ul className="text-teal-700 text-sm space-y-1 list-none">
                        <li>• Bei Verletzungen: Sofort <strong>112</strong> anrufen</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-100 border border-blue-300 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-blue-800 mb-4 flex items-center">
                    <span className="text-blue-600 mr-2">✅</span>
                    12. Teilnahme-Bestätigung
                  </h3>
                  <p className="text-blue-700 mb-3">Mit der Anmeldung zur Vereinsmeisterschaft bestätigen alle Teilnehmer:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <p className="text-blue-700 text-sm">✅ Kenntnis und Anerkennung dieses Regelwerks</p>
                      <p className="text-blue-700 text-sm">✅ Eigenverantwortliche Terminvereinbarung</p>
                      <p className="text-blue-700 text-sm">✅ Pünktliche und korrekte Ergebnismeldung</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-blue-700 text-sm">✅ Fair Play und sportliches Verhalten</p>
                      <p className="text-blue-700 text-sm">✅ Teilnahme an eigene Kosten (Platzmiete, Bälle)</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center py-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">🏆 Viel Erfolg bei der Vereinsmeisterschaft 2025!</h2>
                <p className="text-lg text-gray-600 mb-4">Möge der/die Beste gewinnen! 🎾</p>
                <div className="bg-gray-50 rounded-lg p-4 inline-block">
                  <p className="text-sm text-gray-600">
                    <strong>Stand:</strong> Juni 2025 | <strong>TV Reicheneck</strong><br/>
                    Änderungen vorbehalten | Bei Fragen wenden Sie sich an die Turnierleitung
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'entry':
        return (
          <div>
            <h2 className="text-2xl md:text-3xl font-light text-gray-800 mb-8 text-center">Ergebnis eintragen</h2>
            
            {!isAuthenticated ? (
              <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-6 md:p-8">
                <div className="text-center mb-6">
                  <User className="mx-auto mb-4 text-blue-500" size={48} />
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Anmeldung erforderlich</h3>
                  <p className="text-gray-600">Bitte geben Sie die PIN ein, um Ergebnisse einzutragen.</p>
                </div>
                <div className="space-y-4">
                  <input
                    type="password"
                    placeholder="PIN eingeben"
                    value={loginPin}
                    onChange={(e) => setLoginPin(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                  />
                  <button
                    onClick={handleLogin}
                    className="w-full bg-blue-500 text-white py-3 rounded-xl font-medium hover:bg-blue-600 transition-colors"
                  >
                    Anmelden
                  </button>
                </div>
              </div>
            ) : (
              <div className="max-w-2xl mx-auto space-y-8">
                <ConnectionStatusCard />
                
                {isAdminMode && <AdminMatchList />}
                
                <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
                  <div className="mb-6 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {isAdminMode ? 'Admin-Modus' : 'Standard-Modus'}
                    </h3>
                    <button
                      onClick={() => {
                        setIsAuthenticated(false);
                        setIsAdminMode(false);
                        resetForm();
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Abmelden
                    </button>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Phase</label>
                        <select
                          value={newMatch.phase}
                          onChange={(e) => {
                            const phase = e.target.value;
                            setNewMatch({
                              ...newMatch, 
                              phase,
                              group: phase === 'group' ? 'A' : newMatch.group,
                              koGroup: phase === 'semifinal' ? 'A' : newMatch.koGroup,
                              player1: '',
                              player2: ''
                            });
                          }}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="group">Gruppenphase</option>
                          {getQualifiedPlayers.length >= 8 && (
                            <option value="semifinal">K.O.-Gruppen</option>
                          )}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {newMatch.phase === 'group' ? 'Gruppe' : 'K.O. Gruppe'}
                        </label>
                        <select
                          value={newMatch.phase === 'group' ? newMatch.group : newMatch.koGroup}
                          onChange={(e) => {
                            if (newMatch.phase === 'group') {
                              setNewMatch({...newMatch, group: e.target.value, player1: '', player2: ''});
                            } else {
                              setNewMatch({...newMatch, koGroup: e.target.value, player1: '', player2: ''});
                            }
                          }}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                        >
                          {newMatch.phase === 'group' ? (
                            <>
                              <option value="A">Gruppe A</option>
                              <option value="B">Gruppe B</option>
                              <option value="C">Gruppe C</option>
                            </>
                          ) : (
                            <>
                              <option value="A">K.O. Gruppe A</option>
                              <option value="B">K.O. Gruppe B</option>
                            </>
                          )}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Spielpaarung</label>
                      <select
                        value={`${newMatch.player1}-${newMatch.player2}`}
                        onChange={(e) => {
                          const [p1, p2] = e.target.value.split('-');
                          setNewMatch({...newMatch, player1: p1, player2: p2});
                        }}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="-">Wählen Sie ein Match...</option>
                        {getAvailableMatches(
                          newMatch.phase, 
                          newMatch.phase === 'group' ? newMatch.group : newMatch.koGroup
                        ).map(([p1, p2, played], index) => (
                          <option key={index} value={`${p1}-${p2}`}>
                            {p1} vs {p2} {played && isAdminMode ? '⚠️ (bereits gespielt!)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-4">
                      <div className="text-center">
                        <h4 className="text-lg font-medium text-gray-800 mb-4">
                          {newMatch.player1 && newMatch.player2 ? 
                            `${newMatch.player1} vs ${newMatch.player2}` : 
                            'Wählen Sie zuerst die Spieler'
                          }
                        </h4>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2 text-center">Satz 1</label>
                          <div className="flex items-center justify-center space-x-2">
                            <input
                              type="number"
                              placeholder="0"
                              min="0"
                              max="7"
                              value={newMatch.set1Player1}
                              onChange={(e) => setNewMatch({...newMatch, set1Player1: e.target.value})}
                              className="w-16 px-2 py-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-gray-500 font-bold">:</span>
                            <input
                              type="number"
                              placeholder="0"
                              min="0"
                              max="7"
                              value={newMatch.set1Player2}
                              onChange={(e) => setNewMatch({...newMatch, set1Player2: e.target.value})}
                              className="w-16 px-2 py-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2 text-center">Satz 2</label>
                          <div className="flex items-center justify-center space-x-2">
                            <input
                              type="number"
                              placeholder="0"
                              min="0"
                              max="7"
                              value={newMatch.set2Player1}
                              onChange={(e) => setNewMatch({...newMatch, set2Player1: e.target.value})}
                              className="w-16 px-2 py-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-gray-500 font-bold">:</span>
                            <input
                              type="number"
                              placeholder="0"
                              min="0"
                              max="7"
                              value={newMatch.set2Player2}
                              onChange={(e) => setNewMatch({...newMatch, set2Player2: e.target.value})}
                              className="w-16 px-2 py-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                          Match-Tiebreak (bei 1:1 Sätzen)
                        </label>
                        <div className="flex items-center justify-center space-x-2">
                          <input
                            type="number"
                            placeholder="0"
                            min="0"
                            max="15"
                            value={newMatch.tiebreakPlayer1}
                            onChange={(e) => setNewMatch({...newMatch, tiebreakPlayer1: e.target.value})}
                            className="w-16 px-2 py-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-gray-500 font-bold">:</span>
                          <input
                            type="number"
                            placeholder="0"
                            min="0"
                            max="15"
                            value={newMatch.tiebreakPlayer2}
                            onChange={(e) => setNewMatch({...newMatch, tiebreakPlayer2: e.target.value})}
                            className="w-16 px-2 py-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>

                    <ValidationAlert errors={validationErrors} />

                    <button
                      onClick={addNewMatch}
                      disabled={!newMatch.player1 || !newMatch.player2 || validationErrors.length > 0 || isLoading}
                      className={`w-full py-4 rounded-xl font-medium flex items-center justify-center space-x-2 transition-all duration-200 ${
                        (!newMatch.player1 || !newMatch.player2 || validationErrors.length > 0 || isLoading)
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-green-500 text-white hover:bg-green-600'
                      }`}
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw size={20} className="animate-spin" />
                          <span>Speichert...</span>
                        </>
                      ) : (
                        <>
                          <Plus size={20} />
                          <span>Ergebnis speichern</span>
                        </>
                      )}
                    </button>

                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="text-blue-800 font-medium mb-2">📊 Turnier-Ranking System:</h4>
                      <ul className="text-blue-700 text-sm space-y-1 list-none">
                        <li>• <strong>1. Match-Siege:</strong> Anzahl gewonnener Matches</li>
                        <li>• <strong>2. Satzdifferenz:</strong> Gewonnene minus verlorene Sätze</li>
                        <li>• <strong>3. Satz-Prozentsatz:</strong> % gewonnener Sätze</li>
                        <li>• <strong>4. Game-Differenz:</strong> Gewonnene minus verlorene Games</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

return (
  <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
    <div className="container mx-auto px-4 py-6 md:py-8">
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
            id="rules"
            label="Regelwerk"
            icon={FileText}
            isActive={activeTab === 'rules'}
            onClick={() => setActiveTab('rules')}
          />
          <TabButton
            id="entry"  
            label="Eingabe"
            icon={Plus}
            isActive={activeTab === 'entry'}
            onClick={() => setActiveTab('entry')}
          />
        </nav>

        <main>{renderContent()}</main>
        
              <SuccessModal />
    </div> 
    {/* ← schließt .container */}
</div> 
    {/* schließt min-h-screen */}
);
};

export default TennisChampionship;
