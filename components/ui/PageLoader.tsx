'use client';

import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

interface PageLoaderProps {
  message?: string;
  className?: string;
  minHeight?: string;
}

const LOADING_MESSAGES = [
  'Auditing verified deals...',
  'Fetching exclusive offers...',
  'Checking active promotions...',
  'Loading secure rewards...',
  'Preparing your Content...',
  'Almost ready...',
];

export default function PageLoader({
  message = 'Loading Content...',
  className = '',
  minHeight = 'min-h-[75vh]',
}: PageLoaderProps) {
  const [currentMessage, setCurrentMessage] = useState(message);
  const [messageIndex, setMessageIndex] = useState(0);

  // Rotate messages if default message is used
  useEffect(() => {
    if (message !== 'Loading Content...') return;

    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
      setCurrentMessage(LOADING_MESSAGES[messageIndex]);
    }, 2500);

    return () => clearInterval(interval);
  }, [message, messageIndex]);

  return (
    <div className={`flex flex-col items-center justify-center bg-gray-100 px-4 py-12 ${minHeight} ${className}`}>
      <div className="relative flex flex-col items-center max-w-sm w-full text-center">
        {/* Soft elegant glowing ring background */}
        <div className="absolute -inset-4 bg-yellow/10 blur-xl w-32 h-32 -translate-x-1/2 left-1/2 -translate-y-1/2 top-1/2 -z-10" />

        {/* The custom CSS loader with brand colors - SAME ANIMATION */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="text-navy flex items-center justify-center mb-8"
        >
          <div className="loader text-yellow scale-125" />
        </motion.div>

        {/* Informative, clean message - IMPROVED CONTENT */}
        <div className="space-y-3">
          <motion.p
            className="text-navy font-extrabold text-base tracking-wide text-xs"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            {currentMessage}
          </motion.p>
          
          {/* Elegant simple loading progress line - SAME ANIMATION */}
          <div className="w-24 h-0.5 bg-border-gray mx-auto overflow-hidden">
            <motion.div
              className="h-full bg-yellow"
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{
                repeat: Infinity,
                duration: 1.4,
                ease: 'easeInOut',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}