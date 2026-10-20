import Footer from './Footer';
import { getAllLegalPageSlugs } from '@/lib/queries';

export default async function FooterWrapper() {
  // ✅ Fetch legal pages on the server
  const legalPages = await getAllLegalPageSlugs();

  // ✅ Pass data to Footer (Client Component)
  return <Footer legalPages={legalPages} />;
}