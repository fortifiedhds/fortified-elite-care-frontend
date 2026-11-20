import { useId } from "react";
import { monthlyDays, ordinal } from "../../shared/lib/monthly-schedule";
export function MonthlyDayField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const id = useId();
  return (
    <div className="stack">
      <label htmlFor={id}>
        Preferred monthly visit day
        <select
          id={id}
          required
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-describedby={id + "-help"}
        >
          <option value="">Choose a day each month</option>
          {monthlyDays.map((day) => (
            <option key={day} value={day}>
              {ordinal(day)} of every month
            </option>
          ))}
        </select>
      </label>
      <p className="muted" id={id + "-help"}>
        {value
          ? "Your preference is the " +
            ordinal(Number(value)) +
            " of every month."
          : "Choose a day from the 1st to the 31st."}{" "}
        {Number(value) > 28 && "In shorter months, we use the last day. "}
        Appointments are confirmed separately.
      </p>
    </div>
  );
}
