'use client';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { RotateCcw, Clock, Code, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UIVersion {
  id: string;
  code: string;
  timestamp: Date;
  explanation: string;
  components?: string[];
}

interface VersionHistoryProps {
  versions: UIVersion[];
  currentVersionId: string | null;
  onRollback: (versionId: string) => void;
}

export function VersionHistory({
  versions,
  currentVersionId,
  onRollback,
}: VersionHistoryProps) {
  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-3">
        {versions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <Clock className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">No versions yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Generate a UI to create version history
            </p>
          </div>
        ) : (
          versions.map((version, index) => (
            <div
              key={version.id}
              className={cn(
                "relative p-4 rounded-lg border transition-all",
                currentVersionId === version.id
                  ? "bg-blue-50/50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800"
                  : "bg-card hover:bg-muted/50"
              )}
            >
              {/* Version Timeline Line */}
              {index !== versions.length - 1 && (
                <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-border" />
              )}
              
              <div className="flex items-start gap-3">
                {/* Version Icon */}
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                  currentVersionId === version.id
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                    : "bg-muted text-muted-foreground"
                )}>
                  <Code className="w-4 h-4" />
                </div>
                
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-muted-foreground">
                      {version.timestamp.toLocaleTimeString()}
                    </span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">
                      {version.timestamp.toLocaleDateString()}
                    </span>
                    {currentVersionId === version.id && (
                      <Badge variant="default" className="text-xs bg-blue-500">
                        Current
                      </Badge>
                    )}
                  </div>
                  
                  {/* Explanation */}
                  <p className="text-sm text-foreground mb-2">
                    {version.explanation}
                  </p>
                  
                  {/* Components Used */}
                  {version.components && version.components.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {version.components.map((comp) => (
                        <Badge 
                          key={comp} 
                          variant="outline" 
                          className="text-xs bg-background"
                        >
                          {comp}
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  {/* Rollback Button */}
                  <Button
                    size="sm"
                    variant={currentVersionId === version.id ? "outline" : "default"}
                    onClick={() => onRollback(version.id)}
                    className="w-full mt-1 text-xs"
                    disabled={currentVersionId === version.id}
                  >
                    <RotateCcw className="w-3 h-3 mr-1" />
                    {currentVersionId === version.id ? 'Current Version' : 'Rollback to this version'}
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </ScrollArea>
  );
}