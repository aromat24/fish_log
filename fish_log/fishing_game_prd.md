# Fishing Game PWA - Product Requirements Document

## Executive Summary

This document outlines the product requirements for a mobile-optimized fishing game that integrates with an existing PWA fishing logbook database. The game will feature intuitive touch-based casting mechanics, utilize real fish species data for authentic gameplay, and run locally in mobile browsers using IndexedDB for offline functionality.

## 1. Product Overview

### 1.1 Vision Statement
Create an engaging, accessible fishing game that bridges casual entertainment with educational fish species knowledge, leveraging existing logbook data to provide authentic fishing experiences.

### 1.2 Target Audience
- **Primary**: Existing fishing logbook app users (ages 25-55)
- **Secondary**: Casual mobile gamers interested in fishing
- **Tertiary**: Educational users learning about fish species

### 1.3 Core Value Proposition
- **Authentic Experience**: Real fish species with accurate size/weight calculations
- **Intuitive Controls**: Touch-optimized casting mechanics designed for mobile
- **Educational Value**: Learn fish identification and behavior patterns
- **Offline Capable**: Fully functional without internet connection

## 2. Technical Architecture

### 2.1 Framework Selection
Based on 2025 research, the recommended stack is:

**Primary Framework**: React
- **Rationale**: React is a popular JavaScript framework from Facebook with a large community of developers familiar with it. One of React's key features is the use of a virtual DOM, which allows for efficient updates to the actual DOM, resulting in high-performance web apps
- Virtual DOM optimization for smooth 60fps gameplay
- Large community and documentation
- Excellent PWA support with offline capabilities

**Alternative Consideration**: Vue.js
- Vue.js's key strengths is its use of a virtual DOM, which significantly improves rendering efficiency and contributes to creating scalable and responsive PWAs
- Gentler learning curve if team prefers

### 2.2 Game Engine
**HTML5 Canvas with Custom Game Loop**
- **Rationale**: HTML5 and WebGL to run games and other interactive 3D content in any mobile or desktop browser
- Direct control over rendering pipeline for optimization
- Better performance than DOM-based solutions for animation-heavy games
- Platform-independent and PWA-compatible

### 2.3 PWA Architecture
```
┌─────────────────────────────────────────┐
│              Service Worker             │
│          (Caching & Offline)            │
├─────────────────────────────────────────┤
│             React App Shell             │
│        (UI Components & Game Logic)     │
├─────────────────────────────────────────┤
│           HTML5 Canvas Layer            │
│         (Game Rendering Engine)         │
├─────────────────────────────────────────┤
│            IndexedDB Store              │
│     (Fish Data, Game State, Scores)     │
└─────────────────────────────────────────┘
```

### 2.4 Data Storage Strategy
**IndexedDB Implementation**
- **Primary Storage**: Use IndexedDB to store structured data. This includes data that needs to be searchable or combinable in a NoSQL-like manner, or other data such as user-specific data that doesn't necessarily match a URL request
- **Fish Species Database**: Import existing species data with length-to-weight calculations
- **Game State**: Player progress, achievements, caught fish records
- **Performance Data**: High scores, statistics, unlocked content

## 3. Game Design Specifications

### 3.1 Core Game Loop
Based on successful fishing game patterns analyzed:

**Phase 1: Casting**
- Touch-drag mechanic for cast direction and power
- Visual trajectory indicator
- Depth selection (shallow, medium, deep waters)

**Phase 2: Waiting/Luring**
- Approach-Lure: the phase in which the player looks for the right spot and wait for the fish to bite. This is where the game build up the serenity axis
- Ambient underwater view
- Fish AI patterns based on species behavior
- Interactive lure movement via touch

**Phase 3: Bite Detection**
- Bite: the transition phase between approach and catch. The player understands that the fish bite and need to do an action to start the next phase. This is where the game can build up the surprise and excitement axis
- Visual and haptic feedback for bite indication
- Timing-based hook setting mechanic

**Phase 4: Fighting/Catching**
- Catch: the phase in which the player fights with the fish to actually grab it. This is where the game build up the challenge and the excitement of fishing
- Tension management system
- Species-appropriate fight patterns
- Success/fail resolution

### 3.2 Touch Control Design

#### Primary Control Scheme: "Gamer Stance"
The "Gamer Stance" is the bread and butter for most game-experienced players on the iPhone. It involves holding the gaming device with two hands and using both thumbs as controllers

**Casting Mechanic**:
```
┌─────────────────────────────────────┐
│  [  Cast Power & Direction Zone   ] │
│                                     │
│     ○ ← Thumb drag from center     │
│       ↑ Distance = Power           │
│       ↗ Direction = Angle         │
│                                     │
│  [    Game Viewport Area         ]  │
│                                     │
│  [    UI Controls (bottom)       ]  │
└─────────────────────────────────────┘
```

**Control Implementation**:
- touchstart is fired when the user puts a finger on the screen. touchmove is fired when they move the finger on the screen while touching it. touchend is fired when the user stops touching the screen
- Minimum 44x44 pixel touch targets for UI elements
- Gesture-based reel control during fish fights

#### Secondary Support: "Casual Prodder"
The "Casual Prodder" is how the majority of the world plays on the iPhone. One hand holds the gaming device while the other hand (thumb or fingers) control the game play

### 3.3 Fish Species Integration

**Database Schema Extension**:
```javascript
// Extend existing fish species data
const fishSpecies = {
  id: "bass_largemouth",
  name: "Largemouth Bass",
  scientificName: "Micropterus salmoides",
  
  // Existing logbook data
  lengthToWeight: function(length) { /* existing formula */ },
  averageLength: [12, 24], // inches
  maxLength: 36,
  
  // New game-specific properties
  gameData: {
    habitat: ["shallow", "medium"], // depth preferences
    aggressiveness: 0.7, // 0-1 scale for bite probability
    fightStrength: 0.8, // resistance during catch phase
    rarity: 0.3, // 0-1 spawn probability
    seasonalActivity: {
      spring: 0.9,
      summer: 0.7,
      fall: 0.8,
      winter: 0.3
    },
    preferredLures: ["spinnerbait", "crankbait", "plastic_worm"],
    behaviorPattern: "ambush_predator" // affects AI movement
  }
}
```

### 3.4 Progressive Difficulty System

**Location-Based Progression**:
1. **Pond**: 5-10 common species, high catch rate
2. **Lake**: 10-20 species mix, medium difficulty
3. **River**: 15-25 species, flowing water mechanics
4. **Ocean**: 20+ species, tides and weather effects

**Equipment Progression**:
- Starter rod: Basic sensitivity and strength
- Upgraded rods: Species-specific bonuses
- Lure variety: Unlocked through gameplay achievements

## 4. Mobile Optimization Requirements

### 4.1 Performance Targets
- **Frame Rate**: Consistent 60 FPS during gameplay
- **Load Time**: App shell < 3 seconds on 3G
- **Battery Impact**: Unfortunately, the answer is to draw less. I've found the bottleneck with canvas based applications (on any platform, really) is the time it takes to actually draw pixels

### 4.2 Canvas Optimization Strategies
- **Layer Separation**: Static background, dynamic game objects, UI overlay
- **Dirty Rectangle Rendering**: Only redraw changed areas
- **Object Pooling**: Reuse fish and particle objects
- **Texture Atlasing**: Single image file for all sprites

### 4.3 Responsive Design
```css
/* Viewport Configuration */
<meta name="viewport" content="width=device-width, user-scalable=no, initial-scale=1.0">
```

**Screen Size Support**:
- iPhone SE (375×667) minimum
- Standard phones (390×844)
- Large phones (430×932)
- Tablet landscape mode (768×1024)

### 4.4 Touch Optimization
Following mobile game best practices:
- touch targets should be at least 44x44 pixels for optimal interaction. This adjustment minimizes user frustration and promotes fluid gameplay
- Always aim to have 1 mechanic at time. It's possible to have more then one mechanic, just allow the user to opt-in

## 5. Data Architecture

### 5.1 IndexedDB Database Design

```javascript
// Database Schema
const DB_SCHEMA = {
  name: "FishingGameDB",
  version: 1,
  stores: {
    fishSpecies: {
      keyPath: "id",
      indices: ["habitat", "rarity", "family"]
    },
    playerProfile: {
      keyPath: "id",
      indices: ["level", "totalCatches"]
    },
    gameSession: {
      keyPath: "sessionId",
      indices: ["date", "location", "duration"]
    },
    catches: {
      keyPath: "catchId",
      indices: ["speciesId", "date", "length", "weight"]
    },
    achievements: {
      keyPath: "achievementId",
      indices: ["type", "unlocked", "date"]
    }
  }
};
```

### 5.2 Offline-First Architecture
For PWAs, you could cache the static files composing your application shell (JS/CSS/HTML files) in the Cache API and fill in the offline page data from IndexedDB

**Caching Strategy**:
- **Cache First**: Game assets, fish images, audio files
- **Network First**: Optional features, leaderboards
- **Cache Only**: Core game functionality, fish database

### 5.3 Data Synchronization
For future online features:
- **Background Sync**: Queue achievements and high scores
- **Conflict Resolution**: Last-write-wins for personal data
- **Selective Sync**: User can choose what data to sync

## 6. User Interface Design

### 6.1 Screen Layout Hierarchy

**Main Menu Screen**:
```
┌─────────────────────────────────────┐
│           Game Logo                 │
│                                     │
│        [  Quick Fish  ]            │
│        [  Locations   ]            │
│        [  Fish Guide  ]            │
│        [  Achievements]            │
│        [  Settings    ]            │
│                                     │
│     Daily Challenge: Catch 3 Bass   │
└─────────────────────────────────────┘
```

**Gameplay Screen**:
```
┌─────────────────────────────────────┐
│  ⚙️ [Score: 1250]  🎒 [Inventory]  │
├─────────────────────────────────────┤
│                                     │
│        Game Canvas Area             │
│     (Underwater/Above Water)        │
│                                     │
├─────────────────────────────────────┤
│  🎣 Cast Power    ⏸️ Pause  🏠 Home │
└─────────────────────────────────────┘
```

### 6.2 Accessibility Features
- High contrast mode option
- Larger touch targets setting
- Haptic feedback alternatives for audio cues
- Colorblind-friendly species identification

### 6.3 Educational Integration
**Fish Information Panel**:
- Species identification with photos
- Habitat and behavior descriptions
- Conservation status indicators
- Real-world fishing tips

## 7. Audio Design

### 7.1 Audio Requirements
**Sound Effects**:
- Water splash and bubbling (ambient)
- Reel clicking and line tension sounds
- Species-specific splash patterns
- Achievement/success audio feedback

**Music**:
- Ambient nature soundscapes
- Location-specific themes (pond vs ocean)
- Dynamic intensity based on game state

### 7.2 Mobile Audio Optimization
- Compressed audio formats (WebM, AAC)
- Audio sprite sheets for efficient loading
- Respectful of device silent mode settings

## 8. Monetization Strategy

### 8.1 Base Model: Premium Features
- Core game: Free with 3 locations
- **Pro Unlock**: $4.99 for all locations and species
- **Educational Pack**: $2.99 for detailed fish guides

### 8.2 Alternative: Freemium
If metrics support:
- **Energy System**: Limited casts per session
- **Premium Lures**: Enhanced catch rates
- **Ad-Free Experience**: Remove optional reward videos

### 8.3 Revenue Considerations
Following successful fishing game patterns:
- Each of these companies identified a gaming trend from years ago — a game that performed well within its market & business model (paid, mobile) that could be easily ported over to their model (hyper-casual)

## 9. Development Timeline

### 9.1 Phase 1: Core Prototype (4-6 weeks)
- Basic casting mechanics implementation
- Single location with 5 fish species
- IndexedDB integration for fish data
- Core touch controls optimization

### 9.2 Phase 2: Game Systems (6-8 weeks)
- Full fishing game loop implementation
- Fish AI and behavior systems
- Achievement and progression systems
- Audio integration

### 9.3 Phase 3: Content & Polish (4-6 weeks)
- Additional locations and species
- UI/UX refinement and testing
- Performance optimization
- PWA features (offline mode, installability)

### 9.4 Phase 4: Release & Iteration (ongoing)
- Beta testing with existing logbook users
- Analytics integration
- Feedback-driven improvements
- Additional content releases

## 10. Technical Implementation Guide

### 10.1 Canvas Setup for Mobile
```javascript
// Optimized canvas setup for mobile
function setupCanvas() {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  
  // High DPI support
  const devicePixelRatio = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  
  canvas.width = rect.width * devicePixelRatio;
  canvas.height = rect.height * devicePixelRatio;
  ctx.scale(devicePixelRatio, devicePixelRatio);
  
  // Touch event optimization
  canvas.style.touchAction = 'none';
  return { canvas, ctx };
}
```

### 10.2 Touch Input Handler
```javascript
// Unified touch/mouse input handler
class InputManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.isPointerDown = false;
    this.currentPointer = { x: 0, y: 0 };
    
    // el.addEventListener("touchstart", handleStart); el.addEventListener("touchmove", handleMove); el.addEventListener("touchend", handleEnd)
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    // Unified pointer events for better compatibility
    this.canvas.addEventListener('pointerdown', this.handlePointerDown.bind(this));
    this.canvas.addEventListener('pointermove', this.handlePointerMove.bind(this));
    this.canvas.addEventListener('pointerup', this.handlePointerUp.bind(this));
  }
  
  handlePointerDown(e) {
    // e.preventDefault() - prevent browser scrolling
    e.preventDefault();
    this.isPointerDown = true;
    this.updatePointerPosition(e);
  }
}
```

### 10.3 IndexedDB Integration
```javascript
// Fish species database integration
class FishDatabase {
  constructor() {
    this.dbName = 'FishingGameDB';
    this.version = 1;
  }
  
  async initialize() {
    // Use the openDB function to create a new IndexedDB database called cookbook. Because IndexedDB databases are versioned, you need to increase the version number whenever you make changes to the database structure
    const db = await this.openDatabase();
    return db;
  }
  
  async getSpeciesByHabitat(habitat) {
    const db = await this.initialize();
    const transaction = db.transaction(['fishSpecies'], 'readonly');
    const store = transaction.objectStore('fishSpecies');
    const index = store.index('habitat');
    return index.getAll(habitat);
  }
  
  async saveCatch(catchData) {
    const db = await this.initialize();
    const transaction = db.transaction(['catches'], 'readwrite');
    const store = transaction.objectStore('catches');
    return store.add(catchData);
  }
}
```

## 11. Success Metrics

### 11.1 Technical Performance KPIs
- **App Load Time**: < 3 seconds on 3G
- **Frame Rate**: Sustained 60 FPS on target devices
- **Crash Rate**: < 0.1% of sessions
- **Offline Functionality**: 100% core features available offline

### 11.2 User Engagement Metrics
- **Session Duration**: Target 8-12 minutes average
- **Return Rate**: 60% day-1, 30% day-7 retention
- **Feature Adoption**: 70% of users try all game locations
- **Educational Value**: Fish species identification improvement

### 11.3 Business Metrics
- **Install-to-Trial Rate**: 80% complete tutorial
- **Trial-to-Purchase**: 15% conversion to premium features
- **User Satisfaction**: 4.2+ average rating
- **Cross-Platform Usage**: Integration with existing logbook app

## 12. Risk Assessment & Mitigation

### 12.1 Technical Risks
**Performance on Low-End Devices**
- *Risk*: Game runs poorly on older mobile hardware
- *Mitigation*: Scalable graphics settings, performance profiling during development

**Browser Compatibility Issues**
- *Risk*: Inconsistent behavior across different mobile browsers
- *Mitigation*: Extensive testing on Safari, Chrome, Firefox mobile versions

**IndexedDB Storage Limitations**
- *Risk*: When the user's device starts being low on available disk space, also known as storage pressure, Microsoft Edge will start evicting non-persistent data
- *Mitigation*: Request persistent storage, implement data cleanup strategies

### 12.2 User Experience Risks
**Touch Control Complexity**
- *Risk*: Casual users find controls too difficult
- *Mitigation*: Progressive difficulty, extensive user testing, tutorial system

**Educational vs Entertainment Balance**
- *Risk*: Too much realism reduces fun factor
- *Mitigation*: Configurable difficulty modes, arcade vs simulation options

### 12.3 Market Risks
**Competition from Established Games**
- *Risk*: Fishing game market already saturated
- *Mitigation*: Unique educational angle, integration with existing user base

## 13. Post-Launch Roadmap

### 13.1 Version 1.1 Features (3 months)
- Multiplayer tournaments (online optional)
- Seasonal events and challenges
- Advanced fish AI with weather effects
- Photo mode for catches

### 13.2 Version 1.2 Features (6 months)
- Augmented reality fish identification
- Integration with real-world fishing conditions API
- Social sharing and community features
- Advanced statistics and analytics

### 13.3 Long-term Vision (12+ months)
- Cross-platform synchronization with other fishing apps
- Real-world fishing location recommendations
- Conservation education partnerships
- Gamified fishing license preparation

## Conclusion

This fishing game PWA represents a unique opportunity to combine entertainment with education while leveraging existing fish species data. The technical architecture emphasizes mobile-first design with offline capabilities, ensuring broad accessibility and consistent performance across devices.

The focus on intuitive touch controls and authentic fish behavior will differentiate this game from generic fishing apps while providing genuine value to both casual gamers and fishing enthusiasts. Success will be measured not only through traditional gaming metrics but also through educational impact and integration with the broader fishing community.

**Next Steps**:
1. Prototype core casting mechanic for user testing
2. Design fish species data migration from existing logbook
3. Establish development environment with selected framework
4. Begin initial user interface mockups and user journey mapping

---

*This PRD serves as a living document that should be updated based on user feedback, technical discoveries, and market changes throughout the development process.*