# Analytics Dashboard Setup Guide

## 📊 Overview
A comprehensive, modern analytics dashboard with advanced features for tracking attendance, lateness trends, department performance, and staff metrics.

## 🎨 Design Features
- **Modern UI**: Clean, sleek design with blue and white color scheme
- **No Gradients**: Solid colors for professional appearance
- **Smooth Animations**: Hover effects and transitions
- **Responsive**: Mobile-first design that works on all devices
- **Interactive Charts**: Real-time data visualization

## 📦 Installation

### 1. Install Required Dependencies

```bash
npm install chart.js react-chartjs-2
```

### 2. Database Setup
The analytics system uses your existing Prisma schema. Ensure you have:
- `Staff` model with `tenantId`, `name`, `staffId`, `departmentId`
- `Attendance` model with `checkInTime`, `checkOutTime`, `isLate`, `isEarly`
- `Department` model with `name`, `tenantId`

### 3. Access the Dashboard
Navigate to: `/dashboard/analytics`

## 🚀 Features

### 1. Overview Stats
- **Total Staff**: Current staff count
- **Attendance Rate**: Average attendance percentage with trend
- **Late Arrivals**: Count of late check-ins with trend
- **Absentees**: Today's absent staff count

### 2. Attendance Trends
- **Line Chart**: Daily check-in and check-out patterns
- **Bar Chart**: On-time vs late arrivals breakdown
- **Weekly Comparison**: Week-over-week attendance comparison

### 3. Lateness Analysis
- **Distribution Chart**: Breakdown by delay duration (0-15, 15-30, 30-60, 60+ minutes)
- **Top Late Staff**: Staff with most late arrivals
- **Recent Late Arrivals**: Detailed table of latest late check-ins
- **Trend Analysis**: Compare with previous period

### 4. Department Breakdown
- **Department Cards**: Quick overview of top 3 departments
- **Attendance by Department**: Bar chart showing attendance rates
- **Punctuality Comparison**: Radar chart for department punctuality scores
- **Performance Table**: Comprehensive department metrics

### 5. Staff Performance
- **Top Performers**: Best attendance and most punctual staff
- **Needs Attention**: Staff requiring intervention
- **Performance Table**: Individual staff metrics with search
- **Export Functionality**: Download reports in CSV, Excel, or PDF

## 🎯 Key Metrics

### Attendance Rate
```
(Unique Staff Attended / Total Staff) × 100
```

### Punctuality Score
```
((Total Attendance - Late Count) / Total Attendance) × 100
```

### Trend Calculation
```
Current Period Rate - Previous Period Rate
```

## 📈 Time Ranges
- **7 Days**: Last week overview
- **30 Days**: Monthly analysis (default)
- **90 Days**: Quarterly trends
- **1 Year**: Annual performance

## 🎨 Color Scheme

### Primary Colors
- **Blue**: `#2563eb` (Primary actions, charts)
- **White**: `#ffffff` (Background)
- **Gray**: `#f3f4f6` (Secondary backgrounds)

### Status Colors
- **Green**: `#10b981` (Excellent, On-time)
- **Yellow**: `#f59e0b` (Warning, Fair)
- **Orange**: `#f97316` (Late arrivals)
- **Red**: `#ef4444` (Critical, Poor)

## 🔧 Customization

### Modify Time Ranges
Edit `components/analytics/time-range-selector.tsx`:
```typescript
const ranges = [
  { label: "7 Days", value: "7d" },
  { label: "30 Days", value: "30d" },
  // Add custom ranges
]
```

### Adjust Chart Colors
Edit chart components and modify `backgroundColor` and `borderColor` properties.

### Add Custom Metrics
Create new API routes in `app/api/analytics/` and corresponding components.

## 📊 Chart Types Used

1. **Line Chart**: Attendance trends over time
2. **Bar Chart**: Comparative metrics (on-time vs late)
3. **Doughnut Chart**: Distribution breakdowns
4. **Radar Chart**: Multi-dimensional comparisons

## 🔐 Security
- All routes protected with NextAuth session validation
- Tenant isolation (users only see their organization's data)
- Role-based access (admin/manager only)

## 🚀 Performance Optimization
- **Lazy Loading**: Charts load only when tab is active
- **Data Caching**: Consider implementing Redis for large datasets
- **Pagination**: Staff table supports search and filtering
- **Skeleton Loading**: Smooth loading states

## 📱 Mobile Responsive
- **Grid Layout**: Adapts from 1 to 4 columns based on screen size
- **Touch-Friendly**: Large tap targets for mobile users
- **Scrollable Tables**: Horizontal scroll for data tables
- **Collapsible Sections**: Optimize space on small screens

## 🎯 Best Practices

### For Admins
1. **Regular Monitoring**: Check analytics daily for trends
2. **Address Issues Early**: Identify late patterns quickly
3. **Department Comparison**: Use insights for team management
4. **Export Reports**: Download data for presentations

### For Developers
1. **Keep API Routes Efficient**: Use database indexes
2. **Cache Frequently Accessed Data**: Reduce database load
3. **Monitor Performance**: Track query execution times
4. **Update Charts**: Keep Chart.js library updated

## 🐛 Troubleshooting

### Charts Not Displaying
```bash
# Reinstall Chart.js
npm install chart.js react-chartjs-2 --force
```

### No Data Showing
- Check database has attendance records
- Verify date range includes data
- Check console for API errors

### Slow Loading
- Add database indexes on `checkInTime`, `tenantId`
- Implement data caching
- Reduce time range for initial load

## 🔄 Future Enhancements
- [ ] Real-time updates with WebSockets
- [ ] Predictive analytics using ML
- [ ] Custom report builder
- [ ] Email alerts for trends
- [ ] Mobile app integration
- [ ] Advanced filtering options
- [ ] Comparison with industry benchmarks

## 📞 Support
For issues or questions, refer to the main project documentation or create an issue in the repository.

---

**Built with**: Next.js 15, TypeScript, Prisma, Chart.js, Tailwind CSS
