# Chronochart

Chronochart is a modern web application for creating and visualizing timelines. 

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

