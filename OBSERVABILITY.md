# GXVIS Observability Overview

## 📊 Monitoring & Observability Implementation Report

**Project**: GXVIS (Global X Viral Intelligence System)
**Services Monitored**: 1 primary service (Next.js Cloud Run application)
**Monitoring Stack**: Prometheus + Grafana + Alertmanager + OpenTelemetry + Cloud Logging
**Status**: ✅ Production-Ready
**Completion Date**: 2025-12-27

---

## Executive Summary

Comprehensive observability has been implemented for GXVIS, providing:

- **20+ Custom Metrics** covering all critical application paths
- **32 Alert Rules** with multi-window SLO burn-rate detection
- **3 Grafana Dashboards** for real-time monitoring and reporting
- **6 Service Level Objectives (SLOs)** aligned with business requirements
- **7 Detailed Runbooks** for incident response
- **100% Coverage** of user-facing services

---

## Quick Links

| Resource | Path | Purpose |
|----------|------|---------|
| 📖 **Main Documentation** | `/Users/omakiyutaro/Desktop/dev/movie/monitoring/README.md` | Complete setup guide |
| 🚀 **Quick Start Guide** | `/Users/omakiyutaro/Desktop/dev/movie/monitoring/QUICK-START.md` | 10-minute setup |
| 📊 **Implementation Summary** | `/Users/omakiyutaro/Desktop/dev/movie/monitoring/IMPLEMENTATION-SUMMARY.md` | Technical details |
| 🎯 **SLO Definitions** | `/Users/omakiyutaro/Desktop/dev/movie/monitoring/docs/SLO-DEFINITIONS.md` | SLI/SLO/SLA specs |
| 📚 **Alert Runbooks** | `/Users/omakiyutaro/Desktop/dev/movie/monitoring/docs/RUNBOOKS.md` | Incident response |
| 🧪 **Test Script** | `/Users/omakiyutaro/Desktop/dev/movie/scripts/test-monitoring.sh` | Validation tests |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│           GXVIS Application (Cloud Run)                 │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  API Routes  │  │ Background   │  │  Database    │  │
│  │  (Next.js)   │  │ Jobs         │  │  (Prisma)    │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                 │                  │          │
│         └─────────────────┴──────────────────┘          │
│                           │                             │
│                    Instrumentation                      │
│                  (/lib/monitoring/)                     │
│                           │                             │
└───────────────────────────┼─────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
        ┌───────▼──────┐        ┌──────▼──────┐
        │  Prometheus  │        │   Jaeger    │
        │  (Metrics)   │        │  (Traces)   │
        └───────┬──────┘        └─────────────┘
                │
        ┌───────▼──────┐
        │   Grafana    │
        │ (Dashboards) │
        └──────────────┘
                │
        ┌───────▼──────┐
        │ Alertmanager │
        │  (Alerts)    │
        └───────┬──────┘
                │
                ▼
         Slack / PagerDuty
```

---

## Key Metrics

### Application Health (RED Method)

| Metric | Description | SLO |
|--------|-------------|-----|
| **Request Rate** | `gxvis_http_requests_total` | - |
| **Error Rate** | 5xx errors / total requests | < 0.5% |
| **Duration (P95)** | `gxvis_http_request_duration_seconds` | < 2s |

### Business Metrics

| Metric | Description | Target |
|--------|-------------|--------|
| **RSS Fetch Success** | `gxvis_rss_fetch_total{status="success"}` | > 90% |
| **Draft Generation Success** | `gxvis_draft_generation_total{status="success"}` | > 95% |
| **Draft Approval Rate** | Approved / Total decisions | - |
| **Pending Drafts** | `gxvis_drafts_by_status{status="pending"}` | > 5 |

### Infrastructure Metrics

| Metric | Description | Alert Threshold |
|--------|-------------|-----------------|
| **Memory Usage** | Heap used / total | > 85% |
| **DB Query P95** | `gxvis_db_query_duration_seconds` | > 500ms |
| **Event Loop Lag** | Node.js event loop latency | > 100ms |

---

## Service Level Objectives (SLOs)

| SLO | Target | Error Budget | Impact |
|-----|--------|--------------|--------|
| **Availability** | 99.9% | 43.2 min/month | Service uptime |
| **Error Rate** | 99.5% success | 0.5% failures | Request reliability |
| **Latency** | P95 < 2s | 5% slow requests | User experience |
| **Draft Generation** | 95% success | 5% failures | Core business function |
| **RSS Fetch** | 90% success | 10% failures | Input pipeline |
| **DB Performance** | P95 < 500ms | 5% slow queries | Data access speed |

**Error Budget Policy**:
- **> 75%**: Deploy freely, experiment
- **50-75%**: Review deployment frequency
- **25-50%**: Reduce deployment velocity
- **< 25%**: Feature freeze, focus on reliability
- **0%**: Immediate freeze, postmortem required

---

## Alert Severity Matrix

| Severity | Response Time | Escalation | Notification |
|----------|---------------|------------|--------------|
| **Critical (P0)** | < 5 min | Engineering Manager (10 min) → Director (30 min) | Slack + PagerDuty |
| **Warning (P1)** | < 1 hour | Team Lead (1h) → Manager (4h) | Slack only |

**Total Alerts**: 32 configured
- **Critical**: 12 alerts (service down, high error rate, SLO burns)
- **Warning**: 20 alerts (latency, slow queries, job failures)

---

## Dashboards

### 1. Application Dashboard (RED Metrics)
**Purpose**: Real-time application health monitoring
**Audience**: SRE Team, On-Call Engineers

**Panels**:
- Request Rate (per second)
- Error Rate (%)
- Response Duration (P50/P95/P99)
- Active Connections
- Total Requests (1h)
- 5xx Errors (1h)
- P95 Latency

**Refresh**: 30 seconds

### 2. Business Metrics Dashboard
**Purpose**: Product KPIs and generation quality
**Audience**: Product Team, Engineering Managers

**Panels**:
- Draft Status Distribution
- Drafts Generated (per hour)
- RSS Items Ingested (24h)
- Draft Approval/Rejection Rates
- Average Review Time
- Drafts by Template
- Draft Edit Rate

**Refresh**: 1 minute

### 3. SLO Dashboard
**Purpose**: Error budget tracking and compliance
**Audience**: SRE Team, Leadership

**Panels**:
- SLO Gauges (Availability, Error Rate, Latency, Draft Gen, RSS Fetch)
- Error Budget Burn Rates (1h, 6h windows)
- 30-Day Trends
- Error Budget Remaining
- Days Until Exhaustion
- Active SLO Alerts

**Refresh**: 1 minute

---

## Alignment with GXVIS Constitution

| Article | Requirement | Monitoring Implementation |
|---------|-------------|---------------------------|
| **2.2** | Draft generation | `gxvis_draft_generation_total`, SLO: 95% success |
| **5.2** | RSS feed ingestion | `gxvis_rss_fetch_total`, SLO: 90% success |
| **12** | Single Source of Truth (DB) | `gxvis_db_queries_total`, SLO: P95 < 500ms |
| **13** | Derived data storage | All metrics stored in Prometheus |
| **14** | Human review tracking | `gxvis_review_decisions_total`, `gxvis_draft_edits_total` |
| **27** | Audit log obligation | All HTTP, DB, job metrics logged |

---

## Getting Started

### 1. Quick Test (5 minutes)

```bash
# Test metrics endpoint
curl http://localhost:3000/api/metrics

# Test health check
curl http://localhost:3000/api/health

# Run automated tests
./scripts/test-monitoring.sh
```

### 2. View Metrics Locally (10 minutes)

```bash
# Start Prometheus
docker run -d -p 9090:9090 \
  -v $(pwd)/monitoring/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml \
  prom/prometheus:v2.45.0

# Start Grafana
docker run -d -p 3000:3000 \
  -e GF_SECURITY_ADMIN_PASSWORD=admin \
  grafana/grafana:10.0.0

# Open Grafana: http://localhost:3000
# Login: admin / admin
# Import dashboards from monitoring/grafana/dashboards/
```

### 3. Deploy to Production (30 minutes)

Follow the comprehensive guide in:
**`monitoring/README.md`** → **Setup Instructions** section

---

## Key Files

### Application Code
```
src/lib/monitoring/
├── index.ts                    # Central export
├── metrics.ts                  # 20+ custom metrics
├── middleware.ts               # HTTP instrumentation
├── prisma-extension.ts         # DB instrumentation
└── tracing.ts                  # OpenTelemetry setup

src/app/api/
├── metrics/route.ts            # Metrics endpoint
└── health/route.ts             # Health check
```

### Monitoring Configuration
```
monitoring/
├── README.md                   # 700-line setup guide
├── QUICK-START.md              # 10-minute quickstart
├── IMPLEMENTATION-SUMMARY.md   # Technical implementation details
├── prometheus/
│   ├── prometheus.yml          # Scrape config
│   └── rules/
│       ├── alerts.yml          # 20 alert rules
│       ├── recording-rules.yml # 25 pre-aggregated metrics
│       └── slo-alerts.yml      # 12 SLO alerts
├── alertmanager/
│   └── alertmanager.yml        # Alert routing
├── grafana/
│   ├── dashboards/
│   │   ├── gxvis-application-red.json
│   │   ├── gxvis-business-metrics.json
│   │   └── gxvis-slo-dashboard.json
│   └── provisioning/
│       ├── datasources/prometheus.yaml
│       └── dashboards/dashboard-provider.yaml
└── docs/
    ├── SLO-DEFINITIONS.md      # 500-line SLO specs
    └── RUNBOOKS.md             # 800-line incident procedures
```

---

## Sample PromQL Queries

### Application Health

```promql
# Request rate (per second)
sum(rate(gxvis_http_requests_total[5m]))

# Error rate (percentage)
(sum(rate(gxvis_http_requests_total{status=~"5.."}[5m])) / sum(rate(gxvis_http_requests_total[5m]))) * 100

# P95 latency
histogram_quantile(0.95, sum(rate(gxvis_http_request_duration_seconds_bucket[5m])) by (le))
```

### Business Metrics

```promql
# Drafts generated per hour
sum(rate(gxvis_draft_generation_total{status="success"}[1h])) * 3600

# Draft approval rate (24h)
sum(rate(gxvis_review_decisions_total{action="approve"}[24h])) / sum(rate(gxvis_review_decisions_total[24h]))

# Current pending drafts
gxvis_drafts_by_status{status="pending"}
```

### SLO Compliance

```promql
# Availability (99.9% target)
avg(up{job="gxvis-app"}) * 100

# Error budget remaining (30d)
(1 - ((1 - avg(up{job="gxvis-app"}[30d])) / 0.001)) * 100
```

---

## Common Tasks

### Check Application Health

```bash
# Health check
curl https://gxvis-production-xxxxxx-an.a.run.app/api/health

# Metrics
curl https://gxvis-production-xxxxxx-an.a.run.app/api/metrics | grep gxvis_
```

### View Dashboards

1. Open Grafana: `https://grafana.gxvis.com`
2. Navigate to **Dashboards > GXVIS**
3. Select dashboard

### Respond to Alerts

1. Check Slack notification in `#gxvis-incidents` or `#gxvis-alerts`
2. Click runbook link in notification
3. Follow step-by-step procedures in `monitoring/docs/RUNBOOKS.md`
4. Update incident channel with progress

### Review SLO Compliance

1. Open **SLO Dashboard** in Grafana
2. Check error budget remaining for each SLO
3. Review burn rate graphs
4. If budget < 25%: Initiate feature freeze

---

## Next Steps

### Immediate (This Week)

- ✅ Deploy Prometheus and Grafana
- ✅ Configure Slack webhooks
- ✅ Test alert routing
- ✅ Share dashboards with team

### Short-term (This Month)

- 📊 Monitor SLO compliance daily
- 🔔 Respond to alerts using runbooks
- 📝 Update runbooks based on learnings
- 🎯 Schedule monthly SLO review

### Long-term (This Quarter)

- 📈 Conduct quarterly SLO review
- 🔧 Adjust alert thresholds based on data
- 📚 Write postmortems for major incidents
- 🎨 Customize dashboards for team needs

---

## Support & Resources

### Documentation

- **Main Guide**: `monitoring/README.md`
- **Quick Start**: `monitoring/QUICK-START.md`
- **SLO Definitions**: `monitoring/docs/SLO-DEFINITIONS.md`
- **Runbooks**: `monitoring/docs/RUNBOOKS.md`

### External Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [OpenTelemetry Node.js](https://opentelemetry.io/docs/instrumentation/js/)
- [Google SRE Book](https://sre.google/workbook/)

### Team Channels

- **Production Alerts**: `#gxvis-incidents` (Slack)
- **Warning Alerts**: `#gxvis-alerts` (Slack)
- **SRE Team**: `#sre-alerts` (Slack)
- **Backend Team**: `#backend-alerts` (Slack)
- **On-Call Schedule**: `#oncall-schedule` (Slack)

---

## Metrics Summary

- **Custom Metrics**: 20+
- **Alert Rules**: 32 (12 critical, 20 warning)
- **Recording Rules**: 25
- **SLOs**: 6
- **Dashboards**: 3
- **Runbooks**: 7

**Coverage**: 100% of user-facing services

**Quality Metrics**:
- Alert false positive rate: Target < 10%
- MTTA (Mean Time To Acknowledge): Target < 5 minutes
- MTTR (Mean Time To Resolve): Target < 1 hour
- Dashboard load time: Target < 3 seconds

---

## Status

✅ **Production-Ready**

All monitoring components have been implemented, tested, and documented. The system is ready for deployment to production.

**Last Updated**: 2025-12-27
**Version**: 1.0.0
**Maintained by**: GXVIS SRE Team

---

## License

This observability implementation is part of the GXVIS project and follows the same license.

---

**For detailed setup instructions, see: `monitoring/README.md`**
**For quick start guide, see: `monitoring/QUICK-START.md`**
