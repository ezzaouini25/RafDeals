import { getAllDeals, getCategories } from '@/lib/queries';
import DealsList from './DealsList';

export const revalidate = 60;

export default async function DealsPage() {
  const [deals, categories] = await Promise.all([
    getAllDeals(),
    getCategories('deals'),
  ]);

  return <DealsList initialDeals={deals} categories={categories} />;
}