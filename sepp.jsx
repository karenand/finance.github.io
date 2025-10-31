import React, { useState, useMemo } from 'react';
import { DollarSign, TrendingUp } from 'lucide-react';

const RetirementIncomeCalculator = () => {
  const [brokerageIncome, setBrokerageIncome] = useState(65000);
  const [rothBasis, setRothBasis] = useState(20000);
  const [seppBalance, setSeppBalance] = useState(550000);
  const [helocAmount, setHelocAmount] = useState(70000);
  const [helocRate, setHelocRate] = useState(7.5);
  const [annualGrowth, setAnnualGrowth] = useState(2);
  const [notes, setNotes] = useState({});

  // SEPP calculation for 45-year-old using single life amortization
  const calculateSEPP = (balance) => {
    const age = 45;
    const interestRate = 0.0486; // 4.86% rate assumption
    const lifeExpectancy = 38.8; // IRS Single Life Expectancy table for age 45
    
    // Amortization formula: PMT = P * [r(1+r)^n] / [(1+r)^n - 1]
    const r = interestRate;
    const n = lifeExpectancy;
    const payment = balance * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    
    return payment;
  };

  const seppAnnualPayment = useMemo(() => calculateSEPP(seppBalance), [seppBalance]);

  // Calculate HELOC interest (interest-only payments)
  const helocInterest = (helocAmount * helocRate) / 100;

  // Tax calculation function
  const calculateTax = (brokerage, sepp, year) => {
    // 2025 tax brackets for Married Filing Jointly (approximate, adjust annually)
    const standardDeduction = 29200;
    const childTaxCredit = 8000; // 4 dependents * $2000
    
    // Assume brokerage is LTCG, SEPP is ordinary income
    // MAGI for tax purposes
    const ordinaryIncome = sepp;
    const ltcg = brokerage;
    
    // Calculate taxable ordinary income
    const taxableOrdinary = Math.max(0, ordinaryIncome - standardDeduction);
    
    // Ordinary income tax (2025 MFJ brackets - approximate)
    let ordinaryTax = 0;
    if (taxableOrdinary > 0) {
      if (taxableOrdinary <= 23200) {
        ordinaryTax = taxableOrdinary * 0.10;
      } else if (taxableOrdinary <= 94300) {
        ordinaryTax = 2320 + (taxableOrdinary - 23200) * 0.12;
      } else if (taxableOrdinary <= 201050) {
        ordinaryTax = 10852 + (taxableOrdinary - 94300) * 0.22;
      } else if (taxableOrdinary <= 383900) {
        ordinaryTax = 34337 + (taxableOrdinary - 201050) * 0.24;
      } else if (taxableOrdinary <= 487450) {
        ordinaryTax = 78221 + (taxableOrdinary - 383900) * 0.32;
      } else if (taxableOrdinary <= 731200) {
        ordinaryTax = 111357 + (taxableOrdinary - 487450) * 0.35;
      } else {
        ordinaryTax = 196669.50 + (taxableOrdinary - 731200) * 0.37;
      }
    }
    
    // LTCG tax calculation
    // 0% bracket: up to $94,050 for MFJ (2025 estimate)
    // 15% bracket: $94,050 to $583,750
    // 20% bracket: over $583,750
    const ltcgThreshold0 = 94050;
    const ltcgThreshold15 = 583750;
    
    const taxableIncome = taxableOrdinary + ltcg;
    let ltcgTax = 0;
    
    // Calculate how much LTCG falls into each bracket
    const ordinarySpace = Math.max(0, ltcgThreshold0 - taxableOrdinary);
    const ltcgIn0Bracket = Math.min(ltcg, ordinarySpace);
    const ltcgRemaining = ltcg - ltcgIn0Bracket;
    
    if (ltcgRemaining > 0) {
      const ltcgIn15Bracket = Math.min(ltcgRemaining, ltcgThreshold15 - ltcgThreshold0);
      const ltcgIn20Bracket = Math.max(0, ltcgRemaining - ltcgIn15Bracket);
      
      ltcgTax = (ltcgIn15Bracket * 0.15) + (ltcgIn20Bracket * 0.20);
    }
    
    const totalTax = Math.max(0, ordinaryTax + ltcgTax - childTaxCredit);
    
    return {
      taxableIncome: taxableOrdinary + ltcg,
      totalTax: totalTax
    };
  };

  // Generate 5-year projection
  const projectionData = useMemo(() => {
    const years = [];
    for (let year = 1; year <= 5; year++) {
      const growthMultiplier = Math.pow(1 + annualGrowth / 100, year - 1);
      
      const brokerage = brokerageIncome * growthMultiplier;
      const roth = rothBasis; // No growth applied to Roth
      const sepp = seppAnnualPayment;
      const heloc = helocAmount;
      
      const totalIncome = brokerage + roth + sepp + heloc;
      const monthlyIncome = totalIncome / 12;
      const magi = brokerage + roth + sepp;
      
      const taxCalc = calculateTax(brokerage, sepp, year);
      
      years.push({
        year,
        brokerage: Math.round(brokerage),
        roth: Math.round(roth),
        sepp: Math.round(sepp),
        heloc: Math.round(heloc),
        monthlyIncome: Math.round(monthlyIncome),
        totalIncome: Math.round(totalIncome),
        magi: Math.round(magi),
        taxableIncome: Math.round(taxCalc.taxableIncome),
        taxLiability: Math.round(taxCalc.totalTax)
      });
    }
    return years;
  }, [brokerageIncome, rothBasis, seppAnnualPayment, helocAmount, annualGrowth]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatCurrencyInput = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleCurrencyInput = (value, setter) => {
    const numValue = Number(value.replace(/[^0-9.-]/g, ''));
    if (!isNaN(numValue)) {
      setter(numValue);
    }
  };

  const handleNoteChange = (year, value) => {
    setNotes(prev => ({
      ...prev,
      [year]: value
    }));
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
          <TrendingUp className="text-indigo-600" size={32} />
          Early Retirement Income Strategy - MVP
        </h1>
        <p className="text-gray-600">5-Year Projection with SEPP Calculation (Age 45, Single Life Amortization)</p>
      </div>

      {/* Input Controls */}
      <div className="flex flex-wrap gap-6 mb-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <label className="block text-sm font-semibold text-gray-700 mb-2 whitespace-nowrap">
            Brokerage Account (Year 1)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-500">$</span>
            <input
              type="text"
              value={formatCurrencyInput(brokerageIncome)}
              onChange={(e) => handleCurrencyInput(e.target.value, setBrokerageIncome)}
              className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <label className="block text-sm font-semibold text-gray-700 mb-2 whitespace-nowrap">
            Roth Basis Distribution (Year 1)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-500">$</span>
            <input
              type="text"
              value={formatCurrencyInput(rothBasis)}
              onChange={(e) => handleCurrencyInput(e.target.value, setRothBasis)}
              className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <label className="block text-sm font-semibold text-gray-700 mb-2 whitespace-nowrap">
            IRA Balance for SEPP
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-500">$</span>
            <input
              type="text"
              value={formatCurrencyInput(seppBalance)}
              onChange={(e) => handleCurrencyInput(e.target.value, setSeppBalance)}
              className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Annual SEPP: {formatCurrency(seppAnnualPayment)}
          </p>
          <p className="text-xs text-gray-600 mt-1 font-medium">
            Using 4.86% rate assumption
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <label className="block text-sm font-semibold text-gray-700 mb-2 whitespace-nowrap">
            HELOC Amount
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-500">$</span>
            <input
              type="text"
              value={formatCurrencyInput(helocAmount)}
              onChange={(e) => handleCurrencyInput(e.target.value, setHelocAmount)}
              className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <label className="block text-sm font-semibold text-gray-700 mb-2 whitespace-nowrap">
            HELOC Interest Rate (%)
          </label>
          <input
            type="number"
            step="0.1"
            value={helocRate}
            onChange={(e) => setHelocRate(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            Annual Interest: {formatCurrency(helocInterest)}
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <label className="block text-sm font-semibold text-gray-700 mb-2 whitespace-nowrap">
            Annual Growth Rate (%)
          </label>
          <input
            type="number"
            step="0.1"
            value={annualGrowth}
            onChange={(e) => setAnnualGrowth(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            Applied to Brokerage & Roth
          </p>
        </div>
      </div>

      {/* Projection Table */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-indigo-600 text-white">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Year</th>
                <th className="px-4 py-3 text-right font-semibold">Brokerage</th>
                <th className="px-4 py-3 text-right font-semibold">Roth Basis</th>
                <th className="px-4 py-3 text-right font-semibold">SEPP</th>
                <th className="px-4 py-3 text-right font-semibold">HELOC</th>
                <th className="px-4 py-3 text-right font-semibold bg-indigo-700">Monthly</th>
                <th className="px-4 py-3 text-right font-semibold bg-indigo-700">Total Income</th>
                <th className="px-4 py-3 text-right font-semibold bg-indigo-800">MAGI</th>
                <th className="px-4 py-3 text-right font-semibold bg-purple-700">Taxable Income</th>
                <th className="px-4 py-3 text-right font-semibold bg-purple-800">Tax Liability</th>
                <th className="px-4 py-3 text-left font-semibold">Notes</th>
              </tr>
            </thead>
            <tbody>
              {projectionData.map((row, idx) => (
                <tr key={row.year} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="px-4 py-3 font-semibold text-gray-700">Year {row.year}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{formatCurrency(row.brokerage)}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{formatCurrency(row.roth)}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{formatCurrency(row.sepp)}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{formatCurrency(row.heloc)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-indigo-600 bg-indigo-50">
                    {formatCurrency(row.monthlyIncome)}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-indigo-700 bg-indigo-50">
                    {formatCurrency(row.totalIncome)}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-indigo-900 bg-indigo-100">
                    {formatCurrency(row.magi)}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-purple-700 bg-purple-50">
                    {formatCurrency(row.taxableIncome)}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-purple-900 bg-purple-100">
                    {formatCurrency(row.taxLiability)}
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={notes[row.year] || ''}
                      onChange={(e) => handleNoteChange(row.year, e.target.value)}
                      placeholder="Add note..."
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Notes */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Notes:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• SEPP calculated using Single Life Amortization method for age 45 (38.8 year life expectancy)</li>
          <li>• MAGI excludes HELOC proceeds (borrowed funds, not taxable income)</li>
          <li>• Roth basis withdrawals are tax-free and included in total income but may affect MAGI for ACA subsidies</li>
          <li>• SEPP payments remain constant throughout the 5-year period</li>
          <li>• Annual growth rate applies to Brokerage distributions only (Roth basis remains constant)</li>
          <li>• Monthly income is calculated as Total Annual Income ÷ 12</li>
          <li>• Tax calculations assume MFJ status, 2025 brackets, $29,200 standard deduction, and $8,000 child tax credit (4 dependents)</li>
          <li>• Brokerage income treated as LTCG (0% rate up to $94,050 for MFJ), SEPP as ordinary income</li>
          <li className="font-semibold mt-2">Strategy Tips:</li>
          <li>• Want to maximize ACA subsidies? Favor HELOC draws.</li>
          <li>• Want to harvest LTCGs or qualify for tax-free capital gains? Favor brokerage.</li>
          <li>• Need to optimize for lender income? Blend both to hit target MAGI.</li>
        </ul>
      </div>
    </div>
  );
};

export default RetirementIncomeCalculator;