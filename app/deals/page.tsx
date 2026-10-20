import { getAllDeals } from '@/lib/queries';
import DealsList from './DealsList';

export const revalidate = 60;

export default async function DealsPage() {
  const deals = await getAllDeals();
  return <DealsList initialDeals={deals} />;
}