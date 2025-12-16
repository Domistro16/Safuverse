// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface ILevel3Course {
    // Simplified Lesson struct - no video URLs or quiz data
    // These are stored off-chain in PostgreSQL for privacy
    struct Lesson {
        uint256 id;
        string title;
        // Removed: string[] url (now stored in PostgreSQL)
        // Removed: string quizzes (now stored in PostgreSQL)
    }

    // Course struct - basic metadata only
    struct Course {
        uint256 id;
        string title;
        string description;
        string longDescription;
        string instructor;
        string[] objectives;
        string[] prerequisites;
        string category;
        string level;             // "BEGINNER", "INTERMEDIATE", or "ADVANCED"
        string thumbnailUrl;      // Course thumbnail (public, OK to be on-chain)
        string duration;          // Estimated total duration
        uint256 totalLessons;     // Number of lessons (for display)
        uint256 minPointsToAccess; // Min points user must HAVE to enroll (NOT deducted) - for ADVANCED courses
        uint256 enrollmentCost;    // Points DEDUCTED on enrollment (for PREMIUM courses)
        // Removed: Lesson[] lessons (lesson content is off-chain)
    }
}
