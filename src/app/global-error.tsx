'use client';

import './globals.css';

// catches errors thrown by the root layout itself (it reads the session
// profile on every request), which app/error.tsx can't, since it renders inside it
export default function GlobalError({ reset }: GlobalErrorProps) {
  function handleRetryClick() {
    reset();
  }

  return (
    <html lang='en'>
      <body>
        <main className='flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center'>
          <h1 className='text-3xl font-semibold tracking-tight'>Something went wrong</h1>
          <p className='text-muted-foreground text-sm'>We couldn&apos;t load the app. Try again in a moment.</p>
          <button className='rounded-md border px-4 py-2 text-sm' type='button' onClick={handleRetryClick}>
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}
