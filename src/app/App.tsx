
import React, { useState } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { SandboxControls } from './components/SandboxControls';
import { UnitTests } from './components/UnitTests';
import { ControlsSettings } from './components/ControlsSettings';
import { LevelData, GameMode } from '../game/types';
import { CarConfig } from '../config/types';
import { LEVELS } from '../config/levels';
import { DEFAULT_CAR_CONFIG } from '../config/cars';
import { useLanguage } from './contexts/LanguageContext';
import { useTheme } from './contexts/ThemeContext';
import { ControlsProvider } from './contexts/ControlsContext';

const AppContent: React.FC = () => {
  const [currentLevel, setCurrentLevel] = useState<LevelData>(LEVELS[0]);
  const [gameMode, setGameMode] = useState<GameMode>(GameMode.LEVELS);
  const [carConfig, setCarConfig] = useState<CarConfig>(DEFAULT_CAR_CONFIG);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showTests, setShowTests] = useState(false);
  const [showControls, setShowControls] = useState(false);
  
  const { t, language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();

  const handleLevelSelect = (level: LevelData) => {
      setCurrentLevel(level);
      setGameMode(GameMode.LEVELS);
      setIsMenuOpen(false);
  };

  const enterSandbox = () => {
      setGameMode(GameMode.SANDBOX);
      setIsMenuOpen(false);
  };

  const openTests = () => {
      setShowTests(true);
      setIsMenuOpen(false);
  };

  const openControls = () => {
      setShowControls(true);
      setIsMenuOpen(false);
  };

  const toggleLanguage = () => {
      setLanguage(language === 'zh-CN' ? 'en-US' : 'zh-CN');
  };

  const cycleTheme = () => {
      if (theme === 'auto') setTheme('light');
      else if (theme === 'light') setTheme('dark');
      else setTheme('auto');
  };

  const getThemeIcon = () => {
      if (theme === 'auto') return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
      if (theme === 'light') return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
      return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>;
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-slate-50 dark:bg-slate-900 font-sans text-slate-800 dark:text-slate-200 relative transition-colors duration-300">
        {/* Top Navigation Bar */}
        <div className="absolute top-0 left-0 right-0 h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-6 z-20 shadow-sm dark:shadow-none transition-colors duration-300">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                     <span className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></span>
                     <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">{t('app.title')}</h1>
                </div>
                <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-2"></div>
                <div className="text-sm text-slate-500 dark:text-slate-400 font-mono">
                    {gameMode === GameMode.SANDBOX ? t('app.mode.sandbox') : t(currentLevel.name)}
                </div>
            </div>

            <div className="flex gap-4">
                <button 
                    onClick={cycleTheme}
                    className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-slate-600 dark:text-slate-300 transition-all"
                    title={`Theme: ${theme}`}
                >
                    {getThemeIcon()}
                </button>

                <button 
                    onClick={toggleLanguage}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-xs font-bold font-mono text-slate-600 dark:text-slate-300 transition-all"
                >
                    {language === 'zh-CN' ? 'EN' : '中文'}
                </button>

                <button 
                    onClick={() => setIsMenuOpen(true)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-sm font-semibold text-slate-700 dark:text-slate-200 transition-all flex items-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                    {t('menu.switch')}
                </button>
            </div>
        </div>

        {/* Level Selection Modal */}
        {isMenuOpen && (
            <div className="fixed inset-0 z-50 bg-slate-200/50 dark:bg-slate-900/95 backdrop-blur-sm flex items-center justify-center p-8">
                <div className="max-w-4xl w-full bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl">
                    <div className="flex justify-between items-end mb-8 border-b border-slate-200 dark:border-slate-700 pb-4">
                        <div>
                            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{t('menu.title')}</h2>
                            <p className="text-slate-500 dark:text-slate-400">{t('menu.desc')}</p>
                        </div>
                        <button onClick={() => setIsMenuOpen(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                            {t('menu.close')}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Level Cards */}
                        {LEVELS.map((lvl) => (
                            <button 
                                key={lvl.id}
                                onClick={() => handleLevelSelect(lvl)}
                                className={`group text-left p-6 rounded-xl border transition-all duration-200 relative overflow-hidden ${
                                    currentLevel.id === lvl.id && gameMode === GameMode.LEVELS
                                    ? 'bg-blue-600 border-blue-500 shadow-lg shadow-blue-500/30' 
                                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-750 hover:border-blue-400 dark:hover:border-slate-500 hover:shadow-md'
                                }`}
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg>
                                </div>
                                <h3 className={`text-lg font-bold mb-2 z-10 relative ${currentLevel.id === lvl.id && gameMode === GameMode.LEVELS ? 'text-white' : 'text-slate-800 dark:text-slate-200'}`}>{t(lvl.name)}</h3>
                                <p className={`text-sm z-10 relative ${currentLevel.id === lvl.id && gameMode === GameMode.LEVELS ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'}`}>
                                    {t(lvl.description)}
                                </p>
                            </button>
                        ))}

                        {/* Sandbox Card */}
                        <button 
                             onClick={enterSandbox}
                             className={`group text-left p-6 rounded-xl border transition-all duration-200 relative overflow-hidden ${
                                gameMode === GameMode.SANDBOX
                                ? 'bg-indigo-600 border-indigo-500 shadow-lg shadow-indigo-500/30' 
                                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-750 hover:border-indigo-400 dark:hover:border-slate-500 hover:shadow-md'
                            }`}
                        >
                             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/></svg>
                             </div>
                            <h3 className={`text-lg font-bold mb-2 ${gameMode === GameMode.SANDBOX ? 'text-white' : 'text-slate-800 dark:text-indigo-100'}`}>{t('mode.sandbox.name')}</h3>
                            <p className={`text-sm ${gameMode === GameMode.SANDBOX ? 'text-indigo-100' : 'text-slate-500 dark:text-indigo-200'}`}>
                                {t('mode.sandbox.desc')}
                            </p>
                        </button>

                        {/* Controls Settings Card */}
                         <button 
                             onClick={openControls}
                             className="group text-left p-6 rounded-xl border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-750 hover:border-orange-400 dark:hover:border-slate-500 hover:shadow-md transition-all duration-200 relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                            </div>
                            <h3 className="text-lg font-bold mb-2 text-slate-800 dark:text-orange-100 flex items-center gap-2">
                                {t('controls.title')}
                            </h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm">
                                {t('controls.desc')}
                            </p>
                        </button>

                        {/* Unit Tests Card */}
                        <button 
                             onClick={openTests}
                             className="group text-left p-6 rounded-xl border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-750 hover:border-green-400 dark:hover:border-slate-500 hover:shadow-md transition-all duration-200 relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <h3 className="text-lg font-bold mb-2 text-slate-800 dark:text-green-100 flex items-center gap-2">
                                {t('mode.tests.name')}
                                <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 text-xs rounded border border-green-200 dark:border-green-700">UNIT TESTS</span>
                            </h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm">
                                {t('mode.tests.desc')}
                            </p>
                        </button>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-8 text-sm text-slate-500">
                        <div>
                            <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-2">{t('help.basic')}</h4>
                            <div className="grid grid-cols-2 gap-2 font-mono">
                                <span>{t('key.throttle')}</span>
                                <span>{t('key.brake')}</span>
                                <span>{t('key.steer')}</span>
                                <span>{t('key.clutch')}</span>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-2">{t('help.advanced')}</h4>
                            <div className="grid grid-cols-2 gap-2 font-mono">
                                <span>{t('key.shift')}</span>
                                <span>{t('key.start_engine')}</span>
                                <span>{t('key.reset')}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Unit Tests Overlay */}
        {showTests && <UnitTests onClose={() => setShowTests(false)} />}
        
        {/* Controls Settings Overlay */}
        {showControls && <ControlsSettings onClose={() => setShowControls(false)} />}

        {/* Main Canvas Area */}
        <div className="w-full h-full pt-16 relative">
            <GameCanvas 
                key={`${currentLevel.id}-${gameMode}-${language}`} 
                level={currentLevel} 
                mode={gameMode} 
                carConfig={carConfig}
            />

            {/* Sandbox Overlay */}
            {gameMode === GameMode.SANDBOX && (
                <SandboxControls config={carConfig} onUpdate={setCarConfig} />
            )}
        </div>
    </div>
  );
};

const App: React.FC = () => {
    return (
        <ControlsProvider>
            <AppContent />
        </ControlsProvider>
    );
}

export default App;
