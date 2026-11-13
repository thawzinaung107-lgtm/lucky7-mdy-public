import { useState } from 'react';
import { Copy, MessageCircle } from 'lucide-react';
import type { CartItem } from '@/lib/cart';
import { useI18n } from '@/lib/i18n';
import { buildOrderMessage, telegramOrderUrl } from '@/lib/shopping';
import { STORE_INFO } from '@/lib/storeInfo';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';

export default function TelegramOrder({ items, total, disabled }: { items: CartItem[]; total: number; disabled: boolean }) {
  const { t, language } = useI18n();
  const [notes, setNotes] = useState('');
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const message = buildOrderMessage(items, total, language, notes);
  return <Dialog>
    <DialogTrigger asChild><Button disabled={disabled} className="h-auto w-full whitespace-normal bg-primary-foreground py-3 text-primary hover:bg-accent"><MessageCircle />{t('prepareOrder')}</Button></DialogTrigger>
    <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto">
      <DialogTitle>{t('orderReview')}</DialogTitle><DialogDescription>{t('orderPending')}</DialogDescription>
      <label className="flex flex-col gap-2 text-sm font-semibold">{t('orderNotes')}<textarea value={notes} maxLength={1000} onChange={(event) => { setNotes(event.target.value); setCopyState('idle'); }} className="glass-input min-h-20 rounded-lg p-3 font-normal" /></label>
      <textarea readOnly aria-label={t('orderReview')} value={message} className="glass-input min-h-56 w-full rounded-lg p-3 text-sm" />
      {!STORE_INFO.telegramUrl && <p className="text-sm text-muted-foreground">{t('chooseRecipient')}</p>}
      <div className="grid gap-2 sm:grid-cols-2"><Button variant="outline" className="h-auto whitespace-normal py-3" onClick={async () => { try { await navigator.clipboard.writeText(message); setCopyState('copied'); } catch { setCopyState('failed'); } }}><Copy />{copyState === 'copied' ? t('copiedOrder') : t('copyOrder')}</Button><Button asChild className="h-auto whitespace-normal py-3"><a href={telegramOrderUrl(message, STORE_INFO.telegramUrl)} target="_blank" rel="noopener noreferrer"><MessageCircle />{t('openTelegram')}</a></Button></div>
      {copyState === 'failed' && <p role="status" className="text-sm text-destructive">{t('copyFailed')}</p>}
    </DialogContent>
  </Dialog>;
}