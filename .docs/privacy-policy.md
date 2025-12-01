# Privacy Policy for Venus Platform

**Effective Date:** November 29, 2025

## 1. Introduction

Venus Platform ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform for creating and managing professional portfolios.

## 2. Information We Collect

### 2.1 Personal Information
- **Account Information:** Email address, password (encrypted)
- **Profile Information:** Display name, bio, contact details
- **Portfolio Content:** Projects, descriptions, media files

### 2.2 Usage Data
- **Log Data:** IP address, browser type, access times
- **Analytics:** Page views, feature usage, performance metrics

### 2.3 Cookies and Tracking
- **Essential Cookies:** For authentication and security
- **Analytics Cookies:** For improving user experience (optional)

## 3. How We Use Your Information

### 3.1 Service Provision
- Creating and managing your portfolio
- Authentication and account security
- Content delivery and optimization

### 3.2 Communication
- Account notifications and updates
- Security alerts
- Customer support responses

### 3.3 Platform Improvement
- Analytics and usage statistics
- Performance monitoring
- Feature development

## 4. Information Sharing

We do not sell, trade, or rent your personal information to third parties. We may share information only in the following circumstances:

- **Legal Requirements:** When required by law or court order
- **Service Providers:** With trusted partners for hosting, analytics, and payment processing
- **Business Transfers:** In case of merger, acquisition, or asset sale
- **Consent:** With your explicit permission

## 5. Data Security

We implement industry-standard security measures:

- **Encryption:** All data transmitted over HTTPS
- **Password Hashing:** bcrypt with salt
- **Access Controls:** Role-based permissions
- **Regular Audits:** Security assessments and updates

## 6. Data Retention

- **Account Data:** Retained while account is active
- **Deleted Accounts:** Data permanently removed within 30 days
- **Analytics Data:** Anonymized and retained for 2 years

## 7. Your Rights (GDPR)

If you are in the European Economic Area, you have the right to:

- **Access:** Request a copy of your personal data
- **Rectification:** Correct inaccurate or incomplete data
- **Erasure:** Request deletion of your data ("right to be forgotten")
- **Portability:** Receive your data in a structured format
- **Restriction:** Limit processing of your data
- **Objection:** Object to processing based on legitimate interests

## 8. Data Export and Deletion

### Export Your Data
```bash
GET /api/auth/account/export
Authorization: Bearer <your-token>
```

### Delete Your Account
```bash
DELETE /api/auth/account
Authorization: Bearer <your-token>
Content-Type: application/json

{
  "confirmEmail": "your-email@example.com"
}
```

## 9. Cookies Policy

### Essential Cookies
- **session_token:** For maintaining login sessions
- **csrf_token:** For preventing cross-site request forgery

### Analytics Cookies (Optional)
- **_ga:** Google Analytics (if enabled)
- **_gid:** Google Analytics session tracking

You can disable non-essential cookies in your browser settings.

## 10. Third-Party Services

We use the following third-party services:

- **Cloudflare:** CDN and DNS services
- **PostgreSQL/Redis:** Database services
- **Analytics Providers:** For usage insights (optional)

## 11. Children's Privacy

Our service is not intended for children under 13. We do not knowingly collect personal information from children under 13.

## 12. Changes to This Policy

We may update this Privacy Policy from time to time. We will notify you of any changes by:

- Email notification
- Platform announcement
- Updated effective date

## 13. Contact Us

If you have questions about this Privacy Policy, please contact us:

- **Email:** privacy@venus.app
- **Support:** https://venus.app/support

## 14. Data Processing Agreement

For business customers, we offer a Data Processing Agreement (DPA) that includes standard contractual clauses for international data transfers.

---

*This Privacy Policy is designed to comply with GDPR, CCPA, and other privacy regulations.*