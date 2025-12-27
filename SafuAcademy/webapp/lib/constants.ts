export const Deploy = "0x1988Bc593015Fe29ED7562Ba672a8798b3B13e88";

// ============ On-Chain Types (from contract) ============
// Note: Lessons are stored OFF-CHAIN in PostgreSQL, not on-chain
// The contract only stores course metadata and totalLessons count

export interface OnChainCourse {
  id: bigint;
  title: string;
  description: string;
  longDescription: string;
  instructor: string;
  objectives: readonly string[];
  prerequisites: readonly string[];
  category: string;
  level: string;
  thumbnailUrl: string;
  duration: string;
  totalLessons: bigint;
  minPointsToAccess: bigint;
  enrollmentCost: bigint;
}

// ============ Backend Types (from database) ============
export interface Lesson {
  id: string;
  title: string;
  description: string | null;
  orderIndex: number;
  watchPoints: number;
  hasQuiz?: boolean;
}

export interface Course {
  id: number;
  title: string;
  description: string;
  longDescription: string;
  objectives: string[];
  instructor: string;
  thumbnailUrl: string | null;
  level: string;
  category: string;
  prerequisites: string[];
  lessons: Lesson[];
  duration: string;
  totalLessons?: number;
  completionPoints?: number;
  minPointsToAccess?: number;
  enrollmentCost?: number;
  isPublished?: boolean;
}

// ============ Contract ABI ============
// Updated to match Coursecontract.sol (v2 - no on-chain lessons)
export const abi = [
  // Constructor
  {
    inputs: [
      { internalType: "address", name: "_reverse", type: "address" },
      { internalType: "address", name: "_owner", type: "address" },
      { internalType: "address", name: "_registry", type: "address" },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },

  // Errors
  { inputs: [], name: "NoSafuPrimaryName", type: "error" },
  { inputs: [], name: "NotRelayer", type: "error" },
  { inputs: [], name: "CourseNotFound", type: "error" },
  { inputs: [], name: "AlreadyEnrolled", type: "error" },
  { inputs: [], name: "NotEnrolled", type: "error" },
  { inputs: [], name: "AlreadyCompleted", type: "error" },
  {
    inputs: [
      { internalType: "uint256", name: "required", type: "uint256" },
      { internalType: "uint256", name: "available", type: "uint256" },
    ],
    name: "InsufficientPointsToAccess",
    type: "error",
  },
  {
    inputs: [
      { internalType: "uint256", name: "cost", type: "uint256" },
      { internalType: "uint256", name: "available", type: "uint256" },
    ],
    name: "InsufficientPointsForCost",
    type: "error",
  },
  {
    inputs: [{ internalType: "address", name: "owner", type: "address" }],
    name: "OwnableInvalidOwner",
    type: "error",
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "OwnableUnauthorizedAccount",
    type: "error",
  },

  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "courseId", type: "uint256" },
      { indexed: false, internalType: "string", name: "title", type: "string" },
      { indexed: false, internalType: "string", name: "level", type: "string" },
      { indexed: false, internalType: "uint256", name: "minPointsToAccess", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "enrollmentCost", type: "uint256" },
    ],
    name: "CourseCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "courseId", type: "uint256" },
      { indexed: false, internalType: "string", name: "title", type: "string" },
    ],
    name: "CourseUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [{ indexed: true, internalType: "uint256", name: "courseId", type: "uint256" }],
    name: "CourseDeleted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: true, internalType: "uint256", name: "courseId", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "pointsSpent", type: "uint256" },
    ],
    name: "UserEnrolled",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: true, internalType: "uint256", name: "courseId", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "totalPoints", type: "uint256" },
    ],
    name: "CourseCompleted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "oldRelayer", type: "address" },
      { indexed: true, internalType: "address", name: "newRelayer", type: "address" },
    ],
    name: "RelayerUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: false, internalType: "uint256", name: "oldPoints", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "newPoints", type: "uint256" },
    ],
    name: "PointsUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "previousOwner", type: "address" },
      { indexed: true, internalType: "address", name: "newOwner", type: "address" },
    ],
    name: "OwnershipTransferred",
    type: "event",
  },

  // View Functions
  {
    inputs: [],
    name: "courseCounter",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_courseId", type: "uint256" }],
    name: "getCourse",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "id", type: "uint256" },
          { internalType: "string", name: "title", type: "string" },
          { internalType: "string", name: "description", type: "string" },
          { internalType: "string", name: "longDescription", type: "string" },
          { internalType: "string", name: "instructor", type: "string" },
          { internalType: "string[]", name: "objectives", type: "string[]" },
          { internalType: "string[]", name: "prerequisites", type: "string[]" },
          { internalType: "string", name: "category", type: "string" },
          { internalType: "string", name: "level", type: "string" },
          { internalType: "string", name: "thumbnailUrl", type: "string" },
          { internalType: "string", name: "duration", type: "string" },
          { internalType: "uint256", name: "totalLessons", type: "uint256" },
          { internalType: "uint256", name: "minPointsToAccess", type: "uint256" },
          { internalType: "uint256", name: "enrollmentCost", type: "uint256" },
        ],
        internalType: "struct ILevel3Course.Course",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_courseId", type: "uint256" },
      { internalType: "address", name: "_user", type: "address" },
    ],
    name: "getCourseWithUserStatus",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "id", type: "uint256" },
          { internalType: "string", name: "title", type: "string" },
          { internalType: "string", name: "description", type: "string" },
          { internalType: "string", name: "longDescription", type: "string" },
          { internalType: "string", name: "instructor", type: "string" },
          { internalType: "string[]", name: "objectives", type: "string[]" },
          { internalType: "string[]", name: "prerequisites", type: "string[]" },
          { internalType: "string", name: "category", type: "string" },
          { internalType: "string", name: "level", type: "string" },
          { internalType: "string", name: "thumbnailUrl", type: "string" },
          { internalType: "string", name: "duration", type: "string" },
          { internalType: "uint256", name: "totalLessons", type: "uint256" },
          { internalType: "uint256", name: "minPointsToAccess", type: "uint256" },
          { internalType: "uint256", name: "enrollmentCost", type: "uint256" },
        ],
        internalType: "struct ILevel3Course.Course",
        name: "course",
        type: "tuple",
      },
      { internalType: "bool", name: "enrolled", type: "bool" },
      { internalType: "bool", name: "completed", type: "bool" },
      { internalType: "bool", name: "canEnroll", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getAllCourses",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "id", type: "uint256" },
          { internalType: "string", name: "title", type: "string" },
          { internalType: "string", name: "description", type: "string" },
          { internalType: "string", name: "longDescription", type: "string" },
          { internalType: "string", name: "instructor", type: "string" },
          { internalType: "string[]", name: "objectives", type: "string[]" },
          { internalType: "string[]", name: "prerequisites", type: "string[]" },
          { internalType: "string", name: "category", type: "string" },
          { internalType: "string", name: "level", type: "string" },
          { internalType: "string", name: "thumbnailUrl", type: "string" },
          { internalType: "string", name: "duration", type: "string" },
          { internalType: "uint256", name: "totalLessons", type: "uint256" },
          { internalType: "uint256", name: "minPointsToAccess", type: "uint256" },
          { internalType: "uint256", name: "enrollmentCost", type: "uint256" },
        ],
        internalType: "struct ILevel3Course.Course[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "_user", type: "address" }],
    name: "getUserPoints",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_user", type: "address" },
      { internalType: "uint256", name: "_courseId", type: "uint256" },
    ],
    name: "isUserEnrolled",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_user", type: "address" },
      { internalType: "uint256", name: "_courseId", type: "uint256" },
    ],
    name: "hasCompletedCourse",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "_user", type: "address" },
      { internalType: "uint256", name: "_courseId", type: "uint256" },
    ],
    name: "canUserEnroll",
    outputs: [
      { internalType: "bool", name: "canEnroll", type: "bool" },
      { internalType: "uint256", name: "userPoints", type: "uint256" },
      { internalType: "uint256", name: "minPointsToAccess", type: "uint256" },
      { internalType: "uint256", name: "enrollmentCost", type: "uint256" },
      { internalType: "bool", name: "meetsAccessRequirement", type: "bool" },
      { internalType: "bool", name: "meetsCostRequirement", type: "bool" },
      { internalType: "bool", name: "alreadyEnrolled", type: "bool" },
      { internalType: "bool", name: "alreadyCompleted", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_courseId", type: "uint256" }],
    name: "getParticipantCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "numCourses",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_courseId", type: "uint256" }],
    name: "getCourseRequirements",
    outputs: [
      { internalType: "uint256", name: "minPointsToAccess", type: "uint256" },
      { internalType: "uint256", name: "enrollmentCost", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getRelayer",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "relayer",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "points",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "", type: "address" },
      { internalType: "uint256", name: "", type: "uint256" },
    ],
    name: "isEnrolled",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "", type: "address" },
      { internalType: "uint256", name: "", type: "uint256" },
    ],
    name: "completedCourses",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },

  // Owner Functions
  {
    inputs: [{ internalType: "address", name: "_relayer", type: "address" }],
    name: "setRelayer",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "string", name: "_title", type: "string" },
      { internalType: "string", name: "_description", type: "string" },
      { internalType: "string", name: "_longDescription", type: "string" },
      { internalType: "string", name: "_instructor", type: "string" },
      { internalType: "string[]", name: "_objectives", type: "string[]" },
      { internalType: "string[]", name: "_prerequisites", type: "string[]" },
      { internalType: "string", name: "_category", type: "string" },
      { internalType: "string", name: "_level", type: "string" },
      { internalType: "string", name: "_thumbnailUrl", type: "string" },
      { internalType: "string", name: "_duration", type: "string" },
      { internalType: "uint256", name: "_totalLessons", type: "uint256" },
      { internalType: "uint256", name: "_minPointsToAccess", type: "uint256" },
      { internalType: "uint256", name: "_enrollmentCost", type: "uint256" },
    ],
    name: "createCourse",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_courseId", type: "uint256" },
      { internalType: "string", name: "_title", type: "string" },
      { internalType: "string", name: "_description", type: "string" },
      { internalType: "string", name: "_longDescription", type: "string" },
      { internalType: "string", name: "_instructor", type: "string" },
      { internalType: "string[]", name: "_objectives", type: "string[]" },
      { internalType: "string[]", name: "_prerequisites", type: "string[]" },
      { internalType: "string", name: "_category", type: "string" },
      { internalType: "string", name: "_level", type: "string" },
      { internalType: "string", name: "_thumbnailUrl", type: "string" },
      { internalType: "string", name: "_duration", type: "string" },
      { internalType: "uint256", name: "_totalLessons", type: "uint256" },
      { internalType: "uint256", name: "_minPointsToAccess", type: "uint256" },
      { internalType: "uint256", name: "_enrollmentCost", type: "uint256" },
    ],
    name: "updateCourse",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_courseId", type: "uint256" }],
    name: "deleteCourse",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "newOwner", type: "address" }],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "renounceOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },

  // Relayer Functions
  {
    inputs: [
      { internalType: "uint256", name: "_courseId", type: "uint256" },
      { internalType: "address", name: "_user", type: "address" },
    ],
    name: "enroll",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_courseId", type: "uint256" },
      { internalType: "address", name: "_user", type: "address" },
      { internalType: "uint256", name: "_totalPoints", type: "uint256" },
    ],
    name: "completeCourse",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;
