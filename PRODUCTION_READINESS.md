# Production Readiness Checklist

## ✅ Completed Security Improvements

### 1. Row Level Security (RLS) ✅
- **Status**: Implemented
- **File**: `supabase/migrations/secure_rls_policies.sql`
- **Details**: User-scoped policies using `auth.uid()` to ensure data isolation
- **Action Required**: Apply migration to production database

### 2. Edge Function Security ✅
- **Status**: Hardened
- **File**: `supabase/functions/evaluate-rules/index.ts`
- **Improvements**:
  - ✅ ReDoS protection (safe regex evaluation)
  - ✅ Authentication requirement
  - ✅ Rate limiting (100 req/min per IP)
  - ✅ Input validation and size limits
  - ✅ CORS configuration in code
  - ✅ Error handling (no information leakage)
- **Action Required**: Deploy updated function and configure CORS origins

### 3. Migration Management ✅
- **Status**: Documented
- **Files**: 
  - `supabase/MIGRATION_GUIDE.md` - Comprehensive migration guide
  - `supabase/README.md` - Updated setup instructions
- **Action Required**: Install Supabase CLI and adopt for future migrations

### 4. Insecure Files Removed ✅
- **Status**: Cleaned up
- **Removed**: References to `fix-rls.sql` and `fix-categories-rls.sql`
- **Action Required**: None

## 📋 Pre-Production Checklist

### Database Setup
- [ ] Apply `secure_rls_policies.sql` migration to production
- [ ] Verify RLS policies are enabled on all tables
- [ ] Test data isolation with multiple users
- [ ] Set up automated backups
- [ ] Configure backup retention policy

### Edge Function Deployment
- [ ] Deploy updated `evaluate-rules` function
- [ ] Update `allowedOrigins` array with production domains
- [ ] Remove localhost entries from CORS configuration
- [ ] Test function with production authentication
- [ ] Monitor function logs for errors
- [ ] Set up alerts for rate limit violations

### Authentication
- [ ] Enable Supabase Authentication
- [ ] Configure email provider (SMTP or Supabase)
- [ ] Set up password requirements
- [ ] Configure session management
- [ ] Test user registration and login flows

### Environment Variables
- [ ] Set `NEXT_PUBLIC_SUPABASE_URL` in production
- [ ] Set `NEXT_PUBLIC_SUPABASE_ANON_KEY` in production
- [ ] Verify environment variables are not exposed in client code
- [ ] Use Vercel environment variables (if deploying to Vercel)

### Migration Tooling
- [ ] Install Supabase CLI: `npm install -g supabase`
- [ ] Link production project: `supabase link --project-ref your-ref`
- [ ] Test migration workflow in staging
- [ ] Document migration procedures for team
- [ ] Set up migration review process

### Testing
- [ ] Test RLS policies (User A cannot see User B's data)
- [ ] Test Edge Function rate limiting
- [ ] Test authentication requirements
- [ ] Test input validation (large payloads, invalid data)
- [ ] Test ReDoS protection (malicious regex patterns)
- [ ] Test CORS (allowed and disallowed origins)
- [ ] Load testing for performance

### Monitoring & Logging
- [ ] Set up error tracking (e.g., Sentry)
- [ ] Configure Supabase dashboard alerts
- [ ] Monitor Edge Function execution times
- [ ] Track rate limit violations
- [ ] Set up database query monitoring

### Documentation
- [ ] Update deployment documentation
- [ ] Document environment setup for team
- [ ] Create runbook for common issues
- [ ] Document rollback procedures

## 🚀 Deployment Steps

### 1. Database Migration
```bash
# Using Supabase CLI
supabase login
supabase link --project-ref your-production-ref
supabase db push

# Or manually in Supabase Dashboard → SQL Editor
# Run: supabase/migrations/secure_rls_policies.sql
```

### 2. Edge Function Deployment
```bash
# Deploy function
supabase functions deploy evaluate-rules

# Or use Supabase Dashboard → Edge Functions → Deploy
```

### 3. Update CORS Configuration
Edit `supabase/functions/evaluate-rules/index.ts`:
```typescript
const allowedOrigins = [
  "https://yourapp.com",
  "https://www.yourapp.com",
  // Remove localhost entries
]
```

### 4. Frontend Deployment
```bash
# Build and deploy to Vercel
vercel --prod

# Or your preferred hosting platform
```

## 🔒 Security Best Practices

### Ongoing Maintenance
- **Regular Security Audits**: Review RLS policies quarterly
- **Dependency Updates**: Keep packages updated, especially security patches
- **Access Control**: Regularly review user permissions
- **Backup Verification**: Test restore procedures monthly

### Monitoring
- **Anomaly Detection**: Monitor for unusual access patterns
- **Rate Limit Alerts**: Set up alerts for repeated violations
- **Error Tracking**: Monitor Edge Function errors
- **Performance Metrics**: Track query performance

## 📚 Additional Resources

- **RLS Migration**: `supabase/migrations/README_SECURE_RLS.md`
- **Migration Guide**: `supabase/MIGRATION_GUIDE.md`
- **Security Improvements**: `SECURITY_IMPROVEMENTS.md`
- **Supabase Docs**: https://supabase.com/docs

## ⚠️ Important Notes

1. **Never deploy without RLS policies** - This is a critical security requirement
2. **Test migrations in staging first** - Always test before production
3. **Backup before major changes** - Always have a rollback plan
4. **Monitor after deployment** - Watch for errors and performance issues
5. **Update CORS for production** - Remove development origins

## Support

If you encounter issues:
1. Check Supabase Dashboard → Logs
2. Review migration files for syntax errors
3. Verify RLS policies are correctly applied
4. Check Edge Function logs
5. Review this checklist for missed steps
