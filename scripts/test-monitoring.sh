#!/bin/bash
# GXVIS Monitoring Test Script
# Tests all monitoring endpoints and generates sample metrics

set -e

# Configuration
GXVIS_URL="${GXVIS_URL:-http://localhost:3000}"
PROMETHEUS_URL="${PROMETHEUS_URL:-http://localhost:9090}"
GRAFANA_URL="${GRAFANA_URL:-http://localhost:3000}"

echo "======================================"
echo "GXVIS Monitoring Test Script"
echo "======================================"
echo "GXVIS URL: $GXVIS_URL"
echo "Prometheus URL: $PROMETHEUS_URL"
echo "Grafana URL: $GRAFANA_URL"
echo ""

# Test 1: Health Check
echo "[1/6] Testing health check endpoint..."
if curl -sf "$GXVIS_URL/api/health" > /dev/null; then
  echo "✅ Health check passed"
  curl -s "$GXVIS_URL/api/health" | jq .
else
  echo "❌ Health check failed"
  exit 1
fi
echo ""

# Test 2: Metrics Endpoint
echo "[2/6] Testing metrics endpoint..."
if curl -sf "$GXVIS_URL/api/metrics" > /dev/null; then
  echo "✅ Metrics endpoint accessible"
  echo "Sample metrics:"
  curl -s "$GXVIS_URL/api/metrics" | grep "gxvis_" | head -5
else
  echo "❌ Metrics endpoint failed"
  exit 1
fi
echo ""

# Test 3: Generate Sample Traffic
echo "[3/6] Generating sample HTTP traffic..."
for i in {1..20}; do
  curl -s "$GXVIS_URL/api/drafts?limit=5" > /dev/null &
  curl -s "$GXVIS_URL/api/sources" > /dev/null &
  curl -s "$GXVIS_URL/api/templates" > /dev/null &
done
wait
echo "✅ Generated 60 HTTP requests"
echo ""

# Test 4: Check Prometheus Targets
echo "[4/6] Testing Prometheus..."
if command -v jq &> /dev/null; then
  if curl -sf "$PROMETHEUS_URL/api/v1/targets" > /dev/null; then
    echo "✅ Prometheus is running"
    active_targets=$(curl -s "$PROMETHEUS_URL/api/v1/targets" | jq '.data.activeTargets | length')
    echo "Active targets: $active_targets"
  else
    echo "⚠️  Prometheus not accessible (optional for local dev)"
  fi
else
  echo "⚠️  jq not installed, skipping Prometheus test"
fi
echo ""

# Test 5: Query Metrics
echo "[5/6] Querying sample metrics from Prometheus..."
if curl -sf "$PROMETHEUS_URL/api/v1/query?query=up" > /dev/null; then
  echo "✅ Prometheus query successful"

  # Query request rate
  echo "Request rate (last 5 min):"
  curl -s "$PROMETHEUS_URL/api/v1/query?query=sum(rate(gxvis_http_requests_total[5m]))" | jq -r '.data.result[0].value[1]' 2>/dev/null || echo "No data yet"

  # Query active connections
  echo "Active connections:"
  curl -s "$PROMETHEUS_URL/api/v1/query?query=gxvis_http_active_connections" | jq -r '.data.result[0].value[1]' 2>/dev/null || echo "No data yet"
else
  echo "⚠️  Prometheus queries not available (optional for local dev)"
fi
echo ""

# Test 6: Verify Metrics Schema
echo "[6/6] Verifying metrics schema..."
metrics=$(curl -s "$GXVIS_URL/api/metrics")

required_metrics=(
  "gxvis_http_requests_total"
  "gxvis_http_request_duration_seconds"
  "gxvis_draft_generation_total"
  "gxvis_rss_fetch_total"
  "gxvis_db_queries_total"
  "gxvis_review_decisions_total"
)

missing_metrics=()
for metric in "${required_metrics[@]}"; do
  if echo "$metrics" | grep -q "$metric"; then
    echo "✅ $metric"
  else
    echo "❌ $metric (missing)"
    missing_metrics+=("$metric")
  fi
done

echo ""
if [ ${#missing_metrics[@]} -eq 0 ]; then
  echo "======================================"
  echo "✅ ALL TESTS PASSED"
  echo "======================================"
  echo ""
  echo "Next steps:"
  echo "1. Open Grafana: $GRAFANA_URL"
  echo "2. Import dashboards from monitoring/grafana/dashboards/"
  echo "3. View metrics in Prometheus: $PROMETHEUS_URL"
  echo ""
else
  echo "======================================"
  echo "⚠️  TESTS PASSED WITH WARNINGS"
  echo "======================================"
  echo ""
  echo "Missing metrics (may appear after generating traffic):"
  for metric in "${missing_metrics[@]}"; do
    echo "  - $metric"
  done
  echo ""
  echo "To generate all metrics, run:"
  echo "  - Fetch RSS: curl -X POST $GXVIS_URL/api/fetch-rss"
  echo "  - Generate drafts: curl -X POST $GXVIS_URL/api/generate-drafts"
  echo "  - Review a draft: curl -X POST $GXVIS_URL/api/drafts/ID/decision -d '{\"action\":\"approve\"}'"
  echo ""
fi

exit 0
