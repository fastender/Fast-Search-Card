# Fast Search Card

[](https://github.com/hacs/integration)
[](./docs/CHANGELOG.md)
[](LICENSE)

A modern, high-performance Lovelace card for Home Assistant, inspired by the **visionOS aesthetic**. It features a lightning-fast search, smart filtering, and an expandable UI with integrated controls, history, scheduling, and a plugin system.

[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-ffdd00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://www.buymeacoffee.com/fastender)

-----

<p align="center">
  <img src="dfes-1.png" width="200" title="Step 1">
  <img src="dfes-2.png" width="200" title="Step 2">
  <img src="dfes-3.png" width="200" title="Step 3">
  <img src="dfes-4.png" width="200" title="Step 4"> 
</p>

https://youtu.be/zI3g2FnLR9U
https://youtu.be/lqQ3jtwOqH8

## ✨ Features

### 🔍 Smart Search & Filtering

  * **Fuzzy Search:** Instantly finds entities, scripts, and scenes, even with typos, powered by Fuse.js.
  * **Smart Categories:** Filter by Devices, Sensors, Actions, and custom System Entities.
  * **Sub-Category Bar:** Dynamically filter by room (area), device type, or suggestions.
  * **Advanced Pattern Filtering:** Exclude entities using wildcard patterns (`sensor.*`, `*_unavailable`, etc.) directly from the settings tab.

### 🎨 visionOS Design

  * **Glassmorphism:** Modern blur effects and translucent backgrounds with customizable background filters.
  * **Dynamic Background Filters:** Control your Home Assistant background image directly from the card:
    - **Brightness** - Adjust background brightness (0-200%)
    - **Blur** - Add extra blur effect (0-50px)
    - **Contrast** - Enhance or reduce contrast (0-200%)
    - **Saturation** - Boost or desaturate colors (0-200%)
    * **Grayscale** - Apply monochrome effect (0-100%)
    - All filters persist to localStorage and apply in real-time
    - Works across both SearchPanel and DetailView
  * **Animated Icons:** Over 100 custom animated SVG icons for different device states (`On`/`Off`), including washing machines, lights, fans, locks, and more.
  * **Fluid Animations:** Built with Framer Motion for smooth panel transitions and staggered list animations.
  * **Custom Scrollbars:** Minimalist iOS/macOS-style scrollbars with smooth fade-in/fade-out animations.
  * **Responsive Layout:** Adapts for desktop, tablet, and mobile use with optimized panel heights.

### 🧩 Integrated Detail View

The card expands to a full-featured control center with multiple tabs:

  * **Controls:** An interactive circular slider for lights, climate, and covers, plus specific controls like fan modes or solar production.
  * **Context:** (Formerly Actions) Shows related automations, scripts, and scenes for the device.
    - Execute scenes, scripts, and automations with a single tap
    - Toast notifications for instant feedback on action execution
    - Smart relevance sorting based on device context
  * **History:** Displays entity history using high-performance `Chart.js` graphs.
  * **Schedule:** A built-in scheduler with an iOS-style picker to create timers and weekly schedules. Integrates directly with the `nielsfaber/scheduler-component`.
  * **Settings:** Configure the card, manage excluded patterns, and change languages directly from the UI.

### 🔔 Toast Notification System

  * **visionOS-Style Notifications:** Glass-effect toast notifications with backdrop blur and smooth animations
  * **Automatic Feedback:** Instant visual feedback when executing scenes, scripts, or automations
  * **Smart Positioning:** Bottom-center placement below the panel on all screen sizes
  * **Auto-Dismiss:** Toasts automatically fade out after a configurable duration (default 3 seconds)
  * **Manual Close:** Optional close button for user-controlled dismissal
  * **Shadow DOM Compatible:** Fully integrated with Web Components architecture
  * **Multiple Types:**
    - Success (green) - Scene activated, script executed
    - Error (red) - Action failed
    - Warning (yellow) - Alerts and warnings
    - Info (blue) - General information

### 🤖 System & Plugin Framework

  * **System Entities:** Core functions like Settings, Marketplace, and a global Schedule Viewer are built as modular entities.
  * **Plugin Store:** (In Development) A built-in interface to browse, install, and manage plugins for the card.
  * **Plugin Loader:** (In Development) Dynamically load custom plugins from local files, GitHub, or URLs.
  * **Experimental AI Mode:** A chat interface for controlling devices with natural language (simulated responses in current build).

-----

## 📦 Installation

### HACS (Recommended)

1.  **Open HACS** in your Home Assistant.
2.  **Add Custom Repository**:
      * Click the 3 dots in the top right.
      * Select "Custom repositories".
      * URL: `https://github.com/fastender/Fast-Search-Card` (or your repo URL)
      * Category: `Lovelace`
3.  **Install**:
      * Find "Fast Search Card" in the list.
      * Click "Install" (or "Download").
4.  **Add to Lovelace**:
      * Go to "Settings" \> "Dashboards".
      * Click the 3 dots and select "Resources".
      * Click "Add Resource".
      * URL: `/hacsfiles/fast-search-card/fast-search-card.js`
      * Type: `JavaScript Module`.
5.  **Restart Home Assistant** (recommended).

### Manual Installation

1.  **Download the latest `fast-search-card.js`** file from the [Releases](https://github.com/fastender/Fast-Search-Card/releases) page.
2.  **Copy the file** to your `config/www/` directory (e.g., `/config/www/community/fast-search-card/fast-search-card.js`).
3.  **Register the resource** in Home Assistant:
      * Go to **Settings** → **Dashboards** → **Resources** (under the 3-dot menu).
      * Click **"Add Resource"**.
      * URL: `/local/community/fast-search-card/fast-search-card.js`
      * Type: `JavaScript Module`.
4.  **Restart Home Assistant**.

-----

## 🚀 Usage

### Basic Configuration

Add the card to your Lovelace dashboard:

```yaml
type: custom:fast-search-card
```

The card works out-of-the-box. Most configuration is handled directly within the card's interface.

### Card Configuration

```yaml
type: custom:fast-search-card
card_height: 672px # Optional: Set a fixed height (672px is the default expanded height)
```

-----

## ⚙️ In-Card Configuration

Most settings are managed directly in the **Settings Tab** inside the card:

  * **General:** Change the display language (10 languages supported).
  * **Appearance:**
    - Toggle between Grid and List view modes
    - **Background Filters:** Customize your Home Assistant background image
      - **Brightness:** 0-200% (default: 100%)
      - **Blur:** 0-50px additional blur (default: 0px)
      - **Contrast:** 0-200% (default: 100%)
      - **Saturation:** 0-200% (default: 100%)
      - **Grayscale:** 0-100% (default: 0%)
    - All appearance settings persist across sessions
    - The card automatically uses your active Home Assistant theme
  * **Privacy & Filtering:** Manage your "Excluded Patterns" to hide entities from the search results.
      * **Live Preview:** Instantly see which entities will be hidden by your patterns.
      * **Templates:** Use pre-defined templates (e.g., hide all sensors, hide unavailable entities).
      * **Import/Export:** Back up and share your filter lists as JSON.
  * **About:** View card version and build information.

### Background Filter Customization

Access the Background Filters in **System Settings → Appearance Tab**:

1. **Brightness Slider**
   - Makes the background lighter or darker
   - Range: 0% (completely dark) to 200% (very bright)
   - Default: 100% (original brightness)

2. **Blur Slider**
   - Adds additional blur to the background image
   - Range: 0px (no extra blur) to 50px (heavy blur)
   - Default: 0px (uses card's default blur)
   - Combines with the card's built-in glassmorphism effect

3. **Contrast Slider**
   - Adjusts the contrast of the background
   - Range: 0% (no contrast) to 200% (high contrast)
   - Default: 100% (original contrast)

4. **Saturation Slider**
   - Controls color intensity
   - Range: 0% (grayscale) to 200% (vivid colors)
   - Default: 100% (original saturation)

5. **Grayscale Slider**
   - Converts background to black and white
   - Range: 0% (full color) to 100% (monochrome)
   - Default: 0% (no grayscale)

**All filters apply instantly** and persist across browser sessions via localStorage.

-----

## 📚 Documentation & Development

For a deeper dive into the architecture, component breakdown, and plugin development, please see the `/docs` folder.

### 📖 Complete Documentation

The project includes comprehensive documentation covering all aspects of the card:

#### **[📋 FEATURES.md](./docs/FEATURES.md)** (1,200+ lines)
Complete feature documentation with detailed explanations:
- Search & Discovery (Fuzzy search, Categories, Pattern filtering)
- Smart UI & Navigation (visionOS design, View modes, Animations)
- Detail View & Tabs (Controls, Context, History, Schedule, Settings)
- Universal Controls (Domain-specific controls for all entity types)
- Circular Slider System (Complete architecture with hooks and utilities)
- Scheduler Integration (Time picker, Weekdays, Domain actions)
- History & Analytics (Charts, Time-of-day analysis, Statistics)
- System Entities & Plugins (Framework, Plugin Store)
- Performance & Optimization (Caching, Animations, Build)
- Internationalization (10+ languages supported)

#### **[🧩 COMPONENTS.md](./docs/COMPONENTS.md)** (1,388 lines)
Detailed component architecture and API reference:
- Core Application & Data (DataProvider, Context hooks)
- Main UI & Layout (SearchField, DetailView, DeviceCard)
- Detail View Tabs (5 tabs with props and usage)
- Reusable UI Controls (CircularSlider, PowerToggle, IOSTimePicker)
- System Entity Framework (Base class, Registry, Integration)
- Custom Hooks & State Management (10+ hooks documented)
- Utility Functions & Helpers (40+ utilities organized by purpose)
- Refactoring Summary (October 2025 improvements)
- Component Communication Patterns (Props, Context, Services)
- Testing Strategy (Unit, Integration, E2E)

#### **[🔌 PLUGIN_DEVELOPMENT.md](./docs/PLUGIN_DEVELOPMENT.md)** (1,401 lines)
Complete guide for creating system entities and external plugins:
- System Entity Framework (Universal integration guide)
- Creating New System Entities (Step-by-step tutorial)
- Plugin Development (External plugins with manifest format)
- Plugin Security & Sandboxing (Permissions, Best practices)
- Plugin API Reference (Context, Storage, Entity, Notification APIs)
- Advanced Plugin Examples (Weather plugin, Automation builder)
- Testing & Debugging (Development mode, Common issues)
- Plugin Distribution (Plugin Store, GitHub releases)
- UI Guidelines (Styling, Animations, Responsive design)
- Performance Optimization (Lazy loading, Memoization)
- Internationalization (Multi-language support)

#### **[📁 PROJECT_STRUCTURE.md](./docs/PROJECT_STRUCTURE.md)** (1,000+ lines)
Complete project structure documentation:
- Project Overview (Statistics, File organization)
- Root Directory (Configuration files, Dependencies)
- Source Directory (All 150+ files documented)
- Components (50+ components with line counts)
- Hooks (10+ custom hooks)
- Utilities (40+ utility modules)
- Providers (DataProvider API)
- System Entities (Framework structure)
- Build Configuration (Vite setup, Bundle stats)
- Module Dependencies (Dependency graph)
- Naming Conventions (Files, Variables, Directories)
- Code Statistics (35,000+ lines of code)
- Recent Changes (October 2025 refactoring)
- Best Practices (File size guidelines, Extraction criteria)

#### **[📝 CHANGELOG.md](./docs/CHANGELOG.md)** (180KB)
Complete version history and release notes:
- All releases documented
- Feature additions
- Bug fixes
- Breaking changes
- Migration guides

#### **[⚡ OPTIMIZATION.md](./docs/OPTIMIZATION.md)**
Comprehensive optimization guide and opportunities:
- Current bundle analysis (860KB → target 600KB)
- Dependency optimizations (Chart.js, Framer Motion tree-shaking)
- Code-splitting strategies (70% initial load reduction)
- Large component refactoring candidates (661-548 LOC files)
- Performance optimizations (Memo, Virtualization, IndexedDB)
- CSS optimizations (PurgeCSS, Critical CSS)
- 3-Phase implementation roadmap with expected results
- Monitoring tools and metrics

#### **[🌤️ WEATHER_ENTITY_CONCEPT.md](./docs/WEATHER_ENTITY_CONCEPT.md)**
Complete concept and implementation plan for Weather System-Entity:
- System-Entity Framework analysis (4 existing entities)
- Weather Entity architecture (6 actions, multi-location support)
- UI design concept (visionOS-inspired, animated weather icons)
- Home Assistant Weather API integration
- 5-Phase implementation roadmap (12-16h total)
- Component hierarchy (~1,900 LOC)
- MVP vs Full-Featured comparison
- Quick Start Guide (4h MVP)

#### **[🎨 VISIONOS_COLORS.md](./docs/VISIONOS_COLORS.md)**
Official visionOS color palette for System-Entities:
- Complete color table (12 visionOS colors with RGB values)
- Design principles (colored background + white icon)
- Entity-to-color mapping (Settings=Blue, Weather=Cyan, etc.)
- Implementation guide (SystemEntity, appearanceConfig, CSS)
- Guidelines for new entities
- Code examples and best practices

### 📊 Documentation Statistics

- **Total Lines:** 5,000+ lines of documentation
- **Code Examples:** 100+ code snippets
- **API References:** Complete API coverage
- **Tutorials:** Step-by-step guides
- **Diagrams:** Component hierarchies, Data flows
- **Coverage:** 100% of features, components, and APIs

### Tech Stack

  * **Framework**: Preact 10.27.1
  * **Build Tool**: Vite 7.1.3
  * **Search**: Fuse.js
  * **Charts**: Chart.js
  * **Animation**: Framer Motion
  * **Database**: IndexedDB (via `DataProvider`)
  * **Scheduler**: Integrates `nielsfaber/scheduler-component`

### Development Setup

```bash
# Prerequisites: Node.js >= 18.0.0, npm >= 9.0.0

# Install dependencies
npm install

# Start dev server (with hot reload)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

**Build Output**: `dist/fast-search-card.js` (ready to copy to `/config/www/`)

-----

## 🏗️ Architecture & Recent Improvements

### Modular Structure

The codebase follows a clean, modular architecture with clear separation of concerns:

```
src/
├── components/          # UI components
│   ├── cards/          # DeviceCard, DetailView
│   ├── controls/       # CircularSlider, PowerToggle, DomainControls
│   ├── search/         # SearchBar, SearchResultItem
│   ├── tabs/           # ContextTab, ScheduleTab, HistoryTab, etc.
│   └── CustomScrollbar.jsx  # iOS/macOS-style scrollbar
├── hooks/              # Custom React/Preact hooks
│   └── useRelatedDevices.js  # Context-aware device matching
├── utils/              # Pure utility functions
│   ├── toastNotification.js  # Toast system with Shadow DOM support
│   ├── actionUtils.js        # Action filtering and sorting
│   └── homeAssistantService.js  # Service call integration
├── services/           # API and data services
└── styles/             # Global styles
    ├── toast.css       # Toast notification styles
    └── CustomScrollbar.css  # Scrollbar component styles
```

### Recent Refactoring (October 2025)

Major refactoring effort to improve maintainability, testability, and code reusability:

#### Refactored Components

1. **ScheduleTab.jsx** (889 → 596 lines, **-33%**)
   - Extracted service action builders (`serviceActionBuilders.js`)
   - Extracted edit state loaders (`editStateLoaders.js`)
   - Extracted timer name generators (`timerNameGenerators.js`)
   - Created reusable components: `AddScheduleButton`, `ScheduleActionButtons`, `SchedulePickerTable`

2. **HistoryTab.jsx** (795 → 416 lines, **-48%**)
   - Extracted all inline styles to `HistoryTab.css` (255 lines)
   - Extracted animation variants to `accordionAnimations.js`
   - Extracted time formatters (`timeFormatters.js`) and data processors (`historyDataProcessors.js`)

3. **CircularSlider.jsx** (957 → 525 lines, **-45%**)
   - Extracted geometry constants (`circularSliderGeometry.js`)
   - Extracted color utilities (`temperatureColors.js`)
   - Extracted transform functions (`circularSliderTransforms.js`)
   - Created reusable components: `PowerToggle`, `CircularSliderDisplay`
   - Extracted 3 custom hooks:
     - `useSliderAnimation` - Spring animations and value counting
     - `useCircularDrag` - Drag interaction logic (mouse & touch)
     - `usePowerState` - Power toggle with value restoration

4. **CustomScrollbar.jsx** (New Component)
   - Minimalist iOS/macOS-style scrollbar with smooth animations
   - Fixed 80px track height with proportional thumb
   - Fade-in on scroll activity and hover, fade-out when idle
   - Integrated into SearchField and DetailView
   - ResizeObserver for responsive thumb sizing

5. **Toast Notification System** (Enhanced)
   - Shadow DOM compatibility via window reference callback
   - Absolute positioning for proper panel integration
   - Mobile-responsive with bottom-center positioning on all screen sizes
   - Service call integration with success/error feedback
   - visionOS-style glassmorphism design

**Total Impact:**
- **20+ new modular files** created
- **1,100+ lines reduced** (-42% average across refactored files)
- Improved code organization and reusability
- Enhanced testability with isolated functions and hooks
- Better performance with CSS extraction

### Design Patterns

- **Custom Hooks** - Encapsulate complex state management and side effects
- **Utility Functions** - Pure functions for calculations and transformations
- **Component Composition** - Small, focused, reusable components
- **CSS Extraction** - Separate styling for better caching and performance
- **Constants Centralization** - Shared constants in dedicated files
- **Callback Refs** - Immediate DOM access for Shadow DOM compatibility
- **Service Integration** - Clean separation of UI and Home Assistant API calls

### Component Guidelines

When contributing, follow these patterns:

```javascript
// ✅ Good: Small, focused component
export const PowerToggle = ({ isOn, onChange, disabled, size }) => {
  return (
    <motion.label className="power-toggle">
      <input type="checkbox" checked={isOn} onChange={onChange} />
      <span className="slider" />
    </motion.label>
  );
};

// ✅ Good: Custom hook for complex logic
export const useCircularDrag = ({ svgRef, readOnly, angleToValue }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleInteraction = (clientX, clientY) => {
    // Complex drag calculation logic...
  };

  return { isDragging, handleMouseDown, handleTouchStart };
};

// ✅ Good: Pure utility function
export const valueToAngle = (value, min, max) => {
  const range = max - min;
  const normalizedValue = (value - min) / range;
  return normalizedValue * 360 - 90; // Start at top
};

// ✅ Good: Callback ref for Shadow DOM
const setToastContainerRef = (element) => {
  if (element) {
    window.__fastSearchToastContainer = element;
  }
};
```

### Code Style

- Use functional components with hooks (no class components)
- Keep components under 500 lines (extract when larger)
- Use JSDoc comments for public APIs
- Prefer composition over inheritance
- Extract complex logic to custom hooks
- Move pure functions to utility files
- Use callback refs for immediate DOM access in Shadow DOM

### Naming Conventions

- **Components**: PascalCase (e.g., `CircularSlider.jsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useCircularDrag.js`)
- **Utils**: camelCase with descriptive names (e.g., `timeFormatters.js`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `VIEW_BOX_SIZE`)

-----

## 🐛 Troubleshooting

### Toast Notifications Not Appearing

**Issue:** Toast notifications are created but not visible

**Solution:** The toast system uses a callback ref for Shadow DOM compatibility. Ensure your container has the ref set:

```javascript
const setToastContainerRef = (element) => {
  if (element) {
    window.__fastSearchToastContainer = element;
  }
};

<div id="toast-container" ref={setToastContainerRef}></div>
```

### Background Filters Not Working

**Issue:** Filter sliders don't affect the background

**Solution:**
1. Check that CSS custom properties are set in `document.documentElement.style`
2. Verify that `backdrop-filter` is applied to the element directly, not to pseudo-elements (`:before`, `:after`)
3. For DetailView, apply filters to `.detail-panel` directly:

```css
.detail-panel {
  backdrop-filter: blur(calc(20px + var(--background-blur, 0px)))
                   brightness(var(--background-brightness, 100%));
}
```

### Service Calls Failing

**Issue:** "Service [object Object].undefined not available"

**Solution:** Ensure the service call chain passes correct parameters:

```javascript
// ContextTab.jsx - Wrapper function
const executeAction = async (action) => {
  if (action.type === 'scene') {
    await onActionExecute('scene', 'turn_on', { entity_id: action.id });
  }
};

// Pass executeAction (not onActionExecute) to ActionItem
<ActionItem onActionExecute={executeAction} />
```

### Custom Scrollbar Not Showing

**Issue:** Scrollbar doesn't appear on scroll

**Solution:**
1. Ensure hover state is tracked on the scroll container
2. Pass both `scrollContainerRef` and `isHovered` props:

```javascript
const [isHovered, setIsHovered] = useState(false);

<div
  ref={scrollRef}
  onMouseEnter={() => setIsHovered(true)}
  onMouseLeave={() => setIsHovered(false)}
>
  {/* Content */}
</div>

<CustomScrollbar scrollContainerRef={scrollRef} isHovered={isHovered} />
```

### Category Chips Not Changing Color on Click

**Issue:** Chip color doesn't change immediately when clicking while hovering

**Solution:** Use conditional hover to prevent `whileHover` from overriding `animate` state:

```javascript
<motion.button
  animate={getCategoryButtonActiveVariants(isActive)}
  whileHover={isActive ? {} : categoryButtonHoverVariants.hover}
/>
```

-----

## 🤝 Contributing

Contributions are welcome\! Please feel free to open an Issue or Pull Request.

1.  **Fork** the repository.
2.  Create your feature branch: `git checkout -b feature/AmazingFeature`
3.  Commit your changes: `git commit -m '✨ Add AmazingFeature'`
4.  Push to the branch: `git push origin feature/AmazingFeature`
5.  Open a **Pull Request**.

### Development Guidelines

- Follow the established code patterns and naming conventions
- Extract components when files exceed 500 lines
- Write JSDoc comments for public APIs
- Test in both development and production modes
- Verify Shadow DOM compatibility for UI elements
- Test responsive behavior on mobile devices

-----

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details.
