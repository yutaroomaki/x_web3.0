# GXVIS Observability - Quick Start Guide

This guide will get you started with GXVIS observability in 10 minutes.

---

## Prerequisites

- GXVIS application running locally or deployed to Cloud Run
- Access to Google Cloud Console
- Slack workspace (for alerts)

---

## Step 1: Verify Metrics Endpoint (2 minutes)

### Local Development

```bash
# Start the application
npm run dev

# Check if metrics endpoint is accessible
curl http://localhost:3000/api/metrics

# You should see output like:
# HELP gxvis_http_requests_total Total number of HTTP requests
# TYPE gxvis_http_requests_total counter
# gxvis_http_requests_total{method="GET",route="/api/drafts",status="200"} 42
```

### Cloud Run (Production)

```bash
# Replace with your actual Cloud Run URL
export GXVIS_URL="https://gxvis-production-xxxxxx-an.a.run.app"

# Check metrics endpoint
curl $GXVIS_URL/api/metrics | head -20

# Check health endpoint
curl $GXVIS_URL/api/health
```

**Expected Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-12-27T12:00:00.000Z",
  "checks": {
    "database": { "status": "healthy", "latencyMs": 5 },
    "memory": { "status": "healthy", "latencyMs": 45 },
    "overall": { "status": "healthy", "latencyMs": 10 }
  }
}
```

✅ **Success**: If you see metrics and health check responses, proceed to Step 2.

---

## Step 2: Deploy Prometheus (5 minutes)

### Option A: Google Cloud Managed Service (Recommended)

```bash
# Enable Cloud Monitoring API
gcloud services enable monitoring.googleapis.com

# Configure scraping for Cloud Run
gcloud run services update gxvis-production \
  --region asia-northeast1 \
  --update-annotations prometheus.io/scrape=true,prometheus.io/port=3000,prometheus.io/path=/api/metrics

# Verify metrics are being collected
gcloud monitoring time-series list \
  --filter='metric.type="external.googleapis.com/prometheus/gxvis_http_requests_total"' \
  --format=json
```

### Option B: Self-Hosted Prometheus (Alternative)

```bash
# Update Prometheus configuration with your Cloud Run URL
cd monitoring/prometheus
sed -i 's/gxvis-production-xxxxxx-an.a.run.app/YOUR_ACTUAL_URL/g' prometheus.yml

# Run Prometheus locally (for testing)
docker run -d \
  -p 9090:9090 \
  -v $(pwd)/prometheus.yml:/etc/prometheus/prometheus.yml \
  -v $(pwd)/rules:/etc/prometheus/rules \
  prom/prometheus:v2.45.0

# Open Prometheus UI
open http://localhost:9090

# Query test
# Go to http://localhost:9090/graph
# Enter: sum(rate(gxvis_http_requests_total[5m]))
```

✅ **Success**: If you can query metrics in Prometheus, proceed to Step 3.

---

## Step 3: Deploy Grafana (3 minutes)

### Local Grafana (for testing)

```bash
# Run Grafana locally
docker run -d \
  -p 3000:3000 \
  -e GF_SECURITY_ADMIN_PASSWORD=admin \
  grafana/grafana:10.0.0

# Open Grafana UI
open http://localhost:3000

# Login: admin / admin
```

### Configure Datasource

1. Go to **Configuration > Data Sources**
2. Click **Add data source**
3. Select **Prometheus**
4. Set URL: `http://prometheus:9090` (or `http://localhost:9090` for local)
5. Click **Save & Test**

### Import Dashboards

1. Go to **Dashboards > Import**
2. Upload dashboard JSON files:
   - `monitoring/grafana/dashboards/gxvis-application-red.json`
   - `monitoring/grafana/dashboards/gxvis-business-metrics.json`
   - `monitoring/grafana/dashboards/gxvis-slo-dashboard.json`
3. Select Prometheus datasource
4. Click **Import**

✅ **Success**: If dashboards load with data, you're done!

---

## Quick Testing

### Generate Test Traffic

```bash
# Generate HTTP requests
for i in {1..100}; do
  curl -s $GXVIS_URL/api/drafts > /dev/null
  sleep 0.1
done
```

### View Metrics in Grafana

1. Open **Application Dashboard**
2. Set time range to **Last 5 minutes**
3. You should see:
   - Request rate increasing
   - Response time graphs
   - Active connections

### Trigger Test Alert (Optional)

```bash
# Simulate high error rate
for i in {1..50}; do
  curl -s $GXVIS_URL/api/nonexistent-endpoint > /dev/null
done

# Wait 5-10 minutes
# Alert should fire in Prometheus: http://localhost:9090/alerts
```

---

## What's Next?

### Immediate Actions (Today)

1. ✅ Bookmark Grafana dashboards
2. ✅ Test health check endpoint
3. ✅ Share metrics endpoint with team

### This Week

1. 📚 Read full documentation: `monitoring/README.md`
2. 🎯 Review SLO definitions: `monitoring/docs/SLO-DEFINITIONS.md`
3. 📖 Study runbooks: `monitoring/docs/RUNBOOKS.md`

### This Month

1. 🔔 Configure Slack alerts (see below)
2. 🎨 Customize dashboards for your needs
3. 📊 Schedule SLO review meeting

---

## Configure Slack Alerts (Bonus)

### Step 1: Create Slack Webhook

1. Go to https://api.slack.com/apps
2. Create new app > From scratch
3. Choose workspace
4. Go to **Incoming Webhooks** > Activate
5. Click **Add New Webhook to Workspace**
6. Select channel (e.g., `#gxvis-alerts`)
7. Copy webhook URL

### Step 2: Configure Alertmanager

```bash
# Store webhook in Secret Manager
echo -n "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK" | \
  gcloud secrets create slack-webhook-url --data-file=-

# Update Alertmanager config
export SLACK_WEBHOOK_URL=$(gcloud secrets versions access latest --secret=slack-webhook-url)

# Deploy Alertmanager
kubectl create configmap alertmanager-config \
  --from-file=monitoring/alertmanager/alertmanager.yml

# (Follow full deployment instructions in monitoring/README.md)
```

### Step 3: Test Alert

```bash
# Send test alert to Alertmanager
curl -X POST http://localhost:9093/api/v1/alerts \
  -H "Content-Type: application/json" \
  -d '[{
    "labels": {
      "alertname": "TestAlert",
      "severity": "warning"
    },
    "annotations": {
      "summary": "This is a test alert"
    }
  }]'

# Check Slack channel for notification
```

---

## Common Issues

### Issue: Metrics endpoint returns 404

**Solution**:
```bash
# Verify route exists
ls src/app/api/metrics/route.ts

# Rebuild and restart
npm run build
npm run dev
```

### Issue: No data in Grafana dashboards

**Solution**:
```bash
# Check Prometheus is scraping
curl http://localhost:9090/api/v1/targets

# Verify GXVIS URL is correct in prometheus.yml
cat monitoring/prometheus/prometheus.yml | grep gxvis-production
```

### Issue: Database health check failing

**Solution**:
```bash
# Check DATABASE_URL environment variable
echo $DATABASE_URL

# Test database connection
npx prisma db pull
```

---

## Key Endpoints

| Endpoint | Purpose | Example |
|----------|---------|---------|
| `/api/metrics` | Prometheus metrics | `curl $GXVIS_URL/api/metrics` |
| `/api/health` | Health check | `curl $GXVIS_URL/api/health` |
| `/api/drafts` | Application API | `curl $GXVIS_URL/api/drafts` |

---

## Key Dashboards

| Dashboard | URL | Purpose |
|-----------|-----|---------|
| Application (RED) | `http://localhost:3000/d/gxvis-app-red` | Real-time health monitoring |
| Business Metrics | `http://localhost:3000/d/gxvis-business` | Product KPIs |
| SLO Dashboard | `http://localhost:3000/d/gxvis-slo` | Error budget tracking |

---

## Quick PromQL Queries

```promql
# Request rate
sum(rate(gxvis_http_requests_total[5m]))

# Error rate
sum(rate(gxvis_http_requests_total{status=~"5.."}[5m])) / sum(rate(gxvis_http_requests_total[5m]))

# P95 latency
histogram_quantile(0.95, sum(rate(gxvis_http_request_duration_seconds_bucket[5m])) by (le))

# Drafts generated (last hour)
sum(increase(gxvis_draft_generation_total{status="success"}[1h]))

# Current pending drafts
gxvis_drafts_by_status{status="pending"}
```

---

## Get Help

- 📖 Full Documentation: `monitoring/README.md`
- 🎯 SLO Definitions: `monitoring/docs/SLO-DEFINITIONS.md`
- 📚 Alert Runbooks: `monitoring/docs/RUNBOOKS.md`
- 💬 Slack: `#gxvis-alerts` (for production alerts)
- 🆘 On-Call: Check `#oncall-schedule`

---

**Estimated Time**: 10 minutes
**Difficulty**: Beginner
**Last Updated**: 2025-12-27

Happy Monitoring! 🚀
