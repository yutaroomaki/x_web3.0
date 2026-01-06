# GXVIS SLO Definitions

## Executive Summary

This document defines Service Level Indicators (SLIs), Service Level Objectives (SLOs), and Service Level Agreements (SLAs) for the GXVIS application. These metrics are aligned with the GXVIS Constitution and business requirements.

**Last Updated**: 2025-12-27
**Review Cadence**: Monthly
**Owner**: SRE Team

---

## SLO Framework

### Terminology

- **SLI (Service Level Indicator)**: A quantitative measure of service performance (e.g., error rate, latency)
- **SLO (Service Level Objective)**: Target value or range for an SLI (e.g., 99.9% uptime)
- **SLA (Service Level Agreement)**: External commitment to customers with consequences for breach
- **Error Budget**: Allowed failure rate (1 - SLO), e.g., 99.9% SLO = 0.1% error budget

### Error Budget Philosophy

- **Error budget = 1 - SLO**
- If error budget is **not exhausted**: Team can take risks (deploy new features, experiments)
- If error budget is **exhausted**: Feature freeze, focus on reliability improvements
- **Multi-window alerting**: Fast burn (1h) and slow burn (6h) windows detect issues early

---

## SLO #1: Availability

### Definition

**What**: Application uptime - service responds to health checks

**Why**: Core requirement - users must be able to access the application

**SLI Measurement**:
```promql
avg(up{job="gxvis-app"})
```

**SLO Target**: 99.9% uptime (monthly)

**Error Budget**: 0.1% = 43.2 minutes downtime per month

**Measurement Window**: 30 days (rolling)

### Thresholds

| Metric | Threshold | Action |
|--------|-----------|--------|
| **Fast Burn (1h)** | Downtime > 14.4x budget rate | Page on-call immediately |
| **Slow Burn (6h)** | Downtime > 6x budget rate | Alert SRE team within 30 min |
| **Monthly Breach** | Downtime > 43.2 min/month | Feature freeze, postmortem required |

### Alerts

- `GXVISAvailabilityErrorBudgetBurnFast` (Critical, 1h window)
- `GXVISAvailabilityErrorBudgetBurnSlow` (Warning, 6h window)
- `GXVISAvailabilityErrorBudgetExhausted` (Critical, 30d window)

### Exclusions

- Planned maintenance (announced 48h in advance)
- Dependency outages (Google Cloud platform-wide issues)

---

## SLO #2: Error Rate

### Definition

**What**: Percentage of HTTP requests that succeed (non-5xx responses)

**Why**: Users must be able to complete requests without server errors

**SLI Measurement**:
```promql
sum(rate(gxvis_http_requests_total{status!~"5.."}[5m]))
/
sum(rate(gxvis_http_requests_total[5m]))
```

**SLO Target**: 99.5% success rate (monthly)

**Error Budget**: 0.5% of requests can fail = ~216 failed requests per 43,200 requests

**Measurement Window**: 30 days (rolling)

### Thresholds

| Metric | Threshold | Action |
|--------|-----------|--------|
| **Fast Burn (1h)** | Error rate > 7.2% (14.4x budget) | Page on-call immediately |
| **Slow Burn (6h)** | Error rate > 3% (6x budget) | Alert backend team within 30 min |
| **Monthly Breach** | Error rate > 0.5% | Feature freeze until improved |

### Alerts

- `GXVISErrorRateBurnFast` (Critical, 1h window)
- `GXVISErrorRateBurnSlow` (Warning, 6h window)
- `GXVISErrorRateBudgetExhausted` (Critical, 30d window)

### Exclusions

- Client errors (4xx responses) - not counted against SLO
- Planned database migrations (announced in advance)

---

## SLO #3: Latency

### Definition

**What**: API response time for 95th percentile (P95) of requests

**Why**: Users expect fast responses - slow APIs degrade user experience

**SLI Measurement**:
```promql
histogram_quantile(0.95,
  sum(rate(gxvis_http_request_duration_seconds_bucket{route=~"/api/.*"}[5m])) by (le)
)
```

**SLO Target**: P95 < 2 seconds

**Error Budget**: 5% of requests can exceed 2s

**Measurement Window**: 7 days (rolling)

### Thresholds

| Metric | Threshold | Action |
|--------|-----------|--------|
| **Fast Burn (1h)** | P95 > 2s for 5 min | Alert backend team |
| **Slow Burn (6h)** | P95 > 2s for 30 min | Investigate performance bottlenecks |

### Alerts

- `GXVISLatencyBurnFast` (Warning, 1h window)
- `GXVISLatencyBurnSlow` (Warning, 6h window)

### Exclusions

- `/api/generate-drafts` endpoint (AI processing, inherently slow)
- Background job endpoints (not user-facing)

---

## SLO #4: Draft Generation Success Rate

### Definition

**What**: Percentage of draft generation attempts that succeed

**Why**: Core business function (Article 2.2) - system must generate drafts from ingested content

**SLI Measurement**:
```promql
sum(rate(gxvis_draft_generation_total{status="success"}[30m]))
/
sum(rate(gxvis_draft_generation_total[30m]))
```

**SLO Target**: 95% success rate

**Error Budget**: 5% of generation attempts can fail

**Measurement Window**: 7 days (rolling)

### Thresholds

| Metric | Threshold | Action |
|--------|-----------|--------|
| **Fast Burn (1h)** | Failure rate > 72% (14.4x budget) | Page on-call immediately |
| **Slow Burn (6h)** | Failure rate > 30% (6x budget) | Alert backend team |
| **Weekly Breach** | Failure rate > 5% | Review AI API performance, check AIT42 connectivity |

### Alerts

- `GXVISDraftGenerationBurnFast` (Critical, 1h window)
- `GXVISDraftGenerationBurnSlow` (Warning, 6h window)

### Impact

**Constitutional Reference**: Article 2.2 - "構成案作成、X向け投稿案（日本語）生成を行うこと"

If this SLO is breached:
- No drafts available for human review (Article 14)
- Core business function impaired
- **Action**: Feature freeze on draft generation logic until SLO restored

### Exclusions

- Intentional rejection (content doesn't meet buzz criteria)
- Upstream RSS fetch failures (covered by SLO #5)

---

## SLO #5: RSS Feed Fetch Success Rate

### Definition

**What**: Percentage of RSS fetch attempts that succeed

**Why**: Input pipeline (Article 5.2) - system must ingest public information sources

**SLI Measurement**:
```promql
sum(rate(gxvis_rss_fetch_total{status="success"}[1h]))
/
sum(rate(gxvis_rss_fetch_total[1h]))
```

**SLO Target**: 90% success rate

**Error Budget**: 10% of fetch attempts can fail

**Measurement Window**: 7 days (rolling)

### Thresholds

| Metric | Threshold | Action |
|--------|-----------|--------|
| **Fast Burn (1h)** | Failure rate > 144% (14.4x budget) | Alert backend team |
| **Slow Burn (6h)** | Failure rate > 60% (6x budget) | Review feed URLs, check network connectivity |
| **Weekly Breach** | Failure rate > 10% | Remove unreliable feeds from source list |

### Alerts

- `GXVISRSSFetchBurnFast` (Warning, 1h window)
- `GXVISRSSFetchBurnSlow` (Warning, 6h window)

### Impact

**Constitutional Reference**: Article 5.2 - "規約に準拠したニュースフィード（RSS / News API / サイト提供フィード）により取得された記事情報"

If this SLO is breached:
- Reduced ingestion of new content
- Fewer drafts available for generation
- **Action**: Review feed reliability, consider adding backup sources

### Exclusions

- Temporary network issues (< 5 min duration)
- Feed-specific outages (if only 1-2 feeds are down)

---

## SLO #6: Database Query Performance

### Definition

**What**: P95 database query latency

**Why**: Single Source of Truth (Article 12) access must be fast

**SLI Measurement**:
```promql
histogram_quantile(0.95,
  sum(rate(gxvis_db_query_duration_seconds_bucket[5m])) by (model, operation, le)
)
```

**SLO Target**: P95 < 500ms

**Error Budget**: 5% of queries can exceed 500ms

**Measurement Window**: 7 days (rolling)

### Thresholds

| Metric | Threshold | Action |
|--------|-----------|--------|
| **Warning** | P95 > 500ms for 10 min | Investigate slow queries, add indexes |
| **Critical** | P95 > 1s for 10 min | Check database connection pool, consider read replicas |

### Alerts

- `GXVISDBSlowQueries` (Warning)

### Impact

If this SLO is breached:
- API latency increases (affects SLO #3)
- User experience degrades
- **Action**: Optimize queries, add indexes, review Prisma query patterns

---

## Error Budget Tracking

### Monthly Error Budget Report

**Generated**: 1st of each month
**Distributed to**: Engineering leadership, Product team, SRE team

**Report Contents**:
1. Error budget remaining for each SLO
2. Incidents that consumed error budget
3. Estimated days until budget exhaustion (if trending down)
4. Recommendations for next month (feature freeze vs. risk-taking)

### Error Budget Policy

| Error Budget Remaining | Policy |
|------------------------|--------|
| **> 75%** | **Green Zone** - Deploy freely, experiment with new features |
| **50-75%** | **Yellow Zone** - Review deployment frequency, increase monitoring |
| **25-50%** | **Orange Zone** - Reduce deployment velocity, focus on stability |
| **< 25%** | **Red Zone** - Feature freeze, all hands on reliability |
| **Exhausted (0%)** | **Critical** - Immediate feature freeze, postmortem required |

---

## SLO Review Process

### Quarterly Review (Q1, Q2, Q3, Q4)

**Participants**: SRE Lead, Engineering Manager, Product Manager

**Agenda**:
1. Review SLO compliance (past 90 days)
2. Analyze error budget consumption patterns
3. Identify chronic issues consuming budget
4. Propose SLO adjustments (if needed)
5. Update alert thresholds based on operational data

### SLO Adjustment Criteria

**When to tighten SLO** (e.g., 99.5% → 99.9%):
- Consistently exceeding target for 3+ months
- User expectations increased
- Business criticality increased

**When to loosen SLO** (e.g., 99.9% → 99.5%):
- Consistently missing target despite maximum effort
- Cost of achieving SLO outweighs business value
- Users don't perceive the difference

---

## Integration with GXVIS Constitution

| Article | SLO | Alignment |
|---------|-----|-----------|
| **Article 2.2** (Generation Purpose) | SLO #4 (Draft Generation) | Ensures core function operates reliably |
| **Article 5.2** (Input Contract) | SLO #5 (RSS Fetch) | Monitors input pipeline health |
| **Article 12** (Single Source of Truth) | SLO #6 (Database Performance) | Ensures SSOT access performance |
| **Article 13** (Derived Data Storage) | All SLOs | Metrics stored as derived data in Prometheus |
| **Article 27** (Audit Log Obligation) | SLO #1, #2 | HTTP request metrics provide audit trail |

---

## Appendix: Calculation Examples

### Example 1: Error Budget Calculation (Availability)

**SLO**: 99.9% uptime
**Error Budget**: 1 - 0.999 = 0.001 = 0.1%
**Monthly Downtime Allowed**: 30 days × 24 hours × 60 min × 0.001 = **43.2 minutes**

**Scenario**: Service down for 10 minutes
- Error budget consumed: 10 / 43.2 = **23.1%**
- Error budget remaining: **76.9%** → **Yellow Zone**

### Example 2: Burn Rate Calculation (Error Rate)

**SLO**: 99.5% success rate (0.5% error budget)
**Fast Burn Threshold**: 14.4x burn rate = 14.4 × 0.005 = **7.2% error rate**

**Scenario**: 1h window shows 8% error rate
- Burn rate: 8% / 0.5% = **16x** (exceeds 14.4x threshold)
- **Alert**: `GXVISErrorRateBurnFast` fires → Page on-call

**Impact**: At this rate, monthly error budget will be exhausted in 30 days / 16 = **1.9 days**

---

**Document Owner**: SRE Team
**Approval**: Engineering Manager, Product Manager
**Next Review**: 2026-03-27
