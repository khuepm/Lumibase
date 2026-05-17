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
import { FilesPage } from './modules/files';
import { DeveloperTypesPage } from './modules/settings/types-page';
import { TranslationsPage } from './modules/translations';
import { WebhooksPage } from './modules/settings/webhooks-page';
import { ActivityPage } from './modules/settings/activity-page';
import { ExtensionsPage } from './modules/settings/extensions-page';
import { UsersLayout } from './modules/users/layout';
import { TeamsPage } from './modules/users/teams-page';
import { UsersPage } from './modules/users/users-page';

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

const filesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/files',
  component: () => (
    <div className="p-6">
      <FilesPage />
    </div>
  ),
});

const settingsTypesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings/developer/types',
  component: DeveloperTypesPage,
});

const translationsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings/translations',
  component: TranslationsPage,
});

const webhooksRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings/webhooks',
  component: WebhooksPage,
});

const activityRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings/activity',
  component: ActivityPage,
});

const extensionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings/extensions',
  component: ExtensionsPage,
});

const usersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/users',
  component: () => (
    <UsersLayout>
      <Outlet />
    </UsersLayout>
  ),
});

const usersIndexRoute = createRoute({
  getParentRoute: () => usersRoute,
  path: '/',
  component: UsersPage,
});

const usersTeamsRoute = createRoute({
  getParentRoute: () => usersRoute,
  path: '/teams',
  component: TeamsPage,
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
  filesRoute,
  settingsTypesRoute,
  translationsRoute,
  webhooksRoute,
  activityRoute,
  extensionsRoute,
  usersRoute.addChildren([usersIndexRoute, usersTeamsRoute]),
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
