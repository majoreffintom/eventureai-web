# EventureAI Project Overview

This is a Next.js project bootstrapped with `create-next-app`. It utilizes React for the frontend and appears to integrate with Supabase, as indicated by the `@supabase/supabase-js` dependency in `package.json`. This project is likely the core application for EventureAI.

## Building and Running

To get started with the project, use the following commands:

*   **Development Server:**
    ```bash
    npm run dev
    ```
    This will start the development server, usually accessible at [http://localhost:3000](http://localhost:3000).

*   **Build for Production:**
    ```bash
    npm run build
    ```
    This command compiles the application for production deployment.

*   **Start Production Server:**
    ```bash
    npm run start
    ```
    After building, this command starts the Next.js production server.

*   **Linting:**
    ```bash
    npm run lint
    ```
    This command runs ESLint to check for code quality and style issues.

## Development Conventions

*   **Linting:** The project uses ESLint configured with `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript` for code quality and consistency.
*   **Styling:** Tailwind CSS is used for styling, integrated via PostCSS.
*   **TypeScript:** The project is written in TypeScript, ensuring type safety and improved developer experience.
