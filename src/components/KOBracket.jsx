import React from 'react';
import { Trophy } from 'lucide-react';
import KOGroupCard from './KOGroupCard';
import { calculateKOGroupTable, generatePairings } from '../utils/tournamentUtils';

const KOBracket = ({ phase, title, koGroups, qualifiedPlayers, matches }) => {
  if (phase === 'semifinal') {
    if (qualifiedPlayers.length < 8) {
      return (
        <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 p-6 hover:shadow-2xl hover:border-blue-200 transition-all duration-300">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <Trophy className="mr-2 text-blue-500" size={20} />
            {title}
          </h3>
          <div className="text-center py-12 text-gray-500">
            <Trophy className="mx-auto mb-4 opacity-30" size={48} />
            <p>Gruppenphase noch nicht abgeschlossen</p>
            <p className="text-sm mt-2">Noch {8 - qualifiedPlayers.length} Plätze offen</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
          <KOGroupCard groupName="A" players={koGroups.A} matches={matches} />
          <KOGroupCard groupName="B" players={koGroups.B} matches={matches} />
        </div>
      </div>
    );
  }

  if (phase === 'final') {
    const koGroupA = calculateKOGroupTable('A', koGroups.A, matches);
    const koGroupB = calculateKOGroupTable('B', koGroups.B, matches);
    const finalists = [];

    if (koGroupA.length >= 2) {
      finalists.push(koGroupA[0], koGroupA[1]);
    }
    if (koGroupB.length >= 2) {
      finalists.push(koGroupB[0], koGroupB[1]);
    }

    // Check if all semifinal matches are completed
    const totalMatchesA = generatePairings(koGroups.A.map((p) => p.name)).length;
    const playedMatchesA = matches.filter(
      (m) => m.phase === 'semifinal' && m.koGroup === 'A' && m.status === 'completed'
    ).length;

    const totalMatchesB = generatePairings(koGroups.B.map((p) => p.name)).length;
    const playedMatchesB = matches.filter(
      (m) => m.phase === 'semifinal' && m.koGroup === 'B' && m.status === 'completed'
    ).length;

    const allSemisCompleted =
      playedMatchesA === totalMatchesA && playedMatchesB === totalMatchesB;

    if (finalists.length < 4 || !allSemisCompleted) {
      return (
        <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 p-6 hover:shadow-2xl hover:border-blue-200 transition-all duration-300">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <Trophy className="mr-2 text-blue-500" size={20} />
            {title}
          </h3>
          <div className="text-center py-12 text-gray-500">
            <Trophy className="mx-auto mb-4 opacity-30" size={48} />
            <p>End-Gruppen noch nicht abgeschlossen</p>
          </div>
        </div>
      );
    }

    const finalPair = [koGroupA[0].name, koGroupB[0].name];
    const thirdPair = [koGroupA[1].name, koGroupB[1].name];

    const findMatch = (p1, p2) =>
      matches.find(
        (m) =>
          m.phase === 'final' &&
          ((m.player1 === p1 && m.player2 === p2) ||
            (m.player1 === p2 && m.player2 === p1))
      );

    const finalMatch = findMatch(finalPair[0], finalPair[1]);
    const thirdMatch = findMatch(thirdPair[0], thirdPair[1]);

    const renderMatch = (titleText, pair, match) => {
      const isCompleted = match && match.status === 'completed';
      return (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2">{titleText}</h4>
          <div
            className={`p-3 rounded-lg border transition-all duration-200 ${
              isCompleted ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="font-medium text-gray-800 mb-1">
                  {pair[0]} vs {pair[1]}
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
                      <span className="text-xs font-medium text-gray-700">Sieger: {match.winner}</span>
                    </div>
                  </div>
                )}
              </div>
              <span
                className={`px-2 md:px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ml-3 ${
                  isCompleted ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}
              >
                {isCompleted ? 'Gespielt' : 'Ausstehend'}
              </span>
            </div>
          </div>
        </div>
      );
    };

    return (
      <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 p-6 hover:shadow-2xl hover:border-blue-200 transition-all duration-300">
        <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          <Trophy className="mr-2 text-blue-500" size={20} />
          {title}
        </h3>
        <div className="text-center py-6">
          {renderMatch('Finale - Platz 1', finalPair, finalMatch)}
          {renderMatch('Spiel um Platz 3', thirdPair, thirdMatch)}
        </div>
      </div>
    );
  }

  return null;
};

export default KOBracket;
