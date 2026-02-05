import type { Metadata } from 'next';
import { Providers } from './providers';
import '@/app/globals.css';
import Nav from '@/components/nav';
import { MobileNav } from '@/components/mobilenav';

export const metadata: Metadata = {
    title: 'SafuDomains - .safu Domain Registration',
    description: 'Register your .safu domain name on BSC',
};

// Script to apply dark mode before hydration
const themeScript = `
(function() {
    try {
        var theme = localStorage.getItem('safudomains-theme');
        if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.body.classList.add('dark-mode');
        }
    } catch (e) {}
})();
`;

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body>
                <script dangerouslySetInnerHTML={{ __html: themeScript }} />
                <Providers>
                    <Nav />
                    <MobileNav />
                    {children}
                </Providers>
            </body>
        </html>
    );
}
