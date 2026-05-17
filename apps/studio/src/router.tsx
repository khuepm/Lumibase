import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  redirect,
} from '@tanstack/react-router';
import { AppShell } from './components/app-shell';
import { ContentIndexPage } from './modules/content/index-page';
import { ItemDetailPage } from './modules/content/item-detail';
import { ItemsListPage } from './modules/content/items-list';
import { CollectionsListPage } from './modules/data-model/list';
import { CollectionDetailPage } from './modules/data-model/detail';
import { CollectionWizardPage } from './modules/data-model/wizard';
import { DeveloperTypesPage } from './modules/settings/types-page';
import { RolesPage } from './modules/access/roles-page';
import { PoliciesPage } from './modules/access/policies-page';
import { TestSandboxPage } from './modules/access/test-sandbox';

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

// ---------- Access Control routes ----------

const accessIndexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/access',
  beforeLoad: () => { throw redirect({ to: '/access/roles' }); },
});

const accessRolesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/access/roles',
  component: RolesPage,
});

const accessPoliciesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/access/policies',
  component: PoliciesPage,
});

const accessSandboxRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/access/sandbox',
  component: TestSandboxPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  contentCollectionRoute,
  contentItemRoute,
  dataModelRoute,
  dataModelNewRoute,
  dataModelDetailRoute,
  settingsTypesRoute,
  accessIndexRoute,
  accessRolesRoute,
  accessPoliciesRoute,
  accessSandboxRoute,
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
