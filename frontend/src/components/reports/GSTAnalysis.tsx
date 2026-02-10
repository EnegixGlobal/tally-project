import React from "react";

import GSTPurchase from "./GSTAnalysis/GSTPurchase";
import GSTSales from "./GSTAnalysis/GSTSales";

import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const GSTAnalysis: React.FC = () => {

  const navigate = useNavigate();

  return (
    <div className="pt-[56px] px-4 bg-gray-50 min-h-screen">

      {/* ================= HEADER ================= */}
      <div className="flex items-center mb-6">

        <button
          onClick={() => navigate(-1)}
          className="mr-4 p-2 rounded-full hover:bg-gray-200 transition"
        >
          <ArrowLeft size={20} />
        </button>

        <h1 className="flex-1 text-center text-2xl font-bold text-gray-800">
          GST Analysis
        </h1>

      </div>

      <hr className="border-gray-300 mb-8" />

      {/* ================= PURCHASE SECTION ================= */}
      <section className="mb-16">

        <h2 className="text-xl font-semibold text-gray-700 mb-4 text-center">
          📘 Purchase Analysis
        </h2>

        <div className="bg-white rounded-xl shadow">
          <GSTPurchase />
        </div>

      </section>

      {/* ================= SALES SECTION ================= */}
      <section className="mb-10">

        <h2 className="text-xl font-semibold text-gray-700 mb-4 text-center">
          📕 Sales Analysis
        </h2>

        <div className="bg-white rounded-xl shadow">
          <GSTSales />
        </div>

      </section>

    </div>
  );
};

export default GSTAnalysis;
