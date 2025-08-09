# Chronochart

Chronochart is a modern web application for creating and visualizing timelines. This initial version establishes the React + TypeScript + Tailwind scaffold and includes a placeholder SVG timeline.

## Development

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

### Checks

```bash
npm run lint   # code style
npm run build  # production build
npm test       # smoke tests
```

The test suite uses [Playwright](https://playwright.dev/) for basic smoke
testing. The initial test verifies that the application loads and renders the
timeline.

## Project Structure

- `src/components/Timeline.tsx` – placeholder timeline rendered with SVG.
- `src/App.tsx` – mounts the timeline component.

The design uses a dark, space-themed palette inspired by galaxies and cosmic gradients.
