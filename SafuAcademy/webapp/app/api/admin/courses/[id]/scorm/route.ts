import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAdmin } from '@/lib/middleware/admin.middleware';
import { extractScormZipToPublic } from '@/lib/scorm/storage';

function parseScormVersion(value: string | null): 'SCORM_12' | 'SCORM_2004' | null {
    if (!value) return null;
    if (value === 'SCORM_12' || value === '1.2') return 'SCORM_12';
    if (value === 'SCORM_2004' || value === '2004') return 'SCORM_2004';
    return null;
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const authResult = await verifyAdmin(request);
    if (!authResult.authorized) {
        return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const { id } = await params;
    const courseId = Number(id);
    if (Number.isNaN(courseId)) {
        return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 });
    }

    const course = await prisma.course.findUnique({
        where: { id: courseId },
        select: {
            id: true,
            title: true,
            isIncentivized: true,
            scormVersion: true,
            scormLaunchUrl: true,
            scormManifestPath: true,
            scormPackageVersion: true,
        },
    });

    if (!course) {
        return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    return NextResponse.json({ course });
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const authResult = await verifyAdmin(request);
    if (!authResult.authorized) {
        return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    try {
        const { id } = await params;
        const courseId = Number(id);
        if (Number.isNaN(courseId)) {
            return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 });
        }

        const formData = await request.formData();
        const packageVersion = Number(formData.get('packageVersion') || '1');
        const providedLaunchUrl = (formData.get('launchUrl') as string | null)?.trim() || null;
        const providedManifestPath = (formData.get('manifestPath') as string | null)?.trim() || null;
        const providedVersion = parseScormVersion((formData.get('scormVersion') as string | null) || null);
        const file = formData.get('scormZip');

        let scormVersion = providedVersion;
        let launchUrl = providedLaunchUrl;
        let manifestPath = providedManifestPath;

        if (file instanceof File && file.size > 0) {
            const zipBuffer = Buffer.from(await file.arrayBuffer());
            const extracted = await extractScormZipToPublic({
                courseId,
                packageVersion: Number.isNaN(packageVersion) || packageVersion < 1 ? 1 : packageVersion,
                zipBuffer,
            });
            scormVersion = extracted.scormVersion;
            launchUrl = extracted.launchUrl;
            manifestPath = extracted.manifestPath;
        }

        if (!scormVersion || !launchUrl) {
            return NextResponse.json(
                { error: 'Provide a valid SCORM zip package or explicit scormVersion + launchUrl' },
                { status: 400 }
            );
        }

        const course = await prisma.course.update({
            where: { id: courseId },
            data: {
                isIncentivized: true,
                scormVersion,
                scormLaunchUrl: launchUrl,
                scormManifestPath: manifestPath,
                scormPackageVersion: Number.isNaN(packageVersion) || packageVersion < 1 ? 1 : packageVersion,
            },
        });

        return NextResponse.json({
            message: 'SCORM package configured',
            course,
        });
    } catch (error) {
        return NextResponse.json(
            { error: (error as Error).message || 'Failed to configure SCORM package' },
            { status: 500 }
        );
    }
}

