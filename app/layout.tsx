import type { Metadata, Viewport } from 'next';
import { Fredoka, Nunito } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { ToastProvider } from '@/components/providers/ToastProvider';

const nunito = Nunito({ subsets: ['latin', 'vietnamese'], variable: '--font-nunito', weight: ['400', '600', '700', '800', '900'] });
const fredoka = Fredoka({ subsets: ['latin'], variable: '--font-fredoka', weight: ['400', '500', '600', '700'] });

export const metadata: Metadata = {
  title: 'LoveDistance 🌊 — Yêu xa cùng thú cưng',
  description: 'Kết nối trái tim vượt mọi khoảng cách: gửi cảm xúc, cùng nuôi thú cưng biển và leo bảng xếp hạng.',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'LoveDistance', statusBarStyle: 'black-translucent' },
  icons: { icon: '/icon.svg', apple: '/icon.svg' }
};

export const viewport: Viewport = {
  themeColor: '#0ea5e9',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false
};

const noFlash = `(function(){try{var s=localStorage.getItem('lvdist_dark');var d=s?s==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${nunito.variable} ${fredoka.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlash }} />
      </head>
      <body>
        <ThemeProvider>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
