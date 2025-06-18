-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 18, 2025 at 09:37 AM
-- Server version: 10.6.0-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `school_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `auth_group`
--

CREATE TABLE `auth_group` (
  `id` int(11) NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `auth_group_permissions`
--

CREATE TABLE `auth_group_permissions` (
  `id` bigint(20) NOT NULL,
  `group_id` int(11) NOT NULL,
  `permission_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `auth_permission`
--

CREATE TABLE `auth_permission` (
  `id` int(11) NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content_type_id` int(11) NOT NULL,
  `codename` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `auth_permission`
--

INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES
(1, 'Can add log entry', 1, 'add_logentry'),
(2, 'Can change log entry', 1, 'change_logentry'),
(3, 'Can delete log entry', 1, 'delete_logentry'),
(4, 'Can view log entry', 1, 'view_logentry'),
(5, 'Can add permission', 2, 'add_permission'),
(6, 'Can change permission', 2, 'change_permission'),
(7, 'Can delete permission', 2, 'delete_permission'),
(8, 'Can view permission', 2, 'view_permission'),
(9, 'Can add group', 3, 'add_group'),
(10, 'Can change group', 3, 'change_group'),
(11, 'Can delete group', 3, 'delete_group'),
(12, 'Can view group', 3, 'view_group'),
(13, 'Can add content type', 4, 'add_contenttype'),
(14, 'Can change content type', 4, 'change_contenttype'),
(15, 'Can delete content type', 4, 'delete_contenttype'),
(16, 'Can view content type', 4, 'view_contenttype'),
(17, 'Can add session', 5, 'add_session'),
(18, 'Can change session', 5, 'change_session'),
(19, 'Can delete session', 5, 'delete_session'),
(20, 'Can view session', 5, 'view_session'),
(21, 'Can add Academic Session', 6, 'add_academicsession'),
(22, 'Can change Academic Session', 6, 'change_academicsession'),
(23, 'Can delete Academic Session', 6, 'delete_academicsession'),
(24, 'Can view Academic Session', 6, 'view_academicsession'),
(25, 'Can add Campus', 7, 'add_campus'),
(26, 'Can change Campus', 7, 'change_campus'),
(27, 'Can delete Campus', 7, 'delete_campus'),
(28, 'Can view Campus', 7, 'view_campus'),
(29, 'Can add Class', 8, 'add_class'),
(30, 'Can change Class', 8, 'change_class'),
(31, 'Can delete Class', 8, 'delete_class'),
(32, 'Can view Class', 8, 'view_class'),
(33, 'Can add Class Capacity', 9, 'add_classcapacity'),
(34, 'Can change Class Capacity', 9, 'change_classcapacity'),
(35, 'Can delete Class Capacity', 9, 'delete_classcapacity'),
(36, 'Can view Class Capacity', 9, 'view_classcapacity'),
(37, 'Can add Department', 10, 'add_department'),
(38, 'Can change Department', 10, 'change_department'),
(39, 'Can delete Department', 10, 'delete_department'),
(40, 'Can view Department', 10, 'view_department'),
(41, 'Can add Grading Scale', 11, 'add_gradingscale'),
(42, 'Can change Grading Scale', 11, 'change_gradingscale'),
(43, 'Can delete Grading Scale', 11, 'delete_gradingscale'),
(44, 'Can view Grading Scale', 11, 'view_gradingscale'),
(45, 'Can add Leave Type', 12, 'add_leavetype'),
(46, 'Can change Leave Type', 12, 'change_leavetype'),
(47, 'Can delete Leave Type', 12, 'delete_leavetype'),
(48, 'Can view Leave Type', 12, 'view_leavetype'),
(49, 'Can add Locale Settings', 13, 'add_localesettings'),
(50, 'Can change Locale Settings', 13, 'change_localesettings'),
(51, 'Can delete Locale Settings', 13, 'delete_localesettings'),
(52, 'Can view Locale Settings', 13, 'view_localesettings'),
(53, 'Can add Notification Settings', 14, 'add_notificationsettings'),
(54, 'Can change Notification Settings', 14, 'change_notificationsettings'),
(55, 'Can delete Notification Settings', 14, 'delete_notificationsettings'),
(56, 'Can view Notification Settings', 14, 'view_notificationsettings'),
(57, 'Can add Notification Template', 15, 'add_notificationtemplate'),
(58, 'Can change Notification Template', 15, 'change_notificationtemplate'),
(59, 'Can delete Notification Template', 15, 'delete_notificationtemplate'),
(60, 'Can view Notification Template', 15, 'view_notificationtemplate'),
(61, 'Can add Promotion Rules', 16, 'add_promotionrules'),
(62, 'Can change Promotion Rules', 16, 'change_promotionrules'),
(63, 'Can delete Promotion Rules', 16, 'delete_promotionrules'),
(64, 'Can view Promotion Rules', 16, 'view_promotionrules'),
(65, 'Can add Resource', 17, 'add_resource'),
(66, 'Can change Resource', 17, 'change_resource'),
(67, 'Can delete Resource', 17, 'delete_resource'),
(68, 'Can view Resource', 17, 'view_resource'),
(69, 'Can add School', 18, 'add_school'),
(70, 'Can change School', 18, 'change_school'),
(71, 'Can delete School', 18, 'delete_school'),
(72, 'Can view School', 18, 'view_school'),
(73, 'Can add Staff Role', 19, 'add_staffrole'),
(74, 'Can change Staff Role', 19, 'change_staffrole'),
(75, 'Can delete Staff Role', 19, 'delete_staffrole'),
(76, 'Can view Staff Role', 19, 'view_staffrole'),
(77, 'Can add student document type', 20, 'add_studentdocumenttype'),
(78, 'Can change student document type', 20, 'change_studentdocumenttype'),
(79, 'Can delete student document type', 20, 'delete_studentdocumenttype'),
(80, 'Can view student document type', 20, 'view_studentdocumenttype'),
(81, 'Can add user', 21, 'add_user'),
(82, 'Can change user', 21, 'change_user'),
(83, 'Can delete user', 21, 'delete_user'),
(84, 'Can view user', 21, 'view_user'),
(85, 'Can add Building', 22, 'add_building'),
(86, 'Can change Building', 22, 'change_building'),
(87, 'Can delete Building', 22, 'delete_building'),
(88, 'Can view Building', 22, 'view_building'),
(89, 'Can add holiday', 23, 'add_holiday'),
(90, 'Can change holiday', 23, 'change_holiday'),
(91, 'Can delete holiday', 23, 'delete_holiday'),
(92, 'Can view holiday', 23, 'view_holiday'),
(93, 'Can add Bulk Leave Assignment', 24, 'add_bulkleaveassignment'),
(94, 'Can change Bulk Leave Assignment', 24, 'change_bulkleaveassignment'),
(95, 'Can delete Bulk Leave Assignment', 24, 'delete_bulkleaveassignment'),
(96, 'Can view Bulk Leave Assignment', 24, 'view_bulkleaveassignment'),
(97, 'Can add Room', 25, 'add_room'),
(98, 'Can change Room', 25, 'change_room'),
(99, 'Can delete Room', 25, 'delete_room'),
(100, 'Can view Room', 25, 'view_room'),
(101, 'Can add Parent', 26, 'add_parent'),
(102, 'Can change Parent', 26, 'change_parent'),
(103, 'Can delete Parent', 26, 'delete_parent'),
(104, 'Can view Parent', 26, 'view_parent'),
(105, 'Can add Grading Settings', 27, 'add_gradingsettings'),
(106, 'Can change Grading Settings', 27, 'change_gradingsettings'),
(107, 'Can delete Grading Settings', 27, 'delete_gradingsettings'),
(108, 'Can view Grading Settings', 27, 'view_gradingsettings'),
(109, 'Can add Fee Type', 28, 'add_feetype'),
(110, 'Can change Fee Type', 28, 'change_feetype'),
(111, 'Can delete Fee Type', 28, 'delete_feetype'),
(112, 'Can view Fee Type', 28, 'view_feetype'),
(113, 'Can add Fee Settings', 29, 'add_feesettings'),
(114, 'Can change Fee Settings', 29, 'change_feesettings'),
(115, 'Can delete Fee Settings', 29, 'delete_feesettings'),
(116, 'Can view Fee Settings', 29, 'view_feesettings'),
(117, 'Can add Attendance Settings', 30, 'add_attendancesettings'),
(118, 'Can change Attendance Settings', 30, 'change_attendancesettings'),
(119, 'Can delete Attendance Settings', 30, 'delete_attendancesettings'),
(120, 'Can view Attendance Settings', 30, 'view_attendancesettings'),
(121, 'Can add Section', 31, 'add_section'),
(122, 'Can change Section', 31, 'change_section'),
(123, 'Can delete Section', 31, 'delete_section'),
(124, 'Can view Section', 31, 'view_section'),
(125, 'Can add Admission Fee', 32, 'add_admissionfee'),
(126, 'Can change Admission Fee', 32, 'change_admissionfee'),
(127, 'Can delete Admission Fee', 32, 'delete_admissionfee'),
(128, 'Can view Admission Fee', 32, 'view_admissionfee'),
(129, 'Can add Student', 33, 'add_student'),
(130, 'Can change Student', 33, 'change_student'),
(131, 'Can delete Student', 33, 'delete_student'),
(132, 'Can view Student', 33, 'view_student'),
(133, 'Can add certificate', 34, 'add_certificate'),
(134, 'Can change certificate', 34, 'change_certificate'),
(135, 'Can delete certificate', 34, 'delete_certificate'),
(136, 'Can view certificate', 34, 'view_certificate'),
(137, 'Can add student document', 35, 'add_studentdocument'),
(138, 'Can change student document', 35, 'change_studentdocument'),
(139, 'Can delete student document', 35, 'delete_studentdocument'),
(140, 'Can view student document', 35, 'view_studentdocument'),
(141, 'Can add Student Fee', 36, 'add_studentfee'),
(142, 'Can change Student Fee', 36, 'change_studentfee'),
(143, 'Can delete Student Fee', 36, 'delete_studentfee'),
(144, 'Can view Student Fee', 36, 'view_studentfee'),
(145, 'Can add Subject', 37, 'add_subject'),
(146, 'Can change Subject', 37, 'change_subject'),
(147, 'Can delete Subject', 37, 'delete_subject'),
(148, 'Can view Subject', 37, 'view_subject'),
(149, 'Can add Term', 38, 'add_term'),
(150, 'Can change Term', 38, 'change_term'),
(151, 'Can delete Term', 38, 'delete_term'),
(152, 'Can view Term', 38, 'view_term'),
(153, 'Can add Student-Parent Relationship', 39, 'add_studentparent'),
(154, 'Can change Student-Parent Relationship', 39, 'change_studentparent'),
(155, 'Can delete Student-Parent Relationship', 39, 'delete_studentparent'),
(156, 'Can view Student-Parent Relationship', 39, 'view_studentparent'),
(157, 'Can add Staff', 40, 'add_staff'),
(158, 'Can change Staff', 40, 'change_staff'),
(159, 'Can delete Staff', 40, 'delete_staff'),
(160, 'Can view Staff', 40, 'view_staff'),
(161, 'Can add Staff Leave', 41, 'add_staffleave'),
(162, 'Can change Staff Leave', 41, 'change_staffleave'),
(163, 'Can delete Staff Leave', 41, 'delete_staffleave'),
(164, 'Can view Staff Leave', 41, 'view_staffleave');

-- --------------------------------------------------------

--
-- Table structure for table `certificates`
--

CREATE TABLE `certificates` (
  `id` bigint(20) NOT NULL,
  `certificate_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `issue_date` date NOT NULL,
  `completion_date` date DEFAULT NULL,
  `reason` longtext COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `remarks` longtext COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `academic_session_id_id` bigint(20) NOT NULL,
  `class_id_id` bigint(20) NOT NULL,
  `section_id_id` bigint(20) DEFAULT NULL,
  `student_id_id` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `certificates`
--

INSERT INTO `certificates` (`id`, `certificate_type`, `issue_date`, `completion_date`, `reason`, `remarks`, `created_at`, `updated_at`, `academic_session_id_id`, `class_id_id`, `section_id_id`, `student_id_id`) VALUES
(1, 'graduation', '2025-06-16', '2025-06-08', NULL, 'jbhkjnlkm', '2025-06-16 16:31:20.952568', '2025-06-16 16:31:20.952592', 1, 1, 1, 1);

-- --------------------------------------------------------

--
-- Table structure for table `core_academicsession`
--

CREATE TABLE `core_academicsession` (
  `id` bigint(20) NOT NULL,
  `name` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `core_academicsession`
--

INSERT INTO `core_academicsession` (`id`, `name`, `status`, `start_date`, `end_date`, `created_at`, `updated_at`) VALUES
(1, 'SESSION 2026', 'upcoming', '2025-01-26', '2026-02-01', '2025-06-16 11:13:53.222043', '2025-06-16 11:13:53.222076');

-- --------------------------------------------------------

--
-- Table structure for table `core_admissionfee`
--

CREATE TABLE `core_admissionfee` (
  `id` bigint(20) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `class_id_id` bigint(20) NOT NULL,
  `school_id` bigint(20) NOT NULL,
  `section_id` bigint(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `core_attendancesettings`
--

CREATE TABLE `core_attendancesettings` (
  `id` bigint(20) NOT NULL,
  `marking_scheme` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `default_marking` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `custom_statuses` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`custom_statuses`)),
  `min_attendance_percentage` int(11) DEFAULT NULL,
  `auto_notification` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `notification_threshold` int(11) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `school_id` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `core_attendancesettings`
--

INSERT INTO `core_attendancesettings` (`id`, `marking_scheme`, `default_marking`, `custom_statuses`, `min_attendance_percentage`, `auto_notification`, `notification_threshold`, `updated_at`, `school_id`) VALUES
(1, 'basic', 'P', NULL, 75, 'none', 75, '2025-06-16 16:33:46.595094', 1);

-- --------------------------------------------------------

--
-- Table structure for table `core_building`
--

CREATE TABLE `core_building` (
  `id` bigint(20) NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  `campus_id` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `core_bulkleaveassignment`
--

CREATE TABLE `core_bulkleaveassignment` (
  `id` bigint(20) NOT NULL,
  `target_group` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `days` double NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `reason` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `leave_type_id` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `core_campus`
--

CREATE TABLE `core_campus` (
  `id` bigint(20) NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `contact_person` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `core_class`
--

CREATE TABLE `core_class` (
  `id` bigint(20) NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `max_capacity` int(11) NOT NULL,
  `is_active` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `core_class`
--

INSERT INTO `core_class` (`id`, `name`, `max_capacity`, `is_active`) VALUES
(1, 'nursery', 100, 1);

-- --------------------------------------------------------

--
-- Table structure for table `core_classcapacity`
--

CREATE TABLE `core_classcapacity` (
  `id` bigint(20) NOT NULL,
  `default_capacity` int(11) NOT NULL,
  `max_capacity` int(11) NOT NULL,
  `updated_at` datetime(6) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `core_department`
--

CREATE TABLE `core_department` (
  `id` bigint(20) NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `core_department`
--

INSERT INTO `core_department` (`id`, `name`, `is_active`) VALUES
(1, 'Administration', 1),
(2, 'Account', 1),
(3, 'Library', 1),
(4, 'Sport', 1),
(5, 'Admission', 1),
(6, 'Canteen', 1);

-- --------------------------------------------------------

--
-- Table structure for table `core_feesettings`
--

CREATE TABLE `core_feesettings` (
  `id` bigint(20) NOT NULL,
  `due_date` int(11) NOT NULL,
  `late_fee_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `late_fee_amount` decimal(10,2) NOT NULL,
  `reminder_days` int(11) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `school_id` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `core_feesettings`
--

INSERT INTO `core_feesettings` (`id`, `due_date`, `late_fee_type`, `late_fee_amount`, `reminder_days`, `updated_at`, `school_id`) VALUES
(1, 10, 'fixed', 0.00, 5, '2025-06-16 16:33:46.615315', 1);

-- --------------------------------------------------------

--
-- Table structure for table `core_feetype`
--

CREATE TABLE `core_feetype` (
  `id` bigint(20) NOT NULL,
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `default_amount` decimal(10,2) NOT NULL,
  `is_mandatory` tinyint(1) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `school_id` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `core_gradingscale`
--

CREATE TABLE `core_gradingscale` (
  `id` bigint(20) NOT NULL,
  `grade` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `percentage_range` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `gpa` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `core_gradingsettings`
--

CREATE TABLE `core_gradingsettings` (
  `id` bigint(20) NOT NULL,
  `grading_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `default_passing_grade` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `grade_ranges` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`grade_ranges`)),
  `updated_at` datetime(6) NOT NULL,
  `school_id` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `core_gradingsettings`
--

INSERT INTO `core_gradingsettings` (`id`, `grading_type`, `default_passing_grade`, `grade_ranges`, `updated_at`, `school_id`) VALUES
(1, 'percentage', '40', NULL, '2025-06-16 16:33:46.583132', 1);

-- --------------------------------------------------------

--
-- Table structure for table `core_holiday`
--

CREATE TABLE `core_holiday` (
  `id` bigint(20) NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `holiday_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `holiday_category` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `session_id` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `core_leavetype`
--

CREATE TABLE `core_leavetype` (
  `id` bigint(20) NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `default_days` int(11) NOT NULL,
  `unit` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `allow_carry_over` tinyint(1) NOT NULL,
  `max_carry_over_days` int(11) DEFAULT NULL,
  `paid_status` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `applicable_gender` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `leave_for` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_system_leave` tinyint(1) NOT NULL,
  `is_active` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `core_leavetype`
--

INSERT INTO `core_leavetype` (`id`, `name`, `default_days`, `unit`, `allow_carry_over`, `max_carry_over_days`, `paid_status`, `applicable_gender`, `leave_for`, `is_system_leave`, `is_active`) VALUES
(1, 'sick leave', 1, 'days/year', 1, 2, 'paid', 'any', 'staff', 0, 1);

-- --------------------------------------------------------

--
-- Table structure for table `core_localesettings`
--

CREATE TABLE `core_localesettings` (
  `id` bigint(20) NOT NULL,
  `timezone` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `language` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `date_format` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `time_format` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `currency_code` varchar(3) COLLATE utf8mb4_unicode_ci NOT NULL,
  `currency_symbol` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `first_day_of_week` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at` datetime(6) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `core_notificationsettings`
--

CREATE TABLE `core_notificationsettings` (
  `id` bigint(20) NOT NULL,
  `smtp_host` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `smtp_port` int(11) DEFAULT NULL,
  `smtp_username` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `smtp_password` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `smtp_encryption` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `from_email` varchar(254) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `from_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sms_provider` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sms_api_key` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sms_sender_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_at` datetime(6) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `core_notificationtemplate`
--

CREATE TABLE `core_notificationtemplate` (
  `id` bigint(20) NOT NULL,
  `template_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `core_parent`
--

CREATE TABLE `core_parent` (
  `id` bigint(20) NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` longtext COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `user_id` bigint(20) NOT NULL,
  `school_id` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `core_parent`
--

INSERT INTO `core_parent` (`id`, `phone`, `address`, `created_at`, `updated_at`, `user_id`, `school_id`) VALUES
(1, '2356365636', 'thsi is the address', '2025-06-16 16:30:25.739492', '2025-06-16 16:30:25.739561', 3, 1),
(2, '565656565656', 'newshdfbwb', '2025-06-16 16:50:15.040105', '2025-06-16 16:50:15.040144', 5, 1);

-- --------------------------------------------------------

--
-- Table structure for table `core_promotionrules`
--

CREATE TABLE `core_promotionrules` (
  `id` bigint(20) NOT NULL,
  `min_overall_percentage` int(11) NOT NULL,
  `max_failed_subjects` int(11) NOT NULL,
  `consider_attendance` tinyint(1) NOT NULL,
  `updated_at` datetime(6) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `core_resource`
--

CREATE TABLE `core_resource` (
  `id` bigint(20) NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_count` int(11) NOT NULL,
  `available_count` int(11) NOT NULL,
  `is_active` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `core_room`
--

CREATE TABLE `core_room` (
  `id` bigint(20) NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `capacity` int(11) NOT NULL,
  `room_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  `building_id` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `core_school`
--

CREATE TABLE `core_school` (
  `id` bigint(20) NOT NULL,
  `school_id` char(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(254) COLLATE utf8mb4_unicode_ci NOT NULL,
  `website` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `academic_year` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `logo` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `founded_date` date DEFAULT NULL,
  `affiliation` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `motto` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `core_school`
--

INSERT INTO `core_school` (`id`, `school_id`, `name`, `address`, `phone`, `email`, `website`, `academic_year`, `logo`, `founded_date`, `affiliation`, `motto`, `is_active`, `created_at`, `updated_at`) VALUES
(1, '550e8400e29b41d4a716446655440000', 'Sunrise Academy', '123 Main Street, Kathmandu, Nepal', '+977-1-1234567', 'info@sunriseacademy.edu.np', 'https://www.sunriseacademy.edu.np', '2024-2025', 'school_logos/PPPPPP.png', '2000-01-01', 'CBSE', 'Knowledge is Power', 1, '2025-06-16 16:56:00.000000', '2025-06-16 11:12:24.468939');

-- --------------------------------------------------------

--
-- Table structure for table `core_section`
--

CREATE TABLE `core_section` (
  `id` bigint(20) NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `max_capacity` int(11) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL,
  `class_id_id` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `core_section`
--

INSERT INTO `core_section` (`id`, `name`, `max_capacity`, `is_active`, `class_id_id`) VALUES
(1, 'section A', 20, 1, 1),
(2, 'section B', 20, 1, 1);

-- --------------------------------------------------------

--
-- Table structure for table `core_staff`
--

CREATE TABLE `core_staff` (
  `id` bigint(20) NOT NULL,
  `employee_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `first_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `date_of_birth` date DEFAULT NULL,
  `gender` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` longtext COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `emergency_contact_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `emergency_contact_phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `hire_date` date NOT NULL,
  `employment_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contract_end_date` date DEFAULT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `base_salary` decimal(12,2) NOT NULL,
  `pay_frequency` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tax_status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `allowances` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`allowances`)),
  `deductions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`deductions`)),
  `bank_account_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_branch` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `health_insurance_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pension_plan_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `provident_fund_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `generated_password` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `department_id` bigint(20) DEFAULT NULL,
  `school_id` char(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `staff_role_id` bigint(20) DEFAULT NULL,
  `user_id` bigint(20) NOT NULL,
  `profile_image` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `core_staff`
--

INSERT INTO `core_staff` (`id`, `employee_id`, `first_name`, `last_name`, `date_of_birth`, `gender`, `address`, `phone`, `emergency_contact_name`, `emergency_contact_phone`, `hire_date`, `employment_type`, `contract_end_date`, `status`, `base_salary`, `pay_frequency`, `tax_status`, `allowances`, `deductions`, `bank_account_number`, `bank_name`, `bank_branch`, `health_insurance_number`, `pension_plan_number`, `provident_fund_number`, `generated_password`, `created_at`, `updated_at`, `department_id`, `school_id`, `staff_role_id`, `user_id`, `profile_image`) VALUES
(1, '20250617-001', 'Admin', 'User', NULL, NULL, NULL, NULL, NULL, NULL, '2025-06-17', 'full_time', NULL, 'active', 0.00, 'monthly', 'non_exempt', '{}', '{}', NULL, NULL, NULL, NULL, NULL, NULL, 'PIWu7asg', '2025-06-16 19:59:54.455884', '2025-06-16 19:59:54.455954', 1, '550e8400e29b41d4a716446655440000', 1, 1, NULL),
(2, '20250617-002', 'Admin', 'User', NULL, NULL, NULL, NULL, NULL, NULL, '2025-06-17', 'full_time', NULL, 'active', 0.00, 'monthly', 'non_exempt', '{}', '{}', NULL, NULL, NULL, NULL, NULL, NULL, 'YourNewSecurePassword', '2025-06-17 20:47:04.000000', '2025-06-17 20:47:04.000000', 1, '550e8400e29b41d4a716446655440000', 1, 6, NULL),
(3, '20250617-003', 'aarti', 'mahato', '2001-01-01', 'male', 'new address', '9856985696', 'ememrgency contact', '9856963652', '2025-06-17', 'full_time', NULL, 'active', 500000.00, 'monthly', 'non_exempt', '{}', '{}', '6565656565', '', '', '', '', '', '7kVxPTui', '2025-06-17 16:04:21.569810', '2025-06-18 03:50:46.654620', 1, '550e8400e29b41d4a716446655440000', 1, 8, 'staff_profiles/20250617-003_Ontext.png');

-- --------------------------------------------------------

--
-- Table structure for table `core_staffleave`
--

CREATE TABLE `core_staffleave` (
  `id` bigint(20) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `days` double NOT NULL,
  `reason` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `academic_session_id` bigint(20) NOT NULL,
  `leave_type_id` bigint(20) NOT NULL,
  `school_id` char(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `staff_id` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `core_staffleave`
--

INSERT INTO `core_staffleave` (`id`, `start_date`, `end_date`, `days`, `reason`, `created_at`, `updated_at`, `academic_session_id`, `leave_type_id`, `school_id`, `staff_id`) VALUES
(1, '2025-06-17', '2025-06-17', 1, 'sick', '2025-06-17 17:51:00.978873', '2025-06-17 17:51:00.978954', 1, 1, '550e8400e29b41d4a716446655440000', 3);

-- --------------------------------------------------------

--
-- Table structure for table `core_staffrole`
--

CREATE TABLE `core_staffrole` (
  `id` bigint(20) NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `core_staffrole`
--

INSERT INTO `core_staffrole` (`id`, `name`, `is_active`) VALUES
(1, 'admin', 1),
(2, 'accountant', 1),
(3, 'teacher', 1),
(4, 'parent', 1),
(5, 'cleaner', 1),
(6, 'Guard', 1),
(7, 'Driver', 1),
(8, 'Principal', 1);

-- --------------------------------------------------------

--
-- Table structure for table `core_staff_classes`
--

CREATE TABLE `core_staff_classes` (
  `id` bigint(20) NOT NULL,
  `staff_id` bigint(20) NOT NULL,
  `class_id` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `core_staff_subjects`
--

CREATE TABLE `core_staff_subjects` (
  `id` bigint(20) NOT NULL,
  `staff_id` bigint(20) NOT NULL,
  `subject_id` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `core_student`
--

CREATE TABLE `core_student` (
  `id` bigint(20) NOT NULL,
  `admission_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `admission_date` date NOT NULL,
  `dob` date DEFAULT NULL,
  `gender` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` longtext COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `previous_school` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `profile_image` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `alumni_type` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `academic_session_id` bigint(20) DEFAULT NULL,
  `class_id_id` bigint(20) DEFAULT NULL,
  `school_id` bigint(20) NOT NULL,
  `section_id` bigint(20) DEFAULT NULL,
  `user_id` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `core_student`
--

INSERT INTO `core_student` (`id`, `admission_number`, `status`, `admission_date`, `dob`, `gender`, `address`, `phone`, `previous_school`, `profile_image`, `alumni_type`, `created_at`, `updated_at`, `academic_session_id`, `class_id_id`, `school_id`, `section_id`, `user_id`) VALUES
(1, '20250616-001', 'alumni', '2025-06-16', '2001-01-01', 'male', 'thsi is the address', '56365236955', 'new', 'student_profiles/logo.png', 'graduated', '2025-06-16 16:30:23.715515', '2025-06-16 16:32:02.421241', 1, 1, 1, 1, 2),
(2, '20250616-002', 'active', '2025-05-16', '2001-01-01', 'male', 'newshdfbwb', '565656565656', NULL, 'student_profiles/Ontext.png', NULL, '2025-06-16 16:50:12.986167', '2025-06-18 05:58:56.869834', 1, 1, 1, 1, 4);

-- --------------------------------------------------------

--
-- Table structure for table `core_studentdocument`
--

CREATE TABLE `core_studentdocument` (
  `id` bigint(20) NOT NULL,
  `file` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `uploaded_at` datetime(6) NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `session_id` bigint(20) DEFAULT NULL,
  `student_id` bigint(20) NOT NULL,
  `document_type_id` bigint(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `core_studentdocument`
--

INSERT INTO `core_studentdocument` (`id`, `file`, `uploaded_at`, `description`, `session_id`, `student_id`, `document_type_id`) VALUES
(1, 'student_documents/2025/06/16/claim_480_3EA0DCB1-8C44-4347-938C-4F47377AA50D_20250611160511_1.pdf', '2025-06-16 16:30:44.170015', 'birth', NULL, 1, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `core_studentdocumenttype`
--

CREATE TABLE `core_studentdocumenttype` (
  `id` bigint(20) NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` longtext COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `core_studentfee`
--

CREATE TABLE `core_studentfee` (
  `id` bigint(20) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `due_date` date NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `admission_fee_id` bigint(20) DEFAULT NULL,
  `student_id` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `core_studentparent`
--

CREATE TABLE `core_studentparent` (
  `id` bigint(20) NOT NULL,
  `relationship` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `parent_id` bigint(20) NOT NULL,
  `student_id` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `core_studentparent`
--

INSERT INTO `core_studentparent` (`id`, `relationship`, `created_at`, `parent_id`, `student_id`) VALUES
(1, 'Parent', '2025-06-16 16:30:25.742361', 1, 1),
(2, 'Parent', '2025-06-16 16:50:15.043280', 2, 2);

-- --------------------------------------------------------

--
-- Table structure for table `core_subject`
--

CREATE TABLE `core_subject` (
  `id` bigint(20) NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subject_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `core_subject_classes`
--

CREATE TABLE `core_subject_classes` (
  `id` bigint(20) NOT NULL,
  `subject_id` bigint(20) NOT NULL,
  `class_id` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `core_term`
--

CREATE TABLE `core_term` (
  `id` bigint(20) NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `session_id` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `core_user`
--

CREATE TABLE `core_user` (
  `id` bigint(20) NOT NULL,
  `password` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_login` datetime(6) DEFAULT NULL,
  `is_superuser` tinyint(1) NOT NULL,
  `email` varchar(254) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `avatar` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL,
  `is_staff` tinyint(1) NOT NULL,
  `school_id` char(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `core_user`
--

INSERT INTO `core_user` (`id`, `password`, `last_login`, `is_superuser`, `email`, `name`, `role`, `avatar`, `is_active`, `is_staff`, `school_id`) VALUES
(1, 'pbkdf2_sha256$1000000$fBhL8KVykpdxrL00W5nC7h$1oZGSfO85mrypvy7KUgBXHJYyXrCeSCu3iHQyUlaUIM=', NULL, 1, 'admin@gmail.com', 'admin', 'admin', NULL, 1, 1, '550e8400e29b41d4a716446655440000'),
(2, 'pbkdf2_sha256$1000000$RSltG8EJvZ8AEoJLCQ8KVK$wvWQ254UNhdAtgMTSqWbh9O0ClkW5GMVCnYmLXsrl4E=', NULL, 0, 'rish@gmail.com', 'auraj', 'student', NULL, 1, 0, '550e8400e29b41d4a716446655440000'),
(3, 'pbkdf2_sha256$1000000$Il9rPWIp9SFfelmplGBKss$LoIggo3GNWcz+DJ2dqMTFFLVh5kjV7s1TY7C1j3RWUo=', NULL, 0, 'pae@gmail.com', 'roshan', 'parent', NULL, 1, 0, '550e8400e29b41d4a716446655440000'),
(4, 'pbkdf2_sha256$1000000$nPXfZG0NMc7aTIckWSylky$k4Q+eXTXVIOI5yx5Zb9TFAvGWWuRdtFBYRbJ35HwQMc=', NULL, 0, 'sjnsdbh@gmail.com', 'roshan sah', 'student', NULL, 1, 0, '550e8400e29b41d4a716446655440000'),
(5, 'pbkdf2_sha256$1000000$dxYaxRKjDM1giaRw8REejQ$dBtgwim/g+Y6zVfHiZU8cU5Iepma/xnmFIE6/s1kDbg=', NULL, 0, 'dndnndn@gmail.com', 'vhjb', 'parent', NULL, 1, 0, '550e8400e29b41d4a716446655440000'),
(6, 'pbkdf2_sha256$1000000$uAQVZzLVpR34724z1HNR4B$8gg8EVVanrDHEfj1lz1ewJZ/2PSdTclTxVqFhbpiFi8=', NULL, 1, 'admin@example.com', 'Admin User', 'admin', NULL, 1, 1, '550e8400e29b41d4a716446655440000'),
(7, 'pbkdf2_sha256$1000000$gRmeXZTdiOdq7Sev4I3IMm$vnAOc62hIEgXIMcrbj0ZKkpDadiucIxHWuiXQLnbyBo=', NULL, 0, 'mahato@gmail.com', 'aarti', 'admin', NULL, 1, 0, NULL),
(8, 'pbkdf2_sha256$1000000$A1Z5UEl2BObCmDh8vNBIZV$iQ5YNt9bbt9QNkd1vBba5Je/X8qsw6w92Mhw3Ycz8DA=', NULL, 0, 'maahto@gmail.com', 'aarti', 'admin', NULL, 1, 0, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `core_user_groups`
--

CREATE TABLE `core_user_groups` (
  `id` bigint(20) NOT NULL,
  `user_id` bigint(20) NOT NULL,
  `group_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `core_user_user_permissions`
--

CREATE TABLE `core_user_user_permissions` (
  `id` bigint(20) NOT NULL,
  `user_id` bigint(20) NOT NULL,
  `permission_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `django_admin_log`
--

CREATE TABLE `django_admin_log` (
  `id` int(11) NOT NULL,
  `action_time` datetime(6) NOT NULL,
  `object_id` longtext COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `object_repr` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `action_flag` smallint(5) UNSIGNED NOT NULL CHECK (`action_flag` >= 0),
  `change_message` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `content_type_id` int(11) DEFAULT NULL,
  `user_id` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `django_content_type`
--

CREATE TABLE `django_content_type` (
  `id` int(11) NOT NULL,
  `app_label` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `model` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `django_content_type`
--

INSERT INTO `django_content_type` (`id`, `app_label`, `model`) VALUES
(1, 'admin', 'logentry'),
(3, 'auth', 'group'),
(2, 'auth', 'permission'),
(4, 'contenttypes', 'contenttype'),
(6, 'core', 'academicsession'),
(32, 'core', 'admissionfee'),
(30, 'core', 'attendancesettings'),
(22, 'core', 'building'),
(24, 'core', 'bulkleaveassignment'),
(7, 'core', 'campus'),
(34, 'core', 'certificate'),
(8, 'core', 'class'),
(9, 'core', 'classcapacity'),
(10, 'core', 'department'),
(29, 'core', 'feesettings'),
(28, 'core', 'feetype'),
(11, 'core', 'gradingscale'),
(27, 'core', 'gradingsettings'),
(23, 'core', 'holiday'),
(12, 'core', 'leavetype'),
(13, 'core', 'localesettings'),
(14, 'core', 'notificationsettings'),
(15, 'core', 'notificationtemplate'),
(26, 'core', 'parent'),
(16, 'core', 'promotionrules'),
(17, 'core', 'resource'),
(25, 'core', 'room'),
(18, 'core', 'school'),
(31, 'core', 'section'),
(40, 'core', 'staff'),
(41, 'core', 'staffleave'),
(19, 'core', 'staffrole'),
(33, 'core', 'student'),
(35, 'core', 'studentdocument'),
(20, 'core', 'studentdocumenttype'),
(36, 'core', 'studentfee'),
(39, 'core', 'studentparent'),
(37, 'core', 'subject'),
(38, 'core', 'term'),
(21, 'core', 'user'),
(5, 'sessions', 'session');

-- --------------------------------------------------------

--
-- Table structure for table `django_migrations`
--

CREATE TABLE `django_migrations` (
  `id` bigint(20) NOT NULL,
  `app` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `applied` datetime(6) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `django_migrations`
--

INSERT INTO `django_migrations` (`id`, `app`, `name`, `applied`) VALUES
(1, 'contenttypes', '0001_initial', '2025-06-16 11:08:32.026668'),
(2, 'contenttypes', '0002_remove_content_type_name', '2025-06-16 11:08:32.052173'),
(3, 'auth', '0001_initial', '2025-06-16 11:08:32.181067'),
(4, 'auth', '0002_alter_permission_name_max_length', '2025-06-16 11:08:32.210683'),
(5, 'auth', '0003_alter_user_email_max_length', '2025-06-16 11:08:32.215956'),
(6, 'auth', '0004_alter_user_username_opts', '2025-06-16 11:08:32.220360'),
(7, 'auth', '0005_alter_user_last_login_null', '2025-06-16 11:08:32.224772'),
(8, 'auth', '0006_require_contenttypes_0002', '2025-06-16 11:08:32.226587'),
(9, 'auth', '0007_alter_validators_add_error_messages', '2025-06-16 11:08:32.233257'),
(10, 'auth', '0008_alter_user_username_max_length', '2025-06-16 11:08:32.238157'),
(11, 'auth', '0009_alter_user_last_name_max_length', '2025-06-16 11:08:32.242347'),
(12, 'auth', '0010_alter_group_name_max_length', '2025-06-16 11:08:32.251683'),
(13, 'auth', '0011_update_proxy_permissions', '2025-06-16 11:08:32.256735'),
(14, 'auth', '0012_alter_user_first_name_max_length', '2025-06-16 11:08:32.261421'),
(15, 'core', '0001_initial', '2025-06-16 11:08:34.126517'),
(16, 'admin', '0001_initial', '2025-06-16 11:08:34.214533'),
(17, 'admin', '0002_logentry_remove_auto_add', '2025-06-16 11:08:34.224396'),
(18, 'admin', '0003_logentry_add_action_flag_choices', '2025-06-16 11:08:34.238721'),
(19, 'sessions', '0001_initial', '2025-06-16 11:08:34.258224'),
(20, 'core', '0002_staff', '2025-06-16 17:18:20.706163'),
(21, 'core', '0003_alter_staff_school_alter_user_school', '2025-06-17 14:55:28.476898'),
(22, 'core', '0004_change_school_id_to_uuid', '2025-06-17 14:55:28.480417'),
(23, 'core', '0005_staffleave', '2025-06-17 17:37:14.199574'),
(24, 'core', '0006_staff_profile_image', '2025-06-17 18:32:06.082412');

-- --------------------------------------------------------

--
-- Table structure for table `django_session`
--

CREATE TABLE `django_session` (
  `session_key` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `session_data` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `expire_date` datetime(6) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `auth_group`
--
ALTER TABLE `auth_group`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `auth_group_permissions`
--
ALTER TABLE `auth_group_permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `auth_group_permissions_group_id_permission_id_0cd325b0_uniq` (`group_id`,`permission_id`),
  ADD KEY `auth_group_permissio_permission_id_84c5c92e_fk_auth_perm` (`permission_id`);

--
-- Indexes for table `auth_permission`
--
ALTER TABLE `auth_permission`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `auth_permission_content_type_id_codename_01ab375a_uniq` (`content_type_id`,`codename`);

--
-- Indexes for table `certificates`
--
ALTER TABLE `certificates`
  ADD PRIMARY KEY (`id`),
  ADD KEY `certificates_academic_session_id__b20be5e3_fk_core_acad` (`academic_session_id_id`),
  ADD KEY `certificates_class_id_id_92f1e079_fk_core_class_id` (`class_id_id`),
  ADD KEY `certificates_section_id_id_0dd0c9c6_fk_core_section_id` (`section_id_id`),
  ADD KEY `certificates_student_id_id_19dc21d7_fk_core_student_id` (`student_id_id`);

--
-- Indexes for table `core_academicsession`
--
ALTER TABLE `core_academicsession`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `core_admissionfee`
--
ALTER TABLE `core_admissionfee`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `core_admissionfee_school_id_class_id_id_section_id_987662b6_uniq` (`school_id`,`class_id_id`,`section_id`),
  ADD KEY `core_admissionfee_class_id_id_de193edc_fk_core_class_id` (`class_id_id`),
  ADD KEY `core_admissionfee_section_id_f5f1fe6d_fk_core_section_id` (`section_id`);

--
-- Indexes for table `core_attendancesettings`
--
ALTER TABLE `core_attendancesettings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `core_attendancesettings_school_id_5892c727_fk_core_school_id` (`school_id`);

--
-- Indexes for table `core_building`
--
ALTER TABLE `core_building`
  ADD PRIMARY KEY (`id`),
  ADD KEY `core_building_campus_id_a4c91ee2_fk_core_campus_id` (`campus_id`);

--
-- Indexes for table `core_bulkleaveassignment`
--
ALTER TABLE `core_bulkleaveassignment`
  ADD PRIMARY KEY (`id`),
  ADD KEY `core_bulkleaveassign_leave_type_id_369ea8b5_fk_core_leav` (`leave_type_id`);

--
-- Indexes for table `core_campus`
--
ALTER TABLE `core_campus`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `core_class`
--
ALTER TABLE `core_class`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `core_classcapacity`
--
ALTER TABLE `core_classcapacity`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `core_department`
--
ALTER TABLE `core_department`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `core_feesettings`
--
ALTER TABLE `core_feesettings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `core_feesettings_school_id_9e884dba_fk_core_school_id` (`school_id`);

--
-- Indexes for table `core_feetype`
--
ALTER TABLE `core_feetype`
  ADD PRIMARY KEY (`id`),
  ADD KEY `core_feetype_school_id_30ceafdd_fk_core_school_id` (`school_id`);

--
-- Indexes for table `core_gradingscale`
--
ALTER TABLE `core_gradingscale`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `core_gradingsettings`
--
ALTER TABLE `core_gradingsettings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `core_gradingsettings_school_id_5317d88e_fk_core_school_id` (`school_id`);

--
-- Indexes for table `core_holiday`
--
ALTER TABLE `core_holiday`
  ADD PRIMARY KEY (`id`),
  ADD KEY `core_holiday_session_id_1ac6fbae_fk_core_academicsession_id` (`session_id`);

--
-- Indexes for table `core_leavetype`
--
ALTER TABLE `core_leavetype`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `core_localesettings`
--
ALTER TABLE `core_localesettings`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `core_notificationsettings`
--
ALTER TABLE `core_notificationsettings`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `core_notificationtemplate`
--
ALTER TABLE `core_notificationtemplate`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `template_id` (`template_id`);

--
-- Indexes for table `core_parent`
--
ALTER TABLE `core_parent`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`),
  ADD KEY `core_parent_school_id_5ef5c1b6_fk_core_school_id` (`school_id`);

--
-- Indexes for table `core_promotionrules`
--
ALTER TABLE `core_promotionrules`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `core_resource`
--
ALTER TABLE `core_resource`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `core_room`
--
ALTER TABLE `core_room`
  ADD PRIMARY KEY (`id`),
  ADD KEY `core_room_building_id_d2417ecb_fk_core_building_id` (`building_id`);

--
-- Indexes for table `core_school`
--
ALTER TABLE `core_school`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `school_id` (`school_id`);

--
-- Indexes for table `core_section`
--
ALTER TABLE `core_section`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `core_section_name_class_id_id_307c1f36_uniq` (`name`,`class_id_id`),
  ADD KEY `core_section_class_id_id_08b0f88c_fk_core_class_id` (`class_id_id`);

--
-- Indexes for table `core_staff`
--
ALTER TABLE `core_staff`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`),
  ADD UNIQUE KEY `employee_id` (`employee_id`),
  ADD KEY `core_staff_department_id_5b8b6b52_fk_core_department_id` (`department_id`),
  ADD KEY `core_staff_staff_role_id_637c5c3b_fk_core_staffrole_id` (`staff_role_id`),
  ADD KEY `core_staff_school_id_c135171a_fk_core_school_school_id` (`school_id`);

--
-- Indexes for table `core_staffleave`
--
ALTER TABLE `core_staffleave`
  ADD PRIMARY KEY (`id`),
  ADD KEY `core_staffleave_academic_session_id_2d6043fb_fk_core_acad` (`academic_session_id`),
  ADD KEY `core_staffleave_leave_type_id_6215ee00_fk_core_leavetype_id` (`leave_type_id`),
  ADD KEY `core_staffleave_school_id_bbba7dd6_fk_core_school_school_id` (`school_id`),
  ADD KEY `core_staffleave_staff_id_b16d4a7d_fk_core_staff_id` (`staff_id`);

--
-- Indexes for table `core_staffrole`
--
ALTER TABLE `core_staffrole`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `core_staff_classes`
--
ALTER TABLE `core_staff_classes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `core_staff_classes_staff_id_class_id_bd0024de_uniq` (`staff_id`,`class_id`),
  ADD KEY `core_staff_classes_class_id_dd1fca2a_fk_core_class_id` (`class_id`);

--
-- Indexes for table `core_staff_subjects`
--
ALTER TABLE `core_staff_subjects`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `core_staff_subjects_staff_id_subject_id_b3935491_uniq` (`staff_id`,`subject_id`),
  ADD KEY `core_staff_subjects_subject_id_5a880562_fk_core_subject_id` (`subject_id`);

--
-- Indexes for table `core_student`
--
ALTER TABLE `core_student`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`),
  ADD UNIQUE KEY `admission_number` (`admission_number`),
  ADD KEY `core_student_academic_session_id_8ee7e390_fk_core_acad` (`academic_session_id`),
  ADD KEY `core_student_class_id_id_401279ca_fk_core_class_id` (`class_id_id`),
  ADD KEY `core_student_school_id_9d30b4f7_fk_core_school_id` (`school_id`),
  ADD KEY `core_student_section_id_1c25b635_fk_core_section_id` (`section_id`);

--
-- Indexes for table `core_studentdocument`
--
ALTER TABLE `core_studentdocument`
  ADD PRIMARY KEY (`id`),
  ADD KEY `core_studentdocument_session_id_229c428d_fk_core_acad` (`session_id`),
  ADD KEY `core_studentdocument_student_id_d13605bf_fk_core_student_id` (`student_id`),
  ADD KEY `core_studentdocument_document_type_id_19395508_fk_core_stud` (`document_type_id`);

--
-- Indexes for table `core_studentdocumenttype`
--
ALTER TABLE `core_studentdocumenttype`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `core_studentfee`
--
ALTER TABLE `core_studentfee`
  ADD PRIMARY KEY (`id`),
  ADD KEY `core_studentfee_admission_fee_id_8215017e_fk_core_admi` (`admission_fee_id`),
  ADD KEY `core_studentfee_student_id_b78d1d11_fk_core_student_id` (`student_id`);

--
-- Indexes for table `core_studentparent`
--
ALTER TABLE `core_studentparent`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `core_studentparent_student_id_parent_id_46f819e5_uniq` (`student_id`,`parent_id`),
  ADD KEY `core_studentparent_parent_id_c56a4718_fk_core_parent_id` (`parent_id`);

--
-- Indexes for table `core_subject`
--
ALTER TABLE `core_subject`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`);

--
-- Indexes for table `core_subject_classes`
--
ALTER TABLE `core_subject_classes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `core_subject_classes_subject_id_class_id_758f4218_uniq` (`subject_id`,`class_id`),
  ADD KEY `core_subject_classes_class_id_9f7a2e06_fk_core_class_id` (`class_id`);

--
-- Indexes for table `core_term`
--
ALTER TABLE `core_term`
  ADD PRIMARY KEY (`id`),
  ADD KEY `core_term_session_id_26b3f1fa_fk_core_academicsession_id` (`session_id`);

--
-- Indexes for table `core_user`
--
ALTER TABLE `core_user`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `core_user_school_id_b425ccf9_fk_core_school_school_id` (`school_id`);

--
-- Indexes for table `core_user_groups`
--
ALTER TABLE `core_user_groups`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `core_user_groups_user_id_group_id_c82fcad1_uniq` (`user_id`,`group_id`),
  ADD KEY `core_user_groups_group_id_fe8c697f_fk_auth_group_id` (`group_id`);

--
-- Indexes for table `core_user_user_permissions`
--
ALTER TABLE `core_user_user_permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `core_user_user_permissions_user_id_permission_id_73ea0daa_uniq` (`user_id`,`permission_id`),
  ADD KEY `core_user_user_permi_permission_id_35ccf601_fk_auth_perm` (`permission_id`);

--
-- Indexes for table `django_admin_log`
--
ALTER TABLE `django_admin_log`
  ADD PRIMARY KEY (`id`),
  ADD KEY `django_admin_log_content_type_id_c4bce8eb_fk_django_co` (`content_type_id`),
  ADD KEY `django_admin_log_user_id_c564eba6_fk_core_user_id` (`user_id`);

--
-- Indexes for table `django_content_type`
--
ALTER TABLE `django_content_type`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `django_content_type_app_label_model_76bd3d3b_uniq` (`app_label`,`model`);

--
-- Indexes for table `django_migrations`
--
ALTER TABLE `django_migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `django_session`
--
ALTER TABLE `django_session`
  ADD PRIMARY KEY (`session_key`),
  ADD KEY `django_session_expire_date_a5c62663` (`expire_date`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `auth_group`
--
ALTER TABLE `auth_group`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `auth_group_permissions`
--
ALTER TABLE `auth_group_permissions`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `auth_permission`
--
ALTER TABLE `auth_permission`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=165;

--
-- AUTO_INCREMENT for table `certificates`
--
ALTER TABLE `certificates`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `core_academicsession`
--
ALTER TABLE `core_academicsession`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `core_admissionfee`
--
ALTER TABLE `core_admissionfee`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `core_attendancesettings`
--
ALTER TABLE `core_attendancesettings`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `core_building`
--
ALTER TABLE `core_building`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `core_bulkleaveassignment`
--
ALTER TABLE `core_bulkleaveassignment`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `core_campus`
--
ALTER TABLE `core_campus`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `core_class`
--
ALTER TABLE `core_class`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `core_classcapacity`
--
ALTER TABLE `core_classcapacity`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `core_department`
--
ALTER TABLE `core_department`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `core_feesettings`
--
ALTER TABLE `core_feesettings`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `core_feetype`
--
ALTER TABLE `core_feetype`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `core_gradingscale`
--
ALTER TABLE `core_gradingscale`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `core_gradingsettings`
--
ALTER TABLE `core_gradingsettings`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `core_holiday`
--
ALTER TABLE `core_holiday`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `core_leavetype`
--
ALTER TABLE `core_leavetype`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `core_localesettings`
--
ALTER TABLE `core_localesettings`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `core_notificationsettings`
--
ALTER TABLE `core_notificationsettings`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `core_notificationtemplate`
--
ALTER TABLE `core_notificationtemplate`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `core_parent`
--
ALTER TABLE `core_parent`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `core_promotionrules`
--
ALTER TABLE `core_promotionrules`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `core_resource`
--
ALTER TABLE `core_resource`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `core_room`
--
ALTER TABLE `core_room`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `core_school`
--
ALTER TABLE `core_school`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `core_section`
--
ALTER TABLE `core_section`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `core_staff`
--
ALTER TABLE `core_staff`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `core_staffleave`
--
ALTER TABLE `core_staffleave`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `core_staffrole`
--
ALTER TABLE `core_staffrole`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `core_staff_classes`
--
ALTER TABLE `core_staff_classes`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `core_staff_subjects`
--
ALTER TABLE `core_staff_subjects`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `core_student`
--
ALTER TABLE `core_student`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `core_studentdocument`
--
ALTER TABLE `core_studentdocument`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `core_studentdocumenttype`
--
ALTER TABLE `core_studentdocumenttype`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `core_studentfee`
--
ALTER TABLE `core_studentfee`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `core_studentparent`
--
ALTER TABLE `core_studentparent`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `core_subject`
--
ALTER TABLE `core_subject`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `core_subject_classes`
--
ALTER TABLE `core_subject_classes`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `core_term`
--
ALTER TABLE `core_term`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `core_user`
--
ALTER TABLE `core_user`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `core_user_groups`
--
ALTER TABLE `core_user_groups`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `core_user_user_permissions`
--
ALTER TABLE `core_user_user_permissions`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `django_admin_log`
--
ALTER TABLE `django_admin_log`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `django_content_type`
--
ALTER TABLE `django_content_type`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=42;

--
-- AUTO_INCREMENT for table `django_migrations`
--
ALTER TABLE `django_migrations`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `auth_group_permissions`
--
ALTER TABLE `auth_group_permissions`
  ADD CONSTRAINT `auth_group_permissio_permission_id_84c5c92e_fk_auth_perm` FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`),
  ADD CONSTRAINT `auth_group_permissions_group_id_b120cbf9_fk_auth_group_id` FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`);

--
-- Constraints for table `auth_permission`
--
ALTER TABLE `auth_permission`
  ADD CONSTRAINT `auth_permission_content_type_id_2f476e4b_fk_django_co` FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`);

--
-- Constraints for table `certificates`
--
ALTER TABLE `certificates`
  ADD CONSTRAINT `certificates_academic_session_id__b20be5e3_fk_core_acad` FOREIGN KEY (`academic_session_id_id`) REFERENCES `core_academicsession` (`id`),
  ADD CONSTRAINT `certificates_class_id_id_92f1e079_fk_core_class_id` FOREIGN KEY (`class_id_id`) REFERENCES `core_class` (`id`),
  ADD CONSTRAINT `certificates_section_id_id_0dd0c9c6_fk_core_section_id` FOREIGN KEY (`section_id_id`) REFERENCES `core_section` (`id`),
  ADD CONSTRAINT `certificates_student_id_id_19dc21d7_fk_core_student_id` FOREIGN KEY (`student_id_id`) REFERENCES `core_student` (`id`);

--
-- Constraints for table `core_admissionfee`
--
ALTER TABLE `core_admissionfee`
  ADD CONSTRAINT `core_admissionfee_class_id_id_de193edc_fk_core_class_id` FOREIGN KEY (`class_id_id`) REFERENCES `core_class` (`id`),
  ADD CONSTRAINT `core_admissionfee_school_id_da8e7d41_fk_core_school_id` FOREIGN KEY (`school_id`) REFERENCES `core_school` (`id`),
  ADD CONSTRAINT `core_admissionfee_section_id_f5f1fe6d_fk_core_section_id` FOREIGN KEY (`section_id`) REFERENCES `core_section` (`id`);

--
-- Constraints for table `core_attendancesettings`
--
ALTER TABLE `core_attendancesettings`
  ADD CONSTRAINT `core_attendancesettings_school_id_5892c727_fk_core_school_id` FOREIGN KEY (`school_id`) REFERENCES `core_school` (`id`);

--
-- Constraints for table `core_building`
--
ALTER TABLE `core_building`
  ADD CONSTRAINT `core_building_campus_id_a4c91ee2_fk_core_campus_id` FOREIGN KEY (`campus_id`) REFERENCES `core_campus` (`id`);

--
-- Constraints for table `core_bulkleaveassignment`
--
ALTER TABLE `core_bulkleaveassignment`
  ADD CONSTRAINT `core_bulkleaveassign_leave_type_id_369ea8b5_fk_core_leav` FOREIGN KEY (`leave_type_id`) REFERENCES `core_leavetype` (`id`);

--
-- Constraints for table `core_feesettings`
--
ALTER TABLE `core_feesettings`
  ADD CONSTRAINT `core_feesettings_school_id_9e884dba_fk_core_school_id` FOREIGN KEY (`school_id`) REFERENCES `core_school` (`id`);

--
-- Constraints for table `core_feetype`
--
ALTER TABLE `core_feetype`
  ADD CONSTRAINT `core_feetype_school_id_30ceafdd_fk_core_school_id` FOREIGN KEY (`school_id`) REFERENCES `core_school` (`id`);

--
-- Constraints for table `core_gradingsettings`
--
ALTER TABLE `core_gradingsettings`
  ADD CONSTRAINT `core_gradingsettings_school_id_5317d88e_fk_core_school_id` FOREIGN KEY (`school_id`) REFERENCES `core_school` (`id`);

--
-- Constraints for table `core_holiday`
--
ALTER TABLE `core_holiday`
  ADD CONSTRAINT `core_holiday_session_id_1ac6fbae_fk_core_academicsession_id` FOREIGN KEY (`session_id`) REFERENCES `core_academicsession` (`id`);

--
-- Constraints for table `core_parent`
--
ALTER TABLE `core_parent`
  ADD CONSTRAINT `core_parent_school_id_5ef5c1b6_fk_core_school_id` FOREIGN KEY (`school_id`) REFERENCES `core_school` (`id`),
  ADD CONSTRAINT `core_parent_user_id_f7fb215b_fk_core_user_id` FOREIGN KEY (`user_id`) REFERENCES `core_user` (`id`);

--
-- Constraints for table `core_room`
--
ALTER TABLE `core_room`
  ADD CONSTRAINT `core_room_building_id_d2417ecb_fk_core_building_id` FOREIGN KEY (`building_id`) REFERENCES `core_building` (`id`);

--
-- Constraints for table `core_section`
--
ALTER TABLE `core_section`
  ADD CONSTRAINT `core_section_class_id_id_08b0f88c_fk_core_class_id` FOREIGN KEY (`class_id_id`) REFERENCES `core_class` (`id`);

--
-- Constraints for table `core_staff`
--
ALTER TABLE `core_staff`
  ADD CONSTRAINT `core_staff_department_id_5b8b6b52_fk_core_department_id` FOREIGN KEY (`department_id`) REFERENCES `core_department` (`id`),
  ADD CONSTRAINT `core_staff_school_id_c135171a_fk_core_school_school_id` FOREIGN KEY (`school_id`) REFERENCES `core_school` (`school_id`),
  ADD CONSTRAINT `core_staff_staff_role_id_637c5c3b_fk_core_staffrole_id` FOREIGN KEY (`staff_role_id`) REFERENCES `core_staffrole` (`id`),
  ADD CONSTRAINT `core_staff_user_id_3295e7b7_fk_core_user_id` FOREIGN KEY (`user_id`) REFERENCES `core_user` (`id`);

--
-- Constraints for table `core_staffleave`
--
ALTER TABLE `core_staffleave`
  ADD CONSTRAINT `core_staffleave_academic_session_id_2d6043fb_fk_core_acad` FOREIGN KEY (`academic_session_id`) REFERENCES `core_academicsession` (`id`),
  ADD CONSTRAINT `core_staffleave_leave_type_id_6215ee00_fk_core_leavetype_id` FOREIGN KEY (`leave_type_id`) REFERENCES `core_leavetype` (`id`),
  ADD CONSTRAINT `core_staffleave_school_id_bbba7dd6_fk_core_school_school_id` FOREIGN KEY (`school_id`) REFERENCES `core_school` (`school_id`),
  ADD CONSTRAINT `core_staffleave_staff_id_b16d4a7d_fk_core_staff_id` FOREIGN KEY (`staff_id`) REFERENCES `core_staff` (`id`);

--
-- Constraints for table `core_staff_classes`
--
ALTER TABLE `core_staff_classes`
  ADD CONSTRAINT `core_staff_classes_class_id_dd1fca2a_fk_core_class_id` FOREIGN KEY (`class_id`) REFERENCES `core_class` (`id`),
  ADD CONSTRAINT `core_staff_classes_staff_id_a1009f10_fk_core_staff_id` FOREIGN KEY (`staff_id`) REFERENCES `core_staff` (`id`);

--
-- Constraints for table `core_staff_subjects`
--
ALTER TABLE `core_staff_subjects`
  ADD CONSTRAINT `core_staff_subjects_staff_id_ebd7d61a_fk_core_staff_id` FOREIGN KEY (`staff_id`) REFERENCES `core_staff` (`id`),
  ADD CONSTRAINT `core_staff_subjects_subject_id_5a880562_fk_core_subject_id` FOREIGN KEY (`subject_id`) REFERENCES `core_subject` (`id`);

--
-- Constraints for table `core_student`
--
ALTER TABLE `core_student`
  ADD CONSTRAINT `core_student_academic_session_id_8ee7e390_fk_core_acad` FOREIGN KEY (`academic_session_id`) REFERENCES `core_academicsession` (`id`),
  ADD CONSTRAINT `core_student_class_id_id_401279ca_fk_core_class_id` FOREIGN KEY (`class_id_id`) REFERENCES `core_class` (`id`),
  ADD CONSTRAINT `core_student_school_id_9d30b4f7_fk_core_school_id` FOREIGN KEY (`school_id`) REFERENCES `core_school` (`id`),
  ADD CONSTRAINT `core_student_section_id_1c25b635_fk_core_section_id` FOREIGN KEY (`section_id`) REFERENCES `core_section` (`id`),
  ADD CONSTRAINT `core_student_user_id_666ccffd_fk_core_user_id` FOREIGN KEY (`user_id`) REFERENCES `core_user` (`id`);

--
-- Constraints for table `core_studentdocument`
--
ALTER TABLE `core_studentdocument`
  ADD CONSTRAINT `core_studentdocument_document_type_id_19395508_fk_core_stud` FOREIGN KEY (`document_type_id`) REFERENCES `core_studentdocumenttype` (`id`),
  ADD CONSTRAINT `core_studentdocument_session_id_229c428d_fk_core_acad` FOREIGN KEY (`session_id`) REFERENCES `core_academicsession` (`id`),
  ADD CONSTRAINT `core_studentdocument_student_id_d13605bf_fk_core_student_id` FOREIGN KEY (`student_id`) REFERENCES `core_student` (`id`);

--
-- Constraints for table `core_studentfee`
--
ALTER TABLE `core_studentfee`
  ADD CONSTRAINT `core_studentfee_admission_fee_id_8215017e_fk_core_admi` FOREIGN KEY (`admission_fee_id`) REFERENCES `core_admissionfee` (`id`),
  ADD CONSTRAINT `core_studentfee_student_id_b78d1d11_fk_core_student_id` FOREIGN KEY (`student_id`) REFERENCES `core_student` (`id`);

--
-- Constraints for table `core_studentparent`
--
ALTER TABLE `core_studentparent`
  ADD CONSTRAINT `core_studentparent_parent_id_c56a4718_fk_core_parent_id` FOREIGN KEY (`parent_id`) REFERENCES `core_parent` (`id`),
  ADD CONSTRAINT `core_studentparent_student_id_912b5159_fk_core_student_id` FOREIGN KEY (`student_id`) REFERENCES `core_student` (`id`);

--
-- Constraints for table `core_subject_classes`
--
ALTER TABLE `core_subject_classes`
  ADD CONSTRAINT `core_subject_classes_class_id_9f7a2e06_fk_core_class_id` FOREIGN KEY (`class_id`) REFERENCES `core_class` (`id`),
  ADD CONSTRAINT `core_subject_classes_subject_id_5def4ff5_fk_core_subject_id` FOREIGN KEY (`subject_id`) REFERENCES `core_subject` (`id`);

--
-- Constraints for table `core_term`
--
ALTER TABLE `core_term`
  ADD CONSTRAINT `core_term_session_id_26b3f1fa_fk_core_academicsession_id` FOREIGN KEY (`session_id`) REFERENCES `core_academicsession` (`id`);

--
-- Constraints for table `core_user`
--
ALTER TABLE `core_user`
  ADD CONSTRAINT `core_user_school_id_b425ccf9_fk_core_school_school_id` FOREIGN KEY (`school_id`) REFERENCES `core_school` (`school_id`);

--
-- Constraints for table `core_user_groups`
--
ALTER TABLE `core_user_groups`
  ADD CONSTRAINT `core_user_groups_group_id_fe8c697f_fk_auth_group_id` FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`),
  ADD CONSTRAINT `core_user_groups_user_id_70b4d9b8_fk_core_user_id` FOREIGN KEY (`user_id`) REFERENCES `core_user` (`id`);

--
-- Constraints for table `core_user_user_permissions`
--
ALTER TABLE `core_user_user_permissions`
  ADD CONSTRAINT `core_user_user_permi_permission_id_35ccf601_fk_auth_perm` FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`),
  ADD CONSTRAINT `core_user_user_permissions_user_id_085123d3_fk_core_user_id` FOREIGN KEY (`user_id`) REFERENCES `core_user` (`id`);

--
-- Constraints for table `django_admin_log`
--
ALTER TABLE `django_admin_log`
  ADD CONSTRAINT `django_admin_log_content_type_id_c4bce8eb_fk_django_co` FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`),
  ADD CONSTRAINT `django_admin_log_user_id_c564eba6_fk_core_user_id` FOREIGN KEY (`user_id`) REFERENCES `core_user` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
