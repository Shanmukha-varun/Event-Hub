
# 🎟️ EventHub

**EventHub** is a full-stack event management and online ticketing platform that allows users to discover events and purchase tickets, and enables event organizers to create, manage, and track their listings.

---

## 🚀 Live Demo

👉 [https://evehub.netlify.app](https://evehub.netlify.app)

---

## 📌 Features

- 🔐 Secure user authentication using JWT
- 📆 Create, update, and delete events (organizer access)
- 🎫 Ticket purchase simulation with shopping cart
- 📧 Email confirmations with QR code (Mailtrap for testing)
- 🖼️ User-friendly UI with Tailwind CSS
- 📱 Responsive layout (Desktop preferred, Mobile mostly behaves 😅)
- 🧠 Clean REST API with proper middleware and route separation

---

## 🛠️ Tech Stack

### Backend

- Node.js, Express.js
- MongoDB (Mongoose ODM)
- JWT, bcryptjs
- Nodemailer, QRCode
- dotenv, cors

### Frontend

- HTML5, Tailwind CSS
- Vanilla JavaScript
- qrcodejs (for in-browser QR display)

---

## 📁 Folder Structure

```

FINAL/
├── eventhub-backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── .env
│   ├── server.js
├── frontend/
│   ├── index.html
│   ├── styles.css
│   ├── script.js

````

---

## 📦 Installation (Local)

```bash
# Clone the repo
git clone https://github.com/Shanmukha-varun/Event-Hub.git
cd Event-Hub

# Install backend dependencies
cd eventhub-backend
npm install

# Create your .env file (see below)
touch .env

# Example .env contents:
MONGO_URI=your_mongo_connection_string
JWT_SECRET=your_secret_key
EMAIL_USER=your_mailtrap_user
EMAIL_PASS=your_mailtrap_pass

# Start backend
node server.js

# Open frontend (index.html in browser or serve with live server)
````

---

## 📬 Environment Variables

```env
MONGO_URI=your_mongo_connection_string
JWT_SECRET=your_secret_key
EMAIL_USER=your_mailtrap_username
EMAIL_PASS=your_mailtrap_password
```

---

## 🙌 Acknowledgements

Built with endless coffee ☕, debugging patience, and massive help from **Gemini 2.5 Pro**, the unsung hero of this build. 😎

---

## 📄 License

MIT © 2025 Shanmukha Varun

````

