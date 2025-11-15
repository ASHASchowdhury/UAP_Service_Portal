class ScheduleModule {
    static async loadSchedule() {
        try {
            console.log('Loading schedule data...');
            const schedule = await api.getSchedule().catch(() => []);
            this.renderSchedule(schedule);
        } catch (error) {
            console.error('Failed to load schedule:', error);
        }
    }

    static renderSchedule(schedule) {
        const container = document.getElementById('schedule-content');
        if (!container) return;
        
        if (!schedule || schedule.length === 0) {
            container.innerHTML = '<div class="loading">No schedule available</div>';
            return;
        }

        // Group by day
        const scheduleByDay = this.groupScheduleByDay(schedule);
        
        container.innerHTML = `
            <div class="schedule-grid">
                ${this.renderDay('Monday', scheduleByDay[1] || scheduleByDay['Monday'])}
                ${this.renderDay('Tuesday', scheduleByDay[2] || scheduleByDay['Tuesday'])}
                ${this.renderDay('Wednesday', scheduleByDay[3] || scheduleByDay['Wednesday'])}
                ${this.renderDay('Thursday', scheduleByDay[4] || scheduleByDay['Thursday'])}
                ${this.renderDay('Friday', scheduleByDay[5] || scheduleByDay['Friday'])}
                ${this.renderDay('Saturday', scheduleByDay[6] || scheduleByDay['Saturday'])}
                ${this.renderDay('Sunday', scheduleByDay[7] || scheduleByDay['Sunday'] || scheduleByDay[0])}
            </div>
        `;
    }

    static groupScheduleByDay(schedule) {
        return schedule.reduce((groups, item) => {
            const day = item.day_of_week;
            if (!groups[day]) groups[day] = [];
            groups[day].push(item);
            return groups;
        }, {});
    }

    static renderDay(dayName, daySchedule) {
        if (!daySchedule || daySchedule.length === 0) {
            return `
                <div class="schedule-day">
                    <div class="day-header">${dayName}</div>
                    <div class="day-content">
                        <div class="no-classes">No classes</div>
                    </div>
                </div>
            `;
        }

        // Sort by time
        daySchedule.sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));

        return `
            <div class="schedule-day">
                <div class="day-header">${dayName}</div>
                <div class="day-content">
                    ${daySchedule.map(item => `
                        <div class="schedule-item">
                            <div class="course-time">
                                ${this.formatTime(item.start_time)} - ${this.formatTime(item.end_time)}
                            </div>
                            <div class="course-info">
                                <strong>${item.course_name || item.course_details?.name || 'Unnamed Course'}</strong>
                                <div>${item.room || 'Room TBA'}</div>
                                <div class="instructor">${item.instructor_name || item.instructor || 'Staff'}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    static formatTime(timeString) {
        if (!timeString) return 'TBA';
        try {
            const [hours, minutes] = timeString.split(':');
            const hour = parseInt(hours);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const displayHour = hour % 12 || 12;
            return `${displayHour}:${minutes} ${ampm}`;
        } catch (error) {
            return timeString;
        }
    }
}
window.ScheduleModule = ScheduleModule;