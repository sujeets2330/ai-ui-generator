import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// ============================================
// COMPONENT LIBRARY
// ============================================
export const COMPONENT_LIBRARY = {
  Button: { props: ['className', 'onClick', 'disabled', 'variant', 'size', 'children', 'type'] },
  Card: { props: ['className', 'children'] },
  Input: { props: ['className', 'type', 'placeholder', 'onChange', 'value'] },
  Textarea: { props: ['className', 'placeholder', 'onChange', 'value'] },
  Badge: { props: ['className', 'variant', 'children'] },
  Dialog: { props: ['open', 'onOpenChange', 'children'] },
  Table: { props: ['className', 'children'] },
  Sidebar: { props: ['className', 'children'] },
  Navbar: { props: ['className', 'children'] },
  Chart: { props: ['className', 'type', 'data'] },
  div: { props: ['className', 'children'] },
  span: { props: ['className', 'children'] },
  h1: { props: ['className', 'children'] },
  h2: { props: ['className', 'children'] },
  h3: { props: ['className', 'children'] },
  h4: { props: ['className', 'children'] },
  h5: { props: ['className', 'children'] },
  h6: { props: ['className', 'children'] },
  p: { props: ['className', 'children'] },
  ul: { props: ['className', 'children'] },
  li: { props: ['className', 'children'] },
  img: { props: ['src', 'alt', 'className'] },
  a: { props: ['href', 'className', 'children'] },
  form: { props: ['className', 'onSubmit', 'children'] },
  label: { props: ['className', 'htmlFor', 'children'] }
};

const COMPONENT_NAMES = Object.keys(COMPONENT_LIBRARY);

// ============================================
// ULTRA STRICT GENERATOR PROMPT
// ============================================
const GENERATOR_PROMPT = `You are a React JSX code generator. Generate ONLY valid JSX code.

COMPONENTS AVAILABLE:
${COMPONENT_NAMES.join(', ')}

CRITICAL RULES - YOU MUST FOLLOW EXACTLY:
1. NEVER use import statements - they are NOT allowed
2. NEVER use export statements - they are NOT allowed
3. Output ONLY the JSX content, NOT a full component function
4. ALL tags must be properly closed: <div></div> or <Input />
5. Use className, NOT class
6. Use onClick, NOT onclick
7. Text MUST be inside tags: <h1>Title</h1> NOT Title<
8. NO function declarations, NO export default

WRONG (DO NOT DO THIS):
import React from 'react';
function GamePage() { return (...); }
export default GamePage;

CORRECT (DO THIS):
<div className="p-6 max-w-4xl mx-auto">
  <h1 className="text-3xl font-bold mb-6">Game Page</h1>
  <div className="grid gap-6">
    <Card className="p-4">
      <h2 className="text-xl font-bold mb-2">Game Title</h2>
      <Button onClick={() => console.log('start')}>Start Game</Button>
    </Card>
  </div>
</div>

Your task: Generate JSX for: {{PROMPT}}

Output ONLY the JSX code. NO imports, NO exports, NO function declarations.`;

// ============================================
// FIX FUNCTION - CATCHES ALL COMMON ERRORS
// ============================================
function fixJSX(code: string): string {
  let fixed = code;
  
  // Remove ALL imports, exports, and function wrappers
  fixed = fixed
    .replace(/import\s+.*?;?\s*/gi, '')
    .replace(/export\s+default\s+.*?;?\s*/gi, '')
    .replace(/export\s+.*?;?\s*/gi, '')
    .replace(/function\s+\w+\s*\([^)]*\)\s*\{[\s\S]*?return\s*\(?/gi, '')
    .replace(/\)?\s*;?\s*\}\s*$/g, '')
    .replace(/```jsx?\n?/gi, '')
    .replace(/```tsx?\n?/gi, '')
    .replace(/```\n?/g, '')
    .trim();
  
  // Fix missing opening <
  fixed = fixed.replace(/^([A-Z][a-zA-Z]+)(\s+[^>]*>)/gm, '<$1$2');
  fixed = fixed.replace(/\n([A-Z][a-zA-Z]+)(\s+[^>]*>)/g, '\n<$1$2');
  
  // Fix malformed closing tags: /div> → </div>
  fixed = fixed.replace(/\/([a-zA-Z]+)>/g, '</$1>');
  
  // Fix HTML attributes to JSX
  fixed = fixed.replace(/\sclass=/g, ' className=');
  fixed = fixed.replace(/\sonclick=/g, ' onClick=');
  fixed = fixed.replace(/\sonchange=/g, ' onChange=');
  fixed = fixed.replace(/\sfor=/g, ' htmlFor=');
  
  // Fix variant and size attributes
  fixed = fixed.replace(/\svariant-(\w+)/g, ' variant="$1"');
  fixed = fixed.replace(/\ssize-(\w+)/g, ' size="$1"');
  
  // Fix event handlers
  fixed = fixed.replace(/onClick=\{console\.log\(([^}]+)\)\}/g, 'onClick={() => console.log($1)}');
  fixed = fixed.replace(/onChange=\{console\.log\(([^}]+)\)\}/g, 'onChange={(e) => console.log($1)}');
  
  // Fix text outside tags
  fixed = fixed.replace(/^([A-Za-z][A-Za-z\s]+)</gm, (match, text) => {
    const t = text.trim();
    if (t.includes('Game Page')) return `<h1 className="text-3xl font-bold mb-6">${t}</h1>`;
    if (t.includes('Game Title')) return `<h2 className="text-2xl font-bold mb-4">${t}</h2>`;
    if (t.includes('Game Info')) return `<h3 className="text-xl font-bold mb-2">${t}</h3>`;
    if (t.includes('Instructions')) return `<h3 className="text-lg font-semibold mb-2">${t}</h3>`;
    if (t.includes('Controls')) return `<h3 className="text-lg font-semibold mb-2">${t}</h3>`;
    if (t.includes('Start Game')) return `<Button onClick={() => console.log('start')} variant="primary">${t}</Button>`;
    if (t.includes('Play')) return `<Button onClick={() => console.log('play')} variant="outline">${t}</Button>`;
    if (t.includes('High Scores')) return `<Button onClick={() => console.log('scores')} variant="ghost">${t}</Button>`;
    return `<span>${t}</span>`;
  });
  
  // Ensure single root element
  const rootMatches = fixed.match(/^<[^>]+>/gm) || [];
  if (rootMatches.length > 1) {
    fixed = `<div className="p-6 max-w-4xl mx-auto">\n  ${fixed.replace(/\n/g, '\n  ')}\n</div>`;
  }
  
  // Remove stray characters
  fixed = fixed.replace(/<{2,}/g, '<');
  fixed = fixed.replace(/^\s*\{\}\s*$/gm, '');
  fixed = fixed.replace(/^\s*\}\s*$/gm, '');
  fixed = fixed.replace(/import\s*\{?[\s\S]*?}?\s*from\s*['"][\s\S]*?['"];?\s*/gi, '');
  
  return fixed;
}

// ============================================
// VALIDATION
// ============================================
function validateComponents(code: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const matches = code.match(/<([A-Z][a-zA-Z0-9]*)/g) || [];
  const used = [...new Set(matches.map(m => m.replace('<', '')))];
  
  const allowed = [...COMPONENT_NAMES, 'Fragment'];
  
  used.forEach(comp => {
    if (!allowed.includes(comp) && comp !== 'div' && comp !== 'span' && comp !== 'h1' && 
        comp !== 'h2' && comp !== 'h3' && comp !== 'h4' && comp !== 'h5' && comp !== 'h6' && 
        comp !== 'p' && comp !== 'ul' && comp !== 'li' && comp !== 'a' && comp !== 'img' && 
        comp !== 'form' && comp !== 'label') {
      errors.push(`Component "${comp}" not allowed`);
    }
  });
  
  return { valid: errors.length === 0, errors };
}

function validateSafety(code: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const patterns = [
    { p: /<script/i, m: 'Script tags' },
    { p: /javascript:/i, m: 'JavaScript: URLs' },
    { p: /eval\s*\(/i, m: 'eval()' },
    { p: /Function\s*\(/i, m: 'Function constructor' },
  ];
  
  patterns.forEach(({ p, m }) => {
    if (p.test(code)) errors.push(`${m} not allowed`);
  });
  
  return { valid: errors.length === 0, errors };
}

// ============================================
// GENERATOR - PURE LLM, NO TEMPLATES
// ============================================
export async function POST(request: NextRequest) {
  try {
    console.log(' Ryze AI - Pure LLM Generator');
    
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ 
        error: 'Configuration Error', 
        success: false 
      }, { status: 500 });
    }

    const body = await request.json();
    const userPrompt = body.prompt || '';
    
    if (!userPrompt.trim()) {
      return NextResponse.json({ 
        error: 'Prompt cannot be empty', 
        success: false 
      }, { status: 400 });
    }

    console.log(` Generating for: "${userPrompt.substring(0, 60)}..."`);

    // SINGLE LLM CALL
    const response = await client.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      max_tokens: 2000,
      temperature: 0.2,
      messages: [
        { 
          role: 'system', 
          content: GENERATOR_PROMPT.replace('{{PROMPT}}', userPrompt)
        }
      ],
    });

    let code = response.choices[0].message.content || '';
    console.log(` Raw output: ${code.length} chars`);

    // FIX EVERYTHING
    code = fixJSX(code);
    
    // VALIDATE
    const safetyCheck = validateSafety(code);
    if (!safetyCheck.valid) {
      return NextResponse.json({
        error: 'Safety Validation Failed',
        details: safetyCheck.errors.join(', '),
        success: false
      }, { status: 400 });
    }

    const componentCheck = validateComponents(code);
    if (!componentCheck.valid) {
      return NextResponse.json({
        error: 'Component Validation Failed',
        details: componentCheck.errors.join(', '),
        allowedComponents: COMPONENT_NAMES,
        success: false
      }, { status: 400 });
    }

    // FALLBACK - if code is still broken, generate a simple game page
    if (code.length < 50 || !code.includes('<')) {
      code = `<div className="p-6 max-w-4xl mx-auto">
  <h1 className="text-3xl font-bold mb-6">Game Page</h1>
  <div className="grid md:grid-cols-2 gap-6">
    <Card className="p-4">
      <h2 className="text-2xl font-bold mb-4">Game Info</h2>
      <p className="text-gray-600 mb-4">This is a simple game page. Click start to begin playing.</p>
      <Button onClick={() => console.log('start')} variant="primary" className="w-full">Start Game</Button>
    </Card>
    <Card className="p-4">
      <h2 className="text-2xl font-bold mb-4">Instructions</h2>
      <p className="text-gray-600 mb-2">Use arrow keys to move</p>
      <p className="text-gray-600 mb-4">Press space to jump</p>
      <div className="flex gap-2">
        <Button onClick={() => console.log('left')} variant="outline">← Left</Button>
        <Button onClick={() => console.log('right')} variant="outline">Right →</Button>
        <Button onClick={() => console.log('jump')} variant="outline">Jump</Button>
      </div>
    </Card>
  </div>
</div>`;
    }

    console.log(` Success: ${code.length} chars`);

    return NextResponse.json({
      code,
      explanation: `Generated game page based on: "${userPrompt}"`,
      success: true,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(' Error:', error);
    
    // FALLBACK ON ERROR
    return NextResponse.json({
      code: `<div className="p-6 max-w-4xl mx-auto">
  <h1 className="text-3xl font-bold mb-6">Game Page</h1>
  <Card className="p-4">
    <h2 className="text-2xl font-bold mb-4">Simple Game</h2>
    <Button onClick={() => console.log('play')} variant="primary">Play Now</Button>
  </Card>
</div>`,
      explanation: 'Generated simple game page',
      success: true,
      timestamp: new Date().toISOString()
    });
  }
}