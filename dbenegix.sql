-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Feb 06, 2026 at 11:38 AM
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
(1, 'First', 'asff', 'asdfdsf', '2025-12-05 11:43:25', NULL, 1, 'employee', 1);

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
(2, 'USD', '$', 'Dollor', 1.00, 0, '2025-12-01 08:08:29', 1, 'employee', 1);

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
(4, 'Lalpur', 'Lalpur Ranchi', '', 1, 'employee', 1),
(5, 'Kadru', 'Kadru Ranchi', '', 1, 'employee', 1);

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
(112, '18% Purchase', -15, 0.00, 'debit', '', '', '', '', '', '2026-01-24 06:07:49', 1, 'employee', 1, 0.00, '', ''),
(113, '9% Cgst', 102, 100.00, 'debit', '', '', '', '', '', '2026-01-24 06:08:25', 1, 'employee', 1, 0.00, '', ''),
(114, '9% Sgst', 102, 100.00, 'credit', '', '', '', '', '', '2026-01-24 06:08:53', 1, 'employee', 1, 0.00, '', ''),
(115, '18% Igst  ', 102, 0.00, 'debit', '', '', '', '', '', '2026-01-24 06:14:24', 1, 'employee', 1, 0.00, '', ''),
(116, 'AMAN KUMAR', 104, 50000.00, 'debit', 'Ranchi', '', '', '27ABCDE1234F1Z5', '34234234', '2026-01-24 06:35:14', 1, 'employee', 1, 0.00, 'Jharkhand(20)', 'Ranchi'),
(117, '18% Sales', -16, 0.00, 'debit', '', '', '', '', '', '2026-01-24 09:58:34', 1, 'employee', 1, 0.00, '', ''),
(120, '28% purchase', -15, 10000.00, 'debit', '', '', '', '', '', '2026-01-28 07:59:29', 1, 'employee', 1, 0.00, '', ''),
(121, 'Mohan Kumar', 107, 1000.00, 'credit', '', '', '', '', '', '2026-01-29 05:43:34', 1, 'employee', 1, 0.00, 'Jharkhand(20)', ''),
(122, '5% IGST', 102, 0.00, 'debit', '', '', '', '', '', '2026-01-29 08:12:30', 1, 'employee', 1, 0.00, '', ''),
(123, '2.5% Cgst', 102, 0.00, 'debit', '', '', '', '', '', '2026-01-29 08:12:44', 1, 'employee', 1, 0.00, '', ''),
(124, '2.5% Sgst', 102, 0.00, 'debit', '', '', '', '', '', '2026-01-29 08:13:02', 1, 'employee', 1, 0.00, '', ''),
(125, 'Stock 18% Goods', 99, 50.00, 'debit', '', '', '', '', '', '2026-01-30 06:12:38', 1, 'employee', 1, 50.00, '', ''),
(126, '28% Sales', -16, 0.00, 'debit', '', '', '', '', '', '2026-01-30 07:36:11', 1, 'employee', 1, 0.00, '', ''),
(127, 'Rohan Kumar (capital account)', -4, 0.00, 'debit', '', '', '', '', '', '2026-01-31 05:50:38', 1, 'employee', 1, 0.00, '', ''),
(129, 'Statinory', -10, 0.00, 'debit', '', '', '', '', '', '2026-01-31 10:51:30', 1, 'employee', 1, 0.00, '', ''),
(130, 'Devidend', -11, 0.00, 'debit', '', '', '', '', '', '2026-01-31 10:51:48', 1, 'employee', 1, 0.00, '', ''),
(131, 'Sallary', -10, 0.00, 'debit', '', '', '', '', '', '2026-01-31 10:52:07', 1, 'employee', 1, 0.00, '', ''),
(132, 'Audit Fee', -10, 0.00, 'debit', '', '', '', '', '', '2026-01-31 10:52:24', 1, 'employee', 1, 0.00, '', ''),
(133, 'Direct', -7, 0.00, 'debit', '', '', '', '', '', '2026-01-31 11:58:42', 1, 'employee', 1, 0.00, '', ''),
(135, 'Profit/Loss', -18, 0.00, 'credit', '', '', '', '', '', '2026-02-03 05:55:14', 1, 'employee', 1, 4368.00, '', ''),
(137, 'Sohan (capital account)', -4, 0.00, 'debit', '', '', '', '', '', '2026-02-04 06:07:32', 1, 'employee', 1, 0.00, '', ''),
(138, 'Furniture', -9, 0.00, 'debit', '', '', '', '', '', '2026-02-05 05:18:30', 1, 'employee', 1, 0.00, '', ''),
(139, 'Cash', 98, 0.00, 'debit', '', '', '', '', '', '2026-02-05 05:19:42', 1, 'employee', 1, 0.00, '', '');

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
(98, 'Cash-in-Hand', NULL, -5, '2025-12-17 07:27:35', NULL, 'Assets', 0, 0, 0, 'No Appropriation', 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, 1, 'employee', 1),
(99, 'Stock-in-hand', NULL, -5, '2025-12-17 07:28:29', NULL, 'Assets', 0, 0, 0, 'No Appropriation', 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, 1, 'employee', 1),
(100, 'Reserves & Surplus', NULL, -13, '2025-12-23 10:16:50', NULL, 'Liabilities', 0, 0, 0, 'No Appropriation', 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, 1, 'employee', 1),
(101, 'Secured Loans', NULL, -13, '2025-12-23 10:17:45', NULL, 'Liabilities', 0, 0, 0, 'No Appropriation', 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, 1, 'employee', 1),
(102, 'Duties & Taxes', NULL, -13, '2025-12-23 10:18:38', NULL, 'Liabilities', 0, 0, 0, 'No Appropriation', 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, 1, 'employee', 1),
(103, 'Provisions', NULL, -6, '2025-12-23 10:19:03', NULL, 'Liabilities', 0, 0, 0, 'No Appropriation', 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, 1, 'employee', 1),
(104, 'Sundry Creditors', NULL, -6, '2025-12-23 10:20:02', NULL, 'Liabilities', 0, 0, 0, 'No Appropriation', 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, 1, 'employee', 1),
(105, 'Deposite (Asset)', NULL, -6, '2025-12-23 10:20:56', NULL, 'Liabilities', 0, 0, 0, 'No Appropriation', 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, 1, 'employee', 1),
(106, 'Loans & Advances (Asset)', NULL, -5, '2025-12-23 10:21:27', NULL, 'Assets', 0, 0, 0, 'No Appropriation', 0, NULL, NULL, 0, NULL, NULL, NULL, 0.00, 0.00, 1, 'employee', 1),
(107, 'Sundry Debtors', NULL, -5, '2025-12-23 10:23:42', NULL, 'Assets', 0, 0, 0, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, 0.00, 0.00, 1, 'employee', 1),
(108, 'Duties & Taxes', NULL, -6, '2025-12-24 05:31:47', NULL, 'Liabilities', 0, 0, 0, 'No Appropriation', 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, 10, 'employee', 1),
(109, 'KHURSID ALAM', NULL, -16, '2025-12-27 05:06:58', NULL, 'Income', 0, 0, 0, 'No Appropriation', 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, 1, 'employee', 1),
(110, '5% sales', NULL, 109, '2025-12-27 05:07:19', NULL, 'Income', 0, 0, 0, 'No Appropriation', 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, 1, 'employee', 1);

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
  `godownId` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `purchase_history`
--

INSERT INTO `purchase_history` (`id`, `itemName`, `hsnCode`, `batchNumber`, `purchaseQuantity`, `purchaseDate`, `companyId`, `ownerType`, `ownerId`, `type`, `rate`, `voucherNumber`, `godownId`) VALUES
(220, 'Biscute', '4444', 'ParleG', 10, '2026-02-03', '1', 'employee', '1', 'purchase', 10.00, 'PRV/25-26/02/000012', 5),
(222, 'Biscute', '4444', 'ParleG', 10, '2026-02-03', '1', 'employee', '1', 'purchase', 10.00, 'PRV/25-26/02/000014', 4),
(223, 'Biscute', '4444', 'ParleG', 10, '2026-02-06', '1', 'employee', '1', 'purchase', 10.00, 'PRV/25-26/02/000015', NULL),
(224, 'Biscute', '4444', 'ParleG', 10, '2026-02-06', '1', 'employee', '1', 'purchase', 10.00, 'PRV/25-26/02/000016', 4),
(225, 'Biscute', '4444', 'Mary', 100, '2026-02-06', '1', 'employee', '1', 'purchase', 100.00, 'PRV/25-26/02/000017', 5);

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
  `owner_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `purchase_vouchers`
--

INSERT INTO `purchase_vouchers` (`id`, `number`, `date`, `supplierInvoiceDate`, `narration`, `partyId`, `referenceNo`, `dispatchDocNo`, `dispatchThrough`, `destination`, `purchaseLedgerId`, `subtotal`, `cgstTotal`, `sgstTotal`, `igstTotal`, `discountTotal`, `total`, `company_id`, `owner_type`, `owner_id`) VALUES
(243, 'PRV/25-26/02/000012', '2026-02-03', '2026-02-03', '', 121, '2', NULL, NULL, NULL, 0, 100.00, 9.00, 9.00, 0.00, 10.00, 108.00, 1, 'employee', 1),
(245, 'PRV/25-26/02/000014', '2026-02-03', '2026-02-03', '', 132, '1', NULL, NULL, NULL, 0, 100.00, 0.00, 0.00, 18.00, 10.00, 108.00, 1, 'employee', 1),
(246, 'PRV/25-26/02/000015', '2026-02-06', '2026-02-06', '', 130, '11', NULL, NULL, NULL, 0, 100.00, 0.00, 0.00, 18.00, 0.00, 118.00, 1, 'employee', 1),
(247, 'PRV/25-26/02/000016', '2026-02-06', '2026-02-06', '', 121, '2', NULL, NULL, NULL, 0, 100.00, 9.00, 9.00, 0.00, 0.00, 118.00, 1, 'employee', 1),
(248, 'PRV/25-26/02/000017', '2026-02-06', '2026-02-06', '', 133, '4', NULL, NULL, NULL, 0, 10000.00, 0.00, 0.00, 1800.00, 0.00, 11800.00, 1, 'employee', 1);

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
  `purchaseLedgerId` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `purchase_voucher_items`
--

INSERT INTO `purchase_voucher_items` (`id`, `voucherId`, `itemId`, `quantity`, `rate`, `discount`, `cgstRate`, `sgstRate`, `igstRate`, `amount`, `godownId`, `purchaseLedgerId`) VALUES
(247, 243, 78, 10.00, 10.00, 10.00, 113.00, 114.00, 0.00, 90.00, 5, 112),
(249, 245, 78, 10.00, 10.00, 10.00, 0.00, 0.00, 115.00, 90.00, 4, 112),
(250, 246, 78, 10.00, 10.00, 0.00, 0.00, 0.00, 115.00, 100.00, NULL, 112),
(251, 247, 78, 10.00, 10.00, 0.00, 113.00, 114.00, 0.00, 100.00, 4, 112),
(252, 248, 78, 100.00, 100.00, 0.00, 0.00, 0.00, 115.00, 0.00, 5, 112);

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
  `current_no` int(19) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `company_id` varchar(100) DEFAULT NULL,
  `owner_type` varchar(50) DEFAULT NULL,
  `owner_id` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `sales_types`
--

INSERT INTO `sales_types` (`id`, `sales_type`, `type`, `prefix`, `suffix`, `current_no`, `created_at`, `updated_at`, `company_id`, `owner_type`, `owner_id`) VALUES
(1, 'Sales asdfsadf', 'Sales', 'sls/', '/25-26', 48, '2026-01-12 05:32:09', '2026-01-22 12:50:46', '1', 'employee', '1'),
(3, 'Reg Sales', 'Sales', 'rsls/', '/24-25', 2, '2026-01-12 05:47:19', '2026-01-12 05:47:55', '1', 'employee', '1'),
(4, 'Sales', 'Sales', 'sls/', '/25-26', 1, '2026-01-16 06:59:26', '2026-01-16 06:59:26', '1', 'employee', '1');

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
  `profit` decimal(12,2) DEFAULT 0.00,
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
  `approxDistance` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `sales_vouchers`
--

INSERT INTO `sales_vouchers` (`id`, `number`, `date`, `narration`, `partyId`, `referenceNo`, `dispatchDocNo`, `dispatchThrough`, `destination`, `subtotal`, `profit`, `cgstTotal`, `sgstTotal`, `igstTotal`, `discountTotal`, `total`, `createdAt`, `company_id`, `owner_type`, `owner_id`, `type`, `isQuotation`, `salesLedgerId`, `supplierInvoiceDate`, `sales_type_id`, `bill_no`, `approxDistance`) VALUES
(169, 'sls/49/25-26', '2026-02-06', '', 116, '11', NULL, NULL, NULL, 100.00, 0.00, 9.00, 9.00, 0.00, 0.00, 118.00, '2026-02-06 04:15:52', '1', 'employee', '1', 'sales', 0, '', NULL, 1, 'sls/49/25-26', NULL),
(170, 'sls/49/25-26', '2026-02-06', '', 116, '1', NULL, NULL, NULL, 320000.00, 0.00, 28800.00, 28800.00, 0.00, 0.00, 377600.00, '2026-02-06 06:10:28', '1', 'employee', '1', 'sales', 0, '', NULL, 1, 'sls/49/25-26', NULL),
(171, 'sls/49/25-26', '2026-02-06', '', 121, '11', NULL, NULL, NULL, 1000.00, 0.00, 90.00, 90.00, 0.00, 0.00, 1180.00, '2026-02-06 08:06:20', '1', 'employee', '1', 'sales', 0, '', NULL, 1, 'sls/49/25-26', NULL),
(172, 'sls/49/25-26', '2026-02-06', '', 133, '11', NULL, NULL, NULL, 100.00, 0.00, 0.00, 0.00, 18.00, 0.00, 118.00, '2026-02-06 08:14:50', '1', 'employee', '1', 'sales', 0, '', NULL, 1, 'sls/49/25-26', NULL);

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
  `godownId` varchar(64) DEFAULT NULL,
  `salesLedgerId` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `sales_voucher_items`
--

INSERT INTO `sales_voucher_items` (`id`, `voucherId`, `itemId`, `quantity`, `rate`, `amount`, `cgstRate`, `sgstRate`, `igstRate`, `discount`, `hsnCode`, `batchNumber`, `godownId`, `salesLedgerId`) VALUES
(178, 169, 78, 10.00, 10.00, 100.00, 113.00, 114.00, 0.00, 0.00, '4444', 'ParleG', '5', 117),
(179, 170, 78, 10.00, 16000.00, 160000.00, 113.00, 114.00, 0.00, 0.00, '4444', 'ParleG', '5', 117),
(180, 170, 78, 10.00, 16000.00, 160000.00, 113.00, 114.00, 0.00, 0.00, '4444', 'ParleG', '5', 117),
(181, 171, 78, 100.00, 10.00, 1000.00, 113.00, 114.00, 0.00, 0.00, '4444', 'Mary', '5', 117),
(182, 172, 78, 10.00, 10.00, 100.00, 0.00, 0.00, 115.00, 0.00, '4444', 'Mary', '5', 117);

-- --------------------------------------------------------

--
-- Table structure for table `sale_history`
--

CREATE TABLE `sale_history` (
  `id` int(11) NOT NULL,
  `itemName` varchar(255) DEFAULT NULL,
  `hsnCode` varchar(50) DEFAULT NULL,
  `batchNumber` varchar(255) DEFAULT NULL,
  `qtyChange` int(11) DEFAULT NULL,
  `movementDate` date DEFAULT NULL,
  `companyId` varchar(100) DEFAULT NULL,
  `ownerType` varchar(50) DEFAULT NULL,
  `ownerId` varchar(100) DEFAULT NULL,
  `rate` decimal(10,2) DEFAULT NULL,
  `voucherNumber` varchar(100) DEFAULT NULL,
  `godownId` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `sale_history`
--

INSERT INTO `sale_history` (`id`, `itemName`, `hsnCode`, `batchNumber`, `qtyChange`, `movementDate`, `companyId`, `ownerType`, `ownerId`, `rate`, `voucherNumber`, `godownId`) VALUES
(160, 'Biscute', '4444', 'ParleG', -10, '2026-02-06', '1', 'employee', '1', 10.00, 'sls/49/25-26', 5),
(161, 'Biscute', '4444', 'ParleG', -10, '2026-02-06', '1', 'employee', '1', 16000.00, 'sls/49/25-26', 5),
(162, 'Biscute', '4444', 'ParleG', -10, '2026-02-06', '1', 'employee', '1', 16000.00, 'sls/49/25-26', 5),
(163, 'Biscute', '4444', 'Mary', -100, '2026-02-06', '1', 'employee', '1', 10.00, 'sls/49/25-26', 5),
(164, 'Biscute', '4444', 'Mary', -10, '2026-02-06', '1', 'employee', '1', 10.00, 'sls/49/25-26', 5);

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
  `customer_type` varchar(50) NOT NULL,
  `method` varchar(50) NOT NULL,
  `value` decimal(10,2) NOT NULL,
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
(2, 'retailer', 'profit_percentage', 5.00, 'employee', 1, '2025-12-20 07:24:27', 'profit_percentage', 55.00, 'profit_percentage', 60.00);

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
('SC-1764575655436', 'Ayush', NULL, 'asdfdsf', '2025-12-01 07:54:15', '2025-12-01 07:54:15', 0, 'employee', 1),
('SC-1764576784597', 'First', NULL, 'dsfsdfds', '2025-12-01 08:13:04', '2025-12-01 08:13:04', 0, 'employee', 1),
('SC-1764577200482', 'Fff', 'SC-001', 'asdfsdf', '2025-12-01 08:20:00', '2025-12-01 08:20:00', 0, 'employee', 1),
('SC-1764581787124', 'sadfsdaf', 'SC-001', 'asdfdsf', '2025-12-01 09:36:27', '2025-12-01 09:36:27', 0, 'employee', 1),
('SC-1766211180209', 'Bar', '16', 'This is Bar', '2025-12-20 06:13:00', '2025-12-20 06:13:00', 1, 'employee', 1),
('SC-1766211196681', 'Cement', '17', 'This is Cement\n', '2025-12-20 06:13:16', '2025-12-20 06:13:16', 1, 'employee', 1),
('SC-1766211228369', 'Chemical', '18', 'This is Chemical', '2025-12-20 06:13:48', '2025-12-20 06:13:48', 1, 'employee', 1),
('SC-1766211252849', 'FMCG', '18', 'This is FMCG', '2025-12-20 06:14:12', '2025-12-20 06:14:12', 1, 'employee', 1),
('SC-1766576754271', 'Biscute', NULL, 'This is Biscute.', '2025-12-24 11:45:54', '2025-12-24 11:45:54', 10, 'employee', 1);

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
(15, '3% Goods', NULL, 1, 0, NULL, NULL, NULL, 0, NULL, 'Taxable', 0.00, 0.00, '2025-12-20 06:11:40', 1, 'employee', 1),
(16, '5% goods', NULL, 1, 0, NULL, NULL, NULL, 0, NULL, 'Taxable', 0.00, 0.00, '2025-12-20 06:11:55', 1, 'employee', 1),
(17, '18% Goods', NULL, 1, 0, NULL, NULL, NULL, 0, NULL, 'Taxable', 0.00, 0.00, '2025-12-20 06:12:11', 1, 'employee', 1),
(18, 'Exempt', NULL, 1, 0, NULL, NULL, NULL, 0, NULL, 'Taxable', 0.00, 0.00, '2025-12-20 06:12:26', 1, 'employee', 1);

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
  `batches` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`batches`)),
  `type` varchar(50) DEFAULT 'opening',
  `categoryId` varchar(50) DEFAULT NULL,
  `gstLedgerId` int(11) DEFAULT NULL,
  `cgstLedgerId` int(11) DEFAULT NULL,
  `sgstLedgerId` int(11) DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `stock_items`
--

INSERT INTO `stock_items` (`id`, `name`, `stockGroupId`, `unit`, `openingBalance`, `openingValue`, `hsnCode`, `gstRate`, `taxType`, `standardPurchaseRate`, `standardSaleRate`, `enableBatchTracking`, `allowNegativeStock`, `maintainInPieces`, `secondaryUnit`, `createdAt`, `batchNumber`, `batchExpiryDate`, `batchManufacturingDate`, `company_id`, `owner_type`, `owner_id`, `barcode`, `batches`, `type`, `categoryId`, `gstLedgerId`, `cgstLedgerId`, `sgstLedgerId`, `image`) VALUES
(76, 'Acc ', NULL, '12', 0.00, 900.00, '1111', 0.00, 'Taxable', 0.00, 0.00, 1, 1, 1, NULL, '2026-01-24 06:28:35', NULL, NULL, NULL, 1, 'employee', 1, '8904662796846', '[{\"batchName\":\"Ab1\",\"batchQuantity\":90,\"openingRate\":10,\"openingValue\":900,\"batchExpiryDate\":\"2026-01-31\",\"batchManufacturingDate\":\"2026-01-24\",\"mode\":\"opening\"}]', 'opening', 'SC-1766211196681', 122, 123, 124, 'https://res.cloudinary.com/dv10ob2km/image/upload/v1770270217/stock_item/xllfzsmmn1mki8ao80o2.webp'),
(78, 'Biscute', NULL, '12', 0.00, 100.00, '4444', 0.00, 'Taxable', 0.00, 0.00, 0, 0, 0, NULL, '2026-01-27 04:46:19', NULL, NULL, NULL, 1, 'employee', 1, '8904662796847', '[{\"batchName\":\"ParleG\",\"batchQuantity\":360,\"openingRate\":10,\"openingValue\":100,\"batchExpiryDate\":\"2026-01-28\",\"batchManufacturingDate\":\"2026-01-27\",\"mode\":\"opening\"},{\"batchName\":\"Mary\",\"batchQuantity\":90,\"batchRate\":100,\"batchExpiryDate\":\"2026-02-27\",\"mode\":\"purchase\",\"batchManufacturingDate\":\"2026-02-06\"}]', 'opening', 'SC-1766211252849', 115, 113, 114, NULL),
(84, 'Shampo', NULL, '12', 0.00, 0.00, '2523', 0.00, 'Taxable', 0.00, 0.00, 1, 1, 1, NULL, '2026-02-06 09:51:38', NULL, NULL, NULL, 1, 'employee', 1, '8906745727481', '[{\"batchName\":null,\"batchQuantity\":0,\"openingRate\":0,\"openingValue\":0,\"batchExpiryDate\":null,\"batchManufacturingDate\":null,\"mode\":\"opening\"}]', 'opening', 'SC-1766211180209', 115, 113, 114, NULL);

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
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `stock_purchase`
--

INSERT INTO `stock_purchase` (`id`, `name`, `stockGroupId`, `categoryId`, `unit`, `openingBalance`, `openingValue`, `hsnCode`, `gstRate`, `taxType`, `standardPurchaseRate`, `standardSaleRate`, `enableBatchTracking`, `allowNegativeStock`, `maintainInPieces`, `secondaryUnit`, `barcode`, `company_id`, `owner_type`, `owner_id`, `batches`, `type`, `createdAt`) VALUES
(8, 'Biscute', NULL, NULL, '12', 0.00, 100.00, '9999', 0.00, 'Taxable', 0.00, 0.00, 0, 0, 0, NULL, NULL, 1, 'employee', 1, '[{\"batchName\":\"Ab2\",\"batchQuantity\":10,\"openingRate\":10,\"openingValue\":100,\"batchExpiryDate\":\"2026-01-15\",\"batchManufacturingDate\":\"2026-01-14\"}]', 'purchase', '2026-01-14 10:47:23'),
(9, 'Biscute', NULL, NULL, '12', 0.00, 100.00, '9999', 0.00, 'Taxable', 0.00, 0.00, 0, 0, 0, NULL, NULL, 1, 'employee', 1, '[{\"batchName\":\"Ab3\",\"batchQuantity\":10,\"openingRate\":10,\"openingValue\":100,\"batchExpiryDate\":\"2026-01-15\",\"batchManufacturingDate\":\"2026-01-14\"}]', 'purchase', '2026-01-14 10:55:19'),
(10, 'Acc', NULL, NULL, '10', 0.00, 1000.00, '1111', 0.00, 'Taxable', 0.00, 0.00, 0, 0, 0, NULL, NULL, 1, 'employee', 1, '[{\"batchName\":\"Ab2\",\"batchQuantity\":100,\"openingRate\":10,\"openingValue\":1000,\"batchExpiryDate\":\"2026-01-30\",\"batchManufacturingDate\":\"2026-01-14\"}]', 'purchase', '2026-01-14 11:06:41'),
(11, 'Acc', NULL, NULL, '10', 0.00, 1000.00, '1111', 0.00, 'Taxable', 0.00, 0.00, 0, 0, 0, NULL, NULL, 1, 'employee', 1, '[{\"batchName\":\"Ab2\",\"batchQuantity\":100,\"openingRate\":10,\"openingValue\":1000,\"batchExpiryDate\":\"2026-01-30\",\"batchManufacturingDate\":\"2026-01-14\"}]', 'purchase', '2026-01-14 11:06:56'),
(12, 'Acc', NULL, NULL, '10', 0.00, 100.00, '1111', 0.00, 'Taxable', 0.00, 0.00, 0, 0, 0, NULL, NULL, 1, 'employee', 1, '[{\"batchName\":\"Ab2\",\"batchQuantity\":10,\"openingRate\":10,\"openingValue\":100,\"batchExpiryDate\":\"2026-01-30\",\"batchManufacturingDate\":\"2026-01-14\"}]', 'purchase', '2026-01-14 11:07:18'),
(13, 'Acc', NULL, NULL, '10', 0.00, 144.00, '1111', 0.00, 'Taxable', 0.00, 0.00, 0, 0, 0, NULL, NULL, 1, 'employee', 1, '[{\"batchName\":\"BTH102\",\"batchQuantity\":12,\"openingRate\":12,\"openingValue\":144,\"batchExpiryDate\":\"2026-01-15\",\"batchManufacturingDate\":\"2026-01-14\"}]', 'purchase', '2026-01-14 11:08:48'),
(14, 'Acc', NULL, NULL, '10', 0.00, 100.00, '1111', 0.00, 'Taxable', 0.00, 0.00, 0, 0, 0, NULL, NULL, 1, 'employee', 1, '[{\"batchName\":\"BTH102\",\"batchQuantity\":10,\"openingRate\":10,\"openingValue\":100,\"batchExpiryDate\":\"2026-01-15\",\"batchManufacturingDate\":\"2026-01-14\"}]', 'purchase', '2026-01-14 11:11:30');

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
(6, 'Killo', '$', '2025-12-01 06:38:51', 0, 'employee', 1),
(9, 'Kilo', 'KG', '2025-12-06 11:36:05', 1, 'employee', 1),
(10, 'Meters', 'Mtr', '2025-12-06 11:45:04', 1, 'employee', 1),
(11, 'Kilo', 'KG', '2025-12-24 11:46:48', 10, 'employee', 1),
(12, 'pieces', 'Pcs', '2026-01-14 06:23:21', 1, 'employee', 1);

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
  `fdlast_login` datetime DEFAULT current_timestamp()
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

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
  `fdAccountantName` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbcompanies`
--

INSERT INTO `tbcompanies` (`id`, `name`, `financial_year`, `books_beginning_year`, `address`, `pin`, `phone_number`, `email`, `pan_number`, `gst_number`, `state`, `country`, `tax_type`, `employee_id`, `vault_password`, `created_at`, `vat_number`, `fdAccountType`, `fdAccountantName`) VALUES
(1, 'My Company', '2026', '2026', 'Ranchi ', '834001', '1234567890', 'a@gmail.com', 'ABCDE1234F', '27ABCDE1234F1Z5', 'Jharkhand(20)', 'India', 'GST', 1, NULL, '2025-12-01 04:26:18', NULL, 'self', NULL),
(10, 'Ayush', '2025', '2025', 'Ranchi Kadru', '834001', '1234567890', 'd@gmail.com', 'ABCDE1234F', '27ABCDE1234F1Z5', 'Jharkhand(20)', 'India', 'GST', 1, NULL, '2025-12-24 05:28:26', NULL, 'self', NULL),
(11, 'Mahindra', '2026', '2026', 'Assam', '121212', '1234567890', 'mm@gmail.com', 'ABCDE1234F', '27ABCDE1234F1Z8', 'Assam(18)', 'India', 'GST', 13, NULL, '2026-01-06 08:14:43', NULL, 'self', NULL);

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
  `phoneNumber` varchar(100) NOT NULL,
  `password` varchar(255) DEFAULT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `userLimit` int(11) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbemployees`
--

INSERT INTO `tbemployees` (`id`, `firstName`, `lastName`, `pan`, `email`, `phoneNumber`, `password`, `token`, `created_at`, `userLimit`) VALUES
(1, 'Ayush', 'Kumar', NULL, 'a@gmail.com', '1234567890', '$2b$10$qvYRGUPlHxA4Ws7SSdZ0.e633UZ8qUsNd9JXouV3FAyR4mUJjkbia', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFAZ21haWwuY29tIiwiaWF0IjoxNzY0NTYyODY1LCJleHAiOjE3NjUxNjc2NjV9.Xp6QyUftXz9OllWoBYYZFu58Q_Xpb-sPxNMEQx5Qetw', '2025-12-01 04:21:05', 1),
(11, 'Damy', 'Data', NULL, 'b@gmail.com', '1234567890', '$2b$10$eYiLMk8z6/Srs0w3TacImOFUpDQtyxAaexy5qLSXiqPcJ6NLzqVee', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImJAZ21haWwuY29tIiwiaWF0IjoxNzY0NjUxMzUyLCJleHAiOjE3NjUyNTYxNTJ9.gvxg1zg4MnDAq8NeTc3ba_3O7Rv6_TeyKPqV8Y596fI', '2025-12-02 04:55:52', 1),
(12, 'Muskan', 'sdf', NULL, 'm@gmail.com', '1234567890', '$2b$10$Tljhl5lLxBp3HvAkgT2sQOAeYVv6Ykwv1lu.kbKfBnx98hpFvHQc6', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Im1AZ21haWwuY29tIiwiaWF0IjoxNzY0NjUzMTU0LCJleHAiOjE3NjUyNTc5NTR9.KobO1nBWAeFMGrFAcg0FSTRJ5OWsTDotWqMIBAC7H_A', '2025-12-02 05:25:54', 1),
(13, 'Mahindra', 'Mahindra', NULL, 'mm@gmail.com', '1234567890', '$2b$10$QAFaoWPYJcXJjmxGgyPCy.ZWj.G5Vw8hlp2mQQlHmnod8.PE6pO9e', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Im1tQGdtYWlsLmNvbSIsImlhdCI6MTc2NzY4NzIzNCwiZXhwIjoxNzY4MjkyMDM0fQ.PKqXzxpdO5u5oP79XGQi7ibxFwBp-QoO912OqdCuXXc', '2026-01-06 08:13:54', 1);

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
  `last_login` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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

--
-- Dumping data for table `voucher_entries`
--

INSERT INTO `voucher_entries` (`id`, `voucher_id`, `ledger_id`, `amount`, `entry_type`, `narration`, `bank_name`, `cheque_number`, `cost_centre_id`, `item_id`, `ledger_name`) VALUES
(46, 129, 127, 592.00, 'debit', 'LOSS_TR:582', NULL, NULL, NULL, NULL, NULL),
(47, 129, 135, 4378.00, 'credit', 'PROFIT_TR:4368', NULL, NULL, NULL, NULL, NULL),
(48, 130, 138, 5000.00, 'debit', NULL, NULL, NULL, NULL, NULL, NULL),
(49, 130, 139, 5000.00, 'credit', NULL, NULL, NULL, NULL, NULL, NULL);

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
(129, 'journal', 'JV/25-26/02/000021', '2026-02-04', NULL, '1', '2026-02-04', NULL, '1', 'employee', '1'),
(130, 'journal', 'JV/25-26/02/000022', '2026-02-05', NULL, '11', '2026-02-05', NULL, '1', 'employee', '1');

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
  `voucher_type` varchar(10) NOT NULL,
  `financial_year` varchar(9) NOT NULL,
  `month` tinyint(4) NOT NULL,
  `current_no` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `voucher_sequences`
--

INSERT INTO `voucher_sequences` (`id`, `company_id`, `owner_type`, `owner_id`, `voucher_type`, `financial_year`, `month`, `current_no`, `created_at`, `updated_at`) VALUES
(1, 1, 'employee', 1, 'PRV', '25-26', 1, 103, '2026-01-09 10:14:19', '2026-01-31 12:54:41'),
(2, 1, 'employee', 1, 'payment', '25-26', 1, 8, '2026-01-09 11:08:06', '2026-01-27 09:29:00'),
(3, 1, 'employee', 1, 'receipt', '25-26', 1, 3, '2026-01-09 11:50:45', '2026-01-16 07:02:59'),
(4, 1, 'employee', 1, 'contra', '25-26', 1, 1, '2026-01-09 11:54:26', '2026-01-09 11:54:26'),
(5, 1, 'employee', 1, 'journal', '25-26', 1, 3, '2026-01-09 11:57:50', '2026-01-31 10:09:53'),
(6, 1, 'employee', 1, 'CNV', '25-26', 1, 11, '2026-01-10 05:10:51', '2026-01-10 05:12:10'),
(7, 1, 'employee', 1, 'credit_not', '25-26', 1, 1, '2026-01-10 05:28:13', '2026-01-10 05:28:13'),
(13, 1, 'employee', 1, 'PRV', '25-26', 12, 2, '2026-01-28 11:11:18', '2026-01-28 11:12:49'),
(14, 1, 'employee', 1, 'PRV', '25-26', 2, 17, '2026-01-30 05:13:20', '2026-02-06 08:04:49'),
(15, 1, 'employee', 1, 'payment', '25-26', 2, 4, '2026-02-02 09:43:16', '2026-02-02 10:11:05'),
(16, 1, 'employee', 1, 'receipt', '25-26', 2, 3, '2026-02-02 09:44:03', '2026-02-02 10:28:06'),
(17, 1, 'employee', 1, 'contra', '25-26', 2, 5, '2026-02-02 09:44:38', '2026-02-02 10:33:05'),
(18, 1, 'employee', 1, 'journal', '25-26', 2, 22, '2026-02-02 10:36:55', '2026-02-05 05:20:18'),
(19, 1, 'employee', 1, 'debit', '25-26', 2, 1, '2026-02-04 07:33:55', '2026-02-04 07:33:55');

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
-- AUTO_INCREMENT for table `budgets`
--
ALTER TABLE `budgets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

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
-- AUTO_INCREMENT for table `cost_centers`
--
ALTER TABLE `cost_centers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `credit_vouchers`
--
ALTER TABLE `credit_vouchers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `credit_voucher_accounts`
--
ALTER TABLE `credit_voucher_accounts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `debit_note_entries`
--
ALTER TABLE `debit_note_entries`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `debit_note_vouchers`
--
ALTER TABLE `debit_note_vouchers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=140;

--
-- AUTO_INCREMENT for table `ledger_groups`
--
ALTER TABLE `ledger_groups`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=116;

--
-- AUTO_INCREMENT for table `purchase_history`
--
ALTER TABLE `purchase_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=226;

--
-- AUTO_INCREMENT for table `purchase_orders`
--
ALTER TABLE `purchase_orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `purchase_order_items`
--
ALTER TABLE `purchase_order_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `purchase_vouchers`
--
ALTER TABLE `purchase_vouchers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=249;

--
-- AUTO_INCREMENT for table `purchase_voucher_items`
--
ALTER TABLE `purchase_voucher_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=253;

--
-- AUTO_INCREMENT for table `sales_orders`
--
ALTER TABLE `sales_orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `sales_order_items`
--
ALTER TABLE `sales_order_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `sales_types`
--
ALTER TABLE `sales_types`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `sales_vouchers`
--
ALTER TABLE `sales_vouchers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=173;

--
-- AUTO_INCREMENT for table `sales_voucher_items`
--
ALTER TABLE `sales_voucher_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=183;

--
-- AUTO_INCREMENT for table `sale_history`
--
ALTER TABLE `sale_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=165;

--
-- AUTO_INCREMENT for table `scenarios`
--
ALTER TABLE `scenarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `set_profit`
--
ALTER TABLE `set_profit`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `stock_groups`
--
ALTER TABLE `stock_groups`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `stock_items`
--
ALTER TABLE `stock_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=85;

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `stock_units`
--
ALTER TABLE `stock_units`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `tbca`
--
ALTER TABLE `tbca`
  MODIFY `fdSiNo` int(11) NOT NULL AUTO_INCREMENT;

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `tbemployees`
--
ALTER TABLE `tbemployees`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=50;

--
-- AUTO_INCREMENT for table `voucher_entries_old`
--
ALTER TABLE `voucher_entries_old`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `voucher_main`
--
ALTER TABLE `voucher_main`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=131;

--
-- AUTO_INCREMENT for table `voucher_main_old`
--
ALTER TABLE `voucher_main_old`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `voucher_sequences`
--
ALTER TABLE `voucher_sequences`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

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
