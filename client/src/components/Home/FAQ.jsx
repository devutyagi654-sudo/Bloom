import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, HelpCircle } from 'lucide-react';

const FAQS = [
  {
    question: 'Why choose Bloom Luxe Collection?',
    answer: 'At Bloom Luxe Collection, every single piece of jewelry and watch is handcrafted by artisans with a focus on details, minimal modern design, and lifetime authenticity. We use only premium conflict-free diamonds, certified 18k and 22k gold, and robust structural metals to ensure your jewelry is an investment for generations.'
  },
  {
    question: 'What payment methods do you support?',
    answer: 'We accept Cash on Delivery (COD) for domestic orders, all major Credit/Debit Cards (Visa, Mastercard, Amex), and instant UPI mobile payments. For premium items over ₹1,72,000, we recommend prepaid methods for expedited dispatch.'
  },
  {
    question: 'How long does shipping and delivery take?',
    answer: 'Orders are processed within 24-48 hours. Domestic delivery takes 3-5 business days, while global insured courier shipping takes 5-10 business days. You will receive an automated tracking code immediately upon handover to our secure shipping partners.'
  },
  {
    question: 'What is your returns and exchange policy?',
    answer: 'We provide a 14-day hassle-free return or exchange policy on all unworn items in their original packaging, including the luxury gift box and certificate cards. Custom-engraved items or bespoke sizes are final sale.'
  }
];

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-20 bg-neutral-50 dark:bg-neutral-950 border-t border-b border-neutral-100 dark:border-neutral-900 transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title */}
        <div className="text-center mb-16">
          <span className="text-luxury-gold-600 dark:text-luxury-gold-400 font-bold uppercase tracking-widest text-xs flex items-center justify-center">
            <HelpCircle className="w-4 h-4 mr-1.5" /> Support Atelier
          </span>
          <h2 className="font-playfair text-3xl md:text-4xl text-neutral-900 dark:text-white font-bold tracking-wide mt-2">
            Frequently Asked Questions
          </h2>
          <div className="w-16 h-0.5 bg-luxury-gold-500 mx-auto mt-4"></div>
        </div>

        {/* Accordions */}
        <div className="space-y-4">
          {FAQS.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={i}
                className="bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800 rounded-xl overflow-hidden shadow-sm transition-colors duration-300"
              >
                <button
                  onClick={() => toggleFAQ(i)}
                  className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
                >
                  <span className="font-playfair font-semibold text-neutral-800 dark:text-neutral-200 text-base md:text-lg">
                    {faq.question}
                  </span>
                  <span className="p-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                    {isOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </span>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                    >
                      <div className="px-6 pb-6 pt-2 border-t border-neutral-100 dark:border-neutral-800/60 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed font-light">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default FAQ;
