import FAQItem from './FAQItem';
import { MessageSquare } from 'lucide-react';

interface FAQ {
  id: number;
  question: string;
  answer: string;
}

export default async function FAQSection() {
  const faqs: FAQ[] = [
    {
      id: 1,
      question: "What is RafDeals and how does it work?",
      answer: "RafDeals is a curated deals site that brings together the best offers and promotions from Impact and ClickBank. We list things like bank bonuses, cashback apps, pet food discounts, beauty deals, home essentials, and travel promos. Instead of hunting across dozens of websites, you can browse everything in one place and click straight through to the brand's site to claim the offer."
    },
    {
      id: 2,
      question: "What kind of deals do you feature?",
      answer: "A bit of everything, honestly. We list bank bonuses, cashback apps, pet food discounts, beauty deals, home essentials, car offers, travel promos, and plenty of other categories. Most of our offers come from Impact and ClickBank, so you are getting them straight from the brands themselves. If it helps you save money or earn a reward, we probably have something for it."
    },
    {
      id: 3,
      question: "How do I find the best offers on the site?",
      answer: "Start by browsing the categories that interest you most, like finance, pets, beauty, or travel. We also highlight a hand-picked selection of the best deals on the homepage each day, so you can see the top offers at a glance. If you are looking for a specific type of deal, use the search bar or filter by region to narrow things down quickly."
    },
    {
      id: 4,
      question: "Do I have to pay to use the site?",
      answer: "No, using RafDeals is completely free. We earn a small commission from the merchant when someone claims an offer through our links, and that is what keeps the lights on. You never pay us a fee, a subscription, or a hidden cost to browse and claim deals."
    },
    {
      id: 5,
      question: "How do I actually claim a deal?",
      answer: "Click the offer you like, read the short instructions we put on the page, then complete the steps on the merchant's website. That could mean signing up, downloading an app, or making a qualifying purchase. Whatever the brand asks for, we spell it out clearly before you click so there are no surprises."
    },
    {
      id: 6,
      question: "How often do you add new offers?",
      answer: "Every day, pretty much. We update RafDeals daily because some promotions expire fast, so we are constantly swapping them out and adding fresh ones to the site. If you check back once a week, you will almost always find something new to claim, whether it is a bank bonus or a pet discount."
    },
    {
      id: 7,
      question: "Are these deals available in my country?",
      answer: "Most offers are available in the US, UK, or Australia, and a few are global. We put a small label on each offer telling you which region it is for, so you know before you click. If you see an offer that is not available in your country, just skip it and check the rest of the feed."
    },
    {
      id: 8,
      question: "What happens to my personal info when I sign up?",
      answer: "RafDeals does not touch your data at all. When you click an offer, you are redirected to the merchant's secure website, and they handle your information from that point on. We only partner with brands that have a solid reputation and clear privacy policies, so your details stay in safe hands throughout the signup process."
    },
    {
      id: 9,
      question: "Some offers ask for a deposit. Is that normal?",
      answer: "Sometimes, yes, especially with banks and finance offers that require a small deposit to open an account. We always mention it in the offer description so you are not caught off guard. If an offer is free to claim with no deposit needed, we say that too, so you know exactly what you are getting into."
    },
    {
      id: 10,
      question: "Can I trust the brands you list?",
      answer: "We only work with merchants we can verify. Before an offer goes live, we check the brand's track record, read user reviews, and confirm that their payout or discount process actually works. If a merchant has a history of complaints or shady behavior, they do not make it onto the site."
    },
    {
      id: 11,
      question: "How do I search for a specific deal, like pet food or bank bonuses?",
      answer: "Use the search bar at the top of the site or click into the category that matches what you need, like Pets, Finance, or Beauty. Each category page shows every active offer in that section, sorted by popularity or newest first. If you still cannot find what you are looking for, check back later since we add new deals daily and rotate them out often."
    }
  ];

  return (
    <section className="bg-light-gray py-20 md:py-28">
      <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-start">
          
          {/* Left Column - Sticky Header */}
          <div className="lg:col-span-4 lg:sticky lg:top-24">
            <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 border-2 border-navy text-navy font-bold text-xs uppercase tracking-widest mb-6">
                <MessageSquare size={14} />
                Got Questions?
              </div>
              
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-navy tracking-tight leading-[1.1] mb-4 uppercase">
                Frequently <br className="hidden lg:block" />
                Asked <br className="hidden lg:block" />
                Questions
              </h2>
              
              <p className="text-gray-text text-base leading-relaxed max-w-md lg:max-w-none">
                Everything you need to know about our verified online offers, exclusive deals, and how RafDeals helps you save money safely.
              </p>
              
              <div className="mt-8 w-full h-1 bg-navy hidden lg:block" />
            </div>
          </div>

          {/* Right Column - Accordions */}
          <div className="lg:col-span-8 flex flex-col gap-3">
            {faqs.map((faq) => (
              <FAQItem key={faq.id} faq={faq} />
            ))}
          </div>

        </div>

      </div>
    </section>
  );
}