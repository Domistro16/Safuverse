import type { Metadata } from 'next';
import { Providers } from './providers';
import '@/app/globals.css';

export const metadata: Metadata = {
    title: 'SafuDomains - .safu Domain Registration',
    description: 'Register your .safu domain name on BSC',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body>
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
