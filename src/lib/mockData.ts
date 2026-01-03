import { Complaint, processComplaint } from './grievanceAI';

// Sample complaints for demonstration
const sampleComplaintsData = [
  {
    text: "There is a huge pothole on Main Street near the hospital. Ambulances are having difficulty passing. This is an emergency situation that has been going on for 5 days now.",
    location: "Ward 12, Main Street"
  },
  {
    text: "Garbage has not been collected for 2 weeks in our colony. The entire area is stinking and children are falling sick. Please help!",
    location: "Sector 15, Green Colony"
  },
  {
    text: "No water supply since 3 days. Entire building with 50 families is suffering. We are desperate for help.",
    location: "Block C, Sunrise Apartments"
  },
  {
    text: "Street light not working in our lane for past week. Women feel unsafe walking at night. Please fix urgently.",
    location: "Ward 8, Rose Garden Lane"
  },
  {
    text: "Power outage in entire sector for 6 hours. Medical equipment in nearby clinic not working. Critical situation!",
    location: "Sector 22"
  },
  {
    text: "Drainage overflow on school road. Children have to walk through dirty water. Health hazard!",
    location: "Ward 5, School Road"
  },
  {
    text: "Requesting repair of footpath which is broken and causing falls, especially for elderly citizens.",
    location: "Ward 3, Market Area"
  },
  {
    text: "Illegal construction happening next to our building. Noise and dust pollution affecting residents.",
    location: "Sector 10, Block A"
  },
  {
    text: "Bus stop shelter collapsed after storm. Passengers have no shade from sun and rain.",
    location: "Ward 7, Central Bus Stand"
  },
  {
    text: "Open drain near primary school is overflowing. Mosquito breeding causing dengue cases in area.",
    location: "Ward 14, Education Hub"
  },
];

// Generate mock complaints with processed AI data
export function generateMockComplaints(): Complaint[] {
  const complaints: Complaint[] = [];
  
  sampleComplaintsData.forEach((data, index) => {
    const complaint = processComplaint(data.text, data.location);
    
    // Add some variation to submission times
    const hoursAgo = Math.floor(Math.random() * 72);
    complaint.submittedAt = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
    
    // Vary some statuses
    const statuses: Complaint['status'][] = ['received', 'assigned', 'in-progress', 'resolved'];
    complaint.status = statuses[Math.floor(Math.random() * statuses.length)];
    
    if (complaint.status === 'resolved') {
      complaint.resolvedAt = new Date(complaint.submittedAt.getTime() + Math.random() * 48 * 60 * 60 * 1000);
    }
    
    // Assign cluster IDs to related complaints
    complaint.clusterId = `cluster-${complaint.category}-${complaint.location.split(',')[0].trim().toLowerCase().replace(/\s+/g, '-')}`;
    
    complaints.push(complaint);
  });
  
  return complaints;
}

// Statistics for dashboard
export function calculateStats(complaints: Complaint[]) {
  const total = complaints.length;
  const resolved = complaints.filter(c => c.status === 'resolved').length;
  const pending = total - resolved;
  const critical = complaints.filter(c => c.priority === 'critical' && c.status !== 'resolved').length;
  const high = complaints.filter(c => c.priority === 'high' && c.status !== 'resolved').length;
  
  // Average resolution time (mock)
  const resolvedComplaints = complaints.filter(c => c.resolvedAt);
  const avgResolutionTime = resolvedComplaints.length > 0
    ? resolvedComplaints.reduce((sum, c) => {
        const time = (c.resolvedAt!.getTime() - c.submittedAt.getTime()) / (1000 * 60 * 60);
        return sum + time;
      }, 0) / resolvedComplaints.length
    : 0;
  
  // Category breakdown
  const categoryBreakdown: Record<string, number> = {};
  complaints.forEach(c => {
    categoryBreakdown[c.category] = (categoryBreakdown[c.category] || 0) + 1;
  });
  
  // Department performance (mock SLA compliance)
  const departmentPerformance: Record<string, { total: number; resolved: number; avgTime: number }> = {};
  complaints.forEach(c => {
    if (!departmentPerformance[c.department]) {
      departmentPerformance[c.department] = { total: 0, resolved: 0, avgTime: 0 };
    }
    departmentPerformance[c.department].total++;
    if (c.status === 'resolved') {
      departmentPerformance[c.department].resolved++;
    }
  });
  
  return {
    total,
    resolved,
    pending,
    critical,
    high,
    avgResolutionTime: Math.round(avgResolutionTime * 10) / 10,
    resolutionRate: total > 0 ? Math.round((resolved / total) * 100) : 0,
    categoryBreakdown,
    departmentPerformance,
  };
}

// Locations for dropdown
export const LOCATIONS = [
  "Ward 1, City Center",
  "Ward 2, Industrial Area",
  "Ward 3, Market Area",
  "Ward 4, Residential Zone A",
  "Ward 5, School Road",
  "Ward 6, Hospital Area",
  "Ward 7, Central Bus Stand",
  "Ward 8, Rose Garden Lane",
  "Ward 9, Tech Park",
  "Ward 10, Government Complex",
  "Ward 11, Sports Stadium Area",
  "Ward 12, Main Street",
  "Ward 13, Railway Station",
  "Ward 14, Education Hub",
  "Ward 15, Commercial District",
  "Sector 10, Block A",
  "Sector 15, Green Colony",
  "Sector 22",
  "Block C, Sunrise Apartments",
];
