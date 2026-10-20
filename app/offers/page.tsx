import { getAllOffers } from '@/lib/queries';
import OffersList from './OffersList';

export const revalidate = 60;

export default async function OffersPage() {
  const offers = await getAllOffers();
  return <OffersList initialOffers={offers} />;
}