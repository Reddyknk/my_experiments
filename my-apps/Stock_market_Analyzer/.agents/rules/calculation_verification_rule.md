# Global Rule: Calculation Verification & Accuracy Estimation Protocol

## Overview
This global rule mandates that all quantitative market metrics, technical indicators, Floor Pivot calculations, Relative Volume ratios, and Risk/Reward evaluations performed by any agent must be **triple-checked** and assigned an **Accuracy Estimate Score**.

---

## Mandated Rules & Guidelines

### 1. Mandatory Triple-Check Protocol
Before outputting or committing any numerical results (prices, pivots $P, R_1-R_3, S_1-S_3$, relative volume $\text{RelVol}$, percent changes, or risk/reward ratios):
1. **Primary Calculation**: Execute the core mathematical formula.
2. **Secondary Cross-Verification**: Re-compute the metric using independent analytical formulas or cross-check against YFinance API data feeds.
3. **Mathematical Audit**: Verify that the primary and secondary calculations match within a strict tolerance of $\pm 0.02$.

### 2. Explicit Accuracy Estimation Reporting
Every financial report, terminal update, or data validation summary must explicitly include an **Accuracy Estimate Score**:
- **Formula**:
  $$\text{Accuracy Estimate (\%)} = \left( \frac{\text{Total Validated Metrics} - \text{Discrepancies}}{\text{Total Validated Metrics}} \right) \times 100\%$$
- **Required Report Line**:
  `Accuracy Estimate: XX% (Y/Z metrics validated, 0 discrepancies)`

### 3. Automated Critic Agent Integration
- Post-data generation, execute [`critic_agent.py`](file:///c:/Users/nkonr/Documents/AI%20Agents/Agentic_Engineering/agent_engineering/my-apps/Stock_market_Analyzer/critic_agent.py) to audit mathematical integrity and generate [`validated_yahoo_data.json`](file:///c:/Users/nkonr/Documents/AI%20Agents/Agentic_Engineering/agent_engineering/my-apps/Stock_market_Analyzer/validated_yahoo_data.json).
- If any calculation discrepancy is detected, the Critic Agent must flag a `WARNING` or `FAIL` status and log the error context.
