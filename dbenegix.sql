-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 07, 2026 at 10:19 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `dbenegix`
--

-- --------------------------------------------------------

--
-- Table structure for table `admin_settings`
--

CREATE TABLE `admin_settings` (
  `setting_key` varchar(50) NOT NULL,
  `setting_value` varchar(255) NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `admin_settings`
--

INSERT INTO `admin_settings` (`setting_key`, `setting_value`, `updated_at`) VALUES
('trial_period_days', '20', '2026-03-19 06:59:18');

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
  `created_date` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `attributes`
--

CREATE TABLE `attributes` (
  `id` int(11) NOT NULL,
  `name` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `attributes`
--

INSERT INTO `attributes` (`id`, `name`) VALUES
(1, 'color'),
(2, 'imei'),
(3, 'brand');

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
  `owner_type` varchar(50) NOT NULL,
  `owner_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `budgets`
--

INSERT INTO `budgets` (`id`, `name`, `start_date`, `end_date`, `description`, `status`, `created_at`, `updated_at`, `company_id`, `owner_type`, `owner_id`) VALUES
(2, 'First', '2025-12-05', '2025-12-05', 'asdfsdf', 'active', '2025-12-05 11:40:47', '2025-12-05 11:40:47', 1, 'employee', 1);

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
  `created_date` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
-- Table structure for table `company_subscriptions`
--

CREATE TABLE `company_subscriptions` (
  `id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `plan_id` int(11) DEFAULT NULL,
  `payment_id` varchar(255) DEFAULT NULL,
  `plan` varchar(50) DEFAULT NULL,
  `is_trial` tinyint(1) NOT NULL DEFAULT 1,
  `status` enum('active','expired','cancelled') NOT NULL DEFAULT 'active',
  `start_date` datetime NOT NULL,
  `end_date` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `company_subscriptions`
--

INSERT INTO `company_subscriptions` (`id`, `company_id`, `plan_id`, `payment_id`, `plan`, `is_trial`, `status`, `start_date`, `end_date`, `created_at`, `updated_at`) VALUES
(1, 2, 1, '65', 'Professional', 0, 'active', '2026-04-04 14:11:32', '2027-03-31 23:59:59', '2026-03-18 05:03:23', '2026-04-04 08:41:32'),
(2, 11, 1, '58', 'trial', 1, 'active', '2026-04-04 00:00:00', '2027-03-31 00:00:00', '2026-03-18 06:59:44', '2026-04-04 06:15:56'),
(4, 12, NULL, NULL, 'trial', 1, 'active', '2026-03-19 12:34:35', '2027-03-30 00:00:00', '2026-03-19 07:04:35', '2026-03-19 07:27:33'),
(9, 14, 1, '52', 'trial', 0, 'active', '2026-03-31 17:15:54', '2026-03-31 23:59:59', '2026-03-31 11:42:35', '2026-03-31 11:45:54');

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
  `owner_type` varchar(50) NOT NULL,
  `owner_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `cost_centers`
--

INSERT INTO `cost_centers` (`id`, `name`, `category`, `description`, `created_at`, `updated_at`, `company_id`, `owner_type`, `owner_id`) VALUES
(1, 'First', 'asff', 'asdfsdf', '2025-12-05 12:27:08', NULL, 1, 'employee', 1),
(2, 'First', 'asff', 'asdfsdf', '2025-12-05 12:27:34', NULL, 1, 'employee', 1);

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
  `owner_type` varchar(50) NOT NULL,
  `owner_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
  `owner_type` varchar(50) NOT NULL,
  `owner_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `currencies`
--

INSERT INTO `currencies` (`id`, `code`, `symbol`, `name`, `exchange_rate`, `is_base`, `created_at`, `company_id`, `owner_type`, `owner_id`) VALUES
(1, 'INR', '$', 'Dollor', 1.00, 0, '2025-12-05 06:24:59', 1, 'employee', 1);

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
  `owner_type` varchar(50) NOT NULL,
  `owner_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
  `owner_type` varchar(50) NOT NULL,
  `owner_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `address` text DEFAULT NULL,
  `description` text DEFAULT NULL,
  `company_id` int(11) NOT NULL,
  `owner_type` varchar(50) NOT NULL,
  `owner_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `godowns`
--

INSERT INTO `godowns` (`id`, `name`, `address`, `description`, `company_id`, `owner_type`, `owner_id`) VALUES
(1, 'Ayush', 'asdf', 'asdf', 1, 'employee', 1),
(2, 'Primary', 'Primary', 'Primary\n', 1, 'employee', 1),
(5, 'Dhanbad ', 'Sry', '', 2, 'employee', 2);

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
  `owner_type` varchar(50) NOT NULL,
  `owner_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
  `documents` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `created_date` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
  `owner_type` varchar(50) NOT NULL,
  `owner_id` int(11) NOT NULL,
  `closing_balance` decimal(15,2) DEFAULT 0.00,
  `state` varchar(100) DEFAULT '',
  `district` varchar(100) DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `ledgers`
--

INSERT INTO `ledgers` (`id`, `name`, `group_id`, `opening_balance`, `balance_type`, `address`, `email`, `phone`, `gst_number`, `pan_number`, `created_at`, `company_id`, `owner_type`, `owner_id`, `closing_balance`, `state`, `district`) VALUES
(1, 'First', 3, 1.00, 'debit', 'asdff', 'ayushsingh0455@gmail.com', '1234567890', '27ABCDE1234F1Z5', 'ABCDE1234F', '2025-12-05 12:26:09', 1, 'employee', 1, 1.00, '', ''),
(2, 'Sales', 1, 1.00, 'debit', 'sdfsdf', 'ayushsingh0455@gmail.com', '1234567890', '27ABCDE1234F1Z5', 'ABCDE1234F', '2025-12-05 12:32:34', 1, 'employee', 1, 0.00, '', ''),
(4, 'A kumar capital a/c', -4, 0.00, 'credit', '', '', '', '', '', '2025-12-06 08:39:20', 2, 'employee', 2, 0.00, '', ''),
(5, 'acc limited', 27, 0.00, 'credit', '', '', '', '', '', '2025-12-06 08:39:53', 2, 'employee', 2, 0.00, 'Jharkhand(20)', ''),
(6, 'cash a/c', 32, 0.00, 'debit', '', '', '', '', '', '2025-12-06 08:40:20', 2, 'employee', 2, 0.00, '', ''),
(8, 'furniture & fixture', -9, 0.00, 'debit', '', '', '', '', '', '2025-12-06 08:41:20', 2, 'employee', 2, 0.00, '', ''),
(10, 'sec deposit acc ltd', 29, 0.00, 'debit', '', '', '', '', '', '2025-12-06 08:42:12', 2, 'employee', 2, 0.00, '', ''),
(18, 'Bank charges', -10, 0.00, 'debit', '', '', '', '', '', '2025-12-06 10:18:23', 2, 'employee', 2, 0.00, '', ''),
(19, 'manoj kumar', 31, 0.00, 'debit', '', '', '', '', '', '2025-12-06 10:26:26', 2, 'employee', 2, 0.00, '', ''),
(24, 'AMAN KUMAR', 27, 0.00, 'credit', '', '', '', '20BDAPP6208H2ZY', '', '2025-12-09 12:57:12', 2, 'employee', 2, 0.00, 'Jharkhand(20)', 'giridih'),
(27, 'AUDIT FEE', -10, 0.00, 'debit', '', '', '', '', '', '2025-12-09 13:59:57', 2, 'employee', 2, 0.00, '', ''),
(36, 'Sbi', 42, 0.00, 'debit', '', '', '', '', '', '2025-12-11 06:07:04', 2, 'employee', 2, 0.00, '', ''),
(38, 'Purchase', -15, 100.00, 'debit', '', '', '', '', '', '2025-12-17 12:16:26', 1, 'employee', 1, 0.00, '', ''),
(39, 'Test Data', -4, 100.00, 'credit', '', '', '', '', '', '2025-12-17 12:17:31', 1, 'employee', 1, 0.00, '', ''),
(43, 'Mohan', 31, 0.00, 'debit', '', '', '', '', '', '2025-12-23 12:16:29', 2, 'employee', 2, 100.00, '', ''),
(48, 'Komal', -4, 0.00, 'debit', '', '', '', '', '', '2025-12-24 12:12:05', 2, 'employee', 2, 100.00, '', ''),
(50, 'stationary ', -10, 0.00, 'debit', '', '', '', '', '', '2025-12-24 14:16:17', 2, 'employee', 2, 0.00, '', ''),
(51, 'postage exp', -10, 0.00, 'debit', '', '', '', '', '', '2025-12-24 14:18:09', 2, 'employee', 2, 0.00, '', ''),
(53, 'KHIRODHAR MAHTO', 31, 0.00, 'debit', 'GHAGHRA NAWABAD TOLA POST DONDLO THANA BAGODAR', 'KNMAHTO07@GMAIL.COM', '07324825468', '20BDAPP6208H2ZY', '', '2026-01-05 15:40:20', 2, 'employee', 2, 0.00, 'Jharkhand(20)', 'Giridih'),
(54, 'nuvoco ltd', 27, 0.00, 'debit', '', '', '', '20BDAPP6208H2ZY', '', '2026-01-06 09:47:00', 2, 'employee', 2, 0.00, 'Jharkhand(20)', 'Giridih'),
(60, 'acc', -1, 0.00, 'credit', 'jgjgjgj', 'example@gmail.com', '9756565656', '', 'ABCDE1234F', '2026-01-24 06:04:25', 8, 'employee', 5, 0.00, 'Jharkhand(20)', 'ranchi'),
(66, '18% Intra Sales', -16, 0.00, 'debit', '', '', '', '', '', '2026-01-28 12:40:25', 2, 'employee', 2, 0.00, '', ''),
(67, '9% Cgst', 25, 0.00, 'debit', '', '', '', '', '', '2026-01-28 12:40:47', 2, 'employee', 2, 0.00, '', ''),
(68, '9% Sgst', 25, 0.00, 'debit', '', '', '', '', '', '2026-01-28 12:41:19', 2, 'employee', 2, 0.00, '', ''),
(70, 'stock 18% goods', 28, 0.00, 'debit', '', '', '', '', '', '2026-01-29 16:01:21', 2, 'employee', 2, 0.00, '', ''),
(72, 'loading and unloading exp', -7, 0.00, 'debit', '', '', '', '', '', '2026-01-31 14:04:05', 2, 'employee', 2, 0.00, '', ''),
(86, 'Depreciation', -10, 0.00, 'debit', '', '', '', '', '', '2026-01-31 15:09:57', 2, 'employee', 2, 0.00, '', ''),
(87, 'dividend', -11, 0.00, 'debit', '', '', '', '', '', '2026-01-31 16:05:26', 2, 'employee', 2, 0.00, '', ''),
(88, 'interest from bank', -11, 0.00, 'debit', '', '', '', '', '', '2026-01-31 16:05:51', 2, 'employee', 2, 0.00, '', ''),
(91, '18% Intra State Purchase', -15, 0.00, 'debit', '', '', '', '', '', '2026-02-10 11:52:55', 2, 'employee', 2, 0.00, '', ''),
(92, '18% Inter Sales', -16, 0.00, 'debit', '', '', '', '', '', '2026-02-10 12:14:40', 2, 'employee', 2, 0.00, '', ''),
(93, '18% Inter State purchase', -15, 0.00, 'debit', '', '', '', '', '', '2026-02-10 13:10:57', 2, 'employee', 2, 0.00, '', ''),
(94, '5% inter state purchase ', -15, 0.00, 'debit', '', '', '', '', '', '2026-02-10 13:12:23', 2, 'employee', 2, 0.00, '', ''),
(95, '5% inter state sales', -16, 0.00, 'credit', '', '', '', '', '', '2026-02-10 13:12:56', 2, 'employee', 2, 0.00, '', ''),
(96, '5% intra state purchase', -15, 0.00, 'debit', '', '', '', '', '', '2026-02-10 13:14:53', 2, 'employee', 2, 0.00, '', ''),
(100, 'sec acc ltd', 29, 0.00, 'debit', '', '', '', '', '', '2026-02-10 13:23:06', 2, 'employee', 2, 5000.00, '', ''),
(101, 'Tds on salary payment', -19, 0.00, 'credit', '', '', '', '', '', '2026-02-10 13:31:06', 2, 'employee', 2, 0.00, '', ''),
(102, 'Tds on payment other than Salary 1%', -19, 0.00, 'credit', '', '', '', '', '', '2026-02-10 13:32:39', 2, 'employee', 2, 0.00, '', ''),
(103, 'Tds on payment on non-resident', -19, 0.00, 'credit', '', '', '', '', '', '2026-02-10 13:34:30', 2, 'employee', 2, 0.00, '', ''),
(104, '3% intra state purchase', -15, 0.00, 'debit', '', '', '', '', '', '2026-02-10 13:36:44', 2, 'employee', 2, 0.00, '', ''),
(105, '3% inter state purchase', -15, 0.00, 'debit', '', '', '', '', '', '2026-02-10 13:37:48', 2, 'employee', 2, 0.00, '', ''),
(108, 'Dabur india', 27, 0.00, 'debit', '', '', '', '', '', '2026-02-10 15:16:00', 2, 'employee', 2, 0.00, 'Haryana(06)', ''),
(109, 'abc ', 27, 0.00, 'credit', '', '', '', '', '', '2026-02-12 04:30:59', 2, 'employee', 2, 0.00, '', ''),
(110, 'Discount to Customer 1%', -10, 0.00, 'debit', '', '', '', '', '', '2026-02-15 03:01:47', 2, 'employee', 2, 0.00, '', ''),
(111, 'Rebate & Discount 20%', -11, 0.00, 'debit', '', '', '', '', '', '2026-02-15 03:02:31', 2, 'employee', 2, 0.00, '', ''),
(112, 'Abc ltd ', 30, 0.00, 'debit', '', '', '', '', '', '2026-02-21 14:12:22', 2, 'employee', 2, 0.00, '', ''),
(113, 'travelling exp', -10, 0.00, 'debit', '', '', '', '', '', '2026-03-02 08:09:52', 2, 'employee', 2, 0.00, '', ''),
(114, 'Mukesh ', 31, 0.00, 'debit', '', '', '', '', '', '2026-03-07 14:42:38', 2, 'employee', 2, 0.00, '', ''),
(115, 'Ayush', 27, 0.00, 'debit', '', '', '', '', '', '2026-03-13 04:36:15', 2, 'employee', 2, 0.00, 'Jharkhand(20)', ''),
(116, 'Profit & Loss A/c', -18, 0.00, 'debit', '', '', '', '', '', '2026-03-13 05:08:35', 2, 'employee', 2, 0.00, '', ''),
(117, 'Az', -8, 0.00, 'debit', '', '', '', '', '', '2026-03-13 12:10:56', 2, 'employee', 2, 0.00, '', ''),
(118, '18% Igst', 25, 0.00, 'debit', '', '', '', '', '', '2026-03-17 11:29:04', 2, 'employee', 2, 0.00, '', ''),
(119, 'amit', 31, 0.00, 'debit', '', '', '', '', '', '2026-04-06 10:45:37', 2, 'employee', 2, 0.00, 'Jharkhand(20)', ''),
(120, 'ICICI LOMBARD GIC LTD', 31, 0.00, 'debit', '', '', '', '20AAACI7904G1Z1', '', '2026-04-06 10:46:20', 2, 'employee', 2, 0.00, 'Jharkhand(20)', '');

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
  `owner_type` varchar(50) NOT NULL,
  `owner_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `ledger_groups`
--

INSERT INTO `ledger_groups` (`id`, `name`, `type`, `parent`, `created_at`, `alias`, `nature`, `behavesLikeSubLedger`, `nettBalancesForReporting`, `usedForCalculation`, `allocationMethod`, `setAlterHSNSAC`, `hsnSacClassificationId`, `hsnCode`, `setAlterGST`, `gstClassificationId`, `typeOfSupply`, `taxability`, `integratedTaxRate`, `cess`, `company_id`, `owner_type`, `owner_id`) VALUES
(1, 'First', NULL, 0, '2025-12-05 11:38:24', 'abc', 'Assets', 0, 1, 0, 'No Appropriation', 0, NULL, NULL, 0, NULL, NULL, NULL, 0.00, 0.00, 1, 'employee', 1),
(3, 'Cash-in-Hand', NULL, 0, '2025-12-05 11:52:05', 'abc', 'Assets', 0, 1, 0, 'No Appropriation', 0, NULL, NULL, 0, NULL, NULL, NULL, 0.00, 0.00, 1, 'employee', 1),
(4, 'Fiasdf', NULL, 0, '2025-12-05 12:25:44', 'asdf', 'Assets', 0, 1, 0, 'No Appropriation', 0, NULL, NULL, 0, NULL, NULL, NULL, 0.00, 0.00, 1, 'employee', 1),
(21, 'Reserve & Surplus', NULL, -4, '2025-12-06 08:28:14', NULL, 'Liabilities', 0, 0, 0, 'No Appropriation', 0, NULL, NULL, 0, NULL, NULL, NULL, 0.00, 0.00, 2, 'employee', 2),
(23, 'Unsecured Loans', NULL, -13, '2025-12-06 08:30:07', NULL, 'Liabilities', 0, 0, 0, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, 0.00, 0.00, 2, 'employee', 2),
(24, 'Secured Loan', NULL, -13, '2025-12-06 08:30:23', NULL, 'Liabilities', 0, 0, 0, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, 0.00, 0.00, 2, 'employee', 2),
(25, 'Duties & Taxes', NULL, -6, '2025-12-06 08:31:01', NULL, 'Liabilities', 0, 0, 0, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, 0.00, 0.00, 2, 'employee', 2),
(26, 'Provisions', NULL, -6, '2025-12-06 08:32:29', NULL, 'Liabilities', 0, 0, 0, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, 0.00, 0.00, 2, 'employee', 2),
(27, 'Sundry Creditors', NULL, -6, '2025-12-06 08:33:06', NULL, 'Liabilities', 0, 0, 0, 'No Appropriation', 0, NULL, NULL, 0, NULL, NULL, NULL, 0.00, 0.00, 2, 'employee', 2),
(28, 'Stock-In-Hand', NULL, -5, '2025-12-06 08:33:50', NULL, 'Assets', 0, 0, 0, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, 0.00, 0.00, 2, 'employee', 2),
(29, 'Deposits (Assets)', NULL, -5, '2025-12-06 08:35:16', NULL, 'Assets', 0, 0, 0, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, 0.00, 0.00, 2, 'employee', 2),
(30, 'Loan and Advances', NULL, -5, '2025-12-06 08:35:49', NULL, 'Assets', 0, 0, 0, 'No Appropriation', 0, NULL, NULL, 0, NULL, NULL, NULL, 0.00, 0.00, 2, 'employee', 2),
(31, 'Sundry Debtors', NULL, -5, '2025-12-06 08:36:31', NULL, 'Assets', 0, 0, 0, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, 0.00, 0.00, 2, 'employee', 2),
(32, 'Cash In Hand', NULL, -5, '2025-12-06 08:36:49', NULL, 'Assets', 0, 0, 0, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, 0.00, 0.00, 2, 'employee', 2),
(39, 'Debit/Credit Note from Creditors', NULL, -15, '2026-01-31 16:18:25', NULL, 'Expenses', 0, 0, 0, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, 0.00, 0.00, 2, 'employee', 2),
(40, 'Debit/Credit Note to Debtors', NULL, -16, '2026-01-31 16:18:59', NULL, 'Income', 0, 0, 0, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, 2, 'employee', 2),
(41, 'cd', NULL, -4, '2026-02-27 14:42:46', 'cd ', 'Liabilities', 0, 0, 0, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, 8, 'employee', 5),
(42, 'Bank Accounts', NULL, -5, '2026-02-28 07:58:42', NULL, 'Assets', 0, 0, 0, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, 2, 'employee', 2);

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `id` int(11) NOT NULL,
  `order_id` varchar(255) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `company_id` int(11) DEFAULT NULL,
  `plan_id` int(11) DEFAULT NULL,
  `coupon_id` int(11) DEFAULT NULL,
  `amount` decimal(15,2) NOT NULL,
  `currency` varchar(10) DEFAULT 'INR',
  `status` varchar(50) DEFAULT 'created',
  `payment_gateway` varchar(50) DEFAULT NULL,
  `razorpay_order_id` varchar(255) DEFAULT NULL,
  `razorpay_payment_id` varchar(255) DEFAULT NULL,
  `response_json` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `discount_amount` decimal(10,2) DEFAULT 0.00,
  `final_amount` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `payments`
--

INSERT INTO `payments` (`id`, `order_id`, `user_id`, `company_id`, `plan_id`, `coupon_id`, `amount`, `currency`, `status`, `payment_gateway`, `razorpay_order_id`, `razorpay_payment_id`, `response_json`, `created_at`, `updated_at`, `discount_amount`, `final_amount`) VALUES
(45, 'plan_1_1774941927044', 2, 2, 1, NULL, 1.00, 'INR', 'success', NULL, 'order_SXkZ4TiwxN6Wv5', 'pay_SXkZKEIreY9WC1', '{\"body\":{\"razorpay_payment_id\":\"pay_SXkZKEIreY9WC1\",\"razorpay_order_id\":\"order_SXkZ4TiwxN6Wv5\",\"razorpay_signature\":\"e5378442b603388f2f615d973df157ca427ae2b4f98dd29f182c57d814e80e71\"},\"paymentDetails\":{\"id\":\"pay_SXkZKEIreY9WC1\",\"entity\":\"payment\",\"amount\":100,\"currency\":\"INR\",\"status\":\"captured\",\"order_id\":\"order_SXkZ4TiwxN6Wv5\",\"invoice_id\":null,\"international\":false,\"method\":\"upi\",\"amount_refunded\":0,\"refund_status\":null,\"captured\":true,\"description\":\"Subscription: Basic \",\"card_id\":null,\"bank\":null,\"wallet\":null,\"vpa\":\"ansarymustak@fbl\",\"email\":\"arvind12601@gmail.com\",\"contact\":\"+917004625048\",\"notes\":[],\"fee\":2,\"tax\":0,\"error_code\":null,\"error_description\":null,\"error_source\":null,\"error_step\":null,\"error_reason\":null,\"acquirer_data\":{\"rrn\":\"408054572400\",\"upi_transaction_id\":\"730B14777DF20FDF1C32F7803AF13032\"},\"created_at\":1774942048,\"upi\":{\"vpa\":\"ansarymustak@fbl\",\"flow\":\"collect\"}}}', '2026-03-31 12:55:27', '2026-03-31 12:55:59', 0.00, 1.00),
(46, 'plan_1_1774944696814', 2, 2, 1, NULL, 1.00, 'INR', 'success', NULL, 'order_SXlLpvXK3jND51', 'pay_SXlM6KrFXzSE5G', '{\"body\":{\"razorpay_payment_id\":\"pay_SXlM6KrFXzSE5G\",\"razorpay_order_id\":\"order_SXlLpvXK3jND51\",\"razorpay_signature\":\"3cd6b6ed4ca9a935763a954f56591dabe0159030aedd3d14dc9094c4d5add5b4\"},\"paymentDetails\":{\"id\":\"pay_SXlM6KrFXzSE5G\",\"entity\":\"payment\",\"amount\":100,\"currency\":\"INR\",\"status\":\"captured\",\"order_id\":\"order_SXlLpvXK3jND51\",\"invoice_id\":null,\"international\":false,\"method\":\"upi\",\"amount_refunded\":0,\"refund_status\":null,\"captured\":true,\"description\":\"Subscription: Basic \",\"card_id\":null,\"bank\":null,\"wallet\":null,\"vpa\":\"ansarymustak@fbl\",\"email\":\"arvind12601@gmail.com\",\"contact\":\"+917004625048\",\"notes\":[],\"fee\":2,\"tax\":0,\"error_code\":null,\"error_description\":null,\"error_source\":null,\"error_step\":null,\"error_reason\":null,\"acquirer_data\":{\"rrn\":\"784135527535\",\"upi_transaction_id\":\"FC93CED92CBDADF8AA33ABF5BC6E2F7A\"},\"created_at\":1774944818,\"upi\":{\"vpa\":\"ansarymustak@fbl\",\"flow\":\"collect\"}}}', '2026-03-31 13:41:37', '2026-03-31 13:42:09', 0.00, 1.00),
(47, 'plan_1_1774945053218', 2, 2, 1, NULL, 1.00, 'INR', 'success', NULL, 'order_SXlS6iqQ6zTkjN', 'pay_SXlSN2R2yDODIB', '{\"body\":{\"razorpay_payment_id\":\"pay_SXlSN2R2yDODIB\",\"razorpay_order_id\":\"order_SXlS6iqQ6zTkjN\",\"razorpay_signature\":\"53fe1e2d96325d766533f1728e114b1c2629e46369b7bd2f35b1cbcb67e77fc3\"},\"paymentDetails\":{\"id\":\"pay_SXlSN2R2yDODIB\",\"entity\":\"payment\",\"amount\":100,\"currency\":\"INR\",\"status\":\"captured\",\"order_id\":\"order_SXlS6iqQ6zTkjN\",\"invoice_id\":null,\"international\":false,\"method\":\"upi\",\"amount_refunded\":0,\"refund_status\":null,\"captured\":true,\"description\":\"Subscription: Basic \",\"card_id\":null,\"bank\":null,\"wallet\":null,\"vpa\":\"ansarymustak@fbl\",\"email\":\"arvind12601@gmail.com\",\"contact\":\"+917004625048\",\"notes\":[],\"fee\":2,\"tax\":0,\"error_code\":null,\"error_description\":null,\"error_source\":null,\"error_step\":null,\"error_reason\":null,\"acquirer_data\":{\"rrn\":\"598534115662\",\"upi_transaction_id\":\"FA37AF29F5739A5F47212AA310AA82ED\"},\"created_at\":1774945174,\"upi\":{\"vpa\":\"ansarymustak@fbl\",\"flow\":\"collect\"}}}', '2026-03-31 13:47:33', '2026-03-31 13:48:05', 0.00, 1.00),
(48, 'plan_1_1774955419507', 2, 2, 1, NULL, 1.00, 'INR', 'success', NULL, 'order_SXoOcrFlnCIpDH', 'pay_SXoOqfeIpjII5c', '{\"body\":{\"razorpay_payment_id\":\"pay_SXoOqfeIpjII5c\",\"razorpay_order_id\":\"order_SXoOcrFlnCIpDH\",\"razorpay_signature\":\"1fe4d78b31037e47462e83fbafe4db7ca407735c086128c747a8107114280cd7\"},\"paymentDetails\":{\"id\":\"pay_SXoOqfeIpjII5c\",\"entity\":\"payment\",\"amount\":100,\"currency\":\"INR\",\"status\":\"captured\",\"order_id\":\"order_SXoOcrFlnCIpDH\",\"invoice_id\":null,\"international\":false,\"method\":\"upi\",\"amount_refunded\":0,\"refund_status\":null,\"captured\":true,\"description\":\"Subscription: Basic \",\"card_id\":null,\"bank\":null,\"wallet\":null,\"vpa\":\"ansarymustak@fbl\",\"email\":\"arvind12601@gmail.com\",\"contact\":\"+917004625048\",\"notes\":[],\"fee\":2,\"tax\":0,\"error_code\":null,\"error_description\":null,\"error_source\":null,\"error_step\":null,\"error_reason\":null,\"acquirer_data\":{\"rrn\":\"220071857849\",\"upi_transaction_id\":\"A6554AE080BCD4573FE5644097C5414D\"},\"created_at\":1774955539,\"upi\":{\"vpa\":\"ansarymustak@fbl\",\"flow\":\"collect\"}}}', '2026-03-31 16:40:20', '2026-03-31 16:40:49', 0.00, 1.00),
(50, 'plan_1_1774957505980', 15, 14, 1, NULL, 1.00, 'INR', 'created', NULL, 'order_SXozRnia2oEylj', NULL, NULL, '2026-03-31 17:15:11', '2026-03-31 17:15:11', 0.00, 1.00),
(51, 'plan_1_1774957515544', 15, 14, 1, NULL, 1.00, 'INR', 'created', NULL, 'order_SXozWFm02S6FYi', NULL, NULL, '2026-03-31 17:15:15', '2026-03-31 17:15:15', 0.00, 1.00),
(52, 'plan_1_1774957530356', 15, 14, 1, NULL, 1.00, 'INR', 'success', NULL, 'order_SXozmWq7PG68sa', 'pay_SXozud9tqD3xOI', '{\"body\":{\"razorpay_payment_id\":\"pay_SXozud9tqD3xOI\",\"razorpay_order_id\":\"order_SXozmWq7PG68sa\",\"razorpay_signature\":\"c514ca882e606def4afa92a6e5d83b3ebd5da61876fcfd897145ff0fa40ed9b5\"},\"paymentDetails\":{\"id\":\"pay_SXozud9tqD3xOI\",\"entity\":\"payment\",\"amount\":100,\"currency\":\"INR\",\"status\":\"captured\",\"order_id\":\"order_SXozmWq7PG68sa\",\"invoice_id\":null,\"international\":false,\"method\":\"upi\",\"amount_refunded\":0,\"refund_status\":null,\"captured\":true,\"description\":\"Subscription: Basic \",\"card_id\":null,\"bank\":null,\"wallet\":null,\"vpa\":\"ansarymustak@fbl\",\"email\":\"z@gmail.com\",\"contact\":\"+917004625048\",\"notes\":[],\"fee\":2,\"tax\":0,\"error_code\":null,\"error_description\":null,\"error_source\":null,\"error_step\":null,\"error_reason\":null,\"acquirer_data\":{\"rrn\":\"927901523107\",\"upi_transaction_id\":\"F3C083374E94294277018DA59C63BFD9\"},\"created_at\":1774957644,\"upi\":{\"vpa\":\"ansarymustak@fbl\",\"flow\":\"collect\"}}}', '2026-03-31 17:15:30', '2026-03-31 17:15:54', 0.00, 1.00),
(53, 'plan_1_1774957597348', 2, 2, 1, NULL, 1.00, 'INR', 'success', NULL, 'order_SXp0xfnkGnhFTu', 'pay_SXp181ryvlFCUQ', '{\"body\":{\"razorpay_payment_id\":\"pay_SXp181ryvlFCUQ\",\"razorpay_order_id\":\"order_SXp0xfnkGnhFTu\",\"razorpay_signature\":\"247b66afaa49621daa4499d3737d7b91323b37cf4eacdd0130d5ec06cf188199\"},\"paymentDetails\":{\"id\":\"pay_SXp181ryvlFCUQ\",\"entity\":\"payment\",\"amount\":100,\"currency\":\"INR\",\"status\":\"captured\",\"order_id\":\"order_SXp0xfnkGnhFTu\",\"invoice_id\":null,\"international\":false,\"method\":\"upi\",\"amount_refunded\":0,\"refund_status\":null,\"captured\":true,\"description\":\"Subscription: Basic \",\"card_id\":null,\"bank\":null,\"wallet\":null,\"vpa\":\"ansarymustak@fbl\",\"email\":\"arvind12601@gmail.com\",\"contact\":\"+917004625048\",\"notes\":[],\"fee\":2,\"tax\":0,\"error_code\":null,\"error_description\":null,\"error_source\":null,\"error_step\":null,\"error_reason\":null,\"acquirer_data\":{\"rrn\":\"437925666856\",\"upi_transaction_id\":\"45A5F23DBAD8C5BC13C8D589CFEC0221\"},\"created_at\":1774957713,\"upi\":{\"vpa\":\"ansarymustak@fbl\",\"flow\":\"collect\"}}}', '2026-03-31 17:16:37', '2026-03-31 17:17:03', 0.00, 1.00),
(54, 'plan_1_1775112778531', 2, 11, 1, NULL, 1.00, 'INR', 'success', NULL, 'order_SYX53qAmgasMy9', 'pay_SYX5Jgy6PMmEwj', '{\"body\":{\"razorpay_payment_id\":\"pay_SYX5Jgy6PMmEwj\",\"razorpay_order_id\":\"order_SYX53qAmgasMy9\",\"razorpay_signature\":\"af9e2c8b738f8d4e50c29bb0ee8f7f0a54e3f3b78cc3727251a81fe4917e2a00\"},\"paymentDetails\":{\"id\":\"pay_SYX5Jgy6PMmEwj\",\"entity\":\"payment\",\"amount\":100,\"currency\":\"INR\",\"status\":\"captured\",\"order_id\":\"order_SYX53qAmgasMy9\",\"invoice_id\":null,\"international\":false,\"method\":\"upi\",\"amount_refunded\":0,\"refund_status\":null,\"captured\":true,\"description\":\"Subscription: Basic \",\"card_id\":null,\"bank\":null,\"wallet\":null,\"vpa\":\"ansarymustak@fbl\",\"email\":\"arvind12601@gmail.com\",\"contact\":\"+917004625048\",\"notes\":[],\"fee\":2,\"tax\":0,\"error_code\":null,\"error_description\":null,\"error_source\":null,\"error_step\":null,\"error_reason\":null,\"acquirer_data\":{\"rrn\":\"982669630399\",\"upi_transaction_id\":\"D7CED06CBAF677A7598A89DBCF22A62A\"},\"created_at\":1775112902,\"upi\":{\"vpa\":\"ansarymustak@fbl\",\"flow\":\"collect\"}}}', '2026-04-02 12:22:59', '2026-04-02 12:23:30', 0.00, 1.00),
(55, 'plan_1_1775113768491', 2, 2, 1, NULL, 1.00, 'INR', 'created', NULL, 'order_SYXMUDxgiNCKvk', NULL, NULL, '2026-04-02 12:39:28', '2026-04-02 12:39:28', 0.00, 1.00),
(56, 'plan_1_1775114356489', 2, 2, 1, NULL, 1.00, 'INR', 'success', NULL, 'order_SYXWq0A0WWUhxo', 'pay_SYXX3nAM2y5GlE', '{\"body\":{\"razorpay_payment_id\":\"pay_SYXX3nAM2y5GlE\",\"razorpay_order_id\":\"order_SYXWq0A0WWUhxo\",\"razorpay_signature\":\"31e778aeff311812a5ac508607781f72c189a7a8f5c3b563015a5caa85cb7bbb\"},\"paymentDetails\":{\"id\":\"pay_SYXX3nAM2y5GlE\",\"entity\":\"payment\",\"amount\":100,\"currency\":\"INR\",\"status\":\"captured\",\"order_id\":\"order_SYXWq0A0WWUhxo\",\"invoice_id\":null,\"international\":false,\"method\":\"upi\",\"amount_refunded\":0,\"refund_status\":null,\"captured\":true,\"description\":\"Subscription: Basic \",\"card_id\":null,\"bank\":null,\"wallet\":null,\"vpa\":\"ansarymustak@fbl\",\"email\":\"arvind12601@gmail.com\",\"contact\":\"+917004625048\",\"notes\":[],\"fee\":2,\"tax\":0,\"error_code\":null,\"error_description\":null,\"error_source\":null,\"error_step\":null,\"error_reason\":null,\"acquirer_data\":{\"rrn\":\"756626797067\",\"upi_transaction_id\":\"F636624B57AE94EF82BD46EB8718FB4C\"},\"created_at\":1775114478,\"upi\":{\"vpa\":\"ansarymustak@fbl\",\"flow\":\"collect\"}}}', '2026-04-02 12:49:16', '2026-04-02 12:49:50', 0.00, 1.00),
(57, 'plan_1_1775194781104', 2, 11, 1, NULL, 1.00, 'INR', 'success', NULL, 'order_SYuMmw1SiWD3L5', 'pay_SYuN2Klw6UgFK7', '{\"body\":{\"razorpay_payment_id\":\"pay_SYuN2Klw6UgFK7\",\"razorpay_order_id\":\"order_SYuMmw1SiWD3L5\",\"razorpay_signature\":\"7ddf4d39335281887c484fb74a9f2533a262704b38aa96df38209c8f8ea95369\"},\"paymentDetails\":{\"id\":\"pay_SYuN2Klw6UgFK7\",\"entity\":\"payment\",\"amount\":100,\"currency\":\"INR\",\"status\":\"captured\",\"order_id\":\"order_SYuMmw1SiWD3L5\",\"invoice_id\":null,\"international\":false,\"method\":\"upi\",\"amount_refunded\":0,\"refund_status\":null,\"captured\":true,\"description\":\"Subscription: Basic \",\"card_id\":null,\"bank\":null,\"wallet\":null,\"vpa\":\"ansarymustak@fbl\",\"email\":\"arvind12601@gmail.com\",\"contact\":\"+917004625048\",\"notes\":[],\"fee\":2,\"tax\":0,\"error_code\":null,\"error_description\":null,\"error_source\":null,\"error_step\":null,\"error_reason\":null,\"acquirer_data\":{\"rrn\":\"458517066189\",\"upi_transaction_id\":\"D40347AE9283C439FE6AFA40ABEB4DC2\"},\"created_at\":1775194906,\"upi\":{\"vpa\":\"ansarymustak@fbl\",\"flow\":\"collect\"}}}', '2026-04-03 11:09:41', '2026-04-03 11:10:15', 0.00, 1.00),
(58, 'plan_1_1775197872794', 2, 11, 1, NULL, 1.00, 'INR', 'success', NULL, 'order_SYvFDxd1EBsmje', 'pay_SYvFYOFu6RMhVv', '{\"body\":{\"razorpay_payment_id\":\"pay_SYvFYOFu6RMhVv\",\"razorpay_order_id\":\"order_SYvFDxd1EBsmje\",\"razorpay_signature\":\"ff50d5fbece5d711790c78bd7de192620a9a3dd1d8cfde51edbed3b9e43cab31\"},\"paymentDetails\":{\"id\":\"pay_SYvFYOFu6RMhVv\",\"entity\":\"payment\",\"amount\":100,\"currency\":\"INR\",\"status\":\"captured\",\"order_id\":\"order_SYvFDxd1EBsmje\",\"invoice_id\":null,\"international\":false,\"method\":\"upi\",\"amount_refunded\":0,\"refund_status\":null,\"captured\":true,\"description\":\"Subscription: Basic \",\"card_id\":null,\"bank\":null,\"wallet\":null,\"vpa\":\"ansarymustak@fbl\",\"email\":\"arvind12601@gmail.com\",\"contact\":\"+917004625048\",\"notes\":[],\"fee\":2,\"tax\":0,\"error_code\":null,\"error_description\":null,\"error_source\":null,\"error_step\":null,\"error_reason\":null,\"acquirer_data\":{\"rrn\":\"295947779930\",\"upi_transaction_id\":\"0464C41B2A8AEBBF87D264D52F2C3C11\"},\"created_at\":1775198002,\"upi\":{\"vpa\":\"ansarymustak@fbl\",\"flow\":\"collect\"}}}', '2026-04-03 12:01:13', '2026-04-03 12:01:48', 0.00, 1.00),
(59, 'plan_1_1775211658436', 2, 2, 1, NULL, 1.00, 'INR', 'created', NULL, 'order_SYz9wEIjc0RsET', NULL, NULL, '2026-04-03 15:50:59', '2026-04-03 15:50:59', 0.00, 1.00),
(60, 'plan_3_1775281248236', 2, 2, 3, NULL, 3.00, 'INR', 'success', NULL, 'order_SZIt9eU6MzFt6V', 'pay_SZItU2DbPOag9Q', '{\"body\":{\"razorpay_payment_id\":\"pay_SZItU2DbPOag9Q\",\"razorpay_order_id\":\"order_SZIt9eU6MzFt6V\",\"razorpay_signature\":\"53450153be5d52fa7672da56388d752aa6bf8a89b6d6e2300bcab6a8489d7a4a\"},\"paymentDetails\":{\"id\":\"pay_SZItU2DbPOag9Q\",\"entity\":\"payment\",\"amount\":300,\"currency\":\"INR\",\"status\":\"captured\",\"order_id\":\"order_SZIt9eU6MzFt6V\",\"invoice_id\":null,\"international\":false,\"method\":\"upi\",\"amount_refunded\":0,\"refund_status\":null,\"captured\":true,\"description\":\"Subscription: Enterprise\",\"card_id\":null,\"bank\":null,\"wallet\":null,\"vpa\":\"ansarymustak@fbl\",\"email\":\"arvind12601@gmail.com\",\"contact\":\"+917004625048\",\"notes\":[],\"fee\":8,\"tax\":2,\"error_code\":null,\"error_description\":null,\"error_source\":null,\"error_step\":null,\"error_reason\":null,\"acquirer_data\":{\"rrn\":\"869903771645\",\"upi_transaction_id\":\"F076EF37EC4BE7522CAEFF791730ACD0\"},\"created_at\":1775281268,\"upi\":{\"vpa\":\"ansarymustak@fbl\",\"flow\":\"collect\"}}}', '2026-04-04 11:10:48', '2026-04-04 11:11:25', 0.00, 3.00),
(61, 'plan_3_1775283634010', 2, 2, 3, NULL, 3.00, 'INR', 'success', NULL, 'order_SZJZ9i2pKTXGZ9', 'pay_SZJZQyVuqlNiQ0', '{\"body\":{\"razorpay_payment_id\":\"pay_SZJZQyVuqlNiQ0\",\"razorpay_order_id\":\"order_SZJZ9i2pKTXGZ9\",\"razorpay_signature\":\"2f852c99fcdc93ae30b3e836ffa941b2fe7403e311c9041838acf093fd4b8d30\"},\"paymentDetails\":{\"id\":\"pay_SZJZQyVuqlNiQ0\",\"entity\":\"payment\",\"amount\":300,\"currency\":\"INR\",\"status\":\"captured\",\"order_id\":\"order_SZJZ9i2pKTXGZ9\",\"invoice_id\":null,\"international\":false,\"method\":\"upi\",\"amount_refunded\":0,\"refund_status\":null,\"captured\":true,\"description\":\"Subscription: Enterprise\",\"card_id\":null,\"bank\":null,\"wallet\":null,\"vpa\":\"ansarymustak@fbl\",\"email\":\"arvind12601@gmail.com\",\"contact\":\"+917004625048\",\"notes\":[],\"fee\":8,\"tax\":2,\"error_code\":null,\"error_description\":null,\"error_source\":null,\"error_step\":null,\"error_reason\":null,\"acquirer_data\":{\"rrn\":\"377553093367\",\"upi_transaction_id\":\"AFC0BB5DE64C5BBF4B4F8BA145DA3E08\"},\"created_at\":1775283650,\"upi\":{\"vpa\":\"ansarymustak@fbl\",\"flow\":\"collect\"}}}', '2026-04-04 11:50:34', '2026-04-04 11:51:10', 0.00, 3.00),
(62, 'plan_3_1775285778271', 2, 2, 3, NULL, 3.00, 'INR', 'success', NULL, 'order_SZKAu4wbg9fQng', 'pay_SZKB8HhugMz1Dq', '{\"body\":{\"razorpay_payment_id\":\"pay_SZKB8HhugMz1Dq\",\"razorpay_order_id\":\"order_SZKAu4wbg9fQng\",\"razorpay_signature\":\"c21ce47ec31fb269dfbbe3cd1f2f43905a53d3165f5e4e1314d2eb307d14609d\"},\"paymentDetails\":{\"id\":\"pay_SZKB8HhugMz1Dq\",\"entity\":\"payment\",\"amount\":300,\"currency\":\"INR\",\"status\":\"captured\",\"order_id\":\"order_SZKAu4wbg9fQng\",\"invoice_id\":null,\"international\":false,\"method\":\"upi\",\"amount_refunded\":0,\"refund_status\":null,\"captured\":true,\"description\":\"Subscription: Enterprise\",\"card_id\":null,\"bank\":null,\"wallet\":null,\"vpa\":\"ansarymustak@fbl\",\"email\":\"arvind12601@gmail.com\",\"contact\":\"+917004625048\",\"notes\":[],\"fee\":8,\"tax\":2,\"error_code\":null,\"error_description\":null,\"error_source\":null,\"error_step\":null,\"error_reason\":null,\"acquirer_data\":{\"rrn\":\"860593399502\",\"upi_transaction_id\":\"DBA370A1170D503D5A7B5CBCBC77BC5F\"},\"created_at\":1775285792,\"upi\":{\"vpa\":\"ansarymustak@fbl\",\"flow\":\"collect\"}}}', '2026-04-04 12:26:18', '2026-04-04 12:26:48', 0.00, 3.00),
(63, 'plan_3_1775286697885', 2, 2, 3, NULL, 3.00, 'INR', 'success', NULL, 'order_SZKR5nq2qMDyKc', 'pay_SZKRQ38WjcY0BA', '{\"body\":{\"razorpay_payment_id\":\"pay_SZKRQ38WjcY0BA\",\"razorpay_order_id\":\"order_SZKR5nq2qMDyKc\",\"razorpay_signature\":\"b6fd0288b20765c4e16c01fd02cf84d4a19f0c7787fde8f3772bdaa42843dff1\"},\"paymentDetails\":{\"id\":\"pay_SZKRQ38WjcY0BA\",\"entity\":\"payment\",\"amount\":300,\"currency\":\"INR\",\"status\":\"captured\",\"order_id\":\"order_SZKR5nq2qMDyKc\",\"invoice_id\":null,\"international\":false,\"method\":\"upi\",\"amount_refunded\":0,\"refund_status\":null,\"captured\":true,\"description\":\"Subscription: Enterprise\",\"card_id\":null,\"bank\":null,\"wallet\":null,\"vpa\":\"ansarymustak@fbl\",\"email\":\"arvind12601@gmail.com\",\"contact\":\"+917004625048\",\"notes\":[],\"fee\":8,\"tax\":2,\"error_code\":null,\"error_description\":null,\"error_source\":null,\"error_step\":null,\"error_reason\":null,\"acquirer_data\":{\"rrn\":\"106361788809\",\"upi_transaction_id\":\"32FE3D1B8ED75BC0C971569E6C8C7865\"},\"created_at\":1775286717,\"upi\":{\"vpa\":\"ansarymustak@fbl\",\"flow\":\"collect\"}}}', '2026-04-04 12:41:38', '2026-04-04 12:42:12', 0.00, 3.00),
(64, 'plan_1_1775291891574', 2, 2, 1, NULL, 1.00, 'INR', 'success', NULL, 'order_SZLuX4bKX45VBs', 'pay_SZLumCjCjitjW2', '{\"body\":{\"razorpay_payment_id\":\"pay_SZLumCjCjitjW2\",\"razorpay_order_id\":\"order_SZLuX4bKX45VBs\",\"razorpay_signature\":\"1da7656dd62f10214bc90d1a3271e5de25113fe561511d640a0025d5d644f292\"},\"paymentDetails\":{\"id\":\"pay_SZLumCjCjitjW2\",\"entity\":\"payment\",\"amount\":100,\"currency\":\"INR\",\"status\":\"captured\",\"order_id\":\"order_SZLuX4bKX45VBs\",\"invoice_id\":null,\"international\":false,\"method\":\"upi\",\"amount_refunded\":0,\"refund_status\":null,\"captured\":true,\"description\":\"Subscription: Basic \",\"card_id\":null,\"bank\":null,\"wallet\":null,\"vpa\":\"ansarymustak@fbl\",\"email\":\"arvind12601@gmail.com\",\"contact\":\"+917004625048\",\"notes\":[],\"fee\":2,\"tax\":0,\"error_code\":null,\"error_description\":null,\"error_source\":null,\"error_step\":null,\"error_reason\":null,\"acquirer_data\":{\"rrn\":\"230610295115\",\"upi_transaction_id\":\"455961BADE9757DF43F3FEC14CF132E5\"},\"created_at\":1775291906,\"upi\":{\"vpa\":\"ansarymustak@fbl\",\"flow\":\"collect\"}}}', '2026-04-04 14:08:12', '2026-04-04 14:08:41', 0.00, 1.00),
(65, 'plan_1_1775292062917', 2, 2, 1, 2, 90.00, 'INR', 'success', NULL, 'order_SZLxXrAJJkaXD9', 'pay_SZLxlOH9FvjcJJ', '{\"body\":{\"razorpay_payment_id\":\"pay_SZLxlOH9FvjcJJ\",\"razorpay_order_id\":\"order_SZLxXrAJJkaXD9\",\"razorpay_signature\":\"03ac4eb923cd5aafa5d4144253ebcc32fd4aabc9e95585fef33bd13aa3f70d5a\"},\"paymentDetails\":{\"id\":\"pay_SZLxlOH9FvjcJJ\",\"entity\":\"payment\",\"amount\":9000,\"currency\":\"INR\",\"status\":\"captured\",\"order_id\":\"order_SZLxXrAJJkaXD9\",\"invoice_id\":null,\"international\":false,\"method\":\"upi\",\"amount_refunded\":0,\"refund_status\":null,\"captured\":true,\"description\":\"Subscription: Basic  (Coupon: OSDF4)\",\"card_id\":null,\"bank\":null,\"wallet\":null,\"vpa\":\"ansarymustak@fbl\",\"email\":\"arvind12601@gmail.com\",\"contact\":\"+917004625048\",\"notes\":[],\"fee\":212,\"tax\":32,\"error_code\":null,\"error_description\":null,\"error_source\":null,\"error_step\":null,\"error_reason\":null,\"acquirer_data\":{\"rrn\":\"473591385476\",\"upi_transaction_id\":\"F8DC0561C361BA21CD70D02727651D21\"},\"created_at\":1775292076,\"upi\":{\"vpa\":\"ansarymustak@fbl\",\"flow\":\"collect\"}}}', '2026-04-04 14:11:03', '2026-04-04 14:11:32', 10.00, 90.00);

-- --------------------------------------------------------

--
-- Table structure for table `purchase_history`
--

CREATE TABLE `purchase_history` (
  `id` int(11) NOT NULL,
  `itemName` varchar(255) DEFAULT NULL,
  `hsnCode` varchar(50) DEFAULT NULL,
  `batchNumber` varchar(255) DEFAULT NULL,
  `purchaseQuantity` int(11) DEFAULT NULL,
  `purchaseDate` date DEFAULT NULL,
  `companyId` varchar(100) DEFAULT NULL,
  `ownerType` varchar(50) DEFAULT NULL,
  `ownerId` varchar(100) DEFAULT NULL,
  `type` varchar(50) DEFAULT 'purchase',
  `rate` decimal(10,2) DEFAULT NULL,
  `voucherNumber` varchar(100) DEFAULT NULL,
  `godownId` int(11) DEFAULT NULL,
  `mrp` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `purchase_history`
--

INSERT INTO `purchase_history` (`id`, `itemName`, `hsnCode`, `batchNumber`, `purchaseQuantity`, `purchaseDate`, `companyId`, `ownerType`, `ownerId`, `type`, `rate`, `voucherNumber`, `godownId`, `mrp`) VALUES
(142, 'Mobile', '1111', NULL, 10, '2026-04-07', '2', 'employee', '2', 'purchase', 10.00, 'PRV/26-27/000001', NULL, NULL);

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
  `owner_id` int(11) NOT NULL,
  `tdsTotal` decimal(10,2) DEFAULT 0.00,
  `mode` varchar(50) DEFAULT 'item-invoice'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `purchase_vouchers`
--

INSERT INTO `purchase_vouchers` (`id`, `number`, `date`, `supplierInvoiceDate`, `narration`, `partyId`, `referenceNo`, `dispatchDocNo`, `dispatchThrough`, `destination`, `purchaseLedgerId`, `subtotal`, `cgstTotal`, `sgstTotal`, `igstTotal`, `discountTotal`, `total`, `company_id`, `owner_type`, `owner_id`, `tdsTotal`, `mode`) VALUES
(104, 'PRV/26-27/000001', '2026-04-07', '2026-04-07', NULL, 119, '1', NULL, NULL, NULL, NULL, 100.00, 9.00, 9.00, 0.00, 0.00, 118.00, 2, 'employee', 2, 0.00, 'item-invoice');

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
  `godownId` int(11) DEFAULT NULL,
  `purchaseLedgerId` int(11) DEFAULT NULL,
  `tdsRate` decimal(10,2) DEFAULT 0.00,
  `discountLedgerId` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `purchase_voucher_items`
--

INSERT INTO `purchase_voucher_items` (`id`, `voucherId`, `itemId`, `quantity`, `rate`, `discount`, `cgstRate`, `sgstRate`, `igstRate`, `amount`, `godownId`, `purchaseLedgerId`, `tdsRate`, `discountLedgerId`) VALUES
(144, 104, 39, 10.00, 10.00, 0.00, 67.00, 68.00, 0.00, 100.00, NULL, 93, 0.00, 0);

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

-- --------------------------------------------------------

--
-- Table structure for table `sales_types`
--

CREATE TABLE `sales_types` (
  `id` int(11) NOT NULL,
  `sales_type` varchar(50) NOT NULL,
  `type` varchar(50) NOT NULL,
  `prefix` varchar(50) NOT NULL,
  `suffix` varchar(50) NOT NULL,
  `current_no` int(11) NOT NULL DEFAULT 1,
  `company_id` varchar(100) DEFAULT NULL,
  `owner_type` varchar(50) DEFAULT NULL,
  `owner_id` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `sales_types`
--

INSERT INTO `sales_types` (`id`, `sales_type`, `type`, `prefix`, `suffix`, `current_no`, `company_id`, `owner_type`, `owner_id`, `created_at`, `updated_at`) VALUES
(6, 'B2b', 'Sales', 'omR', '25-26', 1, '2', 'employee', '2', '2026-01-21 15:26:34', '2026-02-18 14:06:51'),
(7, 'B2c Sales ', 'Sales', 'Om', '25-26', 2, '2', 'employee', '2', '2026-02-03 02:56:52', '2026-04-06 10:44:27'),
(8, 'b2b', 'Sales', 'ay', '26-27', 9, '2', 'employee', '2', '2026-04-04 05:01:36', '2026-04-07 06:47:12');

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
  `supplierInvoiceDate` date DEFAULT NULL,
  `sales_type_id` int(11) DEFAULT NULL,
  `bill_no` varchar(100) DEFAULT NULL,
  `mode` varchar(50) DEFAULT 'item-invoice',
  `approxDistance` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sales_voucher_items`
--

CREATE TABLE `sales_voucher_items` (
  `id` int(11) NOT NULL,
  `voucherId` int(11) DEFAULT NULL,
  `salesLedgerId` int(11) DEFAULT NULL,
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
  `godownId` varchar(64) DEFAULT NULL,
  `discountLedgerId` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `sales_voucher_items`
--

INSERT INTO `sales_voucher_items` (`id`, `voucherId`, `salesLedgerId`, `itemId`, `quantity`, `rate`, `amount`, `cgstRate`, `sgstRate`, `igstRate`, `discount`, `hsnCode`, `batchNumber`, `godownId`, `discountLedgerId`) VALUES
(43, 21, 95, 26, 50.00, 250.00, 12500.00, 0.00, 0.00, 99.00, 0.00, '5555', '', '4', 0),
(45, 22, 95, 28, 20.00, 2500.00, 50000.00, 0.00, 0.00, 99.00, 0.00, '9525', '', '5', 0);

-- --------------------------------------------------------

--
-- Table structure for table `sale_history`
--

CREATE TABLE `sale_history` (
  `id` int(11) NOT NULL,
  `companyId` int(11) NOT NULL,
  `ownerType` varchar(50) NOT NULL,
  `ownerId` int(11) NOT NULL,
  `itemId` int(11) DEFAULT NULL,
  `quantity` decimal(15,2) DEFAULT 0.00,
  `rate` decimal(15,2) DEFAULT 0.00,
  `value` decimal(15,2) DEFAULT 0.00,
  `movementType` varchar(50) DEFAULT NULL,
  `movementDate` datetime DEFAULT current_timestamp(),
  `createdAt` datetime DEFAULT current_timestamp(),
  `itemName` varchar(255) DEFAULT NULL,
  `hsnCode` varchar(50) DEFAULT NULL,
  `batchNumber` varchar(255) DEFAULT NULL,
  `qtyChange` int(11) DEFAULT NULL,
  `voucherNumber` varchar(100) DEFAULT NULL,
  `godownId` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `scenarios`
--

CREATE TABLE `scenarios` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `include_actuals` tinyint(1) DEFAULT 0,
  `included_voucher_types` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `excluded_voucher_types` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `from_date` date DEFAULT NULL,
  `to_date` date DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL,
  `company_id` int(11) NOT NULL,
  `owner_type` varchar(50) NOT NULL,
  `owner_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `set_profit`
--

CREATE TABLE `set_profit` (
  `id` int(11) NOT NULL,
  `customer_type` varchar(50) DEFAULT NULL,
  `method` varchar(50) DEFAULT NULL,
  `value` decimal(10,2) DEFAULT NULL,
  `owner_type` varchar(50) NOT NULL,
  `owner_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `wholesale_method` varchar(50) DEFAULT NULL,
  `wholesale_value` decimal(10,2) DEFAULT NULL,
  `retailer_method` varchar(50) DEFAULT NULL,
  `retailer_value` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `set_profit`
--

INSERT INTO `set_profit` (`id`, `customer_type`, `method`, `value`, `owner_type`, `owner_id`, `created_at`, `wholesale_method`, `wholesale_value`, `retailer_method`, `retailer_value`) VALUES
(1, 'retailer', 'profit_percentage', 3.00, 'employee', 2, '2025-12-09 13:42:39', 'profit_percentage', 57.00, 'profit_percentage', 13.00);

-- --------------------------------------------------------

--
-- Table structure for table `stock_attributes`
--

CREATE TABLE `stock_attributes` (
  `id` int(11) NOT NULL,
  `stock_item_id` int(11) NOT NULL,
  `attribute_id` int(11) NOT NULL,
  `value` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
  `owner_type` varchar(50) NOT NULL,
  `owner_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `stock_categories`
--

INSERT INTO `stock_categories` (`id`, `name`, `parent`, `description`, `created_at`, `updated_at`, `company_id`, `owner_type`, `owner_id`) VALUES
('SC-1765010891928', 'cement', '7', NULL, '2025-12-06 08:48:15', '2025-12-07 06:06:44', 2, 'employee', 2),
('SC-1765010907862', 'Bar ', '7', 'This is Bar.', '2025-12-06 08:48:31', '2025-12-26 12:33:45', 2, 'employee', 2),
('SC-1765286010820', 'FMCG', '8', NULL, '2025-12-09 13:13:30', '2025-12-09 13:13:30', 2, 'employee', 2),
('SC-1765972607794', 'Godown', '4', 'This is Godown\n', '2025-12-17 11:56:51', '2025-12-17 11:56:51', 1, 'employee', 1),
('SC-1765972677218', 'Godown2', '11', 'This is Godown2\n', '2025-12-17 11:58:00', '2025-12-17 11:58:00', 1, 'employee', 1),
('SC-1766023751037', 'chemical', '7', NULL, '2025-12-18 02:09:10', '2025-12-18 02:09:10', 2, 'employee', 2),
('SC-1767713361869', 'Gold', '10', NULL, '2026-01-06 15:29:21', '2026-01-13 13:37:23', 2, 'employee', 2),
('SC-1768315705996', 'ELECTRONIC', '7', NULL, '2026-01-13 14:48:25', '2026-01-13 14:48:25', 2, 'employee', 2);

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
  `owner_type` varchar(50) NOT NULL,
  `owner_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `stock_groups`
--

INSERT INTO `stock_groups` (`id`, `name`, `parent`, `should_quantities_be_added`, `set_alter_hsn`, `hsn_sac_classification_id`, `hsn_code`, `hsn_description`, `set_alter_gst`, `gst_classification_id`, `taxability`, `gst_rate`, `cess`, `created_at`, `company_id`, `owner_type`, `owner_id`) VALUES
(7, '18% goods', NULL, 1, 0, NULL, NULL, NULL, 0, NULL, 'Taxable', 0.00, 0.00, '2025-12-06 08:47:28', 2, 'employee', 2),
(8, '5% goods', '', 1, 0, '', '', '', 0, '', 'Taxable', 0.00, 0.00, '2025-12-06 08:47:40', 2, 'employee', 2),
(9, 'EXEMPT', NULL, 1, 0, NULL, NULL, NULL, 0, NULL, 'Taxable', 0.00, 0.00, '2025-12-09 13:17:06', 2, 'employee', 2),
(10, '3% GOODS', NULL, 1, 0, NULL, NULL, NULL, 0, NULL, 'Taxable', 0.00, 0.00, '2025-12-09 13:17:31', 2, 'employee', 2),
(11, '18%', 'SC-1765972607794', 1, 0, NULL, NULL, NULL, 0, NULL, 'Taxable', 0.00, 0.00, '2025-12-17 11:57:28', 1, 'employee', 1);

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
  `owner_type` varchar(50) NOT NULL,
  `owner_id` int(11) NOT NULL,
  `barcode` varchar(200) NOT NULL,
  `batches` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `type` varchar(50) DEFAULT 'opening',
  `categoryId` varchar(50) DEFAULT NULL,
  `gstLedgerId` int(11) DEFAULT NULL,
  `cgstLedgerId` int(11) DEFAULT NULL,
  `sgstLedgerId` int(11) DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL,
  `is_visible` tinyint(1) DEFAULT 1
) ;

--
-- Dumping data for table `stock_items`
--

INSERT INTO `stock_items` (`id`, `name`, `stockGroupId`, `unit`, `openingBalance`, `openingValue`, `hsnCode`, `gstRate`, `taxType`, `standardPurchaseRate`, `standardSaleRate`, `enableBatchTracking`, `allowNegativeStock`, `maintainInPieces`, `secondaryUnit`, `createdAt`, `batchNumber`, `batchExpiryDate`, `batchManufacturingDate`, `company_id`, `owner_type`, `owner_id`, `barcode`, `batches`, `type`, `categoryId`, `gstLedgerId`, `cgstLedgerId`, `sgstLedgerId`, `image`, `is_visible`) VALUES
(39, 'Mobile', NULL, '6', 10.00, 0.00, '1111', 0.00, 'Taxable', 0.00, 0.00, 1, 1, 1, NULL, '2026-04-07 07:58:52', NULL, NULL, NULL, 2, 'employee', 2, '8902177967518', '[]', 'opening', 'SC-1768315705996', 118, 67, 68, NULL, 1);

-- --------------------------------------------------------

--
-- Table structure for table `stock_item_attributes`
--

CREATE TABLE `stock_item_attributes` (
  `id` int(11) NOT NULL,
  `stock_item_id` int(11) NOT NULL,
  `attribute_name` varchar(100) DEFAULT NULL,
  `attribute_value` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
  `owner_type` varchar(50) NOT NULL,
  `owner_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `stock_purchase`
--

CREATE TABLE `stock_purchase` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `stockGroupId` int(11) DEFAULT NULL,
  `categoryId` int(11) DEFAULT NULL,
  `unit` varchar(50) NOT NULL,
  `openingBalance` decimal(15,2) DEFAULT 0.00,
  `openingValue` decimal(15,2) DEFAULT 0.00,
  `hsnCode` varchar(50) DEFAULT NULL,
  `gstRate` decimal(5,2) DEFAULT 0.00,
  `taxType` varchar(50) DEFAULT NULL,
  `standardPurchaseRate` decimal(15,2) DEFAULT 0.00,
  `standardSaleRate` decimal(15,2) DEFAULT 0.00,
  `enableBatchTracking` tinyint(1) DEFAULT 0,
  `allowNegativeStock` tinyint(1) DEFAULT 0,
  `maintainInPieces` tinyint(1) DEFAULT 0,
  `secondaryUnit` varchar(50) DEFAULT NULL,
  `barcode` varchar(100) DEFAULT NULL,
  `company_id` int(11) DEFAULT NULL,
  `owner_type` varchar(50) DEFAULT NULL,
  `owner_id` int(11) DEFAULT NULL,
  `batches` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`batches`)),
  `type` varchar(50) DEFAULT 'purchase',
  `createdAt` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `stock_purchase`
--

INSERT INTO `stock_purchase` (`id`, `name`, `stockGroupId`, `categoryId`, `unit`, `openingBalance`, `openingValue`, `hsnCode`, `gstRate`, `taxType`, `standardPurchaseRate`, `standardSaleRate`, `enableBatchTracking`, `allowNegativeStock`, `maintainInPieces`, `secondaryUnit`, `barcode`, `company_id`, `owner_type`, `owner_id`, `batches`, `type`, `createdAt`) VALUES
(1, 'Acc', NULL, NULL, '7', 0.00, 0.00, NULL, 0.00, 'Taxable', 0.00, 0.00, 0, 0, 0, NULL, NULL, 2, 'employee', 2, '[{\"batchName\": \"154522\", \"openingRate\": 0, \"openingValue\": 0, \"batchQuantity\": 0, \"batchExpiryDate\": null, \"batchManufacturingDate\": null}]', 'purchase', '2025-12-15 15:01:20'),
(2, 'Acc', NULL, NULL, '7', 0.00, 0.00, NULL, 0.00, 'Taxable', 0.00, 0.00, 0, 0, 0, NULL, NULL, 2, 'employee', 2, '[{\"batchName\": \"150000\", \"openingRate\": 0, \"openingValue\": 0, \"batchQuantity\": 0, \"batchExpiryDate\": null, \"batchManufacturingDate\": null}]', 'purchase', '2025-12-15 15:01:46'),
(3, 'Acc', NULL, NULL, '7', 0.00, 0.00, '1111', 0.00, 'Taxable', 0.00, 0.00, 0, 0, 0, NULL, NULL, 2, 'employee', 2, '[{\"batchName\": \"064400\", \"openingRate\": 0, \"openingValue\": 0, \"batchQuantity\": 0, \"batchExpiryDate\": null, \"batchManufacturingDate\": null}]', 'purchase', '2026-01-07 13:23:13'),
(4, 'Acc', NULL, NULL, '7', 0.00, 0.00, '1111', 0.00, 'Taxable', 0.00, 0.00, 0, 0, 0, NULL, NULL, 2, 'employee', 2, '[{\"batchName\": null, \"openingRate\": 0, \"openingValue\": 0, \"batchQuantity\": 0, \"batchExpiryDate\": null, \"batchManufacturingDate\": null}]', 'purchase', '2026-01-08 06:40:48'),
(5, 'Acc', NULL, NULL, '7', 0.00, 0.00, '1111', 0.00, 'Taxable', 0.00, 0.00, 0, 0, 0, NULL, NULL, 2, 'employee', 2, '[{\"batchName\": null, \"openingRate\": 0, \"openingValue\": 0, \"batchQuantity\": 0, \"batchExpiryDate\": null, \"batchManufacturingDate\": null}]', 'purchase', '2026-01-08 06:40:48');

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
  `owner_type` varchar(50) NOT NULL,
  `owner_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `stock_units`
--

INSERT INTO `stock_units` (`id`, `name`, `symbol`, `created_at`, `company_id`, `owner_type`, `owner_id`) VALUES
(5, 'Kilogram', 'Kg', '2025-12-06 11:30:17', 2, 'employee', 2),
(6, 'bags', 'bag', '2025-12-07 06:08:26', 2, 'employee', 2),
(7, 'CARTOON', 'CN', '2025-12-09 13:15:07', 2, 'employee', 2),
(8, 'Kilo', '$', '2025-12-17 11:58:38', 1, 'employee', 1),
(9, 'PCS', 'PIECIS', '2026-01-13 14:49:17', 2, 'employee', 2),
(10, 'Gram', 'G', '2026-01-27 13:10:49', 2, 'employee', 2);

-- --------------------------------------------------------

--
-- Table structure for table `subscription_coupons`
--

CREATE TABLE `subscription_coupons` (
  `id` int(11) NOT NULL,
  `code` varchar(50) NOT NULL,
  `discountType` enum('percentage','fixed') NOT NULL,
  `discountValue` decimal(10,2) NOT NULL,
  `applicableDuration` enum('monthly','yearly','all') DEFAULT 'all',
  `expiryDate` date DEFAULT NULL,
  `maxUses` int(11) DEFAULT 0,
  `currentUses` int(11) DEFAULT 0,
  `isActive` tinyint(1) DEFAULT 1,
  `createdAt` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `subscription_coupons`
--

INSERT INTO `subscription_coupons` (`id`, `code`, `discountType`, `discountValue`, `applicableDuration`, `expiryDate`, `maxUses`, `currentUses`, `isActive`, `createdAt`) VALUES
(2, 'OSDF4', 'percentage', 10.00, 'all', '2026-04-05', 0, 0, 1, '2026-04-04 08:40:48');

-- --------------------------------------------------------

--
-- Table structure for table `subscription_plans`
--

CREATE TABLE `subscription_plans` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `duration` enum('monthly','yearly') NOT NULL,
  `features` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`features`)),
  `isActive` tinyint(1) DEFAULT 1,
  `createdAt` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `subscription_plans`
--

INSERT INTO `subscription_plans` (`id`, `name`, `price`, `duration`, `features`, `isActive`, `createdAt`) VALUES
(1, 'Basic ', 100.00, 'yearly', '[\"500 voucher \"]', 1, '2026-03-26 12:13:28'),
(2, 'Professional', 200.00, 'yearly', '[\"Up to 100 transactions/month\",\"Basic GST reports\",\"Single user access\"]', 1, '2026-03-26 12:20:10'),
(3, 'Enterprise', 300.00, 'yearly', '[\"Everything in Professional\",\"Unlimited users\",\"Custom integrations\",\"Dedicated account manager\"]', 1, '2026-03-26 12:21:09');

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
(1, 'admin@tallyprime.com', '$2b$10$hF6UnAaSjwrRamxUYkZ0.O7NnE8/h7orZMVWs8qGP/Z9op4ZEFjSO', '2026-02-28 04:34:03'),
(2, 'admin@apnabook.com', '$2b$10$AB92kPbJ1qZC/APaeyjZVePUMUavI.oetWk.fBczvU31emJE38Y2W', '2026-03-19 06:23:42');

-- --------------------------------------------------------

--
-- Table structure for table `tbca`
--

CREATE TABLE `tbca` (
  `fdSiNo` int(11) NOT NULL,
  `fdname` varchar(255) NOT NULL,
  `fdphone` varchar(20) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `fdpassword` varchar(255) NOT NULL,
  `fdstatus` enum('active','suspended') DEFAULT 'active',
  `fdlast_login` datetime DEFAULT current_timestamp(),
  `fdterms_file` varchar(255) DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `tbca`
--

INSERT INTO `tbca` (`fdSiNo`, `fdname`, `fdphone`, `email`, `fdpassword`, `fdstatus`, `fdlast_login`, `fdterms_file`) VALUES
(1, 'OM CA Ranchi', '1234567890', 'om@gmail.com', '$2b$10$oxmUCuDta8anJAvyCju57u4DAY07RGdHuegbjgn2XgufbkM5ZxjMW', 'active', '2026-03-02 11:41:31', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `tbcaemployeecompanies`
--

CREATE TABLE `tbcaemployeecompanies` (
  `id` int(11) NOT NULL,
  `ca_employee_id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbcaemployees`
--

CREATE TABLE `tbcaemployees` (
  `id` int(11) NOT NULL,
  `ca_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `adhar` varchar(20) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
  `fdAccountantName` varchar(100) DEFAULT NULL,
  `tan_number` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbcompanies`
--

INSERT INTO `tbcompanies` (`id`, `name`, `financial_year`, `books_beginning_year`, `address`, `pin`, `phone_number`, `email`, `pan_number`, `gst_number`, `state`, `country`, `tax_type`, `employee_id`, `vault_password`, `created_at`, `vat_number`, `fdAccountType`, `fdAccountantName`, `tan_number`) VALUES
(2, 'OM ENTERPRISES', '2025-26', '01-04-2025', 'BARWADDA DHANBAD', '826010', '7004625048', 'arvind12601@gmail.com', 'BDAPP6208H', '20BDAPP6208H2ZY', 'Jharkhand(20)', 'India', 'GST', 2, NULL, '2025-12-06 05:50:08', NULL, 'accountant', 'OM CA Ranchi', 'Rchc00337f'),
(11, 'OmG', '2025-26', '2026', 'Ranchi ', '834001', '1234567890', 'arvind12601@gmail.com', 'BDAPP6208H', '27ABCDE1234F1Z5', 'Jharkhand(20)', 'India', 'GST', 2, NULL, '2026-03-18 06:59:44', NULL, 'self', NULL, 'ABCDE1234G'),
(12, 'Dummy', '2025-26', '2026', 'ranchi', '834001', '1234567890', 'd@gmail.com', 'ABCDE1234M', '27ABCDE1234F1Z5', 'Jharkhand(20)', 'India', 'GST', 12, NULL, '2026-03-19 07:04:35', NULL, 'self', NULL, 'ABCDE1234G'),
(14, 'aaaaa', '2025-26', '2026', 'Ranchi ', '834001', '1234567890', 'z@gmail.com', 'ABCDE1234F', '27ABCDE1234F1Z5', 'Jharkhand(20)', 'India', 'GST', 15, NULL, '2026-03-31 11:42:35', NULL, 'self', NULL, '');

-- --------------------------------------------------------

--
-- Table structure for table `tbemployees`
--

CREATE TABLE `tbemployees` (
  `id` int(11) NOT NULL,
  `firstName` varchar(100) DEFAULT NULL,
  `lastName` varchar(100) NOT NULL,
  `pan` varchar(20) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phoneNumber` varchar(100) NOT NULL,
  `password` varchar(255) DEFAULT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `userLimit` int(11) DEFAULT 1,
  `fdterms_file` varchar(255) DEFAULT NULL,
  `trial_started_at` datetime DEFAULT NULL,
  `trial_expires_at` datetime DEFAULT NULL,
  `is_purchased` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbemployees`
--

INSERT INTO `tbemployees` (`id`, `firstName`, `lastName`, `pan`, `address`, `email`, `phoneNumber`, `password`, `token`, `created_at`, `userLimit`, `fdterms_file`, `trial_started_at`, `trial_expires_at`, `is_purchased`) VALUES
(2, 'a', 'k', 'BDAPP6208H', 'Ranchi ,jharkhand', 'arvind12601@gmail.com', '7004625048', '$2b$10$RDmFPENR/2KXseWdGS6RMeK6vDAkmvnxPKBYWY8Vp5lDkM/koOqHC', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFydmluZDEyNjAxQGdtYWlsLmNvbSIsImlhdCI6MTc2NTAwMDExOCwiZXhwIjoxNzY1NjA0OTE4fQ.ZTtFe7TQ1cc0thccpWaFL_gGaNPrZS4w0VteOfiHCeA', '2025-12-06 05:48:38', 5, NULL, '2026-03-16 15:16:02', '2026-04-05 15:16:02', 0),
(12, 'Damy', 'Data', 'ABCDE1234M', 'Ranchi', 'd@gmail.com', '1234567890', '$2b$10$qP/1mZvNBIPAxXxMUfjwg.uHoes0baBzHwtneZF6SFlLHmlX9XQbi', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImRAZ21haWwuY29tIiwiaWF0IjoxNzczOTAzODEzLCJleHAiOjE3NzQ1MDg2MTN9.CgklT5_cRoISNfVisZwkGQD6iSxmwPfVfjSbkPKDSGE', '2026-03-19 07:03:33', 1, NULL, NULL, NULL, 0),
(14, 'Abc', 'Abc', 'ABCDE1234D', 'Ranchi', 'abc@gmail.com', '1234567890', '$2b$10$Fo4gx3PdIKXcC3IfXVGnT.ainywOm8WNweu5dZ1VtVm/p7dbM1cie', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFiY0BnbWFpbC5jb20iLCJpYXQiOjE3NzQ5MzM5ODMsImV4cCI6MTc3NTUzODc4M30.d4vvYwLhIQBfYCHsrvX9tzvmIkpQWwlDwfC3eI9-eIE', '2026-03-31 05:13:03', 1, NULL, NULL, NULL, 0),
(15, 'zz', 'Data', 'ABCDE1234F', 'zzz', 'ayushsingh0455@gmail.com', '1234567890', '$2b$10$YM/k5R6n04QJt9wMgOsj4eG0yKJuKvgU.wUc3vxo4rQsjCYxwQJhi', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InpAZ21haWwuY29tIiwiaWF0IjoxNzc0OTU3MDkxLCJleHAiOjE3NzU1NjE4OTF9.7eB2_zX9Lu6n6xk6-OY79xVjxm9xDVZEoezNBfQozbU', '2026-03-31 11:38:11', 1, NULL, NULL, NULL, 0);

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

-- --------------------------------------------------------

--
-- Table structure for table `tbpermissions`
--

CREATE TABLE `tbpermissions` (
  `permission_id` int(11) NOT NULL,
  `permission_name` varchar(50) NOT NULL,
  `description` text DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbrolepermissions`
--

CREATE TABLE `tbrolepermissions` (
  `role_id` int(11) NOT NULL,
  `screen_id` int(11) NOT NULL,
  `permission_id` int(11) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbroles`
--

CREATE TABLE `tbroles` (
  `role_id` int(11) NOT NULL,
  `role_name` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `is_system` tinyint(4) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbscreens`
--

CREATE TABLE `tbscreens` (
  `screen_id` int(11) NOT NULL,
  `screen_name` varchar(100) NOT NULL,
  `screen_path` varchar(255) DEFAULT NULL,
  `parent_id` int(11) DEFAULT NULL,
  `sort_order` int(11) DEFAULT 0
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbscreens_old`
--

CREATE TABLE `tbscreens_old` (
  `screen_id` int(11) NOT NULL,
  `screen_name` varchar(100) NOT NULL,
  `screen_path` varchar(255) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbuserroles`
--

CREATE TABLE `tbuserroles` (
  `user_id` int(11) NOT NULL,
  `role_id` int(11) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbusers`
--

CREATE TABLE `tbusers` (
  `id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `role_id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `email` varchar(250) NOT NULL,
  `username` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `phone` varchar(20) DEFAULT NULL,
  `department` varchar(100) DEFAULT NULL,
  `status` enum('active','inactive','suspended') DEFAULT 'active',
  `last_login` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbusers`
--

INSERT INTO `tbusers` (`id`, `company_id`, `role_id`, `employee_id`, `email`, `username`, `password`, `created_at`, `phone`, `department`, `status`, `last_login`) VALUES
(1, 9, 0, 7, 'dd@gmail.com', 'DD', '$2b$10$Cgy1seN54gJ45o90ROe4Vu/5p3Fy.awNZqAYi4Y2Ycy4amkeLZEHC', '2026-02-24 05:48:23', NULL, NULL, 'active', NULL),
(4, 2, 0, 2, 'arvind12601@gmail.com', 'a@gmail.com', '$2b$10$08mIpqSf08chRvjZebXxpeOF7vuqlN0j1wRazGYD6y6Z52w2xGcHG', '2026-03-18 08:22:33', NULL, NULL, 'active', NULL);

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
  `item_id` int(11) DEFAULT NULL,
  `ledger_name` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
(5, 'payment', 'PV/25-26/01/000001', '2026-01-24', NULL, '7768', '2026-01-24', NULL, '8', 'employee', '5');

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

-- --------------------------------------------------------

--
-- Table structure for table `voucher_sequences`
--

CREATE TABLE `voucher_sequences` (
  `id` bigint(20) NOT NULL,
  `company_id` bigint(20) NOT NULL,
  `owner_type` varchar(50) NOT NULL,
  `owner_id` bigint(20) NOT NULL,
  `voucher_type` varchar(50) NOT NULL,
  `financial_year` varchar(9) NOT NULL,
  `month` tinyint(4) NOT NULL,
  `current_no` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `voucher_sequences`
--

INSERT INTO `voucher_sequences` (`id`, `company_id`, `owner_type`, `owner_id`, `voucher_type`, `financial_year`, `month`, `current_no`, `created_at`, `updated_at`) VALUES
(1, 2, 'employee', 2, 'PRV', '25-26', 1, 19, '2026-01-09 15:21:29', '2026-01-30 15:32:02'),
(2, 2, 'employee', 2, 'payment', '25-26', 1, 7, '2026-01-10 03:16:01', '2026-01-31 16:07:43'),
(3, 8, 'employee', 5, 'payment', '25-26', 1, 1, '2026-01-24 06:07:21', '2026-01-24 06:07:21'),
(4, 2, 'employee', 2, 'journal', '25-26', 1, 2, '2026-01-31 12:14:27', '2026-01-31 15:13:57'),
(5, 2, 'employee', 2, 'payment', '25-26', 10, 1, '2026-01-31 16:02:59', '2026-01-31 16:02:59'),
(6, 2, 'employee', 2, 'receipt', '25-26', 1, 1, '2026-01-31 16:06:55', '2026-01-31 16:06:55'),
(7, 2, 'employee', 2, 'PRV', '25-26', 2, 21, '2026-02-02 15:58:59', '2026-02-19 07:06:21'),
(8, 2, 'employee', 2, 'PRV', '25-26', 4, 2, '2026-02-05 16:46:25', '2026-02-05 16:46:37'),
(9, 2, 'employee', 2, 'purchase', '23-24', 1, 1, '2026-02-18 15:03:53', '2026-02-18 15:03:53'),
(10, 2, 'employee', 2, 'payment', '25-26', 2, 1, '2026-02-22 09:58:18', '2026-02-22 09:58:18'),
(11, 2, 'employee', 2, 'payment', '25-26', 3, 2, '2026-03-02 08:10:53', '2026-03-11 02:31:17'),
(12, 2, 'employee', 2, 'receipt', '25-26', 3, 1, '2026-03-11 02:33:54', '2026-03-11 02:33:54'),
(13, 2, 'employee', 2, 'journal', '25-26', 3, 2, '2026-03-13 05:17:42', '2026-03-13 05:46:09'),
(14, 2, 'employee', 2, 'journal', '25-26', 0, 7, '2026-03-13 06:56:30', '2026-03-18 07:50:00'),
(15, 2, 'employee', 2, 'payment', '25-26', 0, 6, '2026-03-13 12:13:27', '2026-03-23 06:16:31'),
(16, 2, 'employee', 2, 'receipt', '25-26', 0, 4, '2026-03-14 11:22:29', '2026-03-23 06:17:41'),
(17, 2, 'employee', 2, 'payment', '24-25', 0, 1, '2026-03-17 11:23:03', '2026-03-17 11:23:03');

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
-- Indexes for table `admin_settings`
--
ALTER TABLE `admin_settings`
  ADD PRIMARY KEY (`setting_key`);

--
-- Indexes for table `assessees`
--
ALTER TABLE `assessees`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `attributes`
--
ALTER TABLE `attributes`
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
-- Indexes for table `company_subscriptions`
--
ALTER TABLE `company_subscriptions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_company_id` (`company_id`);

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
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `razorpay_order_id` (`razorpay_order_id`),
  ADD KEY `razorpay_payment_id` (`razorpay_payment_id`);

--
-- Indexes for table `purchase_history`
--
ALTER TABLE `purchase_history`
  ADD PRIMARY KEY (`id`);

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
-- Indexes for table `sales_types`
--
ALTER TABLE `sales_types`
  ADD PRIMARY KEY (`id`);

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
-- Indexes for table `sale_history`
--
ALTER TABLE `sale_history`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `scenarios`
--
ALTER TABLE `scenarios`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_company_id` (`company_id`),
  ADD KEY `idx_owner_type` (`owner_type`),
  ADD KEY `idx_owner_id` (`owner_id`);

--
-- Indexes for table `set_profit`
--
ALTER TABLE `set_profit`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_owner` (`owner_type`,`owner_id`);

--
-- Indexes for table `stock_attributes`
--
ALTER TABLE `stock_attributes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `stock_item_id` (`stock_item_id`),
  ADD KEY `attribute_id` (`attribute_id`);

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
-- Indexes for table `stock_item_attributes`
--
ALTER TABLE `stock_item_attributes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `stock_item_id` (`stock_item_id`);

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
-- Indexes for table `stock_purchase`
--
ALTER TABLE `stock_purchase`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `stock_units`
--
ALTER TABLE `stock_units`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_company_id` (`company_id`),
  ADD KEY `idx_owner_type` (`owner_type`),
  ADD KEY `idx_owner_id` (`owner_id`);

--
-- Indexes for table `subscription_coupons`
--
ALTER TABLE `subscription_coupons`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`);

--
-- Indexes for table `subscription_plans`
--
ALTER TABLE `subscription_plans`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tbadmin`
--
ALTER TABLE `tbadmin`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tbca`
--
ALTER TABLE `tbca`
  ADD PRIMARY KEY (`fdSiNo`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `tbcaemployeecompanies`
--
ALTER TABLE `tbcaemployeecompanies`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ca_employee_id` (`ca_employee_id`),
  ADD KEY `company_id` (`company_id`);

--
-- Indexes for table `tbcaemployees`
--
ALTER TABLE `tbcaemployees`
  ADD PRIMARY KEY (`id`),
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
-- Indexes for table `tbpermissions`
--
ALTER TABLE `tbpermissions`
  ADD PRIMARY KEY (`permission_id`),
  ADD UNIQUE KEY `permission_name` (`permission_name`);

--
-- Indexes for table `tbrolepermissions`
--
ALTER TABLE `tbrolepermissions`
  ADD PRIMARY KEY (`role_id`,`screen_id`,`permission_id`),
  ADD KEY `screen_id` (`screen_id`),
  ADD KEY `permission_id` (`permission_id`);

--
-- Indexes for table `tbroles`
--
ALTER TABLE `tbroles`
  ADD PRIMARY KEY (`role_id`);

--
-- Indexes for table `tbscreens`
--
ALTER TABLE `tbscreens`
  ADD PRIMARY KEY (`screen_id`),
  ADD UNIQUE KEY `screen_name` (`screen_name`);

--
-- Indexes for table `tbscreens_old`
--
ALTER TABLE `tbscreens_old`
  ADD PRIMARY KEY (`screen_id`),
  ADD UNIQUE KEY `screen_name` (`screen_name`);

--
-- Indexes for table `tbuserroles`
--
ALTER TABLE `tbuserroles`
  ADD PRIMARY KEY (`user_id`,`role_id`),
  ADD KEY `role_id` (`role_id`);

--
-- Indexes for table `tbusers`
--
ALTER TABLE `tbusers`
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
-- Indexes for table `voucher_sequences`
--
ALTER TABLE `voucher_sequences`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_voucher_seq` (`company_id`,`owner_type`,`owner_id`,`voucher_type`,`financial_year`,`month`);

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `attributes`
--
ALTER TABLE `attributes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `budgets`
--
ALTER TABLE `budgets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `business_incomes`
--
ALTER TABLE `business_incomes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `capital_gains`
--
ALTER TABLE `capital_gains`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `company_subscriptions`
--
ALTER TABLE `company_subscriptions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `cost_centers`
--
ALTER TABLE `cost_centers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `credit_vouchers`
--
ALTER TABLE `credit_vouchers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `credit_voucher_accounts`
--
ALTER TABLE `credit_voucher_accounts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `credit_voucher_double_entry`
--
ALTER TABLE `credit_voucher_double_entry`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `credit_voucher_items`
--
ALTER TABLE `credit_voucher_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `currencies`
--
ALTER TABLE `currencies`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `debit_note_entries`
--
ALTER TABLE `debit_note_entries`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `debit_note_vouchers`
--
ALTER TABLE `debit_note_vouchers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `deductees`
--
ALTER TABLE `deductees`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `delivery_entries`
--
ALTER TABLE `delivery_entries`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `delivery_items`
--
ALTER TABLE `delivery_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `godown_allocations`
--
ALTER TABLE `godown_allocations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `items`
--
ALTER TABLE `items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `itr_policies`
--
ALTER TABLE `itr_policies`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `itr_statements`
--
ALTER TABLE `itr_statements`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `itr_tax_payments`
--
ALTER TABLE `itr_tax_payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ledgers`
--
ALTER TABLE `ledgers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=121;

--
-- AUTO_INCREMENT for table `ledger_groups`
--
ALTER TABLE `ledger_groups`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=44;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=66;

--
-- AUTO_INCREMENT for table `purchase_history`
--
ALTER TABLE `purchase_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=143;

--
-- AUTO_INCREMENT for table `purchase_orders`
--
ALTER TABLE `purchase_orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `purchase_order_items`
--
ALTER TABLE `purchase_order_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `purchase_vouchers`
--
ALTER TABLE `purchase_vouchers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=105;

--
-- AUTO_INCREMENT for table `purchase_voucher_items`
--
ALTER TABLE `purchase_voucher_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=145;

--
-- AUTO_INCREMENT for table `sales_orders`
--
ALTER TABLE `sales_orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sales_order_items`
--
ALTER TABLE `sales_order_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sales_types`
--
ALTER TABLE `sales_types`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `sales_vouchers`
--
ALTER TABLE `sales_vouchers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=48;

--
-- AUTO_INCREMENT for table `sales_voucher_items`
--
ALTER TABLE `sales_voucher_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=82;

--
-- AUTO_INCREMENT for table `sale_history`
--
ALTER TABLE `sale_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=94;

--
-- AUTO_INCREMENT for table `scenarios`
--
ALTER TABLE `scenarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `set_profit`
--
ALTER TABLE `set_profit`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `stock_attributes`
--
ALTER TABLE `stock_attributes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `stock_groups`
--
ALTER TABLE `stock_groups`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `stock_items`
--
ALTER TABLE `stock_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `stock_item_attributes`
--
ALTER TABLE `stock_item_attributes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `stock_item_batches`
--
ALTER TABLE `stock_item_batches`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `stock_journal_entries`
--
ALTER TABLE `stock_journal_entries`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `stock_journal_vouchers`
--
ALTER TABLE `stock_journal_vouchers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `stock_purchase`
--
ALTER TABLE `stock_purchase`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `stock_units`
--
ALTER TABLE `stock_units`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `subscription_coupons`
--
ALTER TABLE `subscription_coupons`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `subscription_plans`
--
ALTER TABLE `subscription_plans`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `tbadmin`
--
ALTER TABLE `tbadmin`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `tbca`
--
ALTER TABLE `tbca`
  MODIFY `fdSiNo` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `tbcaemployeecompanies`
--
ALTER TABLE `tbcaemployeecompanies`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbcaemployees`
--
ALTER TABLE `tbcaemployees`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbcompanies`
--
ALTER TABLE `tbcompanies`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `tbemployees`
--
ALTER TABLE `tbemployees`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `tbgstr3breturns`
--
ALTER TABLE `tbgstr3breturns`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbgstregistrations`
--
ALTER TABLE `tbgstregistrations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbpermissions`
--
ALTER TABLE `tbpermissions`
  MODIFY `permission_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbroles`
--
ALTER TABLE `tbroles`
  MODIFY `role_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbscreens`
--
ALTER TABLE `tbscreens`
  MODIFY `screen_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbscreens_old`
--
ALTER TABLE `tbscreens_old`
  MODIFY `screen_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbusers`
--
ALTER TABLE `tbusers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `tcs_27eq_challans`
--
ALTER TABLE `tcs_27eq_challans`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tcs_27eq_collectees`
--
ALTER TABLE `tcs_27eq_collectees`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tcs_27eq_returns`
--
ALTER TABLE `tcs_27eq_returns`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tcs_27q_challans`
--
ALTER TABLE `tcs_27q_challans`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tcs_27q_collectees`
--
ALTER TABLE `tcs_27q_collectees`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tcs_27q_returns`
--
ALTER TABLE `tcs_27q_returns`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tds_24q_employee_salary_details`
--
ALTER TABLE `tds_24q_employee_salary_details`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tds_24q_returns`
--
ALTER TABLE `tds_24q_returns`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tds_24q_tax_details`
--
ALTER TABLE `tds_24q_tax_details`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tds_26q_challans`
--
ALTER TABLE `tds_26q_challans`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tds_26q_deductees`
--
ALTER TABLE `tds_26q_deductees`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tds_26q_returns`
--
ALTER TABLE `tds_26q_returns`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `voucher_entries`
--
ALTER TABLE `voucher_entries`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=226;

--
-- AUTO_INCREMENT for table `voucher_entries_old`
--
ALTER TABLE `voucher_entries_old`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `voucher_main`
--
ALTER TABLE `voucher_main`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=59;

--
-- AUTO_INCREMENT for table `voucher_main_old`
--
ALTER TABLE `voucher_main_old`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `voucher_sequences`
--
ALTER TABLE `voucher_sequences`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `company_subscriptions`
--
ALTER TABLE `company_subscriptions`
  ADD CONSTRAINT `fk_company_subscriptions_company` FOREIGN KEY (`company_id`) REFERENCES `tbcompanies` (`id`) ON DELETE CASCADE;

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
-- Constraints for table `stock_attributes`
--
ALTER TABLE `stock_attributes`
  ADD CONSTRAINT `stock_attributes_ibfk_1` FOREIGN KEY (`stock_item_id`) REFERENCES `stock_items` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `stock_attributes_ibfk_2` FOREIGN KEY (`attribute_id`) REFERENCES `attributes` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `tbcaemployeecompanies`
--
ALTER TABLE `tbcaemployeecompanies`
  ADD CONSTRAINT `tbCAEmployeeCompanies_ibfk_1` FOREIGN KEY (`ca_employee_id`) REFERENCES `tbcaemployees` (`id`),
  ADD CONSTRAINT `tbCAEmployeeCompanies_ibfk_2` FOREIGN KEY (`company_id`) REFERENCES `tbcompanies` (`id`);

--
-- Constraints for table `tbusers`
--
ALTER TABLE `tbusers`
  ADD CONSTRAINT `tbUsers_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `tbemployees` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
