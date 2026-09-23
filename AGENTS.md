# Repository Guidelines

## Project Structure & Module Organization

This Vite project teaches Google Sheets. `index.html` contains the original slides; `src/lessons.js` adds self-study content and orders the deck. `src/main.js` controls navigation; `src/style.css` defines Tailwind layers and responsive styles. Practice answers and generated task metadata live in `src/practice-*.json`. Downloads live in `public/`. `generate-excel.cjs` builds the practice workbook; `scripts/verify-practice.cjs` checks it. `dist/` is build output; `graphify-out/` contains analysis artifacts.

## Build, Test, and Development Commands

Use `pnpm` because the repository includes `pnpm-lock.yaml`.

- `pnpm install` installs the locked dependencies.
- `pnpm dev` starts the Vite development server.
- `pnpm build` creates the production site in `dist/`.
- `pnpm preview` serves that build locally for a final check.
- `pnpm validate` currently runs the same Vite build as `pnpm build`.
- `pnpm practice:build` regenerates the practice workbook, task metadata, and Apps Script answers from the generator and `src/practice-answers.json`.
- `pnpm check:practice` verifies the 30 expected answers against workbook data, row references, and the shared answer key.

## Coding Style & Naming Conventions

Follow the existing two-space indentation in HTML, JavaScript, CSS, and configuration files. Use ES modules for app code and `.cjs` only for the existing Node utilities. Name JavaScript variables and functions in `camelCase`, constants in `UPPER_SNAKE_CASE`, and CSS classes in `kebab-case`. Prefer Tailwind utilities in slide markup; put shared or complex presentation rules in `src/style.css`. No formatter or linter is configured, so keep edits consistent with nearby code and avoid unrelated reformatting.

## Testing Guidelines

There is no test framework or coverage target. Run `pnpm build` after changes and `pnpm check:practice` for practice content. These local data checks do not execute formulas in Google Sheets. Check affected slides in `pnpm dev` or `pnpm preview`, including keyboard controls, slide links, fullscreen/theater mode, mobile reading, answer disclosures, and downloads. Keep slide IDs stable when reordering lessons in `src/lessons.js`.

## Commit & Pull Request Guidelines

This workspace has no accessible Git history, so no existing commit-message convention can be verified. Use short, imperative subjects that identify the change, such as `Fix slide navigation at deck bounds`. Pull requests should describe the affected slides or controls, include the verification performed, link a related issue when one exists, and provide screenshots for visible changes. Keep generated output separate from source changes.
