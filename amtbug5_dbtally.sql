-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Sep 10, 2025 at 03:21 AM
-- Server version: 10.6.23-MariaDB-log
-- PHP Version: 8.3.23

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `amtbug5_dbtally`
--

-- --------------------------------------------------------

--
-- Table structure for table `assessees`
--

CREATE TABLE `assessees` (
  `id` int(11) NOT NULL,
  `employee_id` varchar(50) NOT NULL,
  `company_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `father_name` varchar(100) DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `pan` varchar(10) NOT NULL,
  `aadhar` varchar(12) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(15) DEFAULT NULL,
  `address_line1` varchar(255) DEFAULT NULL,
  `address_line2` varchar(255) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `pincode` varchar(10) DEFAULT NULL,
  `profession` varchar(100) DEFAULT NULL,
  `category` enum('individual','huf','firm','company') DEFAULT 'individual',
  `assessment_year` varchar(10) DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_date` date DEFAULT curdate()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `assessees`
--

INSERT INTO `assessees` (`id`, `employee_id`, `company_id`, `name`, `father_name`, `date_of_birth`, `pan`, `aadhar`, `email`, `phone`, `address_line1`, `address_line2`, `city`, `state`, `pincode`, `profession`, `category`, `assessment_year`, `status`, `created_date`) VALUES
(1, 'EMP123456', 0, 'Rajesh Kumar Sharma', 'Ram Kumar Sharma', '1985-06-15', 'ABCDE1234F', '123456789012', 'rajesh@example.com', '9876543210', '123 Main Street', 'Near City Center', 'Mumbai', 'Maharashtra', '400001', 'Software Engineer', 'individual', '2024-25', 'active', '2025-07-30'),
(2, '7', 0, 'shadmani', 'shaadmani', '2025-07-31', 'EDCPR5475S', '123456789098', 'SAIMAsha@gmail.com', '1234567890', 'jamshedpur shabina ', 'sakshi', 'jamshedpur', 'jharkhand', '800014', 'developerssssss', 'huf', '2023-24', 'active', '2025-07-30'),
(3, '9', 0, 'Saima Shadmani', 'gdfgfd', '1999-05-10', 'ABCDE1234F', '123456789015', 'saimashadmani1999@gmail.com', '09693284411', 'Jawaharnagar, ', '', 'PURBA SINGHBHUM', 'Jharkhand', '832110', '', 'individual', '2024-25', 'active', '2025-08-11'),
(4, '9', 0, 'Saima_shaad', 'gfjg', '1999-05-10', 'ABCDE1234R', '123456789010', 'email@example.com', '09693284422', 'Jawahar', '', 'PURBA SINGHBHUM', 'Jharkhand', '832110', 'fgfbnn', 'individual', '2024-25', 'active', '2025-08-11'),
(5, '10', 0, 'Saima Shadmani', 'jhkj', '2025-08-14', 'ABCDE1234F', '123456789012', 'saimashadmani1999@gmail.com', '09693284411', 'Jawaharnagar, ', 'Road no. 12 ,flat no. B10 Shabina apartment', 'PURBA SINGHBHUM', 'Jharkhand', '832110', '', 'individual', '2024-25', 'active', '2025-08-14'),
(6, '11', 0, 'vikky kumar', 'vinod roy', '2003-09-19', 'ABCDE1234F', '123456789012', 'example@gmail.com', '6201789796', 'ranchi', 'ranchi', 'ranchi', 'jharkhand', '834001', 'student', 'individual', '2024-25', 'active', '2025-08-14'),
(7, '12', 0, 'Vikki vats', 'vinod roy', '2025-08-18', 'ABCDE1234F', '123456789012', 'example@gmail.com', '07545066346', 'Rasidpur', 'begusrai', 'MANSUR CHAK', 'BIHAR', '851128', 'student', 'company', '2024-25', 'active', '2025-08-17');

-- --------------------------------------------------------

--
-- Table structure for table `budgets`
--

CREATE TABLE `budgets` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `description` text DEFAULT NULL,
  `status` enum('draft','active') DEFAULT 'draft',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `company_id` int(11) NOT NULL,
  `owner_type` enum('employee','user') NOT NULL,
  `owner_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `budgets`
--

INSERT INTO `budgets` (`id`, `name`, `start_date`, `end_date`, `description`, `status`, `created_at`, `updated_at`, `company_id`, `owner_type`, `owner_id`) VALUES
(1, 'Marketing', '2025-06-18', '2025-06-27', 'hii', 'active', '2025-06-24 20:23:04', '2025-06-24 20:23:04', 0, 'employee', 0),
(2, 'Marketing', '2025-06-18', '2025-06-27', 'hii', 'active', '2025-06-24 20:23:06', '2025-06-24 20:23:06', 0, 'employee', 0),
(3, 'Marketing', '2025-06-18', '2025-06-27', 'hii', 'active', '2025-06-24 20:23:21', '2025-06-24 20:23:21', 0, 'employee', 0),
(4, 'Marketing', '2025-06-25', '2025-06-28', 'hii', 'draft', '2025-06-24 20:30:48', '2025-06-24 20:30:48', 0, 'employee', 0),
(5, 'Marketing', '2025-06-25', '2025-06-28', 'hii', 'draft', '2025-06-24 20:30:49', '2025-06-24 20:30:49', 0, 'employee', 0),
(6, 'Annual Budget', '2025-06-17', '2025-06-25', 'hii', 'draft', '2025-06-24 20:38:06', '2025-06-24 20:38:06', 0, 'employee', 0),
(7, 'Annual Budget', '2025-06-05', '2025-06-28', '', 'active', '2025-06-25 05:01:43', '2025-06-25 05:01:43', 0, 'employee', 0),
(8, 'Annual Budget', '2025-06-04', '2025-07-01', 'dgs', 'active', '2025-06-25 05:05:04', '2025-06-25 05:05:04', 0, 'employee', 0),
(9, 'Annual Budget', '2025-06-04', '2025-07-01', 'dgs', 'active', '2025-06-25 05:05:18', '2025-06-25 05:05:18', 0, 'employee', 0),
(10, 'Annual Budget', '2025-06-06', '2025-06-25', 'dsf', 'draft', '2025-06-25 05:09:41', '2025-06-25 05:09:41', 0, 'employee', 0),
(11, 'Annual Budget', '2025-06-23', '2025-06-07', 'vf', 'active', '2025-06-25 05:11:18', '2025-06-25 05:11:18', 0, 'employee', 0),
(12, 'Annual Budget', '2025-06-23', '2025-06-07', 'vf', 'active', '2025-06-25 05:11:34', '2025-06-25 05:11:34', 0, 'employee', 0),
(13, 'Annual Budget', '2025-06-05', '2025-06-25', 'df', 'active', '2025-06-25 05:16:59', '2025-06-25 05:16:59', 0, 'employee', 0),
(14, 'Annual Budget', '2025-06-05', '2025-06-25', 'df', 'active', '2025-06-25 05:17:07', '2025-06-25 05:17:07', 0, 'employee', 0),
(15, 'Annual Budget', '2025-06-12', '2025-06-17', 'sa', 'active', '2025-06-25 05:24:19', '2025-06-25 05:24:19', 0, 'employee', 0),
(16, 'sss786786', '2025-07-03', '2025-07-10', 'hello', 'draft', '2025-07-03 16:39:27', '2025-07-03 16:39:27', 0, 'employee', 0),
(17, 'Sample Budget', '2024-04-01', '2025-03-31', 'Annual budget for FY 2024-25', 'draft', '2025-08-15 11:43:57', '2025-08-15 11:43:57', 0, 'employee', 0),
(18, 'Annual Budget', '2025-08-25', '2025-08-31', 'dfgd', 'active', '2025-08-25 14:34:39', '2025-08-25 14:34:39', 38, 'employee', 10);

-- --------------------------------------------------------

--
-- Table structure for table `business_incomes`
--

CREATE TABLE `business_incomes` (
  `id` int(11) NOT NULL,
  `employee_id` varchar(50) NOT NULL,
  `business_name` varchar(255) NOT NULL,
  `business_type` enum('profession','business','commission','other') NOT NULL,
  `registration_number` varchar(100) DEFAULT NULL,
  `financial_year` varchar(10) NOT NULL,
  `gross_receipts` decimal(15,2) DEFAULT 0.00,
  `gross_turnover` decimal(15,2) DEFAULT 0.00,
  `other_income` decimal(15,2) DEFAULT 0.00,
  `total_income` decimal(15,2) DEFAULT 0.00,
  `purchase_of_trading_goods` decimal(15,2) DEFAULT 0.00,
  `direct_expenses` decimal(15,2) DEFAULT 0.00,
  `employee_benefits` decimal(15,2) DEFAULT 0.00,
  `financial_charges` decimal(15,2) DEFAULT 0.00,
  `depreciation` decimal(15,2) DEFAULT 0.00,
  `other_expenses` decimal(15,2) DEFAULT 0.00,
  `total_expenses` decimal(15,2) DEFAULT 0.00,
  `net_profit_loss` decimal(15,2) DEFAULT 0.00,
  `section44AD` tinyint(1) DEFAULT 0,
  `section44ADA` tinyint(1) DEFAULT 0,
  `section44AB` tinyint(1) DEFAULT 0,
  `presumptive_income` decimal(15,2) DEFAULT 0.00,
  `audit_required` tinyint(1) DEFAULT 0,
  `books_profit_loss` decimal(15,2) DEFAULT 0.00,
  `additions` decimal(15,2) DEFAULT 0.00,
  `deductions` decimal(15,2) DEFAULT 0.00,
  `computed_income` decimal(15,2) DEFAULT 0.00,
  `status` enum('draft','finalized') DEFAULT 'draft',
  `created_date` date DEFAULT curdate()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `business_incomes`
--

INSERT INTO `business_incomes` (`id`, `employee_id`, `business_name`, `business_type`, `registration_number`, `financial_year`, `gross_receipts`, `gross_turnover`, `other_income`, `total_income`, `purchase_of_trading_goods`, `direct_expenses`, `employee_benefits`, `financial_charges`, `depreciation`, `other_expenses`, `total_expenses`, `net_profit_loss`, `section44AD`, `section44ADA`, `section44AB`, `presumptive_income`, `audit_required`, `books_profit_loss`, `additions`, `deductions`, `computed_income`, `status`, `created_date`) VALUES
(2, '7', 'saaaa', 'commission', NULL, '2022-23', 3330.00, 5550.00, 7770.00, 16650.00, 999774544420.00, 8880.00, 9990.00, 9999990.00, 88880.00, 0.00, 999784652160.00, -999784635510.00, 1, 0, 0, 444.00, 0, -999784635510.00, 8880.00, 8880.00, -999784635510.00, 'draft', '2025-07-30'),
(3, '7', 'ajaz bhai', 'commission', NULL, '2022-23', 9999999999999.99, 55555555550.00, 6666666660.00, 9999999999999.99, 33333330.00, 55550.00, 77770.00, 777770.00, 99990.00, 9999990.00, 44344400.00, 9999999999999.99, 1, 1, 0, 4444444444.00, 0, 9999999999999.99, 777770.00, 999990.00, 9999999999999.99, 'draft', '2025-07-30'),
(4, '7', 'ajaz bhai', 'commission', NULL, '2022-23', 9999999999999.99, 55555555550.00, 6666666660.00, 9999999999999.99, 33333330.00, 55550.00, 77770.00, 777770.00, 99990.00, 9999990.00, 44344400.00, 9999999999999.99, 1, 1, 0, 4444444444.00, 0, 9999999999999.99, 77777111.00, 999990.00, 9999999999999.99, 'draft', '2025-07-30');

-- --------------------------------------------------------

--
-- Table structure for table `capital_gains`
--

CREATE TABLE `capital_gains` (
  `id` int(11) NOT NULL,
  `asset_type` varchar(50) DEFAULT NULL,
  `gain_type` varchar(10) DEFAULT NULL,
  `purchase_date` date DEFAULT NULL,
  `sale_date` date DEFAULT NULL,
  `purchase_value` decimal(15,2) DEFAULT NULL,
  `sale_value` decimal(15,2) DEFAULT NULL,
  `indexation_benefit` decimal(15,2) DEFAULT 0.00,
  `exemption_claimed` decimal(15,2) DEFAULT 0.00,
  `description` text DEFAULT NULL,
  `gain_amount` decimal(15,2) DEFAULT NULL,
  `taxable_gain` decimal(15,2) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `employee_id` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `cost_centers`
--

CREATE TABLE `cost_centers` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `category` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL,
  `company_id` int(11) NOT NULL,
  `owner_type` enum('employee','user') NOT NULL,
  `owner_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `cost_centers`
--

INSERT INTO `cost_centers` (`id`, `name`, `category`, `description`, `created_at`, `updated_at`, `company_id`, `owner_type`, `owner_id`) VALUES
(1, 'Annual Budget', 'costing', 'jhkj', '2025-07-03 16:54:40', NULL, 0, 'employee', 0),
(2, 'Annual Budget', 'costing', 'dskjsaj', '2025-07-03 16:58:24', NULL, 0, 'employee', 0),
(3, 'Annual Budget', 'costing', 'hello', '2025-08-25 18:44:58', NULL, 38, 'employee', 10);

-- --------------------------------------------------------

--
-- Table structure for table `credit_vouchers`
--

CREATE TABLE `credit_vouchers` (
  `id` int(11) NOT NULL,
  `date` date DEFAULT NULL,
  `number` varchar(50) DEFAULT NULL,
  `mode` enum('item-invoice','accounting-invoice','as-voucher') DEFAULT NULL,
  `partyId` int(11) DEFAULT NULL,
  `narration` text DEFAULT NULL,
  `employee_id` int(11) DEFAULT NULL,
  `company_id` int(11) NOT NULL,
  `owner_type` enum('employee','user') NOT NULL,
  `owner_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `credit_vouchers`
--

INSERT INTO `credit_vouchers` (`id`, `date`, `number`, `mode`, `partyId`, `narration`, `employee_id`, `company_id`, `owner_type`, `owner_id`) VALUES
(1, '2025-07-19', 'CN-1001', 'item-invoice', 2, 'Test Credit Note', NULL, 0, 'employee', 0),
(2, '2025-07-19', 'CN-1001', 'item-invoice', 2, 'Credit note for returned items', NULL, 0, 'employee', 0),
(3, '2025-07-19', 'CN-1001', 'item-invoice', 2, 'Credit note for returned items', NULL, 0, 'employee', 0),
(4, '2025-07-19', 'CN-1001', 'item-invoice', 2, 'Credit note for returned items', NULL, 0, 'employee', 0),
(5, '2025-07-19', 'CN-1004', 'item-invoice', 2, 'Credit note for returned items', NULL, 0, 'employee', 0),
(6, '2025-07-19', 'CN-1004', 'item-invoice', 2, 'Credit note for returned items', NULL, 0, 'employee', 0),
(7, '2025-07-19', 'CN-1004', 'item-invoice', 2, 'Credit note for returned items', NULL, 0, 'employee', 0),
(8, '2025-07-19', 'CN-1007', 'item-invoice', 2, 'Credit note for returned items', NULL, 0, 'employee', 0),
(9, '2025-07-19', 'SO0001', 'item-invoice', 13, '', NULL, 0, 'employee', 0),
(10, '2025-07-19', 'RV249201', 'accounting-invoice', 15, '', NULL, 0, 'employee', 0),
(11, '2025-07-19', '', 'as-voucher', 0, '', NULL, 0, 'employee', 0),
(12, '2025-07-20', '12345', 'item-invoice', 13, '', NULL, 0, 'employee', 0),
(13, '2025-07-20', '123456789', 'item-invoice', 13, '', 7, 0, 'employee', 0),
(14, '2025-08-29', 'XYZ0001', 'item-invoice', 40, '', NULL, 38, 'employee', 10);

-- --------------------------------------------------------

--
-- Table structure for table `credit_voucher_accounts`
--

CREATE TABLE `credit_voucher_accounts` (
  `id` int(11) NOT NULL,
  `voucher_id` int(11) DEFAULT NULL,
  `narration` varchar(255) DEFAULT NULL,
  `rate` decimal(10,2) DEFAULT NULL,
  `amount` decimal(10,2) DEFAULT NULL,
  `ledgerId` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `credit_voucher_accounts`
--

INSERT INTO `credit_voucher_accounts` (`id`, `voucher_id`, `narration`, `rate`, `amount`, `ledgerId`) VALUES
(1, 10, '12333', 1322.00, 2220.00, 22),
(2, 10, '1244', 1322.00, 220.00, 25);

-- --------------------------------------------------------

--
-- Table structure for table `credit_voucher_double_entry`
--

CREATE TABLE `credit_voucher_double_entry` (
  `id` int(11) NOT NULL,
  `voucher_id` int(11) DEFAULT NULL,
  `ledgerId` int(11) DEFAULT NULL,
  `type` enum('debit','credit') DEFAULT NULL,
  `amount` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `credit_voucher_double_entry`
--

INSERT INTO `credit_voucher_double_entry` (`id`, `voucher_id`, `ledgerId`, `type`, `amount`) VALUES
(1, 11, 24, 'debit', 1230.00),
(2, 11, 26, 'credit', 1230.00);

-- --------------------------------------------------------

--
-- Table structure for table `credit_voucher_items`
--

CREATE TABLE `credit_voucher_items` (
  `id` int(11) NOT NULL,
  `voucher_id` int(11) DEFAULT NULL,
  `itemId` int(11) DEFAULT NULL,
  `hsnCode` varchar(50) DEFAULT NULL,
  `quantity` decimal(10,2) DEFAULT NULL,
  `rate` decimal(10,2) DEFAULT NULL,
  `discount` decimal(10,2) DEFAULT NULL,
  `amount` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `credit_voucher_items`
--

INSERT INTO `credit_voucher_items` (`id`, `voucher_id`, `itemId`, `hsnCode`, `quantity`, `rate`, `discount`, `amount`) VALUES
(1, 8, 1, '1234', 10.00, 100.00, 5.00, 950.00),
(2, 9, 0, '8517', 120.00, 120.00, 40.00, 16952.00),
(3, 12, 0, '8517', 120.00, 120.00, 50.00, 16942.00),
(4, 13, 0, '6204', 1230.00, 120.00, 30.00, 165282.00),
(5, 14, 0, '8517', 10.00, 10.00, 0.00, 118.00);

-- --------------------------------------------------------

--
-- Table structure for table `currencies`
--

CREATE TABLE `currencies` (
  `id` int(11) NOT NULL,
  `code` varchar(10) NOT NULL,
  `symbol` varchar(10) DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `exchange_rate` decimal(15,2) DEFAULT 1.00,
  `is_base` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `company_id` int(11) NOT NULL,
  `owner_type` enum('employee','user') NOT NULL,
  `owner_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `currencies`
--

INSERT INTO `currencies` (`id`, `code`, `symbol`, `name`, `exchange_rate`, `is_base`, `created_at`, `company_id`, `owner_type`, `owner_id`) VALUES
(2, 'INR', '₹', 'Indian Rupee', 1.00, 0, '2025-06-24 19:58:57', 0, 'employee', 0),
(3, 'USD', '$', 'US Dollar	', 82.50, 0, '2025-06-24 20:05:14', 0, 'employee', 0),
(6, 'AED', '$', 'Dhiram', 21.10, 0, '2025-07-03 16:38:22', 38, 'employee', 10),
(8, 'USD', '$', 'Dollar', 1.00, 0, '2025-08-25 14:27:37', 0, 'user', 14);

-- --------------------------------------------------------

--
-- Table structure for table `debit_note_entries`
--

CREATE TABLE `debit_note_entries` (
  `id` int(11) NOT NULL,
  `voucher_id` int(11) NOT NULL,
  `item_id` int(11) DEFAULT NULL,
  `hsn_code` varchar(50) DEFAULT NULL,
  `quantity` decimal(10,2) DEFAULT NULL,
  `unit` varchar(20) DEFAULT NULL,
  `rate` decimal(10,2) DEFAULT NULL,
  `discount` decimal(10,2) DEFAULT NULL,
  `amount` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `debit_note_entries`
--

INSERT INTO `debit_note_entries` (`id`, `voucher_id`, `item_id`, `hsn_code`, `quantity`, `unit`, `rate`, `discount`, `amount`) VALUES
(1, 1, 1, '1234', 10.00, '', 100.00, 5.00, 950.00),
(2, 1, 2, '5678', 5.00, '', 200.00, 0.00, 1000.00),
(3, 2, NULL, '', 0.00, '', 0.00, 0.00, 120.00),
(4, 2, NULL, '', 0.00, '', 0.00, 0.00, 120.00),
(5, 3, 0, '8517', 120.00, '', 119.99, 0.00, 16990.58),
(6, 4, NULL, '', 0.00, '', 0.00, 0.00, 1230.00),
(7, 4, NULL, '', 0.00, '', 0.00, 0.00, 1230.00),
(8, 5, 0, '8517', 120.00, '', 0.00, 120.00, -120.00),
(9, 6, 0, '8517', 10.00, '', 9.99, 0.00, 117.88);

-- --------------------------------------------------------

--
-- Table structure for table `debit_note_vouchers`
--

CREATE TABLE `debit_note_vouchers` (
  `id` int(11) NOT NULL,
  `date` date NOT NULL,
  `number` varchar(50) DEFAULT NULL,
  `mode` varchar(50) DEFAULT NULL,
  `party_id` int(11) DEFAULT NULL,
  `sales_ledger_id` int(11) DEFAULT NULL,
  `narration` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `company_id` int(11) NOT NULL,
  `owner_type` enum('employee','user') NOT NULL,
  `owner_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `debit_note_vouchers`
--

INSERT INTO `debit_note_vouchers` (`id`, `date`, `number`, `mode`, `party_id`, `sales_ledger_id`, `narration`, `created_at`, `company_id`, `owner_type`, `owner_id`) VALUES
(1, '2025-07-17', 'DN-001', 'item-invoice', 5, 2, 'Debit note issued for return of goods', '2025-07-17 18:14:29', 0, 'employee', 0),
(2, '2025-07-17', 'SO0001', 'accounting-invoice', 21, NULL, '', '2025-07-17 18:20:15', 0, 'employee', 0),
(3, '2025-07-17', 'SO0001', 'item-invoice', 13, 11, '', '2025-07-17 18:29:58', 0, 'employee', 0),
(4, '2025-07-19', 'SO0001', 'accounting-invoice', 22, 11, '', '2025-07-19 12:52:20', 0, 'employee', 0),
(5, '2025-07-19', '', 'item-invoice', 13, 11, '', '2025-07-19 13:13:48', 0, 'employee', 0),
(6, '2025-08-29', 'XYZ0001', 'item-invoice', 40, 42, '', '2025-08-29 10:51:33', 38, 'employee', 10);

-- --------------------------------------------------------

--
-- Table structure for table `deductees`
--

CREATE TABLE `deductees` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `pan` varchar(20) NOT NULL,
  `category` enum('individual','company','huf','firm','aop','trust') NOT NULL,
  `address` text DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `tds_section` varchar(20) DEFAULT NULL,
  `rate` decimal(5,2) DEFAULT NULL,
  `threshold` decimal(15,2) DEFAULT NULL,
  `total_deducted` decimal(15,2) DEFAULT 0.00,
  `last_deduction` date DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `deductees`
--

INSERT INTO `deductees` (`id`, `name`, `pan`, `category`, `address`, `email`, `phone`, `tds_section`, `rate`, `threshold`, `total_deducted`, `last_deduction`, `status`, `created_at`, `updated_at`) VALUES
(1, 'Saima', 'ABCDE1234F', 'individual', 'Jawaharnagar, Road no. 12 ,flat no. B10 Shabina Apartment mango Jamshedpur', 'saimashadmani1999@gmail.com', '09693284411', '194', 0.02, 0.02, 0.00, NULL, 'active', '2025-07-29 11:58:53', '2025-07-29 11:58:53'),
(3, 'Saima', 'ABCDE1234D', 'individual', 'Jawaharnagar, Road no. 12 ,flat no. B10 Shabina Apartment mango Jamshedpur', 'saimashadmani1999@gmail.com', '09693284411', '196', 0.04, 0.03, 0.00, NULL, 'active', '2025-07-29 12:13:54', '2025-07-29 12:13:54');

-- --------------------------------------------------------

--
-- Table structure for table `delivery_entries`
--

CREATE TABLE `delivery_entries` (
  `id` int(11) NOT NULL,
  `delivery_item_id` int(11) NOT NULL,
  `ledger_id` int(11) NOT NULL,
  `quantity` decimal(10,2) DEFAULT 0.00,
  `rate` decimal(10,2) DEFAULT 0.00,
  `amount` decimal(10,2) DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `delivery_entries`
--

INSERT INTO `delivery_entries` (`id`, `delivery_item_id`, `ledger_id`, `quantity`, `rate`, `amount`) VALUES
(1, 1, 101, 10.00, 50.00, 500.00),
(2, 1, 102, 5.00, 100.00, 500.00),
(3, 2, 25, NULL, NULL, 40.00),
(4, 2, 26, NULL, NULL, 40.00),
(5, 3, 23, NULL, NULL, 30.00),
(6, 3, 10, NULL, NULL, 30.00),
(7, 4, 24, NULL, NULL, 110.00),
(8, 4, 26, NULL, NULL, 110.00);

-- --------------------------------------------------------

--
-- Table structure for table `delivery_items`
--

CREATE TABLE `delivery_items` (
  `id` int(11) NOT NULL,
  `date` date NOT NULL,
  `number` varchar(255) DEFAULT NULL,
  `narration` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `company_id` int(11) NOT NULL,
  `owner_type` enum('employee','user') NOT NULL,
  `owner_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `delivery_items`
--

INSERT INTO `delivery_items` (`id`, `date`, `number`, `narration`, `created_at`, `company_id`, `owner_type`, `owner_id`) VALUES
(1, '2025-07-19', 'DN-001', 'Handle with care. Deliver during office hours.', '2025-07-20 18:34:52', 0, 'employee', 0),
(2, '2025-07-20', '12345', '', '2025-07-20 18:36:54', 0, 'employee', 0),
(3, '2025-07-20', '33333', '', '2025-07-20 18:39:59', 0, 'employee', 0),
(4, '2025-08-29', 'STKJRNLV303963', '', '2025-08-29 11:58:03', 38, 'employee', 10);

-- --------------------------------------------------------

--
-- Table structure for table `fifo_categories`
--

CREATE TABLE `fifo_categories` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `fifo_settings`
--

CREATE TABLE `fifo_settings` (
  `id` int(11) NOT NULL,
  `key_name` varchar(100) NOT NULL,
  `key_value` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `fifo_transactions`
--

CREATE TABLE `fifo_transactions` (
  `id` int(11) NOT NULL,
  `date` date NOT NULL,
  `type` enum('purchase','sale','adjustment') NOT NULL,
  `item_id` int(11) NOT NULL,
  `item_code` varchar(50) DEFAULT NULL,
  `item_name` varchar(255) DEFAULT NULL,
  `quantity` decimal(12,3) NOT NULL,
  `rate` decimal(12,2) NOT NULL,
  `batch_number` varchar(50) DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `remaining_quantity` decimal(12,3) NOT NULL,
  `is_consumed` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `godowns`
--

CREATE TABLE `godowns` (
  `id` int(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `address` text DEFAULT NULL,
  `description` text DEFAULT NULL,
  `company_id` int(11) NOT NULL,
  `owner_type` enum('employee','user') NOT NULL,
  `owner_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `godowns`
--

INSERT INTO `godowns` (`id`, `name`, `address`, `description`, `company_id`, `owner_type`, `owner_id`) VALUES
(1, 'the rail', 'mumbai', 'the rail', 0, 'employee', 0),
(2, 'Main Warehouse', '123 Warehouse St, City', 'Primary storage location', 0, 'employee', 0),
(3, 'Secondary Warehouse', '456 Storage Ave, City', 'Backup storage for overflow', 0, 'employee', 0),
(4, 'Cold Storage', '789 Cold Rd, City', 'Temperature controlled storage', 0, 'employee', 0),
(5, 'enegix-stock', 'kokar', '', 0, 'employee', 0),
(6, 'the rail', 'Mango', '', 38, 'employee', 10);

-- --------------------------------------------------------

--
-- Table structure for table `godown_allocations`
--

CREATE TABLE `godown_allocations` (
  `id` int(11) NOT NULL,
  `stockItemId` int(11) NOT NULL,
  `godownId` int(11) DEFAULT NULL,
  `quantity` decimal(10,2) DEFAULT 0.00,
  `value` decimal(10,2) DEFAULT 0.00,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `company_id` int(11) NOT NULL,
  `owner_type` enum('employee','user') NOT NULL,
  `owner_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `godown_allocations`
--

INSERT INTO `godown_allocations` (`id`, `stockItemId`, `godownId`, `quantity`, `value`, `createdAt`, `company_id`, `owner_type`, `owner_id`) VALUES
(1, 2, 1, 28.00, 42.00, '2025-07-06 15:44:01', 0, 'employee', 0),
(2, 1, 1, 120.50, 6025.00, '2025-07-30 17:17:31', 0, 'employee', 0),
(3, 2, 1, 80.00, 4000.00, '2025-07-30 17:17:31', 0, 'employee', 0),
(4, 1, 1, 50.00, 2500.00, '2025-07-30 17:17:31', 0, 'employee', 0),
(5, 2, 1, 200.00, 15000.00, '2025-07-30 17:17:31', 0, 'employee', 0),
(6, 4, 0, 10.00, 990.00, '2025-07-31 11:47:16', 0, 'employee', 0),
(7, 6, 3, 10.00, 10.00, '2025-08-01 19:31:51', 0, 'employee', 0),
(8, 17, 2, 10.00, 198.00, '2025-08-05 19:12:06', 0, 'employee', 0),
(9, 19, 0, 13.00, 114.00, '2025-08-18 05:09:31', 0, 'employee', 0),
(10, 20, 5, 199.00, 12323.00, '2025-08-18 07:44:48', 0, 'employee', 0);

-- --------------------------------------------------------

--
-- Table structure for table `investments`
--

CREATE TABLE `investments` (
  `id` int(11) NOT NULL,
  `employee_id` varchar(50) NOT NULL,
  `section` enum('80C','80D','80E','80G','80TTA','80TTB','ELSS','NPS') NOT NULL,
  `investment_type` varchar(100) NOT NULL,
  `institute_name` varchar(255) NOT NULL,
  `policy_number` varchar(100) DEFAULT NULL,
  `amount` decimal(15,2) NOT NULL,
  `date_of_investment` date NOT NULL,
  `maturity_date` date DEFAULT NULL,
  `interest_rate` decimal(5,2) DEFAULT NULL,
  `tax_benefit` decimal(15,2) NOT NULL,
  `financial_year` varchar(10) NOT NULL,
  `status` enum('active','matured','surrendered') NOT NULL DEFAULT 'active',
  `documents` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`documents`)),
  `created_date` date DEFAULT curdate()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `investments`
--

INSERT INTO `investments` (`id`, `employee_id`, `section`, `investment_type`, `institute_name`, `policy_number`, `amount`, `date_of_investment`, `maturity_date`, `interest_rate`, `tax_benefit`, `financial_year`, `status`, `documents`, `created_date`) VALUES
(2, '7', '80G', 'Charitable Donations', 'saima', '12333', 5550.00, '2025-07-31', '2025-08-28', 999.00, 2775.00, '2022-23', 'matured', '[]', '2025-07-30'),
(7, '7', '80TTA', 'Savings Account Interest', 'shaadmani', '1234567890', 120.00, '2025-07-31', '2025-08-28', 330.00, 120.00, '2023-24', 'active', '[]', '2025-07-31'),
(8, '7', '80C', 'PPF', 'shaadmani', '12345678900', 1230.00, '2025-07-31', '2025-08-27', 999.99, 1230.00, '2023-24', 'active', '[]', '2025-07-31'),
(9, '7', '80D', 'Health Insurance Premium', 'shaadmani pvtltd', '123456789', 50000.00, '2025-07-31', '2025-08-31', 999.99, 25000.00, '2023-24', 'active', '[]', '2025-07-31');

-- --------------------------------------------------------

--
-- Table structure for table `items`
--

CREATE TABLE `items` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `hsnCode` varchar(20) DEFAULT NULL,
  `gstRate` decimal(5,2) DEFAULT NULL,
  `unit` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `items`
--

INSERT INTO `items` (`id`, `name`, `hsnCode`, `gstRate`, `unit`) VALUES
(1, 'Laptop HP Pavilion', '8471', 18.00, 'Piece');

-- --------------------------------------------------------

--
-- Table structure for table `itr_policies`
--

CREATE TABLE `itr_policies` (
  `id` int(11) NOT NULL,
  `itr_statement_id` int(11) DEFAULT NULL,
  `policy_date` date DEFAULT NULL,
  `policy_no` varchar(50) DEFAULT NULL,
  `remark` varchar(100) DEFAULT NULL,
  `value` decimal(15,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `itr_policies`
--

INSERT INTO `itr_policies` (`id`, `itr_statement_id`, `policy_date`, `policy_no`, `remark`, `value`) VALUES
(1, 1, '2023-06-10', 'LIC00123', 'LIC', 15000.00),
(2, 1, '2023-07-25', 'SBI789', 'ULIP', 20000.00),
(3, 2, '2025-07-31', '12121212', '21wsasa', 32.00),
(4, 3, '0000-00-00', '', '', 0.00);

-- --------------------------------------------------------

--
-- Table structure for table `itr_statements`
--

CREATE TABLE `itr_statements` (
  `id` int(11) NOT NULL,
  `employee_id` varchar(50) NOT NULL,
  `company_id` int(11) NOT NULL,
  `assessee_name` varchar(100) DEFAULT NULL,
  `father_name` varchar(100) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `pan` varchar(10) DEFAULT NULL,
  `aadhar` varchar(12) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `assessment_year` varchar(10) DEFAULT NULL,
  `financial_year` varchar(10) DEFAULT NULL,
  `salary_income` decimal(15,2) DEFAULT 0.00,
  `section17_income` decimal(15,2) DEFAULT 0.00,
  `deduction16` decimal(15,2) DEFAULT 0.00,
  `business_net_profit` decimal(15,2) DEFAULT 0.00,
  `business_type` varchar(100) DEFAULT NULL,
  `gross_turnover` decimal(15,2) DEFAULT 0.00,
  `section44ad` tinyint(1) DEFAULT 0,
  `section44ab` tinyint(1) DEFAULT 0,
  `house_annual_value` decimal(15,2) DEFAULT 0.00,
  `house_tenant1_name` varchar(100) DEFAULT NULL,
  `house_tenant1_address` text DEFAULT NULL,
  `house_tenant1_pan` varchar(10) DEFAULT NULL,
  `house_tenant2_name` varchar(100) DEFAULT NULL,
  `house_tenant2_address` text DEFAULT NULL,
  `house_tenant2_pan` varchar(10) DEFAULT NULL,
  `house_deduction30` decimal(15,2) DEFAULT 0.00,
  `capital_sale` decimal(15,2) DEFAULT 0.00,
  `capital_sale_date` date DEFAULT NULL,
  `capital_purchase_cost` decimal(15,2) DEFAULT 0.00,
  `capital_purchase_index` decimal(15,2) DEFAULT 0.00,
  `capital_improvement1_cost` decimal(15,2) DEFAULT 0.00,
  `capital_improvement1_index` decimal(15,2) DEFAULT 0.00,
  `capital_improvement2_cost` decimal(15,2) DEFAULT 0.00,
  `capital_improvement2_index` decimal(15,2) DEFAULT 0.00,
  `capital_improvement3_cost` decimal(15,2) DEFAULT 0.00,
  `capital_improvement3_index` decimal(15,2) DEFAULT 0.00,
  `agri_income` decimal(15,2) DEFAULT 0.00,
  `saving_interest_80tta` decimal(15,2) DEFAULT 0.00,
  `fd_interest_jhgrb` decimal(15,2) DEFAULT 0.00,
  `fd_interest_sbi` decimal(15,2) DEFAULT 0.00,
  `fd_interest_sahara` decimal(15,2) DEFAULT 0.00,
  `tuition_fee` decimal(15,2) DEFAULT 0.00,
  `life_insurance_premium` decimal(15,2) DEFAULT 0.00,
  `tuition_fee_1st2nd_child` decimal(15,2) DEFAULT 0.00,
  `tds_deducted` decimal(15,2) DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `itr_statements`
--

INSERT INTO `itr_statements` (`id`, `employee_id`, `company_id`, `assessee_name`, `father_name`, `address`, `pan`, `aadhar`, `email`, `date_of_birth`, `assessment_year`, `financial_year`, `salary_income`, `section17_income`, `deduction16`, `business_net_profit`, `business_type`, `gross_turnover`, `section44ad`, `section44ab`, `house_annual_value`, `house_tenant1_name`, `house_tenant1_address`, `house_tenant1_pan`, `house_tenant2_name`, `house_tenant2_address`, `house_tenant2_pan`, `house_deduction30`, `capital_sale`, `capital_sale_date`, `capital_purchase_cost`, `capital_purchase_index`, `capital_improvement1_cost`, `capital_improvement1_index`, `capital_improvement2_cost`, `capital_improvement2_index`, `capital_improvement3_cost`, `capital_improvement3_index`, `agri_income`, `saving_interest_80tta`, `fd_interest_jhgrb`, `fd_interest_sbi`, `fd_interest_sahara`, `tuition_fee`, `life_insurance_premium`, `tuition_fee_1st2nd_child`, `tds_deducted`) VALUES
(1, 'EMP123456', 0, 'Amit Kumar', 'Rajesh Kumar', 'A-3, Green Avenue, Delhi', 'ABCDE1234F', '123456789012', 'amit.kumar@example.com', '1985-05-26', '2024-25', '2023-24', 500000.00, 20000.00, 5000.00, 100000.00, 'Embroidery Work', 700000.00, 1, 0, 95000.00, 'Ravi Singh', 'B-45, Sector-9, Noida', 'QRSTU9876Y', '', '', '', 28500.00, 1000000.00, '2023-12-15', 500000.00, 150000.00, 25000.00, 7000.00, 0.00, 0.00, 0.00, 0.00, 0.00, 12000.00, 3200.00, 2500.00, 0.00, 18000.00, 35000.00, 24000.00, 28000.00),
(2, '7', 0, 'shaima', 'khan', 'ashiana raja bazar,bailey raod,patna-14, farhan enclave -304', 'SWQWQWQWQ', '121332322111', 'khan.saima@gmail.com', '2025-07-31', '2023-24', '2021-22', 0.00, 9999999999999.99, 1222222220.00, 111110.00, 'meical', 12220.00, 0, 0, 1220.00, 'saima', 'saima', '1231212121', 'saima shaadmani', 'saima', '1212121212', 110.00, 12110.00, '2025-07-31', 110.00, 440.00, 110.00, 440.00, 220.00, 440.00, 330.00, 440.00, 4.00, 15.00, 14.00, 13.00, 21.00, 16.00, 19.00, 16.00, 34.00),
(3, '9', 0, 'Saima Shadmani', 'gdfgfd', 'Jawaharnagar, , PURBA SINGHBHUM, Jharkhand, 832110', 'ABCDE1234F', '123456789012', 'saimashadmani1999@gmail.com', '1999-05-10', '2024-25', '2023-24', 0.00, 4.00, 1.00, 20.00, 'fadssss', 0.00, 1, 1, 0.00, '', '', '', '', '', '', 0.00, 0.00, '0000-00-00', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00);

-- --------------------------------------------------------

--
-- Table structure for table `itr_tax_payments`
--

CREATE TABLE `itr_tax_payments` (
  `id` int(11) NOT NULL,
  `itr_statement_id` int(11) DEFAULT NULL,
  `payment_date` date DEFAULT NULL,
  `cheque_no` varchar(50) DEFAULT NULL,
  `bsr_code` varchar(10) DEFAULT NULL,
  `bank_name` varchar(100) DEFAULT NULL,
  `amount` decimal(15,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `itr_tax_payments`
--

INSERT INTO `itr_tax_payments` (`id`, `itr_statement_id`, `payment_date`, `cheque_no`, `bsr_code`, `bank_name`, `amount`) VALUES
(1, 1, '2024-03-21', '987654', '1000312', 'SBI Main Branch', 20000.00),
(2, 2, '2025-07-31', '313212121', '212121', 'SBI', 71.00),
(3, 3, '0000-00-00', '', '', '', 0.00);

-- --------------------------------------------------------

--
-- Table structure for table `ledgers`
--

CREATE TABLE `ledgers` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `group_id` int(11) NOT NULL,
  `opening_balance` decimal(15,2) DEFAULT 0.00,
  `balance_type` enum('debit','credit') DEFAULT 'debit',
  `address` text DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `gst_number` varchar(15) DEFAULT NULL,
  `pan_number` varchar(10) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `company_id` int(11) NOT NULL,
  `owner_type` enum('employee','user') NOT NULL,
  `owner_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `ledgers`
--

INSERT INTO `ledgers` (`id`, `name`, `group_id`, `opening_balance`, `balance_type`, `address`, `email`, `phone`, `gst_number`, `pan_number`, `created_at`, `company_id`, `owner_type`, `owner_id`) VALUES
(1, 'Saima Shadmani', 12, -0.05, 'debit', 'Jawaharnagar, ', 'saimashadmani1999@gmail.com', '09693284411', 'hjgkjhkjy87', 'dfsgre4445', '2025-06-24 06:47:33', 0, 'employee', 0),
(2, 'cashh', 15, 14000.00, 'credit', 'Mango', 'saimashadmani1999@gmail.com', '09693284411', 'hjgkjhkjy87', 'hjsiuty8e7', '2025-06-24 07:40:41', 0, 'employee', 0),
(3, 'SBI Bank', 22, 0.00, 'debit', NULL, NULL, NULL, NULL, NULL, '2025-06-30 14:36:53', 0, 'employee', 0),
(4, 'cash', 23, 0.00, 'debit', NULL, NULL, NULL, NULL, NULL, '2025-06-30 14:59:17', 0, 'employee', 0),
(5, 'Saima Shadmani', 14, 100.00, 'debit', 'Jawaharnagar, Road no. 12 ,flat no. B10 Shabina apartment, Road no. 12 ,flat no. B10 Shabina apartment, Road no. 12 ,flat no. B10 Shabina apartment\nRoad no. 12 ,flat no. B10 Shabina apartment', 'saimashadmani1999@gmail.com', '09693284411', '74333333333', 'drr34t5y45', '2025-07-03 16:35:23', 0, 'employee', 0),
(6, 'Cash in Hand', 16, 25000.00, 'debit', 'Mumbai', 'cash@example.com', '9876543210', NULL, 'ABCDE1234F', '2025-07-29 14:25:23', 0, 'employee', 0),
(7, 'SBI Bank', 22, 150000.00, 'debit', 'Mumbai', 'sbi@example.com', '9876543211', NULL, 'ABCDE1234G', '2025-07-29 14:25:23', 0, 'employee', 0),
(8, 'Sales', 19, 500000.00, 'credit', NULL, NULL, NULL, NULL, 'ABCDE1234H', '2025-07-29 14:25:23', 0, 'employee', 0),
(9, 'Purchases', 17, 300000.00, 'debit', NULL, NULL, NULL, NULL, 'ABCDE1234I', '2025-07-29 14:25:23', 0, 'employee', 0),
(10, 'Rent Expense', 18, 50000.00, 'debit', NULL, NULL, NULL, NULL, 'ABCDE1234J', '2025-07-29 14:25:23', 0, 'employee', 0),
(11, 'Owner Capital', 12, 1000000.00, 'credit', NULL, NULL, NULL, NULL, NULL, '2025-07-29 15:41:45', 0, 'employee', 0),
(12, 'Bank Loan', 13, 500000.00, 'credit', NULL, NULL, NULL, NULL, NULL, '2025-07-29 15:41:45', 0, 'employee', 0),
(13, 'Sundry Creditors', 14, 200000.00, 'credit', NULL, NULL, NULL, NULL, NULL, '2025-07-29 15:41:45', 0, 'employee', 0),
(14, 'Factory Building', 15, 800000.00, 'debit', NULL, NULL, NULL, NULL, NULL, '2025-07-29 15:41:45', 0, 'employee', 0),
(15, 'Cash in Hand', 16, 50000.00, 'debit', NULL, NULL, NULL, NULL, NULL, '2025-07-29 15:41:45', 0, 'employee', 0),
(16, 'Raw Material Purchases', 17, 300000.00, 'debit', NULL, NULL, NULL, NULL, NULL, '2025-07-29 15:41:45', 0, 'employee', 0),
(17, 'Factory Expenses', 18, 100000.00, 'debit', NULL, NULL, NULL, NULL, NULL, '2025-07-29 15:41:45', 0, 'employee', 0),
(18, 'Office Expenses', 19, 50000.00, 'debit', NULL, NULL, NULL, NULL, NULL, '2025-07-29 15:41:45', 0, 'employee', 0),
(19, 'Interest Income', 20, 20000.00, 'credit', NULL, NULL, NULL, NULL, NULL, '2025-07-29 15:41:45', 0, 'employee', 0),
(20, 'Product Sales', 21, 1200000.00, 'credit', NULL, NULL, NULL, NULL, NULL, '2025-07-29 15:41:45', 0, 'employee', 0),
(21, 'Opening Stock', 22, 150000.00, 'debit', NULL, NULL, NULL, NULL, NULL, '2025-07-29 15:41:45', 0, 'employee', 0),
(22, 'Closing Stock', 23, 130000.00, 'debit', NULL, NULL, NULL, NULL, NULL, '2025-07-29 15:41:45', 0, 'employee', 0),
(23, 'Reliable Suppliers Ltd', 25, 0.00, 'debit', '456 Industrial Area, Mumbai', NULL, '+91 9876543210', '27RELSU1234F1Z5', NULL, '2025-07-31 05:51:07', 0, 'employee', 0),
(24, 'Elite Manufacturing', 25, 0.00, 'debit', '654 Manufacturing Hub, Pune', NULL, '+91 7766554433', '27ELITE123G4H5', NULL, '2025-07-31 05:51:07', 0, 'employee', 0),
(25, 'real estate', 24, 1000.00, 'debit', '', '', '', '', '', '2025-08-03 17:37:51', 0, 'employee', 0),
(26, 'landing', 25, 1000.00, 'credit', '', '', '', '', '', '2025-08-03 17:37:51', 0, 'employee', 0),
(27, 'ABC Traders', 24, 50000.00, 'debit', '123 Street, City', 'abc@example.com', '1234567890', '27ABCDE1234F1Z5', 'ABCDE1234F', '2025-08-03 20:11:38', 0, 'employee', 0),
(28, 'XYZ Suppliers', 25, 30000.00, 'credit', '456 Avenue, City', 'xyz@example.com', '0987654321', '27XYZDE6789L1Z7', 'XYZDE6789L', '2025-08-03 20:11:38', 0, 'employee', 0),
(29, 'bmw', 12, 1321.00, 'debit', '2fdfdf', 'sdc@gmail.com', '1111111111', '', 'ABCDE1234F', '2025-08-06 10:29:08', 0, 'employee', 0),
(30, 'enegix globalll', 13, 1000.00, 'debit', 'Road Number t', 'saimashadmani1999@gmail.com', '09693284411', '', 'ABCDE1234F', '2025-08-13 19:07:17', 38, 'employee', 10),
(31, 'Shasha', 15, 100000.00, 'credit', 'Jawaharnagar', 'saimashadmani1999@gmail.com', '3393284411', '4444RRRRRRR3333', 'ABCDE1234F', '2025-08-13 19:10:58', 38, 'employee', 10),
(32, 'Vikky ', 28, 1000.00, 'credit', '', '', '', '', '', '2025-08-16 01:30:50', 0, 'employee', 0),
(33, 'RV patel', 23, 1000.00, 'debit', '', '', '', '', '', '2025-08-19 18:00:03', 38, 'employee', 10),
(34, 'travelling', 20, 0.00, 'debit', '', '', '', '', '', '2025-08-20 11:05:42', 0, 'employee', 0),
(35, '28% gst sales', 19, 0.00, 'debit', '', '', '', '', '', '2025-08-20 11:08:27', 0, 'employee', 0),
(36, 'ledger', 33, 1000.00, 'debit', 'jdsk', 'saimashadmani1999@gmail.com', '09693284411', '', 'ABCDE1234F', '2025-08-22 11:32:50', 38, 'employee', 10),
(37, 'ledger1', 15, 1000.00, 'debit', 'Jawaharnagar\nRoad no. 12', 'saimashadmani1999@gmail.com', '09693284411', '', 'ABCDE1234F', '2025-08-22 11:45:44', 38, 'employee', 10),
(38, 'bulkledgertesting 1', 35, 100.00, 'debit', '', '', '', '', '', '2025-08-22 12:03:35', 38, 'employee', 10),
(39, 'bulkledgertesting 2', 34, 1000.00, 'credit', '', '', '', '', '', '2025-08-22 12:03:35', 38, 'employee', 10),
(40, 'John Doe', 36, 1000.00, 'debit', '123 Main St', 'john@example.com', '1234567890', '27ABCDE1234F1Z5', 'ABCDE1234F', '2025-08-27 18:22:54', 38, 'employee', 10),
(41, 'Cash Account', 37, 5000.00, 'debit', 'HQ Office', NULL, '0987654321', NULL, NULL, '2025-08-27 18:22:54', 38, 'employee', 10),
(42, 'Sales Ledger', 38, 0.00, 'credit', NULL, NULL, NULL, NULL, NULL, '2025-08-27 18:22:54', 38, 'employee', 10),
(43, 'Purchase Ledger', 39, 100.00, 'credit', NULL, NULL, NULL, NULL, NULL, '2025-08-27 18:22:54', 38, 'employee', 10),
(44, 'Sundary', 25, 110.00, 'debit', 'Mango', 'saimashadmani@gmail.com', '09693284411', '', '', '2025-08-28 20:22:33', 38, 'employee', 10),
(45, 'Test Party', 25, 0.00, 'debit', NULL, NULL, NULL, '22AAAAA0000A1Z5', NULL, '2025-09-04 09:48:07', 0, 'employee', 0);

-- --------------------------------------------------------

--
-- Table structure for table `ledger_groups`
--

CREATE TABLE `ledger_groups` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `type` varchar(50) DEFAULT NULL,
  `parent` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `alias` varchar(100) DEFAULT NULL,
  `nature` enum('Assets','Liabilities','Income','Expenses') DEFAULT NULL,
  `behavesLikeSubLedger` tinyint(1) DEFAULT 0,
  `nettBalancesForReporting` tinyint(1) DEFAULT 1,
  `usedForCalculation` tinyint(1) DEFAULT 0,
  `allocationMethod` varchar(50) DEFAULT NULL,
  `setAlterHSNSAC` tinyint(1) DEFAULT 0,
  `hsnSacClassificationId` varchar(50) DEFAULT NULL,
  `hsnCode` varchar(50) DEFAULT NULL,
  `setAlterGST` tinyint(1) DEFAULT 0,
  `gstClassificationId` varchar(50) DEFAULT NULL,
  `typeOfSupply` enum('Goods','Services') DEFAULT NULL,
  `taxability` enum('Taxable','Exempt','Nil-rated') DEFAULT NULL,
  `integratedTaxRate` decimal(5,2) DEFAULT NULL,
  `cess` decimal(5,2) DEFAULT NULL,
  `company_id` int(11) NOT NULL,
  `owner_type` enum('employee','user') NOT NULL,
  `owner_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `ledger_groups`
--

INSERT INTO `ledger_groups` (`id`, `name`, `type`, `parent`, `created_at`, `alias`, `nature`, `behavesLikeSubLedger`, `nettBalancesForReporting`, `usedForCalculation`, `allocationMethod`, `setAlterHSNSAC`, `hsnSacClassificationId`, `hsnCode`, `setAlterGST`, `gstClassificationId`, `typeOfSupply`, `taxability`, `integratedTaxRate`, `cess`, `company_id`, `owner_type`, `owner_id`) VALUES
(12, 'Capital Account', 'capital', 12, '2025-06-24 12:26:52', NULL, NULL, 0, 1, 0, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, 38, 'employee', 10),
(13, 'Loans (Liability)', 'loans', 13, '2025-06-24 12:26:52', NULL, NULL, 0, 1, 0, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, 0, 'employee', 0),
(14, 'Current Liabilities', 'current-liabilities', 14, '2025-06-24 12:26:52', NULL, NULL, 0, 1, 0, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, 0, 'employee', 0),
(15, 'Fixed Assets', 'fixed-assets', 15, '2025-06-24 12:26:52', NULL, NULL, 0, 1, 0, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, 38, 'employee', 10),
(16, 'Current Assets', 'current-assets', 16, '2025-06-24 12:26:52', NULL, NULL, 0, 1, 0, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, 0, 'employee', 0),
(17, 'Purchase Accounts', 'expense', 17, '2025-06-24 12:26:52', NULL, NULL, 0, 1, 0, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, 0, 'employee', 0),
(18, 'Direct Expenses', 'expense', 18, '2025-06-24 12:26:52', NULL, NULL, 0, 1, 0, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, 0, 'employee', 0),
(19, 'Sales Accounts', 'income', 19, '2025-06-24 12:26:52', NULL, NULL, 0, 1, 0, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, 0, 'employee', 0),
(20, 'Indirect Expenses', 'expense', 20, '2025-06-24 12:26:52', NULL, NULL, 0, 1, 0, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, 0, 'employee', 0),
(21, 'Indirect Incomes', 'income', 21, '2025-06-24 12:26:52', NULL, NULL, 0, 1, 0, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, 0, 'employee', 0),
(22, 'Bank Accounts', 'Bank', 22, '2025-06-24 12:26:52', NULL, NULL, 0, 1, 0, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, 0, 'employee', 0),
(23, 'Cash-in-Hand', 'Cash', 23, '2025-06-24 12:26:52', NULL, NULL, 0, 1, 0, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, 0, 'employee', 0),
(24, 'Sundry Debtors', 'asset', 24, '2025-06-24 12:26:52', NULL, NULL, 0, 1, 0, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, 0, 'employee', 0),
(25, 'Sundry Creditors', 'liability', 25, '2025-06-24 12:26:52', NULL, NULL, 0, 1, 0, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, 0, 'employee', 0),
(26, 'Duties & Taxes', 'liability', 26, '2025-06-24 12:26:52', NULL, NULL, 0, 1, 0, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, 0, 'employee', 0),
(27, 'Stock-in-Hand', 'asset', 27, '2025-06-24 12:26:52', NULL, NULL, 0, 1, 0, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, 0, 'employee', 0),
(28, 'Suspense A/c', 'other', 28, '2025-06-24 12:26:52', NULL, NULL, 0, 1, 0, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, 0, 'employee', 0),
(29, 'THE ORIGIN SUITES', NULL, NULL, '2025-07-03 18:12:29', 'sdg', 'Liabilities', 1, 1, 1, 'No Appropriation', 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, 0, 'employee', 0),
(30, 'Test Group', 'assets', NULL, '2025-07-03 18:20:18', 'TALIAS', 'Assets', 1, 1, 0, 'No Appropriation', 1, 'HSN001', '8471', 1, 'GST001', 'Goods', 'Taxable', 18.00, 0.00, 0, 'employee', 0),
(31, 'sss786786', NULL, NULL, '2025-07-03 18:23:24', 'sdg', 'Assets', 1, 1, 1, 'No Appropriation', 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, 0, 'employee', 0),
(32, 'sss786786', NULL, NULL, '2025-07-03 18:25:11', 'sdg', 'Assets', 1, 1, 1, 'No Appropriation', 1, 'Appropriate by Value', 'dghdf', 1, 'Appropriate by Value', 'Goods', 'Taxable', 28.00, 1.00, 0, 'employee', 0),
(33, 'cash in hand', NULL, NULL, '2025-07-03 18:31:27', 'sdg', 'Liabilities', 1, 1, 1, 'No Appropriation', 1, 'Appropriate by Qty', 'dghdf', 1, 'Appropriate by Value', 'Goods', 'Taxable', 12.00, 1.00, 38, 'employee', 10),
(34, 'investment', NULL, NULL, '2025-08-16 02:46:42', NULL, 'Assets', 1, 1, 1, 'No Appropriation', 1, NULL, NULL, 1, NULL, NULL, NULL, NULL, NULL, 38, 'employee', 10),
(35, 'Capital Account', 'capital', NULL, '2025-08-22 18:03:45', NULL, 'Assets', 1, 1, 1, 'No Appropriation', 1, NULL, NULL, 1, 'Appropriate by Qty', 'Goods', 'Taxable', 18.00, 10.00, 38, 'employee', 10),
(36, 'Sundry Debtors', 'asset', NULL, '2025-08-27 18:22:54', 'SD', 'Assets', 0, 1, 0, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, 38, 'employee', 10),
(37, 'Cash', 'Cash', NULL, '2025-08-27 18:22:54', 'CASH', 'Assets', 0, 1, 0, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, 38, 'employee', 10),
(38, 'Sales', 'Sales', NULL, '2025-08-27 18:22:54', 'SALES', 'Income', 0, 1, 0, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, 38, 'employee', 10),
(39, 'Purchase', 'Purchase', NULL, '2025-08-27 18:22:54', 'Purchase', 'Income', 0, 1, 0, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, 38, 'employee', 10);

-- --------------------------------------------------------

--
-- Table structure for table `purchase_orders`
--

CREATE TABLE `purchase_orders` (
  `id` int(11) NOT NULL,
  `date` date NOT NULL,
  `number` varchar(32) NOT NULL,
  `party_id` varchar(64) NOT NULL,
  `purchase_ledger_id` varchar(64) NOT NULL,
  `reference_no` varchar(64) DEFAULT NULL,
  `narration` text DEFAULT NULL,
  `order_ref` varchar(128) DEFAULT NULL,
  `terms_of_delivery` varchar(256) DEFAULT NULL,
  `expected_delivery_date` date DEFAULT NULL,
  `status` enum('pending','confirmed','partially_received','completed','cancelled') DEFAULT 'pending',
  `dispatch_destination` varchar(128) DEFAULT NULL,
  `dispatch_through` varchar(128) DEFAULT NULL,
  `dispatch_doc_no` varchar(64) DEFAULT NULL,
  `company_id` varchar(64) NOT NULL,
  `owner_type` varchar(32) NOT NULL,
  `owner_id` varchar(64) NOT NULL,
  `remarks` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `purchase_orders`
--

INSERT INTO `purchase_orders` (`id`, `date`, `number`, `party_id`, `purchase_ledger_id`, `reference_no`, `narration`, `order_ref`, `terms_of_delivery`, `expected_delivery_date`, `status`, `dispatch_destination`, `dispatch_through`, `dispatch_doc_no`, `company_id`, `owner_type`, `owner_id`, `remarks`, `created_at`, `updated_at`) VALUES
(1, '2025-08-28', 'PO894378', '44', '43', 'hjg,jhkj', NULL, 'erer', 'dfs', '2025-08-31', 'pending', NULL, NULL, NULL, '38', 'employee', '10', NULL, '2025-08-28 20:28:05', '2025-08-28 20:28:05');

-- --------------------------------------------------------

--
-- Table structure for table `purchase_order_items`
--

CREATE TABLE `purchase_order_items` (
  `id` int(11) NOT NULL,
  `purchase_order_id` int(11) NOT NULL,
  `item_id` varchar(64) NOT NULL,
  `hsn_code` varchar(32) DEFAULT NULL,
  `quantity` decimal(12,3) NOT NULL DEFAULT 0.000,
  `rate` decimal(15,2) NOT NULL DEFAULT 0.00,
  `discount` decimal(15,2) DEFAULT 0.00,
  `amount` decimal(18,2) NOT NULL DEFAULT 0.00,
  `godown_id` varchar(64) DEFAULT NULL,
  `company_id` varchar(64) NOT NULL,
  `owner_type` varchar(32) NOT NULL,
  `owner_id` varchar(64) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `purchase_order_items`
--

INSERT INTO `purchase_order_items` (`id`, `purchase_order_id`, `item_id`, `hsn_code`, `quantity`, `rate`, `discount`, `amount`, `godown_id`, `company_id`, `owner_type`, `owner_id`) VALUES
(1, 1, '1', '8471', 10.000, 45000.00, 0.00, 450000.00, '2', '38', 'employee', '10');

-- --------------------------------------------------------

--
-- Table structure for table `purchase_vouchers`
--

CREATE TABLE `purchase_vouchers` (
  `id` int(11) NOT NULL,
  `number` varchar(50) DEFAULT NULL,
  `date` date DEFAULT NULL,
  `supplierInvoiceDate` date DEFAULT NULL,
  `narration` text DEFAULT NULL,
  `partyId` int(11) DEFAULT NULL,
  `referenceNo` varchar(100) DEFAULT NULL,
  `dispatchDocNo` varchar(100) DEFAULT NULL,
  `dispatchThrough` varchar(100) DEFAULT NULL,
  `destination` varchar(100) DEFAULT NULL,
  `purchaseLedgerId` int(11) DEFAULT NULL,
  `subtotal` decimal(10,2) DEFAULT NULL,
  `cgstTotal` decimal(10,2) DEFAULT NULL,
  `sgstTotal` decimal(10,2) DEFAULT NULL,
  `igstTotal` decimal(10,2) DEFAULT NULL,
  `discountTotal` decimal(10,2) DEFAULT NULL,
  `total` decimal(10,2) DEFAULT NULL,
  `company_id` int(11) NOT NULL,
  `owner_type` varchar(50) NOT NULL,
  `owner_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `purchase_vouchers`
--

INSERT INTO `purchase_vouchers` (`id`, `number`, `date`, `supplierInvoiceDate`, `narration`, `partyId`, `referenceNo`, `dispatchDocNo`, `dispatchThrough`, `destination`, `purchaseLedgerId`, `subtotal`, `cgstTotal`, `sgstTotal`, `igstTotal`, `discountTotal`, `total`, `company_id`, `owner_type`, `owner_id`) VALUES
(3, 'ABC0001', '2025-07-01', '2025-07-01', 'hii', 2, '123sup', '123456', 'jammu', 'jamshedpur', 13, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, '', 0),
(4, 'ABC0001', '2025-07-01', '2025-07-01', 'hii', 1, '1234SUP', '12345gt', 'jammu', 'jamshedpur', 11, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, '', 0),
(5, 'ABC0001', '2025-07-01', '2025-07-01', 's', 2, '123SUP', '123456', 'jammu', 'jamshedpur', 12, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, '', 0),
(6, 'ABC0001', '2025-07-01', '2025-07-01', 's', 2, '123SUP', '123456', 'jammu', 'jamshedpur', 12, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, '', 0),
(7, 'ABC0001', '2025-08-15', '2025-08-15', '', 5, 'thrthrg', NULL, NULL, NULL, 16, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0, '', 0),
(8, 'ABC0001', '2025-08-15', '2025-08-15', '', 5, 'thrthrg', NULL, NULL, NULL, 16, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 38, 'employee', 10),
(9, 'ABC0001', '2025-08-28', '2025-08-28', '', 41, 'hjg,jhkj', 'ytyuiu', 'jammu', NULL, 43, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 38, 'employee', 10);

-- --------------------------------------------------------

--
-- Table structure for table `purchase_voucher_items`
--

CREATE TABLE `purchase_voucher_items` (
  `id` int(11) NOT NULL,
  `voucherId` int(11) DEFAULT NULL,
  `itemId` int(11) DEFAULT NULL,
  `quantity` decimal(10,2) DEFAULT NULL,
  `rate` decimal(10,2) DEFAULT NULL,
  `discount` decimal(10,2) DEFAULT NULL,
  `cgstRate` decimal(5,2) DEFAULT NULL,
  `sgstRate` decimal(5,2) DEFAULT NULL,
  `igstRate` decimal(5,2) DEFAULT NULL,
  `amount` decimal(10,2) DEFAULT NULL,
  `godownId` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `purchase_voucher_items`
--

INSERT INTO `purchase_voucher_items` (`id`, `voucherId`, `itemId`, `quantity`, `rate`, `discount`, `cgstRate`, `sgstRate`, `igstRate`, `amount`, `godownId`) VALUES
(4, 6, 1, 10.00, 10.00, 0.00, 0.00, 0.00, 0.00, 100.00, 4),
(5, 7, 10, 5.00, 200.00, 0.00, 0.00, 0.00, 0.00, 1000.00, 0),
(6, 8, 10, 5.00, 200.00, 0.00, 0.00, 0.00, 0.00, 1000.00, 0),
(7, 9, 6, 10.00, 10.00, 0.00, 0.00, 0.00, 0.00, 100.00, 0);

-- --------------------------------------------------------

--
-- Table structure for table `sales_orders`
--

CREATE TABLE `sales_orders` (
  `id` int(11) NOT NULL,
  `empId` int(11) NOT NULL,
  `date` date NOT NULL,
  `number` varchar(50) NOT NULL,
  `referenceNo` varchar(100) DEFAULT NULL,
  `partyId` int(11) NOT NULL,
  `salesLedgerId` int(11) NOT NULL,
  `orderRef` varchar(100) DEFAULT NULL,
  `termsOfDelivery` varchar(255) DEFAULT NULL,
  `destination` varchar(255) DEFAULT NULL,
  `dispatchThrough` varchar(255) DEFAULT NULL,
  `dispatchDocNo` varchar(100) DEFAULT NULL,
  `expectedDeliveryDate` datetime NOT NULL,
  `status` varchar(50) NOT NULL,
  `narration` text DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `company_id` varchar(64) NOT NULL,
  `owner_type` varchar(32) NOT NULL,
  `owner_id` varchar(64) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `sales_orders`
--

INSERT INTO `sales_orders` (`id`, `empId`, `date`, `number`, `referenceNo`, `partyId`, `salesLedgerId`, `orderRef`, `termsOfDelivery`, `destination`, `dispatchThrough`, `dispatchDocNo`, `expectedDeliveryDate`, `status`, `narration`, `createdAt`, `company_id`, `owner_type`, `owner_id`) VALUES
(1, 101, '2025-07-17', 'SO-0001', 'REF12345', 12, 18, 'ORD-789', 'Delivery within 7 days', 'Mumbai', 'Transport Co.', 'DOC5678', '0000-00-00 00:00:00', '', 'Please deliver on priority.', '2025-07-17 17:11:17', '', '', ''),
(2, 7, '2025-07-17', 'SO0001', '123', 1, 24, '12345', '3', 'jharkhand', 'jharkand', '22', '0000-00-00 00:00:00', '', '', '2025-07-17 17:43:41', '', '', ''),
(4, 0, '2025-08-28', 'SO817497', 'hjg,jhkj', 40, 42, 'erer', 'dfs', '', '', '', '2025-08-31 00:00:00', 'pending', '', '2025-08-28 19:27:46', '38', 'employee', '10');

-- --------------------------------------------------------

--
-- Table structure for table `sales_order_items`
--

CREATE TABLE `sales_order_items` (
  `id` int(11) NOT NULL,
  `salesOrderId` int(11) NOT NULL,
  `itemId` int(11) NOT NULL,
  `hsnCode` varchar(50) DEFAULT NULL,
  `quantity` decimal(10,2) NOT NULL,
  `rate` decimal(10,2) NOT NULL,
  `discount` decimal(10,2) DEFAULT 0.00,
  `amount` decimal(10,2) NOT NULL,
  `godownId` int(11) DEFAULT NULL,
  `company_id` varchar(64) DEFAULT NULL,
  `owner_type` varchar(32) DEFAULT NULL,
  `owner_id` varchar(64) DEFAULT NULL,
  `cgstRate` varchar(20) DEFAULT NULL,
  `sgstRate` varchar(20) DEFAULT NULL,
  `igstRate` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `sales_order_items`
--

INSERT INTO `sales_order_items` (`id`, `salesOrderId`, `itemId`, `hsnCode`, `quantity`, `rate`, `discount`, `amount`, `godownId`, `company_id`, `owner_type`, `owner_id`, `cgstRate`, `sgstRate`, `igstRate`) VALUES
(1, 1, 101, '8501', 10.00, 500.00, 50.00, 4950.00, 1, NULL, NULL, NULL, NULL, NULL, NULL),
(2, 1, 102, '8502', 5.00, 800.00, 0.00, 4000.00, 2, NULL, NULL, NULL, NULL, NULL, NULL),
(3, 2, 0, '8517', 110.00, 330.00, 440.00, 42394.00, 0, NULL, NULL, NULL, NULL, NULL, NULL),
(4, 2, 0, '6204', 20.00, 40.00, 50.00, 846.00, 0, NULL, NULL, NULL, NULL, NULL, NULL),
(5, 4, 1, '8471', 110.00, 55000.00, 10.00, 7138990.00, 2, '38', 'employee', '10', '9', '9', '0');

-- --------------------------------------------------------

--
-- Table structure for table `sales_vouchers`
--

CREATE TABLE `sales_vouchers` (
  `id` int(11) NOT NULL,
  `number` varchar(100) NOT NULL,
  `date` date NOT NULL,
  `narration` text DEFAULT NULL,
  `partyId` int(11) DEFAULT NULL,
  `referenceNo` varchar(100) DEFAULT NULL,
  `dispatchDocNo` varchar(100) DEFAULT NULL,
  `dispatchThrough` varchar(100) DEFAULT NULL,
  `destination` varchar(255) DEFAULT NULL,
  `subtotal` decimal(10,2) DEFAULT NULL,
  `cgstTotal` decimal(10,2) DEFAULT NULL,
  `sgstTotal` decimal(10,2) DEFAULT NULL,
  `igstTotal` decimal(10,2) DEFAULT NULL,
  `discountTotal` decimal(10,2) DEFAULT NULL,
  `total` decimal(10,2) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `company_id` varchar(64) DEFAULT NULL,
  `owner_type` varchar(32) DEFAULT NULL,
  `owner_id` varchar(64) DEFAULT NULL,
  `type` varchar(16) DEFAULT NULL,
  `isQuotation` tinyint(1) DEFAULT 0,
  `salesLedgerId` varchar(64) DEFAULT NULL,
  `supplierInvoiceDate` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `sales_vouchers`
--

INSERT INTO `sales_vouchers` (`id`, `number`, `date`, `narration`, `partyId`, `referenceNo`, `dispatchDocNo`, `dispatchThrough`, `destination`, `subtotal`, `cgstTotal`, `sgstTotal`, `igstTotal`, `discountTotal`, `total`, `createdAt`, `company_id`, `owner_type`, `owner_id`, `type`, `isQuotation`, `salesLedgerId`, `supplierInvoiceDate`) VALUES
(1, 'XYZ0001', '2025-06-12', 'FEGFW', 2, 'hjg,jhkj', 'ytyuiu', 'sc', 'bvn', NULL, NULL, NULL, NULL, NULL, NULL, '2025-06-28 19:12:46', NULL, NULL, NULL, NULL, 0, NULL, NULL),
(2, 'XYZ0001', '2025-06-12', 'FEGFW', 2, 'hjg,jhkj', 'ytyuiu', 'sc', 'bvn', NULL, NULL, NULL, NULL, NULL, NULL, '2025-06-28 19:13:09', NULL, NULL, NULL, NULL, 0, NULL, NULL),
(3, 'XYZ0001', '2025-06-12', 'FEGFW', 2, 'hjg,jhkj', 'ytyuiu', 'sc', 'bvn', NULL, NULL, NULL, NULL, NULL, NULL, '2025-06-28 19:13:13', NULL, NULL, NULL, NULL, 0, NULL, NULL),
(4, 'XYZ0001', '2025-06-12', 'FEGFW', 2, 'hjg,jhkj', 'ytyuiu', 'sc', 'bvn', NULL, NULL, NULL, NULL, NULL, NULL, '2025-06-28 19:13:16', NULL, NULL, NULL, NULL, 0, NULL, NULL),
(6, 'XYZ0001', '2025-06-29', 'hii', 2, 'hjg,jhkj', 'ytyuiu', 'nmn', 'jamshedpur', NULL, NULL, NULL, NULL, NULL, NULL, '2025-06-29 18:39:16', NULL, NULL, NULL, NULL, 0, NULL, NULL),
(7, 'XYZ0001', '2025-06-29', 'ghgh', 2, 'hjg,jhkj', 'ytyuiu', 'nmn', 'jamshedpur', NULL, NULL, NULL, NULL, NULL, NULL, '2025-06-29 18:40:18', NULL, NULL, NULL, NULL, 0, NULL, NULL),
(8, 'XYZ0001', '2025-06-29', 'ghgh', 2, 'hjg,jhkj', 'ytyuiu', 'nmn', 'jamshedpur', NULL, NULL, NULL, NULL, NULL, NULL, '2025-06-29 18:40:58', NULL, NULL, NULL, NULL, 0, NULL, NULL),
(9, 'XYZ0001', '2025-06-29', 'ghgh', 2, 'hjg,jhkj', 'ytyuiu', 'nmn', 'jamshedpur', NULL, NULL, NULL, NULL, NULL, NULL, '2025-06-29 18:41:20', NULL, NULL, NULL, NULL, 0, NULL, NULL),
(10, 'XYZ0001', '2025-06-29', 'ghgh', 2, 'hjg,jhkj', 'ytyuiu', 'nmn', 'jamshedpur', NULL, NULL, NULL, NULL, NULL, NULL, '2025-06-29 18:41:32', NULL, NULL, NULL, NULL, 0, NULL, NULL),
(11, 'XYZ0001', '2025-06-11', 'cv', 2, 'hjg,jhkj', 'ytyuiu', 'nmn', 'bvn', NULL, NULL, NULL, NULL, NULL, NULL, '2025-06-29 18:48:08', NULL, NULL, NULL, NULL, 0, NULL, NULL),
(12, 'XYZ0001', '2025-06-19', 'fd', 2, 'hjg,jhkj', 'ytyuiu', 'nmn', 'jamshedpur', NULL, NULL, NULL, NULL, NULL, NULL, '2025-06-29 18:55:05', NULL, NULL, NULL, NULL, 0, NULL, NULL),
(13, 'XYZ0001', '2025-06-29', 'g', 2, 'hjg,jhkj', 'ytyuiu', 'nmn', 'jamshedpur', NULL, NULL, NULL, NULL, NULL, NULL, '2025-06-29 19:01:33', NULL, NULL, NULL, NULL, 0, NULL, NULL),
(14, 'XYZ0001', '2025-06-29', 'g', 2, 'hjg,jhkj', 'ytyuiu', 'nmn', 'jamshedpur', NULL, NULL, NULL, NULL, NULL, NULL, '2025-06-29 19:01:46', NULL, NULL, NULL, NULL, 0, NULL, NULL),
(15, 'XYZ0001', '2025-06-29', '', 2, 'hjg,jhkj', 'ytyuiu', 'nmn', 'jamshedpur', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, '2025-06-29 19:13:58', NULL, NULL, NULL, NULL, 0, NULL, NULL),
(16, 'XYZ0001', '2025-06-29', 'f', 2, 'hjg,jhkj', 'ytyuiu', 'nmn', 'jamshedpur', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, '2025-06-29 19:14:04', NULL, NULL, NULL, NULL, 0, NULL, NULL),
(17, 'XYZ0001', '2025-06-29', 'f', 1, 'hjg,jhkj', 'ytyuiu', 'nmn', 'jamshedpur', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, '2025-06-29 19:14:26', NULL, NULL, NULL, NULL, 0, NULL, NULL),
(18, 'XYZ0001', '2025-06-17', 'gggg', 2, 'hjg,jhkj', 'ytyuiu', 'nmn', 'jamshedpur', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, '2025-06-29 19:22:01', NULL, NULL, NULL, NULL, 0, NULL, NULL),
(19, 'XYZ0001', '2025-06-17', 'hhh', 1, 'dfsfs', 'trew', 'bfdf', 'gb', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, '2025-06-29 19:24:10', NULL, NULL, NULL, NULL, 0, NULL, NULL),
(20, 'XYZ0001', '2025-06-23', 'one', 2, 'dfsfs', 'ytyuiu', 'fdsad', 'vfgsd', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, '2025-06-29 19:27:34', NULL, NULL, NULL, NULL, 0, NULL, NULL),
(21, 'SLSV0001', '2025-08-27', '', 41, 'hjg,jhkj', 'ytyuiu', 'jammu', 'jamshedpur', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, '2025-08-27 18:41:53', '38', 'employee', '10', 'sales', 0, '42', NULL),
(22, 'SLSV0001', '2025-09-01', 'Test Sale', 40, 'REF001', NULL, NULL, NULL, 1000.00, 90.00, 90.00, 0.00, 10.00, 1170.00, '2025-09-04 09:50:08', '38', 'employee', '10', 'sales', 0, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `sales_voucher_items`
--

CREATE TABLE `sales_voucher_items` (
  `id` int(11) NOT NULL,
  `voucherId` int(11) DEFAULT NULL,
  `itemId` int(11) DEFAULT NULL,
  `quantity` decimal(10,2) DEFAULT NULL,
  `rate` decimal(10,2) DEFAULT NULL,
  `amount` decimal(10,2) DEFAULT NULL,
  `cgstRate` decimal(5,2) DEFAULT 0.00,
  `sgstRate` decimal(5,2) DEFAULT 0.00,
  `igstRate` decimal(5,2) DEFAULT 0.00,
  `discount` decimal(12,2) DEFAULT 0.00,
  `hsnCode` varchar(16) DEFAULT NULL,
  `batchNumber` varchar(32) DEFAULT NULL,
  `godownId` varchar(64) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `sales_voucher_items`
--

INSERT INTO `sales_voucher_items` (`id`, `voucherId`, `itemId`, `quantity`, `rate`, `amount`, `cgstRate`, `sgstRate`, `igstRate`, `discount`, `hsnCode`, `batchNumber`, `godownId`) VALUES
(4, 18, 1, 10.00, 45000.00, 450000.00, 0.00, 0.00, 0.00, 0.00, NULL, NULL, NULL),
(5, 21, 0, 10.00, 10.00, 108.00, 9.00, 9.00, 0.00, 10.00, '8517', 'vghf', 'g1'),
(6, 22, 26, 10.00, 100.00, 1000.00, 9.00, 9.00, 0.00, 10.00, '3402', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `scenarios`
--

CREATE TABLE `scenarios` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `include_actuals` tinyint(1) DEFAULT 0,
  `included_voucher_types` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`included_voucher_types`)),
  `excluded_voucher_types` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`excluded_voucher_types`)),
  `from_date` date DEFAULT NULL,
  `to_date` date DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL,
  `company_id` int(11) NOT NULL,
  `owner_type` enum('employee','user') NOT NULL,
  `owner_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `scenarios`
--

INSERT INTO `scenarios` (`id`, `name`, `include_actuals`, `included_voucher_types`, `excluded_voucher_types`, `from_date`, `to_date`, `created_at`, `updated_at`, `company_id`, `owner_type`, `owner_id`) VALUES
(1, 'Annual Budget', 0, '[\"payment\",\"journal\"]', '[\"sales\"]', '2025-04-01', '2025-07-02', '2025-07-02 19:45:03', NULL, 0, 'employee', 0),
(2, 'Annual Budget', 0, '[\"payment\",\"journal\"]', '[\"sales\"]', '2025-04-01', '2025-07-02', '2025-07-02 19:45:03', NULL, 0, 'employee', 0),
(3, 'Annual Budget', 0, '[\"payment\",\"journal\"]', '[\"sales\"]', '2025-04-01', '2025-07-02', '2025-07-02 19:45:03', NULL, 0, 'employee', 0),
(4, 'Annual Budget', 0, '[\"payment\",\"journal\"]', '[\"sales\"]', '2025-04-01', '2025-07-02', '2025-07-02 19:45:03', NULL, 0, 'employee', 0),
(5, 'sss786786', 0, '[\"payment\",\"journal\"]', '[\"sales\",\"contra\"]', '2025-04-01', '2025-07-02', '2025-07-02 19:46:42', NULL, 0, 'employee', 0),
(6, 'sss786', 0, '[\"payment\",\"journal\"]', '[\"receipt\"]', '2025-04-01', '2025-07-03', '2025-07-03 07:25:55', NULL, 0, 'employee', 0),
(7, 'THE ORIGIN SUITES', 0, '[\"payment\",\"journal\"]', '[\"receipt\",\"sales\"]', '2025-04-08', '2025-08-31', '2025-08-25 16:37:45', NULL, 38, 'employee', 10);

-- --------------------------------------------------------

--
-- Table structure for table `stock_categories`
--

CREATE TABLE `stock_categories` (
  `id` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `parent` varchar(50) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `company_id` int(11) NOT NULL,
  `owner_type` enum('employee','user') NOT NULL,
  `owner_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `stock_categories`
--

INSERT INTO `stock_categories` (`id`, `name`, `parent`, `description`, `created_at`, `updated_at`, `company_id`, `owner_type`, `owner_id`) VALUES
('SC-1751610456281', 'Electronics', NULL, 'fgd', '2025-07-04 00:57:36', '2025-07-04 00:57:36', 0, 'employee', 0),
('SC-1755259049564', 'washing soap', NULL, NULL, '2025-08-15 11:57:30', '2025-08-15 11:57:30', 0, 'employee', 0),
('SC-1755493517626', 'marketing', NULL, 'dfhdkf', '2025-08-18 05:05:19', '2025-08-18 05:05:19', 0, 'employee', 0),
('SC-1756238193106', 'THE ORIGIN SUITES', NULL, NULL, '2025-08-26 19:56:33', '2025-08-26 19:56:33', 38, 'employee', 10);

-- --------------------------------------------------------

--
-- Table structure for table `stock_groups`
--

CREATE TABLE `stock_groups` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `parent` varchar(50) DEFAULT NULL,
  `should_quantities_be_added` tinyint(1) DEFAULT 1,
  `set_alter_hsn` tinyint(1) DEFAULT 0,
  `hsn_sac_classification_id` varchar(50) DEFAULT NULL,
  `hsn_code` varchar(50) DEFAULT NULL,
  `hsn_description` text DEFAULT NULL,
  `set_alter_gst` tinyint(1) DEFAULT 0,
  `gst_classification_id` varchar(50) DEFAULT NULL,
  `taxability` varchar(50) DEFAULT NULL,
  `gst_rate` decimal(5,2) DEFAULT NULL,
  `cess` decimal(5,2) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `company_id` int(11) NOT NULL,
  `owner_type` enum('employee','user') NOT NULL,
  `owner_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `stock_groups`
--

INSERT INTO `stock_groups` (`id`, `name`, `parent`, `should_quantities_be_added`, `set_alter_hsn`, `hsn_sac_classification_id`, `hsn_code`, `hsn_description`, `set_alter_gst`, `gst_classification_id`, `taxability`, `gst_rate`, `cess`, `created_at`, `company_id`, `owner_type`, `owner_id`) VALUES
(1, 'capital group', 'sg1', 1, 1, 'gc1', 'dghdf', 'mkkk', 1, 'gc1', 'Taxable', 10.00, 0.90, '2025-07-04 13:34:44', 0, 'employee', 0),
(2, 'Electronics', 'sg1', 1, 1, 'gc1', '1867', 'gff', 1, 'gc1', 'Taxable', 18.00, -14.00, '2025-08-04 16:55:15', 0, 'employee', 0),
(3, 'acc', NULL, 1, 1, 'GST1', '2348', 'dfdfd', 1, 'GST1', 'Taxable', 18.00, 4.00, '2025-08-18 05:06:46', 0, 'employee', 0),
(4, 'Computer', 'sg1', 1, 0, NULL, NULL, NULL, 0, NULL, 'Taxable', 0.00, 0.00, '2025-08-26 18:41:06', 38, 'employee', 10);

-- --------------------------------------------------------

--
-- Table structure for table `stock_items`
--

CREATE TABLE `stock_items` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `stockGroupId` int(11) DEFAULT NULL,
  `unit` varchar(50) DEFAULT NULL,
  `openingBalance` decimal(10,2) DEFAULT 0.00,
  `openingValue` decimal(10,2) DEFAULT 0.00,
  `hsnCode` varchar(50) DEFAULT NULL,
  `gstRate` decimal(5,2) DEFAULT 0.00,
  `taxType` varchar(50) DEFAULT 'Taxable',
  `standardPurchaseRate` decimal(10,2) DEFAULT 0.00,
  `standardSaleRate` decimal(10,2) DEFAULT 0.00,
  `enableBatchTracking` tinyint(1) DEFAULT 0,
  `allowNegativeStock` tinyint(1) DEFAULT 0,
  `maintainInPieces` tinyint(1) DEFAULT 0,
  `secondaryUnit` varchar(50) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `batchNumber` varchar(255) DEFAULT NULL,
  `batchExpiryDate` date DEFAULT NULL,
  `batchManufacturingDate` date DEFAULT NULL,
  `company_id` int(11) NOT NULL,
  `owner_type` enum('employee','user') NOT NULL,
  `owner_id` int(11) NOT NULL,
  `barcode` varchar(200) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `stock_items`
--

INSERT INTO `stock_items` (`id`, `name`, `stockGroupId`, `unit`, `openingBalance`, `openingValue`, `hsnCode`, `gstRate`, `taxType`, `standardPurchaseRate`, `standardSaleRate`, `enableBatchTracking`, `allowNegativeStock`, `maintainInPieces`, `secondaryUnit`, `createdAt`, `batchNumber`, `batchExpiryDate`, `batchManufacturingDate`, `company_id`, `owner_type`, `owner_id`, `barcode`) VALUES
(5, 'Sample Item', 1, 'PCS', 100.00, 5000.00, '1234', 18.00, 'Taxable', 50.00, 60.00, 1, 0, 0, NULL, '2025-08-01 18:29:41', 'BATCH001', '2025-12-31', '2025-01-01', 0, 'employee', 0, ''),
(6, 'Computer', 0, '1', 1000.00, 1000.00, '', 0.00, 'Exempt', 1000.00, 1000.00, 1, 1, 1, '1', '2025-08-01 19:31:51', NULL, NULL, NULL, 0, 'employee', 0, ''),
(7, 'laptop', 0, '1', 1000.00, 1000.00, '', 0.00, 'Taxable', 1000.00, 1000.00, 1, 1, 1, '1', '2025-08-01 19:46:00', NULL, NULL, NULL, 0, 'employee', 0, ''),
(8, 'Computer', 0, '1', 1000.00, 1000.00, '', 0.00, 'Taxable', 1000.00, 1000.00, 1, 1, 0, '', '2025-08-01 19:51:44', NULL, NULL, NULL, 0, 'employee', 0, ''),
(9, 'Computer', 0, '1', 1000.00, 1000.00, '', 0.00, 'Taxable', 1000.00, 1000.00, 1, 1, 0, '', '2025-08-01 19:55:36', NULL, NULL, NULL, 0, 'employee', 0, ''),
(10, 'Computer', 0, '1', 1000.00, 1000.00, '', 0.00, 'Taxable', 1000.00, 997.00, 1, 1, 0, '', '2025-08-01 19:59:31', NULL, NULL, NULL, 0, 'employee', 0, ''),
(11, 'T-shirt', 0, '1', 2000.00, 2000.00, '6204', 14.00, 'Taxable', 1999.00, 1999.00, 1, 1, 1, '1', '2025-08-02 19:12:05', NULL, NULL, NULL, 0, 'employee', 0, ''),
(12, 'shirt', 0, '1', 1000.00, 1000.00, '', 0.00, 'Taxable', 0.00, 0.00, 1, 1, 0, '', '2025-08-02 19:14:19', 'BTH102', '2025-08-31', '2025-08-03', 0, 'employee', 0, ''),
(13, 'phone', 0, 'Piece', 100.00, 100.00, '675', 18.00, 'Taxable', 100.00, 100.00, 0, 0, 1, '', '2025-08-02 20:44:40', NULL, NULL, NULL, 0, 'employee', 0, ''),
(14, 'Mobile', 0, 'Piece', 10000.00, 1000.00, '6564', 18.00, 'Taxable', 100.00, 100.00, 0, 0, 1, '', '2025-08-02 20:44:40', NULL, NULL, NULL, 0, 'employee', 0, ''),
(15, 'Laptop Dell Inspiron', NULL, 'Piece', 10.00, 450000.00, '8471', 18.00, 'Taxable', 40000.00, 45000.00, 0, 0, 1, '', '2025-08-03 17:23:48', NULL, NULL, NULL, 0, 'employee', 0, ''),
(16, 'Mobile Samsung Galaxy', NULL, 'Piece', 25.00, 625000.00, '8517', 18.00, 'Taxable', 22000.00, 25000.00, 0, 0, 1, '', '2025-08-03 17:23:48', NULL, NULL, NULL, 0, 'employee', 0, ''),
(17, 'Office Chair Premium', NULL, 'Piece', 15.00, 120000.00, '9401', 18.00, 'Taxable', 7000.00, 8000.00, 0, 0, 1, '', '2025-08-03 17:23:48', NULL, NULL, NULL, 0, 'employee', 0, ''),
(18, 'czc', 0, 'Box', 0.00, 0.00, NULL, 18.00, 'Taxable', 0.00, 0.00, 0, 0, 1, '', '2025-08-15 11:54:34', NULL, NULL, NULL, 0, 'employee', 0, ''),
(19, 'acc', 0, '1', 1000.00, 100.00, '1001', 9.00, 'Taxable', 90.00, 120.00, 1, 1, 1, '3', '2025-08-18 05:09:31', '12323', '2026-06-18', '2025-08-18', 0, 'employee', 0, ''),
(20, 'telivision', 0, '1', 1000.00, 12323.00, '', 18.00, 'Taxable', 123283.00, 12323232.00, 0, 1, 0, '', '2025-08-18 07:44:48', '', '0000-00-00', '0000-00-00', 0, 'employee', 0, ''),
(21, 'Computer12', 0, '1', 10000.00, 10000.00, '', 0.00, 'Taxable', 9999.00, 9990.00, 1, 1, 0, '', '2025-08-25 19:29:22', 'BTH102', '2025-08-13', '2025-08-31', 38, 'employee', 10, ''),
(22, 'Mobile', 0, 'Piece', 100.00, 100.00, '7897', 18.00, 'Exempt', 100.00, 10.00, 0, 0, 1, '', '2025-08-26 18:16:00', NULL, NULL, NULL, 0, 'employee', 0, ''),
(23, 'Tshirt', 0, 'Pack', 100.00, 100.00, '798', 18.00, 'Taxable', 100.00, 1.00, 0, 0, 1, '', '2025-08-26 18:16:00', NULL, NULL, NULL, 0, 'employee', 0, ''),
(24, 'Mobilee', 0, 'Piece', 1000.00, 1000.00, '123', 18.00, 'Taxable', 999.00, 1000.00, 0, 0, 1, '', '2025-08-26 18:29:43', NULL, NULL, NULL, 38, 'employee', 10, ''),
(25, 'pant', 0, 'Piece', 100.00, 100.00, '1234', 18.00, 'Taxable', 99.00, 99.00, 0, 0, 1, '', '2025-08-26 18:29:43', NULL, NULL, NULL, 38, 'employee', 10, ''),
(26, 'Detergent', NULL, NULL, 0.00, 0.00, '3402', 0.00, 'Taxable', 0.00, 0.00, 0, 0, 0, NULL, '2025-09-04 09:49:09', NULL, NULL, NULL, 38, 'employee', 10, ''),
(27, 'Computer12', 0, '1', 100.00, 98.00, '', 0.00, 'Taxable', 100.00, 8.00, 1, 1, 1, '1', '2025-09-09 10:59:40', 'BTH1022', '2025-09-30', '2025-09-09', 38, 'employee', 10, ''),
(28, 'Computer23', 0, '1', 10.00, 10.00, '', 0.00, 'Taxable', 10.00, 10.00, 1, 1, 1, '1', '2025-09-09 11:01:36', 'BTH102', '2025-09-30', '2025-09-09', 38, 'employee', 10, 'zyE9aT9D3LN0');

-- --------------------------------------------------------

--
-- Table structure for table `stock_item_batches`
--

CREATE TABLE `stock_item_batches` (
  `id` int(11) NOT NULL,
  `stockItemId` int(11) NOT NULL,
  `batchName` varchar(100) NOT NULL,
  `batchNumber` varchar(255) NOT NULL,
  `manufacturingDate` date DEFAULT NULL,
  `expiryDate` date DEFAULT NULL,
  `quantity` decimal(10,2) DEFAULT 0.00,
  `availableQuantity` decimal(10,2) DEFAULT 0.00,
  `costPrice` decimal(12,2) DEFAULT 0.00,
  `mrp` decimal(12,2) DEFAULT 0.00,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `stock_journal_entries`
--

CREATE TABLE `stock_journal_entries` (
  `id` int(11) NOT NULL,
  `voucher_id` int(11) DEFAULT NULL,
  `ledger_id` int(11) DEFAULT NULL,
  `type` enum('debit','credit') NOT NULL,
  `quantity` decimal(12,2) DEFAULT NULL,
  `rate` decimal(12,2) DEFAULT NULL,
  `amount` decimal(12,2) DEFAULT NULL,
  `batch_no` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `stock_journal_entries`
--

INSERT INTO `stock_journal_entries` (`id`, `voucher_id`, `ledger_id`, `type`, `quantity`, `rate`, `amount`, `batch_no`) VALUES
(1, 1, 1, 'credit', 100.00, 10.00, 1000.00, 'BATCH-001'),
(2, 1, 2, 'debit', 100.00, 10.00, 1000.00, 'BATCH-001'),
(3, 2, 1, 'credit', 100.00, 10.00, 1000.00, 'BATCH-001'),
(4, 2, 2, 'debit', 100.00, 10.00, 1000.00, 'BATCH-001'),
(5, 3, 1, 'credit', 100.00, 10.00, 1000.00, 'BATCH-001'),
(6, 3, 2, 'debit', 100.00, 10.00, 1000.00, 'BATCH-001'),
(7, 4, 1, 'credit', 100.00, 10.00, 1000.00, 'BATCH-001'),
(8, 4, 2, 'debit', 100.00, 10.00, 1000.00, 'BATCH-001'),
(9, 5, NULL, '', 10.00, 10.00, 100.00, ''),
(10, 5, NULL, '', 10.00, 10.00, 100.00, ''),
(11, 6, NULL, '', 20.00, 10.00, 200.00, ''),
(12, 6, NULL, '', 20.00, 10.00, 200.00, ''),
(13, 7, NULL, '', 10.00, 9.99, 99.90, ''),
(14, 7, NULL, '', 110.00, 10.00, 1100.00, '');

-- --------------------------------------------------------

--
-- Table structure for table `stock_journal_vouchers`
--

CREATE TABLE `stock_journal_vouchers` (
  `id` int(11) NOT NULL,
  `date` date NOT NULL,
  `number` varchar(50) NOT NULL,
  `narration` text DEFAULT NULL,
  `employee_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `company_id` int(11) NOT NULL,
  `owner_type` enum('employee','user') NOT NULL,
  `owner_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `stock_journal_vouchers`
--

INSERT INTO `stock_journal_vouchers` (`id`, `date`, `number`, `narration`, `employee_id`, `created_at`, `company_id`, `owner_type`, `owner_id`) VALUES
(1, '2025-07-19', 'SJ-001', 'Transfer from Warehouse A to Warehouse B', NULL, '2025-07-20 16:01:04', 0, 'employee', 0),
(2, '2025-07-19', 'SJ-001', 'Transfer from Warehouse A to Warehouse B', NULL, '2025-07-20 16:03:15', 0, 'employee', 0),
(3, '2025-07-19', 'SJ-001', 'Transfer from Warehouse A to Warehouse B', 7, '2025-07-20 16:03:39', 0, 'employee', 0),
(4, '2025-07-19', 'SJ-001', 'Transfer from Warehouse A to Warehouse B', 7, '2025-07-20 17:55:28', 0, 'employee', 0),
(5, '2025-07-20', 'XYZ0001', '', 7, '2025-07-20 18:17:43', 0, 'employee', 0),
(6, '2025-07-20', 'XYZ0001', '', 7, '2025-07-20 18:21:12', 0, 'employee', 0),
(7, '2025-08-29', 'XYZ0001', '', NULL, '2025-08-29 11:46:59', 38, 'employee', 10);

-- --------------------------------------------------------

--
-- Table structure for table `stock_units`
--

CREATE TABLE `stock_units` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `symbol` varchar(20) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `company_id` int(11) NOT NULL,
  `owner_type` enum('employee','user') NOT NULL,
  `owner_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `stock_units`
--

INSERT INTO `stock_units` (`id`, `name`, `symbol`, `created_at`, `company_id`, `owner_type`, `owner_id`) VALUES
(1, 'Meter', 'm', '2025-07-04 13:12:09', 0, 'employee', 0),
(2, 'Kilogram', 'Kg', '2025-07-05 01:44:29', 0, 'employee', 0),
(3, 'Kilogram', 'Kg', '2025-08-26 19:07:47', 38, 'employee', 10);

-- --------------------------------------------------------

--
-- Table structure for table `tbadmin`
--

CREATE TABLE `tbadmin` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbadmin`
--

INSERT INTO `tbadmin` (`id`, `email`, `password`, `created_at`) VALUES
(12, 'admin@tallyprime.com', 'admin123', '2025-07-10 06:55:34');

-- --------------------------------------------------------

--
-- Table structure for table `tbCA`
--

CREATE TABLE `tbCA` (
  `fdSiNo` int(11) NOT NULL,
  `fdname` varchar(255) NOT NULL,
  `fdphone` varchar(20) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `fdpassword` varchar(255) NOT NULL,
  `fdstatus` enum('active','suspended') DEFAULT 'active',
  `fdlast_login` datetime DEFAULT current_timestamp()
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `tbCA`
--

INSERT INTO `tbCA` (`fdSiNo`, `fdname`, `fdphone`, `email`, `fdpassword`, `fdstatus`, `fdlast_login`) VALUES
(3, 'john', '9876543210', 'thompson@example.com', '$2b$10$4GTnBMhdJPTpvKJuQQ21wOn2KijLM3sKHr80JKY3fwt68z3VUZA7.', 'active', '2025-09-04 23:01:50');

-- --------------------------------------------------------

--
-- Table structure for table `tbcompanies`
--

CREATE TABLE `tbcompanies` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `financial_year` varchar(50) DEFAULT NULL,
  `books_beginning_year` varchar(50) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `pin` varchar(10) DEFAULT NULL,
  `phone_number` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `pan_number` varchar(20) DEFAULT NULL,
  `gst_number` varchar(30) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `country` varchar(100) DEFAULT 'India',
  `tax_type` enum('GST','VAT') DEFAULT 'GST',
  `employee_id` int(11) DEFAULT NULL,
  `vault_password` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `vat_number` varchar(30) DEFAULT NULL,
  `fdAccountType` varchar(50) DEFAULT NULL,
  `fdAccountantName` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbcompanies`
--

INSERT INTO `tbcompanies` (`id`, `name`, `financial_year`, `books_beginning_year`, `address`, `pin`, `phone_number`, `email`, `pan_number`, `gst_number`, `state`, `country`, `tax_type`, `employee_id`, `vault_password`, `created_at`, `vat_number`, `fdAccountType`, `fdAccountantName`) VALUES
(1, 'THE ORIGIN SUITES', '2022', '12-08-24', 'Mango', '832110', '09693284411', 'saimashadmani1999@gmail.com', 'dfsgre4445fvv', '43124', 'Jharkhand(20)', 'India', 'VAT', NULL, '', '2025-06-23 11:55:43', NULL, NULL, NULL),
(2, 'Saima Shadmani ', '2025', '12-08-25', 'mangoo', '832110', '09693284411', 'saimashadmani1999@gmail.com', 'drr34t5y45', '43124', 'Jharkhand(20)', 'India', 'VAT', NULL, '', '2025-06-23 12:08:50', NULL, NULL, NULL),
(3, 'THE ORIGIN SUITES', '2025', '12-08-25', 'Mango', '832110', '75556577575', 'saimashadmani1999@gmail.com', 'drr34t5y45', '74333333333', 'Jharkhand(20)', 'India', 'GST', NULL, '', '2025-06-23 12:21:05', NULL, NULL, NULL),
(4, 'enegix', '2025', '12-08-25', 'Road Number 1 Jawahar Nagar Mango', '832110', '09693284411', 'saimashadmani1999@gmail.com', 'drr34t5y45', '3543264', 'Jharkhand(20)', 'India', 'VAT', NULL, '', '2025-06-23 12:59:08', NULL, NULL, NULL),
(5, 'enegix global', '2025', '12-08-24', 'Jawaharnagar', '832110', '09693284411', 'saimashadmani1999@gmail.com', 'drr34t5y45', '74333333333', 'Jharkhand(20)', 'India', 'GST', NULL, '', '2025-06-23 13:01:52', NULL, NULL, NULL),
(6, 'mama earth', '2025', '12-08-25', 'Road Number ', '832110', '09693284411', 'saimashadmani1999@gmail.com', 'drr34t5y45', '3215421', 'Jharkhand(20)', 'India', 'VAT', NULL, '', '2025-06-23 13:02:42', NULL, NULL, NULL),
(7, 'enegix_global', '2025', '12-08-24', 'Mango', '832110', '09693284411', 'saimashadmani1999@gmail.com', 'drr34t5y45', '', 'Jharkhand(20)', 'India', 'VAT', NULL, '', '2025-06-23 13:21:58', NULL, NULL, NULL),
(8, 'THE ORIGIN SUITES', '2025', '12-08-25', 'Mango', '832110', '09693284411', 'saimashadmani1999@gmail.com', 'drr34t5y45', '74333', 'Jharkhand(20)', 'India', 'GST', NULL, '', '2025-06-23 13:22:43', NULL, NULL, NULL),
(9, 'mama earth12', '2025', '12-08-25', 'Mango', '832110', '09693284411', 'saimashadmani1999@gmail.com', 'wvdsv32dxc', '', 'Jharkhand(20)', 'India', 'VAT', NULL, '', '2025-06-23 13:24:50', NULL, NULL, NULL),
(10, 'codee', '2025', '12-08-25', 'Mango', '832110', '09693284411', 'saimashadmani1999@gmail.com', '43trefds', '', 'Jharkhand(20)', 'India', 'VAT', NULL, '', '2025-06-23 13:29:08', NULL, NULL, NULL),
(11, 'saisha', '2025', '12-08-25', 'Mango', '832110', '09693284411', 'saimashadmani1999@gmail.com', 'hjsiuty8e7', '', 'Jharkhand(20)', 'India', 'VAT', NULL, '', '2025-06-23 13:31:48', NULL, NULL, NULL),
(12, 'warehouse', '2025', '12-08-25', 'Mango', '832110', '09693284411', 'saimashadmani1999@gmail.com', 'wqqf', '', 'Jharkhand(20)', 'India', 'VAT', NULL, '', '2025-06-23 13:52:31', NULL, NULL, NULL),
(13, 'pubgg', '2025', '12-08-25', 'Mango', '832110', '09693284411', 'saimashadmani1999@gmail.com', 'wvdsv32dxc', '', 'Jharkhand(20)', 'India', 'VAT', NULL, '', '2025-06-23 13:56:55', NULL, NULL, NULL),
(14, 'Saima Shadmani', '2025', '12-08-25', 'Mango', '832110', '54375765', 'saimashadmani1999@gmail.com', 'hjsiuty8e7', '', 'Jharkhand(20)', 'India', 'VAT', NULL, '', '2025-06-23 14:06:43', NULL, NULL, NULL),
(16, 'TestCo', '2024-25', '2024-04-01', '123 Road', '400001', '9999999999', 'test@email.com', 'ABCDE1234F', NULL, 'Maharashtra(27)', 'India', 'VAT', NULL, '', '2025-06-23 14:13:32', 'VAT99887766', NULL, NULL),
(17, 'Saima', '2025', '12-08-24', 'Mango', '832110', '09693284411', 'saimashadmani1999@gmail.com', 'dfssd', '', 'Jharkhand(20)', 'India', 'VAT', NULL, '', '2025-06-23 14:17:28', NULL, NULL, NULL),
(18, 'THE ORIGIN SUITES', '2025', '12-08-25', 'Mango', '832110', '09693284411', 'saimashadmani1999@gmail.com', 'yjhfhhg', '', 'Jharkhand(20)', 'India', 'VAT', NULL, '', '2025-06-23 14:21:46', NULL, NULL, NULL),
(19, 'sssss', '2025', '12-08-25', 'Mango', '832110', '09693284411', 'saimashadmani1999@gmail.com', 'mndklasdf', '', 'Jharkhand(20)', 'India', 'VAT', NULL, '', '2025-06-23 14:25:52', NULL, NULL, NULL),
(20, 'THE ORIGIN SUITES', '2025', '12-08-25', 'Mango', '832110', '09693284411', 'saimashadmani1999@gmail.com', 'ajffgd', '', 'Jharkhand(20)', 'India', 'VAT', NULL, '', '2025-06-23 14:32:47', NULL, NULL, NULL),
(21, 'Saima Shadmani ', '2025', '12-08-25', 'Mango', '832110', '09693284411', 'saimashadmani1999@gmail.com', 'gfjhgfb', '', 'Jharkhand(20)', 'India', 'VAT', NULL, '', '2025-06-23 14:39:57', NULL, NULL, NULL),
(22, 'Saima Shadmani ', '2025', '12-08-25', 'Mango', '832110', '09693284411', 'saimashadmani1999@gmail.com', 'ghmbm', NULL, 'Jharkhand(20)', 'India', 'VAT', NULL, '', '2025-06-23 14:41:53', '5667887', NULL, NULL),
(23, 'Saima Shadmani', '2025', '12-08-25', 'Mango', '832110', '09693284411', 'saimashadmani1999@gmail.com', '43trefds', 'hjgkjhkjy87', 'Jharkhand(20)', 'India', 'GST', NULL, '', '2025-06-23 14:44:42', NULL, NULL, NULL),
(24, 'THE ORIGIN SUITES', '2025', '12-08-25', 'Mango', '832110', '09693284411', 'saimashadmani1999@gmail.com', 'wqqf', NULL, 'Jharkhand(20)', 'India', 'VAT', NULL, '', '2025-06-24 04:52:34', '1232fc', NULL, NULL),
(25, 'Saima', '2025', '12-08-25', 'Mango', '832110', '09693284411', 'saimashadmani1999@gmail.com', 'dfsgre4445fvv', NULL, 'Jharkhand(20)', 'India', 'VAT', NULL, '', '2025-06-24 05:21:31', '1232fc', NULL, NULL),
(26, 'THE ORIGIN SUITES', '2025', '12-08-25', 'Mango', '832110', '9693284411', 'saimashadmani1999@gmail.com', 'MCPPS0294D', NULL, 'Jharkhand(20)', 'India', 'VAT', NULL, '', '2025-06-24 07:02:15', '1234567', NULL, NULL),
(27, 'sheperelite', '2025', '2025', 'HSR', '560103', '9098197460', 'greenenergyintegrate@gmail.com', 'EDCPR5475D', NULL, 'Karnataka(29)', 'India', 'VAT', NULL, '', '2025-07-06 14:36:33', '12345678900', NULL, NULL),
(28, 'ABC Corp', '2024-25', '2024-04-01', 'Mumbai', '400001', '9876543210', 'abc@example.com', 'ABCDE1234F', '27ABCDE1234F1Z5', 'Maharashtra', 'India', 'GST', 1, 'vaultpass123', '2025-07-06 18:52:24', NULL, NULL, NULL),
(29, 'vanila pvt', '2025', '26', 'bengalore', '560076', '0909819746', 'xyzzz@gmail.com', 'EDCPR5475C', NULL, 'Kerala(32)', 'India', 'VAT', NULL, '123456789', '2025-07-06 18:59:18', '12345567890', NULL, NULL),
(30, 'ABC Corp', '2024-25', '2024-04-01', 'Mumbai', '400001', '9876543210', 'abc@example.com', 'ABCDE1234F', '27ABCDE1234F1Z5', 'Maharashtra', 'India', 'GST', 1, 'vaultpass123', '2025-07-06 19:10:21', NULL, NULL, NULL),
(31, 'vanila pvttt12', '2025', '26', 'bengalore', '560076', '0909819746', 'shaima@gmail.com', 'EDCPR5475C', NULL, 'Kerala(32)', 'India', 'VAT', NULL, '123456789', '2025-07-06 19:12:05', '12345567890', NULL, NULL),
(32, 'ABC Corp', '2024-25', '2024-04-01', 'Mumbai', '400001', '9876543210', 'abc@example.com', 'ABCDE1234F', '27ABCDE1234F1Z5', 'Maharashtra', 'India', 'GST', 6, 'vaultpass123', '2025-07-06 19:15:13', NULL, NULL, NULL),
(33, 'mama earth', '2025', '26', 'bengalore', '560076', '0909819746', 'xyzzz@gmail.com', 'EDCPR5475C', NULL, 'Manipur(14)', 'India', 'VAT', NULL, '123456789', '2025-07-06 19:45:25', '12345567890', NULL, NULL),
(34, 'mama earth', '2025', '26', 'bengalore', '560076', '9098197460', 'demo@gmail.com', 'EDCPR5475C', NULL, 'Karnataka(29)', 'India', 'VAT', 7, '123456789', '2025-07-17 09:01:07', '12345567890', NULL, NULL),
(35, 'mama earth', '2025', '26', 'bengalore', '560076', '9098197460', 'demo@gmail.com', 'EDCPR5475C', NULL, 'Madhya Pradesh(23)', 'India', 'VAT', 7, '123456789', '2025-07-17 09:44:56', '12345567890', NULL, NULL),
(36, 'THE ORIGIN SUITES', '2025', '12-08-25', 'Road Number', '832110', '9693284411', 'saimashadmani1999@gmail.com', 'ABCDE1234F', NULL, 'Maharashtra(27)', 'India', 'VAT', 12, NULL, '2025-08-12 17:53:09', '87454673672', NULL, NULL),
(37, 'Harley', '2025', '12-08-25', 'patna', '832110', '9693284411', 'saimashadmani1999@gmail.com', 'ABCDE1234F', NULL, 'Maharashtra(27)', 'India', 'VAT', 8, NULL, '2025-08-12 18:54:17', '87454673672', NULL, NULL),
(38, 'Delta', '2025', '12-08-25', 'mumbai', '832110', '1234567890', 'atiyashadmani@gmail.com', 'ABCDE1234F', NULL, 'Madhya Pradesh(23)', 'India', 'VAT', 10, NULL, '2025-08-12 19:28:45', '87454673672', NULL, NULL),
(39, 'om', '25-26', '01/04/2025', '', '', '', '', 'BDAPP6208H', '', 'Jharkhand(20)', 'India', 'GST', NULL, NULL, '2025-08-18 14:59:44', NULL, NULL, NULL),
(40, 'om', '25-26', '01/04/2025', '', '', '', '', 'BDAPP6208H', '', 'Jharkhand(20)', 'India', 'GST', NULL, NULL, '2025-08-18 14:59:44', NULL, NULL, NULL),
(41, 'om', '25-26', '01/04/2025', '', '', '', '', 'BDAPP6208H', '', 'Jharkhand(20)', 'India', 'GST', NULL, NULL, '2025-08-18 14:59:44', NULL, NULL, NULL),
(42, 'om', '25-26', '01/04/2025', '', '', '', '', 'BDAPP6208H', '', 'Jharkhand(20)', 'India', 'GST', NULL, NULL, '2025-08-18 14:59:45', NULL, NULL, NULL),
(43, 'om', '25-26', '01/04/2025', '', '', '', '', 'BDAPP6208H', '', 'Jharkhand(20)', 'India', 'GST', NULL, NULL, '2025-08-18 14:59:45', NULL, NULL, NULL),
(44, 'om', '25-26', '01/04/2025', '', '', '', '', 'BDAPP6208H', '', 'Jharkhand(20)', 'India', 'GST', NULL, NULL, '2025-08-18 14:59:45', NULL, NULL, NULL),
(45, 'om', '25-26', '01/04/2025', '', '', '', '', 'BDAPP6208H', '', 'Jharkhand(20)', 'India', 'GST', NULL, NULL, '2025-08-18 14:59:45', NULL, NULL, NULL),
(46, 'THE ORIGIN SUITES', '2025', '12-08-25', 'Jawaharnagar', '832110', '9693284411', 's1@gmail.com', 'ABCDE1234F', NULL, 'Maharashtra(27)', 'India', 'VAT', 16, NULL, '2025-09-03 19:28:39', '87454673672', NULL, NULL),
(47, 'tally1', '2022', '12-08-25', 'Mango', '832110', '9693284411', 'saimashadmani1999@gmail.com', 'ABCDE1234F', NULL, 'Karnataka(29)', 'India', 'VAT', 16, NULL, '2025-09-03 19:33:46', '87454673672', NULL, NULL),
(48, 'tally2', '2025', '12-08-25', 'Mango', '832110', '9693284411', 'saimashadmani1@gmail.com', 'ABCDE1234F', NULL, 'Jharkhand(20)', 'India', 'VAT', 16, NULL, '2025-09-03 19:49:03', '87454673672', NULL, NULL),
(49, 'tally4', '2025', '12-08-25', 'Mango', '832110', '9693284411', 'saimashadmani12@gmail.com', 'ABCDE1234F', NULL, 'Jharkhand(20)', 'India', 'VAT', 16, NULL, '2025-09-03 19:49:55', '87454673672', NULL, NULL),
(50, 'Ava', '2025', '2024', 'jamshedpur', '800014', '1234567890', 'vijay@gmail.com', 'EDCPR5476R', NULL, 'Madhya Pradesh(23)', 'India', 'VAT', 17, NULL, '2025-09-09 09:59:36', '12345678901', NULL, NULL),
(51, 'Flipkart', '2025', '12-08-25', 'Mango', '832110', '1234567890', 'saima12@gmail.com', 'ABCDE1234F', NULL, 'Jharkhand(20)', 'India', 'VAT', 17, NULL, '2025-09-09 17:45:30', '87454673672', 'accountant', '3');

-- --------------------------------------------------------

--
-- Table structure for table `tbemployees`
--

CREATE TABLE `tbemployees` (
  `id` int(11) NOT NULL,
  `firstName` varchar(100) DEFAULT NULL,
  `lastName` varchar(100) NOT NULL,
  `pan` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `companyName` varchar(100) NOT NULL,
  `phoneNumber` varchar(100) NOT NULL,
  `password` varchar(255) DEFAULT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `userLimit` int(11) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbemployees`
--

INSERT INTO `tbemployees` (`id`, `firstName`, `lastName`, `pan`, `email`, `companyName`, `phoneNumber`, `password`, `token`, `created_at`, `userLimit`) VALUES
(1, 'John', 'Doe', NULL, 'john@example.com', 'Test Co', '1234567890', 'secret123', '', '2025-07-06 14:03:07', 1),
(2, 'firstxyz', 'lastxyz', NULL, 'xyz@gmail.com', 'xyzcomapnyname', '1234567890', '123456', '', '2025-07-06 14:04:50', 1),
(4, 'xyzfinal', 'xyzlast', NULL, 'xyz1@gmail.com', 'xyzcomapnyname', '1234567890', '123456', '', '2025-07-06 14:10:33', 1),
(5, 'John', 'Doe', NULL, 'john@gmail.com', 'Test Co', '1234567890', '$2b$10$v0s6d0aaddC0drH3yNrymeIebbS6gLfn1oXrbbYz8sk/MH3UculwW', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImpvaG5AZ21haWwuY29tIiwiaWF0IjoxNzUxODI2MzYyLCJleHAiOjE3NTI0MzExNjJ9.e_AOCbSsDAUjW9ZsgQnHjtMQ01JbWrndcc2brvIL4bM', '2025-07-06 18:26:02', 1),
(6, 'xyz', 'xyzlst', NULL, 'xyzzz@gmail.com', 'xyzcompany', '1234567890', '$2b$10$sd0r3LdnhDhwKo0FGkuDhuoUZekeHl.1WNjxPTBzppZUX0lH9JW7K', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Inh5enp6QGdtYWlsLmNvbSIsImlhdCI6MTc1MTgyNjg0NywiZXhwIjoxNzUyNDMxNjQ3fQ.J-GPfuGqS_EUuuQ7Ub2BFgaZ6Wbas9buxRv9f9IH0YQ', '2025-07-06 18:34:07', 1),
(7, 'xyz', 'xyz', NULL, 'demo@gmail.com', 'xyzcompany', '1234567890', '$2b$10$oeZqe/BMv5u4lgb.Ne/v8uKGSXZM2Q6jtC9qWJwtitg/fo6ENNyT6', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImRlbW9AZ21haWwuY29tIiwiaWF0IjoxNzUyNzQyNzUyLCJleHAiOjE3NTMzNDc1NTJ9.ckvYMQ1M2QBQXE-mfo8PLUV8xYTcm8tb3SqfZ3ZqHb4', '2025-07-17 08:59:12', 1),
(8, 'Saima', 'Shadmani', NULL, 'saimashadmani1999@gmail.com', 'Enegix Global', '09693284411', '$2b$10$M4kDM4DC6FYADp1U.53eVOaFZO5CV/tVx04iBLS5uZWfLV2BTM1bu', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InNhaW1hc2hhZG1hbmkxOTk5QGdtYWlsLmNvbSIsImlhdCI6MTc1MzM4MTg4NSwiZXhwIjoxNzUzOTg2Njg1fQ.7C7sOgPoCl5mYrz79jm3txsxe62WZFQk5R1hLRmC4Uo', '2025-07-24 18:31:25', 1),
(9, 'Saima', 'Shadmani', NULL, 'saimashadmani12@gmail.com', 'Enegix', 'saimashadmani1999@gmail.com', '$2b$10$FMdQTZwViXQ3Y3Wt87hkBurHm1XjSEfBwNpEqb9zURKFnVrpOkwAi', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InNhaW1hc2hhZG1hbmkxMkBnbWFpbC5jb20iLCJpYXQiOjE3NTQ1NjYxNjAsImV4cCI6MTc1NTE3MDk2MH0.WIdL6hVklmBcxIUphg6KlYALHX1uHKe1TimwGUJZVUo', '2025-08-07 11:29:20', 1),
(10, 'Atiya', 'Shadmani', NULL, 'atiyashadmani@gmail.com', 'Delta', '1234567890', '$2b$10$IypRijcyVz0126WvpKYJBOcOzLSpFiRcBZPj.oglc2bSh8rUCqkdW', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImF0aXlhc2hhZG1hbmlAZ21haWwuY29tIiwiaWF0IjoxNzU1MDI2ODQ3LCJleHAiOjE3NTU2MzE2NDd9.DPgvsRHjX8n-9ndscH4GJpnA8qrsutciAD-efpqAkDk', '2025-08-12 19:27:26', 1),
(11, 'Vikky', 'Kumar', NULL, 'vikkykumarnv@gmail.com', 'Beta', '6201789796', '$2b$10$FU96o2aHySQCZb9uOxzeKuPOExxh3ARBwQiLzfa0u4HPBJxdahik6', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InZpa2t5a3VtYXJudkBnbWFpbC5jb20iLCJpYXQiOjE3NTUwNjQ5MzIsImV4cCI6MTc1NTY2OTczMn0.rcQ8vvywoQYx0t5ltN46x94GCD5qFrJBXCQW57xFJVU', '2025-08-13 06:02:13', 1),
(12, 'vikky', 'kumar', NULL, 'example@gmail.com', 'enegix', '6201789796', '$2b$10$N2/PsQ8fOMRhK5SqSCd5m.rMPCnrgmqYWZcugk9rqqa6sjxoMPHEm', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImV4YW1wbGVAZ21haWwuY29tIiwiaWF0IjoxNzU1MjU1Nzg1LCJleHAiOjE3NTU4NjA1ODV9.o_OrsOQmf_RZG1VyZw-zR0OwxSydpDNWmzWFt8DhGKo', '2025-08-15 11:03:05', 1),
(13, 'shaa', 'kha', NULL, 'sha@gmail.com', 'shad pvt ltd', '90981', '$2b$10$WnWwtn4odD19hBSk1HTWUOlLOMT38.2kYzDm4XqEiMMBPIkfXNWwO', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InNoYUBnbWFpbC5jb20iLCJpYXQiOjE3NTY3NDY4ODUsImV4cCI6MTc1NzM1MTY4NX0.darJyIrx3kFUjoFHZ3UI0qOgV9S9MTwuq7LkaY7ovHE', '2025-09-01 17:14:46', 1),
(14, 'surya', 'kumar', NULL, 'suryakumar@gmail.com', 'surya', '1234567890', '$2b$10$wRwg1jBottDP5aAyUvmMLec8UmlkjWSviAA5aKyVgbHRIzJp7wnRW', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InN1cnlha3VtYXJAZ21haWwuY29tIiwiaWF0IjoxNzU2OTAzMzEzLCJleHAiOjE3NTc1MDgxMTN9.Fj8nt8WuhRV_rFt1RylwE-0XoIOrYnhlH3Q2t1p9jXc', '2025-09-03 12:41:54', 1),
(15, 'shubham', 'kumar', NULL, 'shubham@gmail.com', 'shubhampvt ltd', '1234567890', '$2b$10$jSysBn5G4pmRixAtyKI68ecBKWhphJxceFlPr2IxJz6233ujVRrB6', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InNodWJoYW1AZ21haWwuY29tIiwiaWF0IjoxNzU2OTAzNzUxLCJleHAiOjE3NTc1MDg1NTF9.GqknKxB_peYEj67-ofUqvdaQqCedvxCnBhWHvnX8-O4', '2025-09-03 12:49:12', 1),
(16, 'Saima', 'Shadmani', NULL, 'saimashadmanitest1@gmail.com', '', '09693284411', '$2b$10$4v4J4g3K9bu1I0YxgA4pk.XnWaMdlNyaAhxiWkdoTyQFuOf9SSSB6', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InNhaW1hc2hhZG1hbml0ZXN0MUBnbWFpbC5jb20iLCJpYXQiOjE3NTY5MjM0MzYsImV4cCI6MTc1NzUyODIzNn0.wP0Bme45lO2pGfV799W-aixhEAC6ZE3EBPtrJhGWQKw', '2025-09-03 18:17:16', 4),
(17, 'vijay', 'karmakar', NULL, 'vijay@gmail.com', '', '1234567890', '$2b$10$pEv5JBH50mDOdlejd/Rd0ua8X6sUUP2WPyz5KIUHbgSp1O/RuWSu.', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InZpamF5QGdtYWlsLmNvbSIsImlhdCI6MTc1NzQwODk1NiwiZXhwIjoxNzU4MDEzNzU2fQ.tqL2WwiPrs01ikziphYDU6LhN7_nmUVRWcrpvQPU2VA', '2025-09-09 09:09:16', 2);

-- --------------------------------------------------------

--
-- Table structure for table `tbgstr3breturns`
--

CREATE TABLE `tbgstr3breturns` (
  `id` int(11) NOT NULL,
  `employeeId` int(11) DEFAULT NULL,
  `gstin` varchar(20) DEFAULT NULL,
  `returnPeriod` varchar(20) DEFAULT NULL,
  `outwardSupplies` decimal(10,2) DEFAULT NULL,
  `interstateSupplies` decimal(10,2) DEFAULT NULL,
  `otherOutwardSupplies` decimal(10,2) DEFAULT NULL,
  `nilRatedSupplies` decimal(10,2) DEFAULT NULL,
  `inwardReverseCharge` decimal(10,2) DEFAULT NULL,
  `nonGstSupplies` decimal(10,2) DEFAULT NULL,
  `inputTaxCreditEligible` decimal(10,2) DEFAULT NULL,
  `inputTaxCreditIneligible` decimal(10,2) DEFAULT NULL,
  `interestLateFees` decimal(10,2) DEFAULT NULL,
  `taxPayable` decimal(10,2) DEFAULT NULL,
  `taxPaid` decimal(10,2) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbgstr3breturns`
--

INSERT INTO `tbgstr3breturns` (`id`, `employeeId`, `gstin`, `returnPeriod`, `outwardSupplies`, `interstateSupplies`, `otherOutwardSupplies`, `nilRatedSupplies`, `inwardReverseCharge`, `nonGstSupplies`, `inputTaxCreditEligible`, `inputTaxCreditIneligible`, `interestLateFees`, `taxPayable`, `taxPaid`, `createdAt`) VALUES
(1, 8, 'STDRYB', '{\"month\":\"07\",\"year\"', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, '2025-07-28 13:45:06');

-- --------------------------------------------------------

--
-- Table structure for table `tbgstregistrations`
--

CREATE TABLE `tbgstregistrations` (
  `id` int(11) NOT NULL,
  `state` varchar(100) DEFAULT NULL,
  `registrationType` varchar(100) DEFAULT NULL,
  `assesseeOfOtherTerritory` enum('yes','no') DEFAULT 'no',
  `gstNumber` varchar(30) DEFAULT NULL,
  `periodicityOfGstr1` varchar(50) DEFAULT NULL,
  `gstApplicableFrom` date DEFAULT NULL,
  `eWayBillApplicable` enum('yes','no') DEFAULT 'no',
  `eWayBillThresholdLimit` decimal(12,2) DEFAULT 0.00,
  `eWayBillIntrastate` enum('yes','no') DEFAULT 'no',
  `provideLutBond` enum('yes','no') DEFAULT 'no',
  `lutBondNumber` varchar(50) DEFAULT NULL,
  `lutBondValidity` date DEFAULT NULL,
  `taxLiabilityOnAdvanceReceipts` enum('yes','no') DEFAULT 'no',
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbgstregistrations`
--

INSERT INTO `tbgstregistrations` (`id`, `state`, `registrationType`, `assesseeOfOtherTerritory`, `gstNumber`, `periodicityOfGstr1`, `gstApplicableFrom`, `eWayBillApplicable`, `eWayBillThresholdLimit`, `eWayBillIntrastate`, `provideLutBond`, `lutBondNumber`, `lutBondValidity`, `taxLiabilityOnAdvanceReceipts`, `createdAt`) VALUES
(1, '04-chandigarh', 'regular', 'yes', '74333333333', 'quarterly', '2025-07-21', 'yes', 12.00, 'yes', 'yes', '2424', '2025-07-29', 'yes', '2025-07-27 19:57:00');

-- --------------------------------------------------------

--
-- Table structure for table `tbPermissions`
--

CREATE TABLE `tbPermissions` (
  `permission_id` int(11) NOT NULL,
  `permission_name` varchar(50) NOT NULL,
  `description` text DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `tbPermissions`
--

INSERT INTO `tbPermissions` (`permission_id`, `permission_name`, `description`) VALUES
(1, 'view', 'View records or details'),
(2, 'create', 'Create/add new records'),
(3, 'edit', 'Edit or update records'),
(4, 'delete', 'Delete records'),
(5, 'export', 'Export or download data'),
(6, 'approve', 'Approve or authorize actions'),
(7, 'schedule', 'Schedule reports or tasks'),
(8, 'configure', 'Access to configuration or settings'),
(9, 'suspend', 'Suspend user or record'),
(10, 'restore', 'Restore or reactivate record'),
(11, 'admin', 'Full administrative privilege');

-- --------------------------------------------------------

--
-- Table structure for table `tbRolePermissions`
--

CREATE TABLE `tbRolePermissions` (
  `role_id` int(11) NOT NULL,
  `screen_id` int(11) NOT NULL,
  `permission_id` int(11) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `tbRolePermissions`
--

INSERT INTO `tbRolePermissions` (`role_id`, `screen_id`, `permission_id`) VALUES
(1, 1, 1),
(1, 1, 2),
(1, 1, 3),
(1, 1, 4),
(1, 2, 1),
(1, 2, 2),
(1, 2, 3),
(1, 2, 4),
(2, 2, 1),
(2, 2, 2),
(2, 2, 3),
(2, 4, 1),
(2, 4, 2),
(2, 4, 3),
(2, 4, 4),
(5, 1, 1),
(5, 1, 2),
(5, 1, 3),
(5, 1, 5),
(5, 1, 6),
(5, 1, 11),
(5, 2, 1),
(5, 3, 1),
(5, 3, 4),
(5, 4, 1),
(5, 4, 2),
(5, 4, 3),
(5, 4, 4),
(5, 5, 1),
(5, 5, 3),
(7, 1, 1),
(7, 1, 2),
(7, 1, 3),
(7, 1, 4),
(7, 1, 5),
(7, 1, 6),
(7, 1, 7),
(7, 1, 8),
(7, 1, 9),
(7, 1, 10),
(7, 1, 11),
(7, 2, 1),
(7, 3, 1),
(7, 4, 1),
(7, 5, 1),
(7, 6, 1),
(7, 7, 1),
(7, 7, 2),
(7, 8, 1),
(7, 8, 2),
(8, 1, 1),
(8, 1, 2),
(8, 1, 3),
(8, 2, 1),
(8, 2, 3),
(8, 3, 1),
(8, 4, 1),
(8, 4, 2),
(8, 5, 1);

-- --------------------------------------------------------

--
-- Table structure for table `tbRoles`
--

CREATE TABLE `tbRoles` (
  `role_id` int(11) NOT NULL,
  `role_name` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `is_system` tinyint(4) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `tbRoles`
--

INSERT INTO `tbRoles` (`role_id`, `role_name`, `description`, `is_system`, `created_at`, `updated_at`) VALUES
(1, 'Admin', 'Full system admin', 0, '2025-08-07 08:03:46', '2025-08-07 08:03:46'),
(2, 'Manager', 'Department manager', 0, '2025-08-07 08:03:46', '2025-08-07 08:03:46'),
(3, 'User', 'Normal user', 0, '2025-08-07 08:03:46', '2025-08-07 08:03:46'),
(4, 'Viewer', 'Read-only', 0, '2025-08-07 08:03:46', '2025-08-07 08:03:46'),
(5, 'HR', 'HR', 0, '2025-08-07 08:25:01', '2025-08-07 08:25:01'),
(7, 'Test', 'testing', 0, '2025-09-01 16:43:57', '2025-09-01 16:43:57'),
(8, 'tester', 'testing', 0, '2025-09-02 08:57:48', '2025-09-02 08:57:48');

-- --------------------------------------------------------

--
-- Table structure for table `tbScreens`
--

CREATE TABLE `tbScreens` (
  `screen_id` int(11) NOT NULL,
  `screen_name` varchar(100) NOT NULL,
  `screen_path` varchar(255) DEFAULT NULL,
  `parent_id` int(11) DEFAULT NULL,
  `sort_order` int(11) DEFAULT 0
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `tbScreens`
--

INSERT INTO `tbScreens` (`screen_id`, `screen_name`, `screen_path`, `parent_id`, `sort_order`) VALUES
(1, 'Masters', '/app/masters', NULL, 0),
(2, 'Vouchers', '/app/vouchers', NULL, 0),
(3, 'Reports', '/app/reports', NULL, 0),
(4, 'Ledger', '/app/masters/ledgers', 1, 0),
(5, 'Group', '/app/masters/groups', 1, 0),
(6, 'Budget', '/app/masters/budgets', 1, 0),
(7, 'Currency', '/app/masters/currencies', 1, 0),
(8, 'Cost Center', '/app/masters/costcenters', 1, 0),
(9, 'Stock Category', '/app/masters/stock-categories', 1, 0),
(10, 'Stock Item', '/app/masters/stock-items', 1, 0),
(11, 'Batch', '/app/masters/batches', 1, 0),
(12, 'Stock Group', '/app/masters/stock-groups', 1, 0),
(13, 'Unit', '/app/masters/units', 1, 0),
(14, 'Godown', '/app/masters/godowns', 1, 0),
(15, 'Scenario', '/app/masters/scenarios', 1, 0),
(16, 'Payment Voucher', '/app/vouchers/payment', 2, 0),
(17, 'Contra Voucher', '/app/vouchers/contra', 2, 0),
(18, 'Credit Note', '/app/vouchers/creditnote', 2, 0),
(19, 'Debit Note', '/app/vouchers/debitnote', 2, 0),
(20, 'Delivery Note', '/app/vouchers/deliverynote', 2, 0),
(21, 'Journal Voucher', '/app/vouchers/journal', 2, 0),
(22, 'Sales Voucher', '/app/vouchers/sales', 2, 0),
(23, 'Purchase Voucher', '/app/vouchers/purchase', 2, 0),
(24, 'Receipt Voucher', '/app/vouchers/receipt', 2, 0),
(25, 'Stock Journal', '/app/vouchers/stockjournal', 2, 0),
(26, 'Day Book', '/app/reports/daybook', 3, 0),
(27, 'Ledger Report', '/app/reports/ledgerreport', 3, 0),
(28, 'Trial Balance', '/app/reports/trialbalance', 3, 0),
(29, 'Profit & Loss', '/app/reports/profitloss', 3, 0),
(30, 'Balance Sheet', '/app/reports/balancesheet', 3, 0);

-- --------------------------------------------------------

--
-- Table structure for table `tbScreens_old`
--

CREATE TABLE `tbScreens_old` (
  `screen_id` int(11) NOT NULL,
  `screen_name` varchar(100) NOT NULL,
  `screen_path` varchar(255) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `tbScreens_old`
--

INSERT INTO `tbScreens_old` (`screen_id`, `screen_name`, `screen_path`) VALUES
(1, 'Dashboard', '/dashboard'),
(2, 'Masters', '/users'),
(3, 'Vouchers', '/products'),
(4, 'Reports', '/orders'),
(5, 'Audit', '/reports'),
(6, 'TDS', '/financials'),
(7, 'Configuration', '/profile'),
(8, 'User Management', '/logs');

-- --------------------------------------------------------

--
-- Table structure for table `tbUserRoles`
--

CREATE TABLE `tbUserRoles` (
  `user_id` int(11) NOT NULL,
  `role_id` int(11) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `tbUserRoles`
--

INSERT INTO `tbUserRoles` (`user_id`, `role_id`) VALUES
(1, 1),
(1, 2),
(12, 2),
(14, 1),
(15, 3),
(21, 7),
(22, 5),
(23, 5),
(24, 5),
(26, 5),
(27, 5),
(28, 2);

-- --------------------------------------------------------

--
-- Table structure for table `tbUsers`
--

CREATE TABLE `tbUsers` (
  `id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `role_id` int(50) NOT NULL,
  `employee_id` int(50) NOT NULL,
  `email` varchar(250) NOT NULL,
  `username` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `phone` varchar(20) DEFAULT NULL,
  `department` varchar(100) DEFAULT NULL,
  `status` enum('active','inactive','suspended') DEFAULT 'active',
  `last_login` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbUsers`
--

INSERT INTO `tbUsers` (`id`, `company_id`, `role_id`, `employee_id`, `email`, `username`, `password`, `created_at`, `phone`, `department`, `status`, `last_login`) VALUES
(1, 28, 0, 1, '', 'admin', '$2b$10$IfdLA9MX6fHUM40JfCG/q.rSrNWexwCKdYNNSASNLVJztlnyJHnMO', '2025-07-06 18:52:24', NULL, NULL, 'active', '0000-00-00 00:00:00'),
(4, 31, 0, 4, '', 'shaima', '$2b$10$k/m3WXiDXtp.GWyrPgmcZuTc26MU3zo1bU4P/ifY4ynIV/E7E4Feq', '2025-07-06 19:12:05', NULL, NULL, 'active', '0000-00-00 00:00:00'),
(5, 32, 0, 5, '', 'admin', '$2b$10$p3b.TDeHoxIK0kK7tDzuIuxCYZ/fYg/rgvclppNboSkwBJhqwgLlG', '2025-07-06 19:15:13', NULL, NULL, 'active', '0000-00-00 00:00:00'),
(6, 33, 0, 6, '', 'shaima', '$2b$10$8iOJ9O8FcZWE3m1L7XOPX./ApfF15BWrhDJiUNtipHljlLTQJ2H12', '2025-07-06 19:45:25', NULL, NULL, 'active', '0000-00-00 00:00:00'),
(7, 0, 0, 8, 'saimashadmani1999@gmail.com', '', '$2b$10$Jxz9/anRFoo0KQXRqQVmI.L.iwNsvjNQa1yOSPxKrmee07PwYT3/W', '2025-08-07 19:38:06', NULL, NULL, 'active', '0000-00-00 00:00:00'),
(8, 0, 0, 8, 'saimashad@gmail.com', '', '$2b$10$XSb6x0I77zSZxwUpDPiVYOlg6YlqiF8duKpJORcLSuuuHEJp5HoZ6', '2025-08-07 19:41:38', NULL, NULL, 'active', '0000-00-00 00:00:00'),
(9, 0, 0, 8, 'saimashadmani@gmail.com', '', '$2b$10$zJMkL.faBNaJn8N4Sx1YcO44PdB7zssDmB7BP8mDPoP53W5nyva2W', '2025-08-07 19:57:40', NULL, NULL, 'active', '0000-00-00 00:00:00'),
(10, 0, 0, 8, 'saima123@gmail.com', '', '$2b$10$Iq4R8JHKlnWJ6JSh13nvp.QNXHyXh9baHDYh1hL5mFf8vCQ/m7Gda', '2025-08-08 17:58:50', NULL, NULL, 'active', '0000-00-00 00:00:00'),
(12, 0, 0, 8, 'saimashadmaniiii@gmail.com', '', '$2b$10$v0cvss9AzVtJx8KtJ0VwReeyp5THzzo8U0azluE925x.oure35ly2', '2025-08-08 18:27:04', NULL, NULL, 'active', '0000-00-00 00:00:00'),
(13, 0, 0, 10, 'jafar@gmail.com', 'jafar', '$2b$10$OvnuEIAeCib5om2U5y8ZPOoaqS6oLpUKCExP1xQiGH5RrDpbrEowC', '2025-08-13 19:33:46', '9693284411', 'IT', 'active', '0000-00-00 00:00:00'),
(14, 0, 0, 10, 'saimashadmani11@gmail.com', 'Saima Shadmani', '$2b$10$MjSskd5LLZnJdBSN4rTFne/DwXTGceDUkQo2jNBDSW1xMQk..xKtS', '2025-08-13 20:57:38', '+919693284411', 'uu', 'active', '0000-00-00 00:00:00'),
(15, 0, 0, 7, 'saimashad12@gmail.com', 'saimashaadmani', '$2b$10$5KriAH4iTInvbg9HFMyKs.PgDpcLAxChL/I2DNOyXM1n2JRhqCcKW', '2025-08-24 12:41:33', '+911234567890', 'IT', 'active', '0000-00-00 00:00:00'),
(21, 0, 0, 10, 'demo@gmail.com', 'demo', '$2b$10$MMeTAo9OGf72ldRlTTQB2eAL6zRCSdpUez50M.nKcq8dTxlBxCu.C', '2025-09-01 17:01:23', '+1234567890', 'IT', 'active', '0000-00-00 00:00:00'),
(22, 0, 0, 10, 'sha@gmail.com', 'sha', '$2b$10$Y0gWpbPjmeFqcQWstO2/s.xzxtgCBvfu0sF0EKEtYSDNZdrq28WTC', '2025-09-01 18:08:42', '+911234567890', 'Management', 'active', '0000-00-00 00:00:00'),
(23, 0, 0, 10, 'saimashadmani786@gmail.com', 'Saima Shadmani', '$2b$10$IYjK5RUoZJH8mDivZru4/uD1XIpHuGsbi/Hl7fo9ABmCtpmTx.vbG', '2025-09-01 19:15:02', '+919693284411', 'it', 'active', '0000-00-00 00:00:00'),
(24, 0, 0, 10, 'john@gmail.com', 'sshaima1', '$2b$10$XAiYRuBqA0kBA8N6N8aJwOmHXwOiqsgbf/2rP89RkLt40gOGN5YEu', '2025-09-01 19:23:40', '1234567890', 'It', 'active', '0000-00-00 00:00:00'),
(25, 38, 5, 10, 'saimas1999@gmail.com', 'Saima Shadmani', '$2b$10$lcRROLz8X1rAR16Hu0FL.e8.DkziAZBcr7Cz.QRLuFD04pIG1DGZq', '2025-09-01 19:36:58', '+919693284411', 'ioi', 'active', '0000-00-00 00:00:00'),
(26, 38, 5, 10, 'saimas786@gmail.com', 'Saima Shadmani', '$2b$10$qoDGD9RBfJ8af4KB8JSUAO1i4U0LFziEGPucVeW4mG6KV.ChhN7m.', '2025-09-01 19:37:46', '+919693284411', 'ioi', 'active', '0000-00-00 00:00:00'),
(27, 38, 5, 10, 'xyz1@gmail.com', 'xyz', '$2b$10$eSSEHgjTlX6Rws3mDrdDsebrNtKsWBDPQGSguBNFrM3iDsXt.iucW', '2025-09-01 19:40:55', '+911234567890', 'IT', 'active', '0000-00-00 00:00:00'),
(28, 38, 2, 10, 'saimamanager@gmail.com', 'saima', '$2b$10$RcMl1IGruwCWk34pfZoXGOFFKXV/3F0KKSOEVmuFWn8CuLQcR/Fdq', '2025-09-02 18:47:43', '+919693284411', 'sd', 'active', '0000-00-00 00:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `tcs_27eq_challans`
--

CREATE TABLE `tcs_27eq_challans` (
  `id` int(11) NOT NULL,
  `return_id` int(11) NOT NULL,
  `serial_no` int(11) NOT NULL,
  `bsr_code` varchar(20) DEFAULT NULL,
  `date_of_deposit` date NOT NULL,
  `challan_serial_no` varchar(50) DEFAULT NULL,
  `tax` decimal(15,2) DEFAULT 0.00,
  `surcharge` decimal(15,2) DEFAULT 0.00,
  `education_cess` decimal(15,2) DEFAULT 0.00,
  `interest` decimal(15,2) DEFAULT 0.00,
  `fee` decimal(15,2) DEFAULT 0.00,
  `total` decimal(15,2) DEFAULT 0.00,
  `minor_head` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tcs_27eq_challans`
--

INSERT INTO `tcs_27eq_challans` (`id`, `return_id`, `serial_no`, `bsr_code`, `date_of_deposit`, `challan_serial_no`, `tax`, `surcharge`, `education_cess`, `interest`, `fee`, `total`, `minor_head`) VALUES
(1, 1, 1, '', '2025-07-29', '', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, ''),
(2, 2, 1, '', '0000-00-00', '', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, '');

-- --------------------------------------------------------

--
-- Table structure for table `tcs_27eq_collectees`
--

CREATE TABLE `tcs_27eq_collectees` (
  `id` int(11) NOT NULL,
  `return_id` int(11) NOT NULL,
  `serial_no` int(11) NOT NULL,
  `pan_of_collectee` varchar(20) DEFAULT NULL,
  `name_of_collectee` varchar(255) DEFAULT NULL,
  `amount_paid` decimal(15,2) DEFAULT 0.00,
  `tax_collected` decimal(15,2) DEFAULT 0.00,
  `tax_deposited` decimal(15,2) DEFAULT 0.00,
  `date_of_collection` date DEFAULT NULL,
  `section_code` varchar(20) DEFAULT NULL,
  `rate_of_collection` decimal(5,2) DEFAULT 0.00,
  `remark_code` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tcs_27eq_collectees`
--

INSERT INTO `tcs_27eq_collectees` (`id`, `return_id`, `serial_no`, `pan_of_collectee`, `name_of_collectee`, `amount_paid`, `tax_collected`, `tax_deposited`, `date_of_collection`, `section_code`, `rate_of_collection`, `remark_code`) VALUES
(1, 1, 1, '', '', 0.00, 0.00, 0.00, '2025-07-29', '206C1', 0.00, ''),
(2, 2, 1, '', '', 0.00, 0.00, 0.00, '0000-00-00', '206C1', 0.00, '');

-- --------------------------------------------------------

--
-- Table structure for table `tcs_27eq_returns`
--

CREATE TABLE `tcs_27eq_returns` (
  `id` int(11) NOT NULL,
  `tan` varchar(20) NOT NULL,
  `financial_year` varchar(10) NOT NULL,
  `quarter` varchar(5) DEFAULT NULL,
  `pan_of_collector` varchar(20) NOT NULL,
  `type_of_collector` varchar(50) NOT NULL,
  `collector_name` varchar(255) NOT NULL,
  `flat_no` varchar(100) DEFAULT NULL,
  `premises_name` varchar(255) DEFAULT NULL,
  `road_street` varchar(255) DEFAULT NULL,
  `area` varchar(255) DEFAULT NULL,
  `town` varchar(255) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `pin_code` varchar(20) DEFAULT NULL,
  `mobile_no` varchar(20) DEFAULT NULL,
  `alternate_mobile` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `alternate_email` varchar(100) DEFAULT NULL,
  `responsible_person_name` varchar(255) NOT NULL,
  `responsible_person_pan` varchar(20) DEFAULT NULL,
  `responsible_person_designation` varchar(100) DEFAULT NULL,
  `responsible_person_flat_no` varchar(100) DEFAULT NULL,
  `responsible_person_premises_name` varchar(255) DEFAULT NULL,
  `responsible_person_road_street` varchar(255) DEFAULT NULL,
  `responsible_person_area` varchar(255) DEFAULT NULL,
  `responsible_person_town` varchar(255) DEFAULT NULL,
  `responsible_person_state` varchar(100) DEFAULT NULL,
  `responsible_person_pin_code` varchar(20) DEFAULT NULL,
  `responsible_person_mobile_no` varchar(20) DEFAULT NULL,
  `responsible_person_alternate_mobile` varchar(20) DEFAULT NULL,
  `responsible_person_email` varchar(100) DEFAULT NULL,
  `verification_capacity` enum('Collector','Authorized Representative') NOT NULL,
  `verification_place` varchar(100) NOT NULL,
  `verification_date` date NOT NULL,
  `verification_full_name` varchar(255) NOT NULL,
  `verification_designation` varchar(100) NOT NULL,
  `verification_signature` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tcs_27eq_returns`
--

INSERT INTO `tcs_27eq_returns` (`id`, `tan`, `financial_year`, `quarter`, `pan_of_collector`, `type_of_collector`, `collector_name`, `flat_no`, `premises_name`, `road_street`, `area`, `town`, `state`, `pin_code`, `mobile_no`, `alternate_mobile`, `email`, `alternate_email`, `responsible_person_name`, `responsible_person_pan`, `responsible_person_designation`, `responsible_person_flat_no`, `responsible_person_premises_name`, `responsible_person_road_street`, `responsible_person_area`, `responsible_person_town`, `responsible_person_state`, `responsible_person_pin_code`, `responsible_person_mobile_no`, `responsible_person_alternate_mobile`, `responsible_person_email`, `verification_capacity`, `verification_place`, `verification_date`, `verification_full_name`, `verification_designation`, `verification_signature`, `created_at`) VALUES
(1, 'ABCD12345E', '2024-25', NULL, 'PANNOTREQD', 'Company', 'saimmaaa', '', '', '', '', '', '', '', '09693284411', '', 'saimashadmani1999@gmail.com', '', 'Saima Shadmani', '', NULL, '', '', '', '', '', '', '', '09693284411', '', NULL, 'Collector', 'HHGF', '2025-07-30', 'Saima Shadmani', 'Full Stack Developer', '', '2025-07-29 11:12:23'),
(2, '', '2024-25', NULL, 'PANNOTREQD', 'Company', '', '', '', '', '', '', '', '', '', '', '', '', '', '', NULL, '', '', '', '', '', '', '', '', '', NULL, 'Collector', '', '0000-00-00', '', '', '', '2025-08-18 04:57:00');

-- --------------------------------------------------------

--
-- Table structure for table `tcs_27q_challans`
--

CREATE TABLE `tcs_27q_challans` (
  `id` int(11) NOT NULL,
  `return_id` int(11) NOT NULL,
  `serial_no` int(11) NOT NULL,
  `bsr_code` varchar(20) DEFAULT NULL,
  `date_of_deposit` date NOT NULL,
  `challan_serial_no` varchar(50) DEFAULT NULL,
  `tax` decimal(15,2) DEFAULT 0.00,
  `surcharge` decimal(15,2) DEFAULT 0.00,
  `education_cess` decimal(15,2) DEFAULT 0.00,
  `interest` decimal(15,2) DEFAULT 0.00,
  `fee` decimal(15,2) DEFAULT 0.00,
  `total` decimal(15,2) DEFAULT 0.00,
  `minor_head` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tcs_27q_challans`
--

INSERT INTO `tcs_27q_challans` (`id`, `return_id`, `serial_no`, `bsr_code`, `date_of_deposit`, `challan_serial_no`, `tax`, `surcharge`, `education_cess`, `interest`, `fee`, `total`, `minor_head`) VALUES
(1, 1, 1, '', '2025-07-29', '', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, '');

-- --------------------------------------------------------

--
-- Table structure for table `tcs_27q_collectees`
--

CREATE TABLE `tcs_27q_collectees` (
  `id` int(11) NOT NULL,
  `return_id` int(11) NOT NULL,
  `serial_no` int(11) NOT NULL,
  `pan_of_collectee` varchar(20) DEFAULT NULL,
  `name_of_collectee` varchar(255) DEFAULT NULL,
  `amount_paid` decimal(15,2) DEFAULT 0.00,
  `tax_collected` decimal(15,2) DEFAULT 0.00,
  `tax_deposited` decimal(15,2) DEFAULT 0.00,
  `date_of_collection` date DEFAULT NULL,
  `section_code` varchar(20) DEFAULT NULL,
  `rate_of_collection` decimal(5,2) DEFAULT 0.00,
  `remark_code` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tcs_27q_collectees`
--

INSERT INTO `tcs_27q_collectees` (`id`, `return_id`, `serial_no`, `pan_of_collectee`, `name_of_collectee`, `amount_paid`, `tax_collected`, `tax_deposited`, `date_of_collection`, `section_code`, `rate_of_collection`, `remark_code`) VALUES
(1, 1, 1, '', '', 0.00, 0.00, 0.00, '2025-07-29', '206C1', 0.00, '');

-- --------------------------------------------------------

--
-- Table structure for table `tcs_27q_returns`
--

CREATE TABLE `tcs_27q_returns` (
  `id` int(11) NOT NULL,
  `tan` varchar(20) NOT NULL,
  `financial_year` varchar(10) NOT NULL,
  `quarter` varchar(5) NOT NULL,
  `pan_of_collector` varchar(20) NOT NULL,
  `type_of_collector` varchar(50) NOT NULL,
  `collector_name` varchar(255) NOT NULL,
  `flat_no` varchar(100) DEFAULT NULL,
  `premises_name` varchar(255) DEFAULT NULL,
  `road_street` varchar(255) DEFAULT NULL,
  `area` varchar(255) DEFAULT NULL,
  `town` varchar(255) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `pin_code` varchar(20) DEFAULT NULL,
  `mobile_no` varchar(20) DEFAULT NULL,
  `alternate_mobile` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `alternate_email` varchar(100) DEFAULT NULL,
  `responsible_person_name` varchar(255) NOT NULL,
  `responsible_person_pan` varchar(20) DEFAULT NULL,
  `responsible_person_designation` varchar(100) DEFAULT NULL,
  `responsible_person_flat_no` varchar(100) DEFAULT NULL,
  `responsible_person_premises_name` varchar(255) DEFAULT NULL,
  `responsible_person_road_street` varchar(255) DEFAULT NULL,
  `responsible_person_area` varchar(255) DEFAULT NULL,
  `responsible_person_town` varchar(255) DEFAULT NULL,
  `responsible_person_state` varchar(100) DEFAULT NULL,
  `responsible_person_pin_code` varchar(20) DEFAULT NULL,
  `responsible_person_mobile_no` varchar(20) DEFAULT NULL,
  `responsible_person_alternate_mobile` varchar(20) DEFAULT NULL,
  `responsible_person_email` varchar(100) DEFAULT NULL,
  `verification_capacity` enum('Collector','Authorized Representative') NOT NULL,
  `verification_place` varchar(100) NOT NULL,
  `verification_date` date NOT NULL,
  `verification_full_name` varchar(255) NOT NULL,
  `verification_designation` varchar(100) NOT NULL,
  `verification_signature` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tcs_27q_returns`
--

INSERT INTO `tcs_27q_returns` (`id`, `tan`, `financial_year`, `quarter`, `pan_of_collector`, `type_of_collector`, `collector_name`, `flat_no`, `premises_name`, `road_street`, `area`, `town`, `state`, `pin_code`, `mobile_no`, `alternate_mobile`, `email`, `alternate_email`, `responsible_person_name`, `responsible_person_pan`, `responsible_person_designation`, `responsible_person_flat_no`, `responsible_person_premises_name`, `responsible_person_road_street`, `responsible_person_area`, `responsible_person_town`, `responsible_person_state`, `responsible_person_pin_code`, `responsible_person_mobile_no`, `responsible_person_alternate_mobile`, `responsible_person_email`, `verification_capacity`, `verification_place`, `verification_date`, `verification_full_name`, `verification_designation`, `verification_signature`, `created_at`) VALUES
(1, 'ABCD12345E', '2024-25', 'Q3', 'PANNOTREQD', 'Company', 'saimmaaa', '', '', 'Jawaharnagar', 'mango', 'Dhanbad', 'Jharkhand', '832110', '09693284411', '', 'saimashadmani1999@gmail.com', 'saimashadmani1999@gmail.com', '', '', '', '', '', '', '', '', '', '', '09693284411', '', '', 'Collector', 'HHGF', '2025-07-30', 'Saima Shadmani', 'Full Stack Developer', '', '2025-07-29 10:18:56');

-- --------------------------------------------------------

--
-- Table structure for table `tds_24q_employee_salary_details`
--

CREATE TABLE `tds_24q_employee_salary_details` (
  `id` int(11) NOT NULL,
  `return_id` int(11) NOT NULL,
  `sr_no` int(11) NOT NULL,
  `name_of_employee` varchar(255) NOT NULL,
  `pan_of_employee` varchar(20) NOT NULL,
  `employee_reference_no` varchar(100) DEFAULT NULL,
  `address_of_employee` text DEFAULT NULL,
  `amount_of_salary_paid` decimal(15,2) NOT NULL,
  `tax_deducted` decimal(15,2) NOT NULL,
  `date_of_payment` date NOT NULL,
  `period_of_payment` varchar(50) DEFAULT NULL,
  `nature_of_payment` varchar(255) DEFAULT NULL,
  `section_under_which_deducted` varchar(20) NOT NULL,
  `rate_of_tds` decimal(5,2) NOT NULL,
  `certificate_no` varchar(100) DEFAULT NULL,
  `quarter_in_which_amount_paid` varchar(10) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tds_24q_employee_salary_details`
--

INSERT INTO `tds_24q_employee_salary_details` (`id`, `return_id`, `sr_no`, `name_of_employee`, `pan_of_employee`, `employee_reference_no`, `address_of_employee`, `amount_of_salary_paid`, `tax_deducted`, `date_of_payment`, `period_of_payment`, `nature_of_payment`, `section_under_which_deducted`, `rate_of_tds`, `certificate_no`, `quarter_in_which_amount_paid`) VALUES
(1, 1, 1, '', '', NULL, NULL, 0.00, 0.00, '0000-00-00', NULL, 'Salary', '192', 0.00, NULL, 'Q4');

-- --------------------------------------------------------

--
-- Table structure for table `tds_24q_returns`
--

CREATE TABLE `tds_24q_returns` (
  `id` int(11) NOT NULL,
  `tax_deduction_account_no` varchar(20) NOT NULL,
  `permanent_account_no` varchar(20) NOT NULL,
  `financial_year` varchar(10) NOT NULL,
  `assessment_year` varchar(10) NOT NULL,
  `has_statement_filed_earlier` enum('Yes','No') NOT NULL,
  `provisional_receipt_no` varchar(50) DEFAULT NULL,
  `deductor_name` varchar(255) NOT NULL,
  `deductor_type` varchar(50) NOT NULL,
  `branch_division` varchar(100) DEFAULT NULL,
  `deductor_flat_no` varchar(100) DEFAULT NULL,
  `deductor_name_of_premises_building` varchar(255) DEFAULT NULL,
  `deductor_road_street_lane` varchar(255) DEFAULT NULL,
  `deductor_area_location` varchar(255) DEFAULT NULL,
  `deductor_town_city_district` varchar(255) NOT NULL,
  `deductor_state` varchar(100) NOT NULL,
  `deductor_pin_code` varchar(10) NOT NULL,
  `deductor_telephone_no` varchar(20) DEFAULT NULL,
  `deductor_email` varchar(100) NOT NULL,
  `responsible_person_name` varchar(255) NOT NULL,
  `responsible_person_flat_no` varchar(100) DEFAULT NULL,
  `responsible_person_name_of_premises_building` varchar(255) DEFAULT NULL,
  `responsible_person_road_street_lane` varchar(255) DEFAULT NULL,
  `responsible_person_area_location` varchar(255) DEFAULT NULL,
  `responsible_person_town_city_district` varchar(255) NOT NULL,
  `responsible_person_state` varchar(100) NOT NULL,
  `responsible_person_pin_code` varchar(10) NOT NULL,
  `responsible_person_telephone_no` varchar(20) DEFAULT NULL,
  `responsible_person_email` varchar(100) NOT NULL,
  `verification_place` varchar(100) NOT NULL,
  `verification_date` date NOT NULL,
  `verification_name_of_person_responsible` varchar(255) NOT NULL,
  `verification_designation` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tds_24q_returns`
--

INSERT INTO `tds_24q_returns` (`id`, `tax_deduction_account_no`, `permanent_account_no`, `financial_year`, `assessment_year`, `has_statement_filed_earlier`, `provisional_receipt_no`, `deductor_name`, `deductor_type`, `branch_division`, `deductor_flat_no`, `deductor_name_of_premises_building`, `deductor_road_street_lane`, `deductor_area_location`, `deductor_town_city_district`, `deductor_state`, `deductor_pin_code`, `deductor_telephone_no`, `deductor_email`, `responsible_person_name`, `responsible_person_flat_no`, `responsible_person_name_of_premises_building`, `responsible_person_road_street_lane`, `responsible_person_area_location`, `responsible_person_town_city_district`, `responsible_person_state`, `responsible_person_pin_code`, `responsible_person_telephone_no`, `responsible_person_email`, `verification_place`, `verification_date`, `verification_name_of_person_responsible`, `verification_designation`, `created_at`) VALUES
(1, '54634', 'erwdsvdfb', '2023-24', '2024-25', 'No', NULL, 'Saima Shadmani', 'Individual/HUF', NULL, NULL, NULL, NULL, NULL, '', '', '', NULL, '', 'Saima Shadmani', NULL, 'Saima Shadmani', 'Mango', NULL, 'PURBA SINGHBHUM', 'JH', '832110', '09693284411', 'saimashadmani1999@gmail.com', 'wwef', '2025-07-28', 'Saima Shadmani', 'Full Stack Developer', '2025-07-28 19:28:19');

-- --------------------------------------------------------

--
-- Table structure for table `tds_24q_tax_details`
--

CREATE TABLE `tds_24q_tax_details` (
  `id` int(11) NOT NULL,
  `return_id` int(11) NOT NULL,
  `sr_no` int(11) NOT NULL,
  `tds` decimal(15,2) NOT NULL,
  `surcharge` decimal(15,2) DEFAULT 0.00,
  `education_cess` decimal(15,2) DEFAULT 0.00,
  `interest` decimal(15,2) DEFAULT 0.00,
  `others` decimal(15,2) DEFAULT 0.00,
  `total_tax_deposited` decimal(15,2) NOT NULL,
  `cheque_dd` varchar(50) DEFAULT NULL,
  `bsr_code` varchar(10) DEFAULT NULL,
  `date_on_which_tax_deposited` date NOT NULL,
  `transfer_voucher_challan_serial_no` varchar(50) DEFAULT NULL,
  `whether_tds_deposited_by_book_entry` enum('Yes','No') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tds_24q_tax_details`
--

INSERT INTO `tds_24q_tax_details` (`id`, `return_id`, `sr_no`, `tds`, `surcharge`, `education_cess`, `interest`, `others`, `total_tax_deposited`, `cheque_dd`, `bsr_code`, `date_on_which_tax_deposited`, `transfer_voucher_challan_serial_no`, `whether_tds_deposited_by_book_entry`) VALUES
(1, 1, 1, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, NULL, NULL, '0000-00-00', NULL, 'No');

-- --------------------------------------------------------

--
-- Table structure for table `tds_26q_challans`
--

CREATE TABLE `tds_26q_challans` (
  `id` int(11) NOT NULL,
  `return_id` int(11) NOT NULL,
  `serial_no` int(11) NOT NULL,
  `bsr_code` varchar(20) NOT NULL,
  `date_of_deposit` date NOT NULL,
  `challan_serial_no` varchar(50) NOT NULL,
  `tax` decimal(15,2) NOT NULL DEFAULT 0.00,
  `surcharge` decimal(15,2) NOT NULL DEFAULT 0.00,
  `education_cess` decimal(15,2) NOT NULL DEFAULT 0.00,
  `other_charges` decimal(15,2) NOT NULL DEFAULT 0.00,
  `interest` decimal(15,2) NOT NULL DEFAULT 0.00,
  `penalty` decimal(15,2) NOT NULL DEFAULT 0.00,
  `fee` decimal(15,2) NOT NULL DEFAULT 0.00,
  `total_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `transfer_voucher_no` varchar(50) DEFAULT NULL,
  `status` enum('Deposited','Book Adjustment') NOT NULL DEFAULT 'Deposited'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tds_26q_challans`
--

INSERT INTO `tds_26q_challans` (`id`, `return_id`, `serial_no`, `bsr_code`, `date_of_deposit`, `challan_serial_no`, `tax`, `surcharge`, `education_cess`, `other_charges`, `interest`, `penalty`, `fee`, `total_amount`, `transfer_voucher_no`, `status`) VALUES
(1, 4, 1, '', '2025-07-30', '123', 0.02, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.02, NULL, 'Deposited');

-- --------------------------------------------------------

--
-- Table structure for table `tds_26q_deductees`
--

CREATE TABLE `tds_26q_deductees` (
  `id` int(11) NOT NULL,
  `return_id` int(11) NOT NULL,
  `serial_no` int(11) NOT NULL,
  `pan_of_deductee` varchar(20) NOT NULL,
  `name_of_deductee` varchar(255) NOT NULL,
  `amount_paid` decimal(15,2) NOT NULL DEFAULT 0.00,
  `tax_deducted` decimal(15,2) NOT NULL DEFAULT 0.00,
  `tax_deposited` decimal(15,2) NOT NULL DEFAULT 0.00,
  `date_of_payment` date NOT NULL,
  `nature_of_payment` varchar(255) DEFAULT NULL,
  `section_deducted` varchar(20) NOT NULL,
  `rate_of_deduction` decimal(5,2) NOT NULL DEFAULT 0.00,
  `certificate_no` varchar(50) DEFAULT NULL,
  `date_of_certificate` date DEFAULT NULL,
  `amount_paid_credited` decimal(15,2) DEFAULT 0.00,
  `gst_no` varchar(20) DEFAULT NULL,
  `remark_code` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tds_26q_deductees`
--

INSERT INTO `tds_26q_deductees` (`id`, `return_id`, `serial_no`, `pan_of_deductee`, `name_of_deductee`, `amount_paid`, `tax_deducted`, `tax_deposited`, `date_of_payment`, `nature_of_payment`, `section_deducted`, `rate_of_deduction`, `certificate_no`, `date_of_certificate`, `amount_paid_credited`, `gst_no`, `remark_code`) VALUES
(1, 4, 1, '', '', 0.00, 0.00, 0.00, '2025-07-29', NULL, '194C', 0.00, NULL, NULL, 0.00, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `tds_26q_returns`
--

CREATE TABLE `tds_26q_returns` (
  `id` int(11) NOT NULL,
  `tan` varchar(20) NOT NULL,
  `assessment_year` varchar(10) NOT NULL,
  `pan_of_deductor` varchar(20) NOT NULL,
  `deductor_category` varchar(50) NOT NULL,
  `deductor_name` varchar(255) NOT NULL,
  `branch_serial_no` varchar(50) DEFAULT NULL,
  `deductor_flat_no` varchar(100) DEFAULT NULL,
  `deductor_premises_name` varchar(255) DEFAULT NULL,
  `deductor_road_street` varchar(255) DEFAULT NULL,
  `deductor_area` varchar(255) DEFAULT NULL,
  `deductor_town_city` varchar(255) DEFAULT NULL,
  `deductor_state` varchar(100) DEFAULT NULL,
  `deductor_country` varchar(100) DEFAULT NULL,
  `deductor_pin_code` varchar(20) DEFAULT NULL,
  `deductor_std_code` varchar(20) DEFAULT NULL,
  `deductor_telephone` varchar(20) DEFAULT NULL,
  `deductor_email` varchar(100) DEFAULT NULL,
  `resp_status` varchar(50) DEFAULT NULL,
  `resp_designation` varchar(100) DEFAULT NULL,
  `resp_name` varchar(255) DEFAULT NULL,
  `resp_father_name` varchar(255) DEFAULT NULL,
  `resp_pan` varchar(20) DEFAULT NULL,
  `verification_capacity` varchar(50) DEFAULT NULL,
  `verification_place` varchar(100) DEFAULT NULL,
  `verification_date` date DEFAULT NULL,
  `verification_full_name` varchar(255) DEFAULT NULL,
  `verification_designation` varchar(100) DEFAULT NULL,
  `verification_signature` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tds_26q_returns`
--

INSERT INTO `tds_26q_returns` (`id`, `tan`, `assessment_year`, `pan_of_deductor`, `deductor_category`, `deductor_name`, `branch_serial_no`, `deductor_flat_no`, `deductor_premises_name`, `deductor_road_street`, `deductor_area`, `deductor_town_city`, `deductor_state`, `deductor_country`, `deductor_pin_code`, `deductor_std_code`, `deductor_telephone`, `deductor_email`, `resp_status`, `resp_designation`, `resp_name`, `resp_father_name`, `resp_pan`, `verification_capacity`, `verification_place`, `verification_date`, `verification_full_name`, `verification_designation`, `verification_signature`, `created_at`) VALUES
(4, 'ABCD12345E', '2024-25', 'ABCD12345E', 'Individual/HUF', 'Saima Shadmani', NULL, '', 'Saima Shadmani', 'Jawaharnagar, Road no. 12 ,flat no. B10 Shabina apartment, Road no. 12 ,flat no. B10 Shabina apartment, Road no. 12 ,flat no. B10 Shabina apartment, Road no. 12 ,flat no. B10 Shabina apartment', '', 'Jamshedpur', 'JH', 'India', '832110', '', '09693284411', 'saimashadmani1999@gmail.com', 'Deductor', '', 'Saima Shadmani', '', 'ABCD12345E', 'Deductor', 'HHGF', '2025-07-29', 'Saima Shadmani', 'Full Stack Developer', '', '2025-07-29 07:45:56');

-- --------------------------------------------------------

--
-- Table structure for table `voucher_entries`
--

CREATE TABLE `voucher_entries` (
  `id` int(11) NOT NULL,
  `voucher_id` int(11) DEFAULT NULL,
  `ledger_id` int(11) DEFAULT NULL,
  `amount` decimal(10,2) DEFAULT NULL,
  `entry_type` enum('debit','credit') DEFAULT NULL,
  `narration` text DEFAULT NULL,
  `bank_name` varchar(255) DEFAULT NULL,
  `cheque_number` varchar(255) DEFAULT NULL,
  `cost_centre_id` int(11) DEFAULT NULL,
  `item_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `voucher_entries`
--

INSERT INTO `voucher_entries` (`id`, `voucher_id`, `ledger_id`, `amount`, `entry_type`, `narration`, `bank_name`, `cheque_number`, `cost_centre_id`, `item_id`) VALUES
(1, 1, 2, 10.00, 'debit', NULL, NULL, NULL, NULL, 1),
(2, 1, 4, 10.00, 'credit', NULL, NULL, NULL, NULL, 2),
(3, 2, 1, 10.00, 'debit', NULL, NULL, NULL, NULL, 3),
(4, 2, 2, 10.00, 'credit', NULL, NULL, NULL, NULL, 3),
(5, 3, 4, 10.00, 'debit', NULL, NULL, NULL, NULL, 2),
(6, 3, 7, 10.00, 'credit', NULL, NULL, NULL, NULL, 1),
(7, 4, 3, 10.00, 'debit', NULL, NULL, NULL, NULL, NULL),
(8, 4, 0, 10.00, 'credit', NULL, NULL, NULL, NULL, NULL),
(9, 5, 3, 10.00, 'debit', NULL, NULL, NULL, NULL, NULL),
(10, 5, 0, 10.00, 'credit', NULL, NULL, NULL, NULL, NULL),
(11, 6, 3, 10.00, 'debit', NULL, NULL, NULL, NULL, NULL),
(12, 6, 4, 10.00, 'credit', NULL, NULL, NULL, NULL, NULL),
(13, 14, 17, 10.00, 'debit', NULL, NULL, NULL, NULL, NULL),
(14, 14, 18, 10.00, 'credit', NULL, NULL, NULL, NULL, NULL),
(15, 15, NULL, 100.00, 'debit', NULL, NULL, NULL, NULL, NULL),
(16, 16, 1, 10.00, 'debit', NULL, NULL, NULL, NULL, NULL),
(17, 16, 3, 10.00, 'credit', NULL, NULL, NULL, NULL, NULL),
(18, 17, 3, 10.00, 'debit', NULL, NULL, NULL, NULL, NULL),
(19, 17, 4, 10.00, 'credit', NULL, NULL, NULL, NULL, NULL),
(20, 1, 17, 500000.00, 'debit', 'Cash Account (Received)', NULL, NULL, NULL, NULL),
(21, 1, 18, 50000.00, 'credit', 'Sales Account', NULL, NULL, NULL, NULL),
(22, 2, 19, 200000.00, 'debit', 'Purchase Account', NULL, NULL, NULL, NULL),
(23, 2, 21, 20000.00, 'credit', 'Bank Account (Paid)', NULL, NULL, NULL, NULL),
(24, 3, 22, 30000.00, 'debit', 'Cash Account (Advance)', NULL, NULL, NULL, NULL),
(25, 3, 23, 300000.00, 'credit', 'Advance Receipt', NULL, NULL, NULL, NULL),
(26, 4, 203, 100000.00, 'debit', 'Salary Expense', NULL, NULL, NULL, NULL),
(27, 4, 101, 100000.00, 'credit', 'Cash Account', NULL, NULL, NULL, NULL),
(28, 5, 101, 700000.00, 'debit', 'Cash Account (Sale)', NULL, NULL, NULL, NULL),
(29, 5, 201, 700000.00, 'credit', 'Sales', NULL, NULL, NULL, NULL),
(30, 25, 204, 150000.00, 'debit', 'Rent Expense', NULL, NULL, NULL, NULL),
(31, 25, 102, 150000.00, 'credit', 'Bank Account', NULL, NULL, NULL, NULL),
(32, 24, 101, 100000.00, 'debit', 'Cash received', NULL, NULL, NULL, NULL),
(33, 24, 201, 100000.00, 'credit', 'Sales', NULL, NULL, NULL, NULL),
(35, 26, 23, 185000.00, 'credit', NULL, NULL, NULL, NULL, NULL),
(36, 27, 24, 220000.00, 'credit', NULL, NULL, NULL, NULL, NULL),
(37, 28, 23, 85000.00, 'debit', NULL, NULL, NULL, NULL, NULL),
(38, 29, 24, 50000.00, 'debit', NULL, NULL, NULL, NULL, NULL),
(39, 30, 28, 10000.00, 'debit', 'Payment for invoice INV001', 'ABC Bank', 'CHQ123', NULL, NULL),
(40, 30, 27, 10000.00, 'credit', 'Payment for invoice INV001', 'ABC Bank', 'CHQ123', NULL, NULL),
(41, 31, 27, 15000.00, 'debit', 'Receipt for sales invoice INV002', 'XYZ Bank', 'CHQ124', NULL, NULL),
(42, 31, 28, 15000.00, 'credit', 'Receipt for sales invoice INV002', 'XYZ Bank', 'CHQ124', NULL, NULL),
(43, 32, 27, 5000.00, 'debit', 'Adjustment entry', NULL, NULL, NULL, 16),
(44, 32, 28, 5000.00, 'credit', 'Adjustment entry', NULL, NULL, NULL, 15),
(45, 33, NULL, 944000.00, 'debit', NULL, NULL, NULL, NULL, 17),
(46, 34, NULL, 29028.00, 'debit', NULL, NULL, NULL, NULL, NULL),
(47, 35, NULL, 7890424.00, 'debit', NULL, NULL, NULL, NULL, NULL),
(48, 36, NULL, 7890424.00, 'debit', NULL, NULL, NULL, NULL, NULL),
(49, 37, NULL, 20768.00, 'debit', NULL, NULL, NULL, NULL, NULL),
(50, 38, NULL, 31624.00, 'debit', NULL, NULL, NULL, NULL, NULL),
(51, 39, NULL, 54752.00, 'debit', NULL, NULL, NULL, NULL, NULL),
(52, 40, NULL, 52392.00, 'debit', NULL, NULL, NULL, NULL, NULL),
(53, 41, NULL, 52392.00, 'debit', NULL, NULL, NULL, NULL, NULL),
(54, 42, 3, 10.00, 'debit', NULL, NULL, NULL, NULL, NULL),
(55, 42, 5, 10.00, 'credit', NULL, NULL, NULL, NULL, NULL),
(56, 43, 1, 100.00, 'debit', NULL, NULL, NULL, NULL, NULL),
(57, 43, 11, 100.00, 'credit', NULL, NULL, NULL, NULL, NULL),
(58, 44, 39, 1000.00, 'debit', NULL, NULL, NULL, NULL, NULL),
(59, 44, 37, 1000.00, 'credit', NULL, NULL, NULL, NULL, NULL),
(60, 45, 33, 1000.00, 'debit', NULL, NULL, NULL, NULL, NULL),
(61, 45, 33, 1000.00, 'credit', NULL, NULL, NULL, NULL, NULL),
(62, 46, 38, 1000.00, 'debit', NULL, NULL, NULL, NULL, NULL),
(63, 46, 38, 1000.00, 'credit', NULL, NULL, NULL, NULL, NULL),
(64, 47, 31, 10.00, 'debit', NULL, NULL, NULL, NULL, NULL),
(65, 47, 33, 10.00, 'credit', NULL, NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `voucher_entries_old`
--

CREATE TABLE `voucher_entries_old` (
  `id` int(11) NOT NULL,
  `voucher_id` int(11) DEFAULT NULL,
  `ledger_id` int(11) DEFAULT NULL,
  `amount` decimal(12,2) DEFAULT NULL,
  `entry_type` enum('debit','credit') DEFAULT NULL,
  `Party_Ledger` varchar(100) DEFAULT NULL,
  `Payment_Ledger` varchar(100) DEFAULT NULL,
  `narration` varchar(100) DEFAULT NULL,
  `bank_name` varchar(255) DEFAULT NULL,
  `cheque_number` varchar(255) DEFAULT NULL,
  `cost_centre_id` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `voucher_entries_old`
--

INSERT INTO `voucher_entries_old` (`id`, `voucher_id`, `ledger_id`, `amount`, `entry_type`, `Party_Ledger`, `Payment_Ledger`, `narration`, `bank_name`, `cheque_number`, `cost_centre_id`) VALUES
(1, 1, 1, 100.00, 'credit', NULL, NULL, NULL, NULL, NULL, NULL),
(2, 1, 2, 100.00, 'debit', NULL, NULL, NULL, NULL, NULL, NULL),
(3, 2, 1, 100.00, 'debit', NULL, NULL, NULL, NULL, NULL, NULL),
(4, 2, 2, 100.00, 'credit', NULL, NULL, NULL, NULL, NULL, NULL),
(5, 3, 1, 100.00, 'debit', NULL, NULL, NULL, NULL, NULL, NULL),
(6, 3, 2, 100.00, 'credit', NULL, NULL, NULL, NULL, NULL, NULL),
(7, 4, 1, 100.00, 'debit', NULL, NULL, NULL, NULL, NULL, NULL),
(8, 4, 2, 100.00, 'credit', NULL, NULL, NULL, NULL, NULL, NULL),
(9, 5, 1, 100.00, 'debit', NULL, NULL, NULL, NULL, NULL, NULL),
(10, 5, 2, 200.00, 'credit', NULL, NULL, NULL, NULL, NULL, NULL),
(11, 5, 1, 100.00, 'debit', NULL, NULL, NULL, NULL, NULL, NULL),
(12, 6, 1, 100.00, 'debit', NULL, NULL, NULL, NULL, NULL, NULL),
(13, 6, 2, 100.00, 'credit', NULL, NULL, NULL, NULL, NULL, NULL),
(14, 7, NULL, 6490.00, 'debit', NULL, NULL, NULL, NULL, NULL, NULL),
(17, 8, 1, 10.00, 'debit', NULL, NULL, NULL, NULL, NULL, NULL),
(18, 8, 2, 10.00, 'credit', NULL, NULL, NULL, NULL, NULL, NULL),
(19, 8, 1, 10.00, 'debit', NULL, NULL, NULL, NULL, NULL, NULL),
(20, 8, 3, 10.00, 'credit', NULL, NULL, NULL, NULL, NULL, NULL),
(21, 9, 1, 10.00, 'debit', NULL, NULL, NULL, NULL, NULL, NULL),
(22, 9, 3, 10.00, 'credit', NULL, NULL, NULL, NULL, NULL, NULL),
(23, 10, 2, 10.00, 'debit', NULL, NULL, NULL, NULL, NULL, NULL),
(24, 10, 3, 10.00, 'credit', NULL, NULL, NULL, NULL, NULL, NULL),
(25, 11, 1, 10.00, 'debit', NULL, NULL, NULL, NULL, NULL, NULL),
(26, 11, 3, 10.00, 'credit', NULL, NULL, NULL, NULL, NULL, NULL),
(27, 12, 2, 1000.00, 'debit', NULL, NULL, NULL, NULL, NULL, NULL),
(28, 12, 4, 1000.00, 'credit', NULL, NULL, NULL, NULL, NULL, NULL),
(29, 13, 1, 10.00, 'debit', NULL, NULL, NULL, NULL, NULL, NULL),
(30, 13, 3, 10.00, 'credit', NULL, NULL, NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `voucher_main`
--

CREATE TABLE `voucher_main` (
  `id` int(11) NOT NULL,
  `voucher_type` varchar(255) DEFAULT NULL,
  `voucher_number` varchar(255) DEFAULT NULL,
  `date` date DEFAULT NULL,
  `narration` text DEFAULT NULL,
  `reference_no` varchar(255) DEFAULT NULL,
  `supplier_invoice_date` date DEFAULT NULL,
  `due_date` date DEFAULT NULL,
  `company_id` varchar(64) DEFAULT NULL,
  `owner_type` varchar(32) DEFAULT NULL,
  `owner_id` varchar(64) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `voucher_main`
--

INSERT INTO `voucher_main` (`id`, `voucher_type`, `voucher_number`, `date`, `narration`, `reference_no`, `supplier_invoice_date`, `due_date`, `company_id`, `owner_type`, `owner_id`) VALUES
(1, 'receipt', 'RV000001', '2025-06-30', 'xz', '12345d', '2025-06-16', NULL, NULL, NULL, NULL),
(2, 'payment', '1', '2025-06-30', 'dsv', '12345d', '2025-06-03', NULL, NULL, NULL, NULL),
(3, 'contra', 'cV282514', '2025-06-30', 'fdsf', '12345d', '2025-06-03', NULL, NULL, NULL, NULL),
(4, 'contra', 'CV331516', '2025-06-30', 'bcvbvc', '12345d', '2025-06-17', NULL, NULL, NULL, NULL),
(5, 'contra', 'CV868728', '2025-06-30', 'being cash', '2345', '2025-06-02', NULL, NULL, NULL, NULL),
(6, 'contra', 'CV373342', '2025-06-30', 'fgd', '12345dddd', '2025-06-15', NULL, NULL, NULL, NULL),
(8, 'payment', '1', '2025-06-30', 'fads', '12345d', '2025-06-03', NULL, NULL, NULL, NULL),
(9, 'payment', '1', '2025-06-30', 'jhkj', '12345d', '2025-06-11', NULL, NULL, NULL, NULL),
(10, 'payment', '1', '2025-06-30', 'daf', 'hjg,jhkj', '2025-07-16', NULL, NULL, NULL, NULL),
(11, 'payment', '1', '2025-06-30', 'sdsd', 'dfsfs', '2025-06-30', NULL, NULL, NULL, NULL),
(12, 'payment', '1', '2025-06-30', 'being cash', '2345', '2025-07-08', NULL, NULL, NULL, NULL),
(13, 'payment', '1', '2025-06-30', 'avafffsfvgfv', '12345d', '2025-07-15', NULL, NULL, NULL, NULL),
(14, 'sales', 'XYZ0001', '2025-07-01', 'vbbb', '12345d', NULL, NULL, NULL, NULL, NULL),
(15, 'purchase', 'ABC0001', '2025-07-03', 'hii', '2345', '2025-07-01', NULL, NULL, NULL, NULL),
(16, 'receipt', 'RV225905', '2025-07-02', 'cvx', '2345', '2025-07-04', NULL, NULL, NULL, NULL),
(17, 'payment', '1', '2025-07-02', 'hello payment', '2345', '2025-07-17', NULL, NULL, NULL, NULL),
(18, 'receipt', 'REC-001', '2025-04-15', 'Receipt from Customer', NULL, '2025-07-04', NULL, NULL, NULL, NULL),
(19, 'payment', 'PAY-001', '2024-04-20', 'Payment to Supplier', NULL, '2025-07-09', NULL, NULL, NULL, NULL),
(20, 'receipt', 'REC-002', '2024-05-10', 'Advance Receipt', NULL, '2025-05-07', NULL, NULL, NULL, NULL),
(21, 'payment', 'PAY-002', '2024-05-25', 'Salary Payment', NULL, '2025-06-24', NULL, NULL, NULL, NULL),
(22, 'receipt', 'REC-003', '2024-06-05', 'Sale Money Received', NULL, '2025-04-30', NULL, NULL, NULL, NULL),
(23, 'payment', 'PAY-003', '2024-06-12', 'Office Rent Paid', NULL, '2025-07-03', NULL, NULL, NULL, NULL),
(24, 'receipt', 'R001', '2025-06-11', 'Receipt from customer', NULL, NULL, NULL, NULL, NULL, NULL),
(25, 'payment', 'P001', '2025-06-11', 'Payment to supplier', NULL, NULL, NULL, NULL, NULL, NULL),
(26, 'purchase', 'PI/2024/001', '2025-06-11', 'Raw materials purchase', 'PO/REL/001', NULL, '2025-07-03', NULL, NULL, NULL),
(27, 'purchase', 'PI/2024/002', '2025-06-11', 'Bulk manufacturing supplies', 'EM/BULK/001', NULL, '2025-07-03', NULL, NULL, NULL),
(28, 'payment', 'PAY/2024/001', '2025-06-11', 'Partial payment to Reliable Suppliers Ltd', NULL, NULL, NULL, NULL, NULL, NULL),
(29, 'payment', 'PAY/2024/002', '2025-07-11', 'Partial payment to Elite Manufacturing', NULL, NULL, NULL, NULL, NULL, NULL),
(30, 'Payment', 'PV-001', '2025-07-11', 'Payment to supplier', 'REF001', NULL, NULL, NULL, NULL, NULL),
(31, 'Receipt', 'RV-001', '2025-06-11', 'Receipt from customer', 'REF002', NULL, NULL, NULL, NULL, NULL),
(32, 'Journal', 'JV-001', '2025-06-11', 'Adjustment entry', 'REF003', NULL, NULL, NULL, NULL, NULL),
(33, 'sales', 'XYZ0001', '2025-08-08', NULL, 'hjg,jhkj', NULL, NULL, NULL, NULL, NULL),
(34, 'quotation', 'QT0001', '2025-08-06', NULL, '67', NULL, NULL, NULL, NULL, NULL),
(35, 'quotation', 'QT0001', '2025-08-06', NULL, '67', NULL, NULL, NULL, NULL, NULL),
(36, 'quotation', 'QT0001', '2025-08-06', NULL, '67', NULL, NULL, NULL, NULL, NULL),
(37, 'quotation', 'QT0001', '2025-08-06', NULL, '67', NULL, NULL, NULL, NULL, NULL),
(38, 'sales', 'XYZ0001', '2025-08-06', NULL, '67', NULL, NULL, NULL, NULL, NULL),
(39, 'quotation', 'QT0001', '2025-08-06', NULL, '3333', NULL, NULL, NULL, NULL, NULL),
(40, 'quotation', 'QT0001', '2025-08-06', NULL, '67', NULL, NULL, NULL, NULL, NULL),
(41, 'quotation', 'QT0001', '2025-08-06', NULL, '67', NULL, NULL, NULL, NULL, NULL),
(42, 'receipt', 'RV740274', '2025-08-15', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(43, 'sales', 'XYZ0001', '2025-08-21', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(44, 'payment', 'PV465700', '2025-08-27', NULL, 'hjg,jhkj', '2025-08-31', NULL, '38', 'employee', '10'),
(45, 'receipt', 'RV465795', '2025-08-27', NULL, 'hjg,jhkj', '2025-08-31', NULL, '38', 'employee', '10'),
(46, 'contra', 'CV477509', '2025-08-27', NULL, 'hjg,jhkj', '2025-08-27', NULL, '38', 'employee', '10'),
(47, 'journal', 'JV000001', '2025-08-27', NULL, 'hjg,jhkj', '2025-08-27', NULL, '38', 'employee', '10');

-- --------------------------------------------------------

--
-- Table structure for table `voucher_main_old`
--

CREATE TABLE `voucher_main_old` (
  `id` int(11) NOT NULL,
  `voucher_type` enum('payment','receipt','contra','journal','sales','purchase','credit-note','debit-note','delivery-note','stock-journal') DEFAULT NULL,
  `voucher_number` varchar(50) DEFAULT NULL,
  `date` date DEFAULT NULL,
  `narration` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `voucher_main_old`
--

INSERT INTO `voucher_main_old` (`id`, `voucher_type`, `voucher_number`, `date`, `narration`, `created_at`) VALUES
(1, 'payment', 'XYZ0001', '2025-06-04', 'Being amount', '2025-06-26 19:05:10'),
(2, 'payment', 'VCH867562', '2025-06-04', 'being transfer', '2025-06-27 10:13:51'),
(3, 'receipt', 'RV712116', '2025-06-12', 'vsf', '2025-06-27 10:15:47'),
(4, 'contra', 'CV791391', '2025-06-03', 'sajio', '2025-06-27 10:25:07'),
(5, 'contra', 'CV276283', '2025-06-05', 'cas', '2025-06-27 10:26:17'),
(6, 'journal', 'JV144252', '2025-06-27', 'Journal', '2025-06-27 10:33:48'),
(7, 'sales', 'XYZ0001', '2025-06-06', 'cx', '2025-06-28 19:08:06'),
(8, 'payment', 'PYTV279874', '2025-06-29', 'ed', '2025-06-29 19:35:29');

-- --------------------------------------------------------

--
-- Table structure for table `voucher_types`
--

CREATE TABLE `voucher_types` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `type` enum('payment','receipt','contra','journal','sales','purchase','credit-note','debit-note','delivery-note','sales-order','purchase-order','quotation','stock-journal','manufacturing-journal','physical-stock','stock-transfer','memorandum','rejection-out','rejection-in') NOT NULL,
  `abbreviation` varchar(4) NOT NULL,
  `numbering_method` enum('automatic','manual') NOT NULL DEFAULT 'automatic',
  `use_common_narration` tinyint(1) DEFAULT 0,
  `print_after_saving` tinyint(1) DEFAULT 0,
  `use_effective_dates` tinyint(1) DEFAULT 0,
  `make_optional_default` tinyint(1) DEFAULT 0,
  `restart_numbering_applicable` tinyint(1) DEFAULT 0,
  `restart_numbering_starting_number` int(11) DEFAULT 1,
  `restart_numbering_particulars` varchar(255) DEFAULT '',
  `prefix_details_applicable` tinyint(1) DEFAULT 0,
  `prefix_details_particulars` varchar(255) DEFAULT '',
  `suffix_details_applicable` tinyint(1) DEFAULT 0,
  `suffix_details_particulars` varchar(255) DEFAULT '',
  `narrations_for_each_entry` tinyint(1) DEFAULT 1,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `voucher_types`
--

INSERT INTO `voucher_types` (`id`, `name`, `type`, `abbreviation`, `numbering_method`, `use_common_narration`, `print_after_saving`, `use_effective_dates`, `make_optional_default`, `restart_numbering_applicable`, `restart_numbering_starting_number`, `restart_numbering_particulars`, `prefix_details_applicable`, `prefix_details_particulars`, `suffix_details_applicable`, `suffix_details_particulars`, `narrations_for_each_entry`, `is_active`, `created_at`, `updated_at`) VALUES
('ebe1165a-790d-11f0-92b7-b82a72d96170', 'Payment', 'payment', 'PAY', 'automatic', 0, 0, 0, 0, 1, 1, 'Financial Year', 0, '', 0, '', 1, 1, '2025-08-14 12:55:14', '2025-08-14 12:55:14'),
('ebe11920-790d-11f0-92b7-b82a72d96170', 'Receipt', 'receipt', 'REC', 'automatic', 0, 0, 0, 0, 1, 1, 'Financial Year', 0, '', 0, '', 1, 1, '2025-08-14 12:55:14', '2025-08-14 12:55:14'),
('ebe11a23-790d-11f0-92b7-b82a72d96170', 'Contra', 'contra', 'CON', 'automatic', 1, 0, 0, 0, 1, 1, 'Financial Year', 0, '', 0, '', 1, 1, '2025-08-14 12:55:14', '2025-08-14 12:55:14'),
('ebe11abf-790d-11f0-92b7-b82a72d96170', 'Journal', 'journal', 'JOU', 'automatic', 0, 0, 0, 0, 1, 1, 'Financial Year', 0, '', 0, '', 1, 1, '2025-08-14 12:55:14', '2025-08-14 12:55:14'),
('ebe11b4e-790d-11f0-92b7-b82a72d96170', 'Sales', 'sales', 'SAL', 'automatic', 0, 1, 0, 0, 1, 1, 'Financial Year', 1, 'INV', 0, '', 1, 1, '2025-08-14 12:55:14', '2025-08-14 12:55:14'),
('ebe11be0-790d-11f0-92b7-b82a72d96170', 'Purchase', 'purchase', 'PUR', 'automatic', 0, 0, 0, 0, 1, 1, 'Financial Year', 0, '', 0, '', 1, 1, '2025-08-14 12:55:14', '2025-08-14 12:55:14'),
('ebe11c70-790d-11f0-92b7-b82a72d96170', 'Credit Note', 'credit-note', 'CRN', 'automatic', 0, 1, 0, 0, 1, 1, 'Financial Year', 1, 'CN', 0, '', 1, 1, '2025-08-14 12:55:14', '2025-08-14 12:55:14'),
('ebe11d59-790d-11f0-92b7-b82a72d96170', 'Debit Note', 'debit-note', 'DBN', 'automatic', 0, 1, 0, 0, 1, 1, 'Financial Year', 1, 'DN', 0, '', 1, 1, '2025-08-14 12:55:14', '2025-08-14 12:55:14');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `assessees`
--
ALTER TABLE `assessees`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `budgets`
--
ALTER TABLE `budgets`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_company_id` (`company_id`),
  ADD KEY `idx_owner_type` (`owner_type`),
  ADD KEY `idx_owner_id` (`owner_id`);

--
-- Indexes for table `business_incomes`
--
ALTER TABLE `business_incomes`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `capital_gains`
--
ALTER TABLE `capital_gains`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `cost_centers`
--
ALTER TABLE `cost_centers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_company_id` (`company_id`),
  ADD KEY `idx_owner_type` (`owner_type`),
  ADD KEY `idx_owner_id` (`owner_id`);

--
-- Indexes for table `credit_vouchers`
--
ALTER TABLE `credit_vouchers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_company_id` (`company_id`),
  ADD KEY `idx_owner_type` (`owner_type`),
  ADD KEY `idx_owner_id` (`owner_id`);

--
-- Indexes for table `credit_voucher_accounts`
--
ALTER TABLE `credit_voucher_accounts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `voucher_id` (`voucher_id`);

--
-- Indexes for table `credit_voucher_double_entry`
--
ALTER TABLE `credit_voucher_double_entry`
  ADD PRIMARY KEY (`id`),
  ADD KEY `voucher_id` (`voucher_id`);

--
-- Indexes for table `credit_voucher_items`
--
ALTER TABLE `credit_voucher_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `voucher_id` (`voucher_id`);

--
-- Indexes for table `currencies`
--
ALTER TABLE `currencies`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_currency_per_scope` (`code`,`company_id`,`owner_type`,`owner_id`),
  ADD KEY `idx_company_id` (`company_id`),
  ADD KEY `idx_owner_type` (`owner_type`),
  ADD KEY `idx_owner_id` (`owner_id`);

--
-- Indexes for table `debit_note_entries`
--
ALTER TABLE `debit_note_entries`
  ADD PRIMARY KEY (`id`),
  ADD KEY `voucher_id` (`voucher_id`);

--
-- Indexes for table `debit_note_vouchers`
--
ALTER TABLE `debit_note_vouchers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_company_id` (`company_id`),
  ADD KEY `idx_owner_type` (`owner_type`),
  ADD KEY `idx_owner_id` (`owner_id`);

--
-- Indexes for table `deductees`
--
ALTER TABLE `deductees`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `pan` (`pan`);

--
-- Indexes for table `delivery_entries`
--
ALTER TABLE `delivery_entries`
  ADD PRIMARY KEY (`id`),
  ADD KEY `delivery_item_id` (`delivery_item_id`);

--
-- Indexes for table `delivery_items`
--
ALTER TABLE `delivery_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_company_id` (`company_id`),
  ADD KEY `idx_owner_type` (`owner_type`),
  ADD KEY `idx_owner_id` (`owner_id`);

--
-- Indexes for table `fifo_categories`
--
ALTER TABLE `fifo_categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `fifo_settings`
--
ALTER TABLE `fifo_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `key_name` (`key_name`);

--
-- Indexes for table `fifo_transactions`
--
ALTER TABLE `fifo_transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `item_id` (`item_id`);

--
-- Indexes for table `godowns`
--
ALTER TABLE `godowns`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_company_id` (`company_id`),
  ADD KEY `idx_owner_type` (`owner_type`),
  ADD KEY `idx_owner_id` (`owner_id`);

--
-- Indexes for table `godown_allocations`
--
ALTER TABLE `godown_allocations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `stockItemId` (`stockItemId`),
  ADD KEY `idx_company_id` (`company_id`),
  ADD KEY `idx_owner_type` (`owner_type`),
  ADD KEY `idx_owner_id` (`owner_id`);

--
-- Indexes for table `items`
--
ALTER TABLE `items`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `itr_policies`
--
ALTER TABLE `itr_policies`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `itr_statements`
--
ALTER TABLE `itr_statements`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `itr_tax_payments`
--
ALTER TABLE `itr_tax_payments`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `ledgers`
--
ALTER TABLE `ledgers`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `ledger_groups`
--
ALTER TABLE `ledger_groups`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_company_id` (`company_id`),
  ADD KEY `idx_owner_type` (`owner_type`),
  ADD KEY `idx_owner_id` (`owner_id`);

--
-- Indexes for table `purchase_orders`
--
ALTER TABLE `purchase_orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `number` (`number`),
  ADD KEY `company_id` (`company_id`),
  ADD KEY `party_id` (`party_id`),
  ADD KEY `purchase_ledger_id` (`purchase_ledger_id`);

--
-- Indexes for table `purchase_order_items`
--
ALTER TABLE `purchase_order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `purchase_order_id` (`purchase_order_id`);

--
-- Indexes for table `purchase_vouchers`
--
ALTER TABLE `purchase_vouchers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `partyId` (`partyId`),
  ADD KEY `purchaseLedgerId` (`purchaseLedgerId`),
  ADD KEY `idx_tenant` (`company_id`,`owner_type`,`owner_id`);

--
-- Indexes for table `purchase_voucher_items`
--
ALTER TABLE `purchase_voucher_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `voucherId` (`voucherId`),
  ADD KEY `itemId` (`itemId`);

--
-- Indexes for table `sales_orders`
--
ALTER TABLE `sales_orders`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `sales_order_items`
--
ALTER TABLE `sales_order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `salesOrderId` (`salesOrderId`);

--
-- Indexes for table `sales_vouchers`
--
ALTER TABLE `sales_vouchers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `partyId` (`partyId`);

--
-- Indexes for table `sales_voucher_items`
--
ALTER TABLE `sales_voucher_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `voucherId` (`voucherId`),
  ADD KEY `itemId` (`itemId`);

--
-- Indexes for table `scenarios`
--
ALTER TABLE `scenarios`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_company_id` (`company_id`),
  ADD KEY `idx_owner_type` (`owner_type`),
  ADD KEY `idx_owner_id` (`owner_id`);

--
-- Indexes for table `stock_categories`
--
ALTER TABLE `stock_categories`
  ADD KEY `idx_company_id` (`company_id`),
  ADD KEY `idx_owner_type` (`owner_type`),
  ADD KEY `idx_owner_id` (`owner_id`);

--
-- Indexes for table `stock_groups`
--
ALTER TABLE `stock_groups`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_company_id` (`company_id`),
  ADD KEY `idx_owner_type` (`owner_type`),
  ADD KEY `idx_owner_id` (`owner_id`);

--
-- Indexes for table `stock_items`
--
ALTER TABLE `stock_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_company_id` (`company_id`),
  ADD KEY `idx_owner_type` (`owner_type`),
  ADD KEY `idx_owner_id` (`owner_id`);

--
-- Indexes for table `stock_item_batches`
--
ALTER TABLE `stock_item_batches`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_batch_per_item` (`stockItemId`,`batchNumber`);

--
-- Indexes for table `stock_journal_entries`
--
ALTER TABLE `stock_journal_entries`
  ADD PRIMARY KEY (`id`),
  ADD KEY `voucher_id` (`voucher_id`);

--
-- Indexes for table `stock_journal_vouchers`
--
ALTER TABLE `stock_journal_vouchers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_company_id` (`company_id`),
  ADD KEY `idx_owner_type` (`owner_type`),
  ADD KEY `idx_owner_id` (`owner_id`);

--
-- Indexes for table `stock_units`
--
ALTER TABLE `stock_units`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_company_id` (`company_id`),
  ADD KEY `idx_owner_type` (`owner_type`),
  ADD KEY `idx_owner_id` (`owner_id`);

--
-- Indexes for table `tbCA`
--
ALTER TABLE `tbCA`
  ADD PRIMARY KEY (`fdSiNo`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `tbcompanies`
--
ALTER TABLE `tbcompanies`
  ADD PRIMARY KEY (`id`),
  ADD KEY `employee_id` (`employee_id`);

--
-- Indexes for table `tbemployees`
--
ALTER TABLE `tbemployees`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `tbgstr3breturns`
--
ALTER TABLE `tbgstr3breturns`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tbgstregistrations`
--
ALTER TABLE `tbgstregistrations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tbPermissions`
--
ALTER TABLE `tbPermissions`
  ADD PRIMARY KEY (`permission_id`),
  ADD UNIQUE KEY `permission_name` (`permission_name`);

--
-- Indexes for table `tbRolePermissions`
--
ALTER TABLE `tbRolePermissions`
  ADD PRIMARY KEY (`role_id`,`screen_id`,`permission_id`),
  ADD KEY `screen_id` (`screen_id`),
  ADD KEY `permission_id` (`permission_id`);

--
-- Indexes for table `tbRoles`
--
ALTER TABLE `tbRoles`
  ADD PRIMARY KEY (`role_id`);

--
-- Indexes for table `tbScreens`
--
ALTER TABLE `tbScreens`
  ADD PRIMARY KEY (`screen_id`),
  ADD UNIQUE KEY `screen_name` (`screen_name`);

--
-- Indexes for table `tbScreens_old`
--
ALTER TABLE `tbScreens_old`
  ADD PRIMARY KEY (`screen_id`),
  ADD UNIQUE KEY `screen_name` (`screen_name`);

--
-- Indexes for table `tbUserRoles`
--
ALTER TABLE `tbUserRoles`
  ADD PRIMARY KEY (`user_id`,`role_id`),
  ADD KEY `role_id` (`role_id`);

--
-- Indexes for table `tbUsers`
--
ALTER TABLE `tbUsers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `company_id` (`company_id`),
  ADD KEY `employee_id` (`employee_id`);

--
-- Indexes for table `tcs_27eq_challans`
--
ALTER TABLE `tcs_27eq_challans`
  ADD PRIMARY KEY (`id`),
  ADD KEY `return_id` (`return_id`);

--
-- Indexes for table `tcs_27eq_collectees`
--
ALTER TABLE `tcs_27eq_collectees`
  ADD PRIMARY KEY (`id`),
  ADD KEY `return_id` (`return_id`);

--
-- Indexes for table `tcs_27eq_returns`
--
ALTER TABLE `tcs_27eq_returns`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tcs_27q_challans`
--
ALTER TABLE `tcs_27q_challans`
  ADD PRIMARY KEY (`id`),
  ADD KEY `return_id` (`return_id`);

--
-- Indexes for table `tcs_27q_collectees`
--
ALTER TABLE `tcs_27q_collectees`
  ADD PRIMARY KEY (`id`),
  ADD KEY `return_id` (`return_id`);

--
-- Indexes for table `tcs_27q_returns`
--
ALTER TABLE `tcs_27q_returns`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tds_24q_employee_salary_details`
--
ALTER TABLE `tds_24q_employee_salary_details`
  ADD PRIMARY KEY (`id`),
  ADD KEY `return_id` (`return_id`);

--
-- Indexes for table `tds_24q_returns`
--
ALTER TABLE `tds_24q_returns`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tds_24q_tax_details`
--
ALTER TABLE `tds_24q_tax_details`
  ADD PRIMARY KEY (`id`),
  ADD KEY `return_id` (`return_id`);

--
-- Indexes for table `tds_26q_challans`
--
ALTER TABLE `tds_26q_challans`
  ADD PRIMARY KEY (`id`),
  ADD KEY `return_id` (`return_id`);

--
-- Indexes for table `tds_26q_deductees`
--
ALTER TABLE `tds_26q_deductees`
  ADD PRIMARY KEY (`id`),
  ADD KEY `return_id` (`return_id`);

--
-- Indexes for table `tds_26q_returns`
--
ALTER TABLE `tds_26q_returns`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `voucher_entries`
--
ALTER TABLE `voucher_entries`
  ADD PRIMARY KEY (`id`),
  ADD KEY `voucher_id` (`voucher_id`);

--
-- Indexes for table `voucher_entries_old`
--
ALTER TABLE `voucher_entries_old`
  ADD PRIMARY KEY (`id`),
  ADD KEY `voucher_id` (`voucher_id`);

--
-- Indexes for table `voucher_main`
--
ALTER TABLE `voucher_main`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `voucher_main_old`
--
ALTER TABLE `voucher_main_old`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `voucher_types`
--
ALTER TABLE `voucher_types`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `abbreviation` (`abbreviation`),
  ADD KEY `idx_type` (`type`),
  ADD KEY `idx_active` (`is_active`),
  ADD KEY `idx_abbreviation` (`abbreviation`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `assessees`
--
ALTER TABLE `assessees`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `budgets`
--
ALTER TABLE `budgets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `business_incomes`
--
ALTER TABLE `business_incomes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `capital_gains`
--
ALTER TABLE `capital_gains`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `cost_centers`
--
ALTER TABLE `cost_centers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `credit_vouchers`
--
ALTER TABLE `credit_vouchers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `credit_voucher_accounts`
--
ALTER TABLE `credit_voucher_accounts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `credit_voucher_double_entry`
--
ALTER TABLE `credit_voucher_double_entry`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `credit_voucher_items`
--
ALTER TABLE `credit_voucher_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `currencies`
--
ALTER TABLE `currencies`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `debit_note_entries`
--
ALTER TABLE `debit_note_entries`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `debit_note_vouchers`
--
ALTER TABLE `debit_note_vouchers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `deductees`
--
ALTER TABLE `deductees`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `delivery_entries`
--
ALTER TABLE `delivery_entries`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `delivery_items`
--
ALTER TABLE `delivery_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `fifo_categories`
--
ALTER TABLE `fifo_categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `fifo_settings`
--
ALTER TABLE `fifo_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `fifo_transactions`
--
ALTER TABLE `fifo_transactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `godowns`
--
ALTER TABLE `godowns`
  MODIFY `id` int(50) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `godown_allocations`
--
ALTER TABLE `godown_allocations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `items`
--
ALTER TABLE `items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `itr_policies`
--
ALTER TABLE `itr_policies`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `itr_statements`
--
ALTER TABLE `itr_statements`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `itr_tax_payments`
--
ALTER TABLE `itr_tax_payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `ledgers`
--
ALTER TABLE `ledgers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=46;

--
-- AUTO_INCREMENT for table `ledger_groups`
--
ALTER TABLE `ledger_groups`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=40;

--
-- AUTO_INCREMENT for table `purchase_orders`
--
ALTER TABLE `purchase_orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `purchase_order_items`
--
ALTER TABLE `purchase_order_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `purchase_vouchers`
--
ALTER TABLE `purchase_vouchers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `purchase_voucher_items`
--
ALTER TABLE `purchase_voucher_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `sales_orders`
--
ALTER TABLE `sales_orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `sales_order_items`
--
ALTER TABLE `sales_order_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `sales_vouchers`
--
ALTER TABLE `sales_vouchers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT for table `sales_voucher_items`
--
ALTER TABLE `sales_voucher_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `scenarios`
--
ALTER TABLE `scenarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `stock_groups`
--
ALTER TABLE `stock_groups`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `stock_items`
--
ALTER TABLE `stock_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

--
-- AUTO_INCREMENT for table `stock_item_batches`
--
ALTER TABLE `stock_item_batches`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `stock_journal_entries`
--
ALTER TABLE `stock_journal_entries`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `stock_journal_vouchers`
--
ALTER TABLE `stock_journal_vouchers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `stock_units`
--
ALTER TABLE `stock_units`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `tbCA`
--
ALTER TABLE `tbCA`
  MODIFY `fdSiNo` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `tbcompanies`
--
ALTER TABLE `tbcompanies`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=52;

--
-- AUTO_INCREMENT for table `tbemployees`
--
ALTER TABLE `tbemployees`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `tbgstr3breturns`
--
ALTER TABLE `tbgstr3breturns`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `tbgstregistrations`
--
ALTER TABLE `tbgstregistrations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `tbPermissions`
--
ALTER TABLE `tbPermissions`
  MODIFY `permission_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `tbRoles`
--
ALTER TABLE `tbRoles`
  MODIFY `role_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `tbScreens`
--
ALTER TABLE `tbScreens`
  MODIFY `screen_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT for table `tbScreens_old`
--
ALTER TABLE `tbScreens_old`
  MODIFY `screen_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `tbUsers`
--
ALTER TABLE `tbUsers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

--
-- AUTO_INCREMENT for table `tcs_27eq_challans`
--
ALTER TABLE `tcs_27eq_challans`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `tcs_27eq_collectees`
--
ALTER TABLE `tcs_27eq_collectees`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `tcs_27eq_returns`
--
ALTER TABLE `tcs_27eq_returns`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `tcs_27q_challans`
--
ALTER TABLE `tcs_27q_challans`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `tcs_27q_collectees`
--
ALTER TABLE `tcs_27q_collectees`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `tcs_27q_returns`
--
ALTER TABLE `tcs_27q_returns`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `tds_24q_employee_salary_details`
--
ALTER TABLE `tds_24q_employee_salary_details`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `tds_24q_returns`
--
ALTER TABLE `tds_24q_returns`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `tds_24q_tax_details`
--
ALTER TABLE `tds_24q_tax_details`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `tds_26q_challans`
--
ALTER TABLE `tds_26q_challans`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `tds_26q_deductees`
--
ALTER TABLE `tds_26q_deductees`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `tds_26q_returns`
--
ALTER TABLE `tds_26q_returns`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `voucher_entries`
--
ALTER TABLE `voucher_entries`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=66;

--
-- AUTO_INCREMENT for table `voucher_entries_old`
--
ALTER TABLE `voucher_entries_old`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT for table `voucher_main`
--
ALTER TABLE `voucher_main`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=48;

--
-- AUTO_INCREMENT for table `voucher_main_old`
--
ALTER TABLE `voucher_main_old`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `credit_voucher_accounts`
--
ALTER TABLE `credit_voucher_accounts`
  ADD CONSTRAINT `credit_voucher_accounts_ibfk_1` FOREIGN KEY (`voucher_id`) REFERENCES `credit_vouchers` (`id`);

--
-- Constraints for table `credit_voucher_double_entry`
--
ALTER TABLE `credit_voucher_double_entry`
  ADD CONSTRAINT `credit_voucher_double_entry_ibfk_1` FOREIGN KEY (`voucher_id`) REFERENCES `credit_vouchers` (`id`);

--
-- Constraints for table `credit_voucher_items`
--
ALTER TABLE `credit_voucher_items`
  ADD CONSTRAINT `credit_voucher_items_ibfk_1` FOREIGN KEY (`voucher_id`) REFERENCES `credit_vouchers` (`id`);

--
-- Constraints for table `debit_note_entries`
--
ALTER TABLE `debit_note_entries`
  ADD CONSTRAINT `debit_note_entries_ibfk_1` FOREIGN KEY (`voucher_id`) REFERENCES `debit_note_vouchers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `delivery_entries`
--
ALTER TABLE `delivery_entries`
  ADD CONSTRAINT `delivery_entries_ibfk_1` FOREIGN KEY (`delivery_item_id`) REFERENCES `delivery_items` (`id`);

--
-- Constraints for table `fifo_transactions`
--
ALTER TABLE `fifo_transactions`
  ADD CONSTRAINT `fifo_transactions_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `stock_items` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `tbUsers`
--
ALTER TABLE `tbUsers`
  ADD CONSTRAINT `tbUsers_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `tbemployees` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
