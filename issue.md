# Issue #2 - [BUG] Sidebar header text unreadable with certain theme lightness settings

**Description**
When adjusting the lightness level of screen themes, sidebar header texts in the explorer become unreadable due to poor contrast between text and background colors.

**Current Behavior**
- Changing theme lightness affects sidebar colors
- Header text contrast becomes insufficient
- Text is difficult or impossible to read in certain lightness configurations

**Expected Behavior**
Sidebar header text should remain readable with adequate contrast across all theme lightness settings.

**Steps to Reproduce**
1. Open Puter explorer
2. Navigate to theme settings
3. Adjust the lightness slider to various levels
4. Observe sidebar header text becoming unreadable at certain lightness values

**Proposed Solution**
Implement dynamic contrast adjustment for sidebar header text colors that adapts to the current theme lightness setting, ensuring WCAG accessibility standards are met.

