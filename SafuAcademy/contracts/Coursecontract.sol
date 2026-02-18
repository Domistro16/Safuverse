// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./IReverseRegistrar.sol";
import "./ILevel3Course.sol";
import "./ENS.sol";
import "./INameResolver.sol";

/**
 * @title Level3Course
 * @notice On-chain course registry and completion tracking for SafuAcademy
 * @dev Course content (videos, quizzes) is stored off-chain in PostgreSQL for privacy
 *      Only metadata and completion status is stored on-chain
 *
 * Enrollment model:
 * - All courses are free to enroll (no point gates, no enrollment cost)
 */
contract Level3Course is ILevel3Course, Ownable {
    IReverseRegistrar public reverse;
    ENS public registry;
    address public relayer;

    uint256 public courseCounter;

    // Course metadata (public info only)
    mapping(uint256 => Course) public courses;

    // User enrollment and progress
    mapping(address => mapping(uint256 => bool)) public isEnrolled;
    mapping(address => mapping(uint256 => bool)) public completedCourses;
    mapping(address => uint256) public points;

    struct CompletionRecord {
        bool completed;
        uint256 score;
        uint256 flags;
        uint256 completedAt;
    }

    mapping(address => mapping(uint256 => CompletionRecord)) public completionRecords;

    // Participant tracking
    mapping(uint256 => address[]) public participants;

    // Events
    event CourseCreated(
        uint256 indexed courseId,
        string title,
        string level,
        bool isIncentivized
    );
    event CourseUpdated(uint256 indexed courseId, string title);
    event CourseDeleted(uint256 indexed courseId);
    event UserEnrolled(
        address indexed user,
        uint256 indexed courseId
    );
    event CourseCompleted(
        address indexed user,
        uint256 indexed courseId,
        uint256 score,
        uint256 flags,
        uint256 timestamp
    );
    event RelayerUpdated(
        address indexed oldRelayer,
        address indexed newRelayer
    );
    event PointsUpdated(
        address indexed user,
        uint256 oldPoints,
        uint256 newPoints
    );

    // Errors
    error NoSafuPrimaryName();
    error NotRelayer();
    error CourseNotFound();
    error AlreadyEnrolled();
    error NotEnrolled();
    error AlreadyCompleted();

    modifier domainOwner(address user) {
        bytes32 node = reverse.node(user);
        address resolver = registry.resolver(node);
        string memory name = INameResolver(resolver).name(node);

        if (keccak256(bytes(name)) == keccak256(bytes(""))) {
            revert NoSafuPrimaryName();
        }
        _;
    }

    modifier onlyRelayer() {
        if (msg.sender != relayer) {
            revert NotRelayer();
        }
        _;
    }

    constructor(
        address _reverse,
        address _owner,
        address _registry
    ) Ownable(_owner) {
        reverse = IReverseRegistrar(_reverse);
        registry = ENS(_registry);
    }

    // ============ OWNER-ONLY ADMIN FUNCTIONS ============

    /// @notice Set the relayer address
    function setRelayer(address _relayer) external onlyOwner {
        address oldRelayer = relayer;
        relayer = _relayer;
        emit RelayerUpdated(oldRelayer, _relayer);
    }

    /// @notice Create a new course (metadata only)
    function createCourse(
        string memory _title,
        string memory _description,
        string memory _longDescription,
        string memory _instructor,
        string[] memory _objectives,
        string[] memory _prerequisites,
        string memory _category,
        string memory _level,
        string memory _thumbnailUrl,
        string memory _duration,
        uint256 _totalLessons,
        bool _isIncentivized
    ) external onlyOwner returns (uint256) {
        uint256 courseId = courseCounter;

        Course storage c = courses[courseId];
        c.id = courseId;
        c.title = _title;
        c.description = _description;
        c.longDescription = _longDescription;
        c.instructor = _instructor;
        c.objectives = _objectives;
        c.prerequisites = _prerequisites;
        c.category = _category;
        c.level = _level;
        c.thumbnailUrl = _thumbnailUrl;
        c.duration = _duration;
        c.totalLessons = _totalLessons;
        c.isIncentivized = _isIncentivized;

        courseCounter++;

        emit CourseCreated(
            courseId,
            _title,
            _level,
            _isIncentivized
        );
        return courseId;
    }

    /// @notice Update course metadata
    function updateCourse(
        uint256 _courseId,
        string memory _title,
        string memory _description,
        string memory _longDescription,
        string memory _instructor,
        string[] memory _objectives,
        string[] memory _prerequisites,
        string memory _category,
        string memory _level,
        string memory _thumbnailUrl,
        string memory _duration,
        uint256 _totalLessons,
        bool _isIncentivized
    ) external onlyOwner {
        if (_courseId >= courseCounter) revert CourseNotFound();

        Course storage c = courses[_courseId];
        c.title = _title;
        c.description = _description;
        c.longDescription = _longDescription;
        c.instructor = _instructor;
        c.objectives = _objectives;
        c.prerequisites = _prerequisites;
        c.category = _category;
        c.level = _level;
        c.thumbnailUrl = _thumbnailUrl;
        c.duration = _duration;
        c.totalLessons = _totalLessons;
        c.isIncentivized = _isIncentivized;

        emit CourseUpdated(_courseId, _title);
    }

    /// @notice Delete a course
    function deleteCourse(uint256 _courseId) external onlyOwner {
        if (_courseId >= courseCounter) revert CourseNotFound();
        delete courses[_courseId];
        emit CourseDeleted(_courseId);
    }

    // ============ RELAYER FUNCTIONS ============

    /// @notice Enroll a user in a course
    function enroll(
        uint256 _courseId,
        address _user
    ) external {
        if (_courseId >= courseCounter) revert CourseNotFound();
        if (isEnrolled[_user][_courseId]) revert AlreadyEnrolled();
        if (completedCourses[_user][_courseId]) revert AlreadyCompleted();

        isEnrolled[_user][_courseId] = true;
        participants[_courseId].push(_user);

        emit UserEnrolled(_user, _courseId);
    }

    /// @notice Mark a course as completed and update points
    /// @dev Called by relayer when user completes all lessons off-chain
    function completeCourse(
        uint256 _courseId,
        address _user,
        uint256 _score,
        uint256 _flags
    ) external onlyRelayer {
        if (_courseId >= courseCounter) revert CourseNotFound();
        if (!isEnrolled[_user][_courseId]) revert NotEnrolled();
        if (completedCourses[_user][_courseId]) revert AlreadyCompleted();

        Course storage course = courses[_courseId];

        // Mark as completed
        isEnrolled[_user][_courseId] = false;
        completedCourses[_user][_courseId] = true;
        completionRecords[_user][_courseId] = CompletionRecord({
            completed: true,
            score: _score,
            flags: _flags,
            completedAt: block.timestamp
        });

        uint256 oldPoints = points[_user];
        if (course.isIncentivized && _score > 0) {
            points[_user] = oldPoints + _score;
        }

        emit PointsUpdated(_user, oldPoints, points[_user]);
        emit CourseCompleted(_user, _courseId, _score, _flags, block.timestamp);
    }

    /// @notice Relayer-only points update utility
    function updateUserPoints(
        address _user,
        uint256 _newPoints
    ) external onlyRelayer {
        uint256 oldPoints = points[_user];
        points[_user] = _newPoints;
        emit PointsUpdated(_user, oldPoints, _newPoints);
    }

    /// @notice Relayer-only completion status update utility
    function setCourseCompletionStatus(
        uint256 _courseId,
        address _user,
        bool _completed
    ) external onlyRelayer {
        if (_courseId >= courseCounter) revert CourseNotFound();

        completedCourses[_user][_courseId] = _completed;
        if (_completed) {
            isEnrolled[_user][_courseId] = false;
            CompletionRecord storage record = completionRecords[_user][_courseId];
            record.completed = true;
            if (record.completedAt == 0) {
                record.completedAt = block.timestamp;
            }
        } else {
            delete completionRecords[_user][_courseId];
        }
    }

    // ============ VIEW FUNCTIONS ============

    function getCourse(
        uint256 _courseId
    ) external view returns (Course memory) {
        if (_courseId >= courseCounter) revert CourseNotFound();
        return courses[_courseId];
    }

    function getCourseWithUserStatus(
        uint256 _courseId,
        address _user
    )
        external
        view
        returns (
            Course memory course,
            bool enrolled,
            bool completed,
            bool canEnroll
        )
    {
        if (_courseId >= courseCounter) revert CourseNotFound();

        course = courses[_courseId];
        enrolled = isEnrolled[_user][_courseId];
        completed = completedCourses[_user][_courseId];
        canEnroll = !enrolled && !completed;
    }

    function getAllCourses() external view returns (Course[] memory) {
        Course[] memory allCourses = new Course[](courseCounter);
        for (uint256 i = 0; i < courseCounter; i++) {
            allCourses[i] = courses[i];
        }
        return allCourses;
    }

    function getUserPoints(address _user) external view returns (uint256) {
        return points[_user];
    }

    function isUserEnrolled(
        address _user,
        uint256 _courseId
    ) external view returns (bool) {
        return isEnrolled[_user][_courseId];
    }

    function hasCompletedCourse(
        address _user,
        uint256 _courseId
    ) external view returns (bool) {
        return completedCourses[_user][_courseId];
    }

    function getCompletionRecord(
        address _user,
        uint256 _courseId
    )
        external
        view
        returns (
            bool completed,
            uint256 score,
            uint256 flags,
            uint256 completedAt
        )
    {
        CompletionRecord memory record = completionRecords[_user][_courseId];
        return (record.completed, record.score, record.flags, record.completedAt);
    }

    function getParticipantCount(
        uint256 _courseId
    ) external view returns (uint256) {
        return participants[_courseId].length;
    }

    function numCourses() external view returns (uint256) {
        return courseCounter;
    }

    function getRelayer() external view returns (address) {
        return relayer;
    }
}
