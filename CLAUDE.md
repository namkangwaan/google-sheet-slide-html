# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md is the base guide (structure, commands, style, testing). This file adds only what you need beyond it.

## Commands

Use `pnpm` (`pnpm-lock.yaml`). There is no linter, formatter, or unit-test framework, so "tests" means:

- `pnpm build` — must pass after any change
- `pnpm check:practice` — asserts the 30 practice answers against workbook data; run after touching anything in the practice pipeline
- `pnpm practice:build` — regenerate practice outputs (see pipeline below); run `check:practice` right after
- `pnpm dev` — visual/interaction check (`.claude/launch.json` has a `dev` config on port 5173)

Git remote: `github.com/namkangwaan/google-sheet-slide-html` (private, branch `main`). `dist/` and `graphify-out/` are gitignored.

## Architecture

### Slide deck = static HTML + runtime rewrite

1. `index.html` holds the original slides as `<section class="slide-page" id="slide-N">` inside `#stage-container`, plus the chrome (footer nav, grid modal, help modal, toast).
2. `src/main.js` calls `initializeLessons()` from `src/lessons.js` **before** anything else reads the DOM.
3. `initializeLessons()`:
   - builds self-study slides with `page(id, title, level, lead, body)`. If `id` already exists (e.g. `slide-1`, `slide-57`, `slide-58`), it **replaces that slide's content**. Editing those slides in `index.html` has no visible effect.
   - re-appends every slide in the `order` array. That array is the real deck order. A slide missing from `order` stays wherever it was appended, so add every new slide to it.
   - wires the interactive parts: copy-formula buttons, the practice-answer picker (`#practice-task`) and the Classroom total checker.
4. `main.js` then collects `.slide-page`, derives the total and the position from the DOM, and syncs the URL hash to the slide **id** (`#lesson-setup`, `#slide-58`; a numeric hash `#12` maps to `slide-12`). IDs are public link targets, so never rename them. Reorder through `order` only.

Slide numbers in `index.html` (`slide-N`) do **not** match their position in the deck.

Navigation rules in `main.js`: keyboard shortcuts are ignored while focus is in an input/select/textarea/contenteditable. Next stops on the last slide (no wrap-around; a toast suggests `H`). `H`/`Home` goes to slide 1. `L`/`End` goes to the last slide.

Touch reading works like an ebook:
- The page follows the finger once a drag locks to the horizontal axis. On the tablet the stage is scaled, so the drag distance is divided by the stage scale.
- A page turns on a quick flick (≥50px within 800ms) or on a drag past 40% of the screen width. Otherwise it snaps back.
- The first and last pages resist the drag.
- `showSlide()` adds `page-turn-next`/`page-turn-prev`, and the CSS runs it only under `(pointer: coarse)`.
- On touch devices, `.swipe-hint` arrows blink at the screen edges: `#swipe-hint-prev` («, left) hides on the first slide and `#swipe-hint` (», right) hides on the last. They share one animation, and `--hint-nudge` sets the nudge direction. They are `<button>`s that call `prevSlide()`/`nextSlide()`, with a 44px tap area around a 30px visible circle. A touch that starts on them never counts as a swipe. After `SWIPE_HINT_IDLE_MS` (5s) with no touch, scroll, or slide change, `body.swipe-hints-idle` fades them out and turns off their pointer events so taps reach the content underneath. See `wakeSwipeHints()`.

A swipe is ignored when it starts in the 24px edge zones (the iOS/Android back gesture), when it's a pinch or the page is zoomed in, when it's mostly vertical, or when it starts inside a table that scrolls sideways.

Motion is off on e-ink screens (`(update: slow)`) and with `prefers-reduced-motion`: pages change instantly and the hint doesn't blink. See `prefersStillPages()`. The inline `onclick="..."` handlers in `index.html` rely on functions exported on `window` at the bottom of `main.js`, so keep those exports when refactoring.

Rendering: slides are designed at 1280×720 and scaled to fit, but mobile widths switch to a scrolling reading layout (`src/style.css`). Check both.

### Practice pipeline (single source of truth: `src/practice-answers.json`)

`practice-answers.json` maps a task ID (`HR-01`…) to `[formula, Thai explanation]`. `generate-excel.cjs` reads it and writes three outputs:

- `public/Google_Sheets_Mastery_Practice.xlsx` — sheets `Start_Here`, `Classroom`, `HR_Roster`, `Sales_Data`, `Regex_Data`, `Assignments`. The data sheets have a title/description block, so **data rows start at row 5**. Learner answer cells (`Assignments` column E) must stay blank.
- `src/practice-tasks.json` — task ID → answer cell, prompt text and expected value. The web answer picker reads it.
- `public/answer_key.gs` — only the `var answers = {...};` block is regex-replaced. The rest of the Apps Script is hand-maintained.

`scripts/verify-practice.cjs` recomputes the expected values in JS from the xlsx rows and checks that the three outputs agree. It never executes formulas in Google Sheets, so say so when reporting results.

Never hand-edit `practice-tasks.json` or the `answers` block in `answer_key.gs`. Change the JSON or the generator, then run `pnpm practice:build && pnpm check:practice`.

## Content conventions

- The audience is beginner Thai learners studying on their own. Write lesson text in Thai and keep function names in English.
- Every new topic slide needs an activity or comprehension check. Use the `activity()`, `questions()` and `reveal()` helpers in `lessons.js`, and put the reasoning in the answer.
- The improvement plan and its verification log are in `docs/teaching-improvement-plan.md`. Update its "บันทึกผล" section when you verify changes.
- `.agents/rules/evaluate-skills-first.md` asks you to check whether an installed skill fits the task (e.g. `xlsx` for workbook work) before starting.
- Ignore `dist/` and `graphify-out/` (generated).
