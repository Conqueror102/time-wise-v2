# Deployment Checklist - Feature Gating System

## 🚀 Pre-Deployment Steps

### 1. Database Migration
- [ ] **Backup MongoDB database**
  ```bash
  mongodump --uri="YOUR_MONGODB_URI" --out=backup-$(date +%Y%m%d)
  ```

- [ ] **Run migration script**
  ```bash
  npx ts-node scripts/migrate-subscriptions.ts
  ```

- [ ] **Verify migration results**
  - Check all subscriptions have `isTrialActive` field
  - Verify `free_trial` → `starter` conversion
  - Verify `paid` → `professional`/`enterprise` conversion
  - Check trial end dates are correct

### 2. Environment Variables
- [ ] Set `NODE_ENV=production`
- [ ] Verify MongoDB connection string
- [ ] Check Paystack API keys (if using payment)
- [ ] Verify all required env vars are set

### 3. Code Review
- [ ] All feature gates implemented
- [ ] Server-side validation on all API routes
- [ ] Error messages are user-friendly
- [ ] No console.logs in production code
- [ ] TypeScript compilation successful
- [ ] No linting errors

### 4. Testing in Staging

#### Test Starter Plan (Trial Active)
- [ ] Can add up to 10 staff
- [ ] Can edit staff
- [ ] Photo verification works
- [ ] All analytics tabs accessible
- [ ] History page accessible
- [ ] CSV export works
- [ ] Fingerprint blocked (Enterprise only)

#### Test Starter Plan (Trial Expired)
- [ ] Cannot add staff - shows upgrade popup
- [ ] Cannot edit staff - shows upgrade popup
- [ ] Basic check-in works (QR & Manual)
- [ ] Photo verification blocked
- [ ] Analytics page blocked
- [ ] History page blocked
- [ ] Reports blocked

#### Test Professional Plan
- [ ] Can add up to 50 staff
- [ ] Can edit staff
- [ ] Photo verification works
- [ ] Overview & Lateness tabs work
- [ ] Trends/Department/Performance tabs locked
- [ ] History page accessible
- [ ] CSV export works
- [ ] Fingerprint blocked - shows Enterprise upgrade

#### Test Enterprise Plan
- [ ] Unlimited staff
- [ ] All features unlocked
- [ ] Fingerprint verification works
- [ ] All analytics tabs accessible
- [ ] Full history & reports
- [ ] CSV export works

### 5. API Testing
- [ ] Test all staff API endpoints
  ```bash
  # Add staff (should fail if trial expired)
  curl -X POST http://localhost:3000/api/staff \
    -H "Authorization: Bearer TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"name":"Test","department":"IT","position":"Dev"}'
  ```

- [ ] Test all analytics API endpoints
  ```bash
  # Trends (should fail for Professional)
  curl http://localhost:3000/api/analytics/trends?range=30d \
    -H "Authorization: Bearer TOKEN"
  ```

- [ ] Verify 403 responses for locked features
- [ ] Check error messages are correct
- [ ] Verify error codes (FEATURE_LOCKED, STAFF_LIMIT_REACHED)

### 6. Performance Testing
- [ ] Test with large datasets (1000+ staff)
- [ ] Check API response times
- [ ] Verify subscription checks are cached
- [ ] Test concurrent requests
- [ ] Check database query performance

### 7. Security Audit
- [ ] Server-side validation on all routes
- [ ] Cannot bypass gates with browser tools
- [ ] JWT tokens validated
- [ ] Subscription status checked on every request
- [ ] No sensitive data in error messages
- [ ] Rate limiting configured (if applicable)

---

## 📋 Deployment Steps

### 1. Build Application
```bash
npm run build
```

### 2. Run Tests
```bash
npm test
```

### 3. Deploy to Production
```bash
# Your deployment command
# e.g., vercel deploy --prod
# or: git push production main
```

### 4. Run Migration in Production
```bash
# SSH into production server or use cloud function
npx ts-node scripts/migrate-subscriptions.ts
```

### 5. Verify Deployment
- [ ] Application is accessible
- [ ] No 500 errors in logs
- [ ] Database connection working
- [ ] Feature gates working correctly

---

## 🔍 Post-Deployment Verification

### 1. Smoke Tests
- [ ] Landing page loads correctly
- [ ] Login works
- [ ] Dashboard accessible
- [ ] Analytics page loads
- [ ] Staff management works
- [ ] Check-in page functional

### 2. Feature Gate Tests
- [ ] Create test organization with Starter plan
- [ ] Verify trial features work
- [ ] Wait for trial to expire (or manually set)
- [ ] Verify features are locked
- [ ] Upgrade to Professional
- [ ] Verify Professional features work
- [ ] Verify Enterprise features locked
- [ ] Upgrade to Enterprise
- [ ] Verify all features work

### 3. API Monitoring
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Monitor 403 error rates
- [ ] Track feature access attempts
- [ ] Monitor subscription checks
- [ ] Set up alerts for high error rates

### 4. User Experience
- [ ] Upgrade popups display correctly
- [ ] Error messages are clear
- [ ] Payment flow works (if implemented)
- [ ] Trial countdown shows correctly
- [ ] Plan badges display properly

---

## 📊 Monitoring Setup

### 1. Key Metrics to Track
- [ ] **403 Error Rate** - Feature lock attempts
- [ ] **Upgrade Conversions** - Users who upgrade after 403
- [ ] **Trial Expirations** - Monitor trial-to-paid conversion
- [ ] **Feature Usage by Plan** - Which features drive upgrades
- [ ] **API Response Times** - Subscription check performance
- [ ] **Active Subscriptions** - By plan type

### 2. Alerts to Configure
- [ ] High 403 error rate (> 10% of requests)
- [ ] Subscription check failures
- [ ] Database connection issues
- [ ] Payment failures (if applicable)
- [ ] Trial expiration reminders

### 3. Logging
- [ ] Log all feature access attempts
- [ ] Log subscription checks
- [ ] Log plan upgrades/downgrades
- [ ] Log trial expirations
- [ ] Log payment events

---

## 🐛 Rollback Plan

### If Issues Occur

1. **Immediate Rollback**
   ```bash
   # Revert to previous deployment
   git revert HEAD
   git push production main
   ```

2. **Database Rollback**
   ```bash
   # Restore from backup
   mongorestore --uri="YOUR_MONGODB_URI" backup-YYYYMMDD
   ```

3. **Verify Rollback**
   - [ ] Application is stable
   - [ ] Users can access features
   - [ ] No data loss
   - [ ] Subscriptions intact

---

## ✅ Post-Deployment Checklist

### Day 1
- [ ] Monitor error logs
- [ ] Check 403 error rates
- [ ] Verify subscription checks working
- [ ] Monitor user feedback
- [ ] Check payment processing (if applicable)

### Week 1
- [ ] Review feature usage analytics
- [ ] Check upgrade conversion rates
- [ ] Monitor trial expirations
- [ ] Gather user feedback
- [ ] Optimize slow queries

### Month 1
- [ ] Analyze plan distribution
- [ ] Review upgrade patterns
- [ ] Identify popular features
- [ ] Plan feature enhancements
- [ ] Optimize pricing if needed

---

## 📞 Support Preparation

### 1. Documentation for Support Team
- [ ] Feature access matrix
- [ ] Plan comparison chart
- [ ] Upgrade process guide
- [ ] Troubleshooting guide
- [ ] Common error messages

### 2. User Communication
- [ ] Email template for trial expiration
- [ ] Email template for upgrade confirmation
- [ ] FAQ about new pricing
- [ ] Migration guide for existing users
- [ ] Feature comparison page

### 3. Admin Tools
- [ ] Manual plan upgrade capability
- [ ] Trial extension capability
- [ ] Subscription status viewer
- [ ] Feature usage reports
- [ ] User activity logs

---

## 🎯 Success Criteria

### Technical
- [ ] Zero critical bugs
- [ ] < 1% error rate
- [ ] < 500ms API response time
- [ ] 99.9% uptime
- [ ] All features working as expected

### Business
- [ ] > 10% trial-to-paid conversion
- [ ] > 20% Professional-to-Enterprise upgrade
- [ ] Positive user feedback
- [ ] Increased revenue
- [ ] Reduced support tickets

---

## 📝 Notes

### Known Issues
- None currently

### Future Improvements
- Trial countdown UI
- Email notifications
- Usage analytics dashboard
- Custom pricing for enterprises
- A/B testing for upgrade messaging

---

## ✅ Final Sign-Off

- [ ] **Technical Lead**: Verified all features working
- [ ] **QA Team**: All tests passed
- [ ] **Product Manager**: Features match requirements
- [ ] **DevOps**: Deployment successful
- [ ] **Support Team**: Documentation received

**Deployment Date**: _______________
**Deployed By**: _______________
**Status**: _______________

---

## 🚨 Emergency Contacts

- **Technical Lead**: _______________
- **DevOps**: _______________
- **Database Admin**: _______________
- **Support Lead**: _______________

---

**Remember**: Always test in staging before production deployment!
