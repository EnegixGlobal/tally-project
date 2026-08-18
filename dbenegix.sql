-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Aug 18, 2026 at 08:22 AM
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
('trial_period_days', '14', '2026-05-16 05:53:29');

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
-- Table structure for table `ca_company`
--

CREATE TABLE `ca_company` (
  `id` int(11) NOT NULL,
  `ca_id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `ca_company`
--

INSERT INTO `ca_company` (`id`, `ca_id`, `company_id`, `created_at`) VALUES
(10, 3, 1, '2026-07-18 12:28:27');

-- --------------------------------------------------------

--
-- Table structure for table `ca_users`
--

CREATE TABLE `ca_users` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `firm_name` varchar(255) NOT NULL,
  `registration_number` varchar(100) NOT NULL,
  `designation` varchar(255) DEFAULT NULL,
  `membership_number` varchar(100) DEFAULT NULL,
  `pan_number` varchar(20) DEFAULT NULL,
  `udin` varchar(100) DEFAULT NULL,
  `stamp_url` varchar(500) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `status` enum('active','suspended','pending') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `ca_users`
--

INSERT INTO `ca_users` (`id`, `name`, `email`, `phone`, `firm_name`, `registration_number`, `designation`, `membership_number`, `pan_number`, `udin`, `stamp_url`, `password`, `status`, `created_at`, `updated_at`) VALUES
(3, 'Piyush', 'piyush@gmail.com', '8709916110', 'Piysh', '131212', 'Electrician', '321321', '1541f24', '14531', NULL, '$2b$10$ELJuXE.v5GOiOTioKyHKP.cFFllceWavFnN/iBHGEzUf.7.dPZY22', 'active', '2026-07-07 10:38:11', '2026-07-07 10:38:11');

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
(1, 1, NULL, NULL, 'trial', 0, 'active', '2026-04-01 00:00:00', '2027-03-31 00:00:00', '2026-05-01 07:14:19', '2026-05-16 05:53:51');

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
(1, 'Dhanbad', 'vigyan vihar colony near hawai adda dhanbad', '', 1, 'employee', 1),
(5, 'adsf', 'adf', 'asdf', 1, 'employee', 1);

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
  `district` varchar(100) DEFAULT '',
  `pin_code` varchar(20) DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `ledgers`
--

INSERT INTO `ledgers` (`id`, `name`, `group_id`, `opening_balance`, `balance_type`, `address`, `email`, `phone`, `gst_number`, `pan_number`, `created_at`, `company_id`, `owner_type`, `owner_id`, `closing_balance`, `state`, `district`, `pin_code`) VALUES
(8, 'AMAN KUMAR', -109, 0.00, 'debit', 'Ranchi Jharkhand Indian\n\n', 'aman@gmail.com', '1234567890', '20ARDPM5490Q2ZD', 'ABCDE1234F', '2026-05-01 07:16:23', 1, 'employee', 1, 0.00, 'Jharkhand(20)', 'Palamu', '822124'),
(9, 'Sohna Kumar', -110, 0.00, 'debit', '', '', '', '', '', '2026-05-01 07:16:51', 1, 'employee', 1, 0.00, '', '', ''),
(10, '18% intra state purchase', -15, 0.00, 'debit', '', '', '', '', '', '2026-05-02 07:40:34', 1, 'employee', 1, 0.00, '', '', ''),
(16, 'Nuvoco vistas corporation ltd', -109, 0.00, 'credit', '', '', '', '20AAACL4159L1ZM', '', '2026-05-02 08:26:45', 1, 'employee', 1, 0.00, 'Jharkhand(20)', 'Palamu', ''),
(18, 'Rebate & Discount ', -11, 0.00, 'debit', '', '', '', '', '', '2026-05-16 11:38:57', 1, 'employee', 1, 0.00, '', '', ''),
(19, 'Tds 1%', -19, 0.00, 'debit', '', '', '', '', '', '2026-05-16 11:57:24', 1, 'employee', 1, 0.00, '', '', ''),
(20, 'Ayush', -110, 0.00, 'debit', '', '', '', '20BDAPP6208H2ZY', '', '2026-05-18 11:18:49', 1, 'employee', 1, 0.00, 'Odisha(21)', '', ''),
(21, 'HDFC Bank', -113, 0.00, 'debit', '', '', '', '', '', '2026-05-19 06:38:32', 1, 'employee', 1, 0.00, '', '', ''),
(23, 'Discount to Customer 1%', -10, 0.00, 'debit', '', '', '', '', '', '2026-05-19 11:18:11', 1, 'employee', 1, 0.00, '', '', ''),
(24, 'B2B', 1, 0.00, 'debit', '', '', '', '', '', '2026-05-20 06:12:26', 1, 'employee', 1, 0.00, '', '', ''),
(25, '19AAACL4159L1ZM', -109, 0.00, 'credit', '', '', '', '19AAACL4159L1ZM', '', '2026-05-20 07:14:41', 1, 'employee', 1, 0.00, 'West Bengal(19)', '', ''),
(26, 'Sbi', -113, 0.00, 'debit', '', '', '', '', '', '2026-05-21 06:45:58', 1, 'employee', 1, 0.00, '', '', ''),
(27, 'acc limited', -109, 0.00, 'debit', '', '', '', '', '', '2026-05-21 06:46:51', 1, 'employee', 1, 0.00, '', '', ''),
(28, 'ARVIND KUMAR PANDEY', -110, 0.00, 'debit', '', '', '', '', '', '2026-05-21 07:25:17', 1, 'employee', 1, 0.00, '', '', ''),
(29, 'SUSPENSE', -113, 0.00, 'debit', '', '', '', '', '', '2026-05-21 10:13:26', 1, 'employee', 1, 0.00, '', '', ''),
(30, '19AAACL4159L1Z5', -109, 0.00, 'credit', '', '', '', '19AAACL4159L1Z5', '', '2026-05-23 06:24:52', 1, 'employee', 1, 0.00, 'West Bengal(19)', '', ''),
(32, 'cash a/c', -112, 0.00, 'debit', '', '', '', '', '', '2026-05-23 10:53:52', 1, 'employee', 1, 0.00, 'Jharkhand(20)', '', ''),
(35, '18% intra state credit note', -16, 0.00, 'debit', '', '', '', '', '', '2026-06-01 10:36:01', 1, 'employee', 1, 0.00, '', '', ''),
(36, '18% intra state debit note', -16, 0.00, 'debit', '', '', '', '', '', '2026-06-01 10:47:00', 1, 'employee', 1, 0.00, '', '', ''),
(37, '20AABCM4621M1ZR', -109, 0.00, 'credit', '', '', '', '20AABCM4621M1ZR', '', '2026-06-12 08:01:27', 1, 'employee', 1, 0.00, 'Jharkhand(20)', '', ''),
(38, '20ADAPT1906B1ZD', -109, 0.00, 'credit', '', '', '', '20ADAPT1906B1ZD', '', '2026-06-12 09:46:32', 1, 'employee', 1, 0.00, 'Jharkhand(20)', '', ''),
(39, 'Discount to Customer', -10, 0.00, 'debit', '', '', '', '', '', '2026-06-13 06:37:50', 1, 'employee', 1, 0.00, '', '', ''),
(41, 'NUVOCO VISTAS CORP. LTD.', -109, 0.00, 'debit', '', '', '', '20AAACL4159L1ZO', '', '2026-06-13 09:57:07', 1, 'employee', 1, 0.00, 'Jharkhand(20)', 'Ranchi', ''),
(42, '20AAACL4159L1ZD', -110, 0.00, 'debit', '', '', '', '20AAACL4159L1ZD', '', '2026-06-15 04:35:53', 1, 'employee', 1, 0.00, 'Jharkhand(20)', '', ''),
(44, 'Stock-in-Hand', -108, 500.00, 'debit', '', '', '', '', '', '2026-06-15 11:32:24', 1, 'employee', 1, 0.00, '', '', ''),
(49, 'MONGIA STEEL LIMITED', -109, 0.00, 'credit', 'BURHIADIH, TUNDI ROAD GIRIDIH', '', '', '20AABCM4621M1ZR', 'AABCM4621M', '2026-06-17 06:34:41', 1, 'employee', 1, 0.00, 'Jharkhand(20)', '', ''),
(51, 'Asian Paints Ltd-15F4 Jinwani Ispat Private Limited', -109, 0.00, 'credit', 'Vill: Tilebani, Tundi Road., Po & Ps: Govindpur, Dist: Dhanbad', '', '', '20AAAACA3622K1Z', 'AAAACA3622', '2026-06-22 08:21:56', 1, 'employee', 1, 0.00, 'Jharkhand(20)', '', '828109'),
(52, 'NUVCO VISTAS CORP. LTD.', -109, 0.00, 'credit', 'JOJOBERA CEMENT PLANT\nSOUTH GATE, RAHARGORA\nEAST SINGHBHUM, 20-JHARKHAND', '', '', '', '', '2026-06-22 08:23:13', 1, 'employee', 1, 0.00, 'Jharkhand(20)', '', ''),
(53, 'Asian Paints Limited', -109, 0.00, 'credit', 'Jinwani Ispat Private Limited, Vill Tilibani, Tundi Road, Po & Ps: Govindpur, Dist: Dhanbad, 828109', '', '', '20AAACA3622K1Z9', 'AAACA3622K', '2026-06-23 10:38:24', 1, 'employee', 1, 0.00, 'Jharkhand(20)', '', '828109'),
(54, 'axis bank', -113, 0.00, 'debit', '', '', '', '', '', '2026-06-24 05:36:05', 1, 'employee', 1, 0.00, '', '', ''),
(59, 'Admin data', -16, 0.00, 'debit', NULL, NULL, NULL, NULL, NULL, '2026-06-25 07:19:05', 0, 'admin', 0, 0.00, '', '', ''),
(60, 'Admin data', -16, 0.00, 'debit', NULL, NULL, NULL, NULL, NULL, '2026-06-25 07:19:05', 1, 'employee', 0, 0.00, '', '', ''),
(63, 'Admin data', -16, 0.00, 'debit', NULL, NULL, NULL, NULL, NULL, '2026-07-07 09:58:52', 2, 'employee', 0, 0.00, '', '', ''),
(65, '18% Inter State Purchase', -15, 0.00, 'debit', NULL, NULL, NULL, NULL, NULL, '2026-07-13 05:20:16', 0, 'admin', 0, 0.00, '', '', ''),
(66, '18% Inter State Purchase', -15, 0.00, 'debit', NULL, NULL, NULL, NULL, NULL, '2026-07-13 05:20:16', 1, 'employee', 0, 0.00, '', '', ''),
(67, '18% Inter State Sales', -16, 0.00, 'debit', NULL, NULL, NULL, NULL, NULL, '2026-07-13 05:20:35', 0, 'admin', 0, 0.00, '', '', ''),
(68, '18% Inter State Sales', -16, 0.00, 'debit', NULL, NULL, NULL, NULL, NULL, '2026-07-13 05:20:35', 1, 'employee', 0, 0.00, '', '', ''),
(69, '18% Intra State Purchase', -15, 0.00, 'debit', NULL, NULL, NULL, NULL, NULL, '2026-07-13 05:20:52', 0, 'admin', 0, 0.00, '', '', ''),
(70, '18% Intra State Purchase', -15, 0.00, 'debit', NULL, NULL, NULL, NULL, NULL, '2026-07-13 05:20:52', 1, 'employee', 0, 0.00, '', '', ''),
(71, '18% Intra State Sales', -16, 0.00, 'debit', NULL, NULL, NULL, NULL, NULL, '2026-07-13 05:21:03', 0, 'admin', 0, 0.00, '', '', ''),
(72, '18% Intra State Sales', -16, 0.00, 'debit', NULL, NULL, NULL, NULL, NULL, '2026-07-13 05:21:03', 1, 'employee', 0, 0.00, '', '', ''),
(74, '18%Igst', -103, 0.00, 'debit', NULL, NULL, NULL, NULL, NULL, '2026-07-13 05:21:14', 1, 'employee', 0, 0.00, '', '', ''),
(76, '9%Cgst', -103, 0.00, 'debit', NULL, NULL, NULL, NULL, NULL, '2026-07-13 05:21:29', 1, 'employee', 0, 0.00, '', '', ''),
(78, '9%Sgst', -103, 0.00, 'debit', NULL, NULL, NULL, NULL, NULL, '2026-07-13 05:21:38', 1, 'employee', 0, 0.00, '', '', ''),
(79, 'Gst payable', -6, 0.00, 'debit', NULL, NULL, NULL, NULL, NULL, '2026-07-18 04:54:56', 0, 'admin', 0, 0.00, '', '', ''),
(80, 'Gst payable', -6, 0.00, 'debit', NULL, NULL, NULL, NULL, NULL, '2026-07-18 04:54:56', 1, 'employee', 0, 0.00, '', '', ''),
(81, 'Non-GST', -16, 0.00, 'debit', NULL, NULL, NULL, NULL, NULL, '2026-07-18 04:55:22', 0, 'admin', 0, 0.00, '', '', ''),
(82, 'Non-GST', -16, 0.00, 'debit', NULL, NULL, NULL, NULL, NULL, '2026-07-18 04:55:22', 1, 'employee', 0, 0.00, '', '', ''),
(84, '5% IGST', -103, 0.00, 'debit', '', '', '', '', '', '2026-08-17 09:40:31', 1, 'employee', 1, 0.00, '', '', ''),
(85, '2.5%cgst', -103, 0.00, 'debit', '', '', '', '', '', '2026-08-17 09:40:41', 1, 'employee', 1, 0.00, '', '', ''),
(86, '2.5%sgst', -103, 0.00, 'debit', '', '', '', '', '', '2026-08-17 09:40:56', 1, 'employee', 1, 0.00, '', '', ''),
(87, '5% Inter State Purchase', -15, 0.00, 'debit', '', '', '', '', '', '2026-08-17 09:41:47', 1, 'employee', 1, 0.00, '', '', '');

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
(1, 'B2B', NULL, -110, '2026-05-01 07:30:27', NULL, 'Assets', 0, 0, 0, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, 1, 'employee', 1);

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
  `discountLedgerId` int(11) DEFAULT NULL,
  `tracking_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
(1, 'B2B', 'Sales', 'b2b/', '/26-27', 1, '1', 'employee', '1', '2026-05-01 08:21:24', '2026-08-17 10:30:26'),
(2, 'B2C', 'Sales', 'b2c/', '/26-27', 1, '1', 'employee', '1', '2026-05-01 08:21:33', '2026-08-17 10:30:26');

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
  `approxDistance` varchar(50) DEFAULT NULL,
  `overallDiscountLedgerId` int(11) DEFAULT NULL,
  `overallDiscountAmount` decimal(10,2) DEFAULT NULL
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
  `discountLedgerId` int(11) DEFAULT NULL,
  `tracking_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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

--
-- Dumping data for table `sale_history`
--

INSERT INTO `sale_history` (`id`, `companyId`, `ownerType`, `ownerId`, `itemId`, `quantity`, `rate`, `value`, `movementType`, `movementDate`, `createdAt`, `itemName`, `hsnCode`, `batchNumber`, `qtyChange`, `voucherNumber`, `godownId`) VALUES
(824, 1, 'employee', 1, NULL, 0.00, 0.00, 0.00, NULL, '2026-07-02 00:00:00', '2026-07-02 11:27:05', '-', '', NULL, 0, 'b2b/31/26-27', NULL),
(825, 1, 'employee', 1, NULL, 0.00, 0.00, 0.00, NULL, '2026-07-02 00:00:00', '2026-07-02 11:27:05', '-', '', NULL, 0, 'b2b/31/26-27', 1),
(826, 1, 'employee', 1, NULL, 0.00, 0.00, 0.00, NULL, '2026-07-02 00:00:00', '2026-07-02 11:27:05', '-', '', NULL, 0, 'b2b/31/26-27', 1),
(827, 1, 'employee', 1, NULL, 0.00, 0.00, 0.00, NULL, '2026-07-02 00:00:00', '2026-07-02 11:27:05', '-', '', NULL, 0, 'b2b/31/26-27', 1),
(845, 1, 'employee', 1, NULL, 0.00, 50.00, 0.00, NULL, '2026-07-09 00:00:00', '2026-07-09 16:01:27', 'Abc', '4444', NULL, -1, 'b2b/32/26-27', 1),
(854, 1, 'employee', 1, NULL, 0.00, 100.00, 0.00, NULL, '2026-07-14 00:00:00', '2026-07-14 10:53:40', 'Abc', '4444', NULL, -1, 'b2b/1/26-27', 1),
(855, 1, 'employee', 1, NULL, 0.00, 100.00, 0.00, NULL, '2026-07-14 00:00:00', '2026-07-14 11:03:56', 'Abc', '4444', NULL, -1, 'b2b/2/26-27', 1),
(856, 1, 'employee', 1, NULL, 0.00, 100.00, 0.00, NULL, '2026-07-14 00:00:00', '2026-07-14 16:00:17', 'Abc', '4444', NULL, -1, 'b2c/1/26-27', 1),
(859, 1, 'employee', 1, NULL, 0.00, 235.00, 0.00, NULL, '2026-07-17 00:00:00', '2026-07-17 12:15:14', 'Abc', '4444', NULL, -1, 'b2b/3/26-27', 1),
(861, 1, 'employee', 1, NULL, 0.00, 235.00, 0.00, NULL, '2026-07-17 00:00:00', '2026-07-17 12:16:11', 'Abc', '4444', NULL, -11, 'b2b/4/26-27', 1),
(863, 1, 'employee', 1, NULL, 0.00, 100.00, 0.00, NULL, '2026-07-18 00:00:00', '2026-07-18 11:22:22', 'Abc', '4444', NULL, -1, 'b2b/5/26-27', 1),
(864, 1, 'employee', 1, NULL, 0.00, 100.00, 0.00, NULL, '2026-07-18 00:00:00', '2026-07-18 11:38:53', 'Abc', '4444', NULL, -1, 'b2c/2/26-27', 1),
(865, 1, 'employee', 1, NULL, 0.00, 100.00, 0.00, NULL, '2026-08-12 00:00:00', '2026-08-12 10:53:27', 'Abc', '4444', NULL, -10, 'b2b/6/26-27', 1),
(866, 1, 'employee', 1, NULL, 0.00, 10.00, 0.00, NULL, '2026-08-13 00:00:00', '2026-08-13 12:45:39', 'Abc', '4444', NULL, -10, 'b2c/3/26-27', 1);

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
(1, NULL, NULL, NULL, 'employee', 1, '2026-06-25 08:21:11', 'profit_percentage', 2.00, 'profit_percentage', 5.00);

-- --------------------------------------------------------

--
-- Table structure for table `stock_attributes`
--

CREATE TABLE `stock_attributes` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `value` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `stock_attributes`
--

INSERT INTO `stock_attributes` (`id`, `name`, `value`) VALUES
(7, 'imei', NULL),
(8, 'colour', NULL),
(9, 'brand', NULL),
(10, 'most', NULL),
(11, 'gram', NULL);

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
('SC-1777619861560', 'services', '1', NULL, '2026-05-01 07:17:41', '2026-05-01 07:17:41', 1, 'employee', 1);

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
(1, '18% services', NULL, 1, 0, NULL, NULL, NULL, 0, NULL, 'Taxable', 0.00, 0.00, '2026-05-01 07:17:14', 1, 'employee', 1);

-- --------------------------------------------------------

--
-- Table structure for table `stock_items`
--

CREATE TABLE `stock_items` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `unit` varchar(50) DEFAULT NULL,
  `hsnCode` varchar(50) DEFAULT NULL,
  `taxType` varchar(50) DEFAULT 'Taxable',
  `enableBatchTracking` tinyint(1) DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
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
  `is_visible` tinyint(1) DEFAULT 1,
  `attributeId` int(11) DEFAULT NULL,
  `gstRate` decimal(5,2) DEFAULT 0.00,
  `godown_id` int(11) DEFAULT NULL,
  `tracking_type` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `stock_items`
--

INSERT INTO `stock_items` (`id`, `name`, `unit`, `hsnCode`, `taxType`, `enableBatchTracking`, `createdAt`, `company_id`, `owner_type`, `owner_id`, `barcode`, `batches`, `type`, `categoryId`, `gstLedgerId`, `cgstLedgerId`, `sgstLedgerId`, `image`, `is_visible`, `attributeId`, `gstRate`, `godown_id`, `tracking_type`) VALUES
(14, 'Biscute', '2', '1111', 'Taxable', 1, '2026-05-23 09:34:33', 1, 'employee', 1, '8908375740717', '[]', 'opening', 'SC-1777619861560', 74, 76, 78, NULL, 1, NULL, 0.00, NULL, NULL),
(15, 'Mobile', '2', '4444', 'Taxable', 1, '2026-05-23 09:35:44', 1, 'employee', 1, '8906627161242', '[]', 'opening', 'SC-1777619861560', 74, 76, 78, NULL, 1, NULL, 0.00, NULL, NULL),
(16, 'Nuvoco cement psc', '2', '25232940', 'Taxable', 1, '2026-05-26 05:45:03', 1, 'employee', 1, '8909506983966', '[]', 'opening', 'SC-1777619861560', 74, 76, 78, NULL, 1, NULL, 0.00, NULL, NULL),
(17, 'Nuvoco cement crt', '2', '25232940', 'Taxable', 1, '2026-05-26 05:45:43', 1, 'employee', 1, '8901703133601', '[]', 'opening', 'SC-1777619861560', 74, 76, 78, NULL, 1, NULL, 0.00, NULL, NULL),
(18, 'Nuvoco cement Uno', '2', '25232940', 'Taxable', 1, '2026-05-26 05:46:08', 1, 'employee', 1, '8909264326197', '[]', 'opening', 'SC-1777619861560', 74, 76, 78, NULL, 1, NULL, 0.00, NULL, NULL),
(21, 'Biscute', '2', '4444', 'Taxable', 1, '2026-06-02 10:49:01', 1, 'employee', 1, '8903654638563', '[{\"batchName\":null,\"batchQuantity\":10,\"batchRate\":200,\"batchExpiryDate\":null,\"mode\":\"purchase\",\"batchManufacturingDate\":null,\"mrp\":0}]', 'opening', 'SC-1777619861560', 84, 85, 86, NULL, 1, NULL, 0.00, NULL, NULL),
(25, 'M.S.Bars', '2', '721420', 'Taxable', 1, '2026-06-17 07:29:23', 1, 'employee', 1, '232378222515', '[]', 'opening', 'SC-1777619861560', 74, 76, 78, NULL, 1, NULL, 18.00, NULL, NULL),
(26, 'PSC PP_EU CEMENT', '2', '25232940', 'Taxable', 1, '2026-06-17 07:42:08', 1, 'employee', 1, '669599711798', '[]', 'opening', 'SC-1777619861560', 74, 76, 78, NULL, 1, NULL, 18.00, NULL, NULL),
(28, 'CLRTLSCWWARRANTYCARD 1PC', '2', '482110', 'Taxable', 1, '2026-06-22 08:22:00', 1, 'employee', 1, '658414622429', '[]', 'opening', 'SC-1777619861560', 74, 76, 78, NULL, 1, NULL, 0.00, NULL, NULL),
(29, 'ZBHO M 1WC+ 10L / 38246090 / 10 L per 1 EA', '2', '9061000032', 'Taxable', 1, '2026-06-22 08:23:15', 1, 'employee', 1, '269553381135', '[]', 'opening', 'SC-1777619861560', 74, 76, 78, NULL, 1, NULL, 18.00, NULL, NULL),
(30, 'Abc', '1', '4444', 'Taxable', 1, '2026-06-25 09:41:29', 1, 'employee', 1, '8906456732316', '[]', 'opening', 'SC-1777619861560', 74, 76, 78, NULL, 1, NULL, 18.00, 1, NULL),
(31, 'Mobile', '2', '1111', 'Taxable', 1, '2026-08-08 06:25:07', 1, 'employee', 1, '8900013613032', '[{\"batchName\":null,\"batchQuantity\":10,\"batchRate\":300,\"batchExpiryDate\":null,\"mode\":\"purchase\",\"batchManufacturingDate\":null,\"mrp\":0}]', 'opening', 'SC-1777619861560', 74, 76, 78, NULL, 1, NULL, 18.00, NULL, 'attribute');

-- --------------------------------------------------------

--
-- Table structure for table `stock_item_attributes`
--

CREATE TABLE `stock_item_attributes` (
  `id` int(11) NOT NULL,
  `stock_item_id` int(11) NOT NULL,
  `attribute_id` int(11) NOT NULL,
  `attribute_value` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `stock_item_attributes`
--

INSERT INTO `stock_item_attributes` (`id`, `stock_item_id`, `attribute_id`, `attribute_value`, `created_at`) VALUES
(60, 30, 11, NULL, '2026-08-14 10:24:45'),
(61, 30, 10, NULL, '2026-08-14 10:24:45');

-- --------------------------------------------------------

--
-- Table structure for table `stock_item_attribute_tracking`
--

CREATE TABLE `stock_item_attribute_tracking` (
  `id` int(11) NOT NULL,
  `stock_item_id` int(11) NOT NULL,
  `primary_attribute_id` int(11) NOT NULL,
  `quantity` decimal(10,2) NOT NULL DEFAULT 0.00,
  `rate` decimal(10,2) NOT NULL DEFAULT 0.00,
  `total_value` decimal(10,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `primary_attribute_value` varchar(255) DEFAULT NULL,
  `mode` varchar(50) DEFAULT 'opening'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `stock_item_attribute_tracking`
--

INSERT INTO `stock_item_attribute_tracking` (`id`, `stock_item_id`, `primary_attribute_id`, `quantity`, `rate`, `total_value`, `created_at`, `primary_attribute_value`, `mode`) VALUES
(7, 31, 7, 10.00, 10.00, 100.00, '2026-08-14 09:59:15', '333333', 'opening');

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
  `owner_id` int(11) NOT NULL,
  `type` varchar(20) DEFAULT 'Simple',
  `formalName` varchar(100) DEFAULT NULL,
  `decimalPlaces` int(11) DEFAULT 2,
  `firstUnit` varchar(50) DEFAULT NULL,
  `conversionFactor` decimal(10,3) DEFAULT NULL,
  `secondUnit` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `stock_units`
--

INSERT INTO `stock_units` (`id`, `name`, `symbol`, `created_at`, `company_id`, `owner_type`, `owner_id`, `type`, `formalName`, `decimalPlaces`, `firstUnit`, `conversionFactor`, `secondUnit`) VALUES
(1, 'kg', 'KG', '2026-05-01 07:18:04', 1, 'employee', 1, 'Simple', NULL, 0, NULL, 1.000, NULL),
(2, 'Bags', 'BG', '2026-05-19 10:24:37', 1, 'employee', 1, 'Simple', NULL, 1, NULL, 1.000, NULL),
(4, '1 BG of 1 BG', 'BG of 1 BG', '2026-05-21 10:26:07', 1, 'employee', 1, 'Simple', NULL, 2, NULL, NULL, NULL);

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
(1, 'admin@apnabook.com', '$2b$10$lNFCN1f9VP0foEsT73.afusVVxsofFimxX1jJOxYc3hvyAwWBvXQi', '2026-05-02 04:30:59');

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
(2, 'Ayush', '8709916110', 'ayush@gmail.com', '$2b$10$M34yKeywhQswkmiqQwRSdeKWXF.vnbJurhq9nUePD01iZeOwf1HS2', 'active', '2026-07-08 18:15:13', NULL);

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
  `tan_number` varchar(20) DEFAULT NULL,
  `back_date_allowed` tinyint(1) DEFAULT 1,
  `assessee_name` varchar(100) DEFAULT NULL,
  `company_type` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbcompanies`
--

INSERT INTO `tbcompanies` (`id`, `name`, `financial_year`, `books_beginning_year`, `address`, `pin`, `phone_number`, `email`, `pan_number`, `gst_number`, `state`, `country`, `tax_type`, `employee_id`, `vault_password`, `created_at`, `vat_number`, `fdAccountType`, `fdAccountantName`, `tan_number`, `back_date_allowed`, `assessee_name`, `company_type`) VALUES
(1, 'ApnoTax solutions', '2026-27', '2026-04-01', 'vigyan vihar colony near hawai adda dhanbad', '826004', '', 'arvind12601@gmail.com', 'BDAPP6208H', '27ABCDE1234F1Z5', 'Jharkhand(20)', 'India', 'GST', 1, NULL, '2026-05-01 07:14:19', NULL, 'accountant', 'Ayush', 'ABCDE1234G', 1, 'Ayush', 'Trust');

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
(1, 'A', 'k', 'BDAPP6208H', 'VIHYAN VIHAR COLONY DHANBAD 826004', 'arvind12601@gmail.com', '1234567890', '$2b$10$o0kxC43BqdN3ep1E5s25f.KnTA.rXecbiN2V2uERTVQv3Ki3N/uxm', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFydmluZDEyNjAxQGdtYWlsLmNvbSIsImlhdCI6MTc3NzYxOTU4MSwiZXhwIjoxNzc4MjI0MzgxfQ.jpG6xUTdWuTWKaeckgARWguvMY3Vc_PSkKqrkwZdNF4', '2026-05-01 07:13:01', 5, NULL, NULL, NULL, 0);

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
  `status` enum('Deposited','Book Adjustment') NOT NULL DEFAULT 'Deposited',
  `company_id` int(11) DEFAULT NULL,
  `last_bsr_code` varchar(20) DEFAULT NULL,
  `last_date_of_deposit` date DEFAULT NULL,
  `last_challan_serial_no` varchar(50) DEFAULT NULL,
  `last_total_tax_deposited` decimal(15,2) DEFAULT 0.00,
  `update_mode` varchar(20) DEFAULT 'Add',
  `section_code` varchar(20) DEFAULT '94C',
  `interest_allocated` decimal(15,2) DEFAULT 0.00,
  `minor_head` varchar(20) DEFAULT '200',
  `challan_balance` decimal(15,2) DEFAULT 0.00,
  `cheque_dd_no` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tds_26q_challans`
--

INSERT INTO `tds_26q_challans` (`id`, `return_id`, `serial_no`, `bsr_code`, `date_of_deposit`, `challan_serial_no`, `tax`, `surcharge`, `education_cess`, `other_charges`, `interest`, `penalty`, `fee`, `total_amount`, `transfer_voucher_no`, `status`, `company_id`, `last_bsr_code`, `last_date_of_deposit`, `last_challan_serial_no`, `last_total_tax_deposited`, `update_mode`, `section_code`, `interest_allocated`, `minor_head`, `challan_balance`, `cheque_dd_no`) VALUES
(8, 0, 1, '2222222', '2026-06-04', '11111', 11.00, 11.00, 11.00, 111.00, 11.00, 1.00, 11.00, 56.00, NULL, 'Deposited', 1, '2222222', '2026-06-04', '11111', 11.00, 'Add', '193', 111.00, '200', 111.00, '11'),
(9, 0, 2, '3333333', '2026-06-04', '22222', 222.00, 22.00, 22.00, 22.00, 22.00, 22.00, 22.00, 332.00, NULL, 'Deposited', 1, '3333333', '2026-06-04', '22222', 22.00, 'Add', '94C', 1222.00, '200', 2222.00, '22'),
(10, 0, 3, '4444444', '2026-06-05', '44444', 44.00, 44.00, 44.00, 440.00, 44.00, 44.00, 44.00, 264.00, NULL, 'Deposited', 1, '4444444', '2026-06-05', '44444', 44.00, 'Add', '94C', 444.00, '200', 444.00, '44');

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

--
-- Dumping data for table `tds_26q_returns`
--

INSERT INTO `tds_26q_returns` (`id`, `tan`, `assessment_year`, `pan_of_deductor`, `deductor_category`, `deductor_name`, `branch_serial_no`, `deductor_flat_no`, `deductor_premises_name`, `deductor_road_street`, `deductor_area`, `deductor_town_city`, `deductor_state`, `deductor_country`, `deductor_pin_code`, `deductor_std_code`, `deductor_telephone`, `deductor_email`, `resp_status`, `resp_designation`, `resp_name`, `resp_father_name`, `resp_pan`, `verification_capacity`, `verification_place`, `verification_date`, `verification_full_name`, `verification_designation`, `verification_signature`, `created_at`) VALUES
(4, 'ABCDE1234G', '2026-27', 'BDAPP6208H', 'Individual/HUF', 'ApnoTax solutions', NULL, 'vigyan vihar colony near hawai adda dhanbad', '', '', '', '', 'JH', 'India', '826004', '', '1234567890', 'arvind12601@gmail.com', 'Deductor', '', 'ApnoTax solutions', '', 'BDAPP6208H', 'Deductor', '', '2026-06-05', '', '', '', '2026-06-05 05:25:07');

-- --------------------------------------------------------

--
-- Table structure for table `tracking_sub_attributes`
--

CREATE TABLE `tracking_sub_attributes` (
  `id` int(11) NOT NULL,
  `tracking_id` int(11) NOT NULL,
  `sub_attribute_id` int(11) NOT NULL,
  `sub_attribute_value` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tracking_sub_attributes`
--

INSERT INTO `tracking_sub_attributes` (`id`, `tracking_id`, `sub_attribute_id`, `sub_attribute_value`) VALUES
(11, 7, 9, '54555523');

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
  `ledger_name` varchar(255) DEFAULT NULL,
  `voucher_type` varchar(50) DEFAULT 'accounting'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `voucher_entries`
--

INSERT INTO `voucher_entries` (`id`, `voucher_id`, `ledger_id`, `amount`, `entry_type`, `narration`, `bank_name`, `cheque_number`, `cost_centre_id`, `item_id`, `ledger_name`, `voucher_type`) VALUES
(3047, 493, 29, 165000.00, 'credit', NULL, NULL, NULL, NULL, NULL, 'SUSPENSE', 'accounting'),
(3048, 493, 54, 165000.00, 'debit', NULL, NULL, NULL, NULL, NULL, 'axis bank', 'accounting'),
(3049, 494, 29, 482000.00, 'debit', NULL, NULL, NULL, NULL, NULL, 'SUSPENSE', 'accounting'),
(3050, 494, 54, 482000.00, 'credit', NULL, NULL, NULL, NULL, NULL, 'axis bank', 'accounting'),
(3051, 495, 29, 165000.00, 'credit', NULL, NULL, NULL, NULL, NULL, 'SUSPENSE', 'accounting'),
(3052, 495, 54, 165000.00, 'debit', NULL, NULL, NULL, NULL, NULL, 'axis bank', 'accounting'),
(3053, 496, 29, 2360.00, 'debit', NULL, NULL, NULL, NULL, NULL, 'SUSPENSE', 'accounting'),
(3054, 496, 54, 2360.00, 'credit', NULL, NULL, NULL, NULL, NULL, 'axis bank', 'accounting'),
(3055, 497, 29, 14079.00, 'debit', NULL, NULL, NULL, NULL, NULL, 'SUSPENSE', 'accounting'),
(3056, 497, 54, 14079.00, 'credit', NULL, NULL, NULL, NULL, NULL, 'axis bank', 'accounting'),
(3057, 498, 29, 16439.00, 'credit', NULL, NULL, NULL, NULL, NULL, 'SUSPENSE', 'accounting'),
(3058, 498, 54, 16439.00, 'debit', NULL, NULL, NULL, NULL, NULL, 'axis bank', 'accounting'),
(3059, 499, 29, 31500.00, 'credit', NULL, NULL, NULL, NULL, NULL, 'SUSPENSE', 'accounting'),
(3060, 499, 54, 31500.00, 'debit', NULL, NULL, NULL, NULL, NULL, 'axis bank', 'accounting'),
(3061, 500, 29, 1.00, 'credit', NULL, NULL, NULL, NULL, NULL, 'SUSPENSE', 'accounting'),
(3062, 500, 54, 1.00, 'debit', NULL, NULL, NULL, NULL, NULL, 'axis bank', 'accounting'),
(3063, 501, 29, 30400.00, 'credit', NULL, NULL, NULL, NULL, NULL, 'SUSPENSE', 'accounting'),
(3064, 501, 54, 30400.00, 'debit', NULL, NULL, NULL, NULL, NULL, 'axis bank', 'accounting'),
(3065, 502, 29, 210000.00, 'credit', NULL, NULL, NULL, NULL, NULL, 'SUSPENSE', 'accounting'),
(3066, 502, 54, 210000.00, 'debit', NULL, NULL, NULL, NULL, NULL, 'axis bank', 'accounting'),
(3067, 503, 29, 1450000.00, 'debit', NULL, NULL, NULL, NULL, NULL, 'SUSPENSE', 'accounting'),
(3068, 503, 54, 1450000.00, 'credit', NULL, NULL, NULL, NULL, NULL, 'axis bank', 'accounting'),
(3069, 504, 29, 162500.00, 'credit', NULL, NULL, NULL, NULL, NULL, 'SUSPENSE', 'accounting'),
(3070, 504, 54, 162500.00, 'debit', NULL, NULL, NULL, NULL, NULL, 'axis bank', 'accounting'),
(3071, 505, 29, 162500.00, 'credit', NULL, NULL, NULL, NULL, NULL, 'SUSPENSE', 'accounting'),
(3072, 505, 54, 162500.00, 'debit', NULL, NULL, NULL, NULL, NULL, 'axis bank', 'accounting'),
(3073, 506, 29, 8771.00, 'debit', NULL, NULL, NULL, NULL, NULL, 'SUSPENSE', 'accounting'),
(3074, 506, 54, 8771.00, 'credit', NULL, NULL, NULL, NULL, NULL, 'axis bank', 'accounting'),
(3075, 507, 29, 1300000.00, 'credit', NULL, NULL, NULL, NULL, NULL, 'SUSPENSE', 'accounting'),
(3076, 507, 54, 1300000.00, 'debit', NULL, NULL, NULL, NULL, NULL, 'axis bank', 'accounting'),
(3077, 508, 29, 430000.00, 'debit', NULL, NULL, NULL, NULL, NULL, 'SUSPENSE', 'accounting'),
(3078, 508, 54, 430000.00, 'credit', NULL, NULL, NULL, NULL, NULL, 'axis bank', 'accounting'),
(3079, 509, 29, 270000.00, 'credit', NULL, NULL, NULL, NULL, NULL, 'SUSPENSE', 'accounting'),
(3080, 509, 54, 270000.00, 'debit', NULL, NULL, NULL, NULL, NULL, 'axis bank', 'accounting'),
(3081, 510, 29, 150000.00, 'credit', NULL, NULL, NULL, NULL, NULL, 'SUSPENSE', 'accounting'),
(3082, 510, 54, 150000.00, 'debit', NULL, NULL, NULL, NULL, NULL, 'axis bank', 'accounting'),
(3083, 511, 29, 300000.00, 'debit', NULL, NULL, NULL, NULL, NULL, 'SUSPENSE', 'accounting'),
(3084, 511, 54, 300000.00, 'credit', NULL, NULL, NULL, NULL, NULL, 'axis bank', 'accounting'),
(3085, 512, 29, 145000.00, 'credit', NULL, NULL, NULL, NULL, NULL, 'SUSPENSE', 'accounting'),
(3086, 512, 54, 145000.00, 'debit', NULL, NULL, NULL, NULL, NULL, 'axis bank', 'accounting'),
(3087, 513, 29, 142500.00, 'credit', NULL, NULL, NULL, NULL, NULL, 'SUSPENSE', 'accounting'),
(3088, 513, 54, 142500.00, 'debit', NULL, NULL, NULL, NULL, NULL, 'axis bank', 'accounting'),
(3089, 514, 29, 100.00, 'debit', NULL, NULL, NULL, NULL, NULL, 'SUSPENSE', 'accounting'),
(3090, 514, 54, 100.00, 'credit', NULL, NULL, NULL, NULL, NULL, 'axis bank', 'accounting'),
(3091, 515, 29, 40281.64, 'debit', NULL, NULL, NULL, NULL, NULL, 'SUSPENSE', 'accounting'),
(3092, 515, 54, 40281.64, 'credit', NULL, NULL, NULL, NULL, NULL, 'axis bank', 'accounting'),
(3093, 516, 29, 88000.00, 'credit', NULL, NULL, NULL, NULL, NULL, 'SUSPENSE', 'accounting'),
(3094, 516, 54, 88000.00, 'debit', NULL, NULL, NULL, NULL, NULL, 'axis bank', 'accounting'),
(3095, 517, 29, 12000.00, 'credit', NULL, NULL, NULL, NULL, NULL, 'SUSPENSE', 'accounting'),
(3096, 517, 54, 12000.00, 'debit', NULL, NULL, NULL, NULL, NULL, 'axis bank', 'accounting'),
(3097, 518, 29, 500000.00, 'debit', NULL, NULL, NULL, NULL, NULL, 'SUSPENSE', 'accounting'),
(3098, 518, 54, 500000.00, 'credit', NULL, NULL, NULL, NULL, NULL, 'axis bank', 'accounting'),
(3099, 519, 29, 170000.00, 'credit', NULL, NULL, NULL, NULL, NULL, 'SUSPENSE', 'accounting'),
(3100, 519, 54, 170000.00, 'debit', NULL, NULL, NULL, NULL, NULL, 'axis bank', 'accounting'),
(3101, 520, 29, 94300.00, 'credit', NULL, NULL, NULL, NULL, NULL, 'SUSPENSE', 'accounting'),
(3102, 520, 54, 94300.00, 'debit', NULL, NULL, NULL, NULL, NULL, 'axis bank', 'accounting'),
(3103, 521, 29, 600000.00, 'debit', NULL, NULL, NULL, NULL, NULL, 'SUSPENSE', 'accounting'),
(3104, 521, 54, 600000.00, 'credit', NULL, NULL, NULL, NULL, NULL, 'axis bank', 'accounting'),
(3105, 522, 29, 100000.00, 'credit', NULL, NULL, NULL, NULL, NULL, 'SUSPENSE', 'accounting'),
(3106, 522, 54, 100000.00, 'debit', NULL, NULL, NULL, NULL, NULL, 'axis bank', 'accounting'),
(3107, 523, 29, 168000.00, 'debit', NULL, NULL, NULL, NULL, NULL, 'SUSPENSE', 'accounting'),
(3108, 523, 54, 168000.00, 'credit', NULL, NULL, NULL, NULL, NULL, 'axis bank', 'accounting'),
(3109, 524, 29, 1500000.00, 'debit', NULL, NULL, NULL, NULL, NULL, 'SUSPENSE', 'accounting'),
(3110, 524, 54, 1500000.00, 'credit', NULL, NULL, NULL, NULL, NULL, 'axis bank', 'accounting'),
(3111, 525, 29, 1000000.00, 'credit', NULL, NULL, NULL, NULL, NULL, 'SUSPENSE', 'accounting'),
(3112, 525, 54, 1000000.00, 'debit', NULL, NULL, NULL, NULL, NULL, 'axis bank', 'accounting'),
(3113, 526, 29, 180000.00, 'credit', NULL, NULL, NULL, NULL, NULL, 'SUSPENSE', 'accounting'),
(3114, 526, 54, 180000.00, 'debit', NULL, NULL, NULL, NULL, NULL, 'axis bank', 'accounting'),
(3115, 527, 29, 185000.00, 'credit', NULL, NULL, NULL, NULL, NULL, 'SUSPENSE', 'accounting'),
(3116, 527, 54, 185000.00, 'debit', NULL, NULL, NULL, NULL, NULL, 'axis bank', 'accounting'),
(3117, 528, 29, 185000.00, 'debit', NULL, NULL, NULL, NULL, NULL, 'SUSPENSE', 'accounting'),
(3118, 528, 54, 185000.00, 'credit', NULL, NULL, NULL, NULL, NULL, 'axis bank', 'accounting'),
(3119, 529, 29, 300000.00, 'credit', NULL, NULL, NULL, NULL, NULL, 'SUSPENSE', 'accounting'),
(3120, 529, 54, 300000.00, 'debit', NULL, NULL, NULL, NULL, NULL, 'axis bank', 'accounting'),
(3121, 530, 29, 1000000.00, 'debit', NULL, NULL, NULL, NULL, NULL, 'SUSPENSE', 'accounting'),
(3122, 530, 54, 1000000.00, 'credit', NULL, NULL, NULL, NULL, NULL, 'axis bank', 'accounting'),
(3123, 531, 29, 550000.00, 'debit', NULL, NULL, NULL, NULL, NULL, 'SUSPENSE', 'accounting'),
(3124, 531, 54, 550000.00, 'credit', NULL, NULL, NULL, NULL, NULL, 'axis bank', 'accounting'),
(3125, 532, 29, 160000.00, 'credit', NULL, NULL, NULL, NULL, NULL, 'SUSPENSE', 'accounting'),
(3126, 532, 54, 160000.00, 'debit', NULL, NULL, NULL, NULL, NULL, 'axis bank', 'accounting'),
(3127, 533, 29, 260000.00, 'credit', NULL, NULL, NULL, NULL, NULL, 'SUSPENSE', 'accounting'),
(3128, 533, 54, 260000.00, 'debit', NULL, NULL, NULL, NULL, NULL, 'axis bank', 'accounting'),
(3129, 534, 29, 500000.00, 'debit', NULL, NULL, NULL, NULL, NULL, 'SUSPENSE', 'accounting'),
(3130, 534, 54, 500000.00, 'credit', NULL, NULL, NULL, NULL, NULL, 'axis bank', 'accounting'),
(3131, 535, 29, 198000.00, 'credit', NULL, NULL, NULL, NULL, NULL, 'SUSPENSE', 'accounting'),
(3132, 535, 54, 198000.00, 'debit', NULL, NULL, NULL, NULL, NULL, 'axis bank', 'accounting'),
(3133, 536, 29, 96700.00, 'credit', NULL, NULL, NULL, NULL, NULL, 'SUSPENSE', 'accounting'),
(3134, 536, 54, 96700.00, 'debit', NULL, NULL, NULL, NULL, NULL, 'axis bank', 'accounting'),
(3225, 538, 54, 44440.00, 'credit', NULL, NULL, NULL, NULL, NULL, 'SUSPENSE', 'accounting'),
(3226, 538, 8, 44440.00, 'debit', NULL, NULL, NULL, NULL, NULL, 'AMAN KUMAR', 'accounting');

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
(493, 'receipt', 'RV/25-26/000001', '2025-11-01', 'IMPS/P2A/530509137597/VIKASKUM/BANKOFIN/UAMBCeme/9193732722429013000', NULL, '2025-11-01', NULL, '1', 'employee', '1'),
(494, 'payment', 'PV/25-26/000001', '2025-11-03', 'RTGS/SK/UTIBR52025110300366090/3252/NOVOCO VISTAS CORP L/HSBC BANK', NULL, '2025-11-03', NULL, '1', 'employee', '1'),
(495, 'receipt', 'RV/25-26/000002', '2025-11-05', 'IMPS/P2A/530907367530/VIKASKUM/BANKOFIN/UAMBCeme/9193732722429013000', NULL, '2025-11-05', NULL, '1', 'employee', '1'),
(496, 'payment', 'PV/25-26/000002', '2025-11-05', 'ANNSC-ASC charges Incl GST', NULL, '2025-11-05', NULL, '1', 'employee', '1'),
(497, 'payment', 'PV/25-26/000003', '2025-11-05', '924030071869537:Int.Coll:06-10-2025 to 05-11-2025', NULL, '2025-11-05', NULL, '1', 'employee', '1'),
(498, 'receipt', 'RV/25-26/000003', '2025-11-06', 'TRF/PARMJEET KAUR/transfer by cheque', NULL, '2025-11-06', NULL, '1', 'employee', '1'),
(499, 'receipt', 'RV/25-26/000004', '2025-11-06', 'CLG/020231/011125/Icici Bank/', NULL, '2025-11-06', NULL, '1', 'employee', '1'),
(500, 'receipt', 'RV/25-26/000005', '2025-11-08', 'UPI/P2A/318607093379/MUKESH KU/BKID/Payment/', NULL, '2025-11-08', NULL, '1', 'employee', '1'),
(501, 'receipt', 'RV/25-26/000006', '2025-11-08', 'UPI/P2A/896859054967/MUKESH KU/BANK OF B/Payment/', NULL, '2025-11-08', NULL, '1', 'employee', '1'),
(502, 'receipt', 'RV/25-26/000007', '2025-11-10', 'RTGS/CNRBR52025111069706782/MS SARVODAYA CONSTRUCT/CANARA BANK//FAST/FAST', NULL, '2025-11-10', NULL, '1', 'employee', '1'),
(503, 'payment', 'PV/25-26/000004', '2025-11-10', 'RTGS/SK/UTIBR52025111000371727/3252/NOVOCO VISTAS CORP L/HSBC BANK', NULL, '2025-11-10', NULL, '1', 'employee', '1'),
(504, 'receipt', 'RV/25-26/000008', '2025-11-10', 'IMPS/P2A/531418691101/VIKASKUM/BANKOFIN/UAMBCeme/9193732722429013000', NULL, '2025-11-10', NULL, '1', 'employee', '1'),
(505, 'receipt', 'RV/25-26/000009', '2025-11-12', 'IMPS/P2A/531609775165/VIKASKUM/BANKOFIN/UAMBCeme/9193732722429013000', NULL, '2025-11-12', NULL, '1', 'employee', '1'),
(506, 'payment', 'PV/25-26/000005', '2025-11-13', 'NEFT/SK/AXSK253170005278/3252/NUVOCO VISTAS CORP L/HSBC BANK', NULL, '2025-11-13', NULL, '1', 'employee', '1'),
(507, 'receipt', 'RV/25-26/000010', '2025-11-13', 'NEFT/HDFCH00611968037/R K CONSTRUCTIONS/HDFC BANK/0001NEFT - MP TRADERS-502000', NULL, '2025-11-13', NULL, '1', 'employee', '1'),
(508, 'payment', 'PV/25-26/000006', '2025-11-14', 'TRF/3252/M S SHANKER YADAV/TRANSFER BY CHQ', NULL, '2025-11-14', NULL, '1', 'employee', '1'),
(509, 'receipt', 'RV/25-26/000011', '2025-11-14', 'CLG/907389/131125/State Bank/', NULL, '2025-11-14', NULL, '1', 'employee', '1'),
(510, 'receipt', 'RV/25-26/000012', '2025-11-17', 'TRF/M S KRISHI TRADERS/TRANSFER BY CHQ', NULL, '2025-11-17', NULL, '1', 'employee', '1'),
(511, 'payment', 'PV/25-26/000007', '2025-11-17', 'RTGS/SK/UTIBR52025111700363231/3252/NUVOCO VISTAS CORP L/HSBC BANK', NULL, '2025-11-17', NULL, '1', 'employee', '1'),
(512, 'receipt', 'RV/25-26/000013', '2025-11-18', 'IMPS/P2A/532212074507/VIKASKUM/BANKOFIN/UAMBCeme/9193732722429013000', NULL, '2025-11-18', NULL, '1', 'employee', '1'),
(513, 'receipt', 'RV/25-26/000014', '2025-11-19', 'IMPS/P2A/532320154095/VIKASKUM/BANKOFIN/UAMBCeme/9193732722429013000', NULL, '2025-11-19', NULL, '1', 'employee', '1'),
(514, 'payment', 'PV/25-26/000008', '2025-11-19', 'Renewal - AOD-924030071869537', NULL, '2025-11-19', NULL, '1', 'employee', '1'),
(515, 'payment', 'PV/25-26/000009', '2025-11-19', 'Renewal - PF-924030071869537', NULL, '2025-11-19', NULL, '1', 'employee', '1'),
(516, 'receipt', 'RV/25-26/000015', '2025-11-20', 'UPI/P2A/532403475583/Mrs Jyoti/INDIAN BA/UPI/', NULL, '2025-11-20', NULL, '1', 'employee', '1'),
(517, 'receipt', 'RV/25-26/000016', '2025-11-20', 'UPI/P2A/569083035549/Rajesh Ku/AIRP/UPI/', NULL, '2025-11-20', NULL, '1', 'employee', '1'),
(518, 'payment', 'PV/25-26/000010', '2025-11-20', 'RTGS/SK/UTIBR52025112000364482/3252/NUVOCO VISTAS CORP /HSBC BANK', NULL, '2025-11-20', NULL, '1', 'employee', '1'),
(519, 'receipt', 'RV/25-26/000017', '2025-11-21', 'NEFT/BKIDN25325870695/M P TRADERS/BANK OF INDIA/MP TRADERS', NULL, '2025-11-21', NULL, '1', 'employee', '1'),
(520, 'receipt', 'RV/25-26/000018', '2025-11-22', 'IMPS/P2A/532616308359/VIKASKUM/BANKOFIN/UAMBCeme/9193732722429013000', NULL, '2025-11-22', NULL, '1', 'employee', '1'),
(521, 'payment', 'PV/25-26/000011', '2025-11-24', 'RTGS/SK/UTIBR52025112400358960/3252/NUVOCO VISTAS CORP L/HSBC BANK', NULL, '2025-11-24', NULL, '1', 'employee', '1'),
(522, 'receipt', 'RV/25-26/000019', '2025-11-25', 'TRF/M S KRISHI TRADERS/TRANSFER BY CHQ', NULL, '2025-11-25', NULL, '1', 'employee', '1'),
(523, 'payment', 'PV/25-26/000012', '2025-11-26', 'NEFT/SK/AXSK253300005626/3252/SIDHI VINAYAK ENTERP/ICICI BANK LIMITED', NULL, '2025-11-26', NULL, '1', 'employee', '1'),
(524, 'payment', 'PV/25-26/000013', '2025-11-26', 'NEFT/SK/AXSK253300010786/3252/NUVOCO VISTAS CORP L/HSBC BANK', NULL, '2025-11-26', NULL, '1', 'employee', '1'),
(525, 'receipt', 'RV/25-26/000020', '2025-11-26', 'RTGS/HDFCR52025112687867451/GANESH YADAV/HDFC BANK///M P', NULL, '2025-11-26', NULL, '1', 'employee', '1'),
(526, 'receipt', 'RV/25-26/000021', '2025-11-26', 'CLG/907390/261125/State Bank/M P TRADERS', NULL, '2025-11-26', NULL, '1', 'employee', '1'),
(527, 'receipt', 'RV/25-26/000022', '2025-11-27', 'Clg/907391/State Bank /241125/', NULL, '2025-11-27', NULL, '1', 'employee', '1'),
(528, 'payment', 'PV/25-26/000014', '2025-11-27', 'BRN-OW RTN CLG: REJECT:907391:Funds insufficient', NULL, '2025-11-27', NULL, '1', 'employee', '1'),
(529, 'receipt', 'RV/25-26/000023', '2025-11-27', 'TRF/PARMJEET KAUR/TRANSFER BY CHQ', NULL, '2025-11-27', NULL, '1', 'employee', '1'),
(530, 'payment', 'PV/25-26/000015', '2025-11-27', 'RTGS/SK/UTIBR52025112700363826/3252/NUVOCO VISTAS CORP L/HSBC BANK', NULL, '2025-11-27', NULL, '1', 'employee', '1'),
(531, 'payment', 'PV/25-26/000016', '2025-11-28', 'RTGS/SK/UTIBR52025112800360727/3252/MONGIA STEEL LTD/STATE BANK OF INDIA', NULL, '2025-11-28', NULL, '1', 'employee', '1'),
(532, 'receipt', 'RV/25-26/000024', '2025-11-29', 'IMPS/P2A/533312660591/VIKASKUM/BANKOFIN/UAMBCeme/9193732722429013000', NULL, '2025-11-29', NULL, '1', 'employee', '1'),
(533, 'receipt', 'RV/25-26/000025', '2025-11-29', 'TRF/M S SHANKER YADAV/TRANSFER BY CHQ', NULL, '2025-11-29', NULL, '1', 'employee', '1'),
(534, 'payment', 'PV/25-26/000017', '2025-11-29', 'RTGS/SK/UTIBR52025112900360146/3252/NUVOCO VISTAS CORP L/HSBC BANK', NULL, '2025-11-29', NULL, '1', 'employee', '1'),
(535, 'receipt', 'RV/25-26/000026', '2025-11-29', 'CLG/907392/271125/State Bank/MP TRADERS', NULL, '2025-11-29', NULL, '1', 'employee', '1'),
(536, 'receipt', 'RV/25-26/000027', '2025-11-30', 'IMPS/P2A/533420744095/VIKASKUM/BANKOFIN/UAMBCeme/9193732722429013000', NULL, '2025-11-30', NULL, '1', 'employee', '1'),
(538, 'receipt', 'RV/26-27/000001', '2026-08-17', NULL, '1', '2026-08-17', NULL, '1', 'employee', '1');

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
-- Indexes for table `ca_company`
--
ALTER TABLE `ca_company`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_ca_id` (`ca_id`),
  ADD KEY `idx_company_id` (`company_id`);

--
-- Indexes for table `ca_users`
--
ALTER TABLE `ca_users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `registration_number` (`registration_number`);

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
  ADD KEY `idx_tenant` (`company_id`,`owner_type`,`owner_id`),
  ADD KEY `idx_pv_tenant_date` (`company_id`,`owner_type`,`owner_id`,`date`);

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
  ADD KEY `partyId` (`partyId`),
  ADD KEY `idx_sv_tenant_date` (`company_id`,`owner_type`,`owner_id`,`date`);

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
  ADD PRIMARY KEY (`id`);

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
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `stock_item_attribute_tracking`
--
ALTER TABLE `stock_item_attribute_tracking`
  ADD PRIMARY KEY (`id`);

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
-- Indexes for table `tracking_sub_attributes`
--
ALTER TABLE `tracking_sub_attributes`
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
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_vmain_tenant_type_date` (`company_id`,`owner_type`,`owner_id`,`voucher_type`,`date`);

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

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
-- AUTO_INCREMENT for table `ca_company`
--
ALTER TABLE `ca_company`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `ca_users`
--
ALTER TABLE `ca_users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `company_subscriptions`
--
ALTER TABLE `company_subscriptions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `cost_centers`
--
ALTER TABLE `cost_centers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `credit_vouchers`
--
ALTER TABLE `credit_vouchers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=88;

--
-- AUTO_INCREMENT for table `ledger_groups`
--
ALTER TABLE `ledger_groups`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `purchase_history`
--
ALTER TABLE `purchase_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=567;

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1132;

--
-- AUTO_INCREMENT for table `purchase_voucher_items`
--
ALTER TABLE `purchase_voucher_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=847;

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `sales_vouchers`
--
ALTER TABLE `sales_vouchers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1062;

--
-- AUTO_INCREMENT for table `sales_voucher_items`
--
ALTER TABLE `sales_voucher_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=824;

--
-- AUTO_INCREMENT for table `sale_history`
--
ALTER TABLE `sale_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=867;

--
-- AUTO_INCREMENT for table `scenarios`
--
ALTER TABLE `scenarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `set_profit`
--
ALTER TABLE `set_profit`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `stock_attributes`
--
ALTER TABLE `stock_attributes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `stock_groups`
--
ALTER TABLE `stock_groups`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `stock_items`
--
ALTER TABLE `stock_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;

--
-- AUTO_INCREMENT for table `stock_item_attributes`
--
ALTER TABLE `stock_item_attributes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=62;

--
-- AUTO_INCREMENT for table `stock_item_attribute_tracking`
--
ALTER TABLE `stock_item_attribute_tracking`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `stock_item_batches`
--
ALTER TABLE `stock_item_batches`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `stock_journal_entries`
--
ALTER TABLE `stock_journal_entries`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `stock_journal_vouchers`
--
ALTER TABLE `stock_journal_vouchers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `stock_purchase`
--
ALTER TABLE `stock_purchase`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `stock_units`
--
ALTER TABLE `stock_units`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `subscription_coupons`
--
ALTER TABLE `subscription_coupons`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `subscription_plans`
--
ALTER TABLE `subscription_plans`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbadmin`
--
ALTER TABLE `tbadmin`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `tbca`
--
ALTER TABLE `tbca`
  MODIFY `fdSiNo` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `tbemployees`
--
ALTER TABLE `tbemployees`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `tds_26q_deductees`
--
ALTER TABLE `tds_26q_deductees`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tds_26q_returns`
--
ALTER TABLE `tds_26q_returns`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `tracking_sub_attributes`
--
ALTER TABLE `tracking_sub_attributes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `voucher_entries`
--
ALTER TABLE `voucher_entries`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3227;

--
-- AUTO_INCREMENT for table `voucher_entries_old`
--
ALTER TABLE `voucher_entries_old`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `voucher_main`
--
ALTER TABLE `voucher_main`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=539;

--
-- AUTO_INCREMENT for table `voucher_main_old`
--
ALTER TABLE `voucher_main_old`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `voucher_sequences`
--
ALTER TABLE `voucher_sequences`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

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
-- Constraints for table `tbcaemployeecompanies`
--
ALTER TABLE `tbcaemployeecompanies`
  ADD CONSTRAINT `tbCAEmployeeCompanies_ibfk_1` FOREIGN KEY (`ca_employee_id`) REFERENCES `tbcaemployees` (`id`),
  ADD CONSTRAINT `tbCAEmployeeCompanies_ibfk_2` FOREIGN KEY (`company_id`) REFERENCES `tbcompanies` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
