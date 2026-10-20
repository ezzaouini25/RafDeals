import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export default function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('animate-pulse bg-light-gray rounded', className)} />
  );
}

// Pre-built skeletons
export function OfferCardSkeleton() {
  return (
    <div className="bg-white border border-border-gray rounded-card overflow-hidden">
      <Skeleton className="aspect-[16/10] rounded-none" />
      <div className="p-5 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex justify-between pt-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-10 w-full rounded-btn" />
      </div>
    </div>
  );
}

export function BlogCardSkeleton() {
  return (
    <div className="bg-white border border-border-gray rounded-card overflow-hidden">
      <Skeleton className="aspect-[16/10] rounded-none" />
      <div className="p-5 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex gap-4 pt-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
}
