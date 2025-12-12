// components/ui/atoms/RouteLoading.tsx
import { Spinner } from './spinner';

export function RouteLoading({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <Spinner size="lg" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}


