# Contact page

## Layout and content

/contact retains the FEC header, footer and hero. The content adapts the company website’s two-column layout: contact details and office map beside an enquiry form. Columns stack below 900px and paired fields stack below 570px.

src/shared/lib/contact.ts stores the company contact email, telephone, WhatsApp number and Yemetu, Ibadan office address. The embedded Google Map is lazy loaded, labelled for accessibility and accompanied by a direct map link.

The company website and its Web3Forms integration are unchanged. FEC sends through its own API and existing Google SMTP configuration.

## Fields

| Field               | Browser behaviour                                                   |
| ------------------- | ------------------------------------------------------------------- |
| Full name           | Required; 2–100 characters; name autocomplete                       |
| Organisation        | Optional; maximum 120 characters                                    |
| Email address       | Required; native email validation; maximum 254 characters           |
| Phone number        | Optional; formatted phone characters, 5–40 characters               |
| Topic               | Required; Care and packages, Feedback, Careers or General enquiry   |
| Message             | Required; 10–5,000 characters; visible character count              |
| Response permission | Required checkbox with privacy policy link                          |
| Website             | Off-screen bot trap excluded from keyboard and assistive technology |

Careers means employment and application enquiries. It replaces the ambiguous Working with FEC label.

The handler checks native browser validity before submitting. It trims strings, omits blank optional values and posts ContactInput through the generated client. Server validation remains independent. No portal account is needed.

## Form states

While sending, the fieldset and button are disabled and the label reads Sending your message. A repeated submission is ignored. The spinner respects reduced-motion preferences.

On failure, all entered values stay in place. Safe feedback receives focus and offers the direct email address as an alternative. Server validation messages remain actionable; SMTP exceptions are hidden and rate-limit feedback asks the visitor to wait.

On success, a focusable status section confirms the message was sent and shows the visitor’s reply address. Send another message restores a blank form, resets the counter and focuses Full name. Success is shown only after the API accepts delivery.

The form advises visitors to omit medical records and other sensitive information. Permission to use contact details for replying is required. The endpoint sends one internal email and does not send an automatic acknowledgement to the supplied visitor address.

## Configuration

VITE_API_URL remains the frontend API setting. SMTP keys stay in the backend. CONTACT_RECIPIENT_EMAIL in the backend environment chooses the internal recipient, currently fhdsltd@gmail.com. The validated visitor email becomes Reply-To.

See the backend [contact reference](../../fortified-elite-care-backend/docs/contact-enquiries.md) for payload rules, rate limiting and delivery semantics. No database migration or new public form-service key is required.

## Tests

test/unit/contact.test.tsx covers page details, topic choices, optional fields, response permission, request shape, invalid inputs, pending delivery, duplicate prevention, safe errors, retries, success, reset/focus and the counter. Browser checks cover desktop, 390px and 320px layouts and a controlled failure/retry journey without sending real email.
