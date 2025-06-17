const nodemailer = require('nodemailer');
const { generateQRCodeDataURL } = require('./qrCodeService'); // Keep QR service import

// --- Nodemailer Transporter Setup for Mailtrap ---
// Configure the transporter using environment variables for Mailtrap
let transporter;
if (process.env.MAILTRAP_HOST && process.env.MAILTRAP_USER && process.env.MAILTRAP_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.MAILTRAP_HOST,
    port: parseInt(process.env.MAILTRAP_PORT || "2525", 10), // Default to 2525 if not set
    secure: false, // Mailtrap uses STARTTLS which begins as insecure
    auth: {
      user: process.env.MAILTRAP_USER,
      pass: process.env.MAILTRAP_PASS,
    },
    tls: {
      // do not fail on invalid certs if testing locally sometimes needed
      // rejectUnauthorized: false
    }
  });
  console.log("Nodemailer transporter configured for Mailtrap.");
} else {
  console.error("Mailtrap credentials (HOST, USER, PASS) not fully set in .env. Email sending will be disabled.");
  // Create a dummy transporter to prevent errors if needed for testing logic flow
  transporter = {
      sendMail: async (mailOptions) => {
          console.log("Dummy email send (Mailtrap credentials missing):", mailOptions.subject);
          return { messageId: 'dummy_id_' + Date.now() }; // Mock response
      }
  };
}


/**
 * Sends an order confirmation email with ticket details and embedded QR codes via Mailtrap.
 * @param {object} user - The user object (needs name, email, _id).
 * @param {Array<object>} createdTickets - Array of newly created ticket objects from user model.
 * @param {Map<string, object>} eventDetailsMap - Map of eventId to event details (name, date, location).
 */
const sendOrderConfirmationEmail = async (user, createdTickets, eventDetailsMap) => {
  if (!transporter || !process.env.MAILTRAP_USER) { // Check if transporter is properly initialized
     console.warn('Mailtrap transporter not initialized or credentials missing. Skipping order confirmation email.');
     return;
  }
  if (!user || !createdTickets || createdTickets.length === 0 || !eventDetailsMap) {
    console.error('Missing data for sending order confirmation email.');
    return;
  }

  try {
    // Use SENDER_EMAIL from .env or a fallback for the 'from' address
    const senderEmail = process.env.SENDER_EMAIL || 'noreply@eventhub.test';
    const senderName = "EventHub"; // Or customize as needed

    let emailHtml = `<h1>Your EventHub Order Confirmation</h1>`;
    emailHtml += `<p>Hi ${user.name},</p>`;
    emailHtml += `<p>Thank you for your purchase! Here are your ticket details:</p>`;
    emailHtml += `<hr>`;

    const attachments = []; // For embedding QR codes using CID

    for (let i = 0; i < createdTickets.length; i++) {
      const ticket = createdTickets[i];
      const event = eventDetailsMap.get(ticket.eventId.toString());

      if (!event) {
        console.warn(`Event details not found for ticket with eventId: ${ticket.eventId}`);
        continue;
      }

      // Generate QR Code Data URL
      const qrCodeData = `TICKET_ID:${ticket.ticketId};EVENT_ID:${ticket.eventId};USER_ID:${user._id}`;
      const qrCodeDataURL = await generateQRCodeDataURL(qrCodeData);

      // Prepare CID attachment for embedding with Nodemailer
      const cid = `qrcode_${ticket.ticketId}`; // Unique Content ID
      attachments.push({
        filename: `qrcode_${ticket.ticketId}.png`,
        path: qrCodeDataURL, // Use data URL directly
        cid: cid // Content ID for embedding in HTML
      });

      // Add ticket details to email body, using CID for the image source
      emailHtml += `
        <div style="border: 1px solid #eee; padding: 15px; margin-bottom: 15px; border-radius: 5px;">
          <h2>${event.name}</h2>
          <p><strong>Date:</strong> ${new Date(event.date).toLocaleString()}</p>
          <p><strong>Location:</strong> ${event.location}</p>
          <p><strong>Ticket ID:</strong> ${ticket.ticketId}</p>
          <p><strong>Purchase Date:</strong> ${new Date(ticket.purchaseDate).toLocaleString()}</p>
          <p><strong>Your QR Code (for check-in):</strong></p>
          <img src="cid:${cid}" alt="Ticket QR Code" style="width:150px; height:150px; border: 1px solid #ccc;"/>
        </div>
        <hr>
      `;
    }

    emailHtml += `<p>Thank you for using EventHub!</p>`;

    // Define email options for Nodemailer
    const mailOptions = {
      from: `"${senderName}" <${senderEmail}>`, // Sender address
      to: user.email, // Receiver address (will be captured by Mailtrap)
      subject: 'Your EventHub Order Confirmation & Tickets', // Subject line
      html: emailHtml, // HTML body
      attachments: attachments, // Attachments for embedded QR codes
    };

    // Send the email using Nodemailer transporter (will be caught by Mailtrap)
    const info = await transporter.sendMail(mailOptions);
    console.log(`Order confirmation email sent TO MAILTRAP for ${user.email}. Message ID: ${info.messageId}`);

  } catch (error) {
    console.error(`Error sending order confirmation email TO MAILTRAP for ${user.email}:`, error);
  }
};


/**
 * Sends a notification email to the event creator via Mailtrap.
 * @param {string} creatorEmail - The email address of the event creator.
 * @param {object} buyerUser - The user object of the person who bought the tickets.
 * @param {Array<object>} createdTickets - Array of newly created ticket objects.
 * @param {Map<string, object>} eventDetailsMap - Map of eventId to event details (name).
 */
const sendAdminNotificationEmail = async (creatorEmail, buyerUser, createdTickets, eventDetailsMap) => {
    if (!transporter || !process.env.MAILTRAP_USER) {
       console.warn('Mailtrap transporter not initialized or credentials missing. Skipping admin notification email.');
       return;
    }
    if (!creatorEmail || !buyerUser || !createdTickets || createdTickets.length === 0 || !eventDetailsMap) {
      console.error('Missing data for sending admin notification email.');
      return;
    }

    try {
      const senderEmail = process.env.SENDER_EMAIL || 'notifications@eventhub.test';
      const senderName = "EventHub Notification";

      // --- Generate HTML content (same logic as before) ---
      const ticketsByEvent = createdTickets.reduce((acc, ticket) => { /* ... same as before ... */
        const eventIdStr = ticket.eventId.toString();
        if (!acc[eventIdStr]) {
            acc[eventIdStr] = { eventDetails: eventDetailsMap.get(eventIdStr), count: 0, ticketIds: [] };
        }
        acc[eventIdStr].count++;
        acc[eventIdStr].ticketIds.push(ticket.ticketId);
        return acc;
       }, {});
      let emailHtml = `<h1>New Ticket Purchase Notification</h1><p>Hi,</p><p>A user (${buyerUser.name} - ${buyerUser.email}) has purchased tickets for your event(s):</p><hr>`;
      for (const eventId in ticketsByEvent) {
          const data = ticketsByEvent[eventId];
          if (data.eventDetails) {
               emailHtml += `<div style="padding: 10px 0;"><p><strong>Event:</strong> ${data.eventDetails.name}</p><p><strong>Quantity Purchased:</strong> ${data.count}</p><p><strong>Ticket IDs:</strong> ${data.ticketIds.join(', ')}</p></div><hr>`;
          }
      }
      emailHtml += `<p>You can view event details in your EventHub dashboard.</p>`;
      // --- End HTML Generation ---

      // Define email options for Nodemailer
      const mailOptions = {
        from: `"${senderName}" <${senderEmail}>`,
        to: creatorEmail, // Creator's email (will be captured by Mailtrap)
        subject: `New Ticket Purchase for Your Event`,
        html: emailHtml,
      };

      // Send the email using Nodemailer transporter
      const info = await transporter.sendMail(mailOptions);
      console.log(`Admin notification email sent TO MAILTRAP for ${creatorEmail}. Message ID: ${info.messageId}`);

    } catch (error) {
        console.error(`Error sending admin notification email TO MAILTRAP for ${creatorEmail}:`, error);
    }
};


module.exports = {
  sendOrderConfirmationEmail,
  sendAdminNotificationEmail,
};