---
AIGC:
    ContentProducer: Minimax Agent AI
    ContentPropagator: Minimax Agent AI
    Label: AIGC
    ProduceID: "00000000000000000000000000000000"
    PropagateID: "00000000000000000000000000000000"
    ReservedCode1: 304502205ac4989def16118737448cceb5561d1e5aceee00727824c4fb16539e97072c0e022100b19d3320460e341235753efba59c42ae09a3b78155ca8026edd09750e75e852a
    ReservedCode2: 304502206f0bb1916f43dccd8401ea5b728fdea35dc82d97c15909f1da57734316e56958022100e68d80e77c480d7acb86bda0149fdbab60eb03433828578eb6074003d3e163e9
---

# HUM Journal - Website Specification

## 1. Project Overview

**Project Name:** HUM Journal (Humanity & Thought Journal)
**Project Type:** Static Content Website
**Core Functionality:** An independent folk academic platform with two distinct publication streams
**Target Users:** Independent researchers, philosophy/humanities enthusiasts, public intellectuals

---

## 2. UI/UX Specification

### Layout Structure

- **Design Philosophy:** German Rationality (Bauhaus-inspired). Strict grid systems, negative space, typographic hierarchy.
- **Header:** Sticky minimalist. Logo left, Navigation center, Language toggle right.
- **Hero Section:** Large typographic hero with slogan.
- **Dual-Stream Layout:** Clear visual separation for HUM-Public and HUM-Academic.
- **Footer:** Copyright, slogan, contact info.

### Visual Design

**Color Palette:**
- Primary (Deep Blue): `#0A2342`
- Background: `#FFFFFF`
- Text Primary: `#111111`
- Text Secondary: `#4A5568`
- Accent/Lines: `#E5E5E5`
- Accent Blue Light: `#1E3A5F`

**Typography:**
- Headings: "Playfair Display", serif
- Body: "Inter", "Noto Sans SC", sans-serif
- Meta Data: "JetBrains Mono", monospace

**Visual Effects:**
- Border-radius: 0px (Sharp edges)
- Shadows: None (Use borders instead)
- Hover: Invert colors or underline

### Responsive Breakpoints
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

---

## 3. Page Specifications

### 3.1 Home (index.html)
- Hero with "HUM Journal" title
- Subtitle: "Humanity & Thought Journal"
- Slogan: "Freedom of Thought, Rational Expression"
- Two section cards: HUM-Public and HUM-Academic
- Brief mission statement

### 3.2 About Us (about.html)
- Title: "About Us" / "关于我们"
- Tribute to Pioneers section
- Journal Philosophy
- Team Section:
  - Editor-in-Chief: Kirk (柯尔克)
  - Initial Review Editor: Wither (枯萎)

### 3.3 Journal Introduction (introduction.html)
- English description of HUM-Public (scope, features)
- English description of HUM-Academic (scope, features)
- Clear differentiation between two streams

### 3.4 Submission Guidelines (submission.html)
- Submission email display (QQ email format)
- English title format: [HUM-Public/HUM-Academic] Article Title - Author Name
- File format requirements
- Processing timeline

### 3.5 Review Rules (review.html)
- Review scope (English): Only illegal, abusive, discriminatory, provocative content prohibited
- All other viewpoints allowed
- Review process timeline

---

## 4. Acceptance Criteria

- [ ] Website captures serious academic tone
- [ ] HUM-Public and HUM-Academic clearly distinguishable
- [ ] Team members (Kirk/Wither) prominently listed
- [ ] Slogan visible above fold on Home
- [ ] Submission email easy to find
- [ ] Strict 0px border-radius on all elements
- [ ] #0A2342 as dominant brand color
- [ ] English primary, Chinese secondary content
