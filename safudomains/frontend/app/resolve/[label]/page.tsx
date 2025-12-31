import { redirect } from 'next/navigation';

export default async function ResolvePage({ params }: { params: Promise<{ label: string }> }) {
    // Redirect to profile page - resolve page access is blocked
    redirect('/profile');
}
