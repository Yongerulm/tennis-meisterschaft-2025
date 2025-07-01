import React from 'react';
import { Trophy } from 'lucide-react';
import KOGroupCard from './KOGroupCard';
import { calculateKOGroupTable } from '../utils/tournamentUtils';

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

    if (finalists.length < 4) {
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

    return (
      <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 p-6 hover:shadow-2xl hover:border-blue-200 transition-all duration-300">
        <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          <Trophy className="mr-2 text-blue-500" size={20} />
          {title}
        </h3>
        <div className="text-center py-6">
          <p className="text-gray-600 mb-4">Die Top 2 aus jeder End-Gruppe spielen im Finale</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {finalists.slice(0, 4).map((player, index) => (
              <div key={index} className="bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-300 rounded-lg p-4">
                <div className="font-semibold text-gray-800">{player.name}</div>
                <div className="text-sm text-gray-600">
                  End-Gruppe {index < 2 ? 'A' : 'B'} - Platz {(index % 2) + 1}
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

export default KOBracket;
