import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Gift, CheckCircle, Mail, Copy, ArrowRight, LinkIcon, Share2, Sparkles, PartyPopper, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

export default function GiftSuccess() {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const giftCode = searchParams.get('code') || '';
  const deliveryMethod = searchParams.get('delivery') || 'email';
  const recipientCount = parseInt(searchParams.get('count') || '1', 10);

  const redeemUrl = `${window.location.origin}/redeem?code=${giftCode}`;
  const isMultiRecipient = recipientCount > 1;

  const copyCode = () => {
    navigator.clipboard.writeText(giftCode);
    toast.success(t('giftSuccess.codeCopied'));
  };

  const copyLink = () => {
    navigator.clipboard.writeText(redeemUrl);
    toast.success(t('giftSuccess.linkCopied'));
  };

  const shareGift = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: t('giftSuccess.shareTitle'),
          text: t('giftSuccess.shareText'),
          url: redeemUrl,
        });
      } catch (err) {
        copyLink();
      }
    } else {
      copyLink();
    }
  };

  const isLinkDelivery = deliveryMethod === 'link';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: '#FFFDF5' }}>

      <div className="w-full max-w-md relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8 text-center"
        >
          {/* Success Animation */}
          <div className="relative">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2, stiffness: 200 }}
              className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 mx-auto shadow-2xl shadow-green-500/30"
            >
              <CheckCircle className="w-12 h-12 text-white" />
            </motion.div>

            {/* Celebration particles */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="absolute -top-2 -right-2"
            >
              <PartyPopper className="w-8 h-8 text-[#c4a265]" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
              className="absolute -bottom-1 -left-2"
            >
              <Sparkles className="w-6 h-6 text-[#c4a265]" />
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-3"
          >
            <h1 className="text-3xl md:text-4xl font-display font-bold text-[#3d2f2a] font-serif">
              {t('giftSuccess.title')}
            </h1>
            <p className="text-[#9a8578] text-lg">
              {isMultiRecipient
                ? `${recipientCount} cosmic gifts are on their way!`
                : isLinkDelivery
                  ? t('giftSuccess.subtitleLink')
                  : t('giftSuccess.subtitleEmail')}
            </p>
          </motion.div>

          {/* Multi-recipient indicator */}
          {isMultiRecipient && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.35 }}
              className="flex items-center justify-center gap-2 text-[#c4a265]"
            >
              <Users className="w-5 h-5" />
              <span className="text-sm font-medium">
                Separate emails sent to {recipientCount} recipients
              </span>
            </motion.div>
          )}

          {/* Link Delivery Card */}
          {giftCode && isLinkDelivery && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="p-6 rounded-2xl bg-white border border-[#e8ddd0] shadow-sm space-y-4"
            >
              <div className="flex items-center justify-center gap-2 text-[#c4a265]">
                <LinkIcon className="w-5 h-5" />
                <p className="text-sm font-semibold">{t('giftSuccess.shareableLink')}</p>
              </div>
              <div className="p-4 rounded-xl bg-[#faf6ef] border border-[#e8ddd0]">
                <p className="text-sm font-mono text-[#3d2f2a] break-all">{redeemUrl}</p>
              </div>
              <div className="flex gap-3">
                <Button onClick={copyLink} variant="outline" className="flex-1 border-[#e8ddd0]">
                  <Copy className="w-4 h-4 mr-2" />
                  {t('giftSuccess.copyLink')}
                </Button>
                <Button onClick={shareGift} className="flex-1 bg-gradient-to-r from-[#c4a265] to-[#8b6f3a] text-white font-semibold hover:opacity-90">
                  <Share2 className="w-4 h-4 mr-2" />
                  {t('giftSuccess.share')}
                </Button>
              </div>
              <div className="pt-2 border-t border-[#e8ddd0]">
                <p className="text-xs text-[#9a8578]">
                  {t('giftSuccess.giftCode')}: <span className="font-mono font-bold text-[#3d2f2a]">{giftCode}</span>
                </p>
              </div>
            </motion.div>
          )}

          {/* Email Delivery Card */}
          {giftCode && !isLinkDelivery && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="p-6 rounded-2xl bg-white border border-[#e8ddd0] shadow-sm"
            >
              <p className="text-sm text-[#9a8578] mb-3">
                {isMultiRecipient ? 'Primary gift code' : t('giftSuccess.giftCode')}
              </p>
              <div className="flex items-center justify-center gap-4 p-4 rounded-xl bg-[#faf6ef] border border-[#e8ddd0]">
                <p className="text-2xl md:text-3xl font-mono font-bold text-[#3d2f2a] tracking-widest">
                  {giftCode}
                </p>
                <button
                  onClick={copyCode}
                  className="p-2.5 rounded-lg hover:bg-[#faf6ef] transition-colors border border-[#e8ddd0]"
                >
                  <Copy className="w-5 h-5 text-[#9a8578] hover:text-[#3d2f2a]" />
                </button>
              </div>
              <p className="text-xs text-[#c4a265] mt-3 flex items-center justify-center gap-2">
                <Mail className="w-4 h-4" />
                {isMultiRecipient
                  ? `Emails sent to ${recipientCount} recipients`
                  : 'Email sent to recipient'}
              </p>
            </motion.div>
          )}

          {/* What's Next */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="p-5 rounded-xl bg-white border border-[#e8ddd0] space-y-3 text-left"
          >
            <p className="text-sm font-semibold text-[#3d2f2a] flex items-center gap-2">
              {isLinkDelivery ? <LinkIcon className="w-4 h-4 text-[#c4a265]" /> : <Mail className="w-4 h-4 text-[#c4a265]" />}
              {t('giftSuccess.whatsNext')}
            </p>
            <ul className="text-sm text-[#5a4a42] space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-[#c4a265] font-bold">1.</span>
                {t('giftSuccess.step1')}
              </li>
              {isLinkDelivery ? (
                <>
                  <li className="flex items-start gap-2">
                    <span className="text-[#c4a265] font-bold">2.</span>
                    {t('giftSuccess.step2Link')}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#c4a265] font-bold">3.</span>
                    {t('giftSuccess.step3Link')}
                  </li>
                </>
              ) : (
                <>
                  <li className="flex items-start gap-2">
                    <span className="text-[#c4a265] font-bold">2.</span>
                    {isMultiRecipient
                      ? 'Each recipient gets their own unique gift code via email'
                      : t('giftSuccess.step2Email')}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#c4a265] font-bold">3.</span>
                    {t('giftSuccess.step3Email')}
                  </li>
                </>
              )}
            </ul>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="space-y-3"
          >
            <Link to="/gift" className="block">
              <Button size="lg" className="w-full bg-gradient-to-r from-[#c4a265] to-[#8b6f3a] text-white font-semibold py-3 rounded-xl hover:opacity-90">
                <Gift className="w-5 h-5 mr-2" />
                {t('giftSuccess.purchaseAnother')}
              </Button>
            </Link>

            <Link to="/" className="block">
              <Button variant="ghost" className="w-full text-[#9a8578] hover:text-[#3d2f2a]">
                {t('nav.backHome')}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </motion.div>

          <p className="text-xs text-[#9a8578]">
            {t('giftSuccess.questions')}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
