 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/src/components/TennisChampionship.jsx b/src/components/TennisChampionship.jsx
index fa6a7a31d5aa77ad80fd6adfa1cc4f38694185dd..cbc3dca0128adc389bac894394d68a239f11c0b7 100644
--- a/src/components/TennisChampionship.jsx
+++ b/src/components/TennisChampionship.jsx
@@ -1,47 +1,48 @@
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
     phase: 'group',
+    round: 'group',
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
diff --git a/src/components/TennisChampionship.jsx b/src/components/TennisChampionship.jsx
index fa6a7a31d5aa77ad80fd6adfa1cc4f38694185dd..cbc3dca0128adc389bac894394d68a239f11c0b7 100644
--- a/src/components/TennisChampionship.jsx
+++ b/src/components/TennisChampionship.jsx
@@ -485,101 +486,165 @@ const TennisChampionship = () => {
       if (b.wins !== a.wins) return b.wins - a.wins;
       return b.setPercentage - a.setPercentage;
     });
     groupThirds.sort((a, b) => {
       if (b.wins !== a.wins) return b.wins - a.wins;
       return b.setPercentage - a.setPercentage;
     });
 
     qualified.push(...groupFirsts);
     qualified.push(...groupSeconds);
     qualified.push(...groupThirds.slice(0, 2));
 
     return qualified;
   }, [calculateGroupTable]);
 
   const generatePairings = (players) => {
     const pairings = [];
     for (let i = 0; i < players.length; i++) {
       for (let j = i + 1; j < players.length; j++) {
         pairings.push([players[i], players[j]]);
       }
     }
     return pairings;
   };
 
+  const getMatch = useCallback((p1, p2, phase) =>
+    matches.find(m =>
+      m.phase === phase &&
+      ((m.player1 === p1 && m.player2 === p2) ||
+       (m.player1 === p2 && m.player2 === p1))
+    ), [matches]);
+
+  const quarterfinalPairings = useMemo(() => {
+    if (getQualifiedPlayers.length < 8) return [];
+
+    const firstA = getQualifiedPlayers.find(p => p.group === 'A' && p.position === 1)?.name;
+    const firstB = getQualifiedPlayers.find(p => p.group === 'B' && p.position === 1)?.name;
+    const firstC = getQualifiedPlayers.find(p => p.group === 'C' && p.position === 1)?.name;
+
+    const secondA = getQualifiedPlayers.find(p => p.group === 'A' && p.position === 2)?.name;
+    const secondB = getQualifiedPlayers.find(p => p.group === 'B' && p.position === 2)?.name;
+    const secondC = getQualifiedPlayers.find(p => p.group === 'C' && p.position === 2)?.name;
+
+    const thirds = getQualifiedPlayers.filter(p => p.position === 3);
+    const bestThird = thirds[0]?.name;
+    const secondThird = thirds[1]?.name;
+
+    return [
+      [firstA, secondB],
+      [firstB, secondC],
+      [firstC, bestThird],
+      [secondThird, secondA]
+    ];
+  }, [getQualifiedPlayers]);
+
+  const semifinalPairings = useMemo(() => {
+    const qfMatches = quarterfinalPairings.map(([p1, p2]) => getMatch(p1, p2, 'quarterfinal'));
+    const winners = qfMatches.map(m => m?.winner);
+
+    if (winners.some(w => !w)) return [];
+
+    return [
+      [winners[0], winners[1]],
+      [winners[2], winners[3]]
+    ];
+  }, [quarterfinalPairings, getMatch]);
+
+  const finalPairing = useMemo(() => {
+    const sfMatches = semifinalPairings.map(([p1, p2]) => getMatch(p1, p2, 'semifinal'));
+    const winners = sfMatches.map(m => m?.winner);
+    if (winners.some(w => !w)) return [];
+    return [winners[0], winners[1]];
+  }, [semifinalPairings, getMatch]);
+
   const getAvailableMatches = useCallback((group) => {
     const groupPlayers = GROUPS[group];
     const availableMatches = [];
     
     for (let i = 0; i < groupPlayers.length; i++) {
       for (let j = i + 1; j < groupPlayers.length; j++) {
         const player1 = groupPlayers[i];
         const player2 = groupPlayers[j];
         
         const existingMatch = matches.find(m => 
           m.group === group && 
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
   }, [matches, isAdminMode]);
 
+  const getKOAvailableMatches = useCallback((round) => {
+    if (round === 'quarterfinal') {
+      return quarterfinalPairings.map(([p1, p2]) => [p1, p2, !!getMatch(p1, p2, 'quarterfinal')]);
+    }
+    if (round === 'semifinal') {
+      return semifinalPairings.map(([p1, p2]) => [p1, p2, !!getMatch(p1, p2, 'semifinal')]);
+    }
+    if (round === 'final' && finalPairing.length === 2) {
+      const [p1, p2] = finalPairing;
+      return [[p1, p2, !!getMatch(p1, p2, 'final')]];
+    }
+    return [];
+  }, [quarterfinalPairings, semifinalPairings, finalPairing, getMatch]);
+
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
       phase: 'group',
+      round: 'group',
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
diff --git a/src/components/TennisChampionship.jsx b/src/components/TennisChampionship.jsx
index fa6a7a31d5aa77ad80fd6adfa1cc4f38694185dd..cbc3dca0128adc389bac894394d68a239f11c0b7 100644
--- a/src/components/TennisChampionship.jsx
+++ b/src/components/TennisChampionship.jsx
@@ -599,52 +664,57 @@ const TennisChampionship = () => {
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
       
-      const phaseText = match.phase === 'group' ? `Gruppe ${match.group}` : 
-                       match.phase === 'semifinal' ? 'Endrunde' : 'Finale';
+      const phaseText = match.phase === 'group'
+        ? `Gruppe ${match.group}`
+        : match.phase === 'quarterfinal'
+          ? 'Viertelfinale'
+          : match.phase === 'semifinal'
+            ? 'Halbfinale'
+            : 'Finale';
       
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
 
diff --git a/src/components/TennisChampionship.jsx b/src/components/TennisChampionship.jsx
index fa6a7a31d5aa77ad80fd6adfa1cc4f38694185dd..cbc3dca0128adc389bac894394d68a239f11c0b7 100644
--- a/src/components/TennisChampionship.jsx
+++ b/src/components/TennisChampionship.jsx
@@ -946,89 +1016,171 @@ const TennisChampionship = () => {
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
-    if (phase === 'semifinal' && getQualifiedPlayers.length < 8) {
+    if (phase === 'semifinal') {
+      if (getQualifiedPlayers.length < 8) {
+        return (
+          <div className="bg-white rounded-2xl shadow-lg p-6">
+            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
+              <Trophy className="mr-2 text-blue-500" size={20} />
+              {title}
+            </h3>
+            <div className="text-center py-12 text-gray-500">
+              <Trophy className="mx-auto mb-4 opacity-30" size={48} />
+              <p>Gruppenphase noch nicht abgeschlossen</p>
+              <p className="text-sm mt-2">Noch {8 - getQualifiedPlayers.length} Plätze offen</p>
+            </div>
+          </div>
+        );
+      }
+
+      const renderMatch = (p1, p2, match, idx) => {
+        const isCompleted = match && match.status === 'completed';
+        return (
+          <div key={idx} className={`p-3 rounded-lg border transition-all duration-200 ${isCompleted ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
+            <div className="flex items-center justify-between">
+              <div className="flex-1">
+                <div className="font-medium text-gray-800 mb-1">
+                  {p1} vs {p2}
+                </div>
+                {isCompleted && match.set1 && (
+                  <div className="text-sm text-gray-600">
+                    <div className="flex flex-wrap items-center gap-2 md:gap-4">
+                      <span className="flex items-center space-x-1">
+                        <span className="text-xs text-gray-500">Satz 1:</span>
+                        <span className="font-mono font-medium">{match.set1.player1}:{match.set1.player2}</span>
+                      </span>
+                      <span className="flex items-center space-x-1">
+                        <span className="text-xs text-gray-500">Satz 2:</span>
+                        <span className="font-mono font-medium">{match.set2.player1}:{match.set2.player2}</span>
+                      </span>
+                      {match.tiebreak && (
+                        <span className="flex items-center space-x-1">
+                          <span className="text-xs text-gray-500">TB:</span>
+                          <span className="font-mono font-medium">{match.tiebreak.player1}:{match.tiebreak.player2}</span>
+                        </span>
+                      )}
+                    </div>
+                    <div className="mt-1 flex items-center">
+                      <Trophy className="w-3 h-3 text-yellow-500 mr-1" />
+                      <span className="text-xs font-medium text-gray-700">Sieger: {match.winner}</span>
+                    </div>
+                  </div>
+                )}
+              </div>
+              <span className={`px-2 md:px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ml-3 ${isCompleted ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{isCompleted ? 'Gespielt' : 'Ausstehend'}</span>
+            </div>
+          </div>
+        );
+      };
+
       return (
         <div className="bg-white rounded-2xl shadow-lg p-6">
           <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
             <Trophy className="mr-2 text-blue-500" size={20} />
             {title}
           </h3>
-          <div className="text-center py-12 text-gray-500">
-            <Trophy className="mx-auto mb-4 opacity-30" size={48} />
-            <p>Gruppenphase noch nicht abgeschlossen</p>
-            <p className="text-sm mt-2">Noch {8 - getQualifiedPlayers.length} Plätze offen</p>
+
+          <div className="space-y-6">
+            <div>
+              <h4 className="text-sm font-medium text-gray-700 mb-2">Viertelfinale</h4>
+              <div className="space-y-2">
+                {quarterfinalPairings.map(([p1, p2], idx) => renderMatch(p1, p2, getMatch(p1, p2, 'quarterfinal'), idx))}
+              </div>
+            </div>
+            {semifinalPairings.length > 0 && (
+              <div>
+                <h4 className="text-sm font-medium text-gray-700 mb-2">Halbfinale</h4>
+                <div className="space-y-2">
+                  {semifinalPairings.map(([p1, p2], idx) => renderMatch(p1, p2, getMatch(p1, p2, 'semifinal'), `sf${idx}`))}
+                </div>
+              </div>
+            )}
           </div>
         </div>
       );
     }
 
-    return (
-      <div className="bg-white rounded-2xl shadow-lg p-6">
-        <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
-          <Trophy className="mr-2 text-blue-500" size={20} />
-          {title}
-        </h3>
-        <div className="text-center py-12 text-gray-500">
-          <Trophy className="mx-auto mb-4 opacity-30" size={48} />
-          <p>K.O.-Phase wird freigeschaltet, wenn alle Gruppensieger feststehen</p>
+    if (phase === 'final') {
+      const [p1, p2] = finalPairing;
+      const match = p1 && p2 ? getMatch(p1, p2, 'final') : null;
+
+      return (
+        <div className="bg-white rounded-2xl shadow-lg p-6">
+          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
+            <Trophy className="mr-2 text-blue-500" size={20} />
+            {title}
+          </h3>
+          {p1 && p2 ? (
+            <div className="space-y-2">
+              {renderMatch(p1, p2, match, 'final')}
+            </div>
+          ) : (
+            <div className="text-center py-12 text-gray-500">
+              <Trophy className="mx-auto mb-4 opacity-30" size={48} />
+              <p>Finalpaarung steht noch nicht fest</p>
+            </div>
+          )}
         </div>
-      </div>
-    );
+      );
+    }
+
+    return null;
   };
 
   const AdminMatchList = () => {
     const allMatches = [...matches].sort((a, b) => {
-      const phaseOrder = { 'group': 1, 'semifinal': 2, 'final': 3 };
+      const phaseOrder = { 'group': 1, 'quarterfinal': 2, 'semifinal': 3, 'final': 4 };
       return phaseOrder[a.phase] - phaseOrder[b.phase] || a.id - b.id;
     });
 
     const getPhaseTitle = (match) => {
       if (match.phase === 'group') return `Gruppe ${match.group}`;
-      if (match.phase === 'semifinal') return 'Endrunde';
+      if (match.phase === 'quarterfinal') return 'Viertelfinale';
+      if (match.phase === 'semifinal') return 'Halbfinale';
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
diff --git a/src/components/TennisChampionship.jsx b/src/components/TennisChampionship.jsx
index fa6a7a31d5aa77ad80fd6adfa1cc4f38694185dd..cbc3dca0128adc389bac894394d68a239f11c0b7 100644
--- a/src/components/TennisChampionship.jsx
+++ b/src/components/TennisChampionship.jsx
@@ -1618,74 +1770,132 @@ const TennisChampionship = () => {
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
-                        <label className="block text-sm font-medium text-gray-700 mb-2">Gruppe</label>
+                        <label className="block text-sm font-medium text-gray-700 mb-2">Runde</label>
                         <select
-                          value={newMatch.group}
-                          onChange={(e) => setNewMatch({...newMatch, group: e.target.value, player1: '', player2: ''})}
+                          value={newMatch.round}
+                          onChange={(e) => {
+                            const round = e.target.value;
+                            if (round === 'group') {
+                              setNewMatch({
+                                ...newMatch,
+                                round,
+                                phase: 'group',
+                                group: 'A',
+                                player1: '',
+                                player2: ''
+                              });
+                            } else if (round === 'quarterfinal') {
+                              setNewMatch({
+                                ...newMatch,
+                                round,
+                                phase: 'quarterfinal',
+                                group: 'KO',
+                                player1: '',
+                                player2: ''
+                              });
+                            } else if (round === 'semifinal') {
+                              setNewMatch({
+                                ...newMatch,
+                                round,
+                                phase: 'semifinal',
+                                group: 'KO',
+                                player1: '',
+                                player2: ''
+                              });
+                            } else if (round === 'final') {
+                              setNewMatch({
+                                ...newMatch,
+                                round,
+                                phase: 'final',
+                                group: 'KO',
+                                player1: '',
+                                player2: ''
+                              });
+                            }
+                          }}
                           className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                         >
-                          <option value="A">Gruppe A</option>
-                          <option value="B">Gruppe B</option>
-                          <option value="C">Gruppe C</option>
+                          <option value="group">Gruppenphase</option>
+                          <option value="quarterfinal">Viertelfinale</option>
+                          <option value="semifinal">Halbfinale</option>
+                          <option value="final">Finale</option>
                         </select>
                       </div>
+
+                      {newMatch.round === 'group' && (
+                        <div>
+                          <label className="block text-sm font-medium text-gray-700 mb-2">Gruppe</label>
+                          <select
+                            value={newMatch.group}
+                            onChange={(e) => setNewMatch({...newMatch, group: e.target.value, player1: '', player2: ''})}
+                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
+                          >
+                            <option value="A">Gruppe A</option>
+                            <option value="B">Gruppe B</option>
+                            <option value="C">Gruppe C</option>
+                          </select>
+                        </div>
+                      )}
                       
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
-                          {getAvailableMatches(newMatch.group).map(([p1, p2, played], index) => (
+                          {(newMatch.round === 'group'
+                            ? getAvailableMatches(newMatch.group)
+                            : getKOAvailableMatches(newMatch.round)
+                          ).map(([p1, p2, played], index) => (
                             <option key={index} value={`${p1}-${p2}`}>
                               {p1} vs {p2} {played && isAdminMode ? '⚠️ (bereits gespielt!)' : ''}
                             </option>
                           ))}
                         </select>
                       </div>
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
 
EOF
)
