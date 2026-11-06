import { Skeleton } from '@ui/skeleton';
import { cn } from '@/lib/utils';
import content from '../content.json';

export function ListSkeleton({ rows = 4, className }: SkeletonListProps) {
  return (
    <div aria-busy='true' aria-label={content.loading.label} className={cn('divide-border divide-y rounded-2xl border', className)}>
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className='flex items-center gap-3 px-4 py-3.5'>
          <Skeleton className='size-9 rounded-xl' />
          <div className='flex flex-1 flex-col gap-2'>
            <Skeleton className='h-3.5 w-2/5' />
            <Skeleton className='h-3 w-3/5' />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, columns = 4, className }: TableSkeletonProps) {
  return (
    <div aria-busy='true' aria-label={content.loading.label} className={cn('flex flex-col gap-3 rounded-2xl border p-4', className)}>
      <Skeleton className='h-4 w-full max-w-xs' />
      {Array.from({ length: rows }, (_, rowIndex) => (
        <div key={rowIndex} className='grid gap-4' style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {Array.from({ length: columns }, (_, columnIndex) => (
            <Skeleton key={columnIndex} className='h-8' />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardGridSkeleton({ cards = 6, className }: CardGridSkeletonProps) {
  return (
    <div aria-busy='true' aria-label={content.loading.label} className={cn('grid gap-4 sm:grid-cols-2 xl:grid-cols-3', className)}>
      {Array.from({ length: cards }, (_, index) => (
        <div key={index} className='flex flex-col gap-4 rounded-2xl border p-5'>
          <div className='flex items-center gap-3'>
            <Skeleton className='size-10 rounded-xl' />
            <div className='flex flex-1 flex-col gap-2'>
              <Skeleton className='h-3.5 w-1/2' />
              <Skeleton className='h-3 w-1/3' />
            </div>
          </div>
          <Skeleton className='h-3 w-4/5' />
          <Skeleton className='h-5 w-24 rounded-full' />
        </div>
      ))}
    </div>
  );
}

interface SkeletonListProps {
  rows?: number;
  className?: string;
}

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  className?: string;
}

interface CardGridSkeletonProps {
  cards?: number;
  className?: string;
}
