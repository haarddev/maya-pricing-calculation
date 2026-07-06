import { useEffect, useState } from 'react';
import { Toaster } from 'sonner';
import { useTranslation } from 'react-i18next';

export function AppToaster() {
  const { i18n } = useTranslation();
  const [isRtl, setIsRtl] = useState(i18n.language.startsWith('he'));

  useEffect(() => {
    const onLanguageChanged = (lang: string) => {
      setIsRtl(lang.startsWith('he'));
    };

    i18n.on('languageChanged', onLanguageChanged);
    return () => {
      i18n.off('languageChanged', onLanguageChanged);
    };
  }, [i18n]);

  return (
    <Toaster
      position={isRtl ? 'top-left' : 'top-right'}
      richColors
      closeButton
      dir={isRtl ? 'rtl' : 'ltr'}
    />
  );
}
