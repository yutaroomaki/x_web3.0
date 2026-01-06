# GXVIS Observability Documentation

## Overview

This directory contains comprehensive observability configurations for the GXVIS (Global X Viral Intelligence System) application, aligned with the GXVIS Constitution (Article 13, Article 27).

**Monitoring Stack**:
- **Metrics**: Prometheus + prom-client (Node.js)
- **Visualization**: Grafana
- **Alerting**: Alertmanager
- **Distributed Tracing**: OpenTelemetry + Jaeger
- **Log Aggregation**: Google Cloud Logging (integrated with Cloud Run)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        GXVIS Application                         │
│  ┌────────────────────┐  ┌──────────────────┐                   │
│  │  Next.js API       │  │  Background Jobs │                   │
│  │  (Cloud Run)       │  │  (Cloud Scheduler)│                   │
│  └────────┬───────────┘  └────────┬─────────┘                   │
│           │                       │                              │
│           │  Metrics (/api/metrics)                              │
│           │  Traces (OpenTelemetry)                              │
│           │  Logs (Cloud Logging)                                │
│           │                       │                              │
└───────────┼───────────────────────┼──────────────────────────────┘
            │                       │
            ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Observability Layer                          │
│                                                                  │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐        │
│  │  Prometheus  │   │    Jaeger    │   │ Cloud Logging│        │
│  │  (Metrics)   │   │   (Traces)   │   │    (Logs)    │        │
│  └──────┬───────┘   └──────────────┘   └──────────────┘        │
│         │                                                        │
│         │ PromQL Queries                                        │
│         ▼                                                        │
│  ┌──────────────┐   ┌──────────────┐                            │
│  │   Grafana    │   │ Alertmanager │                            │
│  │ (Dashboards) │   │   (Alerts)   │                            │
│  └──────────────┘   └──────┬───────┘                            │
│                             │                                    │
└─────────────────────────────┼────────────────────────────────────┘
                              │ Notifications
                              ▼
                    ┌──────────────────┐
                    │  Slack / Email   │
                    │   PagerDuty      │
                    └──────────────────┘
```

---

## Directory Structure

```
monitoring/
├── README.md                              # This file
├── prometheus/
│   ├── prometheus.yml                     # Main Prometheus config
│   ├── rules/
│   │   ├── alerts.yml                     # Alert rules
│   │   ├── recording-rules.yml            # Pre-aggregated metrics
│   │   └── slo-alerts.yml                 # SLO-based alerts
│   └── kubernetes/                        # (For GKE deployment)
├── grafana/
│   ├── dashboards/
│   │   ├── gxvis-application-red.json     # RED metrics dashboard
│   │   ├── gxvis-business-metrics.json    # Business KPIs
│   │   └── gxvis-slo-dashboard.json       # SLO tracking
│   └── provisioning/
│       ├── datasources/
│       │   └── prometheus.yaml            # Prometheus datasource
│       └── dashboards/
│           └── dashboard-provider.yaml    # Dashboard auto-loading
├── alertmanager/
│   └── alertmanager.yml                   # Alert routing & receivers
├── cloud-run/
│   ├── prometheus-deployment.yaml         # Prometheus Cloud Run config
│   └── grafana-deployment.yaml            # Grafana Cloud Run config
└── docs/
    ├── SLO-DEFINITIONS.md                 # SLI/SLO/SLA definitions
    ├── RUNBOOKS.md                        # Alert runbooks
    └── DASHBOARD-GUIDE.md                 # Dashboard usage guide
```

---

## Metrics Overview

### Application Metrics (RED Method)

**Rate** - Requests per second:
- `gxvis_http_requests_total` - Total HTTP requests
- `gxvis:http_requests:rate5m` - Request rate (5min window)

**Errors** - Error rate:
- `gxvis_http_requests_total{status=~"5.."}` - 5xx errors
- `gxvis:http_errors:rate5m` - Error rate (5min window)
- `gxvis:http_success_rate:rate5m` - Success rate

**Duration** - Latency percentiles:
- `gxvis_http_request_duration_seconds` - Request duration histogram
- `gxvis:http_request_duration:p50` - P50 latency
- `gxvis:http_request_duration:p95` - P95 latency
- `gxvis:http_request_duration:p99` - P99 latency

### Business Metrics

**RSS Feed Fetching** (Article 5.2):
- `gxvis_rss_fetch_total{status="success|error"}` - RSS fetch operations
- `gxvis_rss_fetch_duration_seconds` - Fetch duration
- `gxvis_rss_items_fetched_total{is_new="true|false"}` - Items fetched

**Draft Generation** (Article 2.2):
- `gxvis_draft_generation_total{status="success|error"}` - Generation operations
- `gxvis_draft_generation_duration_seconds` - Generation duration
- `gxvis_drafts_generated_by_template_total{template_code="X"}` - Drafts by template

**Human Review** (Article 14):
- `gxvis_review_decisions_total{action="approve|reject|posted"}` - Review decisions
- `gxvis_draft_review_duration_seconds` - Time to review
- `gxvis_draft_edits_total` - Draft text edits

**Database Operations**:
- `gxvis_db_queries_total{operation="findMany|create|update"}` - DB queries
- `gxvis_db_query_duration_seconds` - Query duration

**Background Jobs**:
- `gxvis_job_executions_total{job_type="fetch_rss|generate_drafts"}` - Job executions
- `gxvis_job_execution_duration_seconds` - Job duration

---

## SLO Definitions

### 1. Availability SLO
- **Target**: 99.9% uptime
- **Error Budget**: 0.1% = 43.2 minutes/month downtime
- **Measurement**: `avg(up{job="gxvis-app"})`
- **Alert Thresholds**:
  - Fast burn (1h window): 14.4x burn rate
  - Slow burn (6h window): 6x burn rate

### 2. Error Rate SLO
- **Target**: 99.5% success rate (< 0.5% error rate)
- **Error Budget**: 0.5% of requests can fail
- **Measurement**: `sum(rate(gxvis_http_requests_total{status!~"5.."})) / sum(rate(gxvis_http_requests_total))`
- **Alert Thresholds**:
  - Fast burn (1h): > 7.2% error rate
  - Slow burn (6h): > 3% error rate

### 3. Latency SLO
- **Target**: P95 < 2 seconds
- **Measurement**: `histogram_quantile(0.95, gxvis_http_request_duration_seconds_bucket)`
- **Alert**: P95 > 2s for 5 minutes

### 4. Draft Generation SLO (Core Business Function)
- **Target**: 95% success rate
- **Error Budget**: 5% of generation attempts can fail
- **Measurement**: `sum(rate(gxvis_draft_generation_total{status="success"})) / sum(rate(gxvis_draft_generation_total))`
- **Impact**: Article 2.2 - System cannot generate drafts if SLO breached

### 5. RSS Fetch SLO (Input Pipeline)
- **Target**: 90% success rate
- **Error Budget**: 10% of fetch attempts can fail
- **Measurement**: `sum(rate(gxvis_rss_fetch_total{status="success"})) / sum(rate(gxvis_rss_fetch_total))`
- **Impact**: Article 5.2 - Input pipeline degraded

---

## Alert Severity Matrix

| Severity | Response Time | Escalation | Examples |
|----------|---------------|------------|----------|
| **Critical (P0)** | < 5 min | Slack + PagerDuty (if enabled) | Service down, SLO exhausted, draft generation failure > 20% |
| **Warning** | < 1 hour | Slack notification | High latency, RSS fetch failures, slow burn SLO alerts |

### Alert Routing

```yaml
Critical Alerts → #gxvis-incidents (Slack)
SLO Alerts → #sre-slo-alerts (Slack)
Warning Alerts → #gxvis-alerts (Slack)
Backend Team → #backend-alerts (Slack)
Infrastructure Team → #infra-alerts (Slack)
Product Team → #product-alerts (Slack)
```

---

## Dashboards

### 1. Application Dashboard (RED Metrics)
**URL**: `/d/gxvis-app-red`

**Panels**:
- Request Rate (per second)
- Error Rate (%)
- Response Duration (P50/P95/P99)
- Active Connections
- Total Requests (1h)
- 5xx Errors (1h)
- P95 Latency

**Use Case**: Real-time application health monitoring

---

### 2. Business Metrics Dashboard
**URL**: `/d/gxvis-business`

**Panels**:
- Draft Status Distribution (pending/approved/rejected/posted)
- Drafts Generated (per hour)
- RSS Items Ingested (24h)
- Draft Approval Rate (24h)
- Draft Rejection Rate (24h)
- Review Decisions (per hour)
- Average Time to Review
- Drafts by Template (24h)
- Draft Edit Rate

**Use Case**: Product team KPIs, generation quality tracking

---

### 3. SLO Dashboard
**URL**: `/d/gxvis-slo`

**Panels**:
- SLO: Availability (99.9% target)
- SLO: Error Rate (99.5% success target)
- SLO: Draft Generation (95% success target)
- SLO: RSS Fetch (90% success target)
- Error Budget Burn Rate (1h/6h windows)
- 30-Day Availability Trend
- 30-Day Error Rate Trend
- Error Budget Remaining (30d)
- Estimated Days Until Budget Exhaustion
- Active SLO Alerts

**Use Case**: SRE team error budget tracking, leadership reporting

---

## Setup Instructions

### 1. Install Dependencies

```bash
npm install prom-client @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node @opentelemetry/exporter-jaeger @opentelemetry/resources @opentelemetry/semantic-conventions @opentelemetry/sdk-trace-base
```

### 2. Configure Application Metrics

Update your `src/lib/prisma.ts` to include monitoring:

```typescript
import { PrismaClient } from '@prisma/client';
import { prismaMetricsExtension } from './monitoring/prisma-extension';

const prisma = new PrismaClient().$extends(prismaMetricsExtension);

export default prisma;
```

### 3. Add Metrics Endpoint Annotation (Cloud Run)

In your Cloud Run deployment, add annotation:

```yaml
metadata:
  annotations:
    prometheus.io/scrape: "true"
    prometheus.io/port: "3000"
    prometheus.io/path: "/api/metrics"
```

### 4. Deploy Prometheus (Option A: Managed Service)

Use **Google Cloud Managed Service for Prometheus** (recommended):

```bash
# Enable Managed Service for Prometheus
gcloud services enable monitoring.googleapis.com

# Configure service discovery for Cloud Run
gcloud run services update gxvis-production \
  --set-env-vars ENABLE_METRICS=true
```

### 5. Deploy Prometheus (Option B: Self-Hosted)

Deploy Prometheus on Cloud Run or GKE:

```bash
# Create ConfigMap from prometheus.yml
kubectl create configmap prometheus-config \
  --from-file=monitoring/prometheus/prometheus.yml

# Deploy Prometheus
kubectl apply -f monitoring/cloud-run/prometheus-deployment.yaml
```

### 6. Deploy Grafana

```bash
# Create Grafana secrets
kubectl create secret generic grafana-secrets \
  --from-literal=admin-password=$(openssl rand -base64 32)

# Create ConfigMaps for provisioning
kubectl create configmap grafana-datasources \
  --from-file=monitoring/grafana/provisioning/datasources/

kubectl create configmap grafana-dashboard-provider \
  --from-file=monitoring/grafana/provisioning/dashboards/

kubectl create configmap grafana-dashboards \
  --from-file=monitoring/grafana/dashboards/

# Deploy Grafana
kubectl apply -f monitoring/cloud-run/grafana-deployment.yaml
```

### 7. Deploy Alertmanager

```bash
# Configure Slack webhook (via Secret Manager)
echo -n "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK" | \
  gcloud secrets create slack-webhook-url --data-file=-

# Create Alertmanager ConfigMap
kubectl create configmap alertmanager-config \
  --from-file=monitoring/alertmanager/alertmanager.yml

# Deploy Alertmanager (add to Prometheus deployment or separate)
```

### 8. Configure Cloud Scheduler for Background Jobs

Ensure background jobs emit metrics:

```typescript
// src/app/api/jobs/run/route.ts
import { trackJobExecution, activeJobs } from '@/lib/monitoring/metrics';

export async function POST(request: NextRequest) {
  const jobType = 'fetch_rss';
  const start = Date.now();

  activeJobs.inc({ job_type: jobType });

  try {
    // Job logic...
    const duration = Date.now() - start;
    trackJobExecution(jobType, 'success', duration);
  } catch (error) {
    const duration = Date.now() - start;
    trackJobExecution(jobType, 'failed', duration);
    throw error;
  } finally {
    activeJobs.dec({ job_type: jobType });
  }
}
```

---

## Usage Examples

### 1. Check Application Health

```bash
# Check metrics endpoint
curl https://gxvis-production-xxxxxx-an.a.run.app/api/metrics

# Expected output:
# HELP gxvis_http_requests_total Total number of HTTP requests
# TYPE gxvis_http_requests_total counter
# gxvis_http_requests_total{method="GET",route="/api/drafts",status="200"} 1234
# ...
```

### 2. Query Metrics with PromQL

```promql
# Request rate per endpoint
sum(rate(gxvis_http_requests_total[5m])) by (route)

# Error rate
sum(rate(gxvis_http_requests_total{status=~"5.."}[5m])) / sum(rate(gxvis_http_requests_total[5m]))

# P95 latency
histogram_quantile(0.95, sum(rate(gxvis_http_request_duration_seconds_bucket[5m])) by (le))

# Drafts generated in last hour
sum(increase(gxvis_draft_generation_total{status="success"}[1h]))

# Draft approval rate (24h)
sum(rate(gxvis_review_decisions_total{action="approve"}[24h])) / sum(rate(gxvis_review_decisions_total[24h]))
```

### 3. View Dashboards

1. Access Grafana: `https://grafana.gxvis.com`
2. Navigate to Dashboards > GXVIS folder
3. Select dashboard:
   - **Application Dashboard**: Real-time health
   - **Business Metrics**: Product KPIs
   - **SLO Dashboard**: Error budget tracking

### 4. Investigate Alerts

When an alert fires:

1. Check Slack notification for:
   - Alert summary
   - Runbook link
   - Dashboard link
2. Open dashboard to visualize issue
3. Follow runbook procedures
4. Update review decision notes if draft-related

---

## Alignment with GXVIS Constitution

### Article 2 (Purpose)
- **Monitoring**: Draft generation success rate (SLO: 95%)
- **Alert**: `GXVISDraftGenerationFailureRate` triggers when generation fails

### Article 5 (Input Contract)
- **Monitoring**: RSS fetch success rate (SLO: 90%)
- **Alert**: `GXVISRSSFetchFailureRate` tracks feed availability

### Article 12 (Single Source of Truth)
- **Monitoring**: Database query metrics track SSOT access
- **Alert**: `GXVISDBQueryErrorRate` detects SSOT access issues

### Article 13 (Derived Data Storage)
- **Implementation**: All metrics are stored in Prometheus (derived data)
- **Compliance**: `updateBusinessMetrics()` ensures KPIs are persisted

### Article 14 (Human Responsibilities)
- **Monitoring**: Review decision metrics track human actions
- **Metrics**: `gxvis_review_decisions_total`, `gxvis_draft_edits_total`

### Article 27 (Audit Log Obligation)
- **Implementation**: All HTTP requests, DB queries, jobs logged
- **Compliance**: Metrics provide queryable audit trail

---

## Troubleshooting

### Issue: No metrics appearing in Prometheus

**Diagnosis**:
```bash
# Check if metrics endpoint is accessible
curl https://gxvis-production-xxxxxx-an.a.run.app/api/metrics

# Check Prometheus targets
curl http://prometheus:9090/api/v1/targets
```

**Solution**:
- Verify Cloud Run service URL in `prometheus.yml`
- Check Prometheus scrape config
- Ensure `/api/metrics` route is deployed

---

### Issue: Alerts not firing

**Diagnosis**:
```bash
# Check Alertmanager status
curl http://alertmanager:9093/api/v1/status

# Check alert rules
curl http://prometheus:9090/api/v1/rules
```

**Solution**:
- Verify `alertmanager.yml` routing configuration
- Check Slack webhook URL in Secret Manager
- Verify alert expressions in `alerts.yml`

---

### Issue: High cardinality warnings

**Diagnosis**:
```promql
# Check cardinality per metric
topk(10, count by (__name__)({__name__=~".+"}))
```

**Solution**:
- Avoid high-cardinality labels (user_id, request_id)
- Use logs (Cloud Logging) for per-request debugging
- Use traces (Jaeger) for request flow visualization

---

## Next Steps

1. **Development Team**: Instrument additional API endpoints with metrics
2. **SRE Team**: Set up Prometheus + Grafana infrastructure on GCP
3. **Product Team**: Review business metrics dashboard and define additional KPIs
4. **On-Call Team**: Create runbooks for all critical alerts
5. **Leadership**: Review SLO dashboard monthly for error budget compliance

---

## References

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [OpenTelemetry Node.js](https://opentelemetry.io/docs/instrumentation/js/)
- [Google Cloud Monitoring](https://cloud.google.com/monitoring/docs)
- [SRE Book: Implementing SLOs](https://sre.google/workbook/implementing-slos/)

---

**Maintained by**: GXVIS SRE Team
**Last Updated**: 2025-12-27
**Version**: 1.0.0
