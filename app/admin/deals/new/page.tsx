'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Save,
  Loader2,
  X,
  AlertCircle,
  CheckCircle,
  Trash2,
  Sparkles,
  Tag,
  Search,
  TrendingUp,
  AlertTriangle,
  Check,
  Circle,
  CircleAlert,
  CircleCheck,
  Upload,
  Gift,
  Link as LinkIcon,
  DollarSign,
  Star,
  Calendar,
  CreditCard,
  Users,
  FolderOpen,
} from 'lucide-react';

import CountrySelect from '@/components/ui/CountrySelect';

import { CKEditor } from '@ckeditor/ckeditor5-react';
import {
  ClassicEditor,
  Essentials,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading,
  List,
  BlockQuote,
  Link as CKLink,
  Image as CKImage,
  ImageToolbar,
  ImageCaption,
  ImageStyle,
  ImageInsert,
  Table,
  TableToolbar,
  Alignment,
  Undo,
  RemoveFormat,
  Paragraph,
} from 'ckeditor5';
import 'ckeditor5/ckeditor5.css';

import { parse } from 'node-html-parser';
import readingTime from 'reading-time';

// Payout label options (pay_name)
const PAY_NAME_OPTIONS = [
  'Earning Potential',
  'Signup Bonus',
  'Loan Amount',
  'Coverage Amount',
  'Price',
  'Discount',
  'Sale Price',
  'Cashback',
  'Subscription Price',
  'Trial Offer',
  'Course Price',
  'Offer Value',
];

// ============================================================
// TOAST
// ============================================================
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'info' | 'warning'; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = {
    success: {
      bg: 'bg-[#2ecc71]',
      bar: 'bg-emerald-700/30',
      title: 'Success!',
      iconBg: 'bg-white text-[#2ecc71]',
      icon: <Check size={18} strokeWidth={3} />,
    },
    error: {
      bg: 'bg-[#e74c3c]',
      bar: 'bg-rose-900/30',
      title: 'Error!',
      iconBg: 'bg-white text-[#e74c3c]',
      icon: <X size={18} strokeWidth={3} />,
    },
    info: {
      bg: 'bg-[#3498db]',
      bar: 'bg-blue-900/30',
      title: 'Info!',
      iconBg: 'bg-white text-[#3498db]',
      icon: <span className="font-bold text-lg italic">i</span>,
    },
    warning: {
      bg: 'bg-[#f1c40f]',
      bar: 'bg-amber-950/20',
      title: 'Warning!',
      iconBg: 'bg-white text-[#f1c40f]',
      icon: <span className="font-bold text-lg">!</span>,
    },
  };

  const current = styles[type] || styles.info;

  return (
    <>
      <style jsx>{`
        @keyframes shrinkBar {
          0% { width: 100%; }
          100% { width: 0%; }
        }
        .animate-shrink {
          animation: shrinkBar 5s linear forwards;
        }
      `}</style>
      <div className={`fixed top-20 right-6 z-50 w-full max-w-md ${current.bg} text-white rounded-none shadow-2xl overflow-hidden flex flex-col`}>
        <div className="p-4 flex items-start gap-4 relative">
          <div className={`w-9 h-9 rounded-full ${current.iconBg} flex items-center justify-center shrink-0 shadow-sm mt-0.5`}>
            {current.icon}
          </div>
          <div className="flex-1 pr-6">
            <h4 className="font-bold text-base tracking-wide mb-0.5">{current.title}</h4>
            <p className="text-sm opacity-95 leading-relaxed">{message}</p>
          </div>
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-white/80 hover:text-white transition-colors p-1"
            aria-label="Close"
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>
        <div className={`w-full h-1.5 ${current.bar} relative overflow-hidden`}>
          <div className="absolute top-0 left-0 bottom-0 bg-white/50 animate-shrink" />
        </div>
      </div>
    </>
  );
}

// ============================================================
// CKEditor Upload Adapter (deals)
// ============================================================
function CustomUploadAdapterPlugin(editor: any) {
  editor.plugins.get('FileRepository').createUploadAdapter = (loader: any) => {
    return {
      upload: () => {
        return new Promise(async (resolve, reject) => {
          try {
            const file = await loader.file;
            if (!file) { reject('No file selected'); return; }
            if (!file.type.startsWith('image/')) { reject('Please upload an image file'); return; }
            if (file.size > 5 * 1024 * 1024) { reject('Image too large. Max 5MB allowed'); return; }

            const formData = new FormData();
            formData.append('file', file);
            formData.append('type', 'deals');

            const response = await fetch('/api/admin/upload', {
              method: 'POST',
              body: formData,
            });

            const data = await response.json();
            if (!response.ok) { reject(data.error || 'Upload failed'); return; }

            resolve({ default: data.url });
          } catch (error) {
            reject('Upload failed');
          }
        });
      },
      abort: () => {},
    };
  };
}

// ============================================================
// SEO ANALYSIS
// ============================================================
function analyzeSEO(content: string, focusKeyword: string, title: string, metaDescription: string, metaKeywords: string) {
  const results = {
    score: 0,
    checks: [] as {
      name: string;
      passed: boolean;
      status: 'success' | 'warning' | 'error';
      message: string;
      icon: any;
      current: number | string;
      target: string;
    }[],
  };

  if (!focusKeyword) {
    results.checks.push({
      name: 'Focus Keyword',
      passed: false,
      status: 'error',
      message: 'Enter a focus keyword for SEO analysis',
      icon: AlertTriangle,
      current: '—',
      target: 'Enter keyword',
    });
    return results;
  }

  const html = parse(content);
  const textContent = html.textContent || '';
  const wordCount = textContent.split(/\s+/).filter(w => w.length > 0).length;
  const readingStats = readingTime(textContent);
  const keywordCount = (textContent.toLowerCase().match(new RegExp(focusKeyword.toLowerCase(), 'g')) || []).length;
  const density = wordCount > 0 ? (keywordCount / wordCount) * 100 : 0;

  const keywordInTitle = title.toLowerCase().includes(focusKeyword.toLowerCase());
  results.checks.push({
    name: 'Keyword in Title',
    passed: keywordInTitle,
    status: keywordInTitle ? 'success' : 'error',
    message: keywordInTitle ? 'Keyword found in title' : 'Add keyword to title',
    icon: keywordInTitle ? Check : X,
    current: keywordInTitle ? 'Found' : 'Not found',
    target: 'Must include keyword',
  });
  if (keywordInTitle) results.score += 15;

  const keywordInMeta = metaDescription?.toLowerCase().includes(focusKeyword.toLowerCase()) || false;
  results.checks.push({
    name: 'Keyword in Meta Description',
    passed: keywordInMeta,
    status: keywordInMeta ? 'success' : 'error',
    message: keywordInMeta ? 'Keyword found in meta description' : 'Add keyword to meta description',
    icon: keywordInMeta ? Check : X,
    current: keywordInMeta ? 'Found' : 'Not found',
    target: 'Must include keyword',
  });
  if (keywordInMeta) results.score += 15;

  const titleLength = title.length;
  const titleStatus = titleLength >= 30 && titleLength <= 60 ? 'success' : titleLength > 60 ? 'error' : 'warning';
  results.checks.push({
    name: 'Title Length',
    passed: titleStatus === 'success',
    status: titleStatus,
    message: titleStatus === 'success' ? `${titleLength} characters (optimal)` :
             titleLength > 60 ? `${titleLength} characters (too long)` : `${titleLength} characters (too short)`,
    icon: titleStatus === 'success' ? Check : titleStatus === 'warning' ? CircleAlert : X,
    current: `${titleLength} chars`,
    target: '30-60 characters',
  });
  if (titleStatus === 'success') results.score += 10;

  const metaLength = metaDescription?.length || 0;
  const metaStatus = metaLength >= 120 && metaLength <= 160 ? 'success' : metaLength > 160 ? 'error' : 'warning';
  results.checks.push({
    name: 'Meta Description Length',
    passed: metaStatus === 'success',
    status: metaStatus,
    message: metaStatus === 'success' ? `${metaLength} characters (optimal)` :
             metaLength > 160 ? `${metaLength} characters (too long)` : `${metaLength} characters (too short)`,
    icon: metaStatus === 'success' ? Check : metaStatus === 'warning' ? CircleAlert : X,
    current: `${metaLength} chars`,
    target: '120-160 characters',
  });
  if (metaStatus === 'success') results.score += 10;

  const contentStatus = wordCount >= 600 ? 'success' : 'warning';
  results.checks.push({
    name: 'Content Length',
    passed: contentStatus === 'success',
    status: contentStatus,
    message: contentStatus === 'success' ? `${wordCount} words (good)` : `${wordCount} words (add more content)`,
    icon: contentStatus === 'success' ? Check : CircleAlert,
    current: `${wordCount} words`,
    target: '600+ words',
  });
  if (contentStatus === 'success') results.score += 15;

  const densityStatus = density >= 1 && density <= 3 ? 'success' : density > 3 ? 'error' : 'warning';
  results.checks.push({
    name: 'Keyword Density',
    passed: densityStatus === 'success',
    status: densityStatus,
    message: densityStatus === 'success' ? `${density.toFixed(1)}% (optimal)` :
             density > 3 ? `${density.toFixed(1)}% (too high)` : `${density.toFixed(1)}% (too low)`,
    icon: densityStatus === 'success' ? Check : densityStatus === 'warning' ? CircleAlert : X,
    current: `${density.toFixed(1)}%`,
    target: '1-3%',
  });
  if (densityStatus === 'success') results.score += 15;

  const countStatus = keywordCount >= 3 && keywordCount <= 5 ? 'success' : keywordCount > 5 ? 'error' : 'warning';
  results.checks.push({
    name: 'Keyword Count',
    passed: countStatus === 'success',
    status: countStatus,
    message: countStatus === 'success' ? `${keywordCount} times (optimal)` :
             keywordCount > 5 ? `${keywordCount} times (too many)` : `${keywordCount} times (too few)`,
    icon: countStatus === 'success' ? Check : countStatus === 'warning' ? CircleAlert : X,
    current: `${keywordCount} times`,
    target: '3-5 times',
  });
  if (countStatus === 'success') results.score += 15;

  const h1s = html.querySelectorAll('h1');
  const h2s = html.querySelectorAll('h2');
  const keywordInH1 = h1s.some(h => h.textContent?.toLowerCase().includes(focusKeyword.toLowerCase()));
  const keywordInH2 = h2s.some(h => h.textContent?.toLowerCase().includes(focusKeyword.toLowerCase()));
  const headingStatus = keywordInH1 || keywordInH2 ? 'success' : 'warning';
  results.checks.push({
    name: 'Keyword in Headings',
    passed: headingStatus === 'success',
    status: headingStatus,
    message: headingStatus === 'success' ? 'Keyword in H1/H2' : 'Add keyword to H1 or H2',
    icon: headingStatus === 'success' ? Check : CircleAlert,
    current: headingStatus === 'success' ? 'Found' : 'Not found',
    target: 'H1 or H2 with keyword',
  });
  if (headingStatus === 'success') results.score += 10;

  const images = html.querySelectorAll('img');
  const imagesWithAlt = images.filter(img => img.getAttribute('alt') && img.getAttribute('alt')?.trim() !== '');
  const altStatus = images.length === 0 || imagesWithAlt.length === images.length ? 'success' : 'warning';
  results.checks.push({
    name: 'Image Alt Text',
    passed: altStatus === 'success',
    status: altStatus,
    message: altStatus === 'success' ? `${imagesWithAlt.length}/${images.length} have alt text` : `${images.length - imagesWithAlt.length} images missing alt text`,
    icon: altStatus === 'success' ? Check : CircleAlert,
    current: `${imagesWithAlt.length}/${images.length}`,
    target: 'All images need alt text',
  });
  if (altStatus === 'success' && images.length > 0) results.score += 5;

  const readTimeMinutes = Math.ceil(readingStats.minutes);
  const readStatus = readTimeMinutes >= 3 ? 'success' : 'warning';
  results.checks.push({
    name: 'Reading Time',
    passed: readStatus === 'success',
    status: readStatus,
    message: readStatus === 'success' ? `${readTimeMinutes} min read (good)` : `${readTimeMinutes} min read (too short)`,
    icon: readStatus === 'success' ? Check : CircleAlert,
    current: `${readTimeMinutes} min`,
    target: '3+ minutes',
  });
  if (readStatus === 'success') results.score += 5;

  const links = html.querySelectorAll('a');
  const linkStatus = links.length > 0 ? 'success' : 'warning';
  results.checks.push({
    name: 'Links',
    passed: linkStatus === 'success',
    status: linkStatus,
    message: linkStatus === 'success' ? `${links.length} links found` : 'Add internal or external links',
    icon: linkStatus === 'success' ? Check : CircleAlert,
    current: `${links.length} links`,
    target: '1+ links',
  });
  if (linkStatus === 'success') results.score += 5;

  const uls = html.querySelectorAll('ul');
  const ols = html.querySelectorAll('ol');
  const listStatus = uls.length > 0 || ols.length > 0 ? 'success' : 'warning';
  results.checks.push({
    name: 'Lists',
    passed: listStatus === 'success',
    status: listStatus,
    message: listStatus === 'success' ? `${uls.length + ols.length} lists found` : 'Add bullet or numbered lists',
    icon: listStatus === 'success' ? Check : CircleAlert,
    current: `${uls.length + ols.length} lists`,
    target: '1+ lists',
  });
  if (listStatus === 'success') results.score += 5;

  const kwStatus = metaKeywords && metaKeywords.length > 0 ? 'success' : 'warning';
  results.checks.push({
    name: 'Meta Keywords',
    passed: kwStatus === 'success',
    status: kwStatus,
    message: kwStatus === 'success' ? 'Meta keywords added' : 'Add meta keywords',
    icon: kwStatus === 'success' ? Check : CircleAlert,
    current: kwStatus === 'success' ? 'Added' : 'Not added',
    target: 'Add keywords',
  });
  if (kwStatus === 'success') results.score += 5;

  return results;
}

// ============================================================
// INTERFACES
// ============================================================
interface Category {
  id: number;
  name: string;
  slug: string;
  type: 'articles' | 'both' | 'deals';
}

interface Author {
  id: number;
  name: string;
  picture: string | null;
}

// ============================================================
// COMPONENT
// ============================================================
export default function CreateDealPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [focusKeyword, setFocusKeyword] = useState('');
  const [seoResults, setSeoResults] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'seo' | 'settings' | 'meta'>('seo');
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [filterLoading, setFilterLoading] = useState(true);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    offer_link: '',           // ✅ FIXED: was deal_link
    category_id: '',
    author_id: '',
    payout_amount: '',
    pay_name: '',             // ✅ ADDED
    brand_name: '',           // ✅ ADDED
    rating: '',
    withdraw_method: '',
    country: [] as string[],
    verified_date: '',
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
    is_active: true,
    is_boosted: false,
    cover_image: '',
  });

  // Fetch categories + authors
  useEffect(() => {
    (async () => {
      try {
        setFilterLoading(true);
        const catRes = await fetch('/api/admin/categories');
        if (catRes.ok) {
          const catData = await catRes.json();
          const filtered = (catData.categories || []).filter(
            (cat: Category) => cat.type === 'deals' || cat.type === 'both'
          );
          setCategories(filtered);
        }
        const authRes = await fetch('/api/admin/authors');
        if (authRes.ok) {
          const authData = await authRes.json();
          setAuthors(authData.authors || []);
        }
      } catch (error) {
        console.error('Error fetching filter options:', error);
      } finally {
        setFilterLoading(false);
      }
    })();
  }, []);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  const generateSlug = (title: string) =>
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

  // Cover image upload
  const handleCoverImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please upload an image file', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image too large. Max 5MB allowed', 'error');
      return;
    }

    setCoverImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setCoverImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const removeCoverImage = () => {
    setCoverImagePreview(null);
    setCoverImageFile(null);
    setFormData({ ...formData, cover_image: '' });
  };

  const uploadCoverImage = async (): Promise<string | null> => {
    if (!coverImageFile) return null;
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', coverImageFile);
      uploadFormData.append('type', 'deals');

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: uploadFormData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      return data.url;
    } catch (error) {
      showToast('Failed to upload cover image', 'error');
      return null;
    }
  };

  // Live SEO
  useEffect(() => {
    if (focusKeyword) {
      const results = analyzeSEO(
        formData.content,
        focusKeyword,
        formData.meta_title || formData.title,
        formData.meta_description,
        formData.meta_keywords
      );
      setSeoResults(results);
    } else {
      setSeoResults(null);
    }
  }, [formData.content, formData.title, formData.meta_title, formData.meta_description, formData.meta_keywords, focusKeyword]);

  // Editor init
  useEffect(() => {
    if (ClassicEditor) setIsEditorReady(true);
  }, []);

  const editorConfig = {
    licenseKey: 'GPL',
    plugins: [
      Essentials, Bold, Italic, Underline, Strikethrough, Heading, List, BlockQuote,
      CKLink, CKImage, ImageToolbar, ImageCaption, ImageStyle, ImageInsert,
      CustomUploadAdapterPlugin, Table, TableToolbar, Alignment, Undo, RemoveFormat, Paragraph,
    ],
    toolbar: {
      items: [
        'heading', '|',
        'bold', 'italic', 'underline', 'strikethrough', '|',
        'bulletedList', 'numberedList', '|',
        'blockQuote', 'link', '|',
        'insertImage', 'insertTable', '|',
        'alignment', '|',
        'undo', 'redo', '|',
        'removeFormat',
      ],
    },
    heading: {
      options: [
        { model: 'paragraph', title: 'Paragraph', class: 'ck-heading_paragraph' },
        { model: 'heading1', view: 'h1', title: 'Heading 1', class: 'ck-heading_heading1' },
        { model: 'heading2', view: 'h2', title: 'Heading 2', class: 'ck-heading_heading2' },
        { model: 'heading3', view: 'h3', title: 'Heading 3', class: 'ck-heading_heading3' },
        { model: 'heading4', view: 'h4', title: 'Heading 4', class: 'ck-heading_heading4' },
      ] as any,
    },
    alignment: { options: ['left', 'center', 'right', 'justify'] as any },
    image: { toolbar: ['imageStyle:block', 'imageStyle:side', '|', 'imageTextAlternative'] },
    table: { contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells'] },
    placeholder: 'Write your deal content here...',
  };

  // SUBMIT
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.title || !formData.slug || !formData.content || !formData.offer_link) {
      showToast('Title, slug, content, and deal link are required', 'error');
      setLoading(false);
      return;
    }
    if (!formData.category_id) {
      showToast('Please select a category', 'error');
      setLoading(false);
      return;
    }
    if (!formData.author_id) {
      showToast('Please select an author', 'error');
      setLoading(false);
      return;
    }

    try {
      let coverImageUrl = formData.cover_image;
      if (coverImageFile) {
        const uploaded = await uploadCoverImage();
        if (uploaded) coverImageUrl = uploaded;
      }

      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('slug', formData.slug);
      submitData.append('content', formData.content);
      submitData.append('offer_link', formData.offer_link);       // ✅ FIXED
      submitData.append('category_id', String(formData.category_id));
      submitData.append('author_id', String(formData.author_id));
      submitData.append('payout_amount', formData.payout_amount || '');
      submitData.append('pay_name', formData.pay_name || '');     // ✅ ADDED
      submitData.append('brand_name', formData.brand_name || ''); // ✅ ADDED
      submitData.append('rating', formData.rating || '');
      submitData.append('withdraw_method', formData.withdraw_method || '');
      submitData.append('country', formData.country.join(','));
      submitData.append('verified_date', formData.verified_date || '');
      submitData.append('meta_title', formData.meta_title || '');
      submitData.append('meta_description', formData.meta_description || '');
      submitData.append('meta_keywords', formData.meta_keywords || '');
      submitData.append('cover_image', coverImageUrl || '');
      submitData.append('is_active', String(formData.is_active));
      submitData.append('is_boosted', String(formData.is_boosted));

      const res = await fetch('/api/admin/deals', {
        method: 'POST',
        body: submitData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create deal');

      showToast('Deal created successfully!', 'success');
      setTimeout(() => router.push('/admin/deals'), 3000);
    } catch (err: any) {
      showToast(err.message || 'Error creating deal', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Helpers
  const getStatusColor = (status: string) => {
    if (status === 'success') return 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5';
    if (status === 'warning') return 'text-amber-400 border-amber-500/20 bg-amber-500/5';
    return 'text-rose-400 border-rose-500/20 bg-rose-500/5';
  };
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 50) return 'text-amber-400';
    return 'text-rose-400';
  };
  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 50) return 'bg-amber-500';
    return 'bg-rose-500';
  };
  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Needs Improvement';
    return 'Poor';
  };
  const getStatusIcon = (status: string) => {
    if (status === 'success') return <CircleCheck size={16} className="text-emerald-400 shrink-0" />;
    if (status === 'warning') return <CircleAlert size={16} className="text-amber-400 shrink-0" />;
    return <Circle size={16} className="text-rose-400 shrink-0" />;
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/deals"
            className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Gift size={24} className="text-yellow" />
              Create Deal
            </h1>
            <p className="text-sm text-slate-500 dark:text-white/50 mt-1">
              Create a new deal with real-time SEO optimization
            </p>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2.5 bg-yellow text-slate-950 text-sm font-bold hover:bg-yellow/90 transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {loading ? 'Saving...' : 'Publish Deal'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* MAIN FORM */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4 sm:p-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Basic Information</h2>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/40 mb-1.5">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      title: e.target.value,
                      slug: formData.slug || generateSlug(e.target.value),
                      meta_title: formData.meta_title || e.target.value,
                    });
                  }}
                  placeholder="Enter deal title..."
                  className="w-full px-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:border-yellow focus:ring-1 focus:ring-yellow transition-colors"
                />
                <div className="mt-1 text-xs text-slate-400 dark:text-white/30">
                  {formData.title.length}/255 characters
                </div>
              </div>

              {/* Slug */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/40 mb-1.5">
                  Slug *
                </label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <span className="text-slate-500 dark:text-white/30 text-sm shrink-0 hidden sm:block">/deals/</span>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="deal-url-slug"
                    className="flex-1 px-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:border-yellow focus:ring-1 focus:ring-yellow transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, slug: generateSlug(formData.title) })}
                    className="px-4 py-2.5 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-white border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors whitespace-nowrap"
                  >
                    Generate
                  </button>
                </div>
              </div>

              {/* Deal Link */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/40 mb-1.5">
                  Deal Link *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <LinkIcon size={16} />
                  </div>
                  <input
                    type="url"
                    required
                    value={formData.offer_link}
                    onChange={(e) => setFormData({ ...formData, offer_link: e.target.value })}
                    placeholder="https://example.com/deal"
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:border-yellow focus:ring-1 focus:ring-yellow transition-colors"
                  />
                </div>
              </div>

              {/* Category + Author */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/40 mb-1.5 flex items-center gap-2">
                    <FolderOpen size={14} />
                    Category *
                  </label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:border-yellow focus:ring-1 focus:ring-yellow transition-colors"
                    required
                  >
                    <option value="">Select a category...</option>
                    {filterLoading ? (
                      <option value="" disabled>Loading categories...</option>
                    ) : categories.length === 0 ? (
                      <option value="" disabled>No categories available</option>
                    ) : (
                      categories.map((cat) => (
                        <option key={cat.id} value={String(cat.id)}>
                          {cat.name} {cat.type === 'both' ? '(Both)' : ''}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/40 mb-1.5 flex items-center gap-2">
                    <Users size={14} />
                    Author *
                  </label>
                  <select
                    value={formData.author_id}
                    onChange={(e) => setFormData({ ...formData, author_id: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:border-yellow focus:ring-1 focus:ring-yellow transition-colors"
                    required
                  >
                    <option value="">Select an author...</option>
                    {filterLoading ? (
                      <option value="" disabled>Loading authors...</option>
                    ) : authors.length === 0 ? (
                      <option value="" disabled>No authors available</option>
                    ) : (
                      authors.map((author) => (
                        <option key={author.id} value={String(author.id)}>
                          {author.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              {/* COUNTRY SELECTOR */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/40 mb-1.5">
                  Available Countries
                </label>
                <CountrySelect
                  value={formData.country}
                  onChange={(newCountries) => setFormData({ ...formData, country: newCountries })}
                />
                <p className="mt-1 text-xs text-slate-400 dark:text-white/30">
                  Select one or multiple countries where this deal is available.
                </p>
              </div>

              {/* Payout Label + Payout Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/40 mb-1.5">
                    Payout Label
                  </label>
                  <select
                    value={formData.pay_name}
                    onChange={(e) => setFormData({ ...formData, pay_name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:border-yellow focus:ring-1 focus:ring-yellow transition-colors"
                  >
                    <option value="">Select label...</option>
                    {PAY_NAME_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/40 mb-1.5">
                    Payout Amount
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <DollarSign size={16} />
                    </div>
                    <input
                      type="text"
                      value={formData.payout_amount}
                      onChange={(e) => setFormData({ ...formData, payout_amount: e.target.value })}
                      placeholder="$5 - $50"
                      className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:border-yellow focus:ring-1 focus:ring-yellow transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Brand Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/40 mb-1.5">
                  Brand Name
                </label>
                <input
                  type="text"
                  value={formData.brand_name}
                  onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
                  placeholder="e.g. Nike, Swagbucks, PayPal"
                  className="w-full px-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:border-yellow focus:ring-1 focus:ring-yellow transition-colors"
                />
              </div>

              {/* Rating + Verified Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/40 mb-1.5">
                    Rating (1.0 - 5.0)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Star size={16} />
                    </div>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="5"
                      value={formData.rating}
                      onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                      placeholder="4.5"
                      className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:border-yellow focus:ring-1 focus:ring-yellow transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/40 mb-1.5">
                    Verified Date
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Calendar size={16} />
                    </div>
                    <input
                      type="date"
                      value={formData.verified_date}
                      onChange={(e) => setFormData({ ...formData, verified_date: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:border-yellow focus:ring-1 focus:ring-yellow transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Withdraw / Redemption Methods */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/40 mb-1.5">
                  Redemption Methods
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <CreditCard size={16} />
                  </div>
                  <input
                    type="text"
                    value={formData.withdraw_method}
                    onChange={(e) => setFormData({ ...formData, withdraw_method: e.target.value })}
                    placeholder="PayPal, Gift Cards, Coupon"
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:border-yellow focus:ring-1 focus:ring-yellow transition-colors"
                  />
                </div>
              </div>

              {/* Cover Image */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/40 mb-1.5">
                  Cover Image
                </label>
                <div className="flex flex-col items-center justify-center w-full">
                  {coverImagePreview ? (
                    <div className="relative w-full">
                      <div className="relative w-full aspect-video max-h-[300px] border border-slate-200 dark:border-white/10 overflow-hidden">
                        <Image src={coverImagePreview} alt="Cover preview" fill className="object-cover" />
                      </div>
                      <button
                        type="button"
                        onClick={removeCoverImage}
                        className="absolute top-2 right-2 p-1.5 bg-rose-500/90 hover:bg-rose-600 text-white transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-300 dark:border-white/20 cursor-pointer hover:border-yellow/50 transition-colors bg-slate-50 dark:bg-white/5">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload size={32} className="text-slate-400 dark:text-white/30 mb-2" />
                        <p className="mb-2 text-sm text-slate-500 dark:text-white/40">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-slate-400 dark:text-white/30">
                          PNG, JPG, WebP (max 5MB)
                        </p>
                      </div>
                      <input type="file" accept="image/*" onChange={handleCoverImageUpload} className="hidden" />
                    </label>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4 sm:p-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Content *</h2>
            <div className="border border-slate-200 dark:border-white/10 overflow-hidden min-h-[400px]">
              {isEditorReady ? (
                <CKEditor
                  editor={ClassicEditor}
                  config={editorConfig}
                  data={formData.content}
                  onChange={(_event: any, editor: any) => {
                    const data = editor.getData();
                    setFormData((prev) => ({ ...prev, content: data }));
                  }}
                />
              ) : (
                <div className="h-[400px] bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400">
                  <Loader2 size={24} className="animate-spin text-yellow mr-2" />
                  Loading editor...
                </div>
              )}
            </div>
            <div className="mt-2 text-xs text-slate-400 dark:text-white/30">
              Use the editor toolbar to format text, add images, tables, and more.
            </div>
          </div>
        </div>

        {/* SIDEBAR */}
        <div className="lg:col-span-1 space-y-6">
          {/* Mobile Tabs */}
          <div className="flex sm:hidden gap-1 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-1">
            <button
              onClick={() => setActiveTab('seo')}
              className={`flex-1 py-2 text-xs font-bold transition-colors ${
                activeTab === 'seo' ? 'bg-yellow text-slate-950' : 'text-slate-500 dark:text-white/40'
              }`}
            >
              SEO
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex-1 py-2 text-xs font-bold transition-colors ${
                activeTab === 'settings' ? 'bg-yellow text-slate-950' : 'text-slate-500 dark:text-white/40'
              }`}
            >
              Settings
            </button>
            <button
              onClick={() => setActiveTab('meta')}
              className={`flex-1 py-2 text-xs font-bold transition-colors ${
                activeTab === 'meta' ? 'bg-yellow text-slate-950' : 'text-slate-500 dark:text-white/40'
              }`}
            >
              Meta
            </button>
          </div>

          {/* SEO Analysis */}
          <div className={`bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4 sm:p-6 ${activeTab === 'seo' ? 'block' : 'hidden sm:block'}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp size={18} className="text-yellow" />
                SEO Analysis
              </h2>
              {seoResults && (
                <div className="text-right">
                  <span className={`text-2xl font-bold ${getScoreColor(seoResults.score)}`}>
                    {seoResults.score}/100
                  </span>
                  <div className={`text-xs font-medium ${getScoreColor(seoResults.score)}`}>
                    {getScoreLabel(seoResults.score)}
                  </div>
                </div>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/40 mb-1.5">
                Focus Keyword
              </label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={focusKeyword}
                  onChange={(e) => setFocusKeyword(e.target.value)}
                  placeholder="Enter focus keyword..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:border-yellow focus:ring-1 focus:ring-yellow transition-colors"
                />
              </div>
            </div>

            {seoResults ? (
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {seoResults.checks.map((check: any, index: number) => (
                  <div key={index} className={`flex items-start gap-2 p-2 text-sm border ${getStatusColor(check.status)}`}>
                    {getStatusIcon(check.status)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium">{check.name}</span>
                        <span className="text-[10px] font-mono opacity-70">{check.current}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <span className="text-[10px] opacity-80">{check.message}</span>
                        <span className="text-[9px] opacity-50">{check.target}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-slate-400 dark:text-white/30 text-center py-8">
                <TrendingUp size={48} className="mx-auto mb-3 opacity-30" />
                <p className="font-medium">Enter a focus keyword</p>
                <p className="text-xs mt-1">Get real-time SEO analysis and score</p>
              </div>
            )}

            {seoResults && (
              <div className="mt-4">
                <div className="w-full bg-slate-200 dark:bg-white/10 h-2">
                  <div
                    className={`h-2 transition-all duration-500 ${getScoreBg(seoResults.score)}`}
                    style={{ width: `${seoResults.score}%` }}
                  />
                </div>
                <div className="mt-1 flex justify-between text-xs">
                  <span className="text-slate-400 dark:text-white/30">0</span>
                  <span className={`font-medium ${getScoreColor(seoResults.score)}`}>
                    {getScoreLabel(seoResults.score)}
                  </span>
                  <span className="text-slate-400 dark:text-white/30">100</span>
                </div>
              </div>
            )}
          </div>

          {/* Publish Settings */}
          <div className={`bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4 sm:p-6 ${activeTab === 'settings' ? 'block' : 'hidden sm:block'}`}>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Publish Settings</h2>

            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-white/70 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 accent-yellow"
                />
                Published (Active)
              </label>

              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-white/70 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_boosted}
                  onChange={(e) => setFormData({ ...formData, is_boosted: e.target.checked })}
                  className="w-4 h-4 accent-yellow"
                />
                <Sparkles size={14} className="text-yellow" />
                Featured (Boosted)
              </label>
            </div>
          </div>

          {/* Meta Tags */}
          <div className={`bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4 sm:p-6 ${activeTab === 'meta' ? 'block' : 'hidden sm:block'}`}>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Tag size={18} className="text-yellow" />
              Meta Tags
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/40 mb-1.5">
                  Meta Title
                </label>
                <input
                  type="text"
                  value={formData.meta_title}
                  onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                  placeholder="SEO title (leave blank to use deal title)"
                  className="w-full px-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:border-yellow focus:ring-1 focus:ring-yellow transition-colors"
                />
                <div className="mt-1 text-xs text-slate-400 dark:text-white/30">
                  {formData.meta_title.length}/150 characters
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/40 mb-1.5">
                  Meta Description
                </label>
                <textarea
                  value={formData.meta_description}
                  onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                  rows={2}
                  placeholder="SEO description (120-160 chars)"
                  className="w-full px-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:border-yellow focus:ring-1 focus:ring-yellow transition-colors resize-y"
                />
                <div className="mt-1 text-xs text-slate-400 dark:text-white/30">
                  {formData.meta_description.length}/160 characters
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/40 mb-1.5">
                  Meta Keywords
                </label>
                <input
                  type="text"
                  value={formData.meta_keywords}
                  onChange={(e) => setFormData({ ...formData, meta_keywords: e.target.value })}
                  placeholder="keyword1, keyword2, keyword3"
                  className="w-full px-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:border-yellow focus:ring-1 focus:ring-yellow transition-colors"
                />
                <div className="mt-1 text-xs text-slate-400 dark:text-white/30">
                  Comma separated keywords
                </div>
              </div>
            </div>
          </div>

          {/* SEO Score Summary */}
          {seoResults && (
            <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4 sm:p-6 hidden sm:block">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700 dark:text-white/60">SEO Score</span>
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 flex items-center justify-center text-xl font-bold ${getScoreColor(seoResults.score)} border-2 ${getScoreBg(seoResults.score)}/20`}>
                    {seoResults.score}
                  </div>
                  <span className={`text-sm font-medium ${getScoreColor(seoResults.score)}`}>
                    {getScoreLabel(seoResults.score)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}