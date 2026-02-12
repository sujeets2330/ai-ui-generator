'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { PanelResizeHandle, PanelGroup, Panel } from 'react-resizable-panels';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  RotateCcw, 
  Copy, 
  Zap, 
  AlertCircle,
  Code,
  Clock
} from 'lucide-react';
import { ChatMessage } from '@/components/chat-message';
import { CodeEditor } from '@/components/code-editor';
import { PreviewPane } from '@/components/preview-pane';
import { VersionHistory } from '@/components/version-history';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface UIVersion {
  id: string;
  code: string;
  timestamp: Date;
  explanation: string;
  components?: string[];
  prompt?: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [explanation, setExplanation] = useState('');
  const [versions, setVersions] = useState<UIVersion[]>([]);
  const [currentVersionId, setCurrentVersionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const generateId = () => `v-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const extractComponents = useCallback((code: string): string[] => {
    const matches = code.match(/<([A-Z][a-zA-Z0-9]*)/g) || [];
    return [...new Set(matches.map(m => m.replace('<', '')))];
  }, []);

  // ============= FIXED HANDLE GENERATE UI WITH RESET LOGIC =============
  const handleGenerateUI = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setError(null);
    
    setMessages(prev => [...prev, { 
      role: 'user', 
      content: userMessage,
      timestamp: new Date() 
    }]);
    
    setIsLoading(true);

    try {
      console.log('[Frontend] Sending request...');
      
      const response = await fetch('/api/generate-ui', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userMessage,
          previousCode: generatedCode,
          conversationHistory: messages.slice(-5),
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Rate limit reached. Please wait a moment and try again.');
        }
        throw new Error(data.details || data.error || 'Failed to generate UI');
      }

      if (!data.code) {
        throw new Error('No code generated');
      }

      const components = extractComponents(data.code);

      // CRITICAL FIX: Handle reset vs iteration
      if (data.shouldReset) {
        console.log(' RESETTING to new UI - clearing previous state');
        
        // Clear existing code and replace with new
        setGeneratedCode(data.code);
        setExplanation(data.explanation);
        
        // Create new version as FIRST version
        const newVersion: UIVersion = {
          id: generateId(),
          code: data.code,
          timestamp: new Date(),
          explanation: data.explanation || 'UI generated',
          components,
          prompt: userMessage,
        };
        
        // Replace entire version history with just this new version
        setVersions([newVersion]);
        setCurrentVersionId(newVersion.id);
        
        // Add assistant message
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.explanation || 'New UI generated successfully!',
          timestamp: new Date()
        }]);
        
        toast.success('New UI created!', {
          description: `Started fresh with ${components.length} components`,
        });
        
      } else {
        console.log(' ITERATING on existing UI - preserving history');
        
        // Update current code
        setGeneratedCode(data.code);
        setExplanation(data.explanation);
        
        // Add as new version to history (keep all previous versions)
        const newVersion: UIVersion = {
          id: generateId(),
          code: data.code,
          timestamp: new Date(),
          explanation: data.explanation || 'UI modified',
          components,
          prompt: userMessage,
        };
        
        setVersions(prev => [newVersion, ...prev]);
        setCurrentVersionId(newVersion.id);
        
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.explanation || 'UI modified successfully!',
          timestamp: new Date()
        }]);
        
        toast.success('UI modified!', {
          description: `Updated with ${components.length} components`,
        });
      }
      
      setError(null);

    } catch (error) {
      console.error('[Frontend] Error:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate UI');
      toast.error(error instanceof Error ? error.message : 'Generation failed');
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };
  // ============= END FIXED HANDLE GENERATE UI =============

  const handleResetUI = () => {
    setGeneratedCode('');
    setExplanation('');
    setMessages([]);
    setVersions([]);
    setCurrentVersionId(null);
    setError(null);
    toast.info('Reset complete');
  };

  const handleRollback = (versionId: string) => {
    const version = versions.find(v => v.id === versionId);
    if (version) {
      setGeneratedCode(version.code);
      setExplanation(version.explanation);
      setCurrentVersionId(versionId);
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: ` Rolled back to version from ${version.timestamp.toLocaleTimeString()}`,
        timestamp: new Date()
      }]);
      
      toast.success('Rolled back successfully');
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    toast.success('Code copied to clipboard');
  };

  return (
    <div className="h-screen bg-background flex flex-col">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Ryze AI UI Generator</h1>
              <p className="text-xs text-muted-foreground">
                Deterministic UI Agent • Fixed Component Library
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {generatedCode && (
              <Badge variant="outline" className="gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                {versions.length} {versions.length === 1 ? 'Version' : 'Versions'}
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetUI}
              disabled={!generatedCode}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>
      </header>

      {error && (
        <Alert variant="destructive" className="m-4 mb-0">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
          <Panel defaultSize={25} minSize={20}>
            <div className="h-full flex flex-col border-r">
              <div className="border-b px-4 py-2 bg-muted/30">
                <h2 className="text-sm font-medium">AI Chat Interface</h2>
              </div>
              
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[calc(100vh-250px)] text-center">
                      <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                        <Zap className="w-8 h-8 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">Describe your UI</h3>
                      <p className="text-sm text-muted-foreground max-w-xs">
                        Try saying: &quot;Create a login form with email and password&quot;
                      </p>
                      <p className="text-xs text-muted-foreground mt-4">
                        Or: &quot;Make a dashboard with a sidebar and chart&quot;
                      </p>
                    </div>
                  ) : (
                    messages.map((msg, idx) => (
                      <ChatMessage
                        key={idx}
                        role={msg.role}
                        content={msg.content}
                        timestamp={msg.timestamp}
                      />
                    ))
                  )}
                  <div ref={scrollRef} />
                </div>
              </ScrollArea>

              <div className="border-t p-4 bg-card/50">
                <div className="space-y-2">
                  <Textarea
                    placeholder="Describe the UI you want to generate or modify..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleGenerateUI();
                      }
                    }}
                    className="resize-none min-h-[80px] bg-background"
                    disabled={isLoading}
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {isLoading ? 'AI is thinking...' : 'Press Enter to send'}
                    </span>
                    <Button
                      onClick={handleGenerateUI}
                      disabled={isLoading || !input.trim()}
                      className="gap-2"
                    >
                      <Send className="w-4 h-4" />
                      {isLoading ? 'Generating...' : 'Generate'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Panel>

          <PanelResizeHandle className="w-1 bg-border hover:bg-blue-500 transition-colors" />

          <Panel defaultSize={25} minSize={20}>
            <div className="h-full flex flex-col border-r">
              <Tabs defaultValue="code" className="flex-1 flex flex-col">
                <div className="border-b px-2">
                  <TabsList className="w-full justify-start bg-transparent">
                    <TabsTrigger value="code" className="gap-2">
                      <Code className="w-4 h-4" />
                      Code
                    </TabsTrigger>
                    <TabsTrigger value="explanation" className="gap-2">
                      <Zap className="w-4 h-4" />
                      Explanation
                    </TabsTrigger>
                    <TabsTrigger value="history" className="gap-2">
                      <Clock className="w-4 h-4" />
                      History
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="code" className="flex-1 overflow-hidden p-0 m-0">
                  <div className="h-full flex flex-col">
                    <div className="border-b p-2 flex items-center justify-between bg-muted/30">
                      <span className="text-xs font-medium text-muted-foreground">
                        React + Tailwind
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleCopyCode}
                        disabled={!generatedCode}
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        Copy
                      </Button>
                    </div>
                    <div className="flex-1 overflow-auto">
                      <CodeEditor code={generatedCode} onChange={setGeneratedCode} />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="explanation" className="flex-1 overflow-hidden p-0 m-0">
                  <ScrollArea className="h-full">
                    <div className="p-4">
                      {explanation ? (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <Badge variant="default">AI Decision Log</Badge>
                          </div>
                          <div className="prose prose-sm dark:prose-invert">
                            <p className="text-sm leading-relaxed">{explanation}</p>
                          </div>
                          {currentVersionId && (
                            <div className="mt-4 pt-4 border-t">
                              <p className="text-xs text-muted-foreground">
                                Version ID: {currentVersionId}
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-64 text-center">
                          <Zap className="w-8 h-8 text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">
                            Generate a UI to see the AI explanation
                          </p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="history" className="flex-1 overflow-hidden p-0 m-0">
                  <VersionHistory
                    versions={versions}
                    currentVersionId={currentVersionId}
                    onRollback={handleRollback}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </Panel>

          <PanelResizeHandle className="w-1 bg-border hover:bg-blue-500 transition-colors" />

          <Panel defaultSize={50} minSize={30}>
            <PreviewPane code={generatedCode} />
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}