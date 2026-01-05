// Application state
const state = {
    currentUser: null,
    internships: [],
    postedInternships: [],
    applications: [],
    currentFilter: 'All',
    isSearching: false
};

// Career field keywords for better matching
const CAREER_FIELD_KEYWORDS = {
    'Engineering': ['engineering', 'software', 'developer', 'programming', 'code', 'computer', 'tech', 'technology'],
    'Medicine': ['medicine', 'medical', 'healthcare', 'hospital', 'doctor', 'nurse', 'pharmacy', 'clinical'],
    'Business': ['business', 'management', 'marketing', 'sales', 'administration', 'entrepreneur', 'startup'],
    'Science': ['science', 'research', 'laboratory', 'biology', 'chemistry', 'physics', 'scientific'],
    'Art': ['art', 'design', 'creative', 'painting', 'drawing', 'illustration', 'graphic'],
    'Education': ['education', 'teaching', 'teacher', 'school', 'university', 'learning']
};

// DOM elements
const elements = {
    messageModal: document.getElementById('message-modal'),
    modalTitle: document.getElementById('modal-title'),
    modalMessage: document.getElementById('modal-message'),
    modalClose: document.getElementById('modal-close'),
    chatbotToggle: document.getElementById('chatbot-toggle'),
    chatbotChat: document.getElementById('chatbot-chat'),
    chatbotClose: document.getElementById('chatbot-close'),
    chatbotMessages: document.getElementById('chatbot-messages'),
    chatbotInput: document.getElementById('chatbot-input'),
    sendBtn: document.getElementById('send-btn'),
    fileUploadBtn: document.getElementById('file-upload-btn'),
    resumeUpload: document.getElementById('resume-upload'),
    loginNav: document.getElementById('login-nav'),
    signupNav: document.getElementById('signup-nav'),
    logoutBtn: document.getElementById('logout-btn'),
    recruiterDashboardNav: document.getElementById('recruiter-dashboard-nav'),
    loadingSpinner: document.getElementById('loading-spinner'),
    internshipList: document.getElementById('internship-list'),
    postedInternshipsList: document.getElementById('posted-internships-list')
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    checkAuthState();
});

// Initialize the application
function initializeApp() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        try {
            state.currentUser = JSON.parse(savedUser);
            updateNavigation();
            
            // Load user's data
            const savedInternships = localStorage.getItem(`userInternships_${state.currentUser.email}`);
            if (savedInternships) {
                state.internships = JSON.parse(savedInternships);
            }
            
            // Load recruiter data if applicable
            if (state.currentUser.userType === 'recruiter') {
                const savedPostedInternships = localStorage.getItem(`postedInternships_${state.currentUser.email}`);
                if (savedPostedInternships) {
                    state.postedInternships = JSON.parse(savedPostedInternships);
                }
                
                const savedApplications = localStorage.getItem(`applications_${state.currentUser.email}`);
                if (savedApplications) {
                    state.applications = JSON.parse(savedApplications);
                }
            }
        } catch (e) {
            console.error("Error parsing user data", e);
            localStorage.removeItem('currentUser');
        }
    }
}

// Set up event listeners
function setupEventListeners() {
    // Modal close button
    elements.modalClose.addEventListener('click', hideModal);
    
    // Chatbot
    elements.chatbotToggle.addEventListener('click', toggleChatbot);
    elements.chatbotClose.addEventListener('click', toggleChatbot);
    elements.sendBtn.addEventListener('click', sendChatMessage);
    elements.chatbotInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') sendChatMessage();
    });
    
    // File upload for chatbot
    elements.fileUploadBtn.addEventListener('click', function() {
        elements.resumeUpload.click();
    });
    elements.resumeUpload.addEventListener('change', handleResumeUpload);
    
    // Form submissions
    document.getElementById('signup-form')?.addEventListener('submit', handleSignup);
    document.getElementById('login-form')?.addEventListener('submit', handleLogin);
    document.getElementById('profile-form')?.addEventListener('submit', handleProfileUpdate);
    document.getElementById('post-internship-form')?.addEventListener('submit', handlePostInternship);
    
    // User type selection
    document.getElementById('student-btn')?.addEventListener('click', function() {
        setUserType('student');
    });
    document.getElementById('recruiter-btn')?.addEventListener('click', function() {
        setUserType('recruiter');
    });

    // Close modal when clicking outside
    elements.messageModal.addEventListener('click', function(e) {
        if (e.target === elements.messageModal) hideModal();
    });
}

// User type selection
function setUserType(type) {
    const studentBtn = document.getElementById('student-btn');
    const recruiterBtn = document.getElementById('recruiter-btn');
    const studentFields = document.getElementById('student-fields');
    const recruiterFields = document.getElementById('recruiter-fields');
    const userTypeInput = document.getElementById('user-type');
    
    if (type === 'student') {
        studentBtn.classList.add('active', 'bg-blue-500', 'text-white');
        studentBtn.classList.remove('text-gray-700');
        recruiterBtn.classList.remove('active', 'bg-blue-500', 'text-white');
        recruiterBtn.classList.add('text-gray-700');
        studentFields.classList.remove('hidden');
        recruiterFields.classList.add('hidden');
        userTypeInput.value = 'student';
    } else {
        recruiterBtn.classList.add('active', 'bg-blue-500', 'text-white');
        recruiterBtn.classList.remove('text-gray-700');
        studentBtn.classList.remove('active', 'bg-blue-500', 'text-white');
        studentBtn.classList.add('text-gray-700');
        recruiterFields.classList.remove('hidden');
        studentFields.classList.add('hidden');
        userTypeInput.value = 'recruiter';
    }
}

// Navigation functions
function navigateTo(pageId, userType = null) {
    document.querySelectorAll('.page-section').forEach(page => {
        page.classList.remove('active');
    });
    
    document.getElementById(pageId).classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    if (userType) {
        setUserType(userType);
    }
    
    if (pageId === 'dashboard-page') {
        loadInternships();
    } else if (pageId === 'recruiter-dashboard-page') {
        loadPostedInternships();
    } else if (pageId === 'profile-page' && state.currentUser) {
        populateProfileForm();
    }
}

function checkAuthAndNavigate(pageId) {
    if (state.currentUser) {
        // Check if user has access to the requested page
        if (pageId === 'recruiter-dashboard-page' && state.currentUser.userType !== 'recruiter') {
            showModal('Access Denied', 'This page is only available for recruiters.');
            return;
        }
        if (pageId === 'dashboard-page' && state.currentUser.userType !== 'student') {
            showModal('Access Denied', 'This page is only available for students.');
            return;
        }
        navigateTo(pageId);
    } else {
        showModal('Authentication Required', 'Please log in to access this page.');
        navigateTo('login-page');
    }
}

// Authentication functions
function generateToken() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

async function handleSignup(e) {
    e.preventDefault();
    
    const userType = document.getElementById('user-type').value;
    const userData = {
        name: document.getElementById('signup-name').value,
        phone: document.getElementById('signup-phone').value,
        email: document.getElementById('signup-email').value,
        password: document.getElementById('signup-password').value,
        userType: userType
    };
    
    if (userType === 'student') {
        userData.skills = document.getElementById('signup-skills').value.split(',').map(skill => skill.trim());
    } else {
        userData.company = document.getElementById('signup-company').value;
    }
    
    // MOCK API CALL for Signup
    try {
        await new Promise(r => setTimeout(r, 500));

        state.currentUser = { ...userData, token: generateToken() };
        localStorage.setItem('currentUser', JSON.stringify(state.currentUser));
        updateNavigation();
        
        if (userType === 'student') {
            showModal('Account Created', 'Your student account has been created! We are searching for internships matching your skills...');
            navigateTo('dashboard-page');
            autoSearchJobs();
        } else {
            showModal('Account Created', 'Your recruiter account has been created! You can now post internships.');
            navigateTo('recruiter-dashboard-page');
        }
    } catch (error) {
        console.error('MOCK Signup Error:', error);
        showModal('Error', 'Unable to complete signup. Please try again.');
    }
}

async function handleLogin(e) {
    e.preventDefault();
    
    const loginData = {
        email: document.getElementById('login-email').value,
        password: document.getElementById('login-password').value
    };
    
    // MOCK API CALL for Login
    try {
        await new Promise(r => setTimeout(r, 500));

        // MOCK VALIDATION - In real app, this would be API call
        if (loginData.email === "student@test.com" && loginData.password === "password") {
            state.currentUser = {
                name: "Test Student",
                phone: "123-456-7890",
                email: loginData.email,
                skills: ["Communication", "Teamwork", "Basic Computer Skills"],
                userType: "student",
                token: generateToken()
            };
            handleSuccessfulLogin();
        } else if (loginData.email === "recruiter@test.com" && loginData.password === "password") {
            state.currentUser = {
                name: "Test Recruiter",
                phone: "123-456-7890",
                email: loginData.email,
                company: "Tech Company Inc",
                userType: "recruiter",
                token: generateToken()
            };
            handleSuccessfulLogin();
        } else {
            showModal('Login Failed', "Invalid email or password. Try 'student@test.com' or 'recruiter@test.com' with password 'password'");
        }
    } catch (error) {
        console.error('MOCK Login Error:', error);
        showModal('Error', 'Unable to complete login. Please try again.');
    }
}

function handleSuccessfulLogin() {
    localStorage.setItem('currentUser', JSON.stringify(state.currentUser));
    updateNavigation();
    
    if (state.currentUser.userType === 'student') {
        showModal('Login Successful', 'Welcome back! Searching for internships matching your skills...');
        navigateTo('dashboard-page');
        autoSearchJobs();
    } else {
        showModal('Login Successful', 'Welcome to your recruiter dashboard!');
        navigateTo('recruiter-dashboard-page');
    }
}

function logout() {
    state.currentUser = null;
    localStorage.removeItem('currentUser');
    updateNavigation();
    showModal('Logged Out', 'You have been successfully logged out.');
    navigateTo('home-page');
}

function checkAuthState() {
    if (state.currentUser) {
        updateNavigation();
    }
}

function updateNavigation() {
    if (state.currentUser) {
        elements.loginNav.classList.add('hidden');
        elements.signupNav.classList.add('hidden');
        elements.logoutBtn.classList.remove('hidden');
        
        if (state.currentUser.userType === 'recruiter') {
            elements.recruiterDashboardNav.classList.remove('hidden');
        } else {
            elements.recruiterDashboardNav.classList.add('hidden');
        }
    } else {
        elements.loginNav.classList.remove('hidden');
        elements.signupNav.classList.remove('hidden');
        elements.logoutBtn.classList.add('hidden');
        elements.recruiterDashboardNav.classList.add('hidden');
    }
}

// Job Search Functions
async function autoSearchJobs() {
    if (!state.currentUser || state.currentUser.userType !== 'student' || state.isSearching) return;
    
    state.isSearching = true;
    
    elements.internshipList.innerHTML = `
        <div class="col-span-full text-center py-8">
            <i class="fab fa-google text-4xl text-blue-500 mb-4"></i>
            <p class="text-gray-500">Searching for internships matching your skills...</p>
            <div class="mt-4">
                <i class="fas fa-spinner fa-spin text-blue-500 text-2xl"></i>
            </div>
        </div>
    `;
    
    try {
        // Simulate API call delay
        await new Promise(r => setTimeout(r, 2000));
        
        // Generate mock internships based on user skills
        const mockInternships = generateMockInternships();
        const newInternships = mockInternships.map(internship => ({
            ...internship,
            id: Date.now() + Math.random(),
            status: 'Suggested',
            source: 'Viinterns Search',
            matchScore: calculateMatchScore(internship),
            matchLevel: getMatchLevel(calculateMatchScore(internship))
        }));
        
        // Add posted internships from recruiters
        const allPostedInternships = getAllPostedInternships();
        const relevantPostedInternships = allPostedInternships
            .filter(internship => calculateMatchScore(internship) > 30)
            .map(internship => ({
                ...internship,
                id: internship.id,
                status: 'Suggested',
                source: 'Recruiter Posted',
                matchScore: calculateMatchScore(internship),
                matchLevel: getMatchLevel(calculateMatchScore(internship))
            }));
        
        state.internships = [...newInternships, ...relevantPostedInternships];
        localStorage.setItem(`userInternships_${state.currentUser.email}`, JSON.stringify(state.internships));
        
        renderInternships();
        showModal('Search Complete', `Found ${state.internships.length} internships matching your profile!`);
        
    } catch (error) {
        console.error('Auto job search failed.', error);
        showEmptyDashboard();
    } finally {
        state.isSearching = false;
    }
}

function generateMockInternships() {
    const internships = [];
    const companies = ['Google', 'Microsoft', 'Amazon', 'Meta', 'Netflix', 'Tech Startup', 'Innovation Labs'];
    const fields = ['Engineering', 'Business', 'Science', 'Art', 'Education'];
    
    fields.forEach(field => {
        for (let i = 0; i < 2; i++) {
            internships.push({
                title: `${field} Intern - No Experience Required`,
                company: companies[Math.floor(Math.random() * companies.length)],
                location: 'Remote',
                type: 'Remote',
                duration: `${Math.floor(Math.random() * 3) + 2} months`,
                stipend: `$${Math.floor(Math.random() * 2000) + 1000}/month`,
                description: `Perfect for beginners interested in ${field.toLowerCase()}. Learn practical skills and gain real-world experience. No prior experience required.`,
                skills: ['Communication', 'Teamwork', 'Willingness to Learn', 'Basic Computer Skills'],
                experienceRequired: 'No experience required',
                postedDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            });
        }
    });
    
    return internships;
}

function getAllPostedInternships() {
    // Get all internships posted by all recruiters
    const allInternships = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('postedInternships_')) {
            try {
                const internships = JSON.parse(localStorage.getItem(key));
                allInternships.push(...internships);
            } catch (e) {
                console.error('Error parsing posted internships:', e);
            }
        }
    }
    return allInternships;
}

function calculateMatchScore(internship) {
    if (!state.currentUser || !state.currentUser.skills) return 50;
    
    const userSkills = state.currentUser.skills.map(skill => skill.toLowerCase());
    const internshipSkills = internship.skills.map(skill => skill.toLowerCase());
    
    let matchCount = 0;
    userSkills.forEach(userSkill => {
        if (internshipSkills.some(internSkill => 
            internSkill.includes(userSkill) || userSkill.includes(internSkill))) {
            matchCount++;
        }
    });
    
    return (matchCount / Math.max(userSkills.length, 1)) * 100;
}

function getMatchLevel(score) {
    if (score >= 70) return 'High Match';
    if (score >= 40) return 'Medium Match';
    return 'Low Match';
}

async function quickSearch(field) {
    if (!state.currentUser || state.currentUser.userType !== 'student') {
        showModal('Login Required', 'Please log in as a student to search for internships.');
        navigateTo('login-page');
        return;
    }
    
    state.isSearching = true;
    elements.internshipList.innerHTML = `
        <div class="col-span-full text-center py-8">
            <i class="fas fa-search text-4xl text-blue-500 mb-4"></i>
            <p class="text-gray-500">Searching ${field} internships...</p>
            <div class="mt-4">
                <i class="fas fa-spinner fa-spin text-blue-500 text-2xl"></i>
            </div>
        </div>
    `;
    
    try {
        await new Promise(r => setTimeout(r, 1500));
        
        // Filter existing internships by field
        const filteredInternships = state.internships.filter(internship => 
            field === 'All' || internship.title.toLowerCase().includes(field.toLowerCase())
        );
        
        if (filteredInternships.length > 0) {
            state.internships = filteredInternships;
            renderInternships();
        } else {
            showEmptyDashboard();
        }
    } catch (error) {
        console.error('Quick search failed:', error);
        showEmptyDashboard();
    } finally {
        state.isSearching = false;
    }
}

// Dashboard functions
function loadInternships() {
    if (state.internships.length === 0) {
        if (state.currentUser && state.currentUser.userType === 'student') {
            autoSearchJobs();
        } else {
            showEmptyDashboard();
        }
    } else {
        renderInternships();
    }
}

function showEmptyDashboard() {
    elements.internshipList.innerHTML = `
        <div class="col-span-full text-center py-12">
            <div class="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <i class="fas fa-search text-blue-500 text-3xl"></i>
            </div>
            <h3 class="text-xl font-bold text-gray-800 mb-2">Ready to Find Internships?</h3>
            <p class="text-gray-600 mb-6 max-w-md mx-auto">
                We'll search for no-experience-required internships matching your skills and interests.
            </p>
            <button onclick="autoSearchJobs()" class="btn-primary">
                <i class="fas fa-search mr-2"></i>Search Internships
            </button>
        </div>
    `;
}

function renderInternships() {
    elements.internshipList.innerHTML = '';
    
    let filteredInternships = state.internships;
    
    if (state.currentFilter === 'Applied') {
        filteredInternships = state.internships.filter(internship => internship.status === 'Applied');
    } else if (state.currentFilter === 'Suggested') {
        filteredInternships = state.internships.filter(internship => internship.status === 'Suggested');
    } else if (state.currentFilter === 'High Match') {
        filteredInternships = state.internships.filter(internship => internship.matchLevel === 'High Match');
    }
    
    if (filteredInternships.length === 0) {
        elements.internshipList.innerHTML = `
            <div class="col-span-full text-center py-8">
                <i class="fas fa-filter text-4xl text-gray-300 mb-4"></i>
                <p class="text-gray-500">No internships match your current filters.</p>
            </div>
        `;
        return;
    }
    
    filteredInternships.forEach(internship => {
        const internshipCard = document.createElement('div');
        const matchClass = internship.matchLevel === 'High Match' ? 'search-result-match' : 
                          internship.matchLevel === 'Medium Match' ? 'search-result-partial-match' : 'search-result-no-match';
        
        internshipCard.className = `internship-card card p-6 hover:shadow-lg transition-shadow ${matchClass}`;
        
        internshipCard.innerHTML = `
            <div class="flex justify-between items-start mb-4">
                <div>
                    <h3 class="text-xl font-bold text-gray-800">${internship.title}</h3>
                    <p class="text-gray-600">${internship.company} • ${internship.location}</p>
                </div>
                <div class="flex flex-col items-end">
                    <span class="internship-status status-${internship.status.toLowerCase()}">${internship.status}</span>
                    <span class="source-badge">${internship.source}</span>
                    <span class="match-indicator ${internship.matchLevel === 'High Match' ? 'match-high' : internship.matchLevel === 'Medium Match' ? 'match-medium' : 'match-low'}">${internship.matchLevel}</span>
                </div>
            </div>
            <div class="mb-4">
                <span class="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">${internship.type}</span>
                <span class="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded ml-2">${internship.duration}</span>
                <span class="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded ml-2">${internship.stipend}</span>
                <span class="experience-badge ml-2">${internship.experienceRequired}</span>
            </div>
            <p class="text-gray-600 mb-4 text-sm">${internship.description}</p>
            <div class="mb-4">
                ${internship.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
            </div>
            <div class="flex justify-between items-center">
                <span class="text-sm text-gray-500">${internship.postedDate ? 'Posted: ' + internship.postedDate : 'Recently added'}</span>
                <div class="flex space-x-2">
                    ${internship.status === 'Suggested' ? `
                        <button class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors" onclick="applyToInternship('${internship.id}')">
                            Apply Now
                        </button>
                    ` : ''}
                    <button class="text-blue-600 hover:text-blue-800 font-medium" onclick="viewInternshipDetails('${internship.id}')">
                        Details
                    </button>
                </div>
            </div>
        `;
        elements.internshipList.appendChild(internshipCard);
    });
}

function filterInternships(filter, el) {
    state.currentFilter = filter;
    renderInternships();
    
    document.querySelectorAll('.filter-btn-dashboard').forEach(btn => {
        btn.classList.remove('active');
    });
    
    if (el) {
        el.classList.add('active');
    }
}

function applyToInternship(id) {
    const internship = state.internships.find(i => i.id == id);
    if (internship) {
        internship.status = 'Applied';
        internship.appliedDate = new Date().toISOString().split('T')[0];
        
        // Save application
        if (state.currentUser) {
            localStorage.setItem(`userInternships_${state.currentUser.email}`, JSON.stringify(state.internships));
            
            // Notify recruiter (in real app, this would be a backend call)
            notifyRecruiter(internship, state.currentUser);
        }
        
        renderInternships();
        showModal('Application Submitted', `You have successfully applied to ${internship.title} at ${internship.company}!`);
    }
}

function notifyRecruiter(internship, student) {
    // In a real application, this would send a notification to the recruiter
    console.log(`Application notification: ${student.name} applied to ${internship.title}`);
    
    // Store application for recruiter view
    const application = {
        id: Date.now() + Math.random(),
        internship: internship,
        student: student,
        appliedDate: new Date().toISOString(),
        status: 'Pending'
    };
    
    // This would typically be stored in a database associated with the recruiter
    const recruiterEmail = internship.postedBy; // This would be set when internship is posted
    if (recruiterEmail) {
        const recruiterApplications = JSON.parse(localStorage.getItem(`applications_${recruiterEmail}`)) || [];
        recruiterApplications.push(application);
        localStorage.setItem(`applications_${recruiterEmail}`, JSON.stringify(recruiterApplications));
    }
}

// Recruiter Functions
function handlePostInternship(e) {
    e.preventDefault();
    
    const internshipData = {
        id: Date.now() + Math.random(),
        title: document.getElementById('internship-title').value,
        company: document.getElementById('internship-company').value,
        location: document.getElementById('internship-location').value,
        type: document.getElementById('internship-type').value,
        duration: document.getElementById('internship-duration').value,
        stipend: document.getElementById('internship-stipend').value,
        description: document.getElementById('internship-description').value,
        skills: document.getElementById('internship-skills').value.split(',').map(skill => skill.trim()),
        experienceRequired: 'No experience required',
        postedDate: new Date().toISOString().split('T')[0],
        postedBy: state.currentUser.email,
        applications: []
    };
    
    state.postedInternships.unshift(internshipData);
    localStorage.setItem(`postedInternships_${state.currentUser.email}`, JSON.stringify(state.postedInternships));
    
    // Reset form
    document.getElementById('post-internship-form').reset();
    
    showModal('Internship Posted', 'Your internship has been posted successfully! Students can now view and apply to it.');
    loadPostedInternships();
}

function loadPostedInternships() {
    elements.postedInternshipsList.innerHTML = '';
    
    if (state.postedInternships.length === 0) {
        elements.postedInternshipsList.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <i class="fas fa-briefcase text-4xl mb-4"></i>
                <p>You haven't posted any internships yet.</p>
            </div>
        `;
        return;
    }
    
    state.postedInternships.forEach(internship => {
        const internshipCard = document.createElement('div');
        internshipCard.className = 'recruiter-internship-card';
        
        // Get applications for this internship
        const applications = getApplicationsForInternship(internship.id);
        
        internshipCard.innerHTML = `
            <div class="flex justify-between items-start mb-4">
                <div>
                    <h3 class="text-xl font-bold text-gray-800">${internship.title}</h3>
                    <p class="text-gray-600">${internship.company} • ${internship.location} • ${internship.type}</p>
                </div>
                <div class="text-right">
                    <span class="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                        ${applications.length} Applications
                    </span>
                </div>
            </div>
            <div class="mb-4">
                <span class="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">${internship.duration}</span>
                <span class="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded ml-2">${internship.stipend}</span>
            </div>
            <p class="text-gray-600 mb-4 text-sm">${internship.description}</p>
            <div class="mb-4">
                <strong class="text-sm text-gray-700">Required Skills:</strong>
                <div class="mt-2">
                    ${internship.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                </div>
            </div>
            <div class="applications-section">
                <h4 class="font-semibold text-gray-800 mb-2">Applications (${applications.length})</h4>
                ${applications.length > 0 ? 
                    applications.map(app => `
                        <div class="application-item">
                            <div class="flex justify-between items-center">
                                <div>
                                    <strong>${app.student.name}</strong>
                                    <p class="text-sm text-gray-600">${app.student.email}</p>
                                    <p class="text-xs text-gray-500">Applied: ${new Date(app.appliedDate).toLocaleDateString()}</p>
                                </div>
                                <span class="internship-status status-${app.status.toLowerCase()}">${app.status}</span>
                            </div>
                            ${app.student.skills ? `
                                <div class="mt-2">
                                    <strong class="text-sm">Skills:</strong>
                                    <div class="mt-1">
                                        ${app.student.skills.map(skill => `<span class="skill-tag bg-gray-100">${skill}</span>`).join('')}
                                    </div>
                                </div>
                            ` : ''}
                            <div class="mt-2 flex space-x-2">
                                <button class="text-green-600 hover:text-green-800 text-sm font-medium" onclick="updateApplicationStatus('${app.id}', 'approved')">
                                    Approve
                                </button>
                                <button class="text-red-600 hover:text-red-800 text-sm font-medium" onclick="updateApplicationStatus('${app.id}', 'rejected')">
                                    Reject
                                </button>
                            </div>
                        </div>
                    `).join('') : 
                    '<p class="text-gray-500 text-sm">No applications yet.</p>'
                }
            </div>
        `;
        elements.postedInternshipsList.appendChild(internshipCard);
    });
}

function getApplicationsForInternship(internshipId) {
    // This would typically come from a backend
    // For demo, we'll return mock data
    return [
        {
            id: Date.now() + Math.random(),
            student: {
                name: "John Student",
                email: "john@student.com",
                skills: ["Communication", "Teamwork", "Python"]
            },
            appliedDate: new Date().toISOString(),
            status: "Pending"
        }
    ];
}

function updateApplicationStatus(applicationId, status) {
    // In a real app, this would update the application status in the database
    showModal('Status Updated', `Application has been ${status}.`);
    loadPostedInternships(); // Refresh the view
}

// Profile functions
function populateProfileForm() {
    if (!state.currentUser) return;
    
    document.getElementById('profile-name').value = state.currentUser.name;
    document.getElementById('profile-phone').value = state.currentUser.phone;
    document.getElementById('profile-email').value = state.currentUser.email;
    
    if (state.currentUser.skills) {
        document.getElementById('profile-skills').value = Array.isArray(state.currentUser.skills) ? 
            state.currentUser.skills.join(', ') : state.currentUser.skills;
    }
    
    // Populate career fields and preferences if they exist
    if (state.currentUser.careerFields) {
        state.currentUser.careerFields.forEach(field => {
            const checkbox = document.querySelector(`input[name="career-field"][value="${field}"]`);
            if (checkbox) checkbox.checked = true;
        });
    }
    
    if (state.currentUser.preferences) {
        const prefs = state.currentUser.preferences;
        if (prefs.location) document.getElementById('pref-location').value = prefs.location;
        if (prefs.workMode) document.getElementById('pref-work-mode').value = prefs.workMode;
    }
}

function handleProfileUpdate(e) {
    e.preventDefault();
    
    if (!state.currentUser) return;
    
    const name = document.getElementById('profile-name').value;
    const phone = document.getElementById('profile-phone').value;
    const skills = document.getElementById('profile-skills').value;
    
    // Get career fields
    const careerFields = [];
    document.querySelectorAll('input[name="career-field"]:checked').forEach(checkbox => {
        careerFields.push(checkbox.value);
    });
    
    // Get job preferences
    const preferences = {
        location: document.getElementById('pref-location').value,
        workMode: document.getElementById('pref-work-mode').value
    };
    
    // Update user data
    state.currentUser.name = name;
    state.currentUser.phone = phone;
    state.currentUser.skills = skills.split(',').map(skill => skill.trim()).filter(s => s.length > 0);
    state.currentUser.careerFields = careerFields;
    state.currentUser.preferences = preferences;
    
    localStorage.setItem('currentUser', JSON.stringify(state.currentUser));
    
    showModal('Profile Updated', 'Your profile has been updated successfully!');
}

// Chatbot functions
function toggleChatbot() {
    elements.chatbotChat.classList.toggle('hidden');
}

async function sendChatMessage() {
    const message = elements.chatbotInput.value.trim();
    if (!message) return;
    
    addMessageToChat(message, 'user');
    elements.chatbotInput.value = '';
    
    showTypingIndicator();
    
    try {
        // Simulate API call
        await new Promise(r => setTimeout(r, 1000));
        hideTypingIndicator();
        
        const response = generateChatResponse(message);
        addMessageToChat(response, 'bot');
    } catch (error) {
        hideTypingIndicator();
        addMessageToChat("I'm here to help you with internships! You can ask me about finding opportunities, resume tips, or interview preparation.", 'bot');
    }
}

function generateChatResponse(message) {
    const messageLower = message.toLowerCase();
    
    if (messageLower.includes('hello') || messageLower.includes('hi')) {
        return "Hello! I'm your Viinterns assistant. I can help you find no-experience internships, improve your resume, or prepare for interviews. How can I help you today?";
    } else if (messageLower.includes('internship') || messageLower.includes('job')) {
        return "I can help you find internships that require no prior experience! Based on your profile, I recommend checking opportunities in your dashboard. You can also use the quick search feature to find internships in specific fields.";
    } else if (messageLower.includes('resume') || messageLower.includes('cv')) {
        return "For no-experience internships, focus on highlighting your: 1) Transferable skills (communication, teamwork) 2) Education and courses 3) Projects or volunteer work 4) Willingness to learn. You can upload your resume for ATS analysis!";
    } else if (messageLower.includes('interview')) {
        return "For no-experience internship interviews: 1) Research the company 2) Practice common questions 3) Emphasize your learning attitude 4) Prepare questions to ask 5) Dress professionally 6) Be enthusiastic about the opportunity!";
    } else {
        return "I specialize in helping students find no-experience-required internships! You can ask me about internship search, resume tips, interview preparation, or career advice for beginners.";
    }
}

function addMessageToChat(message, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}-message`;
    
    let formattedMessage = message.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    formattedMessage = formattedMessage.replace(/\n/g, '<br>');

    messageDiv.innerHTML = `<p>${formattedMessage}</p>`;
    elements.chatbotMessages.appendChild(messageDiv);
    elements.chatbotMessages.scrollTop = elements.chatbotMessages.scrollHeight;
}

function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.id = 'typing-indicator';
    typingDiv.className = 'bot-message chat-message';
    typingDiv.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
    elements.chatbotMessages.appendChild(typingDiv);
    elements.chatbotMessages.scrollTop = elements.chatbotMessages.scrollHeight;
}

function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

function handleResumeUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const validTypes = ['.pdf', '.doc', '.docx', '.txt'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!validTypes.includes(fileExtension)) {
        showModal('Invalid File', 'Please upload a PDF, DOC, DOCX, or TXT file.');
        return;
    }
    
    addMessageToChat(`📄 Resume uploaded: ${file.name}`, 'user');
    showTypingIndicator();
    
    setTimeout(() => {
        hideTypingIndicator();
        addMessageToChat("I've analyzed your resume! For no-experience positions, I recommend:\n\n• **Focus on transferable skills** like communication and teamwork\n• **Highlight relevant coursework** and projects\n• **Include volunteer work** and extracurricular activities\n• **Add a strong career objective**\n• **Keep it clean and professional**\n\nYour resume shows good potential for entry-level positions!", 'bot');
    }, 2000);
    
    e.target.value = '';
}

// Modal functions
function showModal(title, message) {
    elements.modalTitle.textContent = title;
    elements.modalMessage.innerHTML = message;
    elements.messageModal.classList.remove('hidden');
}

function hideModal() {
    elements.messageModal.classList.add('hidden');
}

// View internship details
function viewInternshipDetails(id) {
    const internship = state.internships.find(i => i.id == id);
    if (internship) {
        const modalContent = `
            <div class="space-y-3">
                <p><strong>Company:</strong> ${internship.company}</p>
                <p><strong>Location:</strong> ${internship.location}</p>
                <p><strong>Type:</strong> ${internship.type}</p>
                <p><strong>Duration:</strong> ${internship.duration}</p>
                <p><strong>Stipend:</strong> ${internship.stipend}</p>
                <p><strong>Experience Required:</strong> ${internship.experienceRequired}</p>
                <p><strong>Source:</strong> ${internship.source}</p>
                <p><strong>Match Level:</strong> ${internship.matchLevel}</p>
                <p><strong>Description:</strong> ${internship.description}</p>
                <p><strong>Skills Required:</strong> ${internship.skills.join(', ')}</p>
                <p><strong>Status:</strong> ${internship.status}</p>
            </div>
            ${internship.status === 'Suggested' ? `
            <div class="mt-6 text-center">
                <button class="btn-primary w-full" onclick="applyToInternship('${internship.id}'); hideModal();">
                    Apply to this Internship
                </button>
            </div>
            ` : ''}
        `;
        showModal(internship.title, modalContent);
    }
}