# Fast Search Card - Features Documentation

This document provides a comprehensive overview of all features in the Fast Search Card for Home Assistant.

---

## Table of Contents

1. [Search & Discovery](#search--discovery)
2. [Smart UI & Navigation](#smart-ui--navigation)
3. [Detail View & Tabs](#detail-view--tabs)
4. [Universal Controls](#universal-controls)
5. [Circular Slider System](#circular-slider-system)
6. [Scheduler Integration](#scheduler-integration)
7. [History & Analytics](#history--analytics)
8. [System Entities & Plugins](#system-entities--plugins)
9. [Performance & Optimization](#performance--optimization)
10. [Internationalization](#internationalization)

---

## Search & Discovery

### Fuzzy Search Engine

Powered by **Fuse.js** for intelligent, typo-tolerant searching:

- **Fast matching** across entity names, friendly names, and areas
- **Typo tolerance** - finds "ligth" when you mean "light"
- **Partial matching** - "bed lamp" matches "Bedroom Lamp"
- **Configurable threshold** for search accuracy
- **Real-time results** as you type

### Smart Categorization

Entities are automatically organized into categories:

- **Devices** - Lights, switches, fans, covers, climate controls
- **Sensors** - Temperature, humidity, motion, binary sensors
- **Actions** - Scripts, scenes, automations
- **System** - Settings, Marketplace, Schedule Viewer (modular entities)

### Sub-Category Filtering

Dynamic filtering bar that adapts to search results:

- **By Area** - Filter by room/location (Bedroom, Kitchen, Living Room, etc.)
- **By Device Type** - Filter by domain (Light, Switch, Climate, etc.)
- **Smart Suggestions** - Contextual filters based on current results

### Favorites & Recent Items

- **Favorites System** - Star entities for quick access
- **Recent History** - Last accessed entities appear first
- **Persistent Storage** - Saved in IndexedDB across sessions
- **One-tap Access** - Favorites appear at top of search results

### Advanced Pattern Filtering

Exclude unwanted entities using wildcard patterns:

```
sensor.*              # Hide all sensors
*_unavailable         # Hide unavailable entities
automation.system_*   # Hide system automations
```

- **Live Preview** - See which entities will be hidden in real-time
- **Template Library** - Pre-defined filter templates
- **Import/Export** - Share filter configurations as JSON
- **Regex Support** - Advanced pattern matching capabilities

---

## Smart UI & Navigation

### visionOS-Inspired Design

Modern, clean interface inspired by Apple's visionOS:

- **Glassmorphism Effects** - Translucent backgrounds with blur
- **Depth & Layering** - Visual hierarchy with shadows and elevation
- **Smooth Animations** - Framer Motion-powered transitions
- **Adaptive Theming** - Automatically uses active Home Assistant theme

### View Modes

Two display modes for different preferences:

#### Grid View
- Card-based layout with entity tiles
- Shows icon, name, and current state
- Optimal for touch interfaces
- Responsive grid (1-4 columns based on screen width)

#### List View
- Compact row-based layout
- Shows more entities at once
- Better for large entity lists
- Faster scanning for specific items

### Responsive Design

Optimized for all screen sizes:

- **Mobile** (< 600px) - Single column, touch-optimized controls
- **Tablet** (600-960px) - Dual column layout
- **Desktop** (> 960px) - Multi-column with expanded controls
- **Dynamic Sizing** - Controls scale based on available space

### Animated Icons

Over 100 custom animated SVG icons:

- **State-aware** - Different animations for On/Off states
- **Domain-specific** - Unique icons for lights, fans, locks, covers, etc.
- **Smooth Transitions** - Animated state changes
- **Custom Designs** - Washing machines, dishwashers, HVAC, solar panels, etc.

### Gesture Support

Intuitive touch and mouse interactions:

- **Tap** - Quick actions
- **Drag** - Circular slider interaction
- **Swipe** - Close detail views (mobile)
- **Hover** - Show additional controls (desktop)

---

## Detail View & Tabs

When you select an entity, the card expands to show detailed information and controls in a tabbed interface.

### Context Tab

Shows related automations, scripts, and scenes:

**Features:**
- Lists all automations that reference this entity
- Shows associated scripts
- Displays related scenes
- One-tap execution for scripts and scenes
- Visual state indicators

**File:** `src/components/tabs/ContextTab.jsx` (285 lines)

### Universal Controls Tab

Interactive controls tailored to each device type:

**Supported Domains:**
- **Light** - Brightness, color, color temperature
- **Climate** - Temperature, HVAC mode, fan mode, preset
- **Cover** - Position control, open/close/stop
- **Fan** - Speed control, oscillation, direction
- **Media Player** - Volume, source selection
- **Switch** - On/Off toggle
- **Lock** - Lock/Unlock
- **Vacuum** - Start, pause, return to dock

**Features:**
- Circular slider for analog controls (brightness, temperature, position)
- Toggle switches for binary controls
- Mode selectors for multi-state entities
- Real-time state feedback
- Domain-specific icons and colors

**File:** `src/components/tabs/UniversalControlsTab.jsx` (331 lines)

### Schedule Tab

Built-in scheduler with iOS-style picker interface:

**Features:**
- Create time-based automations without writing YAML
- Visual time picker with smooth scrolling
- Weekday selection for recurring schedules
- One-time and repeating schedule options
- Domain-specific action configuration
- Integration with `nielsfaber/scheduler-component`

**See:** [Scheduler Integration](#scheduler-integration) for detailed information

**File:** `src/components/tabs/ScheduleTab.jsx` (596 lines)

### History Tab

Visual history display with charts and analytics:

**Features:**
- Interactive timeline charts (Chart.js)
- Configurable time ranges (1h - 30 days)
- State change events with timestamps
- Time-of-day analysis (Morning, Day, Evening, Night)
- Event statistics and summaries
- Text event filtering

**See:** [History & Analytics](#history--analytics) for detailed information

**File:** `src/components/tabs/HistoryTab.jsx` (416 lines)

### Settings Tab

In-card configuration interface:

**General Settings:**
- Language selection (10+ languages)
- View mode toggle (Grid/List)
- Card height configuration

**Privacy & Filtering:**
- Excluded entity patterns
- Live preview of filtered entities
- Template library
- Import/Export configurations

**About:**
- Version information
- Build details
- Links to documentation

---

## Universal Controls

### Domain-Specific Controls

Each device type has tailored controls optimized for its functionality:

#### Light Controls
- **Brightness** - Circular slider (0-100%)
- **Color Picker** - RGB color wheel (for RGB lights)
- **Color Temperature** - Warm to cool (for white lights)
- **Power Toggle** - On/Off with value restoration
- **Effects** - Light effect selection (if supported)

#### Climate Controls
- **Temperature** - Circular slider with temperature color coding
- **HVAC Mode** - Heat, Cool, Auto, Off, Heat/Cool
- **Fan Mode** - Auto, Low, Medium, High
- **Preset Mode** - Home, Away, Sleep, Eco
- **Current State** - Real-time temperature display

#### Cover Controls
- **Position** - Circular slider (0-100%)
- **Quick Actions** - Open, Close, Stop buttons
- **Tilt Position** - For blinds with tilt capability
- **State Display** - Opening, Closing, Open, Closed

#### Fan Controls
- **Speed** - Percentage-based circular slider
- **Preset Modes** - Low, Medium, High presets
- **Oscillation** - Toggle on/off
- **Direction** - Forward/Reverse

### Control Components

**File Structure:**
```
src/components/controls/
├── CircularSlider.jsx         # Main circular control (525 lines)
├── CircularSliderDisplay.jsx  # Value display (202 lines)
├── PowerToggle.jsx            # Power switch (153 lines)
├── DeviceCardControls.jsx     # Card action buttons
└── DomainControls.jsx         # Domain-specific controls
```

---

## Circular Slider System

The circular slider is the centerpiece of the control interface, providing smooth, intuitive interaction with analog controls.

### Core Features

#### Physics-Based Animations
- **Spring Animations** - Natural, bouncy motion using Framer Motion
- **Smooth Drag** - 60 FPS interaction with GPU acceleration
- **Value Counting** - Animated number transitions on mount
- **Motion Transforms** - Real-time angle-to-value calculations

#### Visual Feedback
- **Progress Arc** - Animated stroke-dashoffset visualization
- **Drag Handle** - Visual indicator with hover/drag states
- **Color Coding** - Temperature-based gradients for climate entities
- **State Indicators** - Visual feedback for power on/off

#### Interaction Modes
- **Slider Mode** (Default) - Interactive drag control
- **Progress Mode** - Read-only progress visualization
- **Power Toggle Mode** - Integrated on/off switch with value restoration

### Architecture

The circular slider has been refactored into a modular, maintainable architecture:

#### Main Component
**File:** `src/components/controls/CircularSlider.jsx` (525 lines)

**Responsibilities:**
- Component orchestration
- Prop management
- Rendering arc, handle, and display
- Effect coordination

**Key Props:**
```javascript
{
  value: 0-100,           // Current value
  min: 0,                 // Minimum value
  max: 100,               // Maximum value
  step: 1,                // Value increment
  label: "Brightness",    // Display label
  unit: "%",              // Unit symbol
  color: "#FFD700",       // Primary color
  domain: "climate",      // Optional domain for special features
  showPower: false,       // Show power toggle
  powerState: false,      // Power on/off state
  onValueChange: fn,      // Value change callback
  onPowerToggle: fn       // Power toggle callback
}
```

#### Display Component
**File:** `src/components/controls/CircularSliderDisplay.jsx` (202 lines)

**Features:**
- Animated value display with motion values
- Optional sub-value display
- Unit display with positioning
- Label display
- Horizontal scrolling for long text
- Responsive font sizing

#### Power Toggle Component
**File:** `src/components/controls/PowerToggle.jsx` (153 lines)

**Features:**
- Reusable toggle switch
- Animated transitions
- Responsive sizing based on slider size
- Disabled state support
- Pointer events management

### Custom Hooks

The slider logic is organized into three specialized hooks:

#### useSliderAnimation
**File:** `src/hooks/useSliderAnimation.js` (73 lines)

**Purpose:** Manages spring animations and value transitions

**Returns:**
```javascript
{
  currentValue,        // Current slider value (state)
  setCurrentValue,     // State setter
  springValue,         // Framer Motion spring value
  countingValue,       // Animated counting spring
  handleAngle,         // Transformed angle for handle position
  hasAnimated         // Flag for initial animation
}
```

**Animation Configuration:**
- **Spring Stiffness:** 280 - Fast, responsive motion
- **Damping:** 28 - Controlled bounce
- **Mass:** 0.8 - Light, quick response
- **Rest Delta:** 0.001 - High precision
- **Counting Animation:** Separate spring for number counting on mount

#### useCircularDrag
**File:** `src/hooks/useCircularDrag.js` (139 lines)

**Purpose:** Handles mouse and touch drag interactions

**Features:**
- SVG coordinate transformation
- ViewBox scaling calculations
- Angle-to-value conversion
- Value clamping and stepping
- Auto-power-on when dragging
- Global event listeners during drag
- Touch and mouse event support
- Prevent scroll during touch drag

**Returns:**
```javascript
{
  isDragging,          // Current drag state
  handleMouseDown,     // Mouse event handler
  handleTouchStart     // Touch event handler
}
```

**Interaction Flow:**
1. User clicks/touches slider
2. Calculate SVG coordinates relative to center
3. Convert coordinates to angle (Math.atan2)
4. Convert angle to value
5. Apply stepping and clamping
6. Update spring value for smooth animation
7. Trigger callbacks

#### usePowerState
**File:** `src/hooks/usePowerState.js` (48 lines)

**Purpose:** Manages power toggle with value restoration

**Features:**
- Local power state management
- Last value memory
- Restore previous value on power-on
- Reset to 0 on power-off
- Integration with slider animation values

**Returns:**
```javascript
{
  localPowerState,      // Current power state
  setLocalPowerState,   // State setter
  lastSliderValue,      // Last non-zero value
  setLastSliderValue,   // Setter for last value
  handlePowerToggle     // Toggle handler
}
```

**Power Toggle Behavior:**
- **Power Off:** Slider animates to 0, value is saved
- **Power On:** Slider restores saved value with spring animation
- **Default Value:** 50% if no previous value exists
- **Brightness Mode:** Auto-resets to 0 when parent entity turns off

### Utility Functions

Pure functions for slider calculations:

#### circularSliderGeometry.js
**File:** `src/utils/circularSliderGeometry.js` (41 lines)

**Constants:**
```javascript
VIEW_BOX_SIZE = 200    // SVG viewBox dimensions
RADIUS = 70            // Circle radius
CENTER_X = 100         // Center X coordinate
CENTER_Y = 100         // Center Y coordinate
CIRCUMFERENCE = 439.8  // 2 * PI * RADIUS
```

**Functions:**
- `calculateResponsiveSize()` - Returns optimal slider size based on screen width

#### circularSliderTransforms.js
**File:** `src/utils/circularSliderTransforms.js` (46 lines)

**Functions:**
```javascript
valueToAngle(value, min, max)
// Converts value (0-100) to angle (-90° to 270°)
// -90° = top of circle (start position)

angleToValue(angle, min, max)
// Converts angle to value with range normalization

getProgressOffset(currentValue, min, max, circumference)
// Calculates stroke-dashoffset for progress mode
```

#### temperatureColors.js
**File:** `src/utils/temperatureColors.js` (29 lines)

**Purpose:** Temperature-based color mapping for climate domain

**Color Gradient:**
- **< 16°C:** Blue (#0288D1) - Cold
- **16-18°C:** Light Blue (#03A9F4)
- **18-20°C:** Cyan (#00BCD4)
- **20-22°C:** Green (#4CAF50) - Comfortable
- **22-24°C:** Light Green (#8BC34A)
- **24-26°C:** Yellow Green (#CDDC39)
- **26-28°C:** Orange (#FF9800)
- **> 28°C:** Red (#F44336) - Hot

**Function:**
```javascript
getTemperatureColor(temperature, unit)
// Supports both Celsius and Fahrenheit
// Automatic conversion for °F
// Smooth color transitions
```

### Special Features

#### Temperature Color Coding
When `domain="climate"` and `unit="°C"` or `unit="°F"`:
- Slider color dynamically changes based on temperature
- Smooth color transitions (0.3s ease)
- Visual feedback for temperature ranges

#### Responsive Sizing
Slider automatically adjusts size based on screen width:
- **< 600px:** 200px diameter (mobile)
- **600-960px:** 240px diameter (tablet)
- **> 960px:** 280px diameter (desktop)
- Manual size override available via `size` prop

#### Accessibility
- **Reduced Motion Support** - Respects `prefers-reduced-motion` setting
- **Keyboard Navigation** - Future enhancement planned
- **Screen Reader Support** - ARIA labels for controls
- **High Contrast** - Clear visual indicators

---

## Scheduler Integration

Full-featured scheduling system integrated with Home Assistant's `nielsfaber/scheduler-component`.

### Features

#### Time-Based Scheduling
- **Visual Time Picker** - iOS-style scrolling picker
- **Hour Selection** - 00-23 hours
- **Minute Selection** - 00-59 minutes (5-minute increments)
- **One-time Schedules** - Execute once at specified time
- **Recurring Schedules** - Repeat on selected weekdays

#### Weekday Selection
- **Visual Weekday Picker** - Monday-Sunday buttons
- **Multi-Select** - Choose multiple days
- **All Days Toggle** - Quick select/deselect all
- **Visual Feedback** - Selected days highlighted

#### Domain-Specific Actions

##### Climate Schedules
- **HVAC Mode Selection** - Heat, Cool, Auto, Off, Heat/Cool
- **Temperature Setting** - Desired temperature value
- **Combined Actions** - Set mode and temperature together
- **Mode Labels** - Localized HVAC mode names

##### Cover Schedules
- **Position Control** - Set exact position (0-100%)
- **Quick Actions** - Open, Close, Stop
- **Action Selection** - Open, Close, or Set Position

##### Standard Entity Schedules
- **Turn On/Off** - Simple on/off schedules
- **State Verification** - Shows current entity state

#### Timer Naming

Automatic generation of descriptive timer names:

**Format Examples:**
- `Bedroom Light / Turn On`
- `Living Room Thermostat / Heat / 22°C`
- `Bedroom Blinds / Position 50%`

**File:** `src/utils/timerNameGenerators.js` (35 lines)

#### Edit Mode

Edit existing schedules:
- Load existing timer configuration
- Pre-fill all fields (time, weekdays, action)
- Update existing schedule
- Delete schedule option

#### User Interface Components

**AddScheduleButton.jsx** (27 lines)
- Animated add button with icon
- Hover effects
- Disabled state support

**ScheduleActionButtons.jsx** (57 lines)
- Cancel button - Closes picker
- Confirm button - Saves schedule
- Validation feedback
- Disabled states when form incomplete

**SchedulePickerTable.jsx** (188 lines)
- Complete picker interface
- Time selection rows
- Weekday selection
- Action configuration
- Domain-specific controls
- Integrated validation

### Service Actions

**File:** `src/utils/serviceActionBuilders.js` (40 lines)

**Functions:**
```javascript
createServiceAction(item, actionValue, climateSettings, coverPosition, t)
// Builds Home Assistant service call objects

// Climate Example:
{
  service: "climate.set_temperature",
  entity_id: "climate.living_room",
  service_data: {
    temperature: 22,
    hvac_mode: "heat"
  }
}

// Cover Example:
{
  service: "cover.set_cover_position",
  entity_id: "cover.bedroom_blinds",
  service_data: { position: 50 }
}

// Standard Example:
{
  service: "light.turn_on",
  entity_id: "light.bedroom"
}
```

### Edit State Management

**File:** `src/utils/editStateLoaders.js` (86 lines)

**Functions:**
- `loadCoverEditState(timer)` - Parse cover timer configuration
- `loadClimateEditState(timer)` - Parse climate timer with HVAC mode
- `loadStandardEditState(timer)` - Parse on/off timer
- `loadTimerState(timer)` - Load timer details (time, weekdays, enabled)
- `loadScheduleState(timer)` - Complete schedule state loader

### Integration Requirements

Requires `nielsfaber/scheduler-component` to be installed:

```yaml
# configuration.yaml
scheduler:
  # Component configuration
```

The card automatically detects the scheduler component and enables the Schedule tab if available.

---

## History & Analytics

Visual history display with interactive charts and time-based analysis.

### Time Range Selection

Configurable time ranges for history queries:

- **1 Hour** - Last hour with minute precision
- **3 Hours** - Last 3 hours
- **6 Hours** - Last 6 hours
- **12 Hours** - Last 12 hours
- **24 Hours** - Last 24 hours (default)
- **7 Days** - Last week with day precision
- **30 Days** - Last month with day precision

**Visual Selector:** Segmented control with active state highlighting

### History Display

#### Timeline Chart
- **Chart.js Integration** - High-performance canvas rendering
- **State Changes** - Visual representation of entity states over time
- **Interactive Tooltips** - Hover for detailed information
- **Zoom & Pan** - Explore history in detail (if enabled)
- **Color Coding** - Different colors for different states

#### Event List
- **Chronological Order** - Most recent first
- **State Changes** - Old state → New state
- **Timestamps** - Formatted based on time range
- **Event Details** - Full state object inspection

### Time-of-Day Analysis

Categorizes events into four time periods:

**Categories:**
- **Morning** (06:00 - 12:00)
- **Day** (12:00 - 18:00)
- **Evening** (18:00 - 22:00)
- **Night** (22:00 - 06:00)

**Display:**
- Expandable accordion sections
- Event count per category
- Detailed event lists within each category
- Smooth expand/collapse animations

**File:** `src/utils/historyDataProcessors.js` (39 lines)

**Function:**
```javascript
generateCategoryData(history)
// Processes history array into time-of-day categories
// Returns object with morning, day, evening, night arrays
```

### Accordion Animations

**File:** `src/utils/animations/accordionAnimations.js` (65 lines)

**Variants:**
```javascript
accordionVariants = {
  collapsed: {
    height: 0,
    opacity: 0,
    transition: { height: 0.4s, opacity: 0.3s }
  },
  expanded: {
    height: "auto",
    opacity: 1,
    transition: { height: 0.4s, opacity: 0.3s + 0.1s delay }
  }
}
```

**Animation Features:**
- Smooth height animation with custom easing
- Opacity fade-in/out
- Staggered content reveal
- GPU acceleration

### Time Formatting

**File:** `src/utils/timeFormatters.js` (44 lines)

**Functions:**
```javascript
formatTime(timestamp, timeRange)
// Returns formatted time string based on range
// ≤24h: "14:30" (time only)
// >24h: "28.10 14:30" (date + time)

formatDuration(minutes)
// Returns human-readable duration
// Examples: "5 min", "2h 30min", "3d 5h"

getHoursFromTimeframe(timeRange)
// Converts time range string to hours
// "24h" → 24, "7d" → 168
```

### Statistics Display

Optional statistics section showing:
- Total events in time range
- Most common states
- Average duration per state
- State change frequency

### Text Event Filtering

Filter history to show only text-based events:
- Excludes numeric state changes
- Shows meaningful state transitions
- Reduces noise in history

### Styling

**File:** `src/components/tabs/HistoryTab.css` (255 lines)

**Sections:**
- Container styles
- Time range selector
- Accordion sections
- Chart container
- Loading states
- Event list
- Stats grid
- Responsive breakpoints

**Performance Benefits:**
- Separate CSS file enables browser caching
- Reduces inline style overhead
- Easier maintenance and theming

---

## System Entities & Plugins

Modular system entities that provide core functionality and extensibility.

### System Entities

Special entities that appear in search results and provide system-level features:

#### Settings Entity
- **Icon:** Gear/Settings icon
- **Function:** Opens in-card settings interface
- **Access:** Search for "Settings" or "Einstellungen"

#### Marketplace Entity
- **Icon:** Store/Marketplace icon
- **Function:** Plugin store interface (In Development)
- **Access:** Search for "Marketplace"

#### Schedule Viewer Entity
- **Icon:** Calendar icon
- **Function:** View all schedules across all entities
- **Access:** Search for "Schedule" or "Zeitplan"

### Plugin Framework (In Development)

Extensible plugin system for custom functionality:

#### Plugin Architecture
- **Modular Design** - Each plugin is a self-contained module
- **Dynamic Loading** - Plugins loaded at runtime
- **API Access** - Full access to Home Assistant API
- **UI Integration** - Plugins can add tabs, controls, and entities

#### Plugin Sources
- **Local Files** - Load from `/config/www/plugins/`
- **GitHub** - Direct installation from GitHub repositories
- **URLs** - Load from any HTTPS URL
- **HACS Integration** - Future integration with HACS

#### Plugin Store
- **Browse Plugins** - Discover available plugins
- **Install/Uninstall** - One-click plugin management
- **Update Management** - Check for and install updates
- **Plugin Settings** - Per-plugin configuration

#### Plugin Types
- **Entity Plugins** - Add new device type support
- **Tab Plugins** - Add new tabs to detail view
- **Control Plugins** - Custom control interfaces
- **Service Plugins** - Background services and automations

### AI Mode (Experimental)

Natural language control interface:

**Features:**
- Chat-based interaction
- Entity control via text commands
- State queries
- Automation suggestions

**Current Status:** Simulated responses (no real AI integration yet)

**Planned Integration:**
- OpenAI GPT
- Local LLM support (Ollama, LM Studio)
- Home Assistant Conversation integration

---

## Performance & Optimization

Multiple optimization strategies ensure fast, smooth operation:

### Caching & Storage

#### IndexedDB Caching
- **Entity Cache** - All entities stored locally
- **Favorites** - Persistent favorite entity list
- **Recent Items** - Recently accessed entities
- **Settings** - User preferences and configurations
- **Offline Support** - Basic functionality without network

**Benefits:**
- Initial load: < 1s after first visit
- Reduced API calls
- Instant search results
- Works offline

#### Service Layer
**Files:**
- `src/services/entityService.js` - Entity management
- `src/services/storageService.js` - IndexedDB operations
- `src/services/haService.js` - Home Assistant API

### Animation Performance

#### GPU Acceleration
All animations use GPU-accelerated properties:
- `transform` - Never use `left/top`
- `opacity` - Smooth fading
- `translateZ(0)` - Force GPU layer
- `backfaceVisibility: hidden` - Prevent flicker

#### Framer Motion Optimization
- **Spring Physics** - Natural, efficient animations
- **Motion Values** - Direct DOM manipulation
- **useTransform** - Derived values without re-renders
- **AnimatePresence** - Smooth mount/unmount

### Build Optimization

#### Vite Configuration
- **Code Splitting** - Separate vendor bundles
- **Tree Shaking** - Remove unused code
- **Minification** - Terser for JS, cssnano for CSS
- **Asset Optimization** - Image and SVG compression

**Build Output:**
- Main bundle: ~500KB (minified)
- Gzip size: ~246KB
- Build time: ~2s

### Render Optimization

#### Component Structure
- **Functional Components** - Fast rendering
- **Hooks** - Efficient state management
- **Memo/useMemo** - Prevent unnecessary renders
- **useCallback** - Stable function references

#### Virtual Scrolling
For long entity lists:
- Only render visible items
- Recycle DOM elements
- Smooth scrolling performance

### CSS Performance

#### Extracted Stylesheets
- **Separate CSS Files** - Better caching
- **No Inline Styles** - Reduced HTML size
- **CSS Modules** - Scoped styles without overhead

**Example:** HistoryTab.css (255 lines) extracted from inline styles

#### CSS Best Practices
- Avoid expensive properties (box-shadow on scroll elements)
- Use `transform` instead of position changes
- Minimize repaints with `will-change`
- Efficient selectors (no deep nesting)

### Network Optimization

#### Debouncing
- Search input debounced (300ms)
- Slider value updates debounced (100ms)
- Prevents excessive API calls

#### Request Batching
- Group multiple state queries
- Single WebSocket connection
- Efficient event subscriptions

### Memory Management

#### Cleanup
- Event listeners removed on unmount
- Animation frames cancelled
- WebSocket subscriptions closed
- IndexedDB connections managed

#### Efficient Data Structures
- Map/Set for lookups instead of arrays
- Normalized state shape
- Memoized computed values

---

## Internationalization

Multi-language support with 10+ languages:

### Supported Languages

- **English (en)** - Default
- **German (de)** - Deutsch
- **Spanish (es)** - Español
- **French (fr)** - Français
- **Italian (it)** - Italiano
- **Dutch (nl)** - Nederlands
- **Polish (pl)** - Polski
- **Portuguese (pt)** - Português
- **Russian (ru)** - Русский
- **Chinese (zh)** - 中文

### Translation System

#### Translation Files
Structure: `src/i18n/[lang].json`

**Example Structure:**
```json
{
  "search": "Search",
  "devices": "Devices",
  "sensors": "Sensors",
  "turnOn": "Turn On",
  "turnOff": "Turn Off",
  "brightness": "Brightness",
  "temperature": "Temperature",
  "schedule": "Schedule",
  "history": "History"
}
```

#### Translation Function
```javascript
const t = (key) => translations[language][key] || key
```

**Usage:**
```javascript
<button>{t('turnOn')}</button>
// English: "Turn On"
// German: "Einschalten"
```

### Language Selection

**Location:** Settings Tab → General → Language

**Features:**
- Dropdown selector with all languages
- Instant switching (no reload required)
- Persistent preference (saved in IndexedDB)
- Fallback to English for missing translations

### Localized Features

#### Time & Date Formatting
Uses browser's `Intl` API for locale-aware formatting:

```javascript
date.toLocaleTimeString(locale, options)
date.toLocaleDateString(locale, options)
```

**Examples:**
- **en:** "2:30 PM", "10/28/2025"
- **de:** "14:30", "28.10.2025"
- **zh:** "下午2:30", "2025/10/28"

#### Number Formatting
- Decimal separators (`.` vs `,`)
- Thousands separators
- Currency formatting (if applicable)

#### HVAC Mode Labels
Climate control modes are fully localized:

**File:** `src/utils/timerNameGenerators.js`

**Example:**
```javascript
getHvacModeLabel(mode, lang)
// mode: "heat", lang: "en" → "Heat"
// mode: "heat", lang: "de" → "Heizen"
// mode: "heat", lang: "fr" → "Chauffage"
```

#### Relative Time
- "Just now" / "Gerade eben" / "À l'instant"
- "5 minutes ago" / "vor 5 Minuten" / "il y a 5 minutes"
- "Yesterday" / "Gestern" / "Hier"

---

## Advanced Features

### Responsive Circular Slider

The circular slider automatically adjusts based on screen size:

**Breakpoints:**
```javascript
calculateResponsiveSize() {
  const width = window.innerWidth;
  if (width < 600) return 200;      // Mobile
  if (width < 960) return 240;      // Tablet
  return 280;                       // Desktop
}
```

**Layout Animation:**
- Smooth size transitions when resizing
- Spring animation (stiffness: 300, damping: 30)
- No layout shift or jank

### Temperature Color Gradients

For climate entities, the slider color dynamically changes:

**Implementation:**
```javascript
useEffect(() => {
  if (domain === 'climate' && (unit === '°C' || unit === '°F')) {
    const newColor = getTemperatureColor(currentValue, unit);
    setDynamicColor(newColor);
  }
}, [currentValue, domain, unit]);
```

**Visual Effect:**
- Smooth color transitions (0.3s)
- Real-time feedback as you drag
- Celsius/Fahrenheit support

### Power State Restoration

When turning a device back on, it remembers the last value:

**Example:**
1. User sets brightness to 75%
2. User turns light off (brightness → 0%)
3. User turns light on → brightness restores to 75%

**Implementation:** `usePowerState` hook stores last non-zero value

### Auto Power-On

Dragging a slider automatically turns the device on:

**Code Location:** `useCircularDrag.js:74-78`

```javascript
if (showPower && !localPowerState && clampedValue > 0) {
  setLocalPowerState(true);
  if (onPowerToggle) onPowerToggle(true);
}
```

### Scrolling Text Display

Long entity names or states scroll horizontally:

**Implementation:**
- Detects text overflow
- Smooth horizontal animation
- Infinite loop with reset
- requestAnimationFrame for performance

**Code Location:** `CircularSlider.jsx:238-265`

### Accessibility Features

#### Reduced Motion Support
Respects user's motion preferences:

```css
@media (prefers-reduced-motion: reduce) {
  .circular-slider-container * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

#### Cursor States
- `grab` - Idle slider
- `grabbing` - Active drag
- `default` - Read-only mode
- `pointer` - Clickable elements

#### Keyboard Navigation
(Planned enhancement)
- Arrow keys for value adjustment
- Tab for focus management
- Enter/Space for toggle actions

---

## Technical Architecture

### Component Hierarchy

```
FastSearchCard
├── SearchBar
│   └── SearchResultItem[]
├── DetailView
│   ├── DeviceCard
│   │   ├── AnimatedIcon
│   │   └── DeviceCardControls
│   └── TabContainer
│       ├── ContextTab
│       │   └── RelatedEntities[]
│       ├── UniversalControlsTab
│       │   ├── CircularSlider
│       │   │   ├── PowerToggle
│       │   │   └── CircularSliderDisplay
│       │   └── DomainControls
│       ├── ScheduleTab
│       │   ├── AddScheduleButton
│       │   ├── SchedulePickerTable
│       │   └── ScheduleActionButtons
│       ├── HistoryTab
│       │   ├── TimeRangeSelector
│       │   ├── HistoryChart
│       │   └── AccordionSections[]
│       └── SettingsTab
└── SystemEntities[]
```

### Data Flow

#### State Management
- **Local State** - useState for component-specific state
- **Lifted State** - Parent components manage shared state
- **Props** - Unidirectional data flow
- **Callbacks** - Events bubble up

#### Home Assistant Integration
```
FastSearchCard
  ↓ (subscribes)
Home Assistant WebSocket
  ↓ (state updates)
Entity Service
  ↓ (caches)
IndexedDB
  ↓ (reads)
Component State
```

#### Action Flow
```
User Interaction
  ↓ (event)
Component Handler
  ↓ (state update)
Home Assistant Service Call
  ↓ (WebSocket)
Home Assistant Core
  ↓ (state change)
Entity Update
  ↓ (WebSocket event)
Component Re-render
```

### File Organization

```
src/
├── components/
│   ├── cards/              # Card components
│   ├── controls/           # Interactive controls
│   ├── search/             # Search interface
│   └── tabs/               # Tab views
├── hooks/
│   ├── useCircularDrag.js  # Drag interactions
│   ├── useSliderAnimation.js # Animation logic
│   ├── usePowerState.js    # Power state management
│   └── useFavoriteManager.js # Favorites handling
├── utils/
│   ├── animations/         # Animation variants
│   ├── entityHelpers.js    # Entity utilities
│   ├── domainSpecifics.js  # Domain logic
│   ├── temperatureColors.js # Color mapping
│   ├── timeFormatters.js   # Time utilities
│   └── ...                 # Other utilities
├── services/
│   ├── haService.js        # HA API
│   ├── entityService.js    # Entity management
│   └── storageService.js   # IndexedDB
├── i18n/
│   └── [lang].json         # Translations
└── styles/
    └── global.css          # Global styles
```

---

## Future Roadmap

### Planned Features

#### Short Term
- [ ] Keyboard navigation support
- [ ] Screen reader improvements
- [ ] Plugin store beta release
- [ ] Enhanced search filters
- [ ] More entity types support

#### Medium Term
- [ ] Real AI integration (OpenAI/Local LLM)
- [ ] Custom automation builder
- [ ] Advanced scheduling (conditions, triggers)
- [ ] Multi-entity control
- [ ] Dashboard widget mode

#### Long Term
- [ ] Mobile app companion
- [ ] Voice control integration
- [ ] Energy monitoring features
- [ ] Scene composer
- [ ] Backup & sync across devices

### Community Contributions

Areas where contributions are welcome:
- New translations
- Plugin development
- Icon designs
- Bug reports and fixes
- Documentation improvements
- Feature suggestions

---

## Conclusion

The Fast Search Card is a comprehensive, performant, and user-friendly interface for Home Assistant. Its modular architecture, smooth animations, and extensive feature set make it a powerful tool for managing smart home entities.

For more information:
- **GitHub:** [github.com/fastender/Fast-Search-Card](https://github.com/fastender/Fast-Search-Card)
- **Documentation:** See `/docs` folder
- **Issues:** Report bugs on GitHub Issues
- **Discussions:** Join GitHub Discussions

**Version:** 1.1.0+ (October 2025)
**License:** MIT
