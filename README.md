# Chronochart

This project contains the baseline scaffold for **Chronochart**, a web application for creating and visualizing timelines.

## Tech Stack

- [React](https://react.dev/) with [Vite](https://vitejs.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [React Router](https://reactrouter.com/)
- [Framer Motion](https://www.framer.com/motion/)

## Prerequisites

This project requires **Node.js** and **npm**. If you don't have them yet:

1. Visit <https://nodejs.org/> and download the recommended LTS installer for
   your operating system (macOS, Windows, or Linux).
2. Run the installer which includes npm by default.
3. Verify the installation with:

   ```bash
   node --version
   npm --version
   ```

You can also use a version manager such as
[`nvm`](https://github.com/nvm-sh/nvm) (Unix) or
[`nvm-windows`](https://github.com/coreybutler/nvm-windows) to manage multiple
Node.js versions.

## Development

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

To ensure everything works correctly you can run:

```bash
npm run lint   # check code style
npm run build  # create a production build
```

## Project Structure

- `src/components` – reusable UI components
- `src/pages` – application pages (`Home` and `Editor`)

## Notes

shadcn/ui integration requires running the `shadcn` CLI which fetches components from the internet. This environment blocks access to `ui.shadcn.com`, so the components are not included. You can run the CLI locally to add them.
