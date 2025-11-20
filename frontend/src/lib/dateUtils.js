export const getWeekStart = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const weekStart = new Date(d.setDate(diff));
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
};

export const getWeekEnd = (weekStart) => {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  return weekEnd;
};

export const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-AU', { year: 'numeric', month: 'short', day: 'numeric' });
};

export const formatWeekRange = (weekStart) => {
  const start = new Date(weekStart);
  const end = getWeekEnd(start);
  return `${formatDate(start)} - ${formatDate(end)}`;
};

export const getWeekNumber = (date) => {
  const d = new Date(date);
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return weekNo;
};

export const groupByWeek = (entries) => {
  const weeks = {};
  entries.forEach(entry => {
    const weekStart = getWeekStart(entry.date).toISOString().split('T')[0];
    if (!weeks[weekStart]) {
      weeks[weekStart] = [];
    }
    weeks[weekStart].push(entry);
  });
  return weeks;
};

export const groupByMonth = (items) => {
  const months = {};
  items.forEach(item => {
    const date = new Date(item.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!months[monthKey]) {
      months[monthKey] = [];
    }
    months[monthKey].push(item);
  });
  return months;
};

export const getMonthName = (monthKey) => {
  const [year, month] = monthKey.split('-');
  const date = new Date(year, parseInt(month) - 1);
  return date.toLocaleDateString('en-AU', { year: 'numeric', month: 'long' });
};

export const getCurrentYearId = (years) => {
  const currentYear = new Date().getFullYear().toString();
  const year = years.find(y => y.year === currentYear);
  return year ? year.id : null;
};
