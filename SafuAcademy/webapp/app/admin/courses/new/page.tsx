'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';

// Contract ABI for createCourse - matches Level3Course.sol
const COURSE_ABI = [
    {
        name: 'createCourse',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: '_title', type: 'string' },
            { name: '_description', type: 'string' },
            { name: '_longDescription', type: 'string' },
            { name: '_instructor', type: 'string' },
            { name: '_objectives', type: 'string[]' },
            { name: '_prerequisites', type: 'string[]' },
            { name: '_category', type: 'string' },
            { name: '_level', type: 'string' },
            { name: '_thumbnailUrl', type: 'string' },
            { name: '_duration', type: 'string' },
            { name: '_totalLessons', type: 'uint256' },
            { name: '_minPointsToAccess', type: 'uint256' },
            { name: '_enrollmentCost', type: 'uint256' },
        ],
        outputs: [{ type: 'uint256' }],
    },
] as const;

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_LEVEL3_COURSE_ADDRESS as `0x${string}`;

// Level-specific defaults
const LEVEL_DEFAULTS = {
    BEGINNER: { completionPoints: 50, minPointsToAccess: 0, enrollmentCost: 0 },
    INTERMEDIATE: { completionPoints: 100, minPointsToAccess: 0, enrollmentCost: 0 },
    ADVANCED: { completionPoints: 150, minPointsToAccess: 100, enrollmentCost: 50 },
};

export default function CreateCoursePage() {
    const router = useRouter();
    const { address } = useAccount();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'form' | 'signing' | 'saving'>('form');

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        longDescription: '',
        instructor: '',
        category: 'DeFi',
        level: 'BEGINNER' as keyof typeof LEVEL_DEFAULTS,
        thumbnailUrl: '',
        duration: '',
        objectives: [''],
        prerequisites: [''],
        completionPoints: 50,
        minPointsToAccess: 0,
        enrollmentCost: 0,
    });

    const { writeContract, data: hash } = useWriteContract();
    const { isSuccess: txSuccess } = useWaitForTransactionReceipt({ hash });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        // If level changes, update default points values
        if (name === 'level' && value in LEVEL_DEFAULTS) {
            const defaults = LEVEL_DEFAULTS[value as keyof typeof LEVEL_DEFAULTS];
            setFormData((prev) => ({
                ...prev,
                level: value as keyof typeof LEVEL_DEFAULTS,
                completionPoints: defaults.completionPoints,
                minPointsToAccess: defaults.minPointsToAccess,
                enrollmentCost: defaults.enrollmentCost,
            }));
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleArrayChange = (field: 'objectives' | 'prerequisites', index: number, value: string) => {
        setFormData((prev) => {
            const arr = [...prev[field]];
            arr[index] = value;
            return { ...prev, [field]: arr };
        });
    };

    const addArrayItem = (field: 'objectives' | 'prerequisites') => {
        setFormData((prev) => ({
            ...prev,
            [field]: [...prev[field], ''],
        }));
    };

    const removeArrayItem = (field: 'objectives' | 'prerequisites', index: number) => {
        setFormData((prev) => ({
            ...prev,
            [field]: prev[field].filter((_, i) => i !== index),
        }));
    };

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!address) {
            alert('Please connect your wallet');
            return;
        }

        setLoading(true);
        setStep('signing');

        try {
            // Filter out empty array items
            const objectives = formData.objectives.filter((o) => o.trim());
            const prerequisites = formData.prerequisites.filter((p) => p.trim());

            // Call contract via MetaMask
            writeContract({
                address: CONTRACT_ADDRESS,
                abi: COURSE_ABI,
                functionName: 'createCourse',
                args: [
                    formData.title,
                    formData.description,
                    formData.longDescription,
                    formData.instructor,
                    objectives,
                    prerequisites,
                    formData.category,
                    formData.level,
                    formData.thumbnailUrl,
                    formData.duration,
                    BigInt(0), // totalLessons - will update when adding lessons
                    BigInt(formData.minPointsToAccess),
                    BigInt(formData.enrollmentCost),
                ],
            });
        } catch (err) {
            console.error('Contract call failed:', err);
            alert('Failed to create course on-chain');
            setLoading(false);
            setStep('form');
        }
    }

    // When transaction is confirmed, save to database
    if (txSuccess && hash && step === 'signing') {
        setStep('saving');
        saveToDB(hash);
    }

    async function saveToDB(txHash: string) {
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch('/api/admin/courses', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...formData,
                    objectives: formData.objectives.filter((o) => o.trim()),
                    prerequisites: formData.prerequisites.filter((p) => p.trim()),
                    onChainTxHash: txHash,
                }),
            });

            if (!res.ok) throw new Error('Failed to save to database');

            const data = await res.json();
            alert('Course created successfully!');
            router.push(`/admin/courses/${data.course.id}`);
        } catch (err) {
            console.error('Database save failed:', err);
            alert('Course created on-chain but failed to save to database. Please try again.');
            setLoading(false);
            setStep('form');
        }
    }

    return (
        <div className="max-w-4xl">
            <h1 className="text-3xl font-bold text-white mb-8">Create New Course</h1>

            {step !== 'form' && (
                <div className="bg-blue-500/20 border border-blue-500 rounded-lg p-4 mb-6">
                    <p className="text-blue-400">
                        {step === 'signing' && '⏳ Please confirm the transaction in MetaMask...'}
                        {step === 'saving' && '⏳ Saving to database...'}
                    </p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-gray-800 rounded-xl p-6 space-y-4">
                    <h2 className="text-xl font-semibold text-white">Basic Information</h2>

                    <div>
                        <label className="block text-gray-400 mb-2">Title *</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-gray-400 mb-2">Short Description *</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            required
                            rows={2}
                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-gray-400 mb-2">Long Description</label>
                        <textarea
                            name="longDescription"
                            value={formData.longDescription}
                            onChange={handleChange}
                            rows={4}
                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-gray-400 mb-2">Instructor</label>
                            <input
                                type="text"
                                name="instructor"
                                value={formData.instructor}
                                onChange={handleChange}
                                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-400 mb-2">Duration</label>
                            <input
                                type="text"
                                name="duration"
                                value={formData.duration}
                                onChange={handleChange}
                                placeholder="e.g. 2 hours"
                                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-gray-400 mb-2">Category</label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                            >
                                <option value="DeFi">DeFi</option>
                                <option value="NFTs">NFTs</option>
                                <option value="Security">Security</option>
                                <option value="Trading">Trading</option>
                                <option value="Development">Development</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-gray-400 mb-2">Level</label>
                            <select
                                name="level"
                                value={formData.level}
                                onChange={handleChange}
                                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                            >
                                <option value="BEGINNER">Beginner</option>
                                <option value="INTERMEDIATE">Intermediate</option>
                                <option value="ADVANCED">Advanced</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-gray-400 mb-2">Thumbnail URL</label>
                        <input
                            type="url"
                            name="thumbnailUrl"
                            value={formData.thumbnailUrl}
                            onChange={handleChange}
                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                        />
                    </div>
                </div>

                {/* Points Configuration */}
                <div className="bg-gray-800 rounded-xl p-6 space-y-4">
                    <h2 className="text-xl font-semibold text-white">Points Configuration</h2>

                    {formData.level === 'ADVANCED' && (
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-4">
                            <p className="text-yellow-400 text-sm">
                                ⚡ Advanced courses require users to have minimum points to access and may deduct points on enrollment.
                            </p>
                        </div>
                    )}

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-gray-400 mb-2">Completion Points</label>
                            <input
                                type="number"
                                name="completionPoints"
                                value={formData.completionPoints}
                                onChange={handleChange}
                                min="0"
                                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                            />
                            <p className="text-gray-500 text-xs mt-1">Awarded on course completion</p>
                        </div>
                        <div>
                            <label className="block text-gray-400 mb-2">Min Points to Access</label>
                            <input
                                type="number"
                                name="minPointsToAccess"
                                value={formData.minPointsToAccess}
                                onChange={handleChange}
                                min="0"
                                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                            />
                            <p className="text-gray-500 text-xs mt-1">Required to enroll (not deducted)</p>
                        </div>
                        <div>
                            <label className="block text-gray-400 mb-2">Enrollment Cost</label>
                            <input
                                type="number"
                                name="enrollmentCost"
                                value={formData.enrollmentCost}
                                onChange={handleChange}
                                min="0"
                                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                            />
                            <p className="text-gray-500 text-xs mt-1">Deducted on enrollment</p>
                        </div>
                    </div>
                </div>

                {/* Objectives */}
                <div className="bg-gray-800 rounded-xl p-6 space-y-4">
                    <h2 className="text-xl font-semibold text-white">Learning Objectives</h2>
                    {formData.objectives.map((obj, index) => (
                        <div key={index} className="flex gap-2">
                            <input
                                type="text"
                                value={obj}
                                onChange={(e) => handleArrayChange('objectives', index, e.target.value)}
                                placeholder={`Objective ${index + 1}`}
                                className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                            />
                            <button
                                type="button"
                                onClick={() => removeArrayItem('objectives', index)}
                                className="px-3 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30"
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={() => addArrayItem('objectives')}
                        className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600"
                    >
                        + Add Objective
                    </button>
                </div>

                {/* Prerequisites */}
                <div className="bg-gray-800 rounded-xl p-6 space-y-4">
                    <h2 className="text-xl font-semibold text-white">Prerequisites</h2>
                    {formData.prerequisites.map((prereq, index) => (
                        <div key={index} className="flex gap-2">
                            <input
                                type="text"
                                value={prereq}
                                onChange={(e) => handleArrayChange('prerequisites', index, e.target.value)}
                                placeholder={`Prerequisite ${index + 1}`}
                                className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                            />
                            <button
                                type="button"
                                onClick={() => removeArrayItem('prerequisites', index)}
                                className="px-3 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30"
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={() => addArrayItem('prerequisites')}
                        className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600"
                    >
                        + Add Prerequisite
                    </button>
                </div>

                <div className="flex gap-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
                    >
                        {loading ? 'Creating...' : 'Create Course'}
                    </button>
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}
