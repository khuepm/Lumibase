/**
 * DocPage component — displays a single documentation page.
 * Placeholder: full implementation in task 7.1.
 */
import { useParams } from 'react-router-dom';

export function DocPage() {
  const { '*': slug } = useParams();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-foreground">
        Doc: {slug ?? 'unknown'}
      </h1>
      <p className="mt-2 text-muted-foreground">
        Content will be rendered here.
      </p>
    </div>
  );
}
