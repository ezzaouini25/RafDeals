import React from 'react';
import Link from 'next/link';
import { 
  ChevronRight, ArrowLeft, MessageCircle, Search, Gift, Shield, Clock, 
  Zap, BookOpen, Filter, FileText, MousePointerClick, Wallet, HelpCircle,
  Check, LayoutGrid, Handshake
} from 'lucide-react';

export const metadata = {
  title: 'How to Find and Claim Deals | RafDeals',
  description: 'Learn how to navigate RafDeals, find verified online offers, and claim exclusive deals safely. A complete step-by-step guide for our community.',
};

export default function GuidePage() {
  return (
    <div className="bg-white min-h-screen">
      
      {/* ============================================================
          BREADCRUMB
          ============================================================ */}
      <div className="bg-light-gray border-b border-border-gray py-4">
        <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-text">
            <Link href="/" className="hover:text-navy transition-colors font-medium">Home</Link>
            <ChevronRight size={14} className="text-gray-text/40" />
            <span className="text-navy font-bold">How It Works</span>
          </div>
        </div>
      </div>

      {/* ============================================================
          HERO
          ============================================================ */}
      <div className="bg-navy pt-20 pb-16 border-b border-border-gray/20">
        <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-yellow/30 bg-yellow/10 text-yellow font-bold text-xs uppercase tracking-widest mb-6 rounded-none">
              <BookOpen size={14} />
              Step-by-Step Guide
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight uppercase leading-[1.1]">
              How to Find & Claim <br className="hidden sm:block" />
              <span className="text-yellow">Exclusive Deals</span>
            </h1>
            <p className="text-white/70 text-base sm:text-lg mt-6 max-w-2xl leading-relaxed">
              Navigating RafDeals is simple. Follow this guide to discover verified online offers, understand the terms, and claim your deals with total confidence.
            </p>
            <div className="flex flex-wrap items-center gap-4 mt-8">
              <a
                href="#steps"
                className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-yellow text-navy font-black text-sm uppercase tracking-wide border border-yellow hover:bg-yellow-hover transition-colors rounded-none"
              >
                Start Reading
                <ArrowLeft size={16} className="rotate-180" />
              </a>
              <Link
                href="/offers"
                className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-transparent border border-white/30 text-white font-black text-sm uppercase tracking-wide hover:bg-white/10 transition-colors rounded-none"
              >
                Browse Offers
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================
          MAIN CONTENT
          ============================================================ */}
      <div className="py-16 md:py-24 bg-white">
        <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
            
            {/* LEFT COLUMN - MAIN CONTENT */}
            <div className="lg:col-span-8">
              
              {/* INTRO SECTION */}
              <div className="mb-12">
                <h2 className="text-2xl sm:text-3xl font-black text-navy uppercase tracking-tight mb-4 flex items-center gap-3">
                  <LayoutGrid size={24} className="text-yellow" />
                  What is RafDeals?
                </h2>
                <p className="text-gray-text text-base sm:text-lg leading-relaxed mb-4">
                  RafDeals is a curated platform that brings together high-value online offers and exclusive deals. We partner with trusted brands to bring you real promotions directly from the source.
                </p>
                <p className="text-gray-text text-base sm:text-lg leading-relaxed">
                  Whether you are looking for sign-up bonuses, welcome offers, or specific product discounts, we organize everything in one place. We do the heavy lifting of checking the terms and verifying the brands, so you can just click, claim, and enjoy the value. Our platform is built on trust and transparency, ensuring you never waste time on fake promos or dead links.
                </p>
              </div>

              {/* STEPS CONTAINER */}
              <div id="steps" className="space-y-12">
                
                {/* STEP 1 */}
                <div className="relative">
                  <div className="flex items-start gap-6">
                    <div className="flex items-center justify-center w-12 h-12 bg-navy text-yellow font-black text-xl border border-navy shrink-0 rounded-none">
                      1
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl sm:text-2xl font-bold text-navy flex items-center gap-3 mb-3 uppercase tracking-tight">
                        <Filter size={24} className="text-yellow" />
                        Browse & Filter the Right Offers
                      </h3>
                      <p className="text-gray-text text-base leading-relaxed mb-4">
                        Head over to our <Link href="/offers" className="text-navy font-bold underline decoration-yellow decoration-2 underline-offset-4 hover:text-yellow-hover">Offers page</Link> or <Link href="/deals" className="text-navy font-bold underline decoration-yellow decoration-2 underline-offset-4 hover:text-yellow-hover">Deals page</Link>. We have categorized every promotion so you can easily find what fits your needs. Use the filters to narrow down your options by category, brand, or region.
                      </p>
                      
                      {/* LIST DESIGN FROM ABOUT US */}
                      <div className="grid grid-cols-1 gap-3">
                        {[
                          'Use category filters to find specific types of offers (e.g., Finance, Lifestyle).',
                          'Check the offer details, including the exact reward or discount amount.',
                          'Filter by region to ensure the offer is available in your country.',
                        ].map((item, idx) => (
                          <div key={idx} className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-5 h-5 mt-0.5 bg-yellow flex items-center justify-center rounded-none">
                              <Check className="w-3.5 h-3.5 text-navy stroke-[3]" />
                            </div>
                            <span className="text-sm text-gray-text font-medium">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* STEP 2 */}
                <div className="relative">
                  <div className="flex items-start gap-6">
                    <div className="flex items-center justify-center w-12 h-12 bg-navy text-yellow font-black text-xl border border-navy shrink-0 rounded-none">
                      2
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl sm:text-2xl font-bold text-navy flex items-center gap-3 mb-3 uppercase tracking-tight">
                        <FileText size={24} className="text-yellow" />
                        Read the Terms Carefully
                      </h3>
                      <p className="text-gray-text text-base leading-relaxed mb-4">
                        Before you claim anything, take a minute to read the full description we provide on the offer page. We outline exactly what the merchant requires so there are no surprises. Some offers require a minimum deposit or a specific action to unlock the reward.
                      </p>
                      
                      {/* LIST DESIGN FROM ABOUT US */}
                      <div className="grid grid-cols-1 gap-3">
                        {[
                          'Understand the requirements (e.g., minimum deposit, first purchase).',
                          'Note the time commitment or any expiry dates for the promotion.',
                          'We clearly state if an offer is free to claim or requires a purchase.',
                        ].map((item, idx) => (
                          <div key={idx} className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-5 h-5 mt-0.5 bg-yellow flex items-center justify-center rounded-none">
                              <Check className="w-3.5 h-3.5 text-navy stroke-[3]" />
                            </div>
                            <span className="text-sm text-gray-text font-medium">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* STEP 3 */}
                <div className="relative">
                  <div className="flex items-start gap-6">
                    <div className="flex items-center justify-center w-12 h-12 bg-navy text-yellow font-black text-xl border border-navy shrink-0 rounded-none">
                      3
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl sm:text-2xl font-bold text-navy flex items-center gap-3 mb-3 uppercase tracking-tight">
                        <MousePointerClick size={24} className="text-yellow" />
                        Claim the Offer
                      </h3>
                      <p className="text-gray-text text-base leading-relaxed mb-4">
                        Click the <strong>"Claim Offer"</strong> button on our page. This will securely redirect you to the merchant's official website. We only link to trusted brands, so you can complete the signup or purchase with peace of mind.
                      </p>
                      
                      {/* LIST DESIGN FROM ABOUT US */}
                      <div className="grid grid-cols-1 gap-3">
                        {[
                          'Complete the required actions directly on the merchant site.',
                          'Confirm your signup, deposit, or purchase to trigger the reward.',
                          'Keep any confirmation emails or receipts for your records.',
                        ].map((item, idx) => (
                          <div key={idx} className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-5 h-5 mt-0.5 bg-yellow flex items-center justify-center rounded-none">
                              <Check className="w-3.5 h-3.5 text-navy stroke-[3]" />
                            </div>
                            <span className="text-sm text-gray-text font-medium">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* STEP 4 */}
                <div className="relative">
                  <div className="flex items-start gap-6">
                    <div className="flex items-center justify-center w-12 h-12 bg-navy text-yellow font-black text-xl border border-navy shrink-0 rounded-none">
                      4
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl sm:text-2xl font-bold text-navy flex items-center gap-3 mb-3 uppercase tracking-tight">
                        <Wallet size={24} className="text-yellow" />
                        Enjoy Your Reward
                      </h3>
                      <p className="text-gray-text text-base leading-relaxed mb-4">
                        Once the merchant confirms your action, you will receive the benefit directly from them. This could be a cash bonus, a discount on your order, or a reward added to your account. You do not need to wait for us to pay you—the merchant handles it directly.
                      </p>
                      
                      {/* LIST DESIGN FROM ABOUT US */}
                      <div className="grid grid-cols-1 gap-3">
                        {[
                          'Receive your cash bonus, discount, or reward directly from the brand.',
                          'Track your total savings and rewards over time.',
                          'Enjoy the value without any hidden fees or confusing steps.',
                        ].map((item, idx) => (
                          <div key={idx} className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-5 h-5 mt-0.5 bg-yellow flex items-center justify-center rounded-none">
                              <Check className="w-3.5 h-3.5 text-navy stroke-[3]" />
                            </div>
                            <span className="text-sm text-gray-text font-medium">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* STEP 5 */}
                <div className="relative">
                  <div className="flex items-start gap-6">
                    <div className="flex items-center justify-center w-12 h-12 bg-navy text-yellow font-black text-xl border border-navy shrink-0 rounded-none">
                      5
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl sm:text-2xl font-bold text-navy flex items-center gap-3 mb-3 uppercase tracking-tight">
                        <HelpCircle size={24} className="text-yellow" />
                        Contact Us If You Need Help
                      </h3>
                      <p className="text-gray-text text-base leading-relaxed mb-4">
                        If you run into an issue or have a question, do not worry. Our support team is here to help you resolve any problems so you can get your deal. We can help clarify terms, guide you through the process, or contact the merchant on your behalf if needed.
                      </p>
                      
                      {/* LIST DESIGN FROM ABOUT US */}
                      <div className="grid grid-cols-1 gap-3">
                        {[
                          'Report any problems you face with an offer or the merchant.',
                          'We will guide you through the process and help you fix the issue.',
                          'Our goal is to ensure you get the value you came for.',
                        ].map((item, idx) => (
                          <div key={idx} className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-5 h-5 mt-0.5 bg-yellow flex items-center justify-center rounded-none">
                              <Check className="w-3.5 h-3.5 text-navy stroke-[3]" />
                            </div>
                            <span className="text-sm text-gray-text font-medium">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ============================================================
                  QUICK TIPS
                  ============================================================ */}
              <div className="mt-20 border-t border-border-gray pt-12">
                <h2 className="text-2xl font-black text-navy uppercase tracking-tight flex items-center gap-3 mb-6">
                  <Zap size={24} className="text-yellow" />
                  Quick Tips for Better Results
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="border-2 border-border-gray p-6 rounded-none hover:border-navy transition-colors">
                    <div className="w-10 h-10 bg-navy text-yellow flex items-center justify-center rounded-none mb-4">
                      <Search size={20} />
                    </div>
                    <h4 className="font-bold text-navy text-lg mb-2">Check the Details</h4>
                    <p className="text-sm text-gray-text leading-relaxed">Always read the offer description and terms before you claim. We spell them out to protect you.</p>
                  </div>
                  <div className="border-2 border-border-gray p-6 rounded-none hover:border-navy transition-colors">
                    <div className="w-10 h-10 bg-navy text-yellow flex items-center justify-center rounded-none mb-4">
                      <Clock size={20} />
                    </div>
                    <h4 className="font-bold text-navy text-lg mb-2">Be Patient</h4>
                    <p className="text-sm text-gray-text leading-relaxed">Some offers take time to process. Follow the steps and wait for the merchant to confirm.</p>
                  </div>
                  <div className="border-2 border-border-gray p-6 rounded-none hover:border-navy transition-colors">
                    <div className="w-10 h-10 bg-navy text-yellow flex items-center justify-center rounded-none mb-4">
                      <Shield size={20} />
                    </div>
                    <h4 className="font-bold text-navy text-lg mb-2">Stay Safe</h4>
                    <p className="text-sm text-gray-text leading-relaxed">Never pay to claim an offer. Every verified offer on RafDeals is free to browse and claim.</p>
                  </div>
                  <div className="border-2 border-border-gray p-6 rounded-none hover:border-navy transition-colors">
                    <div className="w-10 h-10 bg-navy text-yellow flex items-center justify-center rounded-none mb-4">
                      <MessageCircle size={20} />
                    </div>
                    <h4 className="font-bold text-navy text-lg mb-2">Ask for Help</h4>
                    <p className="text-sm text-gray-text leading-relaxed">Contact us if you face any problems. We are here to help you get the value you came for.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ============================================================
                RIGHT COLUMN - SIDEBAR
                ============================================================ */}
            <div className="lg:col-span-4">
              <div className="sticky top-24 space-y-6">
                
                {/* Quick Steps Box */}
                <div className="bg-light-gray border-2 border-border-gray p-6 rounded-none">
                  <h3 className="font-black text-navy text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                    <BookOpen size={16} className="text-yellow" />
                    Guide Summary
                  </h3>
                  <div className="space-y-3">
                    {[
                      'Browse & Filter Offers',
                      'Read Terms Carefully',
                      'Claim & Follow Instructions',
                      'Enjoy Your Reward',
                      'Contact Us for Help'
                    ].map((step, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-navy text-yellow font-bold flex items-center justify-center text-xs shrink-0 rounded-none">
                          {idx + 1}
                        </div>
                        <span className="text-sm font-medium text-navy">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Links Box */}
                <div className="bg-white border-2 border-border-gray p-6 rounded-none">
                  <h3 className="font-black text-navy text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Gift size={16} className="text-yellow" />
                    Ready to Start?
                  </h3>
                  <div className="space-y-3 flex flex-col">
                    <Link 
                      href="/offers" 
                      className="flex items-center justify-between w-full p-3 bg-navy text-white text-sm font-bold hover:bg-navy/90 transition-colors rounded-none"
                    >
                      Browse Offers
                      <ChevronRight size={16} />
                    </Link>
                    <Link 
                      href="/deals" 
                      className="flex items-center justify-between w-full p-3 bg-yellow text-navy text-sm font-bold hover:bg-yellow-hover transition-colors rounded-none"
                    >
                      Explore Deals
                      <ChevronRight size={16} />
                    </Link>
                  </div>
                </div>

                {/* Contact Support Box */}
                <div className="bg-navy border-2 border-navy p-6 rounded-none">
                  <h3 className="font-black text-white text-sm uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Handshake size={16} className="text-yellow" />
                    Need Help?
                  </h3>
                  <p className="text-xs text-white/70 mb-4 leading-relaxed">
                    Our support team is available if you have questions about a specific offer or how to claim it.
                  </p>
                  <Link
                    href="/contact"
                    className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-white/10 text-white font-bold text-xs uppercase tracking-wide hover:bg-white/20 transition-colors rounded-none border border-white/20"
                  >
                    Contact Support
                  </Link>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}