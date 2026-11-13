import { ZoomIn, ImageOff } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function ProductImage({ src, name }: { src: string; name: string }) {
  const { t } = useI18n();
  if (!src) return <div className="grid aspect-[3/4] place-items-center bg-muted text-muted-foreground"><ImageOff /><span>{t('noImage')}</span></div>;
  return <Dialog><div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-muted"><img src={src} alt={name} className="h-full w-full object-cover" /><DialogTrigger asChild><Button variant="secondary" size="icon" aria-label={t('zoomImage')} title={t('zoomImage')} className="glass-pill absolute bottom-3 right-3 rounded-full"><ZoomIn /></Button></DialogTrigger></div><DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-3xl overflow-auto"><DialogTitle className="pr-7">{name}</DialogTitle><img src={src} alt={name} className="mx-auto max-h-[75dvh] w-full object-contain" /></DialogContent></Dialog>;
}