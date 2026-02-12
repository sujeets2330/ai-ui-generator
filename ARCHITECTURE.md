# Ryze AI UI Generator - Architecture Documentation

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js Frontend (React)                │
│  ┌──────────────┬──────────────────┬──────────────────────┐ │
│  │ Chat Panel   │   Code Editor    │   Live Preview       │ │
│  │ (User Input) │  (Generated JSX) │   (Sandboxed iframe) │ │
│  └──────────────┴──────────────────┴──────────────────────┘ │
│                           ▼                                   │
│              /api/generate-ui (POST)                         │
└─────────────────────────────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   Backend AI Agent (Node.js)                │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 1. PLANNER                                            │  │
│  │    • Analyzes user intent                            │  │
│  │    • Creates structured plan                         │  │
│  │    • Selects components and layout                   │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 2. GENERATOR                                          │  │
│  │    • Converts plan to React code                     │  │
│  │    • Validates against whitelist                     │  │
│  │    • Ensures proper JSX syntax                       │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 3. EXPLAINER                                          │  │
│  │    • Generates human-readable explanation            │  │
│  │    • Justifies design decisions                      │  │
│  │    • References component choices                    │  │
│  └───────────────────────────────────────────────────────┘  │
│                           ▼                                   │
│                   Anthropic Claude API                       │
└─────────────────────────────────────────────────────────────┘
```

## Component Architecture

### Frontend Components

#### 1. **page.tsx** (Main Application)
- **Responsibility**: Main orchestrator component
- **State Management**:
  - `messages`: Chat history
  - `input`: Current user input
  - `generatedCode`: Current UI code
  - `explanation`: AI's explanation of design
  - `versions`: History of all generated UIs
  - `isLoading`: Generation in progress state

**Key Functions**:
```typescript
handleGenerateUI()    // Calls API to generate UI
handleResetUI()       // Clears all state
handleRollback()      // Restores previous version
handleCopyCode()      // Copies code to clipboard
```

#### 2. **ChatMessage** Component
- **Props**: `role` (user|assistant), `content` (message text)
- **Styling**: Different backgrounds for user vs AI messages
- **Behavior**: Auto-scrolls to latest message

#### 3. **CodeEditor** Component
- **Props**: `code`, `onChange`
- **Features**:
  - Editable textarea with monospace font
  - Syntax highlighting ready
  - Full width/height responsive layout
  - Line numbers support

#### 4. **PreviewPane** Component
- **Props**: `code` (JSX to render)
- **Features**:
  - Sandboxed iframe for security
  - Tailwind CSS support via CDN
  - Error boundary with error display
  - Auto-refreshes when code changes

#### 5. **VersionHistory** Component
- **Props**: `versions`, `currentVersionId`, `onRollback`
- **Features**:
  - Shows all previous versions
  - Timestamp for each version
  - Current version highlighted
  - Rollback button for each version

### Backend API

#### Route: `/api/generate-ui` (POST)

**Request Body**:
```typescript
interface GenerateUIRequest {
  prompt: string              // User's description
  previousCode?: string       // Code to build upon
  conversationHistory?: Message[]  // Chat history for context
}
```

**Response**:
```typescript
interface GenerateUIResponse {
  code: string               // Generated React JSX
  explanation: string        // Why these choices were made
  plan: string              // Planning details
  success: boolean
}
```

## AI Agent Design

### Step 1: Planning (Planner)

**Purpose**: Interpret user intent and create a structured plan

**Process**:
```
User Prompt
    ↓
[SYSTEM PROMPT]
"You are a UI planning expert..."
    ↓
Claude API (claude-3-5-sonnet-20241022)
    ↓
Structured Plan Output:
- Layout structure (grid/flex/stack)
- Components needed
- Key props
- Content structure
- Interaction patterns
```

**Example Plan**:
```
Layout: Flex container with vertical stack
Components:
  - Card (main container)
    - Badge (title)
    - Input (search field)
    - Table (data display)
    - Button (action)
```

### Step 2: Code Generation (Generator)

**Purpose**: Convert plan into valid React JSX

**Constraints**:
- Only uses allowed components
- Valid JSX syntax
- Tailwind CSS only (no inline styles)
- No imports (all pre-available)
- Minimal and focused code

**Process**:
```
Plan + User Prompt
    ↓
[SYSTEM PROMPT with component library]
    ↓
Claude API
    ↓
React JSX Code
    ↓
Code Cleanup:
- Remove markdown code blocks
- Remove import statements
- Trim whitespace
    ↓
Validation:
- Check for disallowed patterns
- Verify component whitelist
- Check syntax
```

**Example Output**:
```jsx
<div className="p-6 space-y-4">
  <h1 className="text-2xl font-bold">Welcome</h1>
  <p className="text-gray-600">This is your UI</p>
  <button className="bg-blue-600 text-white px-4 py-2 rounded">
    Click me
  </button>
</div>
```

### Step 3: Explanation (Explainer)

**Purpose**: Provide human-readable reasoning

**Process**:
```
Plan + Code + User Prompt
    ↓
[SYSTEM PROMPT]
"Explain the design decisions..."
    ↓
Claude API
    ↓
Clear explanation (2-3 sentences)
```

## Data Flow

### Generation Flow

```
User Input
    ↓
[Validate input not empty]
    ↓
Add to messages history
    ↓
POST /api/generate-ui
    ├─ Step 1: Plan
    ├─ Step 2: Generate Code
    ├─ Step 3: Validate Code
    ├─ Step 4: Explain
    ↓
Response with code + explanation
    ↓
Update state:
- Set generatedCode
- Set explanation
- Add to messages
- Create new version
    ↓
Save to version history
    ↓
Display in preview
```

### Iterative Editing Flow

```
User: "Make it red"
    ↓
Include previousCode in request
Include full conversationHistory
    ↓
Planner understands context
Focuses on modifications only
    ↓
Generator builds on previousCode
Modifies only requested parts
    ↓
Result: Incremental change
(not full rewrite)
```

### Rollback Flow

```
User clicks rollback button
    ↓
Find version in history
    ↓
Restore code: setGeneratedCode(version.code)
Restore explanation: setExplanation(version.explanation)
    ↓
Preview updates immediately
    ↓
Display success toast
```

## Safety & Validation

### Component Whitelist

Only these components can be generated:

```typescript
ALLOWED_COMPONENTS = {
  Button, Card, Badge, Input, Textarea,
  Table, Modal, Container, Grid, Stack
}
```

**Enforcement**:
1. Prompt restricts generation to whitelist
2. Validation checks output against pattern
3. System prompt reiterates constraints

### Code Validation

```typescript
validateCode(code) {
  Check for:
  ✗ import statements
  ✗ styled-components
  ✗ CSS-in-JS patterns
  ✗ inline style attributes
}
```

### Sandbox Security

Preview rendered in:
- Sandboxed iframe (`sandbox="allow-scripts"`)
- No access to parent window
- No access to local storage
- No network requests beyond CDN

## State Management

### Component State (Main Page)

```typescript
// Chat and conversation
const [messages, setMessages]              // Message history
const [input, setInput]                    // Current input

// Generated UI
const [generatedCode, setGeneratedCode]    // Current code
const [explanation, setExplanation]        // Design explanation
const [isLoading, setIsLoading]            // Loading state

// Versioning
const [versions, setVersions]              // All versions
const [currentVersionId, setCurrentVersionId] // Current version ID
```

### Message Structure

```typescript
interface Message {
  role: 'user' | 'assistant'
  content: string
}
```

### Version Structure

```typescript
interface UIVersion {
  id: string                    // Unique ID (timestamp-based)
  code: string                  // Generated code
  timestamp: Date               // When created
  explanation: string           // Design explanation
}
```

## Performance Optimizations

1. **Lazy Rendering**: Preview renders only when code changes
2. **Memoized Components**: Chat messages don't re-render unnecessarily
3. **Efficient State Updates**: Only update changed state
4. **Debounced Preview**: Doesn't update on every keystroke
5. **Code Splitting**: Components lazy-loaded by Next.js

## Error Handling

### User Level
- Toast notifications for errors
- Clear error messages in UI
- Fallback empty states

### API Level
```typescript
try {
  Call API
} catch (error) {
  Log error details
  Show user-friendly message
  Maintain UI state
  Allow retry
}
```

### API Response Validation
- Check response status
- Validate response structure
- Handle missing fields
- Provide default values

## Dependency Tree

### Frontend
```
page.tsx (main)
├── chat-message.tsx
├── code-editor.tsx
├── preview-pane.tsx
├── version-history.tsx
├── ui/* (shadcn components)
├── lucide-react (icons)
├── sonner (toasts)
└── react-resizable-panels
```

### Backend
```
route.ts (API)
├── @anthropic-ai/sdk
├── Validation logic
└── Error handling
```

## Extension Points

### Adding New Components

1. Add to `ALLOWED_COMPONENTS` in route.ts
2. Update component library description
3. Test with new prompts
4. No frontend code changes needed

### Adding Features

1. **Edit Panel**: Add component to edit specific UI sections
2. **Diff Viewer**: Show changes between versions
3. **Export Options**: Save as React component file
4. **Template Library**: Pre-built UI templates
5. **Collaboration**: Real-time multi-user editing

## Known Limitations & Future Work

### Current Limitations
- ✗ No persistent storage (in-memory only)
- ✗ No user authentication
- ✗ No database integration
- ✗ Component library is fixed
- ✗ No advanced styling beyond Tailwind
- ✗ Single-user only

### Planned Improvements
- [ ] Add Supabase for persistence
- [ ] User authentication (Supabase Auth)
- [ ] Share projects via URL
- [ ] Extended component library
- [ ] Code diff viewer
- [ ] Batch generation
- [ ] Custom component support
- [ ] Real-time collaboration

## Testing Strategy

### Unit Tests
```typescript
// Test AI agent steps independently
planUI(prompt, previousCode)
generateCode(plan, previousCode)
explainDecisions(plan, code)
validateCode(code)
```

### Integration Tests
```typescript
// Test full flow
handleGenerateUI() flow
handleRollback() flow
handleCopyCode() flow
```

### E2E Tests
```
1. Generate UI from scratch
2. Modify existing UI
3. Rollback to previous version
4. Copy code to clipboard
5. Reset entire state
```

---

**Architecture Version**: 1.0  
**Last Updated**: 2024-12-15  
**Status**: Production Ready
