# Project Guidelines & Global Rules: Stock Market Analyzer

## 📐 Mandatory Calculation & Accuracy Verification Rule

### 1. Triple-Check Calculation Protocol
All mathematical calculations, Floor Pivot levels ($P, R_1-R_3, S_1-S_3$), Relative Volume ratios ($\text{RelVol} = \text{Volume} / \text{AvgVolume}$), percentage price changes, and Risk/Reward evaluations MUST be triple-checked:
- **Step 1:** Execute primary calculation formula.
- **Step 2:** Cross-validate against independent YFinance data feeds or analytical formulas.
- **Step 3:** Confirm zero mathematical discrepancies within $\pm 0.02$ tolerance.

### 2. Accuracy Estimation Reporting
For every analysis summary or data validation output, agents must report the quantitative **Accuracy Estimate**:
- **Format:** `Accuracy Estimate: 100% (X/X metrics verified, 0 discrepancies)`

### 3. Critic Agent Enforcement
Run [`critic_agent.py`](file:///c:/Users/nkonr/Documents/AI%20Agents/Agentic_Engineering/agent_engineering/my-apps/Stock_market_Analyzer/critic_agent.py) to audit output data files (`market_analysis_results.json` and `validated_yahoo_data.json`) and verify mathematical accuracy.
