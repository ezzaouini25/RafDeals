import { getAllOffers, getCategories } from '@/lib/queries';
import OffersList from './OffersList';

export const revalidate = 60;

export default async function OffersPage() {
  const [offers, categories] = await Promise.all([
    getAllOffers(),
    getCategories('offers'), // تأكد أن هذا يرجع مصفوفة
  ]);

  return <OffersList initialOffers={offers} categories={categories} />;
}