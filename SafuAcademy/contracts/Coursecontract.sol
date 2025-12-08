// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./IReverseRegistrar.sol";
import "./ILevel3Course.sol";
import "./CourseFactory.sol";
import "./ENS.sol";
import "./INameResolver.sol";

contract Level3Course is ILevel3Course, Ownable {
    IReverseRegistrar public reverse;
    ENS public registry;
    address public courseFactory;
    address public relayer;
    
    uint256 public courseCounter;
    
    mapping(address => mapping(uint256 => bool)) public isEnrolled;
    mapping(address => mapping(uint256 => uint8)) public progress;
    mapping(uint256 => address[]) public participants;
    mapping(uint256 => Course) public courses;
    mapping(address => uint256) public points;
    mapping(address => mapping(uint256 => bool)) public completedCourses;

    event CourseEnrolled(address indexed user, uint256 courseId);
    event ProgressUpdated(address indexed user, uint256 courseId, uint8 progress);
    event RelayerUpdated(address indexed oldRelayer, address indexed newRelayer);

    error NoSafuPrimaryName();
    error NotCourseFactory();
    error NotRelayer();
    error CourseNotFound();
    error AlreadyEnrolled();
    error NotEnrolled();
    error InvalidProgress();
    error FactoryAlreadySet();
    error RelayerNotSet();

    modifier domainOwner(address user) {
        bytes32 node = reverse.node(user);
        address resolver = registry.resolver(node);
        string memory name = INameResolver(resolver).name(node);

        if (keccak256(bytes(name)) == keccak256(bytes(""))) {
            revert NoSafuPrimaryName();
        }
        _;
    }

    modifier onlyFactory() {
        if (msg.sender != courseFactory) {
            revert NotCourseFactory();
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
    
    /// @notice Set the relayer address (can be updated if compromised)
    /// @param _relayer The new relayer address
    function setRelayer(address _relayer) external onlyOwner {
        address oldRelayer = relayer;
        relayer = _relayer;
        emit RelayerUpdated(oldRelayer, _relayer);
    }

    /// @notice Set the course factory address (one-time setup)
    /// @param _factory The course factory address
    function setCourseFactory(address _factory) external onlyOwner {
        if (courseFactory != address(0)) {
            revert FactoryAlreadySet();
        }
        courseFactory = _factory;
    }

    /// @notice Delete a course (admin function)
    /// @param _courseId The course ID to delete
    function deleteCourse(uint256 _courseId) external onlyOwner {
        delete courses[_courseId];
    }

    // ============ RELAYER FUNCTIONS (Called by Backend) ============
    
    /// @notice Enroll a user in a course (called by relayer/backend)
    /// @param _id The course ID
    /// @param _user The user address to enroll
    function enroll(
        uint256 _id,
        address _user
    ) external onlyRelayer domainOwner(_user) {
        if (_id >= courseCounter) {
            revert CourseNotFound();
        }
        if (isEnrolled[_user][_id]) {
            revert AlreadyEnrolled();
        }

        isEnrolled[_user][_id] = true;
        participants[_id].push(_user);
        
        emit CourseEnrolled(_user, _id);
    }

    /// @notice Update a user's course progress (called by relayer/backend)
    /// @param _courseId The course ID
    /// @param _progress The new progress value (0-100)
    /// @param _user The user address
    /// @param _points The user's total points
    function updateCourseProgress(
        uint256 _courseId,
        uint8 _progress,
        address _user,
        uint256 _points
    ) external onlyRelayer domainOwner(_user) {
        if (_courseId >= courseCounter) {
            revert CourseNotFound();
        }
        if (!isEnrolled[_user][_courseId]) {
            revert NotEnrolled();
        }
        if (_progress > 100) {
            revert InvalidProgress();
        }

        progress[_user][_courseId] = _progress;
        points[_user] = _points;
        
        if (_progress == 100) {
            isEnrolled[_user][_courseId] = false;
            completedCourses[_user][_courseId] = true;
        }
        
        emit ProgressUpdated(_user, _courseId, _progress);
    }

    // ============ FACTORY FUNCTIONS ============
    
    /// @notice Update course registry (called by factory when adding new course)
    /// @param coursecounter The course counter value
    /// @param course The course data
    function updateCourseRegistry(
        uint256 coursecounter,
        Course memory course
    ) external onlyFactory {
        courses[coursecounter] = course;
        courseCounter = coursecounter + 1;
    }

    /// @notice Update an existing course (called by factory when editing)
    /// @param course The updated course data
    /// @param coursecounter The course ID to update
    function updateCourse(
        Course memory course,
        uint256 coursecounter
    ) external onlyFactory {
        courses[coursecounter] = course;
    }

    // ============ VIEW FUNCTIONS ============
    
    /// @notice Get the total number of courses
    function numCourses() external view returns (uint256) {
        return courseCounter;
    }

    /// @notice Get course details for a specific user
    /// @param _id The course ID
    /// @param _user The user address
    /// @return course The course data
    /// @return enrolled Whether the user is enrolled
    /// @return score The user's progress score
    /// @return attendees The number of participants
    function getCourse(
        uint256 _id,
        address _user
    )
        external
        view
        returns (Course memory course, bool enrolled, uint8 score, uint256 attendees)
    {
        if (_id >= courseCounter) {
            revert CourseNotFound();
        }

        course = courses[_id];
        enrolled = isEnrolled[_user][_id];
        score = enrolled ? progress[_user][_id] : 0;
        attendees = participants[_id].length;
    }

    /// @notice Get a user's total points
    /// @param _user The user address
    function getUserPoints(address _user) external view returns (uint256) {
        return points[_user];
    }

    /// @notice Check if a user has completed a specific course
    /// @param _user The user address
    /// @param _courseId The course ID
    function hasCompletedCourse(address _user, uint256 _courseId) external view returns (bool) {
        return completedCourses[_user][_courseId];
    }

    /// @notice Check if a user is enrolled in a specific course
    /// @param _user The user address
    /// @param _courseId The course ID
    function isUserEnrolled(address _user, uint256 _courseId) external view returns (bool) {
        return isEnrolled[_user][_courseId];
    }

    /// @notice Get all courses
    function getCourses() external view returns (Course[] memory) {
        Course[] memory courseList = new Course[](courseCounter);
        for (uint256 i = 0; i < courseCounter; i++) {
            courseList[i] = courses[i];
        }
        return courseList;
    }

    /// @notice Get the number of participants for a specific course
    /// @param _courseId The course ID
    function numParticipants(uint256 _courseId) external view returns (uint256) {
        return participants[_courseId].length;
    }

    /// @notice Get participant counts for all courses
    function getAllParticipants() external view returns (uint256[] memory) {
        uint256[] memory courseParticipants = new uint256[](courseCounter);
        for (uint256 i = 0; i < courseCounter; i++) {
            courseParticipants[i] = participants[i].length;
        }
        return courseParticipants;
    }

    /// @notice Get the current relayer address
    function getRelayer() external view returns (address) {
        return relayer;
    }
}
