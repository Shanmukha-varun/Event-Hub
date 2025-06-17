    // --- Configuration ---
    const API_BASE_URL = 'https://event-hub-nmhd.onrender.com/api'; // Adjust if your backend runs elsewhere

    // --- State Variables ---
    let currentUser = null;
    let authToken = null;
    let currentEvents = [];
    let cart = []; // NEW: Initialize cart array

    // --- DOM Elements ---
    // (Keep all the original DOM element selections)
    const pages = document.querySelectorAll('.page');
    const eventListContainer = document.getElementById('event-list');
    const purchasedTicketsContainer = document.getElementById('purchased-tickets-list');
    const loggedInNav = document.getElementById('logged-in-nav');
    const loggedOutNav = document.getElementById('logged-out-nav');
    const navUsername = document.getElementById('nav-username');
    const profileName = document.getElementById('profile-name');
    const profileEmail = document.getElementById('profile-email');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const createEventForm = document.getElementById('create-event-form');
    const editEventForm = document.getElementById('edit-event-form');
    const loginError = document.getElementById('login-error');
    const registerError = document.getElementById('register-error');
    const registerSuccess = document.getElementById('register-success');
    const createEventSuccess = document.getElementById('create-event-success');
    const createEventError = document.getElementById('create-event-error');
    const editEventSuccess = document.getElementById('edit-event-success');
    const editEventError = document.getElementById('edit-event-error');
    const purchaseSuccessMsg = document.getElementById('purchase-success-msg');
    const deleteEventMsg = document.getElementById('delete-event-msg');
    const updateEventSuccessMsg = document.getElementById('update-event-success-msg');
    const messageModal = document.getElementById('message-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const modalButtons = document.getElementById('modal-buttons');
    const cartMessage = document.getElementById('cart-message'); // NEW

    // NEW: Cart Modal Elements
    const cartModal = document.getElementById('cart-modal');
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartTotalPriceElement = document.getElementById('cart-total-price');
    const cartItemCountElement = document.getElementById('cart-item-count');
    const confirmPurchaseButton = document.getElementById('confirm-purchase-button');
    const cartError = document.getElementById('cart-error');

    // --- Utility Functions ---

    /**
     * Helper function to make fetch requests.
     * (Original - Unchanged)
     */
    async function apiRequest(url, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };
        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }
        try {
            const response = await fetch(`${API_BASE_URL}${url}`, { ...options, headers });
            return response;
        } catch (error) {
            console.error(`API Request Error to ${url}:`, error);
            showMessageModal('Network Error', 'Could not connect to the server.');
            throw error;
        }
    }

    /**
     * Shows the specified page and hides all others.
     * (Original - Unchanged, except added cartMessage hide)
     */
    function showPage(pageId) {
        // Hide messages
        loginError.textContent = ''; registerError.textContent = ''; registerSuccess.textContent = '';
        createEventError.textContent = ''; createEventSuccess.textContent = '';
        if(editEventError) editEventError.textContent = ''; if(editEventSuccess) editEventSuccess.textContent = '';
        purchaseSuccessMsg.classList.add('hidden'); deleteEventMsg.classList.add('hidden');
        if(updateEventSuccessMsg) updateEventSuccessMsg.classList.add('hidden');
        if(cartMessage) cartMessage.classList.add('hidden'); // Hide cart messages too

        pages.forEach(page => page.classList.remove('active'));
        const activePage = document.getElementById(`${pageId}-page`);
        if (activePage) {
            activePage.classList.add('active'); window.scrollTo(0, 0);
        } else {
            console.error(`Page with ID ${pageId}-page not found.`);
            document.getElementById('events-page').classList.add('active'); // Default fallback
        }
        updateLoginStateUI(); // Update nav based on currentUser
        // Load data for specific pages
        if (pageId === 'events') loadEvents();
        else if (pageId === 'profile' && currentUser) loadProfileData();
        // Access control
        if ((pageId === 'create-event' || pageId === 'profile' || pageId === 'edit-event') && !currentUser) {
            console.log(`Redirecting to login. Reason: Accessing ${pageId} while logged out.`);
            setTimeout(() => showPage('login'), 0); // Redirect to login
        }
    }

    /**
     * Updates the navigation bar visibility based on currentUser state.
     * MODIFIED: Added call to updateCartIndicator
     */
    function updateLoginStateUI() {
        if (currentUser && authToken) {
            loggedInNav.classList.remove('hidden'); loggedInNav.classList.add('flex');
            loggedOutNav.classList.remove('flex'); loggedOutNav.classList.add('hidden');
            navUsername.textContent = currentUser.name;
        } else {
            loggedInNav.classList.add('hidden'); loggedInNav.classList.remove('flex');
            loggedOutNav.classList.remove('hidden'); loggedOutNav.classList.add('flex');
            navUsername.textContent = 'Profile';
        }
        updateCartIndicator(); // MODIFIED: Update cart count on login/logout
    }

    /**
     * Formats a date string.
     * (Original - Unchanged)
     */
    function formatEventDate(dateString) {
        if (!dateString) return 'Date TBD';
        try {
            const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
            return new Date(dateString).toLocaleDateString(undefined, options);
        } catch (e) { console.error("Error formatting date:", dateString, e); return dateString; }
    }

    /**
     * Saves auth token and user data.
     * (Original - Unchanged)
     */
    function saveAuthState(user, token) {
        currentUser = user; authToken = token;
        try {
            if (user && token) {
                sessionStorage.setItem('eventhub_user', JSON.stringify(user)); sessionStorage.setItem('eventhub_token', token);
            } else {
                sessionStorage.removeItem('eventhub_user'); sessionStorage.removeItem('eventhub_token');
            }
        } catch (e) { console.error("Error accessing sessionStorage:", e); }
    }

    /**
     * Loads auth token and user data from sessionStorage on page load.
     * (Original - Unchanged)
     */
    function loadAuthState() {
         try {
            const storedUser = sessionStorage.getItem('eventhub_user'); const storedToken = sessionStorage.getItem('eventhub_token');
            if (storedUser && storedToken) {
                currentUser = JSON.parse(storedUser); authToken = storedToken; console.log("Auth state loaded.");
            } else { currentUser = null; authToken = null; }
        } catch (e) { console.error("Error accessing sessionStorage:", e); currentUser = null; authToken = null; }
    }


    /**
     * Displays the generic message modal.
     * (Original - Unchanged)
     */
    function showMessageModal(title, message, onConfirm) {
        modalTitle.textContent = title; modalMessage.textContent = message; modalButtons.innerHTML = '';
        if (typeof onConfirm === 'function') {
            const confirmButton = document.createElement('button'); confirmButton.textContent = 'Confirm'; confirmButton.className = 'px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-300'; confirmButton.onclick = () => { onConfirm(); closeModal(); };
            const cancelButton = document.createElement('button'); cancelButton.textContent = 'Cancel'; cancelButton.className = 'px-6 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition duration-300'; cancelButton.onclick = closeModal;
            modalButtons.appendChild(cancelButton); modalButtons.appendChild(confirmButton);
        } else {
            const okButton = document.createElement('button'); okButton.textContent = 'OK'; okButton.className = 'px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition duration-300'; okButton.onclick = closeModal; modalButtons.appendChild(okButton);
        }
        messageModal.classList.remove('hidden');
    }

    /**
     * Hides the generic message modal.
     * (Original - Unchanged)
     */
    function closeModal() { messageModal.classList.add('hidden'); }

    // --- Core Logic ---

    /**
     * Fetches events from the backend and displays them.
     * MODIFIED: Added quantity input and "Add to Cart" button.
     */
    async function loadEvents() {
        eventListContainer.innerHTML = '<p class="text-center col-span-full py-10 text-gray-500">Loading events...</p>';
        try {
            const response = await apiRequest('/events');
            if (!response.ok) { const e = await response.json().catch(() => ({})); throw new Error(e.message || `HTTP error! status: ${response.status}`); }
            currentEvents = await response.json(); // Store fetched events globally
            eventListContainer.innerHTML = '';

            if (currentEvents.length === 0) {
                eventListContainer.innerHTML = '<p class="text-center col-span-full py-10 text-gray-500">No events available.</p>'; return;
            }
            // Check purchased tickets *after* login state is confirmed
            const purchasedEventIds = new Set(currentUser?.purchasedTickets?.map(ticket => ticket.eventId) || []);

            currentEvents.forEach(event => {
                const eventId = event._id;
                const creatorId = event.createdBy?._id || event.createdBy;
                const isOwner = currentUser && creatorId === currentUser._id;
                // Check purchased status based on current user state
                const isPurchased = currentUser && purchasedEventIds.has(eventId);
                const imageUrl = event.imageUrl || 'https://placehold.co/600x400/cccccc/ffffff?text=Event';
                const imageErrorFallback = 'https://placehold.co/600x400/cccccc/ffffff?text=Image+Error';

                // --- MODIFIED: Action Button Logic ---
                let actionControlsHtml = '';
                if (currentUser) {
                    if (isPurchased) {
                        actionControlsHtml = '<span class="px-4 py-2 bg-green-500 text-white rounded-md text-sm font-medium"><i class="fas fa-check mr-1"></i> Purchased</span>';
                    } else {
                        // Add quantity input and Add to Cart button
                        actionControlsHtml = `
                            <div class="flex items-center space-x-2">
                                <input type="number" id="qty-${eventId}" value="1" min="1" max="10" class="w-16 px-2 py-1 border border-gray-300 rounded-md text-sm text-center">
                                <button onclick="handleAddToCartClick('${eventId}')" class="px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition duration-300 text-sm font-medium">
                                    <i class="fas fa-cart-plus mr-1"></i> Add
                                </button>
                            </div>`;
                    }
                } else {
                    // Logged out user sees disabled Add to Cart
                    actionControlsHtml = `
                        <div class="flex items-center space-x-2">
                             <input type="number" id="qty-${eventId}" value="1" min="1" max="10" class="w-16 px-2 py-1 border border-gray-300 rounded-md text-sm text-center" disabled>
                            <button onclick="showPage('login')" class="px-3 py-2 bg-gray-400 text-white rounded-md text-sm font-medium cursor-not-allowed" title="Login to add">
                                <i class="fas fa-cart-plus mr-1"></i> Add
                            </button>
                        </div>`;
                }
                // --- END MODIFIED Action Button ---

                let ownerButtonsHtml = '';
                if (isOwner) {
                     const escapedEventName = event.name.replace(/'/g, "\\'");
                     ownerButtonsHtml = `
                        <button onclick="showEditEventPage('${eventId}')" class="ml-2 px-3 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition duration-300 text-xs font-medium" title="Edit Event"><i class="fas fa-edit"></i></button>
                        <button onclick="confirmDeleteEvent('${eventId}', '${escapedEventName}')" class="ml-2 px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition duration-300 text-xs font-medium" title="Delete Event"><i class="fas fa-trash-alt"></i></button>`;
                }

                const creatorName = event.createdBy?.name || 'Unknown';
                const card = `
                    <div class="event-card bg-white rounded-lg shadow-md overflow-hidden flex flex-col">
                         <img src="${imageUrl}" alt="${event.name}" class="w-full h-48 object-cover" onerror="this.onerror=null; this.src='${imageErrorFallback}';">
                        <div class="p-4 flex flex-col flex-grow">
                            <h3 class="text-xl font-semibold text-gray-800 mb-2">${event.name}</h3>
                            <p class="text-sm text-indigo-600 font-medium mb-2"><i class="fas fa-calendar-alt mr-1"></i> ${formatEventDate(event.date)}</p>
                            <p class="text-sm text-gray-600 mb-3"><i class="fas fa-map-marker-alt mr-1"></i> ${event.location}</p>
                            <p class="text-gray-700 text-sm mb-4 flex-grow">${event.description}</p>
                            <p class="text-xs text-gray-500 mb-3">Created by: ${creatorName}</p>
                            <div class="flex flex-col sm:flex-row justify-between items-center mt-auto pt-4 border-t border-gray-200 space-y-3 sm:space-y-0">
                                <span class="text-lg font-bold text-indigo-700">₹${event.price.toFixed(2)}</span>
                                <div class="flex items-center">
                                    ${actionControlsHtml}
                                    ${ownerButtonsHtml}
                                </div>
                            </div>
                        </div>
                    </div>`;
                eventListContainer.innerHTML += card;
            });
        } catch (error) { console.error('Failed load events:', error); eventListContainer.innerHTML = `<p class="text-center col-span-full py-10 text-red-500">Error loading events: ${error.message}</p>`; }
    }

    /**
     * Fetches user profile data (including tickets) and displays it.
     * (Original - Unchanged)
     */
    async function loadProfileData() {
        if (!currentUser) { showPage('login'); return; }
        profileName.textContent = currentUser.name; profileEmail.textContent = currentUser.email; purchasedTicketsContainer.innerHTML = '<p class="text-gray-500">Loading tickets...</p>';
        try {
            const response = await apiRequest('/users/me/tickets'); if (!response.ok) { const e = await response.json().catch(() => ({})); throw new Error(e.message || `HTTP error! status: ${response.status}`); }
            const tickets = await response.json(); currentUser.purchasedTickets = tickets; saveAuthState(currentUser, authToken); purchasedTicketsContainer.innerHTML = '';
            if (!tickets || tickets.length === 0) { purchasedTicketsContainer.innerHTML = '<p class="text-gray-500">You haven\'t purchased tickets.</p>'; return; }
            tickets.forEach(ticket => {
                const event = ticket.eventId; const ticketId = ticket.ticketId;
                if (event) {
                     const qrData = `EVENT_ID:${event._id};TICKET_ID:${ticketId};USER:${currentUser.email}`; const ticketCard = document.createElement('div'); ticketCard.className = 'ticket-card p-4 rounded-lg shadow-md flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0 sm:space-x-4'; const infoDiv = document.createElement('div'); infoDiv.className = 'flex-grow text-center sm:text-left'; infoDiv.innerHTML = `<h4 class="font-semibold text-lg">${event.name}</h4><p class="text-sm opacity-90"><i class="fas fa-calendar-alt fa-fw mr-1"></i> ${formatEventDate(event.date)}</p><p class="text-sm opacity-90"><i class="fas fa-map-marker-alt fa-fw mr-1"></i> ${event.location}</p><p class="text-xs opacity-70 mt-1">Ticket ID: ${ticketId}</p>`; const qrDiv = document.createElement('div'); qrDiv.className = 'flex-shrink-0 w-24 h-24 bg-white p-1 rounded-md shadow-inner'; qrDiv.id = `qr-${ticketId}`; ticketCard.appendChild(infoDiv); ticketCard.appendChild(qrDiv); purchasedTicketsContainer.appendChild(ticketCard);
                     try { new QRCode(document.getElementById(qrDiv.id), { text: qrData, width: 96, height: 96, colorDark: "#000000", colorLight: "#ffffff", correctLevel: QRCode.CorrectLevel.H }); } catch (e) { console.error("QR Error:", e); qrDiv.innerHTML = '<p class="text-xs text-red-500">QR Error</p>'; }
                } else { const m = `<div class="p-4 rounded-lg shadow-md bg-gray-200 text-gray-600"><p>Ticket for removed event (ID: ${ticket.eventId})</p><p class="text-sm">Ticket ID: ${ticketId}</p></div>`; purchasedTicketsContainer.innerHTML += m; }
            });
        } catch (error) { console.error('Failed load tickets:', error); purchasedTicketsContainer.innerHTML = `<p class="text-red-500">Error loading tickets: ${error.message}</p>`; }
    }

    /**
     * Handles the login form submission via API call.
     * (Original - Unchanged)
     */
    async function handleLogin(event) {
        event.preventDefault(); loginError.textContent = ''; const email = loginForm.email.value; const password = loginForm.password.value; if (!email || !password) { loginError.textContent = 'Please enter both email and password.'; return; }
        try { const r = await apiRequest('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }), }); const d = await r.json(); if (!r.ok) throw new Error(d.message || `HTTP error! status: ${r.status}`); saveAuthState(d, d.token); updateLoginStateUI(); showPage('events'); loginForm.reset(); }
        catch (error) { console.error('Login failed:', error); loginError.textContent = error.message || 'Login failed.'; saveAuthState(null, null); updateLoginStateUI(); }
    }

    /**
     * Handles the registration form submission via API call.
     * (Original - Unchanged)
     */
    async function handleRegister(event) {
        event.preventDefault(); registerError.textContent = ''; registerSuccess.textContent = ''; const name = registerForm.name.value; const email = registerForm.email.value; const password = registerForm.password.value; const confirmPassword = registerForm.confirm_password.value; if (!name || !email || !password || !confirmPassword) { registerError.textContent = 'Please fill all fields.'; return; } if (password !== confirmPassword) { registerError.textContent = 'Passwords do not match.'; return; } if (password.length < 6) { registerError.textContent = 'Password minimum 6 characters.'; return; }
        try { const r = await apiRequest('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }), }); const d = await r.json(); if (!r.ok) throw new Error(d.message || `HTTP error! status: ${r.status}`); registerSuccess.textContent = 'Registration successful! Please sign in.'; registerForm.reset(); }
        catch (error) { console.error('Registration failed:', error); registerError.textContent = error.message || 'Registration failed.'; }
    }

    /**
     * Handles the create event form submission via API call.
     * (Original - Unchanged)
     */
    async function handleCreateEvent(event) {
        event.preventDefault(); createEventError.textContent = ''; createEventSuccess.textContent = ''; if (!currentUser || !authToken) { createEventError.textContent = 'Must be logged in.'; showPage('login'); return; } const formData = new FormData(createEventForm); const eventData = { name: formData.get('eventName'), date: formData.get('eventDate'), location: formData.get('eventLocation'), description: formData.get('eventDescription'), price: formData.get('eventPrice'), imageUrl: formData.get('eventImageUrl') || null, }; if (!eventData.name || !eventData.date || !eventData.location || !eventData.description || eventData.price === null || eventData.price === '') { createEventError.textContent = 'Please fill required fields.'; return; } if (isNaN(parseFloat(eventData.price)) || parseFloat(eventData.price) < 0) { createEventError.textContent = 'Invalid price.'; return; }
        try { const r = await apiRequest('/events', { method: 'POST', body: JSON.stringify(eventData), }); const d = await r.json(); if (!r.ok) throw new Error(d.message || `HTTP error! status: ${r.status}`); createEventSuccess.textContent = `Event "${d.name}" created!`; createEventForm.reset(); setTimeout(() => { if (document.getElementById('create-event-page')?.classList.contains('active')) { showPage('events'); } }, 1500); }
        catch (error) { console.error('Event creation failed:', error); createEventError.textContent = error.message || 'Failed to create event.'; }
    }

    /**
     * Shows confirmation modal before deleting an event.
     * (Original - Unchanged)
     */
    function confirmDeleteEvent(eventId, eventName) { const escapedEventName = eventName.replace(/'/g, "\\'"); showMessageModal( 'Confirm Deletion', `Delete "${escapedEventName}"? This cannot be undone.`, () => { deleteEvent(eventId); } ); }

    /**
     * Handles deleting an event via API call.
     * (Original - Unchanged)
     */
    async function deleteEvent(eventId) {
         if (!currentUser || !authToken) { showMessageModal('Error', 'Must be logged in.'); showPage('login'); return; } if (!deleteEventMsg) return;
        try { const r = await apiRequest(`/events/${eventId}`, { method: 'DELETE' }); const d = await r.json(); if (!r.ok) throw new Error(d.message || `HTTP error! status: ${r.status}`); const deletedEventName = currentEvents.find(e => e._id === eventId)?.name || 'the event'; deleteEventMsg.textContent = `Event "${deletedEventName}" deleted.`; deleteEventMsg.classList.remove('hidden'); if (currentUser.purchasedTickets) { const i = currentUser.purchasedTickets.length; currentUser.purchasedTickets = currentUser.purchasedTickets.filter(t => t.eventId !== eventId); if (currentUser.purchasedTickets.length < i) { saveAuthState(currentUser, authToken); } } loadEvents(); setTimeout(() => deleteEventMsg.classList.add('hidden'), 5000); }
        catch (error) { console.error('Deletion failed:', error); showMessageModal('Deletion Failed', error.message || 'Could not delete event.'); }
    }

    /**
     * Logs the user out by clearing local state and storage.
     * (Original - Unchanged)
     */
    function logout() { saveAuthState(null, null); updateLoginStateUI(); showPage('login'); }


    /**
     * Populates the edit form with existing event data and shows the edit page.
     * (Original - Unchanged)
     */
    function showEditEventPage(eventId) {
        if (!editEventForm) { console.error("Edit event form not found!"); showMessageModal("Error", "Could not load the edit form."); return; }
        const eventToEdit = currentEvents.find(event => event._id === eventId);
        if (!eventToEdit) { console.error("Event data not found for ID:", eventId); showMessageModal("Error", "Could not find event details to edit."); return; }
        try {
            const localDate = new Date(eventToEdit.date); const timezoneOffset = localDate.getTimezoneOffset() * 60000; const localISOTime = new Date(localDate.getTime() - timezoneOffset).toISOString().slice(0, 16);
            editEventForm['edit-event-id'].value = eventToEdit._id; editEventForm['edit-event-name'].value = eventToEdit.name; editEventForm['edit-event-date'].value = localISOTime; editEventForm['edit-event-location'].value = eventToEdit.location; editEventForm['edit-event-price'].value = eventToEdit.price.toFixed(2); editEventForm['edit-event-description'].value = eventToEdit.description; editEventForm['edit-event-image-url'].value = eventToEdit.imageUrl || '';
        } catch (error) { console.error("Error populating edit form:", error); showMessageModal("Error", "Could not load event data into the edit form."); return; }
        showPage('edit-event');
    }

    /**
     * Handles the edit event form submission via API call.
     * (Original - Unchanged)
     */
    async function handleUpdateEvent(event) {
        event.preventDefault(); if (!editEventForm || !editEventError || !editEventSuccess) return; editEventError.textContent = ''; editEventSuccess.textContent = ''; if (!currentUser || !authToken) { editEventError.textContent = 'You must be logged in to update events.'; showPage('login'); return; }
        const eventId = editEventForm['edit-event-id'].value; const eventData = { name: editEventForm['edit-event-name'].value, date: editEventForm['edit-event-date'].value, location: editEventForm['edit-event-location'].value, description: editEventForm['edit-event-description'].value, price: editEventForm['edit-event-price'].value, imageUrl: editEventForm['edit-event-image-url'].value || null, };
        if (!eventId) { editEventError.textContent = 'Event ID missing.'; return; } if (!eventData.name || !eventData.date || !eventData.location || !eventData.description || eventData.price === null || eventData.price === '') { editEventError.textContent = 'Please fill required fields.'; return; } if (isNaN(parseFloat(eventData.price)) || parseFloat(eventData.price) < 0) { editEventError.textContent = 'Invalid price.'; return; }
        try {
            const response = await apiRequest(`/events/${eventId}`, { method: 'PUT', body: JSON.stringify(eventData), }); const data = await response.json(); if (!response.ok) { throw new Error(data.message || `HTTP error! status: ${response.status}`); }
            editEventSuccess.textContent = `Event "${data.name}" updated!`; const index = currentEvents.findIndex(e => e._id === eventId); if (index !== -1) { currentEvents[index] = data; }
            setTimeout(() => { if(updateEventSuccessMsg) { updateEventSuccessMsg.textContent = `Event "${data.name}" updated successfully!`; updateEventSuccessMsg.classList.remove('hidden'); setTimeout(() => updateEventSuccessMsg.classList.add('hidden'), 4000); } showPage('events'); }, 1500);
        } catch (error) {
            console.error('Event update failed:', error); if (error instanceof SyntaxError && error.message.includes("Unexpected token '<'")) { editEventError.textContent = 'Failed to update event. Endpoint not found (404). Please check backend routes.'; } else { editEventError.textContent = error.message || 'Failed to update event.'; }
        }
    }

    /**
     * REMOVED/REPLACED: Handles purchasing a single ticket. Now handled by cart logic.
     * (Original - Commented Out)
     */
    // async function purchaseTicket(eventId) {
    //     if (!currentUser || !authToken) { showMessageModal('Login Required', 'Log in to purchase tickets.'); showPage('login'); return; } if (!purchaseSuccessMsg) return;
    //     try { const r = await apiRequest(`/events/${eventId}/purchase`, { method: 'POST' }); const d = await r.json(); if (!r.ok) throw new Error(d.message || `HTTP error! status: ${r.status}`); const purchasedEvent = currentEvents.find(e => e._id === eventId); purchaseSuccessMsg.textContent = `Ticket purchased for "${purchasedEvent?.name || 'event'}"! View in profile.`; purchaseSuccessMsg.classList.remove('hidden'); if (!currentUser.purchasedTickets) currentUser.purchasedTickets = []; if (!currentUser.purchasedTickets.some(t => t.ticketId === d.ticket.ticketId)) { currentUser.purchasedTickets.push(d.ticket); saveAuthState(currentUser, authToken); } loadEvents(); setTimeout(() => purchaseSuccessMsg.classList.add('hidden'), 5000); }
    //     catch (error) { console.error('Purchase failed:', error); showMessageModal('Purchase Failed', error.message || 'Could not purchase ticket.'); }
    // }

    // --- NEW: Shopping Cart Functions ---

    /**
     * Handles the click event for the "Add to Cart" button.
     * @param {string} eventId - The ID of the event to add.
     */
    function handleAddToCartClick(eventId) {
        const quantityInput = document.getElementById(`qty-${eventId}`);
        const quantity = parseInt(quantityInput?.value || '1', 10);

        if (isNaN(quantity) || quantity < 1) {
            showCartMessage('Please enter a valid quantity.', true);
            return;
        }
        addToCart(eventId, quantity);
    }

    /**
     * Adds an event item to the cart or updates its quantity.
     * @param {string} eventId - The ID of the event to add/update.
     * @param {number} quantity - The quantity to add.
     */
    function addToCart(eventId, quantity) {
        if (!currentUser) {
            showMessageModal('Login Required', 'Please log in to add items to your cart.');
            showPage('login');
            return;
        }

        const event = currentEvents.find(e => e._id === eventId);
        if (!event) {
            console.error("Event details not found for adding to cart:", eventId);
            showCartMessage('Could not find event details.', true);
            return;
        }

        const existingCartItemIndex = cart.findIndex(item => item.eventId === eventId);

        if (existingCartItemIndex > -1) {
            // Update quantity if item already exists
            cart[existingCartItemIndex].quantity += quantity;
        } else {
            // Add new item to cart
            cart.push({
                eventId: event._id,
                name: event.name,
                price: event.price,
                quantity: quantity,
            });
        }

        console.log("Cart updated:", cart);
        updateCartIndicator();
        displayCart(); // Update the cart modal display
        showCartMessage(`${quantity} x "${event.name}" added to cart.`);
    }

    /**
     * Removes an item completely from the cart.
     * @param {string} eventId - The ID of the event to remove.
     */
    function removeFromCart(eventId) {
        cart = cart.filter(item => item.eventId !== eventId);
        console.log("Item removed, Cart:", cart);
        updateCartIndicator();
        displayCart(); // Update the cart modal display
    }

    /**
     * Updates the quantity of a specific item in the cart.
     * @param {string} eventId - The ID of the event to update.
     * @param {number} newQuantity - The new quantity for the item.
     */
    function updateCartItemQuantity(eventId, newQuantity) {
        const quantity = parseInt(newQuantity, 10);
        const itemIndex = cart.findIndex(item => item.eventId === eventId);

        if (itemIndex > -1) {
            if (isNaN(quantity) || quantity <= 0) {
                // If invalid quantity or zero, remove the item
                removeFromCart(eventId);
            } else {
                // Ensure quantity doesn't exceed a max limit if needed (e.g., 10)
                cart[itemIndex].quantity = Math.min(quantity, 10); // Example limit
                console.log("Quantity updated, Cart:", cart);
                updateCartIndicator();
                displayCart(); // Update the cart modal display
            }
        }
    }

    /**
     * Updates the cart item count indicator in the navigation bar.
     */
    function updateCartIndicator() {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

        if (cartItemCountElement) {
            if (totalItems > 0) {
                cartItemCountElement.textContent = totalItems;
                cartItemCountElement.classList.remove('hidden');
            } else {
                cartItemCountElement.classList.add('hidden');
            }
        }
    }

    /**
     * Renders the current cart items into the cart modal.
     */
    function displayCart() {
        if (!cartItemsContainer || !cartTotalPriceElement || !confirmPurchaseButton) return;

        cartItemsContainer.innerHTML = ''; // Clear previous items
        let totalPrice = 0;

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p class="text-gray-500 text-center py-4">Your cart is empty.</p>';
            confirmPurchaseButton.disabled = true; // Disable purchase if cart is empty
        } else {
            cart.forEach(item => {
                const itemTotal = item.price * item.quantity;
                totalPrice += itemTotal;

                const cartItemElement = document.createElement('div');
                cartItemElement.className = 'cart-item';
                cartItemElement.innerHTML = `
                    <div class="cart-item-details">
                        <p class="cart-item-name">${item.name}</p>
                        <p class="cart-item-price">₹${item.price.toFixed(2)} x ${item.quantity} = ₹${itemTotal.toFixed(2)}</p>
                    </div>
                    <div class="cart-item-actions">
                        <input
                            type="number"
                            value="${item.quantity}"
                            min="1"
                            max="10" class="cart-item-quantity"
                            aria-label="Quantity for ${item.name}"
                            onchange="updateCartItemQuantity('${item.eventId}', this.value)"
                         >
                        <button onclick="removeFromCart('${item.eventId}')" class="cart-remove-button" aria-label="Remove ${item.name} from cart">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                `;
                cartItemsContainer.appendChild(cartItemElement);
            });
            confirmPurchaseButton.disabled = false; // Enable purchase button
        }

        cartTotalPriceElement.textContent = `₹${totalPrice.toFixed(2)}`;
    }

    /**
     * Toggles the visibility of the cart modal.
     * @param {boolean} show - True to show, false to hide.
     */
    function toggleCartModal(show) {
        if (!cartModal) return;
        if (show) {
            displayCart(); // Update cart content before showing
            cartModal.classList.remove('hidden');
        } else {
            cartModal.classList.add('hidden');
            cartError.textContent = ''; // Clear errors when closing
        }
    }

    /**
     * Handles the "Confirm Purchase" button click.
     * Sends cart data to the backend.
     */
    async function handleConfirmPurchase() {
        if (!currentUser) {
            toggleCartModal(false);
            showMessageModal('Login Required', 'Please log in to complete your purchase.');
            showPage('login');
            return;
        }

        if (cart.length === 0) {
            cartError.textContent = 'Your cart is empty.';
            return;
        }

        // Disable button to prevent multiple clicks
        confirmPurchaseButton.disabled = true;
        confirmPurchaseButton.textContent = 'Processing...';
        cartError.textContent = '';

        // Format cart data for the backend
        const orderData = {
            cartItems: cart.map(item => ({
                eventId: item.eventId,
                quantity: item.quantity,
            })),
        };

        try {
            const response = await apiRequest('/orders', { // Call the new endpoint
                method: 'POST',
                body: JSON.stringify(orderData),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || `HTTP error! status: ${response.status}`);
            }

            // Purchase successful
            cart = []; // Clear the cart
            updateCartIndicator();
            displayCart(); // Update modal to show empty cart
            toggleCartModal(false); // Close modal
            // Show success message using the generic modal
            showMessageModal('Purchase Successful', result.message || 'Purchase successful! Check your email for ticket details.');
            // Refresh events page to show "Purchased" status potentially
            if (document.getElementById('events-page')?.classList.contains('active')) {
                 loadEvents();
            }
            // Optionally navigate to profile page after a delay or user confirmation
            // setTimeout(() => showPage('profile'), 2000);

        } catch (error) {
            console.error('Purchase confirmation failed:', error);
            cartError.textContent = error.message || 'Failed to confirm purchase. Please try again.';
        } finally {
            // Re-enable button
            confirmPurchaseButton.disabled = cart.length === 0; // Disable only if cart became empty
            confirmPurchaseButton.textContent = 'Confirm Purchase';
        }
    }

    /**
     * Shows a temporary message related to cart actions on the events page.
     * @param {string} message - The message to display.
     * @param {boolean} isError - Optional: True if it's an error message.
     */
    function showCartMessage(message, isError = false) {
        if (!cartMessage) return;
        cartMessage.textContent = message;
        cartMessage.classList.remove('hidden', 'bg-red-100', 'text-red-700', 'bg-blue-100', 'text-blue-700');

        if (isError) {
            cartMessage.classList.add('bg-red-100', 'text-red-700');
        } else {
            cartMessage.classList.add('bg-blue-100', 'text-blue-700');
        }

        // Hide the message after a few seconds
        setTimeout(() => {
            cartMessage.classList.add('hidden');
        }, 3000);
    }


    // --- Event Listeners ---
    // (Keep original listeners)
    loginForm?.addEventListener('submit', handleLogin);
    registerForm?.addEventListener('submit', handleRegister);
    createEventForm?.addEventListener('submit', handleCreateEvent);
    editEventForm?.addEventListener('submit', handleUpdateEvent);
    // Note: Cart button clicks (Add, Remove, Confirm) are handled by inline onclick handlers for simplicity here

    // Add event listener to close cart modal if clicking outside the content
    cartModal?.addEventListener('click', (event) => {
        if (event.target === cartModal) {
            toggleCartModal(false);
        }
    });


    // --- Initial Load ---
    // (Modified to include cart indicator update)
    document.addEventListener('DOMContentLoaded', () => {
        loadAuthState();
        updateLoginStateUI(); // Updates nav and cart indicator based on login state
        const initialPage = currentUser ? 'events' : 'login';
        showPage(initialPage);
        // Initialize cart display (optional, if cart persists in localStorage/sessionStorage)
        // loadCartFromStorage(); // Example function if using storage
        updateCartIndicator(); // Ensure indicator is correct on load
    });
    