# Psychology Portal - Demo Accounts & Login Guide

## 🚀 Quick Start

**Application URL:** https://psych-portal-6.preview.emergentagent.com

## 👥 Demo Accounts

### Psychologist Account
```
Email: demo-psychologist@psychology.com
Password: password
Name: Dr. Sarah Chen
```

**Pre-loaded Data:**
- ✅ 7 hours of practice logged
- ✅ 18 CPD hours (60% of 30 required)
- ✅ 3 logbook entries (therapy, assessment, supervision)
- ✅ 3 CPD activities (workshop, reading, online course)
- ✅ 3 competency journal entries
- ✅ Connected to supervisor (Prof. Michael Roberts)

### Supervisor Account
```
Email: demo-supervisor@psychology.com
Password: password
Name: Prof. Michael Roberts
```

**Features:**
- ✅ View Dr. Sarah Chen's logbook (read-only)
- ✅ View Dr. Sarah Chen's CPD activities (read-only)
- ✅ Active connection with psychologist
- ✅ Can send messages

## 🔐 Login Methods

### Method 1: Email/Password (Recommended for Demo)
1. Visit the application URL
2. Click "👨‍🎓 Psychologist" or "👨‍🏫 Supervisor" button
3. Credentials auto-fill
4. Click "Login"
5. ✅ Instant access!

### Method 2: Manual Entry
1. Enter email: `demo-psychologist@psychology.com`
2. Enter password: `password`
3. Click "Login"

### Method 3: Google OAuth (For Production)
1. Click "Continue with Google"
2. Authenticate with your Google account
3. Select role (Psychologist or Supervisor)
4. ✅ Account created automatically

## ✨ Features to Explore

### As Psychologist (Dr. Sarah Chen):

**Dashboard**
- View total practice hours
- See CPD progress (18/30 hours)
- Quick access to all features

**Logbook**
- View weekly breakdown of practice hours
- Add new logbook entries
- Sign weeks digitally
- Export as PDF

**CPD Activities**
- View activities in 3 modes (Weekly/Monthly/Yearly)
- Add workshops, courses, readings
- Track progress toward 30-hour requirement
- Export as PDF

**Competencies**
- 6 core competency areas
- Add journal entries for each competency
- Track development across all areas

**Connections**
- Already connected to Prof. Michael Roberts
- Can search for additional supervisors

**Messages**
- Chat with supervisor
- Real-time notifications

### As Supervisor (Prof. Michael Roberts):

**Dashboard**
- View all connected psychologists
- Quick access to their logbooks and CPD

**Supervisor Views**
- Read-only access to psychologist's logbook
- View all CPD activities
- Monitor progress

**Connections**
- Accept/reject connection requests
- Manage psychologists

## 🔄 Reset Demo Data

To reset demo accounts with fresh data, run:
```bash
cd /app/backend
python3 seed_demo_accounts.py
```

This will:
- Delete existing demo accounts
- Create fresh accounts with sample data
- Re-establish connection between them

## 🌐 Works Everywhere

✅ **Preview Environment** - Works now!
✅ **Azure Deployment** - Ready to deploy
✅ **Any Domain** - Email/password works universally

## 📋 Testing Checklist

- [ ] Login as psychologist
- [ ] View dashboard stats
- [ ] Add logbook entry
- [ ] View weekly breakdown
- [ ] Sign a week
- [ ] Add CPD activity
- [ ] View CPD in 3 modes
- [ ] Add competency journal
- [ ] Send message to supervisor
- [ ] Logout
- [ ] Login as supervisor
- [ ] View psychologist's logbook
- [ ] View psychologist's CPD
- [ ] Send message back

## 🆘 Troubleshooting

**Can't login?**
- Make sure you're using the correct credentials
- Try the demo buttons to auto-fill
- Check console for errors

**No data showing?**
- Demo accounts are pre-seeded with data
- If empty, run seed script again

**Google OAuth not working in preview?**
- Use email/password login instead
- Google OAuth works best in production

## 🚀 Next Steps

1. **Test all features** with demo accounts
2. **Provide feedback** on any issues
3. **Ready for Azure deployment** when approved
4. **Can add more features** as needed

---

**Built with:** FastAPI, React, MongoDB, Emergent Auth
**Deployment Ready:** Azure, Docker, Kubernetes
