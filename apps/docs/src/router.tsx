import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { DocPage } from './pages/DocPage';
import { NotFoundPage } from './pages/NotFoundPage';

/**
 * Application router using React Router v7 (library mode).
 * Uses HTML5 History API (createBrowserRouter) — no hash fragments.
 *
 * Routes:
 * - /              → Redirect to /docs/README
 * - /docs/:slug*   → DocPage component (inside Layout shell)
 * - *              → NotFoundPage (404)
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/docs/README" replace />,
  },
  {
    element: <Layout />,
    children: [
      {
        path: '/docs/*',
        element: <DocPage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);
