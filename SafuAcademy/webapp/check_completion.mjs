import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';

const client = createPublicClient({ chain: base, transport: http() });

const abi = [
    {
        inputs: [{ name: '', type: 'address' }, { name: '', type: 'uint256' }],
        name: 'completedCourses',
        outputs: [{ name: '', type: 'bool' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'getAllCourses',
        outputs: [{
            components: [
                { name: 'id', type: 'uint256' },
                { name: 'title', type: 'string' },
                { name: 'description', type: 'string' },
                { name: 'longDescription', type: 'string' },
                { name: 'instructor', type: 'string' },
                { name: 'objectives', type: 'string[]' },
                { name: 'prerequisites', type: 'string[]' },
                { name: 'category', type: 'string' },
                { name: 'level', type: 'string' },
                { name: 'thumbnailUrl', type: 'string' },
                { name: 'duration', type: 'string' },
                { name: 'totalLessons', type: 'uint256' },
                { name: 'isIncentivized', type: 'bool' },
            ],
            type: 'tuple[]',
        }],
        stateMutability: 'view',
        type: 'function',
    },
];

const contractAddr = '0xa511b792CeF798d193DCf8F247B90CF47A3Ea1B7';
const userAddr = '0xD83deFbA240568040b39bb2C8B4DB7dB02d40593';

const courses = await client.readContract({ address: contractAddr, abi, functionName: 'getAllCourses' });
console.log('Total courses:', courses.length);

for (const c of courses) {
    const done = await client.readContract({
        address: contractAddr,
        abi,
        functionName: 'completedCourses',
        args: [userAddr, c.id],
    });
    console.log(`Course ${Number(c.id)} "${c.title}": completed=${done}`);
}
