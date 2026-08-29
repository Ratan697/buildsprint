'use client';

import React from 'react';
import SimulationHeader from '@/components/simulations/SimulationHeader';
import ChangeForm from '@/components/simulations/ChangeForm';
import DependencyGraph from '@/components/simulations/DependencyGraph';
import ImpactSummary from '@/components/simulations/ImpactSummary';
import EvidencePanel from '@/components/simulations/EvidencePanel';
import RemediationPanel from '@/components/simulations/RemediationPanel';
import { useChangeShieldStore } from '@/store/useChangeShieldStore';

export default function NewSimulationPage() {
  const { analysisResult, activeTab, resetSimulation } = useChangeShieldStore();

  return (
    <div className="flex flex-col gap-6">
      <SimulationHeader />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Form: Change Parameters */}
        <div className="lg:col-span-4">
          <ChangeForm
            onReset={resetSimulation}
            isSimulated={Boolean(analysisResult)}
          />
        </div>

        {/* Right Graph: Dependency Tree & Blast Radius */}
        <div className="lg:col-span-8">
          <DependencyGraph />
        </div>
      </div>

      {/* Bottom Result Sections */}
      <ImpactSummary />

      {/* Conditional Active Tab Views */}
      {analysisResult && (
        <>
          {activeTab === 'evidence' && <EvidencePanel />}
          {activeTab === 'remediation' && <RemediationPanel />}
        </>
      )}
    </div>
  );
}
