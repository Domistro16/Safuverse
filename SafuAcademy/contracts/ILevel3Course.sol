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
        string level;           // "BEGINNER" or "INTERMEDIATE"
        string thumbnailUrl;    // Course thumbnail (public, OK to be on-chain)
        string duration;        // Estimated total duration
        uint256 totalLessons;   // Number of lessons (for display)
        uint256 requiredPoints; // Points required to enroll (0 = free course)
        // Removed: Lesson[] lessons (lesson content is off-chain)
    }
}
