import { useEffect, useState } from 'react';
import { Link } from '@/lib/router';
import { useI18n } from '@/lib/i18n';
import { useAuth, TelegramLoginButton } from '@/lib/auth';

export default function LoginPage() {
  const { t } = useI18n();
  const { profile, ready, signInFailed } = useAuth();

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-6 px-4 py-16">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="gold-rule h-1 w-12 rounded-full" aria-hidden="true" />
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('loginTitle')}</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">{t('loginSubtitle')}</p>
      </div>

      {ready && profile ? (
        <div className="glass-panel flex w-full flex-col items-center gap-4 rounded-[2rem] p-8 text-center">
          <p className="text-sm font-semibold text-foreground">
            {profile.firstName ?? profile.username ?? `TG ${profile.telegramUserId}`}
          </p>
          <p className="text-xs text-muted-foreground">{t('alreadySignedIn')}</p>
          <Link
            to="/cart"
            className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/15 transition hover:-translate-y-0.5 active:scale-95"
          >
            {t('viewCart')}
          </Link>
        </div>
      ) : (
        <div className="glass-panel flex w-full flex-col items-center gap-4 rounded-[2rem] p-8 text-center">
          {signInFailed && <p className="text-sm text-destructive">{t('loginFailed')}</p>}
          <TelegramLoginButton />
          <p className="text-xs leading-relaxed text-muted-foreground/80">{t('loginSecurityNote')}</p>
        </div>
      )}
    </div>
  );
}
