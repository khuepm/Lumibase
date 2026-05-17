import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
} from '@tanstack/react-router';
import { AppShell } from './components/app-shell';
import { AccessLayout } from './modules/access/layout';
import { PermissionMatrixPage } from './modules/access/permission-matrix';
import { PoliciesListPage } from './modules/access/policies-page';
import { PolicyDetailPage } from './modules/access/policy-detail';
import { RoleDetailPage } from './modules/access/role-detail';
import { RolesListPage } from './modules/access/roles-page';
import { TestSandboxPage } from './modules/access/test-sandbox';
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

const accessRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/access',
  component: () => (
    <AccessLayout>
      <Outlet />
    </AccessLayout>
  ),
});

const accessIndexRoute = createRoute({
  getParentRoute: () => accessRoute,
  path: '/',
  component: RolesListPage,
});

const accessRolesRoute = createRoute({
  getParentRoute: () => accessRoute,
  path: 'roles',
  component: RolesListPage,
});

const accessRoleDetailRoute = createRoute({
  getParentRoute: () => accessRoute,
  path: 'roles/$id',
  component: RoleDetailPage,
});

const accessPoliciesRoute = createRoute({
  getParentRoute: () => accessRoute,
  path: 'policies',
  component: PoliciesListPage,
});

const accessPolicyDetailRoute = createRoute({
  getParentRoute: () => accessRoute,
  path: 'policies/$id',
  component: PolicyDetailPage,
});

const accessMatrixRoute = createRoute({
  getParentRoute: () => accessRoute,
  path: 'matrix',
  component: PermissionMatrixPage,
});

const accessSandboxRoute = createRoute({
  getParentRoute: () => accessRoute,
  path: 'sandbox',
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
  accessRoute.addChildren([
    accessIndexRoute,
    accessRolesRoute,
    accessRoleDetailRoute,
    accessPoliciesRoute,
    accessPolicyDetailRoute,
    accessMatrixRoute,
    accessSandboxRoute,
  ]),
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
