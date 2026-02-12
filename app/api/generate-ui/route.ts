import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// ============================================
// COMPONENT LIBRARY - CLEAN & SIMPLE
// ============================================
export const COMPONENT_LIBRARY = {
  Button: {
    props: ['className', 'onClick', 'disabled', 'variant', 'size', 'children', 'type'],
    variants: ['default', 'outline', 'ghost', 'destructive', 'link', 'primary', 'secondary'],
    sizes: ['default', 'sm', 'lg', 'icon'],
  },
  Card: { props: ['className', 'children'] },
  Input: { props: ['className', 'type', 'placeholder', 'onChange', 'value'] },
  Textarea: { props: ['className', 'placeholder', 'onChange', 'value'] },
  Badge: { props: ['className', 'variant', 'children'] },
  Dialog: { props: ['open', 'onOpenChange', 'children'] },
  Table: { props: ['className', 'children'] },
  Sidebar: { props: ['className', 'children'] },
  Navbar: { props: ['className', 'children'] },
  Chart: { props: ['className', 'type', 'data'] },
  
  // HTML elements - explicitly allowed
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
  label: { props: ['className', 'htmlFor', 'children'] },
  table: { props: ['className', 'children'] },
  thead: { props: ['className', 'children'] },
  tbody: { props: ['className', 'children'] },
  tr: { props: ['className', 'children'] },
  th: { props: ['className', 'children'] },
  td: { props: ['className', 'children'] }
};

const COMPONENT_NAMES = Object.keys(COMPONENT_LIBRARY);

// ============================================
// CLEAN GENERATOR PROMPT - NO HARDCODED EXAMPLES
// ============================================
const GENERATOR_PROMPT = `You are a React JSX code generator. Generate ONLY valid JSX code.

COMPONENTS AVAILABLE:
${COMPONENT_NAMES.join(', ')}

REACT RULES:
1. Use className, NOT class
2. Use onClick, onChange, onSubmit with arrow functions: onClick={() => {}}
3. ALL tags must be properly closed: <div></div> or <Input />
4. Text MUST be inside tags: <h1>Title</h1> NOT Title<
5. Forms must have onSubmit with e.preventDefault()

Your task: Generate JSX for: {{PROMPT}}

Output ONLY the JSX code. No explanations, no markdown.`;

// ============================================
// CLEAN FIX FUNCTION - ONLY FIXES SYNTAX, NO TEMPLATES
// ============================================
function fixJSX(code: string): string {
  let fixed = code
    // Remove markdown
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
  fixed = fixed.replace(/onOpenChange=\{null\}/g, 'onOpenChange={() => {}}');
  fixed = fixed.replace(/\{\}\}>/g, 'onOpenChange={() => {}}>');
  
  // Fix text outside tags
  fixed = fixed.replace(/^([A-Za-z][A-Za-z\s]+)</gm, (match, text) => {
    if (text.includes('Login')) return `<h1 className="text-2xl font-bold">${text}</h1>`;
    if (text.includes('Email')) return `<label className="block text-sm font-medium">${text}</label>`;
    if (text.includes('Password')) return `<label className="block text-sm font-medium">${text}</label>`;
    if (text.includes('Logo')) return `<span className="text-lg font-bold">${text}</span>`;
    if (text.includes('Title')) return `<h2 className="text-xl font-bold">${text}</h2>`;
    return `<span>${text}</span>`;
  });
  
  // Remove stray characters
  fixed = fixed.replace(/<{2,}/g, '<');
  fixed = fixed.replace(/^\s*\{\}\s*$/gm, '');
  fixed = fixed.replace(/^\s*\}\s*$/gm, '');
  
  return fixed;
}

// ============================================
// CLEAN VALIDATION - ONLY SAFETY, NO TEMPLATE MATCHING
// ============================================
function validateComponents(code: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const matches = code.match(/<([A-Z][a-zA-Z0-9]*)/g) || [];
  const used = [...new Set(matches.map(m => m.replace('<', '')))];
  
  const allowed = [...COMPONENT_NAMES, 'Fragment', ...Object.keys(COMPONENT_LIBRARY).filter(k => k === k.toLowerCase())];
  
  used.forEach(comp => {
    if (!allowed.includes(comp)) {
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
    { p: /document\./i, m: 'document access' },
    { p: /window\./i, m: 'window access' },
    { p: /innerHTML/i, m: 'innerHTML' },
  ];
  
  patterns.forEach(({ p, m }) => {
    if (p.test(code)) errors.push(`${m} not allowed`);
  });
  
  return { valid: errors.length === 0, errors };
}

// ============================================
// AGENT: GENERATOR - PURE LLM, NO TEMPLATES
// ============================================
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Ryze AI - Pure LLM Generator');
    
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

    console.log(`📝 Generating for: "${userPrompt.substring(0, 60)}..."`);

    // ============= SINGLE LLM CALL =============
    const response = await client.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      max_tokens: 2000,
      temperature: 0.3,
      messages: [
        { 
          role: 'system', 
          content: GENERATOR_PROMPT.replace('{{PROMPT}}', userPrompt)
        }
      ],
    });

    let code = response.choices[0].message.content || '';
    console.log(`📦 Raw output: ${code.length} chars`);

    // ============= CLEAN & FIX =============
    code = fixJSX(code);
    
    // ============= VALIDATE =============
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

    // ============= SIMPLE EXPLANATION =============
    const explanation = `Generated UI for: ${userPrompt}`;

    console.log(`✅ Success: ${code.length} chars`);

    return NextResponse.json({
      code,
      explanation,
      success: true,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error:', error);
    return NextResponse.json({ 
      error: 'Generation Failed', 
      details: error instanceof Error ? error.message : 'Unknown error',
      success: false 
    }, { status: 500 });
  }
}