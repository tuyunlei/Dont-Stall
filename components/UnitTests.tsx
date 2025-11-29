
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { runAllTests } from '../services/physicsTests';
import type { TestResult } from '../services/physicsTests';

interface UnitTestsProps {
  onClose: () => void;
}

export const UnitTests: React.FC<UnitTestsProps> = ({ onClose }) => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const handleRun = async () => {
    setIsRunning(true);
    setResults([]);
    setSelectedTestId(null);
    const data = await runAllTests();
    setResults(data);
    setIsRunning(false);
    
    // Auto-select first failure or first test
    const firstFail = data.find(r => !r.passed);
    if (firstFail) setSelectedTestId(firstFail.id);
    else if (data.length > 0) setSelectedTestId(data[0].id);
  };

  useEffect(() => {
    handleRun();
  }, []);

  useEffect(() => {
    if (logsEndRef.current) {
        logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedTestId]);

  const groupedResults = useMemo(() => {
      const groups: Record<string, TestResult[]> = {
          'UNIT': [],
          'SCENARIO': []
      };
      results.forEach(test => {
          if (groups[test.category]) groups[test.category].push(test);
          else groups[test.category] = [test];
      });
      return groups;
  }, [results]);

  const selectedTest = results.find(r => r.id === selectedTestId);
  const passCount = results.filter(r => r.passed).length;
  const failCount = results.filter(r => !r.passed).length;

  const exportError = (test: TestResult) => {
      const logText = test.logs.map(l => `[${l.frame}] ${l.type.toUpperCase()}: ${l.message} ${l.data ? JSON.stringify(l.data) : ''}`).join('\n');
      const errorReport = `
=== TEST FAILURE REPORT ===
ID: ${test.id}
Name: ${test.name}
Reason: ${test.error}
Snapshot: ${JSON.stringify(test.finalStateSnapshot, null, 2)}
---------------------------
LOGS:
${logText}
===========================
      `;
      console.error(errorReport);
      alert(`Test ${test.id} failure report exported to Console.`);
  };

  const exportAllFailures = () => {
      const failures = results.filter(r => !r.passed);
      if (failures.length === 0) {
          alert("No failures to export!");
          return;
      }
      console.group("BULK TEST EXPORT");
      failures.forEach(f => {
          const logText = f.logs.map(l => `[${l.frame}] ${l.type.toUpperCase()}: ${l.message} ${l.data ? JSON.stringify(l.data) : ''}`).join('\n');
          console.error(`[${f.id}] ${f.name}\nError: ${f.error}\nLogs:\n${logText}`);
      });
      console.groupEnd();
      alert(`Exported ${failures.length} failures to Console.`);
  }

  return (
    <div className="fixed inset-0 bg-[#0f172a]/95 backdrop-blur z-50 flex items-center justify-center p-4 md:p-8 font-sans">
      <div className="w-full max-w-7xl h-[90vh] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-800 p-4 border-b border-slate-700 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
             <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
                <span className="w-3 h-3 bg-indigo-500 rounded-full"></span>
                System Diagnostics
             </h2>
             {!isRunning && results.length > 0 && (
                 <div className="flex gap-2 ml-4">
                     <span className="px-3 py-1 bg-green-900/40 border border-green-700/50 rounded text-green-400 text-xs font-bold">
                         PASS: {passCount}
                     </span>
                     <span className={`px-3 py-1 border rounded text-xs font-bold ${failCount > 0 ? 'bg-red-900/40 border-red-700/50 text-red-400' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
                         FAIL: {failCount}
                     </span>
                 </div>
             )}
          </div>

          <div className="flex gap-3">
             {failCount > 0 && (
                <button onClick={exportAllFailures} className="px-3 py-2 bg-red-900/30 hover:bg-red-900/50 border border-red-700 text-red-200 rounded text-xs font-bold transition-colors">
                    EXPORT ALL FAILS
                </button>
             )}
            <button 
                onClick={handleRun} 
                disabled={isRunning}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded text-sm font-bold transition-colors flex items-center gap-2"
            >
                {isRunning ? <span className="animate-spin">⟳</span> : '⟲'} RERUN ALL
            </button>
            <button onClick={onClose} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm transition-colors">
                CLOSE
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
            
            {/* Sidebar List */}
            <div className="w-80 border-r border-slate-700 bg-slate-800/30 flex flex-col overflow-y-auto">
                {Object.entries(groupedResults).map(([category, groupTests]) => (
                    <div key={category}>
                        <div className="sticky top-0 z-10 bg-slate-900/90 backdrop-blur border-y border-slate-700/80 px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {category} TESTS
                        </div>
                        {(groupTests as TestResult[]).map(test => (
                            <button
                                key={test.id}
                                onClick={() => setSelectedTestId(test.id)}
                                className={`w-full p-3 text-left border-b border-slate-700/30 hover:bg-slate-700/30 transition-colors flex justify-between items-center group relative ${
                                    selectedTestId === test.id ? 'bg-indigo-500/10' : ''
                                }`}
                            >
                                {selectedTestId === test.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500"></div>}
                                <div className="flex-1 min-w-0 pr-2">
                                    <div className={`text-xs font-bold font-mono mb-0.5 ${test.passed ? 'text-slate-300' : 'text-red-300'}`}>{test.id}</div>
                                    <div className="text-sm font-medium text-slate-400 truncate">{test.name}</div>
                                </div>
                                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${test.passed ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]' : 'bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)]'}`} />
                            </button>
                        ))}
                    </div>
                ))}
            </div>

            {/* Details Panel */}
            <div className="flex-1 flex flex-col bg-[#0a0f1e] overflow-hidden">
                {selectedTest ? (
                    <>
                        {/* Detail Header */}
                        <div className="p-6 border-b border-slate-800 bg-slate-900/50">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h1 className="text-2xl font-bold text-white mb-2">{selectedTest.name}</h1>
                                    <p className="text-slate-400">{selectedTest.description}</p>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <span className={`px-3 py-1 rounded text-sm font-bold border ${selectedTest.passed ? 'bg-green-900/20 border-green-800 text-green-400' : 'bg-red-900/20 border-red-800 text-red-400'}`}>
                                        {selectedTest.passed ? 'PASSED' : 'FAILED'}
                                    </span>
                                    {!selectedTest.passed && (
                                        <button onClick={() => exportError(selectedTest)} className="text-xs text-red-400 hover:text-red-300 underline underline-offset-4 decoration-red-800">
                                            Export Error Log
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Failure Message */}
                            {!selectedTest.passed && selectedTest.error && (
                                <div className="mb-6 p-4 bg-red-950/30 border border-red-900/50 rounded-lg text-red-200 font-mono text-sm">
                                    <strong className="text-red-500 block mb-1">ASSERTION FAILED:</strong>
                                    {selectedTest.error}
                                </div>
                            )}

                            {/* Steps */}
                            <div className="flex flex-wrap gap-2">
                                {selectedTest.steps.map((step, i) => (
                                    <span key={i} className="px-2 py-1 bg-slate-800 rounded text-[10px] text-slate-400 border border-slate-700">
                                        {i+1}. {step}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Logs Console */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-1 font-mono text-sm scrollbar-thin">
                            {selectedTest.logs.map((log, idx) => (
                                <div key={idx} className={`group flex gap-4 py-1 px-2 rounded hover:bg-white/5 border-l-2 ${
                                    log.type === 'fail' ? 'border-red-500 bg-red-900/10' : 
                                    log.type === 'pass' ? 'border-green-500' : 
                                    log.type === 'action' ? 'border-blue-500 bg-blue-900/10' : 
                                    'border-transparent'
                                }`}>
                                    <span className="text-slate-600 w-12 text-right select-none text-xs pt-0.5">{log.frame}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className={`break-words ${log.type === 'fail' ? 'text-red-300' : log.type === 'action' ? 'text-blue-300 font-bold' : log.type === 'pass' ? 'text-green-300' : 'text-slate-300'}`}>
                                            {log.message}
                                        </div>
                                        {log.data && (
                                            <div className="mt-1 text-xs text-slate-500 font-mono bg-black/20 p-1 rounded inline-block">
                                                {Object.entries(log.data).map(([k,v]) => `${k}:${v}`).join(' | ')}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            <div ref={logsEndRef} />
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-600">
                        <svg className="w-16 h-16 mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        <p>Select a test case to view details</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};
