export const validateTennisScore = (set1P1, set1P2, set2P1, set2P2, tbP1, tbP2) => {
  const errors = [];

  const validateSet = (p1Score, p2Score, setNumber) => {
    const s1 = parseInt(p1Score, 10) || 0;
    const s2 = parseInt(p2Score, 10) || 0;

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

  const tb1 = parseInt(tbP1, 10) || 0;
  const tb2 = parseInt(tbP2, 10) || 0;

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
};

export const determineWinner = (matchData) => {
  const set1P1 = parseInt(matchData.set1Player1, 10) || 0;
  const set1P2 = parseInt(matchData.set1Player2, 10) || 0;
  const set2P1 = parseInt(matchData.set2Player1, 10) || 0;
  const set2P2 = parseInt(matchData.set2Player2, 10) || 0;
  const tbP1 = parseInt(matchData.tiebreakPlayer1, 10) || 0;
  const tbP2 = parseInt(matchData.tiebreakPlayer2, 10) || 0;

  const validationErrors = validateTennisScore(set1P1, set1P2, set2P1, set2P2, tbP1, tbP2);

  if (validationErrors.length > 0) {
    return { winner: null, errors: validationErrors };
  }

  if (set1P1 === 0 && set1P2 === 0 && set2P1 === 0 && set2P2 === 0) {
    return { winner: null, errors: ['Bitte geben Sie mindestens ein Satz-Ergebnis ein'] };
  }

  let p1Sets = 0;
  let p2Sets = 0;

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
};
