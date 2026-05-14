import { RouterProvider } from '@tanstack/react-router';
import { router } from './router';

/**
 * Root component. Hands off to TanStack Router; AppShell + active module
 * detection live inside the router tree.
 */
export function App() {
  return <RouterProvider router={router} />;
}
