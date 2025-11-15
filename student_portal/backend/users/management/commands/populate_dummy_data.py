from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
import random

User = get_user_model()

class Command(BaseCommand):
    help = 'Populate database with dummy data for Student Portal'

    def handle(self, *args, **options):
        self.stdout.write('🎯 Starting to populate database with dummy data...')
        
        # Check if admin already exists to avoid duplicates
        if User.objects.filter(username='admin').exists():
            self.stdout.write(self.style.WARNING('⚠️ Dummy data already exists! Skipping...'))
            return
        
        try:
            # Import models inside try block to catch import errors
            from courses.models import Course, CourseRegistration, ClassSchedule, Notice
            from library.models import Book, BookLoan, BookReservation
            from results.models import Result
            from events.models import Event, EventRegistration

            # Create Admin User
            admin_user = User.objects.create_superuser(
                username='admin',
                email='admin@university.edu',
                password='admin123',
                user_type='admin',
                first_name='System',
                last_name='Administrator'
            )
            self.stdout.write(self.style.SUCCESS('✅ Created admin user'))

            # Create Faculty Users
            faculty_users = []
            faculty_data = [
                ('Dr. John', 'Smith', 'john.smith@university.edu'),
                ('Dr. Maria', 'Garcia', 'maria.garcia@university.edu'),
                ('Dr. David', 'Johnson', 'david.johnson@university.edu')
            ]
            
            for i, (first_name, last_name, email) in enumerate(faculty_data):
                faculty = User.objects.create_user(
                    username=f'faculty{i+1}',
                    email=email,
                    password='faculty123',
                    user_type='faculty',
                    first_name=first_name,
                    last_name=last_name
                )
                faculty_users.append(faculty)
                self.stdout.write(f'✅ Created faculty: {first_name} {last_name}')

            # Create Student Users
            student_users = []
            departments = ['Computer Science', 'Electrical Engineering', 'Business Administration', 'Mathematics']
            
            for i in range(10):  # Reduced to 10 for simplicity
                first_name = f'Student{i+1}'
                last_name = 'Demo'
                department = random.choice(departments)
                
                student = User.objects.create_user(
                    username=f'student{i+1:03d}',
                    email=f'student{i+1:03d}@university.edu',
                    password='student123',
                    user_type='student',
                    first_name=first_name,
                    last_name=last_name,
                    student_id=f'STU{i+1:05d}'
                )
                student_users.append(student)
            
            self.stdout.write(f'✅ Created {len(student_users)} student users')

            # Create Courses
            courses_data = [
                {'code': 'CS101', 'name': 'Introduction to Programming', 'department': 'Computer Science', 'semester': 1, 'credits': 3},
                {'code': 'CS102', 'name': 'Data Structures', 'department': 'Computer Science', 'semester': 2, 'credits': 4},
                {'code': 'MATH101', 'name': 'Calculus I', 'department': 'Mathematics', 'semester': 1, 'credits': 4},
                {'code': 'EE101', 'name': 'Circuit Analysis', 'department': 'Electrical Engineering', 'semester': 1, 'credits': 3},
                {'code': 'BUS101', 'name': 'Principles of Management', 'department': 'Business Administration', 'semester': 1, 'credits': 3},
            ]
            
            courses = []
            for course_data in courses_data:
                course = Course.objects.create(
                    code=course_data['code'],
                    name=course_data['name'],
                    description=f"This course covers fundamental concepts of {course_data['name']}.",
                    credits=course_data['credits'],
                    department=course_data['department'],
                    semester=course_data['semester'],
                    max_students=25,
                    current_students=0,
                    is_active=True
                )
                courses.append(course)
                self.stdout.write(f'✅ Created course: {course_data["code"]} - {course_data["name"]}')

            # Create Course Registrations
            registration_count = 0
            for student in student_users:
                # Each student takes 3 random courses
                student_courses = random.sample(courses, 3)
                for course in student_courses:
                    CourseRegistration.objects.create(
                        student=student,
                        course=course,
                        status='registered'
                    )
                    course.current_students += 1
                    course.save()
                    registration_count += 1
            
            self.stdout.write(f'✅ Created {registration_count} course registrations')

            # Create Class Schedules
            days = [1, 2, 3, 4, 5]  # Monday to Friday
            time_slots = [
                ('09:00:00', '10:30:00'),
                ('11:00:00', '12:30:00'),
            ]
            
            schedule_count = 0
            for course in courses:
                # Each course has 2 class sessions per week
                for _ in range(2):
                    day = random.choice(days)
                    start_time, end_time = random.choice(time_slots)
                    
                    ClassSchedule.objects.create(
                        course=course,
                        day_of_week=day,
                        start_time=start_time,
                        end_time=end_time,
                        room=f'Room {random.randint(100, 300)}',
                        instructor=random.choice(faculty_users)
                    )
                    schedule_count += 1
            
            self.stdout.write(f'✅ Created {schedule_count} class schedules')

            # Create Notices
            notice_titles = [
                'Midterm Examination Schedule',
                'Library Holiday Hours',
                'Scholarship Application Deadline',
                'Workshop on Career Development',
            ]
            
            for title in notice_titles:
                Notice.objects.create(
                    title=title,
                    content=f'Detailed information about {title}. Please check the notice board for more details.',
                    created_by=admin_user,
                    target_audience=random.choice(['all', 'students']),
                    is_important=random.choice([True, False])
                )
            
            self.stdout.write(f'✅ Created {len(notice_titles)} notices')

            # Create Books
            books_data = [
                {'isbn': '9780131103627', 'title': 'The C Programming Language', 'author': 'Brian Kernighan, Dennis Ritchie', 'category': 'Programming'},
                {'isbn': '9780262033848', 'title': 'Introduction to Algorithms', 'author': 'Thomas H. Cormen', 'category': 'Algorithms'},
                {'isbn': '9780321573513', 'title': 'Data Structures and Algorithm Analysis', 'author': 'Mark Allen Weiss', 'category': 'Data Structures'},
            ]
            
            books = []
            for book_data in books_data:
                book = Book.objects.create(
                    isbn=book_data['isbn'],
                    title=book_data['title'],
                    author=book_data['author'],
                    publisher='Pearson Education',
                    publication_year=random.randint(2010, 2020),
                    category=book_data['category'],
                    total_copies=3,
                    available_copies=3,
                    location=f'Shelf {random.randint(1, 5)}',
                    description=f'Comprehensive guide to {book_data["title"]}'
                )
                books.append(book)
                self.stdout.write(f'✅ Added book: {book_data["title"]}')

            # Create Book Loans
            loan_count = 0
            for student in random.sample(student_users, 5):  # 5 random students borrow books
                book = random.choice(books)
                if book.available_copies > 0:
                    BookLoan.objects.create(
                        book=book,
                        student=student,
                        due_date=timezone.now().date() + timedelta(days=14)
                    )
                    book.available_copies -= 1
                    book.save()
                    loan_count += 1
            
            self.stdout.write(f'✅ Created {loan_count} book loans')

            # Create Events
            event_data = [
                {
                    'title': 'Annual Tech Fest 2024',
                    'type': 'cultural',
                    'description': 'Join us for the biggest technology festival of the year!',
                },
                {
                    'title': 'Career Guidance Workshop', 
                    'type': 'workshop',
                    'description': 'Learn how to prepare for job interviews and build your career.',
                },
            ]
            
            event_count = 0
            for i, event_info in enumerate(event_data):
                start_date = timezone.now() + timedelta(days=i*7)
                end_date = start_date + timedelta(hours=3)
                
                event = Event.objects.create(
                    title=event_info['title'],
                    description=event_info['description'],
                    event_type=event_info['type'],
                    start_date=start_date,
                    end_date=end_date,
                    location='University Campus',
                    organizer=admin_user,
                    max_participants=50,
                    current_participants=0
                )
                
                # Register random students for events
                event_students = random.sample(student_users, random.randint(3, 8))
                for student in event_students:
                    EventRegistration.objects.create(
                        student=student,
                        event=event
                    )
                    event.current_participants += 1
                
                event.save()
                event_count += 1
                self.stdout.write(f'✅ Created event: {event_info["title"]}')

            # Create Results
            grades = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C']
            result_count = 0
            
            for student in student_users:
                student_courses = CourseRegistration.objects.filter(
                    student=student, 
                    status='registered'
                ).values_list('course', flat=True)
                
                for course_id in student_courses:
                    course = Course.objects.get(id=course_id)
                    Result.objects.create(
                        student=student,
                        course=course,
                        semester=course.semester,
                        year=2024,
                        marks=round(random.uniform(65, 95), 2),
                        grade=random.choice(grades)
                    )
                    result_count += 1
            
            self.stdout.write(f'✅ Created {result_count} student results')

            self.stdout.write(self.style.SUCCESS('\n🎉 SUCCESS! Database populated with dummy data!'))
            self.stdout.write('\n📋 LOGIN CREDENTIALS:')
            self.stdout.write('   👨‍💼 Admin:     username=admin, password=admin123')
            self.stdout.write('   👨‍🏫 Faculty:   username=faculty1, password=faculty123') 
            self.stdout.write('   🎓 Student:   username=student001, password=student123')
            
            self.stdout.write('\n📊 DATA SUMMARY:')
            self.stdout.write(f'   • Users: {User.objects.count()} total')
            self.stdout.write(f'   • Courses: {Course.objects.count()}')
            self.stdout.write(f'   • Books: {Book.objects.count()}')
            self.stdout.write(f'   • Events: {Event.objects.count()}')
            self.stdout.write(f'   • Results: {Result.objects.count()}')
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'❌ Error: {str(e)}'))
            import traceback
            traceback.print_exc()