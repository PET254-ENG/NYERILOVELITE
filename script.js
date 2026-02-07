/* script.js */

// --- 1. GLOBAL STATE & UTILS ---
const DB_USERS = 'nyeri_users';
const DB_SESSION = 'nyeri_session';
const DB_MATCHES = 'nyeri_matches';
const DB_MESSAGES = 'nyeri_messages';

// Initialize Mock Data if empty
function initApp() {
    if (!localStorage.getItem(DB_USERS)) {
        const dummyUsers = [
            { id: 101, name: 'Zara', age: 24, location: 'Nairobi', bio: 'Fashion Designer. Love art and coffee.', gender: 'female', interestedIn: 'male', img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400', likes: [1, 2, 3] }, // Likes IDs 1,2,3 automatically
            { id: 102, name: 'James', age: 29, location: 'Mombasa', bio: 'Entrepreneur. Sailing & Tech.', gender: 'male', interestedIn: 'female', img: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400', likes: [1, 2, 3] },
            { id: 103, name: 'Amara', age: 26, location: 'Kisumu', bio: 'Doctor. Travel enthusiast.', gender: 'female', interestedIn: 'male', img: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400', likes: [1, 2, 3] },
            { id: 104, name: 'David', age: 31, location: 'Nakuru', bio: 'Architect. Building dreams.', gender: 'male', interestedIn: 'female', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400', likes: [1, 2, 3] }
        ];
        localStorage.setItem(DB_USERS, JSON.stringify(dummyUsers));
    }
}

function getCurrentUser() {
    return JSON.parse(localStorage.getItem(DB_SESSION));
}

function getUsers() {
    return JSON.parse(localStorage.getItem(DB_USERS)) || [];
}

function logout() {
    localStorage.removeItem(DB_SESSION);
    window.location.href = 'index.html';
}

// --- 2. PAGE SPECIFIC LOGIC ---
document.addEventListener('DOMContentLoaded', () => {
    initApp();
    const page = document.body.getAttribute('data-page');

    if (page === 'signup') handleSignup();
    if (page === 'login') handleLogin();
    if (page === 'dashboard') handleDashboard();
    if (page === 'matches') handleMatches();
    if (page === 'chat') handleChat();

    // Attach Logout Listeners
    document.querySelectorAll('.logout-btn').forEach(btn => btn.addEventListener('click', logout));
});

// --- AUTHENTICATION ---
function handleSignup() {
    const form = document.getElementById('signup-form');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const users = getUsers();
        
        const newUser = {
            id: Date.now(), // Simple unique ID
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            password: document.getElementById('password').value, // In real app, hash this!
            gender: document.getElementById('gender').value,
            interestedIn: document.getElementById('interestedIn').value,
            age: document.getElementById('age').value,
            bio: "New member looking for love.",
            img: 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=400', // Placeholder
            likes: [] 
        };

        users.push(newUser);
        localStorage.setItem(DB_USERS, JSON.stringify(users));
        localStorage.setItem(DB_SESSION, JSON.stringify(newUser));
        window.location.href = 'dashboard.html';
    });
}

function handleLogin() {
    const form = document.getElementById('login-form');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const pass = document.getElementById('password').value;
        const users = getUsers();

        const user = users.find(u => u.email === email && u.password === pass);

        if (user) {
            localStorage.setItem(DB_SESSION, JSON.stringify(user));
            window.location.href = 'dashboard.html';
        } else {
            alert('Invalid Credentials');
        }
    });
}

// --- DASHBOARD (SWIPING) ---
function handleDashboard() {
    const user = getCurrentUser();
    if (!user) return window.location.href = 'login.html';

    document.getElementById('user-name-display').textContent = user.name;

    // Filter users: Not me, Match my preference, Not already liked/passed
    // Note: In a real app, "passed" logic would be stored. Here we just show everyone else.
    let allUsers = getUsers();
    let potentialMatches = allUsers.filter(u => 
        u.id !== user.id && 
        (user.interestedIn === 'both' || u.gender === user.interestedIn) &&
        !user.likes.includes(u.id) // Don't show already liked
    );

    const cardContainer = document.getElementById('card-container');
    
    if (potentialMatches.length === 0) {
        cardContainer.innerHTML = `<div class="auth-box"><h3>No more profiles!</h3><p>Check back later.</p></div>`;
        return;
    }

    // Render first profile
    const target = potentialMatches[0];
    renderCard(target);

    // Like/Pass Logic
    document.getElementById('btn-like').onclick = () => processSwipe(user, target, true);
    document.getElementById('btn-pass').onclick = () => processSwipe(user, target, false);
}

function renderCard(profile) {
    document.getElementById('card-img').src = profile.img;
    document.getElementById('card-name').textContent = `${profile.name}, ${profile.age}`;
    document.getElementById('card-bio').textContent = profile.bio;
    document.getElementById('card-loc').textContent = profile.location;
}

function processSwipe(currentUser, targetUser, isLike) {
    let allUsers = getUsers();
    // Update current user in DB (refetch to ensure sync)
    let userIndex = allUsers.findIndex(u => u.id === currentUser.id);
    
    if (isLike) {
        allUsers[userIndex].likes.push(targetUser.id);
        
        // Check for Match
        // Since dummy users "like" everyone (IDs 1,2,3...), and our generated ID is big,
        // we simulate that dummy users ALWAYS like the new user back for demo purposes.
        const isMatch = targetUser.likes.includes(currentUser.id) || targetUser.id < 1000; 
        
        if (isMatch) {
            alert(`It's a Match with ${targetUser.name}!`);
            let matches = JSON.parse(localStorage.getItem(DB_MATCHES)) || [];
            matches.push({
                users: [currentUser.id, targetUser.id],
                timestamp: Date.now()
            });
            localStorage.setItem(DB_MATCHES, JSON.stringify(matches));
        }
    }

    localStorage.setItem(DB_USERS, JSON.stringify(allUsers));
    localStorage.setItem(DB_SESSION, JSON.stringify(allUsers[userIndex])); // Update session
    location.reload(); // Reload to show next card
}

// --- MATCHES PAGE ---
function handleMatches() {
    const user = getCurrentUser();
    if (!user) return window.location.href = 'login.html';

    const allMatches = JSON.parse(localStorage.getItem(DB_MATCHES)) || [];
    const allUsers = getUsers();
    
    // Filter matches involving current user
    const myMatches = allMatches.filter(m => m.users.includes(user.id));
    const container = document.getElementById('matches-grid');

    if(myMatches.length === 0) {
        container.innerHTML = `<p style="text-align:center; width:100%; color:gray;">No matches yet. Keep swiping!</p>`;
        return;
    }

    myMatches.forEach(match => {
        const otherUserId = match.users.find(id => id !== user.id);
        const otherUser = allUsers.find(u => u.id === otherUserId);
        
        if(otherUser) {
            const div = document.createElement('div');
            div.className = 'match-card';
            div.innerHTML = `
                <img src="${otherUser.img}" class="match-img" alt="${otherUser.name}">
                <h3>${otherUser.name}</h3>
                <p>${otherUser.location}</p>
            `;
            div.onclick = () => {
                localStorage.setItem('current_chat_id', otherUser.id);
                window.location.href = 'chat.html';
            };
            container.appendChild(div);
        }
    });
}

// --- CHAT PAGE ---
function handleChat() {
    const user = getCurrentUser();
    const chatPartnerId = parseInt(localStorage.getItem('current_chat_id'));
    if (!user || !chatPartnerId) return window.location.href = 'dashboard.html';

    const allUsers = getUsers();
    const partner = allUsers.find(u => u.id === chatPartnerId);
    
    document.getElementById('chat-partner-name').textContent = partner.name;
    document.getElementById('chat-partner-img').src = partner.img;

    const messagesKey = `chat_${Math.min(user.id, partner.id)}_${Math.max(user.id, partner.id)}`;
    const chatBody = document.getElementById('chat-body');

    // Load Messages
    function renderMessages() {
        const messages = JSON.parse(localStorage.getItem(messagesKey)) || [];
        chatBody.innerHTML = '';
        messages.forEach(msg => {
            const div = document.createElement('div');
            div.className = `message ${msg.senderId === user.id ? 'sent' : 'received'}`;
            div.textContent = msg.text;
            chatBody.appendChild(div);
        });
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    renderMessages();

    // Send Message
    document.getElementById('send-btn').onclick = () => {
        const input = document.getElementById('msg-input');
        if(!input.value.trim()) return;

        const messages = JSON.parse(localStorage.getItem(messagesKey)) || [];
        messages.push({
            senderId: user.id,
            text: input.value,
            timestamp: Date.now()
        });
        localStorage.setItem(messagesKey, JSON.stringify(messages));
        input.value = '';
        renderMessages();

        // Simulate Reply
        setTimeout(() => {
            messages.push({
                senderId: partner.id,
                text: "That's interesting! Tell me more.",
                timestamp: Date.now()
            });
            localStorage.setItem(messagesKey, JSON.stringify(messages));
            renderMessages();
        }, 1500);
    };
}