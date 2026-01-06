# GXVIS Alert Runbooks

## Overview

This document contains step-by-step procedures for responding to GXVIS alerts. Each runbook follows a standard format:

1. **Alert Description**: What triggered the alert
2. **Impact**: User-facing impact and business consequences
3. **Diagnosis**: How to investigate the issue
4. **Mitigation**: Immediate actions to restore service
5. **Resolution**: Long-term fixes
6. **Escalation**: When to escalate and to whom

**On-Call Contact**: Check #oncall-schedule in Slack
**Incident Management**: Use #incidents channel for coordination

---

## Runbook Index

### Critical Alerts (P0)
- [GXVISServiceDown](#runbook-gxvisservicedown)
- [GXVISHighErrorRate](#runbook-gxvishigherrorrate)
- [GXVISAvailabilityErrorBudgetBurnFast](#runbook-gxvisavailabilityerrorbudgetburnfast)
- [GXVISErrorRateBurnFast](#runbook-gxviserrorrateburne-fast)
- [GXVISDraftGenerationBurnFast](#runbook-gxvisdraftgenerationburnfast)
- [GXVISNoDraftsGenerated](#runbook-gxvisnodraftsgenerated)

### Warning Alerts (P1)
- [GXVISHighLatencyP95](#runbook-gxvishighlatencyp95)
- [GXVISRSSFetchFailureRate](#runbook-gxvisrssfetchfailurerate)
- [GXVISDBSlowQueries](#runbook-gxvisdbslowqueries)

---

## Runbook: GXVISServiceDown

**Alert Name**: `GXVISServiceDown`
**Severity**: Critical (P0)
**Response Time**: < 5 minutes

### Description

GXVIS Cloud Run service is not responding to health checks. Service is completely unavailable.

### Impact

- **Users**: Cannot access application (drafts, sources, review pages)
- **Business**: Complete service outage
- **Constitutional**: Violates Article 2 (all permitted actions unavailable)

### Diagnosis

```bash
# 1. Check Cloud Run service status
gcloud run services describe gxvis-production \
  --region asia-northeast1 \
  --format="table(status.conditions)"

# 2. Check recent deployments
gcloud run revisions list \
  --service gxvis-production \
  --region asia-northeast1 \
  --limit 5

# 3. Check Cloud Run logs for errors
gcloud logging read "resource.type=cloud_run_revision \
  AND resource.labels.service_name=gxvis-production \
  AND severity>=ERROR" \
  --limit 50 \
  --format json

# 4. Check if service is receiving traffic
gcloud run services describe gxvis-production \
  --region asia-northeast1 \
  --format="value(status.traffic)"
```

### Mitigation (Immediate Actions)

**Option 1: Rollback to Previous Revision**

```bash
# List recent revisions
gcloud run revisions list \
  --service gxvis-production \
  --region asia-northeast1

# Rollback to last known good revision
gcloud run services update-traffic gxvis-production \
  --to-revisions REVISION_NAME=100 \
  --region asia-northeast1
```

**Option 2: Restart Service**

```bash
# Force new deployment (triggers restart)
gcloud run services update gxvis-production \
  --region asia-northeast1 \
  --update-env-vars RESTART_TRIGGER=$(date +%s)
```

**Option 3: Scale Up Instances**

```bash
# Increase min instances
gcloud run services update gxvis-production \
  --region asia-northeast1 \
  --min-instances 2
```

### Resolution (Long-term Fixes)

1. **Identify Root Cause**:
   - Review deployment logs
   - Check database connectivity
   - Verify environment variables
   - Review recent code changes

2. **Prevent Recurrence**:
   - Add pre-deployment health checks
   - Implement canary deployments (10% → 50% → 100%)
   - Add startup probes to Cloud Run config

3. **Update Configuration**:
   ```yaml
   # Add to Cloud Run service.yaml
   spec:
     template:
       spec:
         startupProbe:
           httpGet:
             path: /api/health
             port: 3000
           initialDelaySeconds: 10
           periodSeconds: 5
           failureThreshold: 3
   ```

### Escalation

- **After 10 minutes**: Escalate to Engineering Manager
- **After 30 minutes**: Declare Incident, create incident channel `#incident-YYYYMMDD`
- **After 1 hour**: Escalate to Director of Engineering

### Post-Incident

1. Write postmortem (use template in `docs/postmortem-template.md`)
2. Update runbook with new learnings
3. Review deployment process

---

## Runbook: GXVISHighErrorRate

**Alert Name**: `GXVISHighErrorRate`
**Severity**: Critical (P0)
**Response Time**: < 5 minutes

### Description

HTTP 5xx error rate exceeds 5% for 5 minutes. Users experiencing failed requests.

### Impact

- **Users**: Requests failing, unable to complete actions
- **Business**: Degraded service quality
- **SLO**: Burning error budget rapidly (affects SLO #2)

### Diagnosis

```bash
# 1. Check error rate by endpoint
# Query Prometheus
curl -G 'http://prometheus:9090/api/v1/query' \
  --data-urlencode 'query=sum(rate(gxvis_http_requests_total{status=~"5.."}[5m])) by (route)'

# 2. Check Cloud Run logs for 5xx errors
gcloud logging read "resource.type=cloud_run_revision \
  AND httpRequest.status>=500 \
  AND httpRequest.status<600" \
  --limit 100 \
  --format json

# 3. Check which endpoint is failing
# Look for patterns in logs (common error messages)

# 4. Check database connectivity
gcloud sql instances describe gxvis-production-db \
  --format="value(state)"
```

### Common Causes

1. **Database Connection Pool Exhausted**
   - Symptom: Errors mentioning "connection timeout"
   - Fix: Increase Prisma connection pool size

2. **AI API (AIT42) Failures**
   - Symptom: `/api/generate-drafts` endpoint failing
   - Fix: Check AIT42 service status, implement retry logic

3. **Memory Exhaustion**
   - Symptom: "Out of memory" errors in logs
   - Fix: Increase Cloud Run memory allocation

4. **Uncaught Exceptions**
   - Symptom: Specific error stack traces
   - Fix: Deploy hotfix with error handling

### Mitigation

**Step 1: Identify Failing Endpoint**

```bash
# Check error rate by route
curl -G 'http://prometheus:9090/api/v1/query' \
  --data-urlencode 'query=topk(5, sum(rate(gxvis_http_requests_total{status=~"5.."}[5m])) by (route))'
```

**Step 2: Disable Failing Feature (if possible)**

```typescript
// Example: Disable draft generation temporarily
// Update environment variable
gcloud run services update gxvis-production \
  --update-env-vars ENABLE_DRAFT_GENERATION=false \
  --region asia-northeast1
```

**Step 3: Increase Resources**

```bash
# Increase memory
gcloud run services update gxvis-production \
  --memory 4Gi \
  --region asia-northeast1

# Increase max instances
gcloud run services update gxvis-production \
  --max-instances 10 \
  --region asia-northeast1
```

### Resolution

1. Fix root cause (deploy patch)
2. Re-enable disabled features
3. Monitor error rate for 30 minutes
4. Review error budget consumption

### Escalation

- **After 15 minutes**: Escalate to Backend Team Lead
- **After 30 minutes**: Declare Incident

---

## Runbook: GXVISAvailabilityErrorBudgetBurnFast

**Alert Name**: `GXVISAvailabilityErrorBudgetBurnFast`
**Severity**: Critical (P0)
**Response Time**: < 5 minutes

### Description

Service is burning availability error budget 14.4x faster than sustainable rate (1h window). At this rate, monthly error budget will be exhausted in 2 hours.

### Impact

- **SLO**: SLO #1 (Availability) at risk of breach
- **Business**: If budget exhausted, feature freeze required

### Diagnosis

```bash
# 1. Check current uptime
curl -G 'http://prometheus:9090/api/v1/query' \
  --data-urlencode 'query=avg(up{job="gxvis-app"}[1h])'

# 2. Check error budget remaining
curl -G 'http://prometheus:9090/api/v1/query' \
  --data-urlencode 'query=(1 - ((1 - avg(up{job="gxvis-app"}[30d])) / 0.001)) * 100'

# 3. Identify downtime periods
curl -G 'http://prometheus:9090/api/v1/query_range' \
  --data-urlencode 'query=up{job="gxvis-app"}' \
  --data-urlencode 'start='$(date -u -d '1 hour ago' +%s) \
  --data-urlencode 'end='$(date -u +%s) \
  --data-urlencode 'step=15'
```

### Mitigation

Follow [GXVISServiceDown](#runbook-gxvisservicedown) runbook to restore service.

**Additional Actions**:
1. Post status update in #incidents channel
2. Notify Engineering Manager and Product Manager
3. Estimate error budget impact

### Resolution

1. Restore service availability
2. Calculate error budget consumed
3. If budget < 25%: Initiate feature freeze
4. Schedule postmortem

---

## Runbook: GXVISDraftGenerationBurnFast

**Alert Name**: `GXVISDraftGenerationBurnFast`
**Severity**: Critical (P0)
**Response Time**: < 10 minutes

### Description

Draft generation failure rate exceeds 72% (14.4x burn rate). Core business function (Article 2.2) is failing.

### Impact

- **Users**: No new drafts available for review
- **Business**: Core functionality impaired
- **Constitutional**: Violates Article 2.2 (generation purpose)

### Diagnosis

```bash
# 1. Check draft generation success rate
curl -G 'http://prometheus:9090/api/v1/query' \
  --data-urlencode 'query=sum(rate(gxvis_draft_generation_total{status="success"}[1h])) / sum(rate(gxvis_draft_generation_total[1h]))'

# 2. Check error logs for draft generation
gcloud logging read "resource.type=cloud_run_revision \
  AND jsonPayload.component='draft_generator' \
  AND severity>=ERROR" \
  --limit 50

# 3. Check AI API (AIT42) connectivity
# Test AIT42 endpoint manually
curl -X POST https://ait42.example.com/api/generate \
  -H "Authorization: Bearer $AIT42_API_KEY" \
  -d '{"prompt": "test"}'

# 4. Check if ingestion pipeline is working
curl -G 'http://prometheus:9090/api/v1/query' \
  --data-urlencode 'query=sum(increase(gxvis_rss_items_fetched_total{is_new="true"}[1h]))'
```

### Common Causes

1. **AIT42 API Failures**
   - Symptom: "Connection refused" or "Timeout" errors
   - Fix: Check AIT42 service status, implement retry with backoff

2. **Invalid Input Data**
   - Symptom: "Validation error" in logs
   - Fix: Add input validation, handle edge cases

3. **Rate Limiting**
   - Symptom: "Rate limit exceeded" errors
   - Fix: Implement request throttling, queue system

4. **Template Loading Failures**
   - Symptom: "Template not found" errors
   - Fix: Verify template database entries

### Mitigation

**Step 1: Check AIT42 API Key**

```bash
# Verify API key is set
gcloud run services describe gxvis-production \
  --region asia-northeast1 \
  --format="value(spec.template.spec.containers[0].env)"

# Rotate API key if expired
gcloud secrets versions access latest \
  --secret="ait42-api-key"
```

**Step 2: Implement Fallback**

```typescript
// Temporarily reduce generation volume
// Update job configuration
gcloud scheduler jobs update http fetch-rss-job \
  --schedule="0 */6 * * *" \  # Reduce from hourly to every 6 hours
  --location=asia-northeast1
```

**Step 3: Enable Retry Logic**

```typescript
// Add to draft-generator.ts
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

async function generateDraftWithRetry(ingestItem: IngestItem) {
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      return await generateDraft(ingestItem);
    } catch (error) {
      if (i === MAX_RETRIES - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (i + 1)));
    }
  }
}
```

### Resolution

1. Identify root cause (AIT42 API, validation, rate limiting)
2. Deploy fix
3. Monitor success rate for 1 hour
4. Re-enable normal generation volume

### Escalation

- **After 20 minutes**: Escalate to Backend Team Lead
- **After 1 hour**: Escalate to Engineering Manager, notify Product Manager

---

## Runbook: GXVISNoDraftsGenerated

**Alert Name**: `GXVISNoDraftsGenerated`
**Severity**: Critical (P0)
**Response Time**: < 30 minutes

### Description

New RSS items fetched but no drafts generated in 1 hour. Generation pipeline is broken.

### Impact

- **Users**: No new content to review
- **Business**: Pipeline interruption
- **Constitutional**: Violates Article 2.2 (generation pipeline)

### Diagnosis

```bash
# 1. Check if RSS items are being fetched
curl -G 'http://prometheus:9090/api/v1/query' \
  --data-urlencode 'query=sum(increase(gxvis_rss_items_fetched_total{is_new="true"}[1h]))'

# 2. Check if buzz candidates are being created
psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"BuzzCandidate\" WHERE \"createdAt\" > NOW() - INTERVAL '1 hour';"

# 3. Check if draft generation jobs are running
gcloud logging read "resource.type=cloud_run_revision \
  AND jsonPayload.jobType='generate_drafts'" \
  --limit 10

# 4. Check Cloud Scheduler job status
gcloud scheduler jobs describe generate-drafts-job \
  --location=asia-northeast1
```

### Common Causes

1. **Candidate Selection Too Strict**
   - Symptom: Buzz candidates exist but score too low
   - Fix: Lower score threshold temporarily

2. **Cloud Scheduler Job Not Running**
   - Symptom: No job execution logs
   - Fix: Re-enable job, check Pub/Sub triggers

3. **Database Connection Issues**
   - Symptom: "Connection refused" errors
   - Fix: Check Cloud SQL status, verify connection string

### Mitigation

**Step 1: Manually Trigger Generation**

```bash
# Trigger draft generation endpoint
curl -X POST https://gxvis-production-xxxxxx-an.a.run.app/api/generate-drafts \
  -H "Content-Type: application/json" \
  -d '{"limit": 30}'
```

**Step 2: Check Candidate Scores**

```sql
-- Check if candidates exist
SELECT
  COUNT(*),
  AVG(score),
  MIN(score),
  MAX(score)
FROM "BuzzCandidate"
WHERE "createdAt" > NOW() - INTERVAL '1 hour';

-- Lower threshold if needed
UPDATE "DraftPost"
SET "trendScore" = 30  -- Lower threshold from 50 to 30
WHERE "createdAt" > NOW() - INTERVAL '1 hour';
```

**Step 3: Check Cloud Scheduler**

```bash
# List recent job executions
gcloud scheduler jobs describe generate-drafts-job \
  --location=asia-northeast1 \
  --format="value(state, lastAttemptTime)"

# Manually trigger job
gcloud scheduler jobs run generate-drafts-job \
  --location=asia-northeast1
```

### Resolution

1. Fix pipeline issue (candidate selection, scheduler, database)
2. Verify drafts are being generated
3. Monitor for 2 hours

---

## Runbook: GXVISRSSFetchFailureRate

**Alert Name**: `GXVISRSSFetchFailureRate`
**Severity**: Warning (P1)
**Response Time**: < 1 hour

### Description

RSS feed fetch failure rate exceeds 30% for a specific feed over 30 minutes.

### Impact

- **Users**: Reduced new content ingestion
- **Business**: Input pipeline degraded (Article 5.2)

### Diagnosis

```bash
# 1. Check which feeds are failing
curl -G 'http://prometheus:9090/api/v1/query' \
  --data-urlencode 'query=sum(rate(gxvis_rss_fetch_total{status="error"}[30m])) by (feed_name)'

# 2. Check specific feed errors
gcloud logging read "resource.type=cloud_run_revision \
  AND jsonPayload.component='rss_fetcher' \
  AND jsonPayload.feed_name='CoinDesk' \
  AND severity>=ERROR" \
  --limit 20

# 3. Test feed URL manually
curl -I https://www.coindesk.com/arc/outboundfeeds/rss/
```

### Common Causes

1. **Feed URL Changed/Moved**
   - Symptom: "404 Not Found" errors
   - Fix: Update feed URL in `rss-fetcher.ts`

2. **Feed Rate Limiting**
   - Symptom: "429 Too Many Requests"
   - Fix: Reduce fetch frequency for that feed

3. **Network Timeouts**
   - Symptom: "Timeout" errors
   - Fix: Increase timeout, add retry logic

4. **Feed Parse Errors**
   - Symptom: "Invalid RSS format"
   - Fix: Update rss-parser options

### Mitigation

**Step 1: Temporarily Disable Failing Feed**

```typescript
// Update RSS_FEEDS in rss-fetcher.ts
const RSS_FEEDS = [
  // {
  //   name: "CoinDesk",  // Temporarily disabled
  //   url: "https://www.coindesk.com/arc/outboundfeeds/rss/",
  // },
  ...
];
```

**Step 2: Add Retry Logic**

```typescript
// Add exponential backoff
async function fetchWithRetry(url: string, retries = 3): Promise<Feed> {
  for (let i = 0; i < retries; i++) {
    try {
      return await parser.parseURL(url);
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
  }
}
```

### Resolution

1. Fix feed URL or configuration
2. Re-enable feed
3. Monitor for 24 hours

---

## Runbook: GXVISDBSlowQueries

**Alert Name**: `GXVISDBSlowQueries`
**Severity**: Warning (P1)
**Response Time**: < 1 hour

### Description

Database query P95 latency exceeds 1 second for 15 minutes.

### Impact

- **Users**: Slow page loads
- **SLO**: Affects SLO #3 (Latency)

### Diagnosis

```bash
# 1. Check which queries are slow
curl -G 'http://prometheus:9090/api/v1/query' \
  --data-urlencode 'query=topk(5, gxvis:db_query_duration:p95)'

# 2. Check Cloud SQL performance insights
gcloud sql operations list \
  --instance=gxvis-production-db \
  --limit=10

# 3. Check for long-running queries
gcloud sql instances describe gxvis-production-db \
  --format="value(settings.insightsConfig.queryInsightsEnabled)"

# 4. Review query logs
gcloud logging read "resource.type=cloudsql_database \
  AND protoPayload.request.query_duration_seconds>1" \
  --limit 50
```

### Common Causes

1. **Missing Indexes**
   - Symptom: Sequential scans in query plan
   - Fix: Add indexes via Prisma migration

2. **Large Dataset Growth**
   - Symptom: Queries slow over time
   - Fix: Add pagination, archive old data

3. **Connection Pool Exhaustion**
   - Symptom: Queries waiting for connections
   - Fix: Increase Prisma connection pool size

### Mitigation

**Step 1: Add Missing Indexes**

```prisma
// Add to schema.prisma
model DraftPost {
  ...
  @@index([status, trendScore])  // Composite index for common queries
  @@index([createdAt])
}
```

**Step 2: Optimize Query**

```typescript
// Before (slow)
const drafts = await prisma.draftPost.findMany({
  include: {
    ingestItem: true,
    template: true,
    reviewDecisions: true,  // Remove unnecessary includes
  },
});

// After (fast)
const drafts = await prisma.draftPost.findMany({
  select: {
    id: true,
    title: true,
    status: true,
    ingestItem: { select: { url: true } },
    template: { select: { code: true } },
  },
});
```

**Step 3: Increase Connection Pool**

```typescript
// Update prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // Add connection pool settings
  // ?connection_limit=20&pool_timeout=10
}
```

### Resolution

1. Deploy query optimizations
2. Run Prisma migration (if indexes added)
3. Monitor query performance for 24 hours

---

## General Troubleshooting

### 1. Check Service Health

```bash
# Health check endpoint
curl https://gxvis-production-xxxxxx-an.a.run.app/api/health

# Metrics endpoint
curl https://gxvis-production-xxxxxx-an.a.run.app/api/metrics | grep gxvis_
```

### 2. Check Recent Deployments

```bash
gcloud run revisions list \
  --service gxvis-production \
  --region asia-northeast1 \
  --limit 10
```

### 3. Check Error Logs

```bash
gcloud logging read "resource.type=cloud_run_revision \
  AND resource.labels.service_name=gxvis-production \
  AND severity>=ERROR" \
  --limit 100 \
  --format json
```

### 4. Check Database Status

```bash
gcloud sql instances describe gxvis-production-db \
  --format="table(state, databaseVersion, settings.tier)"
```

---

## Escalation Matrix

| Time Elapsed | Severity | Escalate To |
|--------------|----------|-------------|
| 10 min | Critical | Engineering Manager |
| 30 min | Critical | Director of Engineering |
| 1 hour | Critical | Declare Incident, create incident channel |
| 1 hour | Warning | Backend Team Lead |
| 4 hours | Warning | Engineering Manager |

---

**Document Owner**: SRE Team
**Last Updated**: 2025-12-27
**Next Review**: 2026-01-27
