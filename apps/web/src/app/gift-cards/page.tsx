'use client';

import { useState } from 'react';
import {
  Bell,
  Menu,
  Gift,
  CreditCard,
  Plus,
  DollarSign,
  TrendingUp,
  Send,
  MoreHorizontal,
  Copy,
  X,
  Check,
  Mail,
  Printer,
  Eye,
  Ban,
  Search,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { FeatureGate } from '@/components/FeatureGate';
import { AppSidebar } from '@/components/AppSidebar';
import { AuthGuard } from '@/components/AuthGuard';
import { NotificationDropdown } from '@/components/NotificationDropdown';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useGiftCards, GiftCard, useSalon } from '@/hooks';
import { useSalonSettings } from '@/contexts/SalonSettingsContext';
import { SUPPORTED_CURRENCIES, CurrencyCode } from '@/lib/i18n';

const presetAmounts = [25, 50, 75, 100, 150, 200];

function GiftCardsContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedCard, setSelectedCard] = useState<GiftCard | null>(null);
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Balance check state
  const [balanceCode, setBalanceCode] = useState('');
  const [balanceResult, setBalanceResult] = useState<{ balance: number; expiresAt: string | null } | null>(null);
  const [balanceError, setBalanceError] = useState('');
  const [checkingBalance, setCheckingBalance] = useState(false);

  // Redeem state
  const [redeemCode, setRedeemCode] = useState('');
  const [redeemAmount, setRedeemAmount] = useState('');
  const [redeemError, setRedeemError] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);

  // API hooks
  const { giftCards, loading, error, createGiftCard, checkBalance, redeemGiftCard, fetchGiftCards } = useGiftCards();
  const { salon } = useSalon();
  const { formatPrice, currency } = useSalonSettings();
  const currencySymbol = SUPPORTED_CURRENCIES[currency as CurrencyCode]?.symbol || '$';

  // Build dynamic share URL based on salon slug
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://peacase.com';
  const salonSlug = salon?.slug || 'my-salon';
  const shareUrl = `${baseUrl}/${salonSlug}/gift-cards`;

  // Form state
  const [formData, setFormData] = useState({
    amount: 50,
    customAmount: '',
    purchaserName: '',
    purchaserEmail: '',
    recipientName: '',
    recipientEmail: '',
    message: '',
    deliveryMethod: 'email' as 'email' | 'print',
  });

  // Map API status to UI display
  const mapStatus = (status: string): 'active' | 'redeemed' | 'expired' | 'cancelled' => {
    const statusMap: Record<string, 'active' | 'redeemed' | 'expired' | 'cancelled'> = {
      'ACTIVE': 'active',
      'REDEEMED': 'redeemed',
      'EXPIRED': 'expired',
      'CANCELLED': 'cancelled',
    };
    return statusMap[status.toUpperCase()] || 'active';
  };

  // Format date for display
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const activeCards = giftCards.filter(c => mapStatus(c.status) === 'active');
  const totalOutstanding = activeCards.reduce((sum, c) => sum + c.balance, 0);
  const totalSold = giftCards.reduce((sum, c) => sum + c.initialAmount, 0);

  const stats = [
    { label: 'Cards Sold', value: giftCards.length.toString(), icon: Gift, color: 'bg-sage' },
    { label: 'Revenue', value: formatPrice(totalSold), icon: DollarSign, color: 'bg-lavender' },
    { label: 'Outstanding', value: formatPrice(totalOutstanding), icon: CreditCard, color: 'bg-peach' },
    { label: 'Active', value: activeCards.length.toString(), icon: TrendingUp, color: 'bg-mint' },
  ];

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleShareLink = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Purchase a Gift Card',
        text: 'Give the gift of relaxation!',
        url: shareUrl,
      });
    } else {
      handleCopyLink();
    }
  };

  const handleViewDetails = (card: GiftCard) => {
    setSelectedCard(card);
    setShowDetailsModal(true);
    setActionMenu(null);
  };

  const handlePrint = (card: GiftCard) => {
    setActionMenu(null);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const salonName = salon?.name || 'Peacase Spa';
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Gift Card - ${card.code}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@400;500;600&display=swap');
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Inter', sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              background: #f5f5f5;
              padding: 20px;
            }
            .gift-card {
              width: 400px;
              background: linear-gradient(135deg, #a8c5a0 0%, #c5b8d6 100%);
              border-radius: 20px;
              padding: 40px;
              box-shadow: 0 10px 40px rgba(0,0,0,0.1);
              color: #2d3436;
            }
            .salon-name {
              font-family: 'Playfair Display', serif;
              font-size: 24px;
              font-weight: 700;
              margin-bottom: 8px;
            }
            .subtitle {
              font-size: 12px;
              text-transform: uppercase;
              letter-spacing: 2px;
              opacity: 0.8;
              margin-bottom: 40px;
            }
            .amount {
              font-family: 'Playfair Display', serif;
              font-size: 56px;
              font-weight: 700;
              margin-bottom: 8px;
            }
            .amount-label {
              font-size: 14px;
              opacity: 0.8;
              margin-bottom: 30px;
            }
            .code-label {
              font-size: 12px;
              text-transform: uppercase;
              letter-spacing: 1px;
              opacity: 0.7;
              margin-bottom: 8px;
            }
            .code {
              font-family: monospace;
              font-size: 28px;
              font-weight: 600;
              letter-spacing: 3px;
              margin-bottom: 30px;
            }
            .recipient {
              font-size: 14px;
              opacity: 0.8;
            }
            .recipient-name {
              font-size: 18px;
              font-weight: 600;
              margin-top: 4px;
            }
            .message {
              margin-top: 20px;
              padding: 15px;
              background: rgba(255,255,255,0.3);
              border-radius: 10px;
              font-style: italic;
              font-size: 14px;
            }
            .footer {
              margin-top: 30px;
              font-size: 11px;
              opacity: 0.7;
              text-align: center;
            }
            @media print {
              body { background: white; }
              .gift-card { box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <div class="gift-card">
            <div class="salon-name">${salonName}</div>
            <div class="subtitle">Gift Card</div>
            <div class="amount">${currencySymbol}${card.balance}</div>
            <div class="amount-label">Available Balance</div>
            <div class="code-label">Card Code</div>
            <div class="code">${card.code}</div>
            ${card.recipientName ? `
              <div class="recipient">For</div>
              <div class="recipient-name">${card.recipientName}</div>
            ` : ''}
            ${card.message ? `<div class="message">"${card.message}"</div>` : ''}
            <div class="footer">
              Present this card at checkout or enter the code online.<br>
              This gift card does not expire.
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleCreateGiftCard = async () => {
    setIsSubmitting(true);
    try {
      const amount = formData.customAmount ? parseInt(formData.customAmount) : formData.amount;
      const newCard = await createGiftCard({
        amount,
        purchaserEmail: formData.purchaserEmail || undefined,
        recipientEmail: formData.recipientEmail || undefined,
        recipientName: formData.recipientName || undefined,
        message: formData.message || undefined,
      });

      if (newCard) {
        setShowModal(false);
        resetForm();
        showSuccess(`Gift card created! Code: ${newCard.code}`);
      }
    } catch (err) {
      showSuccess('Failed to create gift card. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckBalance = async () => {
    if (!balanceCode.trim()) {
      setBalanceError('Please enter a gift card code');
      return;
    }

    setCheckingBalance(true);
    setBalanceError('');
    setBalanceResult(null);

    try {
      const result = await checkBalance(balanceCode.trim());
      if (result) {
        setBalanceResult(result);
      } else {
        setBalanceError('Gift card not found');
      }
    } catch (err) {
      setBalanceError('Gift card not found or invalid code');
    } finally {
      setCheckingBalance(false);
    }
  };

  const handleRedeemGiftCard = async () => {
    if (!redeemCode.trim()) {
      setRedeemError('Please enter a gift card code');
      return;
    }
    if (!redeemAmount || parseFloat(redeemAmount) <= 0) {
      setRedeemError('Please enter a valid amount');
      return;
    }

    setIsRedeeming(true);
    setRedeemError('');

    try {
      const result = await redeemGiftCard(redeemCode.trim(), parseFloat(redeemAmount));
      if (result) {
        setShowRedeemModal(false);
        setRedeemCode('');
        setRedeemAmount('');
        showSuccess(`Successfully redeemed $${redeemAmount} from gift card`);
      }
    } catch (err) {
      setRedeemError('Failed to redeem gift card. Check the code and amount.');
    } finally {
      setIsRedeeming(false);
    }
  };

  const handleResendEmail = (card: GiftCard) => {
    setActionMenu(null);
    showSuccess(`Gift card resent to ${card.recipientEmail || card.purchaserEmail || 'recipient'}`);
  };

  const resetForm = () => {
    setFormData({
      amount: 50,
      customAmount: '',
      purchaserName: '',
      purchaserEmail: '',
      recipientName: '',
      recipientEmail: '',
      message: '',
      deliveryMethod: 'email',
    });
  };

  const resetBalanceModal = () => {
    setBalanceCode('');
    setBalanceResult(null);
    setBalanceError('');
  };

  const resetRedeemModal = () => {
    setRedeemCode('');
    setRedeemAmount('');
    setRedeemError('');
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-cream dark:bg-charcoal flex">
        <AppSidebar currentPage="gift-cards" sidebarOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-sage animate-spin mx-auto mb-4" />
            <p className="text-charcoal/60 dark:text-white/60">Loading gift cards...</p>
          </div>
        </main>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-cream dark:bg-charcoal flex">
        <AppSidebar currentPage="gift-cards" sidebarOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center bg-white dark:bg-sidebar p-8 rounded-2xl shadow-soft max-w-md">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-charcoal dark:text-white mb-2">Failed to load gift cards</h2>
            <p className="text-charcoal/60 dark:text-white/60 mb-4">{error}</p>
            <button
              onClick={() => fetchGiftCards()}
              className="flex items-center gap-2 px-4 py-2 bg-sage text-white rounded-xl font-medium hover:bg-sage-dark mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream dark:bg-charcoal flex">
      <AppSidebar currentPage="gift-cards" sidebarOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 flex flex-col min-w-0">
        <header className="bg-white dark:bg-sidebar border-b border-charcoal/10 dark:border-white/10 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(true)} className="p-2 text-charcoal/60 dark:text-white/60 hover:text-charcoal dark:hover:text-white lg:hidden">
                <Menu className="w-6 h-6" />
              </button>
              <h1 className="text-2xl font-bold text-charcoal dark:text-white">Gift Cards</h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowBalanceModal(true)}
                className="flex items-center gap-2 px-4 py-2 border border-charcoal/20 dark:border-white/20 rounded-xl font-medium hover:border-sage transition-colors text-charcoal dark:text-white"
              >
                <Search className="w-5 h-5" />
                <span className="hidden sm:inline">Check Balance</span>
              </button>
              <button
                onClick={() => setShowRedeemModal(true)}
                className="flex items-center gap-2 px-4 py-2 border border-charcoal/20 dark:border-white/20 rounded-xl font-medium hover:border-sage transition-colors text-charcoal dark:text-white"
              >
                <CreditCard className="w-5 h-5" />
                <span className="hidden sm:inline">Redeem</span>
              </button>
              <ThemeToggle />
              <NotificationDropdown />
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-sage text-white rounded-xl font-medium hover:bg-sage-dark transition-all"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">Create Gift Card</span>
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 p-6 overflow-auto">
          <FeatureGate feature="gift_cards">
            {/* Success Message */}
            {successMessage && (
              <div className="fixed top-6 right-6 bg-sage text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 z-50 animate-in slide-in-from-top">
                <Check className="w-5 h-5" />
                {successMessage}
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="bg-white dark:bg-sidebar rounded-2xl p-6 border border-charcoal/5 dark:border-white/10 shadow-soft">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-charcoal dark:text-white mb-1">{stat.value}</p>
                    <p className="text-sm text-charcoal/60 dark:text-white/60">{stat.label}</p>
                  </div>
                );
              })}
            </div>

            {/* Share Link */}
            <div className="bg-gradient-to-br from-sage/10 to-lavender/10 dark:from-sage/20 dark:to-lavender/20 rounded-2xl p-6 border border-sage/20 mb-6">
              <h3 className="font-semibold text-charcoal dark:text-white mb-2">Share Your Gift Card Store</h3>
              <p className="text-sm text-charcoal/60 dark:text-white/60 mb-4">Let clients purchase gift cards online anytime</p>
              <div className="flex gap-3 flex-wrap">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 min-w-[200px] px-4 py-3 rounded-xl bg-white dark:bg-charcoal border border-charcoal/10 dark:border-white/10 text-charcoal/70 dark:text-white/70 text-sm"
                />
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-2 px-4 py-3 bg-sage text-white rounded-xl font-medium hover:bg-sage-dark transition-colors"
                >
                  {linkCopied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  {linkCopied ? 'Copied!' : 'Copy'}
                </button>
                <button
                  onClick={handleShareLink}
                  className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-sidebar border border-charcoal/20 dark:border-white/20 rounded-xl font-medium hover:border-sage transition-colors text-charcoal dark:text-white"
                >
                  <Send className="w-5 h-5" />
                  Share
                </button>
              </div>
            </div>

            {/* Quick Tips */}
            <div className="bg-white dark:bg-sidebar rounded-2xl p-6 border border-charcoal/5 dark:border-white/10 shadow-soft mb-6">
              <h3 className="font-semibold text-charcoal dark:text-white mb-3">Gift Card Tips</h3>
              <ul className="text-sm text-charcoal/70 dark:text-white/70 space-y-2">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-sage mt-0.5 flex-shrink-0" />
                  <span>Share your gift card store link on social media during holidays</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-sage mt-0.5 flex-shrink-0" />
                  <span>Gift cards never expire and can be redeemed for any service</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-sage mt-0.5 flex-shrink-0" />
                  <span>Clients can check their balance online or at checkout</span>
                </li>
              </ul>
            </div>

            {/* Gift Cards List */}
            <div className="bg-white dark:bg-sidebar rounded-2xl border border-charcoal/5 dark:border-white/10 shadow-soft">
              <div className="p-6 border-b border-charcoal/10 dark:border-white/10">
                <h2 className="text-lg font-semibold text-charcoal dark:text-white">All Gift Cards</h2>
                <p className="text-sm text-charcoal/60 dark:text-white/60">Track and manage gift card balances</p>
              </div>

              {giftCards.length === 0 ? (
                <div className="p-12 text-center">
                  <Gift className="w-12 h-12 text-charcoal/20 dark:text-white/20 mx-auto mb-4" />
                  <p className="text-charcoal/60 dark:text-white/60 mb-4">No gift cards yet</p>
                  <button
                    onClick={() => setShowModal(true)}
                    className="px-4 py-2 bg-sage text-white rounded-xl font-medium hover:bg-sage-dark"
                  >
                    Create Your First Gift Card
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-charcoal/10 dark:border-white/10">
                        <th className="text-left px-6 py-4 text-sm font-semibold text-charcoal/60 dark:text-white/60">Code</th>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-charcoal/60 dark:text-white/60">Amount</th>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-charcoal/60 dark:text-white/60">Balance</th>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-charcoal/60 dark:text-white/60">Recipient</th>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-charcoal/60 dark:text-white/60">Status</th>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-charcoal/60 dark:text-white/60">Date</th>
                        <th className="text-right px-6 py-4"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-charcoal/10 dark:divide-white/10">
                      {giftCards.map((card) => {
                        const status = mapStatus(card.status);
                        return (
                          <tr key={card.id} className="hover:bg-cream/50 dark:hover:bg-white/5 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-sage/20 flex items-center justify-center">
                                  <Gift className="w-5 h-5 text-sage" />
                                </div>
                                <span className="font-mono font-medium text-charcoal dark:text-white">{card.code}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 font-medium text-charcoal dark:text-white">{formatPrice(card.initialAmount)}</td>
                            <td className="px-6 py-4 font-medium text-charcoal dark:text-white">{formatPrice(card.balance)}</td>
                            <td className="px-6 py-4 text-charcoal dark:text-white">
                              {card.recipientName || card.recipientEmail || card.purchaserEmail || 'N/A'}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                                status === 'active' ? 'bg-sage/20 text-sage-dark' :
                                status === 'redeemed' ? 'bg-lavender/20 text-lavender-dark' :
                                status === 'cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                'bg-charcoal/10 dark:bg-white/10 text-charcoal/60 dark:text-white/60'
                              }`}>
                                {status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-charcoal/60 dark:text-white/60">{formatDate(card.purchasedAt)}</td>
                            <td className="px-6 py-4 text-right relative">
                              <button
                                onClick={() => setActionMenu(actionMenu === card.id ? null : card.id)}
                                className="p-2 text-charcoal/40 dark:text-white/40 hover:text-charcoal dark:hover:text-white"
                              >
                                <MoreHorizontal className="w-5 h-5" />
                              </button>

                              {actionMenu === card.id && (
                                <div className="absolute right-6 top-full mt-1 w-48 bg-white dark:bg-sidebar rounded-xl shadow-lg border border-charcoal/10 dark:border-white/10 py-2 z-10">
                                  <button
                                    onClick={() => handleViewDetails(card)}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-sage/5 dark:hover:bg-white/5 flex items-center gap-2 text-charcoal dark:text-white"
                                  >
                                    <Eye className="w-4 h-4" />
                                    View details
                                  </button>
                                  {status === 'active' && (
                                    <>
                                      <button
                                        onClick={() => handleResendEmail(card)}
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-sage/5 dark:hover:bg-white/5 flex items-center gap-2 text-charcoal dark:text-white"
                                      >
                                        <Mail className="w-4 h-4" />
                                        Resend email
                                      </button>
                                      <button
                                        onClick={() => handlePrint(card)}
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-sage/5 dark:hover:bg-white/5 flex items-center gap-2 text-charcoal dark:text-white"
                                      >
                                        <Printer className="w-4 h-4" />
                                        Print card
                                      </button>
                                    </>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </FeatureGate>
        </div>
      </main>

      {/* Create Gift Card Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-charcoal/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-sidebar rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-charcoal/10 dark:border-white/10 flex items-center justify-between sticky top-0 bg-white dark:bg-sidebar">
              <h2 className="text-xl font-semibold text-charcoal dark:text-white">Create Gift Card</h2>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="p-2 hover:bg-charcoal/5 dark:hover:bg-white/5 rounded-lg">
                <X className="w-5 h-5 text-charcoal/60 dark:text-white/60" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Amount Selection */}
              <div>
                <label className="block text-sm font-medium text-charcoal dark:text-white mb-3">Gift Card Amount</label>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {presetAmounts.map((amount) => (
                    <button
                      key={amount}
                      onClick={() => { setFormData({ ...formData, amount, customAmount: '' }); }}
                      className={`px-4 py-3 rounded-xl font-medium transition-all ${
                        formData.amount === amount && !formData.customAmount
                          ? 'bg-sage text-white'
                          : 'bg-charcoal/5 dark:bg-white/5 text-charcoal dark:text-white hover:bg-charcoal/10 dark:hover:bg-white/10'
                      }`}
                    >
                      {currencySymbol}{amount}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal/40 dark:text-white/40">{currencySymbol}</span>
                  <input
                    type="number"
                    placeholder="Custom amount"
                    value={formData.customAmount}
                    onChange={(e) => setFormData({ ...formData, customAmount: e.target.value })}
                    className="w-full pl-8 pr-4 py-3 border border-charcoal/20 dark:border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage bg-white dark:bg-charcoal text-charcoal dark:text-white placeholder:text-charcoal/40 dark:placeholder:text-white/40"
                  />
                </div>
              </div>

              {/* Purchaser Info */}
              <div>
                <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">Purchaser Email</label>
                <input
                  type="email"
                  placeholder="Enter email"
                  value={formData.purchaserEmail}
                  onChange={(e) => setFormData({ ...formData, purchaserEmail: e.target.value })}
                  className="w-full px-4 py-3 border border-charcoal/20 dark:border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage bg-white dark:bg-charcoal text-charcoal dark:text-white placeholder:text-charcoal/40 dark:placeholder:text-white/40"
                />
              </div>

              {/* Delivery Method */}
              <div>
                <label className="block text-sm font-medium text-charcoal dark:text-white mb-3">Delivery Method</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setFormData({ ...formData, deliveryMethod: 'email' })}
                    className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                      formData.deliveryMethod === 'email'
                        ? 'border-sage bg-sage/5'
                        : 'border-charcoal/10 dark:border-white/10 hover:border-charcoal/20 dark:hover:border-white/20'
                    }`}
                  >
                    <Mail className={`w-6 h-6 ${formData.deliveryMethod === 'email' ? 'text-sage' : 'text-charcoal/40 dark:text-white/40'}`} />
                    <span className="font-medium text-charcoal dark:text-white">Email</span>
                    <span className="text-xs text-charcoal/60 dark:text-white/60">Send digitally</span>
                  </button>
                  <button
                    onClick={() => setFormData({ ...formData, deliveryMethod: 'print' })}
                    className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                      formData.deliveryMethod === 'print'
                        ? 'border-sage bg-sage/5'
                        : 'border-charcoal/10 dark:border-white/10 hover:border-charcoal/20 dark:hover:border-white/20'
                    }`}
                  >
                    <Printer className={`w-6 h-6 ${formData.deliveryMethod === 'print' ? 'text-sage' : 'text-charcoal/40 dark:text-white/40'}`} />
                    <span className="font-medium text-charcoal dark:text-white">Print</span>
                    <span className="text-xs text-charcoal/60 dark:text-white/60">Physical card</span>
                  </button>
                </div>
              </div>

              {/* Recipient Info (for email) */}
              {formData.deliveryMethod === 'email' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">Recipient Name</label>
                    <input
                      type="text"
                      placeholder="Who is this gift for?"
                      value={formData.recipientName}
                      onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                      className="w-full px-4 py-3 border border-charcoal/20 dark:border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage bg-white dark:bg-charcoal text-charcoal dark:text-white placeholder:text-charcoal/40 dark:placeholder:text-white/40"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">Recipient Email</label>
                    <input
                      type="email"
                      placeholder="Email to send gift card to"
                      value={formData.recipientEmail}
                      onChange={(e) => setFormData({ ...formData, recipientEmail: e.target.value })}
                      className="w-full px-4 py-3 border border-charcoal/20 dark:border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage bg-white dark:bg-charcoal text-charcoal dark:text-white placeholder:text-charcoal/40 dark:placeholder:text-white/40"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">Personal Message (optional)</label>
                    <textarea
                      placeholder="Add a personal message..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 border border-charcoal/20 dark:border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage resize-none bg-white dark:bg-charcoal text-charcoal dark:text-white placeholder:text-charcoal/40 dark:placeholder:text-white/40"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-charcoal/10 dark:border-white/10 flex gap-3 justify-end sticky bottom-0 bg-white dark:bg-sidebar">
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                className="px-6 py-2 text-charcoal/60 dark:text-white/60 hover:text-charcoal dark:hover:text-white font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateGiftCard}
                disabled={isSubmitting}
                className="px-6 py-2 bg-sage text-white rounded-xl font-medium hover:bg-sage-dark flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Gift className="w-4 h-4" />
                )}
                Create {currencySymbol}{formData.customAmount || formData.amount} Gift Card
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Check Balance Modal */}
      {showBalanceModal && (
        <div className="fixed inset-0 bg-charcoal/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-sidebar rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-6 border-b border-charcoal/10 dark:border-white/10 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-charcoal dark:text-white">Check Gift Card Balance</h2>
              <button onClick={() => { setShowBalanceModal(false); resetBalanceModal(); }} className="p-2 hover:bg-charcoal/5 dark:hover:bg-white/5 rounded-lg">
                <X className="w-5 h-5 text-charcoal/60 dark:text-white/60" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">Gift Card Code</label>
                <input
                  type="text"
                  placeholder="Enter gift card code"
                  value={balanceCode}
                  onChange={(e) => setBalanceCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 border border-charcoal/20 dark:border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage font-mono bg-white dark:bg-charcoal text-charcoal dark:text-white placeholder:text-charcoal/40 dark:placeholder:text-white/40"
                />
              </div>

              {balanceError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
                  {balanceError}
                </div>
              )}

              {balanceResult && (
                <div className="p-4 bg-sage/10 border border-sage/20 rounded-xl">
                  <p className="text-sm text-charcoal/60 dark:text-white/60 mb-1">Current Balance</p>
                  <p className="text-3xl font-bold text-sage">{formatPrice(balanceResult.balance)}</p>
                  {balanceResult.expiresAt && (
                    <p className="text-sm text-charcoal/60 dark:text-white/60 mt-2">
                      Expires: {new Date(balanceResult.expiresAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-charcoal/10 dark:border-white/10 flex gap-3 justify-end">
              <button
                onClick={() => { setShowBalanceModal(false); resetBalanceModal(); }}
                className="px-6 py-2 text-charcoal/60 dark:text-white/60 hover:text-charcoal dark:hover:text-white font-medium"
              >
                Close
              </button>
              <button
                onClick={handleCheckBalance}
                disabled={checkingBalance}
                className="px-6 py-2 bg-sage text-white rounded-xl font-medium hover:bg-sage-dark flex items-center gap-2 disabled:opacity-50"
              >
                {checkingBalance ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                Check Balance
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Redeem Gift Card Modal */}
      {showRedeemModal && (
        <div className="fixed inset-0 bg-charcoal/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-sidebar rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-6 border-b border-charcoal/10 dark:border-white/10 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-charcoal dark:text-white">Redeem Gift Card</h2>
              <button onClick={() => { setShowRedeemModal(false); resetRedeemModal(); }} className="p-2 hover:bg-charcoal/5 dark:hover:bg-white/5 rounded-lg">
                <X className="w-5 h-5 text-charcoal/60 dark:text-white/60" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">Gift Card Code</label>
                <input
                  type="text"
                  placeholder="Enter gift card code"
                  value={redeemCode}
                  onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 border border-charcoal/20 dark:border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage font-mono bg-white dark:bg-charcoal text-charcoal dark:text-white placeholder:text-charcoal/40 dark:placeholder:text-white/40"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">Amount to Redeem</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal/40 dark:text-white/40">{currencySymbol}</span>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={redeemAmount}
                    onChange={(e) => setRedeemAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-3 border border-charcoal/20 dark:border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage bg-white dark:bg-charcoal text-charcoal dark:text-white placeholder:text-charcoal/40 dark:placeholder:text-white/40"
                  />
                </div>
              </div>

              {redeemError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
                  {redeemError}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-charcoal/10 dark:border-white/10 flex gap-3 justify-end">
              <button
                onClick={() => { setShowRedeemModal(false); resetRedeemModal(); }}
                className="px-6 py-2 text-charcoal/60 dark:text-white/60 hover:text-charcoal dark:hover:text-white font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleRedeemGiftCard}
                disabled={isRedeeming}
                className="px-6 py-2 bg-sage text-white rounded-xl font-medium hover:bg-sage-dark flex items-center gap-2 disabled:opacity-50"
              >
                {isRedeeming ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CreditCard className="w-4 h-4" />
                )}
                Redeem
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {showDetailsModal && selectedCard && (
        <div className="fixed inset-0 bg-charcoal/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-sidebar rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-charcoal/10 dark:border-white/10 flex items-center justify-between sticky top-0 bg-white dark:bg-sidebar">
              <h2 className="text-xl font-semibold text-charcoal dark:text-white">Gift Card Details</h2>
              <button onClick={() => { setShowDetailsModal(false); setSelectedCard(null); }} className="p-2 hover:bg-charcoal/5 dark:hover:bg-white/5 rounded-lg">
                <X className="w-5 h-5 text-charcoal/60 dark:text-white/60" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Card Preview */}
              <div className="bg-gradient-to-br from-sage/30 to-lavender/30 rounded-2xl p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-white/50 dark:bg-white/30 flex items-center justify-center mx-auto mb-4">
                  <Gift className="w-8 h-8 text-sage" />
                </div>
                <p className="text-4xl font-bold text-charcoal dark:text-white mb-1">{formatPrice(selectedCard.balance)}</p>
                <p className="text-sm text-charcoal/60 dark:text-white/60">Current Balance</p>
                <p className="font-mono text-lg font-semibold text-charcoal dark:text-white mt-4">{selectedCard.code}</p>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-charcoal/5 dark:bg-white/5 rounded-xl p-4">
                  <p className="text-xs text-charcoal/60 dark:text-white/60 uppercase tracking-wide mb-1">Original Amount</p>
                  <p className="text-lg font-semibold text-charcoal dark:text-white">{formatPrice(selectedCard.initialAmount)}</p>
                </div>
                <div className="bg-charcoal/5 dark:bg-white/5 rounded-xl p-4">
                  <p className="text-xs text-charcoal/60 dark:text-white/60 uppercase tracking-wide mb-1">Status</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium capitalize ${
                    mapStatus(selectedCard.status) === 'active' ? 'bg-sage/20 text-sage-dark' :
                    mapStatus(selectedCard.status) === 'redeemed' ? 'bg-lavender/20 text-lavender-dark' :
                    mapStatus(selectedCard.status) === 'cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                    'bg-charcoal/10 dark:bg-white/10 text-charcoal/60 dark:text-white/60'
                  }`}>
                    {mapStatus(selectedCard.status)}
                  </span>
                </div>
                <div className="bg-charcoal/5 dark:bg-white/5 rounded-xl p-4">
                  <p className="text-xs text-charcoal/60 dark:text-white/60 uppercase tracking-wide mb-1">Purchased</p>
                  <p className="text-sm font-medium text-charcoal dark:text-white">{new Date(selectedCard.purchasedAt).toLocaleDateString()}</p>
                </div>
                <div className="bg-charcoal/5 dark:bg-white/5 rounded-xl p-4">
                  <p className="text-xs text-charcoal/60 dark:text-white/60 uppercase tracking-wide mb-1">Expires</p>
                  <p className="text-sm font-medium text-charcoal dark:text-white">
                    {selectedCard.expiresAt ? new Date(selectedCard.expiresAt).toLocaleDateString() : 'Never'}
                  </p>
                </div>
              </div>

              {/* Recipient Info */}
              {(selectedCard.recipientName || selectedCard.recipientEmail) && (
                <div className="border border-charcoal/10 dark:border-white/10 rounded-xl p-4">
                  <p className="text-xs text-charcoal/60 dark:text-white/60 uppercase tracking-wide mb-2">Recipient</p>
                  {selectedCard.recipientName && (
                    <p className="font-medium text-charcoal dark:text-white">{selectedCard.recipientName}</p>
                  )}
                  {selectedCard.recipientEmail && (
                    <p className="text-sm text-charcoal/60 dark:text-white/60">{selectedCard.recipientEmail}</p>
                  )}
                </div>
              )}

              {/* Purchaser Info */}
              {selectedCard.purchaserEmail && (
                <div className="border border-charcoal/10 dark:border-white/10 rounded-xl p-4">
                  <p className="text-xs text-charcoal/60 dark:text-white/60 uppercase tracking-wide mb-2">Purchaser</p>
                  <p className="text-sm text-charcoal dark:text-white">{selectedCard.purchaserEmail}</p>
                </div>
              )}

              {/* Message */}
              {selectedCard.message && (
                <div className="border border-charcoal/10 dark:border-white/10 rounded-xl p-4">
                  <p className="text-xs text-charcoal/60 dark:text-white/60 uppercase tracking-wide mb-2">Personal Message</p>
                  <p className="text-charcoal dark:text-white italic">"{selectedCard.message}"</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-charcoal/10 dark:border-white/10 flex gap-3 justify-end sticky bottom-0 bg-white dark:bg-sidebar">
              <button
                onClick={() => { setShowDetailsModal(false); setSelectedCard(null); }}
                className="px-6 py-2 text-charcoal/60 dark:text-white/60 hover:text-charcoal dark:hover:text-white font-medium"
              >
                Close
              </button>
              {mapStatus(selectedCard.status) === 'active' && (
                <button
                  onClick={() => {
                    handlePrint(selectedCard);
                    setShowDetailsModal(false);
                    setSelectedCard(null);
                  }}
                  className="px-6 py-2 bg-sage text-white rounded-xl font-medium hover:bg-sage-dark flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Print Card
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close action menu */}
      {actionMenu && (
        <div className="fixed inset-0 z-[5]" onClick={() => setActionMenu(null)} />
      )}
    </div>
  );
}

export default function GiftCardsPage() {
  return (
    <AuthGuard>
      <GiftCardsContent />
    </AuthGuard>
  );
}
