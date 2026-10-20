'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';
import { formatDate } from '@/lib/utils';

function AuthorPopup({ 
  author, 
  isOpen, 
  onClose 
}: { 
  author: { 
    id: number; 
    name: string; 
    picture: string | null; 
    bio: string | null; 
    created_at: string; 
  } | null; 
  isOpen: boolean; 
  onClose: () => void;
}) {
  if (!isOpen || !author) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="relative bg-white border border-border-gray max-w-md w-full p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-navy transition-colors border border-border-gray p-1"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <div className="flex flex-col items-center text-center">
          {author.picture ? (
            <Image
              src={author.picture}
              alt={author.name}
              width={100}
              height={100}
              className="border border-yellow object-cover"
            />
          ) : (
            <div className="w-[100px] h-[100px] bg-navy text-yellow font-bold flex items-center justify-center text-4xl border border-yellow">
              {author.name.charAt(0).toUpperCase()}
            </div>
          )}
          
          <h3 className="text-2xl font-bold text-navy mt-4">{author.name}</h3>
          
          {author.bio && (
            <p className="text-sm text-gray-text mt-3 leading-relaxed">{author.bio}</p>
          )}
          
          <div className="mt-4 pt-4 border-t border-border-gray/50 w-full">
            <p className="text-xs text-gray-text">
              Joined {formatDate(author.created_at)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthorSection({ 
  authorId,
  authorName, 
  authorPicture, 
  authorBio, 
  createdAt 
}: { 
  authorId: number | null;
  authorName: string; 
  authorPicture: string | null; 
  authorBio: string | null; 
  createdAt: string;
}) {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [authorData, setAuthorData] = useState<{
    id: number;
    name: string;
    picture: string | null;
    bio: string | null;
    created_at: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  // If no active author (authorId is null), show fallback
  if (!authorId) {
    return (
      <div className="mt-8 pt-6 border-t border-border-gray/60 flex items-center gap-3">
        {/* Author Initial */}
        <div className="w-12 h-12 bg-navy text-yellow font-bold flex items-center justify-center text-lg border border-yellow">
          E
        </div>
        <div>
          {/* Author Name */}
          <p className="text-sm font-bold text-navy">By EarnMoney Team</p>
          {/* Published Date */}
          <p className="text-xs text-gray-text">Published on {formatDate(createdAt)}</p>
        </div>
      </div>
    );
  }

  const handleAuthorClick = async () => {
    if (loading) return;
    
    if (authorData) {
      setIsPopupOpen(true);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/public/authors/${authorId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.author) {
          setAuthorData(data.author);
          setIsPopupOpen(true);
        }
      }
    } catch (error) {
      console.error('Error fetching author:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleAuthorClick}
        className="mt-8 pt-6 border-t border-border-gray/60 flex items-center gap-3 w-full text-left hover:bg-light-gray/20 transition-colors p-3 -mx-3 cursor-pointer"
        disabled={loading}
      >
        {/* Author Picture or Initial */}
        {authorPicture ? (
          <Image
            src={authorPicture}
            alt={authorName}
            width={48}
            height={48}
            className="border border-yellow object-cover"
          />
        ) : (
          <div className="w-12 h-12 bg-navy text-yellow font-bold flex items-center justify-center text-lg border border-yellow">
            {authorName.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          {/* Author Name */}
          <p className="text-sm font-bold text-navy flex items-center gap-2">
            By {authorName}
            {loading ? (
              <span className="text-xs text-gray-text">Loading...</span>
            ) : (
              <span className="text-[10px] text-gray-text font-normal">(click for profile)</span>
            )}
          </p>
          {/* Published Date */}
          <p className="text-xs text-gray-text">Published on {formatDate(createdAt)}</p>
        </div>
      </button>

      <AuthorPopup 
        author={authorData}
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
      />
    </>
  );
}