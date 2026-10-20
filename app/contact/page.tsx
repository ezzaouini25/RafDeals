'use client';

import { useState, useEffect } from 'react';
import { User, Mail, MessageSquare, MessageCircle, Send, CheckCircle, Clock, Loader2, AlertCircle } from 'lucide-react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import AdPlacement from '@/components/ui/AdPlacement';
import { contactSchema } from '@/lib/validators';
import { submitContactForm, checkUserBlocked } from './actions';
import { generateDeviceFingerprint } from '@/lib/fingerprint';

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Rate limiting states
  const [fingerprint, setFingerprint] = useState('');
  const [isBlocked, setIsBlocked] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Generate fingerprint on mount
  useEffect(() => {
    try {
      const fp = generateDeviceFingerprint();
      setFingerprint(fp);
    } catch (error) {
      console.error('Failed to generate fingerprint:', error);
    }
  }, []);

  // Check block status on mount
  useEffect(() => {
    if (!fingerprint) return;

    const checkStatus = async () => {
      try {
        const result = await checkUserBlocked(fingerprint);
        if (result.blocked) {
          setIsBlocked(true);
          setRemainingSeconds(result.remaining_seconds || 86400);
        }
      } catch (error) {
        console.error('Failed to check block status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkStatus();
  }, [fingerprint]);

  // Countdown timer
  useEffect(() => {
    if (!isBlocked || remainingSeconds <= 0) return;

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          setIsBlocked(false);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isBlocked, remainingSeconds]);

  const formatCountdown = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setFormError(null);

    if (isBlocked) {
      setFormError('You are blocked. Please wait before submitting again.');
      return;
    }

    // Client-side validation using our shared Zod schema
    const result = contactSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);

    try {
      const submissionData = new FormData();
      submissionData.append('name', formData.name);
      submissionData.append('email', formData.email);
      submissionData.append('subject', formData.subject);
      submissionData.append('message', formData.message);
      submissionData.append('device_fingerprint', fingerprint);

      const response = await submitContactForm(null, submissionData);
      
      if (response.success) {
        setSubmitted(true);
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else if (response.blocked) {
        setIsBlocked(true);
        setRemainingSeconds(response.remaining_seconds || 86400);
        setFormError(response.error || 'You have been blocked for 24 hours.');
      } else {
        const errs = response.errors;
        if (errs) {
          if (errs._form) {
            setFormError(errs._form[0]);
          } else {
            const fieldErrors: Record<string, string> = {};
            Object.keys(errs).forEach((key) => {
              const arr = errs[key as keyof typeof errs];
              if (arr && arr.length > 0) {
                fieldErrors[key] = arr[0];
              }
            });
            setErrors(fieldErrors);
          }
        }
      }
    } catch (err) {
      console.error('Submission error:', err);
      setFormError('A network error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-light-gray min-h-screen pb-16">
      {/* Header */}
      <div className="bg-white border-b border-border-gray py-12 text-center">
        <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-4xl font-extrabold text-navy">Get In Touch</h1>
          <p className="mt-2 text-gray-text max-w-xl mx-auto">
            Have a question, feedback, or a partnership inquiry? We would love to hear from you.
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <AdPlacement placement="contact" />
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 items-start">
          {/* Form Column */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-card shadow-card p-8 border border-border-gray/50">
              {/* Blocked Message */}
              {isBlocked && (
                <div className="mb-6 p-4 bg-red-50/80 border border-red-200 rounded-xl flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <AlertCircle size={20} className="text-red-500 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-red-700">Temporarily Blocked</p>
                      <p className="text-xs text-red-500">Too many attempts. Please wait.</p>
                    </div>
                  </div>
                  <div className="bg-white px-4 py-1.5 rounded-lg border border-red-200">
                    <span className="font-mono text-lg font-bold text-red-600">
                      {formatCountdown(remainingSeconds)}
                    </span>
                  </div>
                </div>
              )}

              {submitted ? (
                <div className="text-center py-12">
                  <CheckCircle size={48} className="mx-auto text-success" />
                  <h3 className="mt-4 text-2xl font-bold text-navy">Message Sent Successfully!</h3>
                  <p className="mt-2 text-gray-text leading-relaxed">
                    Thank you for reaching out. Our support team typically reviews and replies to all inquiries within 24-48 hours.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="mt-6 text-sm font-semibold text-navy hover:underline focus:outline-none"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {formError && (
                    <div className="p-4 bg-error/10 border border-error/20 rounded-btn text-error text-sm font-medium">
                      {formError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      label="Name"
                      placeholder="Your name"
                      icon={<User size={18} />}
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      error={errors.name}
                      required
                      disabled={isBlocked}
                    />
                    <Input
                      label="Email"
                      type="email"
                      placeholder="your@email.com"
                      icon={<Mail size={18} />}
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      error={errors.email}
                      required
                      disabled={isBlocked}
                    />
                  </div>

                  <Input
                    label="Subject"
                    placeholder="How can we help you?"
                    icon={<MessageSquare size={18} />}
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    error={errors.subject}
                    required
                    disabled={isBlocked}
                  />

                  <div>
                    <label className="block text-sm font-medium text-navy mb-1.5">
                      Message
                    </label>
                    <div className="relative">
                      <MessageCircle size={18} className="absolute left-3 top-3 text-gray-text" />
                      <textarea
                        rows={5}
                        placeholder="Type your message here (minimum 20 characters)..."
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        className="w-full px-4 py-3 pl-10 text-sm border border-border-gray rounded-input bg-white text-navy placeholder:text-gray-text/60 focus:outline-none focus:border-navy focus:ring-2 focus:ring-navy/10 resize-y transition-all min-h-[120px] disabled:opacity-40 disabled:cursor-not-allowed"
                        required
                        disabled={isBlocked}
                      />
                    </div>
                    {errors.message && (
                      <p className="mt-1.5 text-sm text-error">{errors.message}</p>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    disabled={isBlocked || submitting} 
                    className="w-full h-12"
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin mr-2" />
                        Sending...
                      </>
                    ) : isBlocked ? (
                      <>
                        <Clock size={16} className="mr-2" />
                        Blocked ({formatCountdown(remainingSeconds)})
                      </>
                    ) : (
                      <>
                        Send Message
                        <Send size={16} className="ml-2" />
                      </>
                    )}
                  </Button>
                </form>
              )}
            </div>
          </div>

          {/* Info Sidebar Column */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-card border border-border-gray p-6 space-y-6 shadow-sm">
              <h3 className="font-bold text-navy text-xl pb-2 border-b border-border-gray/50">Contact Information</h3>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-light-gray rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail size={18} className="text-navy" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-text font-medium">Direct Email Support</p>
                    <p className="font-bold text-navy mt-0.5">support@earnmoney.com</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-light-gray rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock size={18} className="text-navy" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-text font-medium">Typical Response Time</p>
                    <p className="font-bold text-navy mt-0.5">Within 24 to 48 hours</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-yellow/10 rounded-lg border border-yellow/20">
                <p className="text-sm text-navy font-semibold leading-relaxed">
                  Tip: Please supply as much detail as possible so our support specialists can assist you effectively.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}