import React from 'react';
import type { Feature } from '../types.ts';
import { UserJourneyIcon, SpecsIcon, LightbulbIcon } from './Icons.tsx';

interface FeatureDetailProps {
  feature: Feature | null;
}

const FeatureDetail: React.FC<FeatureDetailProps> = ({ feature }) => {
  if (!feature) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500">
        <h2 className="text-2xl font-semibold">Bienvenue !</h2>
        <p className="mt-2 text-lg">Sélectionnez une fonctionnalité dans le menu de gauche pour commencer.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <header>
        <h1 className="text-4xl font-bold text-slate-900 tracking-tight">{feature.title}</h1>
        <p className="mt-2 text-lg text-slate-600">{feature.description}</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <h2 className="text-2xl font-semibold text-slate-800 mb-4 flex items-center">
            <UserJourneyIcon className="w-6 h-6 mr-3 text-indigo-500" />
            {feature.userJourney.title}
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-slate-700">
            {feature.userJourney.steps.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ol>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <h2 className="text-2xl font-semibold text-slate-800 mb-4 flex items-center">
            <SpecsIcon className="w-6 h-6 mr-3 text-indigo-500" />
            {feature.specs.title}
          </h2>
          <ul className="list-disc list-inside space-y-2 text-slate-700">
            {feature.specs.points.map((point, index) => (
              <li key={index}>{point}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-r-lg">
        <h3 className="text-lg font-bold text-yellow-900 mb-2 flex items-center">
          <LightbulbIcon className="w-6 h-6 mr-3 text-yellow-600" />
          {feature.simplificationTip.title}
        </h3>
        <p className="text-yellow-800">{feature.simplificationTip.content}</p>
      </div>
    </div>
  );
};

export default FeatureDetail;