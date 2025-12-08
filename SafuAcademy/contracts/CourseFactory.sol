// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./Level3Course.sol";
import "./ILevel3Course.sol";

contract CourseFactory is Ownable, ILevel3Course {
    Level3Course public level3Course;
    uint256 public courseCounter;
    mapping(uint256 => Course) public courses;

    event CourseAdded(uint256 indexed id, string title);
    event CourseEdited(uint256 indexed id, string title);
    event QuizAdded(uint256 indexed courseId, uint256 lessonId);
    event LessonAdded(uint256 indexed courseId, uint256 lessonId, string title);

    error CourseNotFound();

    constructor(address _level3course, address _owner) Ownable(_owner) {
        courseCounter = 0;
        level3Course = Level3Course(_level3course);
    }

    /// @notice Get the total number of courses
    function numCourses() external view returns (uint256) {
        return courseCounter;
    }

    /// @notice Delete a course
    /// @param _courseId The course ID to delete
    function deleteCourse(uint256 _courseId) external onlyOwner {
        delete courses[_courseId];
        level3Course.deleteCourse(_courseId);
    }

    /// @notice Add a new course
    function addCourse(
        string memory _title,
        string memory _description,
        string memory _longDescription,
        string memory _instructor,
        string[] memory _objectives,
        string[] memory _prerequisites,
        string memory _category,
        string memory _level,
        string memory _url,
        Lesson[] memory _lessons,
        string memory _duration
    ) external onlyOwner {
        Course storage c = courses[courseCounter];
        c.id = courseCounter;
        c.title = _title;
        c.description = _description;
        c.level = _level;
        c.url = _url;
        c.longDescription = _longDescription;
        c.instructor = _instructor;
        c.objectives = _objectives;
        c.category = _category;
        c.prerequisites = _prerequisites;
        c.duration = _duration;
        
        // Copy lessons
        for (uint256 i = 0; i < _lessons.length; i++) {
            c.lessons.push(_lessons[i]);
        }
        
        level3Course.updateCourseRegistry(courseCounter, c);
        emit CourseAdded(courseCounter, _title);
        courseCounter = courseCounter + 1;
    }

    /// @notice Edit an existing course
    function editCourse(
        uint256 _courseId,
        string memory _title,
        string memory _description,
        string memory _longDescription,
        string memory _instructor,
        string[] memory _objectives,
        string[] memory _prerequisites,
        string memory _category,
        string memory _level,
        string memory _url,
        Lesson[] memory _lessons,
        string memory _duration
    ) external onlyOwner {
        if (_courseId >= courseCounter) {
            revert CourseNotFound();
        }
        
        Course storage c = courses[_courseId];
        c.title = _title;
        c.description = _description;
        c.level = _level;
        c.url = _url;
        c.longDescription = _longDescription;
        c.instructor = _instructor;
        c.objectives = _objectives;
        c.category = _category;
        c.prerequisites = _prerequisites;
        c.duration = _duration;
        
        // Clear existing lessons and add new ones
        delete c.lessons;
        for (uint256 i = 0; i < _lessons.length; i++) {
            c.lessons.push(_lessons[i]);
        }
        
        level3Course.updateCourse(c, _courseId);
        emit CourseEdited(_courseId, _title);
    }

    /// @notice Add a quiz to a lesson
    function addQuiz(
        uint256 _courseId,
        uint256 _lessonId,
        string memory _quizzes
    ) external onlyOwner {
        if (_courseId >= courseCounter) {
            revert CourseNotFound();
        }
        courses[_courseId].lessons[_lessonId].quizzes = _quizzes;
        level3Course.updateCourse(courses[_courseId], _courseId);
        emit QuizAdded(_courseId, _lessonId);
    }

    /// @notice Edit a quiz in a lesson
    function editQuiz(
        uint256 _courseId,
        uint256 _lessonId,
        string memory _quizzes
    ) external onlyOwner {
        if (_courseId >= courseCounter) {
            revert CourseNotFound();
        }
        courses[_courseId].lessons[_lessonId].quizzes = _quizzes;
        level3Course.updateCourse(courses[_courseId], _courseId);
        emit QuizAdded(_courseId, _lessonId);
    }

    /// @notice Add a lesson to a course
    function addLesson(
        uint256 _courseId,
        string memory _title,
        string[] memory _url
    ) external onlyOwner {
        if (_courseId >= courseCounter) {
            revert CourseNotFound();
        }

        Lesson storage newLesson = courses[_courseId].lessons.push();
        newLesson.id = courses[_courseId].lessons.length - 1;
        newLesson.lessontitle = _title;
        newLesson.url = _url;
        
        level3Course.updateCourse(courses[_courseId], _courseId);
        emit LessonAdded(_courseId, newLesson.id, _title);
    }

    /// @notice Edit a lesson in a course
    function editLesson(
        uint256 _courseId,
        uint256 _lessonId,
        string memory _title,
        string[] memory _url
    ) external onlyOwner {
        if (_courseId >= courseCounter) {
            revert CourseNotFound();
        }

        Lesson storage lesson = courses[_courseId].lessons[_lessonId];
        lesson.lessontitle = _title;
        lesson.url = _url;
        
        level3Course.updateCourse(courses[_courseId], _courseId);
        emit LessonAdded(_courseId, lesson.id, _title);
    }
}
