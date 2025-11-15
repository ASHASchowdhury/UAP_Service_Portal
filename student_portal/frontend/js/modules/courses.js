class CoursesModule {
    static async loadCourses() {
        try {
            console.log('Loading courses data...');
            
            const [availableCourses, registeredCourses] = await Promise.all([
                api.getCourses().catch(() => []),
                api.getRegisteredCourses().catch(() => [])
            ]);

            this.renderAvailableCourses(availableCourses, registeredCourses);
            this.renderRegisteredCourses(registeredCourses);
            this.setupSearch();
            
        } catch (error) {
            console.error('Failed to load courses:', error);
            const container = document.getElementById('available-courses');
            if (container) {
                container.innerHTML = '<div class="error-message">Failed to load courses</div>';
            }
        }
    }

    static renderAvailableCourses(courses, registeredCourses) {
        const container = document.getElementById('available-courses');
        if (!container) return;
        
        if (!courses || courses.length === 0) {
            container.innerHTML = '<div class="loading">No courses available for registration</div>';
            return;
        }

        const registeredCourseIds = new Set(registeredCourses.map(rc => rc.course || rc.course_id));

        container.innerHTML = courses.map(course => {
            const isRegistered = registeredCourseIds.has(course.id);
            const isFull = course.current_students >= course.max_students;
            const canRegister = !isRegistered && !isFull;

            return `
                <div class="course-item">
                    <div class="course-header">
                        <span class="course-code">${course.code || 'N/A'}</span>
                        <span class="course-credits">${course.credits || 0} CR</span>
                    </div>
                    <div class="course-name">${course.name || 'Unnamed Course'}</div>
                    <div class="course-description">${course.description || 'No description available'}</div>
                    <div class="course-meta">
                        <span>${course.department || 'General'} • Semester ${course.semester || 'N/A'}</span>
                        <span>${course.current_students || 0}/${course.max_students || 0} students</span>
                    </div>
                    <div class="course-actions">
                        ${isRegistered ? 
                            `<button class="btn btn-error btn-sm" onclick="CoursesModule.dropCourse(${course.id})">
                                <i class="fas fa-times"></i> Drop Course
                            </button>` :
                            canRegister ?
                            `<button class="btn btn-success btn-sm" onclick="CoursesModule.registerCourse(${course.id})">
                                <i class="fas fa-plus"></i> Register
                            </button>` :
                            `<button class="btn btn-secondary btn-sm" disabled>
                                <i class="fas fa-ban"></i> ${isFull ? 'Course Full' : 'Not Available'}
                            </button>`
                        }
                    </div>
                </div>
            `;
        }).join('');
    }

    static renderRegisteredCourses(registeredCourses) {
        const container = document.getElementById('registered-courses-list');
        const totalCredits = document.getElementById('total-credits');
        
        if (!registeredCourses || registeredCourses.length === 0) {
            if (container) container.innerHTML = '<div class="loading">No courses registered yet</div>';
            if (totalCredits) totalCredits.textContent = 'Total Credits: 0';
            return;
        }

        const totalCreditsCount = registeredCourses.reduce((sum, rc) => {
            return sum + (rc.course_details?.credits || rc.credits || 0);
        }, 0);

        if (totalCredits) {
            totalCredits.textContent = `Total Credits: ${totalCreditsCount}`;
        }

        if (container) {
            container.innerHTML = registeredCourses.map(registration => {
                const course = registration.course_details || registration;
                return `
                    <div class="course-item">
                        <div class="course-header">
                            <span class="course-code">${course.code || 'N/A'}</span>
                            <span class="course-credits">${course.credits || 0} CR</span>
                        </div>
                        <div class="course-name">${course.name || 'Unnamed Course'}</div>
                        <div class="course-description">${course.description || 'No description available'}</div>
                        <div class="course-meta">
                            <span>${course.department || 'General'} • Semester ${course.semester || 'N/A'}</span>
                            <span class="status-badge status-${registration.status || 'registered'}">
                                ${registration.status || 'registered'}
                            </span>
                        </div>
                        <div class="course-actions">
                            <button class="btn btn-error btn-sm" onclick="CoursesModule.dropCourse(${course.id})">
                                <i class="fas fa-times"></i> Drop Course
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }

    static async registerCourse(courseId) {
        if (!confirm('Are you sure you want to register for this course?')) return;
        
        try {
            const result = await api.registerCourse(courseId);
            alert(result.detail || 'Course registered successfully!');
            this.loadCourses();
        } catch (error) {
            console.error('Failed to register course:', error);
            alert(error.detail || 'Failed to register course');
        }
    }

    static async dropCourse(courseId) {
        if (!confirm('Are you sure you want to drop this course?')) return;
        
        try {
            const result = await api.dropCourse(courseId);
            alert(result.detail || 'Course dropped successfully!');
            this.loadCourses();
        } catch (error) {
            console.error('Failed to drop course:', error);
            alert(error.detail || 'Failed to drop course');
        }
    }

    static setupSearch() {
        const searchInput = document.getElementById('course-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();
                const courseItems = document.querySelectorAll('#available-courses .course-item');
                
                courseItems.forEach(item => {
                    const text = item.textContent.toLowerCase();
                    item.style.display = text.includes(searchTerm) ? 'block' : 'none';
                });
            });
        }
    }
}
window.CoursesModule = CoursesModule;