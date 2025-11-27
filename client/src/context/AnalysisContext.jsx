import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../utils/api';

const AnalysisContext = createContext(null);

export function AnalysisProvider({ children }) {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [progress, setProgress] = useState(null);
    const [error, setError] = useState(null);
    const [lastAnalysisResult, setLastAnalysisResult] = useState(null);

    // Poll for progress when analyzing
    useEffect(() => {
        let pollInterval;

        if (isAnalyzing && progress) {
            pollInterval = setInterval(async () => {
                try {
                    const stats = await api.getAIStats();
                    setProgress(prev => {
                        if (!prev) return null;
                        return {
                            ...prev,
                            analyzed: stats.totalAnalyzed,
                            current: stats.totalAnalyzed - (prev.startCount || 0)
                        };
                    });
                } catch (err) {
                    console.error('Error polling progress:', err);
                }
            }, 2000);
        }

        return () => {
            if (pollInterval) clearInterval(pollInterval);
        };
    }, [isAnalyzing, progress?.startCount]);

    const startAnalysis = useCallback(async (conversationIds = null) => {
        try {
            setIsAnalyzing(true);
            setError(null);
            setProgress(null);

            // Get initial stats
            const initialStats = await api.getAIStats();

            // Determine batch size
            let batchSize = 0;
            if (conversationIds) {
                batchSize = conversationIds.length;
            } else {
                batchSize = Math.min(initialStats.unanalyzedCount, 100);
            }

            const startCount = initialStats.totalAnalyzed;
            const targetTotal = startCount + batchSize;

            setProgress({
                analyzed: startCount,
                total: targetTotal,
                current: 0,
                target: batchSize,
                startCount: startCount
            });

            // Start analysis
            const response = await api.runAIAnalysis(conversationIds);

            // Update final state
            setLastAnalysisResult(response);
            setProgress(prev => ({
                ...prev,
                analyzed: response.analyzed + startCount,
                current: response.analyzed
            }));

            return response;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setIsAnalyzing(false);
            // Keep progress visible for a moment or until dismissed
        }
    }, []);

    const clearProgress = useCallback(() => {
        setProgress(null);
        setError(null);
        setLastAnalysisResult(null);
    }, []);

    const value = {
        isAnalyzing,
        progress,
        error,
        lastAnalysisResult,
        startAnalysis,
        clearProgress
    };

    return (
        <AnalysisContext.Provider value={value}>
            {children}
        </AnalysisContext.Provider>
    );
}

export function useAnalysis() {
    const context = useContext(AnalysisContext);
    if (!context) {
        throw new Error('useAnalysis must be used within an AnalysisProvider');
    }
    return context;
}
