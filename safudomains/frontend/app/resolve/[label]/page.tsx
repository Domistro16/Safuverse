import Nav from '@/components/nav';
import { MobileNav } from '@/components/mobilenav';
import Resolve from '@/components/resolve';

export default async function ResolvePage({ params }: { params: Promise<{ label: string }> }) {
    const { label } = await params;
    return (
        <>
            <Nav />
            <MobileNav />
            <Resolve />
        </>
    );
}

