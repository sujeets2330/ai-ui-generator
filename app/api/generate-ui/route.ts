import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// ============================================
// FIXED COMPONENT LIBRARY - DETERMINISTIC
// ============================================
export const COMPONENT_LIBRARY = {
  Button: {
    props: ['className', 'onClick', 'disabled', 'variant', 'size', 'children'],
    variants: ['default', 'outline', 'ghost', 'destructive'],
    usage: '<Button onClick={() => {}} className="...">Click</Button>'
  },
  Card: {
    props: ['className', 'children'],
    usage: '<Card className="p-4">Content</Card>'
  },
  Input: {
    props: ['className', 'type', 'placeholder', 'onChange', 'value'],
    usage: '<Input type="email" placeholder="Enter email" />'
  },
  Textarea: {
    props: ['className', 'placeholder', 'onChange', 'value'],
    usage: '<Textarea placeholder="Enter text" />'
  },
  Badge: {
    props: ['className', 'variant', 'children'],
    variants: ['default', 'secondary', 'outline', 'destructive'],
    usage: '<Badge variant="secondary">Label</Badge>'
  },
  Dialog: {
    props: ['open', 'onOpenChange', 'children'],
    usage: '<Dialog open={true} onOpenChange={setOpen}><div>Content</div></Dialog>'
  },
  Table: {
    props: ['className', 'children'],
    usage: '<Table><thead><tr><th>Header</th></tr></thead><tbody><tr><td>Data</td></tr></tbody></Table>'
  },
  Sidebar: {
    props: ['className', 'children'],
    usage: '<Sidebar className="w-64">Menu items</Sidebar>'
  },
  Navbar: {
    props: ['className', 'children'],
    usage: '<Navbar className="bg-white shadow">Logo and navigation</Navbar>'
  },
  Chart: {
    props: ['className', 'type', 'data'],
    usage: '<Chart type="bar" data={mockData} />'
  }
};

const COMPONENT_NAMES = Object.keys(COMPONENT_LIBRARY);
const COMPONENT_LIST = COMPONENT_NAMES.join(', ');

const SYSTEM_PROMPTS = {
  PLANNER: `You are a UI planning expert. Your role is to create structured, deterministic UI plans.

FIXED COMPONENT LIBRARY (ONLY THESE ARE ALLOWED):
${Object.entries(COMPONENT_LIBRARY).map(([name, config]) => 
  `- ${name}: ${config.props.join(', ')}`
).join('\n')}

RULES:
1. ONLY use components from this list: ${COMPONENT_LIST}
2. NEVER create new components
3. Use HTML elements (div, span, p, h1-h6, ul, li) for layout
4. Use Tailwind classes for styling
5. Output a JSON plan with structure, components, and props

Your response must be valid JSON format:
{
  "layout": "flex-col | grid | stack",
  "structure": [
    {
      "component": "ComponentName",
      "props": {},
      "children": []
    }
  ],
  "tailwindClasses": ["class1", "class2"],
  "reasoning": "Brief explanation of choices"
}`,

  GENERATOR: `You are a precise React code generator. Generate ONLY JSX code using the fixed component library.

ALLOWED COMPONENTS: ${COMPONENT_LIST}
FORBIDDEN: imports, requires, custom components, inline styles, CSS-in-JS

CRITICAL - EVENT HANDLER RULES:
 CORRECT: onClick={() => console.log('clicked')}
 CORRECT: onChange={(e) => console.log(e.target.value)}
 WRONG: onClick={console.log('clicked')}
 WRONG: onChange={console.log(e.target.value)}

OUTPUT ONLY THE JSX CODE - NO EXPLANATIONS, NO BACKTICKS`,

  EXPLAINER: `You are a UI design explainer. Explain the decisions in 2-3 sentences.
Focus on: layout choices, component selection, and how it serves the user intent.
Be concise and clear.`,

  ITERATOR: `You are modifying existing UI code based on user feedback.

PRESERVE the existing structure and components.
ONLY make the specific requested changes.
DO NOT regenerate everything from scratch.
Maintain all existing event handlers and styling.

Output ONLY the modified JSX code.`
};

// ============================================
// AGENT STEP 1: PLANNER
// ============================================
async function planner(
  prompt: string, 
  previousCode: string,
  history: any[]
): Promise<any> {
  const messages = [
    ...history.slice(-3),
    { role: 'user', content: prompt }
  ];

  const response = await client.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    max_tokens: 800,
    temperature: 0.1,
    messages: [
      { role: 'system', content: SYSTEM_PROMPTS.PLANNER },
      { role: 'user', content: JSON.stringify({
        prompt,
        previousCode: previousCode ? 'Previous UI exists' : 'No previous UI',
        history: messages
      })}
    ],
  });

  const content = response.choices[0].message.content || '{}';
  
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : {
      layout: 'flex-col',
      structure: [],
      tailwindClasses: ['p-4'],
      reasoning: 'Default layout'
    };
  } catch {
    return {
      layout: 'flex-col',
      structure: [],
      tailwindClasses: ['p-4'],
      reasoning: content.substring(0, 100)
    };
  }
}

// ============================================
// AGENT STEP 2: GENERATOR
// ============================================
async function generator(
  prompt: string,
  plan: any,
  previousCode: string,
  isIteration: boolean
): Promise<string> {
  const systemPrompt = isIteration ? SYSTEM_PROMPTS.ITERATOR : SYSTEM_PROMPTS.GENERATOR;
  
  const context = isIteration ? {
    task: prompt,
    previousCode,
    changes: plan.reasoning || 'Modify existing UI',
    preserveStructure: true
  } : {
    prompt,
    plan,
    componentLibrary: COMPONENT_NAMES
  };

  const response = await client.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    max_tokens: 1500,
    temperature: 0.1,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: JSON.stringify(context) }
    ],
  });

  let code = response.choices[0].message.content || '';
  
  code = cleanGeneratedCode(code);
  code = enforceComponentWhitelist(code);
  code = fixEventHandlers(code);
  
  return code;
}

// ============================================
// AGENT STEP 3: EXPLAINER
// ============================================
async function explainer(
  prompt: string,
  plan: any,
  code: string,
  isIteration: boolean
): Promise<string> {
  const response = await client.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    max_tokens: 200,
    temperature: 0.1,
    messages: [
      { role: 'system', content: SYSTEM_PROMPTS.EXPLAINER },
      { role: 'user', content: JSON.stringify({
        request: prompt,
        layout: plan.layout,
        components: extractComponentsUsed(code),
        isModification: isIteration
      })}
    ],
  });

  return response.choices[0].message.content || 'UI generated based on your request.';
}

// ============================================
// VALIDATION & SAFETY
// ============================================
function cleanGeneratedCode(code: string): string {
  return code
    .replace(/```jsx?\n?/gi, '')
    .replace(/```\n?/g, '')
    .replace(/```tsx?\n?/gi, '')
    .replace(/```\n?/g, '')
    .replace(/import\s+.*?;?\n?/g, '')
    .replace(/export\s+default\s+.*?;?\n?/g, '')
    .replace(/export\s+.*?;?\n?/g, '')
    .replace(/require\s*\(.*?\)/g, '')
    .trim();
}

function enforceComponentWhitelist(code: string): string {
  const componentRegex = /<([A-Z][a-zA-Z0-9]*)/g;
  let match;
  const usedComponents = new Set<string>();
  
  while ((match = componentRegex.exec(code)) !== null) {
    usedComponents.add(match[1]);
  }
  
  let cleanedCode = code;
  usedComponents.forEach(comp => {
    if (!COMPONENT_NAMES.includes(comp) && comp !== 'Fragment' && comp !== 'div' && comp !== 'span' && comp !== 'h1' && comp !== 'h2' && comp !== 'h3' && comp !== 'h4' && comp !== 'h5' && comp !== 'h6' && comp !== 'p' && comp !== 'ul' && comp !== 'li' && comp !== 'table' && comp !== 'thead' && comp !== 'tbody' && comp !== 'tr' && comp !== 'td' && comp !== 'th') {
      const regex = new RegExp(`<${comp}([^>]*)>(.*?)<\/${comp}>`, 'gs');
      cleanedCode = cleanedCode.replace(regex, '<div$1>$2</div>');
      
      const selfClosingRegex = new RegExp(`<${comp}([^>]*)\/>`, 'g');
      cleanedCode = cleanedCode.replace(selfClosingRegex, '<div$1></div>');
    }
  });
  
  return cleanedCode;
}

function fixEventHandlers(code: string): string {
  code = code.replace(
    /onClick=\{console\.log\(([^}]+)\)\}/g,
    'onClick={() => console.log($1)}'
  );
  
  code = code.replace(
    /onChange=\{console\.log\(([^}]+)\)\}/g,
    'onChange={(e) => console.log($1)}'
  );
  
  code = code.replace(
    /onChange=\{e\s*=>\s*/g,
    'onChange={(e) => '
  );
  
  code = code.replace(
    /onChange=\{e\s*=>\s*console\.log\(([^}]+)\)\}/g,
    'onChange={(e) => console.log($1)}'
  );
  
  code = code.replace(
    /onChange=\{\(e\)\s*=>\s*console\.log\(([^}]+)\)(?!\})/g,
    'onChange={(e) => console.log($1)}'
  );
  
  code = code.replace(
    /\{console\.log\(([^}]+)\)\}(?!\s*=>)/g,
    '{() => console.log($1)}'
  );
  
  return code;
}

function extractComponentsUsed(code: string): string[] {
  const matches = code.match(/<([A-Z][a-zA-Z0-9]*)/g) || [];
  return [...new Set(matches.map(m => m.replace('<', '')))]
    .filter(c => COMPONENT_NAMES.includes(c));
}

function validateCodeSafety(code: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  const dangerousPatterns = [
    { pattern: /<script/i, msg: 'Script tags not allowed' },
    { pattern: /onload\s*=/i, msg: 'Event handlers must be via React props' },
    { pattern: /javascript:/i, msg: 'JavaScript: URLs not allowed' },
    { pattern: /eval\s*\(/i, msg: 'eval() not allowed' },
    { pattern: /Function\s*\(/i, msg: 'Function constructor not allowed' },
    { pattern: /document\./i, msg: 'Direct DOM access not allowed' },
    { pattern: /window\./i, msg: 'Window access not allowed' },
    { pattern: /localStorage/i, msg: 'Storage access not allowed' },
    { pattern: /sessionStorage/i, msg: 'Storage access not allowed' },
    { pattern: /fetch\s*\(/i, msg: 'fetch() not allowed' },
    { pattern: /XMLHttpRequest/i, msg: 'XHR not allowed' },
  ];
  
  dangerousPatterns.forEach(({ pattern, msg }) => {
    if (pattern.test(code)) {
      errors.push(msg);
    }
  });
  
  if (code.includes('{/*') && code.includes('*/}')) {
    const commentContent = code.match(/\{\/\*([\s\S]*?)\*\/\}/g);
    if (commentContent) {
      commentContent.forEach(comment => {
        if (comment.includes('system') || comment.includes('ignore previous') || comment.includes('override')) {
          errors.push('Suspicious comment content detected');
        }
      });
    }
  }
  
  return { valid: errors.length === 0, errors };
}

// ============================================
// PROMPT INJECTION PROTECTION
// ============================================
function sanitizePrompt(input: string): string {
  if (!input) return '';
  
  let sanitized = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/'/g, "\\'")
    .trim();
  
  if (sanitized.length > 500) {
    sanitized = sanitized.substring(0, 500);
  }
  
  return sanitized;
}

// ============================================
// MAIN API HANDLER - FIXED ITERATION LOGIC
// ============================================
export async function POST(request: NextRequest) {
  try {
    console.log(' Ryze AI Agent - UI Generation Request');
    
    // 1. API Key Check
    if (!process.env.GROQ_API_KEY) {
      console.error('[API] GROQ_API_KEY not set');
      return NextResponse.json({
        error: 'Configuration Error',
        details: 'GROQ_API_KEY not configured. Get a free key from https://console.groq.com',
        success: false
      }, { status: 400 });
    }

    // 2. Parse and sanitize request
    const body = await request.json();
    const rawPrompt = body.prompt || '';
    const previousCode = body.previousCode || '';
    const conversationHistory = body.conversationHistory || [];
    
    // 3. Sanitize input
    const prompt = sanitizePrompt(rawPrompt);
    
    if (!prompt) {
      return NextResponse.json({
        error: 'Invalid Input',
        details: 'Prompt cannot be empty',
        success: false
      }, { status: 400 });
    }

    // ============= FIXED ITERATION DETECTION LOGIC =============
    const promptLower = prompt.toLowerCase();
    
    // Indicators for a completely NEW UI (should reset)
    const isNewUIIndicator = 
      promptLower.includes('new') ||
      promptLower.includes('fresh') ||
      promptLower.includes('start over') ||
      promptLower.includes('reset') ||
      promptLower.includes('create') ||
      promptLower.includes('build') ||
      promptLower.includes('make a') ||
      promptLower.includes('generate a') ||
      promptLower.match(/^(create|build|make|generate)\s/); // Starts with these words
    
    // Indicators for MODIFYING existing UI (should iterate)
    const isExplicitIteration = 
      promptLower.includes('change') ||
      promptLower.includes('modify') ||
      promptLower.includes('update') ||
      promptLower.includes('edit') ||
      promptLower.includes('add') ||
      promptLower.includes('remove') ||
      promptLower.includes('delete') ||
      promptLower.includes('fix') ||
      promptLower.includes('improve');
    
    // Check if this is a completely different topic
    let isDifferentTopic = false;
    if (previousCode && conversationHistory.length > 0) {
      const previousPrompt = conversationHistory[conversationHistory.length - 1]?.content || '';
      const previousLower = previousPrompt.toLowerCase();
      const currentLower = promptLower;
      
      // Topic categories
      const topics = {
        modal: ['modal', 'dialog', 'popup', 'alert'],
        form: ['form', 'login', 'signup', 'register', 'input'],
        game: ['game', 'play', 'tic tac toe', 'counter'],
        card: ['card', 'profile', 'user', 'avatar'],
        dashboard: ['dashboard', 'chart', 'analytics', 'graph'],
        table: ['table', 'grid', 'data', 'list'],
        navbar: ['navbar', 'nav', 'header', 'menu'],
        sidebar: ['sidebar', 'side bar', 'drawer'],
        button: ['button', 'btn', 'click']
      };
      
      // Check if previous topic and current topic are different
      for (const [topic, keywords] of Object.entries(topics)) {
        const hadPreviousTopic = keywords.some(k => previousLower.includes(k));
        const hasCurrentTopic = keywords.some(k => currentLower.includes(k));
        
        if (hadPreviousTopic && !hasCurrentTopic) {
          isDifferentTopic = true;
          break;
        }
      }
      
      // Special case: from specific UI to "simple game page" - definitely different
      if (!currentLower.includes('modal') && !currentLower.includes('dialog') && 
          (currentLower.includes('game') || currentLower.includes('page'))) {
        isDifferentTopic = true;
      }
    }
    
    // FINAL DECISION: Should we reset to a new UI?
    const shouldReset = 
      !previousCode ||                       // No existing code
      isNewUIIndicator ||                   // Explicit new request
      isDifferentTopic ||                  // Completely different UI type
      promptLower.includes(' make a simple game page'); // SPECIAL CASE
    
    // Is this an iteration? Only if we're NOT resetting AND we have previous code
    const isIteration = !shouldReset && previousCode.length > 0;
    
    console.log('=================================');
    console.log(` DECISION: ${shouldReset ? ' NEW UI (RESET)' : isIteration ? ' ITERATION' : ' NEW GENERATION'}`);
    console.log(` Prompt: ${prompt.substring(0, 50)}...`);
    console.log(` New UI Indicator: ${isNewUIIndicator}`);
    console.log(` Explicit Iteration: ${isExplicitIteration}`);
    console.log(` Different Topic: ${isDifferentTopic}`);
    console.log(` Should Reset: ${shouldReset}`);
    console.log('=================================');
    // ============= END FIXED ITERATION DETECTION =============

    // 5. Use empty previous code if we're resetting
    const effectivePreviousCode = shouldReset ? '' : previousCode;
    const effectiveHistory = shouldReset ? [] : conversationHistory;

    // 6. AGENT STEP 1: PLAN
    console.log(' [Agent] Planner: Creating structure...');
    const plan = await planner(prompt, effectivePreviousCode, effectiveHistory);
    console.log(' Plan created:', plan.reasoning?.substring(0, 50));

    // 7. AGENT STEP 2: GENERATE
    console.log(' [Agent] Generator: Producing code...');
    const code = await generator(prompt, plan, effectivePreviousCode, isIteration);
    console.log(` Code generated (${code.length} chars)`);

    // 8. SAFETY VALIDATION
    console.log(' [Agent] Validator: Checking safety...');
    const safetyCheck = validateCodeSafety(code);
    if (!safetyCheck.valid) {
      console.warn(' Safety warnings:', safetyCheck.errors);
      return NextResponse.json({
        error: 'Safety Validation Failed',
        details: safetyCheck.errors.join(', '),
        success: false
      }, { status: 400 });
    }

    // 9. COMPONENT VALIDATION
    const usedComponents = extractComponentsUsed(code);
    const invalidComponents = usedComponents.filter(c => !COMPONENT_NAMES.includes(c));
    
    if (invalidComponents.length > 0) {
      console.warn(' Invalid components detected:', invalidComponents);
      return NextResponse.json({
        error: 'Component Validation Failed',
        details: `Components not in whitelist: ${invalidComponents.join(', ')}`,
        allowedComponents: COMPONENT_NAMES,
        success: false
      }, { status: 400 });
    }

    // 10. AGENT STEP 3: EXPLAIN
    console.log(' [Agent] Explainer: Generating explanation...');
    const explanation = await explainer(prompt, plan, code, isIteration);
    console.log(' Explanation generated');

    // 11. SUCCESS RESPONSE - Send shouldReset flag to frontend
    return NextResponse.json({
      code,
      explanation,
      plan: {
        layout: plan.layout || 'flex-col',
        reasoning: plan.reasoning || 'UI generated based on your request',
        tailwindClasses: plan.tailwindClasses || []
      },
      components: usedComponents,
      isIteration,
      shouldReset, 
      timestamp: new Date().toISOString(),
      success: true
    }, { status: 200 });

  } catch (error) {
    console.error(' API Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (errorMessage.includes('429') || errorMessage.includes('rate_limit')) {
      return NextResponse.json({
        error: 'Rate Limit Exceeded',
        details: 'You have reached the Groq API rate limit. Please wait a moment and try again.',
        retryAfter: 20,
        success: false
      }, { status: 429 });
    }
    
    if (errorMessage.includes('401') || errorMessage.includes('authentication') || errorMessage.includes('API key')) {
      return NextResponse.json({
        error: 'Authentication Failed',
        details: 'Invalid or expired GROQ_API_KEY. Please check your .env.local file.',
        success: false
      }, { status: 401 });
    }
    
    if (errorMessage.includes('model') || errorMessage.includes('decommissioned')) {
      return NextResponse.json({
        error: 'Model Error',
        details: 'The AI model is temporarily unavailable. Please try again later.',
        success: false
      }, { status: 503 });
    }
    
    return NextResponse.json({
      error: 'Generation Failed',
      details: errorMessage,
      success: false
    }, { status: 500 });
  }
}