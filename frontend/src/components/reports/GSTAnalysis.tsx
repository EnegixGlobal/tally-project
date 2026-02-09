import React from "react";

import GSTPurchase from "./GSTAnalysis/GSTPurchase";
import GSTSales from "./GSTAnalysis/GSTSales";

const GSTAnalysis: React.FC = () => {


  return (
    <>
      <GSTPurchase />
      <GSTSales />
    </>
  );
};

export default GSTAnalysis;
