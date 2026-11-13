import { useEffect, useState } from 'react';
import { Link } from '@/lib/router';
import { useI18n } from '@/lib/i18n';
import { useAuth, TelegramLoginButton } from '@/lib/auth';

export default function LoginPage() {
  const { t } = useI18n();
  const { profile, ready, signInFailed } = useAuth();

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-6 px-4 py-16">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold text-neutral-900">{t('loginTitle')}</h1>
        <p className="text-sm leading-relaxed text-neutral-600">{t('loginSubtitle')}</p>
      </div>

      {ready && profile ? (
        <div className="flex w-full flex-col items-center gap-4 rounded-3xl border border-neutral-200 bg-white p-8">
          <p className="text-sm font-semibold text-neutral-900">
            {profile.firstName ?? profile.username ?? `TG ${profile.telegramUserId}`}
          </p>
          <p className="text-xs text-neutral-600">{t('alreadySignedIn')}</p>
          <Link
            to="/cart"
            className="rounded-full bg-neutral-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-neutral-700 active:scale-95"
          >
            {t('viewCart')}
          </Link>
        </div>
      ) : (
        <div className="flex w-full flex-col items-center gap-4 rounded-3xl border border-neutral-200 bg-white p-8">
          {signInFailed && <p className="text-sm text-red-700">{t('loginFailed')}</p>}
          <TelegramLoginButton />
          <p className="text-xs leading-relaxed text-neutral-500">{t('loginSecurityNote')}</p>
        </div>
      )}
    </div>
  );
}
