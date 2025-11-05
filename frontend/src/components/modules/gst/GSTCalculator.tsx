import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calculator, ArrowLeft, Grid3X3, ShoppingCart } from 'lucide-react';

interface GSTCalculation {
  amount: number;
  gstRate: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalAmount: number;
  isInclusive: boolean;
}

interface GSTRateWiseCalculation {
  rate: number;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  totalGst: number;
  totalAmount: number;
}

interface Product {
  id: string;
  name: string;
  amount: number;
  gstRate: number;
  cgst: number;
  sgst: number;
  totalGst: number;
  totalAmount: number;
}

type CalculatorType = 'gst' | 'ratewise' | 'product';

const GSTCalculator: React.FC = () => {
  const [calculatorType, setCalculatorType] = useState<CalculatorType>('gst');
  const [amount, setAmount] = useState<string>('');
  const [gstRate, setGstRate] = useState<number>(18);
  const [isInclusive, setIsInclusive] = useState<boolean>(false);
  const [calculation, setCalculation] = useState<GSTCalculation | null>(null);
  const [rateWiseCalculations, setRateWiseCalculations] = useState<GSTRateWiseCalculation[]>([]);
  
  // Product calculator states
  const [products, setProducts] = useState<Product[]>([]);
  const [productName, setProductName] = useState<string>('');
  const [productAmount, setProductAmount] = useState<string>('');
  const [productGstRate, setProductGstRate] = useState<number>(18);
  
  const navigate = useNavigate();

  const gstRates = [0, 5, 12, 18, 28];

  const calculateGST = () => {
    const baseAmount = parseFloat(amount);
    if (isNaN(baseAmount) || baseAmount <= 0) return;

    let result: GSTCalculation;

    if (isInclusive) {
      const totalAmount = baseAmount;
      const taxableAmount = totalAmount / (1 + gstRate / 100);
      const gstAmount = totalAmount - taxableAmount;

      result = {
        amount: taxableAmount,
        gstRate,
        cgst: gstAmount / 2,
        sgst: gstAmount / 2,
        igst: gstAmount,
        totalAmount,
        isInclusive: true
      };
    } else {
      const taxableAmount = baseAmount;
      const gstAmount = (taxableAmount * gstRate) / 100;
      const totalAmount = taxableAmount + gstAmount;

      result = {
        amount: taxableAmount,
        gstRate,
        cgst: gstAmount / 2,
        sgst: gstAmount / 2,
        igst: gstAmount,
        totalAmount,
        isInclusive: false
      };
    }

    setCalculation(result);
  };

  const calculateRateWise = () => {
    const baseAmount = parseFloat(amount);
    if (isNaN(baseAmount) || baseAmount <= 0) return;

    const calculations: GSTRateWiseCalculation[] = gstRates.map(rate => {
      let taxableAmount: number;
      let totalAmount: number;
      let totalGst: number;

      if (isInclusive) {
        totalAmount = baseAmount;
        taxableAmount = totalAmount / (1 + rate / 100);
        totalGst = totalAmount - taxableAmount;
      } else {
        taxableAmount = baseAmount;
        totalGst = (taxableAmount * rate) / 100;
        totalAmount = taxableAmount + totalGst;
      }

      return {
        rate,
        taxableAmount,
        cgst: totalGst / 2,
        sgst: totalGst / 2,
        totalGst,
        totalAmount
      };
    });

    setRateWiseCalculations(calculations);
  };

  const clearCalculation = () => {
    setAmount('');
    setCalculation(null);
    setRateWiseCalculations([]);
  };

  const addProduct = () => {
    if (!productName.trim() || !productAmount || parseFloat(productAmount) <= 0) return;

    const baseAmount = parseFloat(productAmount);
    const gstAmount = (baseAmount * productGstRate) / 100;
    const totalAmount = baseAmount + gstAmount;

    const newProduct: Product = {
      id: Date.now().toString(),
      name: productName.trim(),
      amount: baseAmount,
      gstRate: productGstRate,
      cgst: gstAmount / 2,
      sgst: gstAmount / 2,
      totalGst: gstAmount,
      totalAmount: totalAmount
    };

    setProducts([...products, newProduct]);
    setProductName('');
    setProductAmount('');
    setProductGstRate(18);
  };

  const removeProduct = (id: string) => {
    setProducts(products.filter(product => product.id !== id));
  };

  const clearProducts = () => {
    setProducts([]);
    setProductName('');
    setProductAmount('');
    setProductGstRate(18);
  };

  const calculateProductTotals = () => {
    const totalTaxableAmount = products.reduce((sum, product) => sum + product.amount, 0);
    const totalCgst = products.reduce((sum, product) => sum + product.cgst, 0);
    const totalSgst = products.reduce((sum, product) => sum + product.sgst, 0);
    const totalGst = products.reduce((sum, product) => sum + product.totalGst, 0);
    const grandTotal = products.reduce((sum, product) => sum + product.totalAmount, 0);

    return {
      totalTaxableAmount,
      totalCgst,
      totalSgst,
      totalGst,
      grandTotal
    };
  };

  return (
      <div className="min-h-screen pt-[56px] px-4 ">
         
        <div className="max-w-6xl mx-auto ">
        <div className="flex items-center mb-4">
            <button
                title='Back to Reports'
                type='button'
                  onClick={() => navigate('/app/gst')}
                  className="mr-4 p-2 rounded-full hover:bg-gray-200"
                >
                  <ArrowLeft size={20} />
                </button>
                <h1 className="text-2xl font-bold">GST Calculator</h1>
            </div>
          
          {/* Calculator Type Selector */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Calculator Type:</label>
              <select
                title="Select Calculator Type"
                value={calculatorType}
                onChange={(e) => {
                  setCalculatorType(e.target.value as CalculatorType);
                  clearCalculation();
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="gst">GST Calculator</option>
                <option value="ratewise">GST Rate Wise Calculator</option>
                <option value="product">Product Calculator</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <Calculator className="h-6 w-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">
                {calculatorType === 'gst' ? 'GST Calculator' : 
                 calculatorType === 'ratewise' ? 'GST Rate Wise Calculator' : 
                 'Product Calculator'}
              </h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Input Section */}
              <div className="space-y-6">
                {calculatorType === 'product' ? (
                  // Product Calculator Inputs
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Product Name
                      </label>
                      <input
                        type="text"
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                        placeholder="Enter product name"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Amount
                      </label>
                      <input
                        type="number"
                        value={productAmount}
                        onChange={(e) => setProductAmount(e.target.value)}
                        placeholder="Enter amount"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        GST Rate (%)
                      </label>
                      <div className="grid grid-cols-5 gap-2">
                        {gstRates.map((rate) => (
                          <button
                            key={rate}
                            onClick={() => setProductGstRate(rate)}
                            className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                              productGstRate === rate
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {rate}%
                          </button>
                        ))}
                      </div>
                      <input
                        type="number"
                        value={productGstRate}
                        onChange={(e) => setProductGstRate(parseFloat(e.target.value) || 0)}
                        placeholder="Custom rate"
                        className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={addProduct}
                        disabled={!productName.trim() || !productAmount}
                        className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium transition-colors"
                      >
                        Add Product
                      </button>
                      <button
                        onClick={clearProducts}
                        className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                      >
                        Clear All
                      </button>
                    </div>
                  </>
                ) : (
                  // Regular and Rate Wise Calculator Inputs
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Amount
                      </label>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="Enter amount"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                      />
                    </div>

                    {calculatorType === 'gst' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          GST Rate (%)
                        </label>
                        <div className="grid grid-cols-5 gap-2">
                          {gstRates.map((rate) => (
                            <button
                              key={rate}
                              onClick={() => setGstRate(rate)}
                              className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                                gstRate === rate
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {rate}%
                            </button>
                          ))}
                        </div>
                        <input
                          type="number"
                          value={gstRate}
                          onChange={(e) => setGstRate(parseFloat(e.target.value) || 0)}
                          placeholder="Custom rate"
                          className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Calculation Type
                      </label>
                      <div className="flex gap-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            checked={!isInclusive}
                            onChange={() => setIsInclusive(false)}
                            className="mr-2"
                          />
                          <span className="text-sm">GST Exclusive</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            checked={isInclusive}
                            onChange={() => setIsInclusive(true)}
                            className="mr-2"
                          />
                          <span className="text-sm">GST Inclusive</span>
                        </label>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={calculatorType === 'gst' ? calculateGST : calculateRateWise}
                        disabled={!amount}
                        className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium transition-colors"
                      >
                        {calculatorType === 'gst' ? 'Calculate GST' : 'Calculate All Rates'}
                      </button>
                      <button
                        onClick={clearCalculation}
                        className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Result Section */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {calculatorType === 'gst' ? 'Calculation Result' : 
                   calculatorType === 'ratewise' ? 'Rate Wise Calculations' : 
                   'Product List & Summary'}
                </h3>

                {calculatorType === 'product' ? (
                  // Product Calculator Results
                  <div className="space-y-4">
                    {products.length > 0 ? (
                      <>
                        {/* Product List */}
                        <div className="space-y-3 max-h-60 overflow-y-auto">
                          {products.map((product) => (
                            <div key={product.id} className="bg-white p-4 rounded-lg border">
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-medium text-gray-900">{product.name}</h4>
                                <button
                                  onClick={() => removeProduct(product.id)}
                                  className="text-red-500 hover:text-red-700 text-sm"
                                >
                                  Remove
                                </button>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>Amount: ₹{product.amount.toFixed(2)}</div>
                                <div>GST Rate: {product.gstRate}%</div>
                                <div>CGST: ₹{product.cgst.toFixed(2)}</div>
                                <div>SGST: ₹{product.sgst.toFixed(2)}</div>
                                <div>Total GST: ₹{product.totalGst.toFixed(2)}</div>
                                <div className="font-medium">Total: ₹{product.totalAmount.toFixed(2)}</div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Product Summary */}
                        <div className="bg-white p-4 rounded-lg border-2 border-blue-200">
                          <h4 className="font-semibold text-gray-900 mb-3">Summary</h4>
                          {(() => {
                            const totals = calculateProductTotals();
                            return (
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span>Total Taxable Amount:</span>
                                  <span className="font-medium">₹{totals.totalTaxableAmount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Total CGST:</span>
                                  <span className="font-medium">₹{totals.totalCgst.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Total SGST:</span>
                                  <span className="font-medium">₹{totals.totalSgst.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Total GST:</span>
                                  <span className="font-medium">₹{totals.totalGst.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between border-t pt-2 text-lg font-bold">
                                  <span>Grand Total:</span>
                                  <span className="text-green-600">₹{totals.grandTotal.toFixed(2)}</span>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </>
                    ) : (
                      <div className="text-center text-gray-500 py-8">
                        <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>Add products to see calculations</p>
                      </div>
                    )}
                  </div>
                ) : calculatorType === 'gst' ? (
                  // Regular GST Calculator Results
                  calculation ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-lg">
                          <div className="text-sm text-gray-600">Taxable Amount</div>
                          <div className="text-xl font-bold text-gray-900">
                            ₹{calculation.amount.toFixed(2)}
                          </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg">
                          <div className="text-sm text-gray-600">GST Rate</div>
                          <div className="text-xl font-bold text-blue-600">
                            {calculation.gstRate}%
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-4 rounded-lg">
                        <div className="text-sm text-gray-600 mb-2">GST Breakdown</div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">CGST ({calculation.gstRate / 2}%):</span>
                            <span className="font-medium">₹{calculation.cgst.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">SGST ({calculation.gstRate / 2}%):</span>
                            <span className="font-medium">₹{calculation.sgst.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between border-t pt-2">
                            <span className="text-sm">Total GST:</span>
                            <span className="font-bold">₹{calculation.igst.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                        <div className="text-sm text-green-600">Total Amount</div>
                        <div className="text-2xl font-bold text-green-700">
                          ₹{calculation.totalAmount.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      <Calculator className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Enter amount and click calculate to see GST breakdown</p>
                    </div>
                  )
                ) : (
                  // Rate Wise Calculator Results
                  rateWiseCalculations.length > 0 ? (
                    <div className="space-y-4">
                      <div className="overflow-x-auto">
                        <table className="w-full bg-white rounded-lg overflow-hidden">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">GST Rate</th>
                              <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">Taxable Amount</th>
                              <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">CGST</th>
                              <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">SGST</th>
                              <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">Total GST</th>
                              <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">Total Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rateWiseCalculations.map((calc, index) => (
                              <tr key={calc.rate} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                <td className="px-4 py-3 text-sm font-medium text-blue-600">{calc.rate}%</td>
                                <td className="px-4 py-3 text-sm text-right">₹{calc.taxableAmount.toFixed(2)}</td>
                                <td className="px-4 py-3 text-sm text-right">₹{calc.cgst.toFixed(2)}</td>
                                <td className="px-4 py-3 text-sm text-right">₹{calc.sgst.toFixed(2)}</td>
                                <td className="px-4 py-3 text-sm text-right font-medium">₹{calc.totalGst.toFixed(2)}</td>
                                <td className="px-4 py-3 text-sm text-right font-bold text-green-600">₹{calc.totalAmount.toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      {/* Summary Cards for Rate Wise */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                          <div className="text-sm text-blue-600">Lowest Total (0%)</div>
                          <div className="text-xl font-bold text-blue-700">
                            ₹{rateWiseCalculations.find(c => c.rate === 0)?.totalAmount.toFixed(2) || '0.00'}
                          </div>
                        </div>
                        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                          <div className="text-sm text-yellow-600">Standard Rate (18%)</div>
                          <div className="text-xl font-bold text-yellow-700">
                            ₹{rateWiseCalculations.find(c => c.rate === 18)?.totalAmount.toFixed(2) || '0.00'}
                          </div>
                        </div>
                        <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                          <div className="text-sm text-red-600">Highest Total (28%)</div>
                          <div className="text-xl font-bold text-red-700">
                            ₹{rateWiseCalculations.find(c => c.rate === 28)?.totalAmount.toFixed(2) || '0.00'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      <Grid3X3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Enter amount and click calculate to see rate wise breakdown</p>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Quick Reference */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">GST Rate Quick Reference</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="font-semibold text-gray-900">0% GST</div>
                <div className="text-sm text-gray-600 mt-1">Essential items, books, newspapers</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="font-semibold text-blue-900">5% GST</div>
                <div className="text-sm text-blue-600 mt-1">Food items, medicines, textiles</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="font-semibold text-yellow-900">12% GST</div>
                <div className="text-sm text-yellow-600 mt-1">Computers, processed food</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="font-semibold text-green-900">18% GST</div>
                <div className="text-sm text-green-600 mt-1">Most goods and services</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    
  );
};

export default GSTCalculator;
