import { CardGridSkeleton } from '@components/common/loading-state/skeletons';
import { Skeleton } from '@ui/skeleton';

export default function AppLoading() {
  return (
    <div className='flex flex-col gap-8'>
      <div className='flex flex-col gap-2'>
        <Skeleton className='h-8 w-48' />
        <Skeleton className='h-4 w-72' />
      </div>
      <CardGridSkeleton cards={3} />
    </div>
  );
}
