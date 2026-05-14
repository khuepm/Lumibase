import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
} from '@tanstack/react-router';
import { AppShell } from './components/app-shell';
import { ContentIndexPage } from './modules/content/index-page';
import { ItemDetailPage } from './modules/content/item-detail';
import { ItemsListPage } from './modules/content/items-list';
import { CollectionsListPage } from './modules/data-model/list';
import { CollectionDetailPage } from './modules/data-model/detail';
import { CollectionWizardPage } from './modules/data-model/wizard';
import { DeveloperTypesPage } from './modules/settings/types-page';

const rootRoute = createRootRoute({
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: ContentIndexPage,
});

const contentCollectionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/content/$collection',
  component: ItemsListPage,
});

const contentItemRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/content/$collection/$id',
  component: ItemDetailPage,
});

const dataModelRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/data-model',
  component: CollectionsListPage,
});

const dataModelNewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/data-model/new',
  component: CollectionWizardPage,
});

const dataModelDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/data-model/$name',
  component: CollectionDetailPage,
});
const settingsTypesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings/developer/types',
  component: DeveloperTypesPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  contentCollectionRoute,
  contentItemRoute,
  dataModelRoute,
  dataModelNewRoute,
  dataModelDetailRoute,
  settingsTypesRoute,
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
