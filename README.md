# Ryze AI UI Generator

An intelligent AI-powered UI generation system that converts natural language descriptions into working UI code with live preview. Built with Next.js frontend and Node.js backend.

##  Features

- **Natural Language UI Generation**: Describe your UI in plain English and get working code instantly
- **Live Preview**: See your generated UI render in real-time
- **Multi-Step Agent Architecture**: Uses planner, generator, and explainer steps for reliable output
- **Version History**: Track all UI versions and rollback to previous states
- **Iterative Editing**: Modify existing UIs incrementally with context awareness
- **Code Explanation**: AI explains every design decision
- **Component Safety**: Deterministic component library prevents hallucinated components
- **Split-Panel Interface**: Chat, code, and preview all visible at once

##  Architecture Overview

### Frontend (Next.js 16 + React 19)
- **App Router**: Modern server-side rendering with server components
- **State Management**: React hooks with client-side state
- **UI Framework**: shadcn/ui components with Tailwind CSS
- **Layout**: Resizable panels for chat, code editor, and preview

### Backend (Node.js + Claude API)
- **Multi-Step Agent**:
  1. **Planner**: Analyzes user intent and creates structured plan
  2. **Generator**: Converts plan into validated React code
  3. **Explainer**: Provides clear reasoning for design choices
- **Validation**: Component whitelist enforcement and code validation
- **Error Handling**: Comprehensive error messages and fallbacks

##  Quick Start

### Prerequisites
- Node.js 18+ (LTS recommended)
- pnpm (or npm/yarn)
- API key (get it from [console.com](https://console.com))

### Installation Steps

#### 1. Clone the Repository
```bash
git clone <repository-url>
cd ryze-ai-ui-generator
```

#### 2. Install Dependencies
```bash
pnpm install
# or: npm install
# or: yarn install
```

#### 3. Set Up Environment Variables
Create a `.env.local` file in the project root:

```bash
# Copy this and add your Anthropic API key
API_KEY=sk-ant-your-api-key-here
```

**Getting your API key:**
1. Visit [console.com](https://console.com)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy and paste it in your `.env.local` file

#### 4. Run Development Server
```bash
pnpm dev
# or: npm run dev
# or: yarn dev
```

The app will start on `http://localhost:3000`

#### 5. Build for Production
```bash
pnpm build
pnpm start
```

##  How to Use

### Basic Workflow

1. **Start the App**: Open `http://localhost:3000` in your browser
2. **Describe Your UI**: Type a description in the left panel
   - Example: "Create a card with a title, description, and a blue button"
3. **Click Generate**: AI generates the UI
4. **View Results**:
   - **Left Panel**: Chat history and explanations
   - **Middle Panel**: Generated React code (editable)
   - **Right Panel**: Live preview of your UI

### Advanced Features

#### Iterative Editing
- After generating a UI, you can ask for modifications
- Example: "Make the button red and add a search input"
- The AI preserves existing code and only makes requested changes

#### Version History
1. Click the **History** tab in the middle panel
2. See all previous versions with timestamps
3. Click **Rollback** to restore any previous version

#### Code Editing
- The code editor is fully editable
- Changes reflect instantly in the preview
- Copy button copies code to clipboard

#### Reset
- Click the **Reset** button in the header to start fresh

### Example Prompts

```
1. "Create a login form with email and password fields"
2. "Build a product card with image, title, price, and add to cart button"
3. "Make a navigation bar with logo and menu items"
4. "Create a table showing users with columns for name, email, and status"
5. "Build a modal dialog with title, description, and action buttons"
```

##  Project Structure

```
ryze-ai-ui-generator/
├── app/
│   ├── api/
│   │   └── generate-ui/
│   │       └── route.ts           # AI agent implementation
│   ├── layout.tsx                  # Root layout
│   ├── page.tsx                    # Main application
│   └── globals.css                 # Global styles
├── components/
│   ├── chat-message.tsx            # Chat message component
│   ├── code-editor.tsx             # Code editor component
│   ├── preview-pane.tsx            # Live preview component
│   ├── version-history.tsx         # Version history component
│   └── ui/                         # shadcn/ui components
├── lib/
│   └── utils.ts                    # Utility functions
├── public/                         # Static assets
├── .env.local                      # Environment variables (create this)
├── package.json                    # Dependencies
├── tailwind.config.ts              # Tailwind configuration
├── tsconfig.json                   # TypeScript configuration
└── README.md                       # This file
```

##  AI Agent Design

### Step 1: Planner
- Analyzes user intent
- Creates detailed plan for layout and components
- Specifies props and content

### Step 2: Generator
- Converts plan into React JSX
- Uses only allowed components
- Validates output against whitelist
- Ensures proper syntax

### Step 3: Explainer
- Provides human-readable explanation
- Justifies design decisions
- References component choices

### Safety Features
-  Component whitelist (only uses allowed components)
-  Code validation (checks for disallowed patterns)
-  Prompt injection protection
-  Error boundaries and fallbacks
-  Sandbox iframe for preview

##  Allowed Components

The AI can only generate these components (ensures consistency):

- **Button**: Interactive buttons with variants
- **Card**: Content containers
- **Badge**: Labels and tags
- **Input**: Text input fields
- **Textarea**: Multi-line text
- **Table**: Data tables
- **Modal**: Dialog/popup windows
- **Container**: Flex containers
- **Grid**: Grid layouts
- **Stack**: Vertical/horizontal stacks

##  Environment Variables

Required for running the application:

```
API_KEY=your-api-key-here
```

Optional:
```
NODE_ENV=development  # Set automatically in dev mode
```

##  Common Issues & Solutions

### Issue: "API_KEY not set"
**Solution**: Make sure you've created `.env.local` with your API key:
```bash
echo "API_KEY=sk-ant-your-key" > .env.local
```

### Issue: "Module not found"
**Solution**: Reinstall dependencies:
```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Issue: Port 3000 already in use
**Solution**: Use a different port:
```bash
pnpm dev -- -p 3001
```

### Issue: Preview not showing
**Solution**: Check browser console for errors. The code might have syntax issues.

##  Troubleshooting

1. **Check Logs**: Look at terminal output when generating UI
2. **Validate Code**: Ensure generated code has valid syntax
3. **Clear Cache**: Delete `.next` folder and restart dev server
4. **Reset App**: Click Reset button to start fresh
5. **Check API**: Verify your  API key is valid

##  Deployment

### Deploy to Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Add environment variable in dashboard
# Settings → Environment Variables
# Add: API_KEY=your-key
```

### Deploy to Other Platforms

#### Netlify
1. Connect GitHub repository
2. Set build command: `pnpm build`
3. Set publish directory: `.next`
4. Add environment variable in site settings

#### Railway, Render, or Fly.io
1. Connect repository
2. Set `NODE_VERSION=18`
3. Add build command: `pnpm build`
4. Set start command: `pnpm start`
5. Add `API_KEY` in environment variables

##  Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS, shadcn/ui |
| UI Components | Radix UI primitives |
| AI | Anthropic Claude API |
| Backend | Next.js API Routes |
| Package Manager | pnpm |
| Code Editor | React Textarea |

##  Known Limitations

1. **Component Library**: Only pre-defined components are available
2. **No Database**: Versions stored in browser memory only
3. **No Real-time Collaboration**: Single-user application
4. **Preview Limitations**: Some advanced CSS features may not work in sandbox
5. **Code Size**: Long generations may hit API token limits

##  Future Improvements

- [ ] Add database persistence (Supabase/PostgreSQL)
- [ ] User authentication and project saving
- [ ] Extended component library
- [ ] Code diff viewer
- [ ] Undo/redo within editor
- [ ] Share projects via URL
- [ ] Batch generation for multiple UIs
- [ ] Component customization via UI panel


##  Support
 - Name : Sujeet M A
 - Gmail : sujeetmalagundi999@gmail.com

##  Learning Resources

- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)

---
