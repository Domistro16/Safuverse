// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/metatx/ERC2771Context.sol";
import "./IReverseRegistrar.sol";
import "./ILevel3Course.sol";
import "./CourseFactory.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/metatx/ERC2771Forwarder.sol";
import "./ENS.sol";
import "./INameResolver.sol";

contract Level3Course is ILevel3Course, Ownable {
    IReverseRegistrar public reverse;
    ENS public registry;
    address public courseFactory;
    uint256 public courseCounter;
    mapping(address => mapping(uint256 => bool)) isEnrolled;
    mapping(address => mapping(uint256 => uint8)) public progress;
    mapping(uint256 => address[]) public participants;
    mapping(uint256 => Course) public courses;
    mapping(address => uint256) public points;
    mapping(address => mapping(uint256 => bool)) public completedCourses;

    event CourseEnrolled(address indexed user, uint256 courseId);
    event ProgressUpdated(
        address indexed user,
        uint256 courseId,
        uint8 progress
    );

    modifier domainOwner(address user) {
        bytes32 node = reverse.node(user);
        address resolver = registry.resolver(node);
        string memory name = INameResolver(resolver).name(node);

        require(
            keccak256(bytes(name)) != keccak256(bytes("")),
            "No .safu Primary Name"
        );
        _;
    }

    modifier onlyFactory() {
        require(_msgSender() == courseFactory, "Not Course Factory");
        _;
    }

    constructor(
        address _reverse,
        address owner,
        address _registry
    ) Ownable(owner) {
        reverse = IReverseRegistrar(_reverse);
        registry = ENS(_registry);
    }

    function setCourseFactory(address _factory) external onlyOwner {
        require(courseFactory == address(0), "Factory already set");
        courseFactory = _factory;
    }

    function deleteCourse(uint256 _courseId) public onlyOwner {
        delete courses[_courseId];
    }

    function updateCourseRegistry(
        uint256 coursecounter,
        Course memory course
    ) public onlyFactory {
        courses[coursecounter] = course;
        courseCounter = coursecounter + 1;
    }

    function updateCourse(
        Course memory course,
        uint256 coursecounter
    ) public onlyFactory {
        courses[coursecounter] = course;
    }

    function numCourses() public view returns (uint256) {
        return courseCounter;
    }

    function enroll(
        uint _id,
        address _user
    ) public onlyOwner domainOwner(_user) {
        require(_id < courseCounter, "Course does not exist");

        require(!isEnrolled[_user][_id], "User is already enrolled");

        isEnrolled[_user][_id] = true; // Mark as enrolled
        participants[_id].push(_user);
    }

    function updateCourseProgress(
        uint256 _courseId,
        uint8 _progress,
        address _user,
        uint256 _points
    ) public onlyOwner domainOwner(_user) {
        require(_courseId < courseCounter, "Course does not exist");

        require(
            isEnrolled[_user][_courseId],
            "User must be enrolled in the course"
        );
        require(_progress <= 100, "Progress cannot exceed 100%");

        progress[_user][_courseId] = _progress;
        points[_user] = _points; // Update user points
        if (_progress == 100) {
            // If progress is 100%, mark as completed
            isEnrolled[_user][_courseId] = false; // Unenroll user
            // Optionally, you can add logic to handle completed lessons here
            completedCourses[_user][_courseId] = true; // Mark course as completed
        }
        emit ProgressUpdated(_user, _courseId, _progress);
    }

    function getCourse(
        uint256 _id,
        address _user
    )
        public
        view
        returns (Course memory, bool enrolled, uint8 score, uint256 attendees)
    {
        require(_id < courseCounter, "Course does not exist");

        Course storage course = courses[_id];
        bool isUserEnrolled = isEnrolled[_user][_id]; // Direct lookup
        uint8 userProgress = isUserEnrolled ? progress[_user][_id] : 0;
        uint256 length = participants[_id].length;

        return (course, isUserEnrolled, userProgress, length);
    }

    function getUserPoints(address _user) public view returns (uint256) {
        return points[_user];
    }

    function getCourses() public view returns (Course[] memory) {
        Course[] memory courseList = new Course[](courseCounter);
        for (uint256 i = 0; i < courseCounter; i++) {
            courseList[i] = courses[i];
        }
        return courseList;
    }

    function numParticipants(uint256 _courseId) public view returns (uint256) {
        uint256 length = participants[_courseId].length;
        return length;
    }

    function getAllParticipants() public view returns (uint256[] memory) {
        uint256[] memory courseParticipants = new uint256[](courseCounter);
        for (uint256 i = 0; i < courseCounter; i++) {
            courseParticipants[i] = participants[i].length;
        }
        return courseParticipants;
    }
}
