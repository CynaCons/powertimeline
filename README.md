# Chronochart

Chronochart is a modern web application for creating and visualizing timelines. 

## Documentation

- Software Requirements Specification (SRS): see `docs/SRS.md` for the table-format requirements with traceability to code and tests.

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

