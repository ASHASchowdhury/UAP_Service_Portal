class ResultsModule {
    static async loadResults() {
        try {
            console.log('Loading results data...');
            const results = await api.getResults().catch(() => []);
            this.renderResults(results);
            this.setupEventListeners();
        } catch (error) {
            console.error('Failed to load results:', error);
        }
    }

    static renderResults(results) {
        const tbody = document.getElementById('results-tbody');
        if (!tbody) return;
        
        if (!results || results.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">No results available yet</td></tr>';
            return;
        }

        // Group by semester
        const resultsBySemester = this.groupResultsBySemester(results);
        const semesterSelect = document.getElementById('semester-select');
        const selectedSemester = parseInt(semesterSelect?.value) || 1;
        const semesterResults = resultsBySemester[selectedSemester] || [];

        if (semesterResults.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align: center;">No results for semester ${selectedSemester}</td></tr>`;
            return;
        }

        tbody.innerHTML = semesterResults.map(result => {
            const course = result.course_details || result;
            return `
                <tr>
                    <td>
                        <strong>${course.code || 'N/A'}</strong><br>
                        <small>${course.name || 'Unnamed Course'}</small>
                    </td>
                    <td>
                        <span class="grade-badge grade-${result.grade || 'N/A'}">${result.grade || 'N/A'}</span>
                    </td>
                    <td>${result.marks ? result.marks.toFixed(2) + '%' : 'N/A'}</td>
                    <td>${course.credits || result.credits || 'N/A'}</td>
                </tr>
            `;
        }).join('');

        this.addSemesterSummary(semesterResults);
    }

    static groupResultsBySemester(results) {
        return results.reduce((groups, result) => {
            const semester = result.semester || result.course_details?.semester || 1;
            if (!groups[semester]) groups[semester] = [];
            groups[semester].push(result);
            return groups;
        }, {});
    }

    static addSemesterSummary(results) {
        const tbody = document.getElementById('results-tbody');
        const totalCredits = results.reduce((sum, result) => {
            return sum + (result.course_details?.credits || result.credits || 0);
        }, 0);
        
        const sgpa = this.calculateSGPA(results);
        
        tbody.innerHTML += `
            <tr style="background-color: #f8fafc; font-weight: 600;">
                <td colspan="3" style="text-align: right;">Semester GPA:</td>
                <td>${sgpa.toFixed(2)}</td>
            </tr>
            <tr style="background-color: #f8fafc; font-weight: 600;">
                <td colspan="3" style="text-align: right;">Total Credits:</td>
                <td>${totalCredits}</td>
            </tr>
        `;
    }

    static calculateSGPA(results) {
        if (!results || results.length === 0) return 0.00;
        
        const validResults = results.filter(result => result.grade && result.grade !== 'F');
        if (validResults.length === 0) return 0.00;

        const totalGradePoints = validResults.reduce((sum, result) => {
            const credits = result.course_details?.credits || result.credits || 0;
            const gradePoints = this.gradeToPoints(result.grade);
            return sum + (gradePoints * credits);
        }, 0);

        const totalCredits = validResults.reduce((sum, result) => {
            return sum + (result.course_details?.credits || result.credits || 0);
        }, 0);

        return totalCredits > 0 ? totalGradePoints / totalCredits : 0.00;
    }

    static gradeToPoints(grade) {
        const gradeMap = {
            'A+': 4.0, 'A': 4.0, 'A-': 3.7,
            'B+': 3.3, 'B': 3.0, 'B-': 2.7,
            'C+': 2.3, 'C': 2.0, 'D': 1.0,
            'F': 0.0
        };
        return gradeMap[grade] || 0.0;
    }

    static setupEventListeners() {
        const semesterSelect = document.getElementById('semester-select');
        if (semesterSelect) {
            semesterSelect.addEventListener('change', () => {
                this.loadResults();
            });
        }
    }
}
window.ResultsModule = ResultsModule;