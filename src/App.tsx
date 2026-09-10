import React, { useState } from 'react';
import { useArbitrageManager } from './state/useArbitrageManager';
import { MobileHeader } from './components/mobile/MobileHeader';
import { MobileBottomNav, ActiveTab } from './components/mobile/MobileBottomNav';
import { ScannerView } from './components/views/ScannerView';
import { WatchlistView } from './components/views/WatchlistView';
import { AlertsView } from './components/views/AlertsView';
import { SettingsView } from './components/views/SettingsView';
import { OpportunityDetailDrawer } from './components/mobile/OpportunityDetailDrawer';
import { Wifi, Battery, Signal } from 'lucide-react';

export default function App() {
  const {
    settings,
    quotes,
    opportunities,
    exchangeStatuses,
    selectedOpportunity,
    setSelectedOpportunity,
    alertLogs,
    addSymbol,
    removeSymbol,
    reconnectExchanges,
    updateSettings,
    clearAlertHistory,
    requestNotificationPermission,
  } = useArbitrageManager();

  const [activeTab, setActiveTab] = useState<ActiveTab>('scanner');
  const [isPhoneFrame, setIsPhoneFrame] = useState<boolean>(false);

  const actionableCount = opportunities.filter((o) => o.isActionable).length;

  const appContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 antialiased overflow-hidden">
      {/* Mobile Top Bar (Simulated when in Phone Frame) */}
      {isPhoneFrame && (
        <div className="hidden sm:flex items-center justify-between px-6 py-1.5 bg-slate-950 text-slate-400 text-[11px] font-mono select-none border-b border-slate-900">
          <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          <div className="w-20 h-4 bg-slate-900 rounded-full mx-auto" />
          <div className="flex items-center gap-1.5 text-slate-400">
            <Signal size={12} />
            <Wifi size={12} />
            <Battery size={13} />
          </div>
        </div>
      )}

      {/* Main App Header */}
      <MobileHeader
        binanceStatus={exchangeStatuses.binance}
        bybitStatus={exchangeStatuses.bybit}
        soundEnabled={settings.soundAlertsEnabled}
        onToggleSound={() => updateSettings({ soundAlertsEnabled: !settings.soundAlertsEnabled })}
        isPhoneFrame={isPhoneFrame}
        onToggleFrame={() => setIsPhoneFrame(!isPhoneFrame)}
        onReconnect={reconnectExchanges}
        activeOpportunitiesCount={opportunities.length}
      />

      {/* Active Tab Screen Area */}
      <main className="flex-1 overflow-y-auto overscroll-y-contain">
        {activeTab === 'scanner' && (
          <ScannerView
            opportunities={opportunities}
            settings={settings}
            onSelectOpportunity={setSelectedOpportunity}
            onReconnect={reconnectExchanges}
          />
        )}

        {activeTab === 'markets' && (
          <WatchlistView
            watchlist={settings.watchlist}
            quotes={quotes}
            onAddSymbol={addSymbol}
            onRemoveSymbol={removeSymbol}
          />
        )}

        {activeTab === 'alerts' && (
          <AlertsView
            alertLogs={alertLogs}
            settings={settings}
            onUpdateSettings={updateSettings}
            onRequestNotificationPermission={requestNotificationPermission}
            onClearHistory={clearAlertHistory}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            binanceStatus={exchangeStatuses.binance}
            bybitStatus={exchangeStatuses.bybit}
            onUpdateSettings={updateSettings}
            onReconnect={reconnectExchanges}
          />
        )}
      </main>

      {/* Persistent Bottom Navigation */}
      <MobileBottomNav
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        actionableCount={actionableCount}
        alertCount={alertLogs.length}
      />

      {/* Opportunity Detail Drawer */}
      <OpportunityDetailDrawer
        opportunity={selectedOpportunity}
        settings={settings}
        onClose={() => setSelectedOpportunity(null)}
      />
    </div>
  );

  // Return either simulated mobile frame or responsive full width
  if (isPhoneFrame) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-0 sm:p-4 sm:py-6">
        <div className="w-full sm:max-w-[430px] h-screen sm:h-[880px] sm:rounded-[40px] sm:border-[8px] sm:border-slate-800 sm:shadow-2xl sm:shadow-black/70 overflow-hidden relative flex flex-col">
          {appContent}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex justify-center">
      <div className="w-full max-w-2xl min-h-screen flex flex-col border-x border-slate-800/80 shadow-2xl">
        {appContent}
      </div>
    </div>
  );
}
