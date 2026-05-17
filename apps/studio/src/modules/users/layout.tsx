import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import type { ReactNode } from 'react';

export function UsersLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">{t('users_management', 'Users & Teams')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('users_management_desc', 'Manage users, assign roles, and group them into teams.')}
        </p>
      </header>

      <div className="flex gap-1 border-b">
        <Link
          to="/users"
          className="border-b-2 border-transparent px-4 py-2 text-sm font-medium transition-colors hover:border-muted-foreground/30 hover:text-foreground [&.active]:border-primary [&.active]:text-primary"
          activeOptions={{ exact: true }}
        >
          Users
        </Link>
        <Link
          to="/users/teams"
          className="border-b-2 border-transparent px-4 py-2 text-sm font-medium transition-colors hover:border-muted-foreground/30 hover:text-foreground [&.active]:border-primary [&.active]:text-primary"
        >
          Teams
        </Link>
      </div>

      <div className="pt-2">{children}</div>
    </div>
  );
}
