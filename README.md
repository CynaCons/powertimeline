# Chronochart

This project contains the baseline scaffold for **Chronochart**, a web application for creating and visualizing timelines.

## Tech Stack

- [React](https://react.dev/) with [Vite](https://vitejs.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [React Router](https://reactrouter.com/)
- [Framer Motion](https://www.framer.com/motion/)

## Development

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

## Project Structure

- `src/components` – reusable UI components
- `src/pages` – application pages (`Home` and `Editor`)

## Notes

shadcn/ui integration requires running the `shadcn` CLI which fetches components from the internet. This environment blocks access to `ui.shadcn.com`, so the components are not included. You can run the CLI locally to add them.
