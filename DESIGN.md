---
name: Math with Henry
description: Geometry proved in flat color, a page from a colored-diagram Euclid with one teacher walking the proof.
colors:
  euclid-blue-deep: "#17397F"
  euclid-blue: "#2D63D4"
  proof-red: "#C8382E"
  proof-red-pressed: "#A92B22"
  diagram-yellow: "#F0BE2B"
  diagram-yellow-lit: "#FFD24D"
  ink: "#16161A"
  paper: "#FAFAF6"
  paper-shade: "#EFEEE6"
  on-blue: "#DCE6FA"
typography:
  display:
    fontFamily: "Bevan, Rockwell, Georgia, serif"
    fontSize: "3.9rem"
    fontWeight: 400
    lineHeight: 1.08
    letterSpacing: "-0.005em"
  headline:
    fontFamily: "Bevan, Rockwell, Georgia, serif"
    fontSize: "2.9rem"
    fontWeight: 400
    lineHeight: 1.08
    letterSpacing: "-0.005em"
  title:
    fontFamily: "Source Serif 4, Georgia, serif"
    fontSize: "1.35rem"
    fontWeight: 700
    lineHeight: 1.2
  body:
    fontFamily: "Source Serif 4, Georgia, serif"
    fontSize: "1.06rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Source Serif 4, Georgia, serif"
    fontSize: "0.95rem"
    fontWeight: 600
    lineHeight: 1.4
rounded:
  none: "0px"
spacing:
  xs: "8px"
  sm: "14px"
  md: "24px"
  lg: "56px"
  band: "96px"
  gutter: "28px"
components:
  button-primary:
    backgroundColor: "{colors.proof-red}"
    textColor: "#FFFFFF"
    rounded: "{rounded.none}"
    padding: "14px 24px"
  button-primary-hover:
    backgroundColor: "{colors.proof-red-pressed}"
  button-yellow:
    backgroundColor: "{colors.diagram-yellow}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "14px 24px"
  button-yellow-hover:
    backgroundColor: "{colors.diagram-yellow-lit}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "14px 24px"
  button-ghost-hover:
    backgroundColor: "{colors.paper-shade}"
  card-note:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "26px 28px"
  course-card-red:
    backgroundColor: "{colors.proof-red}"
    textColor: "#FFFFFF"
    rounded: "{rounded.none}"
    padding: "22px 20px 24px"
  input-field:
    backgroundColor: "#FFFFFF"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "12px 14px"
---

# Design System: Math with Henry

## Overview

**Creative North Star: "The Colored-Diagram Euclid"**

The site is a page from an 1847 colored-diagram Euclid (Byrne's), with Henry as the teacher walking the proof. Surfaces are flat blocks of Euclid blue, red, yellow, ink and white paper, divided by thick black rules. Nothing is rounded, shadowed or gradient-filled; depth comes from color adjacency and rule weight alone. The page reads top to bottom as a sequence of full-width color bands, like plates in a book.

Display type is heavy Victorian slab (Bevan) used sparingly for headings and numerals; everything a parent actually reads is a plain book serif (Source Serif 4). The signature moment is a Pythagorean figure of three flat squares on a white triangle that assembles on load, and the five-course "staircase" of colored blocks that rises in height from Algebra 1 to Calculus AB.

**Key Characteristics:**
- Four Euclid colors (red, yellow, blue, ink) on blue-deep and paper fields
- 3px ink rules as the only structure; square corners everywhere
- Bevan for display, Source Serif 4 for all reading text
- Flat color blocks as buttons, cards, numerals and bullets
- Motion is short and structural (shapes place, cards rise, buttons lift)

## Colors

A primary-color palette from a printed geometry book: one deep blue field, three flat accent colors and ink, on warm white paper.

### Primary
- **Euclid Blue Deep** (#17397F): the hero and dark bands, the theme color. Text on it is white or On-Blue.
- **Euclid Blue** (#2D63D4): a diagram color. Course card, step numeral, spine strip, the blue square of the proof.

### Secondary
- **Proof Red** (#C8382E): the primary action fill, the credentials panel, a course card, the underline of inline booking links. Pressed state is #A92B22 (Proof Red Pressed).
- **Diagram Yellow** (#F0BE2B): the secondary action, highlighted words in the H1, the contact band, selection color, focus ring on dark grounds. Lit hover is #FFD24D.

### Neutral
- **Ink** (#16161A): all text on light grounds, every rule and border, the verse banner and footer ground, one course card.
- **Paper** (#FAFAF6): default page ground, header, cards.
- **Paper Shade** (#EFEEE6): alternate band, ghost hover, scrollbar track.
- **On-Blue** (#DCE6FA): lede and supporting copy on blue bands.

### Named Rules
**The Four Colors Rule.** Accents are only red, yellow, blue and ink, applied as whole flat fills. No tints, no gradients, no translucent overlays.

**The Ink Rule.** Every border is Ink (white on blue bands), 3px. Lighter hairlines appear only inside lists (1px) and tags (2px).

## Typography

**Display Font:** Bevan (with Rockwell, Georgia)
**Body Font:** Source Serif 4 (with Georgia), lining numerals

**Character:** A heavy slab shouting a theorem over a calm, readable book serif. Bevan is a single weight (400) and is never bolded or italicized.

### Hierarchy
- **Display** (400, clamp(2.3rem, 4.6vw, 3.9rem), 1.08): the hero H1 only.
- **Headline** (400, clamp(1.9rem, 3.6vw, 2.9rem), 1.08): section H2s; smaller H2 in About (up to 2.4rem). Max width 660px.
- **Title** (Source Serif 700, 1.2-1.35rem, 1.2): course and step card H3, FAQ questions (1.2rem). Rate and note titles switch to Bevan at 1.2-2.2rem.
- **Body** (400, 1.06rem, 1.6): paragraphs at 56-62ch; lede on blue is 1.2rem.
- **Label** (600, 0.92-0.98rem): nav links, chips, facts, ladder chips.
- **Numeral** (Bevan, 2-2.6rem): course step and how-it-works numbers, set in colored squares.

### Named Rules
**The Slab-for-Headings Rule.** Bevan is for headings, numerals, the brand name, and the proof caption. Running text is always Source Serif 4.

## Layout

A single column of full-bleed bands (96px vertical padding) each holding a centered 1120px container with 28px side gutters. Bands alternate blue-deep, paper, paper-shade and yellow. The hero is a 1.1fr / 0.9fr grid (headline left, proof figure right) collapsing to one column below 960px. Course cards form a five-column staircase from 900px (min-heights 15 to 27rem, bottom-aligned, cards overlapping borders by 3px) and stack below. Content grids use auto-fit with 240-280px minimums and 24px gaps; lists (rates, FAQ, availability) are ruled rows, not cards. The header is sticky; below 1000px nav collapses to a Menu button and a fixed bottom booking bar appears. Spacing steps in use: 8, 14, 24, 28, 40, 56, 96px.

## Elevation & Depth

None. The system is shadowless and gradient-free. Hierarchy is carried by saturated color adjacency and 3px rules; only the sticky header and fixed booking bar sit "above" content, and they do so by a bottom or top rule, not a shadow. Interactive lift is a 3px upward translate on buttons.

### Named Rules
**The Flat-Plate Rule.** Surfaces are flat fills with ink rules. Depth is never simulated with shadow, blur or gradient (the one gradient-like use is the FAQ plus/minus glyph drawn from two solid ink bars).

## Shapes

Square corners (0px) on every button, card, input, numeral and bullet. Silhouettes are rectangles, with the triangle and squares of the proof figure as the only other geometry. Bullets are 11px yellow squares with a 2px ink border; the QED mark is a solid ink square. Photographs sit in ruled frames with a 3px bottom rule under the image.

## Components

### Buttons
- **Shape:** square, 3px ink border (white on blue bands), 14px 24px padding, Source Serif 700 at 1.02rem.
- **Primary:** Proof Red fill, white text.
- **Yellow:** Diagram Yellow fill, ink text; on the yellow band it becomes paper.
- **Ghost:** transparent, ink text.
- **Hover / Focus:** lifts 3px (160ms) with a color step (red darkens, yellow lightens, ghost goes Paper Shade); returns on active. Focus is a 3px outline, 3px offset, ink on light and yellow on dark grounds.
- **Inline booking link:** bold text with 3px red underline that turns blue on hover.

### Cards / Containers
- **Course card:** solid fill (red, yellow, blue, ink, paper), 3px ink border, Bevan numeral at top, bold title and short copy at the bottom, staircase heights.
- **Note, charity, aside cards:** paper fill, 3px ink border, 22-28px padding; charity logos sit in a white 2px-ink box.
- **Credentials panel:** Proof Red fill, white text, yellow square bullets.
- **Callout:** yellow fill, 3px border, italic semibold.
- **Facts:** 2px-ink bordered tags, 0.92rem semibold.

### Inputs / Fields
- White fill, 3px ink border, square, 12px 14px padding, inherits Source Serif. Focus uses the global 3px outline. Labels are 600 weight above the field.

### Navigation
- Sticky paper header with a 3px ink bottom rule. Brand is the three-shape mark plus Bevan name. Links are semibold with a transparent 3px bottom border that turns red on hover. A Menu button (3px ink border) opens a stacked list under 1000px; a header CTA appears from 1000px.

### Signature: The Proof Figure and Spine
- The hero figure is an SVG of red, blue and yellow squares on a white triangle, each shape scaling in from 0.82 with staggered 0.05 to 0.55s delays, captioned in Bevan. A 13px strip of the four Euclid colors sits above the header as the book's spine. Both are disabled under reduced motion.

### Accordion (FAQ)
- Ruled rows (3px bottom), bold 1.2rem question, a plus that rotates into a minus; question turns red on hover.

## Do's and Don'ts

### Do:
- **Do** fill surfaces with one flat Euclid color and separate them with 3px Ink rules.
- **Do** keep every corner at 0px.
- **Do** set headings, numerals and the brand name in Bevan and everything read in Source Serif 4.
- **Do** use red for the main action, yellow for the secondary action and highlights.
- **Do** keep focus outlines at 3px, yellow on dark grounds.
- **Do** honor reduced motion by removing placement, rise and lift animation.

### Don't:
- **Don't** add shadows, gradients, blur or translucent fills.
- **Don't** round corners or use pill shapes.
- **Don't** introduce colors beyond the four Euclid colors, paper and their listed pressed states.
- **Don't** set body copy in Bevan or bold/italicize Bevan.
- **Don't** fall back to the green-chalkboard-and-pills tutoring template.

## Not canonized (defects the build carries)

Small uppercase letter-spaced label lines exist on the brand tagline ("Virtual Private Math Tutor") and on the `Step` labels in the rates list. They are eyebrow-style devices and are not part of the system; new surfaces should not inherit them.
