import React, { useState } from "react";

import GSTPurchase from "./GSTAnalysis/GSTPurchase";
import GSTSales from "./GSTAnalysis/GSTSales";
import GSTCreditNote from "./GSTAnalysis/GSTCreditNote";
import GSTDebitNote from "./GSTAnalysis/GSTDebitNote";
import GSTTradingAccount from "./GSTAnalysis/GSTTradingAccount";

import { ArrowLeft, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";

const GSTAnalysis: React.FC = () => {

  const navigate = useNavigate();

  // ================= STATES =================
  const [showSettings, setShowSettings] = useState(false);

  // Default ON
  const [showPurchase, setShowPurchase] = useState(true);
  const [showSales, setShowSales] = useState(true);
  const [showCreditNote, setShowCreditNote] = useState(true);
  const [showDebitNote, setShowDebitNote] = useState(true);
  const [showTradingAccount, setShowTradingAccount] = useState(true);


  return (
    <div className="pt-[56px] px-4 bg-gray-50 min-h-screen">

      {/* ================= HEADER ================= */}
      <div className="flex items-center mb-6 relative">


        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="mr-4 p-2 rounded-full hover:bg-gray-200 transition"
        >
          <ArrowLeft size={20} />
        </button>


        {/* Title */}
        <h1 className="flex-1 text-center text-2xl font-bold text-gray-800">
          GST Analysis
        </h1>


        {/* Settings */}
        <div className="relative">

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="ml-4 p-2 rounded-full hover:bg-gray-200 transition"
          >
            <Settings size={20} />
          </button>


          {/* Dropdown */}
          {showSettings && (
            <div className="absolute right-0 mt-2 w-44 bg-white border rounded-lg shadow-lg p-3 z-50">

              {/* Purchase */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPurchase}
                  onChange={() => setShowPurchase(!showPurchase)}
                />
                Purchase
              </label>


              {/* Debit Note */}
              <label className="flex items-center gap-2 mt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showDebitNote}
                  onChange={() => setShowDebitNote(!showDebitNote)}
                />
                Debit Note
              </label>


              {/* Sales */}
              <label className="flex items-center gap-2 mt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showSales}
                  onChange={() => setShowSales(!showSales)}
                />
                Sales
              </label>


              {/* Credit Note */}
              <label className="flex items-center gap-2 mt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showCreditNote}
                  onChange={() => setShowCreditNote(!showCreditNote)}
                />
                Credit Note
              </label>

              {/* Trading Account */}
              <label className="flex items-center gap-2 mt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showTradingAccount}
                  onChange={() => setShowTradingAccount(!showTradingAccount)}
                />
                Trading Account
              </label>

            </div>
          )}

        </div>

      </div>


      <hr className="border-gray-300 mb-8" />


      {/* ================= PURCHASE SECTION ================= */}
      {showPurchase && (
        <section className="mb-16">

          <h2 className="text-xl font-semibold text-gray-700 mb-4 text-center">
            Purchase Analysis
          </h2>

          <div className="bg-white rounded-xl shadow">
            <GSTPurchase />
          </div>

        </section>
      )}


      {/* ================= DEBIT NOTE SECTION ================= */}
      {showDebitNote && (
        <section className="mb-16">

          <h2 className="text-xl font-semibold text-gray-700 mb-4 text-center">
            Debit Note Analysis
          </h2>

          <div className="bg-white rounded-xl shadow">
            <GSTDebitNote />
          </div>

        </section>
      )}


      {/* ================= SALES SECTION ================= */}
      {showSales && (
        <section className="mb-16">

          <h2 className="text-xl font-semibold text-gray-700 mb-4 text-center">
            Sales Analysis
          </h2>

          <div className="bg-white rounded-xl shadow">
            <GSTSales />
          </div>

        </section>
      )}


      {/* ================= CREDIT NOTE SECTION ================= */}
      {showCreditNote && (
        <section className="mb-16">

          <h2 className="text-xl font-semibold text-gray-700 mb-4 text-center">
            Credit Note Analysis
          </h2>

          <div className="bg-white rounded-xl shadow">
            <GSTCreditNote />
          </div>

        </section>
      )}


      {/* ================= TRADING ACCOUNT SECTION ================= */}
      {showTradingAccount && (
        <section className="mb-10">

          <GSTTradingAccount />

        </section>
      )}



    </div>
  );
};

export default GSTAnalysis;

