# Pecase Project Standards

## Critical UI/UX Standards

### 🚫 NO EMOJIS ANYWHERE

Emojis are **strictly prohibited** in:
- ❌ UI buttons
- ❌ Navigation icons
- ❌ Metric cards
- ❌ Dashboard elements
- ❌ Reports
- ❌ Any visual interface element

**Why:** Emojis look unprofessional in enterprise software. Use proper icon libraries instead.

### ✅ REQUIRED: Professional Icon Libraries

For **React/Next.js projects**, use:
- **lucide-react** (recommended) - 500+ professional minimalist icons
  ```bash
  pnpm add lucide-react
  ```

  Usage example:
  ```tsx
  import { Users, Calendar, DollarSign, Settings } from 'lucide-react'

  <Users size={24} />
  <Calendar size={20} />
  ```

- **react-icons** (with professional packs like Feather, Heroicons)
  ```bash
  pnpm add react-icons
  ```

- **Custom SVG icons** - Create your own minimalist designs

### Icon Standards

All icons must be:
- ✓ Minimalist (no fill, clean strokes)
- ✓ Consistent stroke width
- ✓ Professional appearance
- ✓ Readable at 16px-32px sizes
- ✓ Properly colored with accent colors (not arbitrary)

### Color System

All UI must use the approved color palette:
- **Primary:** Sage Green (#C7DCC8)
- **Accents:** Soft Peach (#F4D9C8), Lavender (#E8D4F1), Mint (#D9E8DC), Rose (#F0D9D9)
- **Background:** Cream (#F5F3F0)
- **Text:** Charcoal (#2C2C2C)
- **Neutral:** Grays (#999, #666, #E8E6E4)

### Typography

- **Headings:** Use bold, distinctive fonts (not generic)
- **Body:** Clean, readable sans-serif (Inter, Outfit, system fonts)
- **Size hierarchy:** Clear distinction between h1, h2, h3, body text

### Component Quality

Every component must have:
- ✓ Professional rounded corners (8px minimum)
- ✓ Subtle shadows (0 2px 8px rgba(0,0,0,0.05))
- ✓ Proper spacing (8px grid)
- ✓ Hover states
- ✓ No placeholder content
- ✓ No debug text

### Testing Requirements

Before submitting UI work:
1. ✓ Scan code for ANY emoji characters (👥 📅 💰 ⚙️ etc.)
2. ✓ Take screenshot and compare to specification
3. ✓ Verify all metrics/icons use professional icons
4. ✓ Verify colors match palette exactly
5. ✓ Test on actual browser (hard refresh with Ctrl+Shift+R)
6. ✓ Check navigation and buttons are functional

### Validation Checklist

**NO UI IS DONE UNTIL:**
- [ ] Zero emojis in entire codebase
- [ ] All icons use professional library (lucide-react or custom SVG)
- [ ] Layout matches specification exactly
- [ ] Colors match palette exactly
- [ ] Typography hierarchy is clear
- [ ] Spacing is consistent (8px grid)
- [ ] Component shadows and borders correct
- [ ] Hover/active states present
- [ ] Visual verification done in browser
- [ ] Screenshot matches reference design

## Deployment Requirements

All agents and skills must follow these rules:

### For UI Agents
- Use `lucide-react` for ALL icon needs
- Never suggest emojis for any UI element
- Verify emoji-free before marking UI as complete
- Use UI Specification Validator skill for all UI work

### For Design Skills
- frontend-design: Specify lucide-react icons in requirements
- spa-ui-designer: No emojis, use professional icons only
- ui-specification-validator: Check for emojis as critical violation

### For Planning
- writing-plans: Include emoji prohibition in UI checklists
- brainstorming: When designing UI, specify icon approach (no emojis)

## Emergency Rule

**If you see ANY emoji in UI code or running website:**
1. STOP
2. Replace with lucide-react icon or custom SVG
3. Verify in browser
4. Only then mark as fixed

No workarounds. No exceptions. No "it's just temporary."

---

**Last Updated:** 2026-01-12
**Status:** ACTIVE - ALL AGENTS AND SKILLS MUST COMPLY
