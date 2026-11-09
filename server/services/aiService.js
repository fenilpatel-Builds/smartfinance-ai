import axios from 'axios';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const AI_PROVIDER = process.env.AI_PROVIDER || 'gemini';

export const generateAIInsights = async ({ summaryData, topCategories, recentTransactions, query = null }) => {
  // If no API key is provided, return structured deterministic rule-based insights
  if (!GEMINI_API_KEY && !OPENAI_API_KEY) {
    return generateRuleBasedInsights(summaryData, topCategories, recentTransactions, query);
  }

  const prompt = `
You are an expert financial analyst AI for SmartFinance AI.
Analyze the following financial summary for the business/individual workspace:

Summary:
- Combined Bank Balance: ${summaryData.totalBalance}
- Total Income: ${summaryData.totalIncome}
- Total Expenses: ${summaryData.totalExpenses}
- Net Cash Flow: ${summaryData.netCashFlow}
- Total Transactions: ${summaryData.transactionCount}

Top Spending Categories:
${topCategories.map((c) => `- ${c.name}: ${c.amount} (${c.percentage}%)`).join('\n')}

Recent Sample Transactions (masked):
${recentTransactions
  .slice(0, 10)
  .map((t) => `- ${t.date} | ${t.type} | ${t.amount} | ${t.category} | ${t.merchant || t.description.slice(0, 30)}`)
  .join('\n')}

User Question / Goal: ${query || 'Provide 3 high-impact spending insights, flag any unusual transaction patterns, and give 2 optimization recommendations.'}

Respond in concise, professional markdown with clear headings:
### Spending Pattern Analysis
### Key Highlights & Observations
### Actionable Recommendations
`;

  try {
    if (AI_PROVIDER === 'openai' && OPENAI_API_KEY) {
      const res = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
        },
        { headers: { Authorization: `Bearer ${OPENAI_API_KEY}` } }
      );
      return {
        provider: 'openai',
        isAiGenerated: true,
        text: res.data.choices[0].message.content,
      };
    } else if (GEMINI_API_KEY) {
      const res = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          contents: [{ parts: [{ text: prompt }] }],
        }
      );
      return {
        provider: 'gemini',
        isAiGenerated: true,
        text: res.data.candidates[0].content.parts[0].text,
      };
    }
  } catch (err) {
    console.warn('[AIService] External AI call failed, falling back to rule-based engine:', err.message);
  }

  return generateRuleBasedInsights(summaryData, topCategories, recentTransactions, query);
};

export const generateRuleBasedInsights = (summaryData, topCategories, recentTransactions, query = null) => {
  const savingsRate =
    summaryData.totalIncome > 0
      ? Math.round(((summaryData.totalIncome - summaryData.totalExpenses) / summaryData.totalIncome) * 100)
      : 0;

  const topCategory = topCategories[0] || { name: 'None', amount: 0, percentage: 0 };

  const insights = [];

  // Insight 1: Net Cash Flow Assessment
  if (summaryData.netCashFlow > 0) {
    insights.push(
      `Positive Net Cash Flow: You retained ${summaryData.netCashFlow.toLocaleString()} (${savingsRate}% savings rate) across analyzed statements. Liquidity is healthy.`
    );
  } else if (summaryData.netCashFlow < 0) {
    insights.push(
      `Negative Net Cash Flow: Expenses exceeded income by ${Math.abs(summaryData.netCashFlow).toLocaleString()}. Monitor non-essential expenditures.`
    );
  } else {
    insights.push(`Break-even cash flow: Total credits match debits exactly.`);
  }

  // Insight 2: Top Expense Concentration
  if (topCategory.percentage > 30) {
    insights.push(
      `High category concentration: "${topCategory.name}" accounts for ${topCategory.percentage}% (${topCategory.amount.toLocaleString()}) of total spending.`
    );
  }

  // Insight 3: Recurring or Frequent Merchants
  const merchantCounts = {};
  recentTransactions.forEach((t) => {
    if (t.merchant) {
      merchantCounts[t.merchant] = (merchantCounts[t.merchant] || 0) + 1;
    }
  });

  const topMerchants = Object.entries(merchantCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([m, c]) => `${m} (${c} transactions)`);

  if (topMerchants.length > 0) {
    insights.push(`Most frequent counterparties: ${topMerchants.join(', ')}.`);
  }

  let text = `
### Spending Pattern Analysis (Deterministic Financial Engine)
- **Net Cash Position**: Combined bank balance stands at **${summaryData.totalBalance.toLocaleString()}**.
- **Savings Rate**: ${savingsRate}% net savings from incoming funds.
- **Primary Expense Driver**: **${topCategory.name}** represents **${topCategory.percentage}%** of total expenses.

### Key Highlights & Observations
${insights.map((ins) => `- ${ins}`).join('\n')}

### Actionable Recommendations
1. **Target ${topCategory.name} Reduction**: Implement a strict category budget ceiling to curb excess outflow.
2. **Transfer Optimization**: Ensure all inter-bank transfers are reconciled to prevent artificial revenue inflation.
3. **Automate Review Rules**: Establish automated classification rules for high-volume transactions.
`;

  return {
    provider: 'deterministic_engine',
    isAiGenerated: false,
    text,
  };
};

