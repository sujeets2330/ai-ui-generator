'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface PreviewPaneProps {
  code: string;
}

export function PreviewPane({ code }: PreviewPaneProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code) {
      setError(null);
      return;
    }

    try {
      const iframe = iframeRef.current;
      if (!iframe) return;

      // Convert React props to HTML attributes
      let htmlCode = code
        .replace(/className=/g, 'class=')
        .replace(/onClick=\{([^}]+)\}/g, (_, handler) => {
          return `onclick="console.log('clicked')"`;
        })
        .replace(/onChange=\{([^}]+)\}/g, (_, handler) => {
          return `onchange="console.log('changed')"`;
        });

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              body { margin: 0; padding: 16px; font-family: system-ui, sans-serif; }
              .preview-wrapper { max-width: 100%; overflow-x: auto; }
            </style>
          </head>
          <body>
            <div class="preview-wrapper">
              ${htmlCode}
            </div>
            <script>
              // Convert class attributes to className for React compatibility
              document.querySelectorAll('[class]').forEach(el => {
                el.setAttribute('className', el.getAttribute('class'));
              });
            </script>
          </body>
        </html>
      `;

      iframe.srcdoc = htmlContent;
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to render preview');
    }
  }, [code]);

  if (!code) {
    return (
      <div className="h-full flex items-center justify-center bg-muted/10">
        <div className="text-center space-y-3 p-8">
          <div className="text-4xl">🎨</div>
          <h3 className="text-lg font-semibold">No UI Generated Yet</h3>
          <p className="text-sm text-muted-foreground">Generate a UI to see the preview</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="border-b p-2 flex items-center justify-between bg-muted/30">
        <span className="text-xs font-medium text-muted-foreground">Live Preview</span>
        <Badge variant="outline" className="text-xs">HTML + Tailwind</Badge>
      </div>
      <div className="flex-1 bg-white">
        {error ? (
          <Alert variant="destructive" className="m-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <iframe
            ref={iframeRef}
            className="w-full h-full border-0"
            sandbox="allow-scripts"
            title="UI Preview"
          />
        )}
      </div>
    </div>
  );
}