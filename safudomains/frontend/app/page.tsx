import Nav from '@/components/nav';
import { MobileNav } from '@/components/mobilenav';
import Home from '@/components/home';

export default function HomePage() {
    return (
        <>
            <Nav />
            <MobileNav />
            <Home />
        </>
    );
}
