# Monthly visit preference

Patient signup, including Google onboarding, uses the Preferred monthly visit day dropdown with 1st through 31st. Patients save the recurring day rather than a complete date.

Choosing the 29th, 30th or 31st displays the shorter-month explanation. If a month has fewer days, its last day is used. The saved day is not changed: a 31st preference returns to the 31st in months that have one.

The dashboard overview describes the preference as a day of every month. My checkups separates changing the monthly day from requesting an actual visit. Saving a preference leaves existing appointments unchanged.

The routine request chooses a month and previews the actual calculated date. It explains any last-day adjustment and makes clear that the care team confirms the appointment. The request sends only the month; the API independently uses the saved preference. A draft dropdown change does not affect booking until it is saved.

The default month is the next applicable month with no known standard visit already requested. A preferred day that has passed moves the default to the following month. Extra visits keep their separate review process.

Implementation: features/scheduling/MonthlyDayField.tsx is the shared dropdown; shared/lib/monthly-schedule.ts provides ordinal labels, short-month dates and default month calculation. The backend is authoritative for permissions, dates and monthly uniqueness.

No automatic future appointments or confirmed series are created by this preference. See the backend [monthly scheduling reference](../../fortified-elite-care-backend/docs/monthly-scheduling.md) for API and migration details.
