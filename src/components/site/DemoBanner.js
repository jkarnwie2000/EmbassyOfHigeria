import { AlertTriangle } from 'lucide-react';

export default function DemoBanner() {
  return (
    <div className="bg-amber-100 text-amber-950" role="note" aria-label="Demonstration notice">
      <div className="container-page flex items-start gap-2 py-2 text-sm">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <p>
          <strong>Demonstration website.</strong> The Republic of Higeria is a fictional country and this is not a real
          government website. Do not submit real personal information or payments.{' '}
          <a href="/disclaimer" className="font-semibold text-amber-950 underline">
            Learn more
          </a>
        </p>
      </div>
    </div>
  );
}
