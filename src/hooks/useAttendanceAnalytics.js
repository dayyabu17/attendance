import { useMemo } from 'react';
import { timeToMinutes, formatMinutesToTimeString, formatMonthOption } from '../utils/helpers';

export function useAttendanceAnalytics(rawData, selectedPerson, selectedMonth, selectedWeek) {
  return useMemo(() => {
    if (rawData.length === 0) return null;

    const LATE_THRESHOLD_MINUTES = 9 * 60 + 30; // 9:30 AM
    const OVERTIME_THRESHOLD_MINUTES = 17 * 60 + 30; // 5:30 PM
    
    const filteredData = rawData.filter(record => {
      const monthStr = record.Date.substring(0, 7);
      const matchPerson = selectedPerson === 'All' || record.Name === selectedPerson;
      const matchMonth = selectedMonth === 'All' || monthStr === selectedMonth;
      const matchWeek = selectedWeek === 'All' || record.WeekStart === selectedWeek;
      return matchPerson && matchMonth && matchWeek;
    });

    let totalLoginMinutes = 0;
    let loginCount = 0;
    let totalLogoutMinutes = 0;
    let logoutCount = 0;

    let onTimeCount = 0;
    let lateCount = 0;

    const monthlyAttendances = {}; 
    const personStats = {}; 
    
    const dailyTrendData = {
      1: { name: 'Mon', totalMins: 0, count: 0 },
      2: { name: 'Tue', totalMins: 0, count: 0 },
      3: { name: 'Wed', totalMins: 0, count: 0 },
      4: { name: 'Thu', totalMins: 0, count: 0 },
      5: { name: 'Fri', totalMins: 0, count: 0 },
    };

    const tableDetails = [];

    filteredData.forEach(record => {
      const monthStr = record.Date.substring(0, 7);
      if (!monthlyAttendances[monthStr]) monthlyAttendances[monthStr] = 0;
      monthlyAttendances[monthStr]++;

      const inMins = timeToMinutes(record.InTime);
      const outMins = timeToMinutes(record.OutTime);
      
      let isLate = false;
      let overtimeMins = 0;

      if (!personStats[record.Name]) {
        personStats[record.Name] = { onTime: 0, late: 0, overtimeMins: 0, totalPunches: 0 };
      }

      if (inMins !== null) {
        totalLoginMinutes += inMins;
        loginCount++;
        isLate = inMins > LATE_THRESHOLD_MINUTES;
        
        if (isLate) {
          lateCount++;
          personStats[record.Name].late++;
        } else {
          onTimeCount++;
          personStats[record.Name].onTime++;
        }
        personStats[record.Name].totalPunches++;

        const d = new Date(record.Date);
        const dayOfWeek = d.getDay();
        if (dailyTrendData[dayOfWeek]) {
          dailyTrendData[dayOfWeek].totalMins += inMins;
          dailyTrendData[dayOfWeek].count++;
        }
      }

      if (outMins !== null) {
        totalLogoutMinutes += outMins;
        logoutCount++;
        if (outMins > OVERTIME_THRESHOLD_MINUTES) {
          overtimeMins = outMins - OVERTIME_THRESHOLD_MINUTES;
          personStats[record.Name].overtimeMins += overtimeMins;
        }
      }

      tableDetails.push({
        date: record.Date,
        name: record.Name,
        inStr: record.InTime ? record.InTime.trim() : '-',
        outStr: record.OutTime ? record.OutTime.trim() : '-',
        isLate,
        overtimeMins
      });
    });

    tableDetails.sort((a, b) => b.date.localeCompare(a.date) || a.name.localeCompare(b.name));

    const averageLoginTime = loginCount > 0 
      ? formatMinutesToTimeString(Math.round(totalLoginMinutes / loginCount)) : "N/A";
    const averageLogoutTime = logoutCount > 0 
      ? formatMinutesToTimeString(Math.round(totalLogoutMinutes / logoutCount)) : "N/A";

    const punctualityData = [
      { name: 'On Time', value: onTimeCount },
      { name: 'Late', value: lateCount }
    ];

    const trendChartData = [1, 2, 3, 4, 5].map(day => {
      const td = dailyTrendData[day];
      const avgMins = td.count > 0 ? Math.round(td.totalMins / td.count) : null;
      const decimalHours = avgMins !== null ? +(avgMins / 60).toFixed(2) : null;
      return {
        day: td.name,
        avgTime: decimalHours,
        tooltipStr: avgMins !== null ? formatMinutesToTimeString(avgMins) : 'N/A'
      };
    });

    let mostPunctual = { name: 'None', ratio: 0, count: 0 };
    let mostOvertime = { name: 'None', hours: 0 };

    Object.entries(personStats).forEach(([name, stats]) => {
      const ratio = stats.totalPunches > 0 ? (stats.onTime / stats.totalPunches) : 0;
      if (ratio > mostPunctual.ratio || (ratio === mostPunctual.ratio && stats.onTime > mostPunctual.count)) {
        mostPunctual = { name, ratio, count: stats.onTime };
      }

      const otHours = stats.overtimeMins / 60;
      if (otHours > mostOvertime.hours) {
        mostOvertime = { name, hours: otHours };
      }
    });

    const chartData = Object.entries(monthlyAttendances)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([ym, count]) => ({
        month: formatMonthOption(ym),
        attendances: count
      }));

    return {
      averageLoginTime,
      averageLogoutTime,
      punctualityData,
      trendChartData,
      mostPunctual,
      mostOvertime,
      chartData,
      tableDetails,
      totalRecords: filteredData.length,
      totalLogins: loginCount
    };
  }, [rawData, selectedPerson, selectedMonth, selectedWeek]);
}
