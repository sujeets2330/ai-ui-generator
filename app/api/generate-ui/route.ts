import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// ============================================
// COMPONENT LIBRARY
// ============================================
export const COMPONENT_LIBRARY = {
  Button: {
    props: ['className', 'onClick', 'disabled', 'variant', 'size', 'children'],
    variants: ['default', 'outline', 'ghost', 'destructive'],
  },
  Card: { props: ['className', 'children'] },
  Input: { props: ['className', 'type', 'placeholder', 'onChange', 'value'] },
  Textarea: { props: ['className', 'placeholder', 'onChange', 'value'] },
  Badge: { props: ['className', 'variant', 'children'] },
  Dialog: { props: ['open', 'onOpenChange', 'children'] },
  Table: { props: ['className', 'children'] },
  Sidebar: { props: ['className', 'children'] },
  Navbar: { props: ['className', 'children'] },
  Chart: { props: ['className', 'type', 'data'] }
};

const COMPONENT_NAMES = Object.keys(COMPONENT_LIBRARY);

// ============================================
// FALLBACK TEMPLATES
// ============================================
const TEMPLATES: Record<string, string> = {
  login: `<Card className="w-full max-w-md mx-auto p-6">
  <h2 className="text-2xl font-bold mb-6">Login</h2>
  <div className="space-y-4">
    <Input type="email" placeholder="Email" className="w-full" />
    <Input type="password" placeholder="Password" className="w-full" />
    <Button onClick={() => console.log('login')} className="w-full">Login</Button>
  </div>
</Card>`,
  
  modal: `<Dialog open={true} onOpenChange={() => {}}>
  <Card className="p-6 max-w-md mx-auto">
    <h2 className="text-2xl font-bold mb-2">Modal Title</h2>
    <p className="text-gray-600 mb-4">Modal Description</p>
    <div className="flex gap-2 justify-end">
      <Button onClick={() => console.log('confirm')}>Confirm</Button>
      <Button onClick={() => console.log('cancel')} variant="outline">Cancel</Button>
    </div>
  </Card>
</Dialog>`,
  
  navbar: `<Navbar className="bg-blue-600 text-white p-4">
  <div className="flex items-center justify-between">
    <h1 className="text-xl font-bold">Logo</h1>
    <nav className="flex gap-4">
      <Button onClick={() => console.log('home')} variant="ghost">Home</Button>
      <Button onClick={() => console.log('about')} variant="ghost">About</Button>
      <Button onClick={() => console.log('contact')} variant="ghost">Contact</Button>
    </nav>
  </div>
</Navbar>`,
  
  card: `<Card className="max-w-sm p-4">
  <div className="aspect-square bg-gray-200 mb-4 rounded"></div>
  <h3 className="text-lg font-bold mb-2">Product Name</h3>
  <p className="text-gray-600 mb-2">Product description</p>
  <div className="flex items-center justify-between">
    <span className="text-xl font-bold">$99.99</span>
    <Button onClick={() => console.log('cart')}>Add to Cart</Button>
  </div>
</Card>`,
  
  table: `<Table className="w-full">
  <thead>
    <tr>
      <th className="text-left p-2">Name</th>
      <th className="text-left p-2">Email</th>
      <th className="text-left p-2">Status</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td className="p-2">John Doe</td>
      <td className="p-2">john@example.com</td>
      <td className="p-2"><Badge>Active</Badge></td>
    </tr>
    <tr>
      <td className="p-2">Jane Smith</td>
      <td className="p-2">jane@example.com</td>
      <td className="p-2"><Badge variant="secondary">Inactive</Badge></td>
    </tr>
  </tbody>
</Table>`
};

function detectTemplate(prompt: string): string | null {
  const p = prompt.toLowerCase();
  if (p.includes('login') || p.includes('sign in')) return 'login';
  if (p.includes('modal') || p.includes('dialog')) return 'modal';
  if (p.includes('navbar') || p.includes('navigation')) return 'navbar';
  if (p.includes('product') || p.includes('card')) return 'card';
  if (p.includes('table')) return 'table';
  return null;
}

// ============================================
// ULTRA CLEANER
// ============================================
function ultraClean(code: string): string {
  return code
    .replace(/```[a-z]*\n?/gi, '')
    .replace(/^(Here'?s?|The)\s+.*?:\s*/i, '')
    .replace(/^\s*\{\}+\}*>\s*$/gm, '')
    .replace(/\n\s*\{\}+\}*>\s*/g, '')
    .replace(/^\s*\}+\s*$/gm, '')
    .replace(/import\s+.*?;?\s*/gi, '')
    .replace(/export\s+.*?;?\s*/gi, '')
    .replace(/^(\s*)([A-Z]\w+)\s+([^<\n]*>)/gm, '$1<$2 $3')
    .replace(/\sclass=/gi, ' className=')
    .replace(/\s(onclick|onchange|onfocus|onblur)=/gi, (m, p1) => 
      ' on' + p1.charAt(2).toUpperCase() + p1.slice(3) + '=')
    .replace(/\s(variant|size)-(\w+)/g, ' $1="$2"')
    .replace(/(onClick|onChange|onOpenChange)=\{null\}/g, '$1={() => {}}')
    .replace(/onClick="([^"]+)"/g, 'onClick={() => $1}')
    .replace(/onChange="([^"]+)"/g, 'onChange={(e) => $1}')
    .trim();
}

// ============================================
// SMART RECONSTRUCTOR
// ============================================
function reconstruct(code: string, prompt: string): string {
  let fixed = ultraClean(code);
  
  // Check if broken
  const broken = 
    fixed.includes('{}>') || 
    fixed.includes('{}}>') ||
    fixed.length < 30 ||
    !fixed.includes('<') ||
    (fixed.match(/</g) || []).length < 2;
  
  if (broken) {
    console.log(' Broken output, using template');
    const template = detectTemplate(prompt);
    return template && TEMPLATES[template] ? TEMPLATES[template] : TEMPLATES.modal;
  }
  
  // Line reconstruction
  const lines = fixed.split('\n');
  const rebuilt: string[] = [];
  const stack: string[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed === '{}' || trimmed === '}') continue;
    
    // Opening tag
    const openMatch = trimmed.match(/^<([A-Za-z]\w*)/);
    if (openMatch && !trimmed.includes('</') && !trimmed.endsWith('/>')) {
      stack.push(openMatch[1]);
    }
    
    // Fix content without closing
    const contentMatch = trimmed.match(/^<([a-z]\w*|[A-Z]\w*)([^>]*)>([^<]+)$/);
    if (contentMatch) {
      const [, tag, attrs, content] = contentMatch;
      rebuilt.push(line.replace(trimmed, `<${tag}${attrs}>${content}</${tag}>`));
      continue;
    }
    
    // Closing tag
    if (trimmed.match(/^<\//)) {
      stack.pop();
    }
    
    rebuilt.push(line);
  }
  
  // Close remaining
  while (stack.length > 0) {
    const tag = stack.pop();
    rebuilt.push(`</${tag}>`);
  }
  
  return rebuilt.join('\n');
}

// ============================================
// PROMPTS
// ============================================
const PROMPTS = {
  PLAN: `Plan UI structure. Output JSON only:
{"layout": "flex-col", "structure": [], "reasoning": "text"}`,

  GEN: `Generate PERFECT JSX code. Follow these examples EXACTLY:

LOGIN FORM:
<Card className="w-full max-w-md mx-auto p-6">
  <h2 className="text-2xl font-bold mb-6">Login</h2>
  <div className="space-y-4">
    <Input type="email" placeholder="Email" className="w-full" />
    <Input type="password" placeholder="Password" className="w-full" />
    <Button onClick={() => console.log('login')} className="w-full">Login</Button>
  </div>
</Card>

MODAL:
<Dialog open={true} onOpenChange={() => {}}>
  <Card className="p-6 max-w-md">
    <h2 className="text-2xl font-bold mb-2">Title</h2>
    <p className="mb-4">Description</p>
    <Button onClick={() => console.log('ok')}>OK</Button>
  </Card>
</Dialog>

RULES:
- Use className NOT class
- Use onClick NOT onclick
- Every tag starts with <
- Arrow functions for events
- NO {}>  or malformed syntax

Output ONLY JSX code.`,

  EXPLAIN: `Explain UI in 2 sentences.`
};

// ============================================
// AGENTS
// ============================================
async function plan(prompt: string): Promise<any> {
  try {
    const res = await client.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      max_tokens: 500,
      temperature: 0,
      messages: [
        { role: 'system', content: PROMPTS.PLAN },
        { role: 'user', content: prompt }
      ],
    });
    const content = res.choices[0].message.content || '{}';
    const json = content.match(/\{[\s\S]*\}/)?.[0];
    return json ? JSON.parse(json) : { layout: 'flex-col', structure: [], reasoning: '' };
  } catch {
    return { layout: 'flex-col', structure: [], reasoning: 'fallback' };
  }
}

async function generate(prompt: string, planData: any): Promise<string> {
  try {
    const res = await client.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      max_tokens: 2000,
      temperature: 0,
      messages: [
        { role: 'system', content: PROMPTS.GEN },
        { role: 'user', content: `Create: ${prompt}` }
      ],
    });
    
    let code = res.choices[0].message.content || '';
    console.log(` AI: ${code.length} chars`);
    
    code = reconstruct(code, prompt);
    code = whitelist(code);
    code = fixHandlers(code);
    
    // Final check
    if (code.includes('{}>') || code.length < 30) {
      const template = detectTemplate(prompt);
      return template && TEMPLATES[template] ? TEMPLATES[template] : TEMPLATES.modal;
    }
    
    return code;
  } catch (err) {
    console.error('Gen error:', err);
    const template = detectTemplate(prompt);
    return template && TEMPLATES[template] ? TEMPLATES[template] : TEMPLATES.modal;
  }
}

async function explain(prompt: string): Promise<string> {
  try {
    const res = await client.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      max_tokens: 100,
      temperature: 0.3,
      messages: [
        { role: 'system', content: PROMPTS.EXPLAIN },
        { role: 'user', content: prompt }
      ],
    });
    return res.choices[0].message.content || 'UI generated';
  } catch {
    return 'UI generated successfully';
  }
}

// ============================================
// HELPERS
// ============================================
function whitelist(code: string): string {
  const allowed = ['div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tr', 'td', 'th',
    'nav', 'header', 'footer', 'section', 'main'];
  
  const comps = new Set<string>();
  const regex = /<([A-Z]\w*)/g;
  let match;
  while ((match = regex.exec(code)) !== null) {
    comps.add(match[1]);
  }
  
  comps.forEach(c => {
    if (!COMPONENT_NAMES.includes(c)) {
      code = code.replace(new RegExp(`<${c}([^>]*)>(.*?)</${c}>`, 'gs'), '<div$1>$2</div>');
      code = code.replace(new RegExp(`<${c}([^>]*) />`, 'g'), '<div$1 />');
    }
  });
  
  return code;
}

function fixHandlers(code: string): string {
  return code
    .replace(/onClick=\{console\.log\(([^}]+)\)\}/g, 'onClick={() => console.log($1)}')
    .replace(/onChange=\{console\.log\(([^}]+)\)\}/g, 'onChange={(e) => console.log($1)}')
    .replace(/onChange=\{\(\)\s*=>/g, 'onChange={(e) =>');
}

function getComponents(code: string): string[] {
  const matches = code.match(/<([A-Z]\w*)/g) || [];
  return [...new Set(matches.map(m => m.replace('<', '')))]
    .filter(c => COMPONENT_NAMES.includes(c));
}

function safety(code: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const bad = [/<script/i, /javascript:/i, /eval\(/i, /document\./i, /window\./i, /localStorage/i];
  bad.forEach(p => { if (p.test(code)) errors.push('Unsafe'); });
  return { valid: errors.length === 0, errors };
}

function clean(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .trim()
    .substring(0, 1000);
}

function shouldReset(prompt: string, prev: string): boolean {
  if (!prev) return true;
  const p = prompt.toLowerCase();
  if (['start over', 'reset', 'new ui'].some(k => p.includes(k))) return true;
  if (/^(create|build|make|generate|design)\s/i.test(prompt)) return true;
  if (['change', 'modify', 'update', 'edit', 'fix'].some(k => p.includes(k))) return false;
  return false;
}

// ============================================
// MAIN
// ============================================
export async function POST(request: NextRequest) {
  try {
    console.log(' UI Generator v2');
    
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({
        error: 'Config Error',
        success: false
      }, { status: 500 });
    }

    const body = await request.json();
    const prompt = clean(body.prompt || '');
    const prev = body.previousCode || '';
    
    if (!prompt) {
      return NextResponse.json({
        error: 'No prompt',
        success: false
      }, { status: 400 });
    }

    const reset = shouldReset(prompt, prev);
    console.log(` ${reset ? 'NEW' : 'ITER'}: "${prompt.substring(0, 40)}..."`);

    const planData = await plan(prompt);
    const code = await generate(prompt, planData);
    
    console.log(` ${code.length} chars`);

    const safe = safety(code);
    if (!safe.valid) {
      return NextResponse.json({
        error: 'Unsafe code',
        success: false
      }, { status: 400 });
    }

    const components = getComponents(code);
    const explanation = await explain(prompt);

    return NextResponse.json({
      code,
      explanation,
      plan: planData,
      components,
      isIteration: !reset,
      shouldReset: reset,
      timestamp: new Date().toISOString(),
      success: true
    });

  } catch (error) {
    console.error('**', error);
    return NextResponse.json({
      error: 'Failed',
      details: error instanceof Error ? error.message : 'Unknown',
      success: false
    }, { status: 500 });
  }
}