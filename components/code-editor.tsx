'use client';

import { ScrollArea } from '@/components/ui/scroll-area';

interface CodeEditorProps {
  code: string;
  onChange: (code: string) => void;
}

export function CodeEditor({ code, onChange }: CodeEditorProps) {
  return (
    <ScrollArea className="h-full">
      <div className="h-full">
        <textarea
          value={code}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-full p-4 font-mono text-sm bg-background border-0 focus:outline-none resize-none"
          placeholder="Generated code will appear here..."
          spellCheck="false"
        />
      </div>
    </ScrollArea>
  );
}
