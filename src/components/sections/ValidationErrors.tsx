import { AlertCircle } from 'lucide-react';

interface ValidationErrorsProps {
  errors: Record<string, string>;
  className?: string;
}

export default function ValidationErrors({ errors, className = '' }: ValidationErrorsProps) {
  const errorEntries = Object.entries(errors);

  if (errorEntries.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-2 p-3 bg-saida/10 border border-saida/30 rounded-lg ${className}`}>
      {errorEntries.map(([field, message]) => (
        <div key={field} className="flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-saida shrink-0 mt-0.5" />
          <span className="text-sm text-saida">{message}</span>
        </div>
      ))}
    </div>
  );
}
