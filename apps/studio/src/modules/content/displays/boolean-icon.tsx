import { Check, Minus, X } from 'lucide-react';
import type { DisplayComponent } from './types';

/** `boolean-icon` — green check / red X / dash for null. */
export const BooleanIconDisplay: DisplayComponent<boolean> = ({ value }) => {
  if (value === null || value === undefined)
    return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
  return value ? (
    <Check className="h-3.5 w-3.5 text-emerald-600" />
  ) : (
    <X className="h-3.5 w-3.5 text-destructive" />
  );
};
