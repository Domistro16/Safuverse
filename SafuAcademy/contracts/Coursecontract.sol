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
 *      Some courses require points to enroll (point-gating)
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
    
    // Participant tracking
    mapping(uint256 => address[]) public participants;

    // Events
    event CourseCreated(uint256 indexed courseId, string title, string level, uint256 requiredPoints);
    event CourseUpdated(uint256 indexed courseId, string title);
    event CourseDeleted(uint256 indexed courseId);
    event UserEnrolled(address indexed user, uint256 indexed courseId, uint256 pointsSpent);
    event CourseCompleted(address indexed user, uint256 indexed courseId, uint256 totalPoints);
    event RelayerUpdated(address indexed oldRelayer, address indexed newRelayer);
    event PointsUpdated(address indexed user, uint256 oldPoints, uint256 newPoints);

    // Errors
    error NoSafuPrimaryName();
    error NotRelayer();
    error CourseNotFound();
    error AlreadyEnrolled();
    error NotEnrolled();
    error AlreadyCompleted();
    error InsufficientPoints(uint256 required, uint256 available);

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
    /// @param _requiredPoints Points required to enroll (0 = free course)
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
        uint256 _requiredPoints
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
        c.requiredPoints = _requiredPoints;
        
        courseCounter++;
        
        emit CourseCreated(courseId, _title, _level, _requiredPoints);
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
        uint256 _requiredPoints
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
        c.requiredPoints = _requiredPoints;
        
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
    /// @dev If course requires points, they are deducted from user's balance
    function enroll(
        uint256 _courseId,
        address _user
    ) external onlyRelayer domainOwner(_user) {
        if (_courseId >= courseCounter) revert CourseNotFound();
        if (isEnrolled[_user][_courseId]) revert AlreadyEnrolled();
        
        Course storage course = courses[_courseId];
        uint256 requiredPoints = course.requiredPoints;
        uint256 userPoints = points[_user];
        
        // Check if course requires points and user has enough
        if (requiredPoints > 0) {
            if (userPoints < requiredPoints) {
                revert InsufficientPoints(requiredPoints, userPoints);
            }
            
            // Deduct points
            uint256 oldPoints = userPoints;
            points[_user] = userPoints - requiredPoints;
            
            emit PointsUpdated(_user, oldPoints, points[_user]);
        }

        isEnrolled[_user][_courseId] = true;
        participants[_courseId].push(_user);
        
        emit UserEnrolled(_user, _courseId, requiredPoints);
    }

    /// @notice Mark a course as completed and update points
    /// @dev Called by backend when user completes all lessons and quizzes off-chain
    function completeCourse(
        uint256 _courseId,
        address _user,
        uint256 _totalPoints
    ) external onlyRelayer domainOwner(_user) {
        if (_courseId >= courseCounter) revert CourseNotFound();
        if (!isEnrolled[_user][_courseId]) revert NotEnrolled();
        if (completedCourses[_user][_courseId]) revert AlreadyCompleted();

        // Mark as completed
        isEnrolled[_user][_courseId] = false;
        completedCourses[_user][_courseId] = true;
        
        // Update total points
        uint256 oldPoints = points[_user];
        points[_user] = _totalPoints;
        
        emit PointsUpdated(_user, oldPoints, _totalPoints);
        emit CourseCompleted(_user, _courseId, _totalPoints);
    }

    // ============ VIEW FUNCTIONS ============
    
    function getCourse(uint256 _courseId) external view returns (Course memory) {
        if (_courseId >= courseCounter) revert CourseNotFound();
        return courses[_courseId];
    }

    function getCourseWithUserStatus(
        uint256 _courseId,
        address _user
    ) external view returns (
        Course memory course,
        bool enrolled,
        bool completed,
        bool canEnroll
    ) {
        if (_courseId >= courseCounter) revert CourseNotFound();
        
        course = courses[_courseId];
        enrolled = isEnrolled[_user][_courseId];
        completed = completedCourses[_user][_courseId];
        
        // User can enroll if:
        // - Not already enrolled
        // - Not already completed
        // - Has enough points (if required)
        canEnroll = !enrolled && 
                    !completed && 
                    (course.requiredPoints == 0 || points[_user] >= course.requiredPoints);
    }

    function getAllCourses() external view returns (Course[] memory) {
        Course[] memory allCourses = new Course[](courseCounter);
        for (uint256 i = 0; i < courseCounter; i++) {
            allCourses[i] = courses[i];
        }
        return allCourses;
    }

    /// @notice Check if user has enough points to enroll in a course
    function canUserEnroll(address _user, uint256 _courseId) external view returns (
        bool canEnroll,
        uint256 userPoints,
        uint256 requiredPoints,
        bool hasEnoughPoints,
        bool alreadyEnrolled,
        bool alreadyCompleted
    ) {
        if (_courseId >= courseCounter) revert CourseNotFound();
        
        Course storage course = courses[_courseId];
        userPoints = points[_user];
        requiredPoints = course.requiredPoints;
        hasEnoughPoints = requiredPoints == 0 || userPoints >= requiredPoints;
        alreadyEnrolled = isEnrolled[_user][_courseId];
        alreadyCompleted = completedCourses[_user][_courseId];
        
        canEnroll = !alreadyEnrolled && !alreadyCompleted && hasEnoughPoints;
    }

    function getUserPoints(address _user) external view returns (uint256) {
        return points[_user];
    }

    function isUserEnrolled(address _user, uint256 _courseId) external view returns (bool) {
        return isEnrolled[_user][_courseId];
    }

    function hasCompletedCourse(address _user, uint256 _courseId) external view returns (bool) {
        return completedCourses[_user][_courseId];
    }

    function getParticipantCount(uint256 _courseId) external view returns (uint256) {
        return participants[_courseId].length;
    }

    function numCourses() external view returns (uint256) {
        return courseCounter;
    }

    function getRelayer() external view returns (address) {
        return relayer;
    }
    
    /// @notice Get required points for a course
    function getCourseRequiredPoints(uint256 _courseId) external view returns (uint256) {
        if (_courseId >= courseCounter) revert CourseNotFound();
        return courses[_courseId].requiredPoints;
    }
}
