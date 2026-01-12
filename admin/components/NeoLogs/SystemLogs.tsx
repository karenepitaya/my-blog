
import React, { useState, useEffect } from 'react';
import { SystemLogViewer } from './components/SystemLogViewer';
import { LogMockService } from './services/LogMockService';
import { LogEntry } from './types';

export const SystemLogs: React.FC = () => {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [isLive, setIsLive] = useState(LogMockService.isRunning());
    const BUFFER_SIZE = 500;

    // Subscribe to the singleton service
    useEffect(() => {
        LogMockService.startAutoGeneration();
        const unsubscribe = LogMockService.subscribe((updatedLogs) => {
            setLogs(updatedLogs);
        });
        
        // Sync running state
        setIsLive(LogMockService.isRunning());

        return () => {
            unsubscribe();
            LogMockService.stopAutoGeneration();
        };
    }, []);

    // Handlers
    const handleClear = () => LogMockService.clearLogs();
    
    const handleToggleLive = () => {
        if (isLive) {
            LogMockService.stopAutoGeneration();
        } else {
            LogMockService.startAutoGeneration();
        }
        setIsLive(!isLive);
    };

    return (
        <div className="animate-fade-in">
            <SystemLogViewer 
                logs={logs}
                isLive={isLive}
                bufferSize={BUFFER_SIZE}
                onToggleLive={handleToggleLive}
                onClear={handleClear}
            />
        </div>
    );
};
