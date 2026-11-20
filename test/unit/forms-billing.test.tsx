import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { ServiceAgreement } from "../../src/features/agreements/ServiceAgreement";
import { Billing } from "../../src/features/billing/Billing";
import { RegistrationReview } from "../../src/features/care-forms/admin/RegistrationReview";
import { DraftWizard } from "../../src/features/care-forms/components/DraftWizard";
import { ClinicianBaseline } from "../../src/features/care-forms/doctor/ClinicianBaseline";
import {
  ConsultationFields,
  SignedNoteDetails,
} from "../../src/features/care-forms/doctor/Consultation";
import { CarePermissions } from "../../src/features/care-forms/patient/CarePermissions";
import {
  PatientForm,
  PatientFormsPanel,
} from "../../src/features/care-forms/patient/PatientForm";
import type { Answers, Definition } from "../../src/features/care-forms/types";
import { api, UserFacingError } from "../../src/shared/api/client";
import { fail, ok, patient, pending, reply, view } from "../fixtures";

const version = "fec-forms-v1";
const timestamp = "2026-11-11T08:30:00Z";
const initial = { version, revision: 0, answers: {} };
const definition: Definition = {
  version,
  sections: [
    {
      title: "About you",
      description: "Personal details",
      fields: [
        { id: "first-name", label: "First name", type: "text" },
        { id: "email-address", label: "Email address", type: "email" },
      ],
    },
    {
      title: "Care preferences",
      description: "How we can help",
      fields: [
        {
          id: "language",
          label: "Language",
          type: "select",
          options: ["English", "Yoruba"],
        },
        {
          id: "support",
          label: "Support",
          type: "checks",
          options: ["Transport", "Visits"],
        },
        { id: "notes", label: "Notes", type: "textarea" },
      ],
    },
  ],
};
const permissions = {
  version: "fec-care-choices-v2",
  choices: {
    healthAssessment: true,
    homeVisits: true,
    sampleCollection: false,
    education: false,
    referrals: true,
    sharing: false,
    emergencyContact: true,
  },
  recipients: [],
};
const formBody = (answers: Answers, submit = false, revision = 0) => ({
  version,
  answers,
  submit,
  revision,
});

describe("registration and assessment wizard", () => {
  it("validates and saves a patient registration draft through the expected endpoint", async () => {
    reply("GET", {
      "/forms/{kind}/definition": ok(definition),
      "/patients/forms/{kind}": ok(initial),
    });
    const patch = reply("PATCH", {
      "/patients/forms/{kind}": ok({
        ...initial,
        revision: 1,
        answers: { "first-name": "Ada", "email-address": patient.email },
      }),
    });
    view(
      <PatientForm kind="REGISTRATION" account={patient} />,
      "/portal/registration",
    );
    await screen.findByRole("heading", { name: "About you" });
    expect(
      (screen.getByLabelText("Email address") as HTMLInputElement).value,
    ).toBe(patient.email);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("First name"), "Ada");
    await user.click(screen.getByRole("button", { name: "Save and exit" }));
    expect(patch).toHaveBeenCalledWith("/patients/forms/{kind}", {
      params: { path: { kind: "REGISTRATION" } },
      body: formBody({ "first-name": "Ada", "email-address": patient.email }),
    });
    await waitFor(() =>
      expect(screen.getByLabelText("Current route").textContent).toBe(
        "/portal",
      ),
    );
  });

  it("resumes a stored draft at the next incomplete step and submits all selected control values", async () => {
    const stored = { version, revision: 2, answers: { "first-name": "Ada" } };
    const onSave = vi.fn(async () => ({
      ...stored,
      revision: 3,
      submittedAt: timestamp,
    }));
    view(
      <DraftWizard
        definition={definition}
        initial={stored}
        onSave={onSave}
        exit="/portal"
        description="Care form"
        submitLabel="Send for review"
      />,
    );
    const user = userEvent.setup();
    expect(
      screen.getByRole("heading", { name: "Care preferences" }),
    ).toBeTruthy();
    await user.selectOptions(screen.getByLabelText("Language"), "Yoruba");
    await user.click(screen.getByRole("checkbox", { name: "Transport" }));
    await user.click(screen.getByRole("checkbox", { name: "Visits" }));
    await user.click(screen.getByRole("checkbox", { name: "Visits" }));
    await user.type(screen.getByLabelText("Notes"), "Sample");
    await user.click(screen.getByText("Review your answers"));
    expect(screen.getByText("Yoruba", { selector: "dd" })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Send for review" }));
    expect(onSave).toHaveBeenCalledWith(
      formBody(
        {
          "first-name": "Ada",
          language: "Yoruba",
          support: ["Transport"],
          notes: "Sample",
        },
        true,
        2,
      ),
    );
    expect(await screen.findByText(/This form is read only/)).toBeTruthy();
  });

  it("preserves answers while moving between steps and surfaces a stale draft error", async () => {
    const onSave = vi.fn(async () => {
      throw new UserFacingError("Reload before editing.");
    });
    view(
      <DraftWizard
        definition={definition}
        initial={initial}
        onSave={onSave}
        exit="/portal"
        description="Care form"
        submitLabel="Submit form"
      />,
    );
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("First name"), "Ada");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(
      (screen.getByLabelText("First name") as HTMLInputElement).value,
    ).toBe("Ada");
    await user.click(screen.getByRole("button", { name: "Save and exit" }));
    expect((await screen.findByRole("alert")).textContent).toBe(
      "Reload before editing.",
    );
  });

  it("retries form loading after a failed request", async () => {
    let attempt = 0;
    reply("GET", {
      "/forms/{kind}/definition": () =>
        ++attempt === 1 ? fail(503, "Temporarily unavailable") : ok(definition),
      "/patients/forms/{kind}": ok(initial),
    });
    view(<PatientForm kind="REGISTRATION" account={patient} />);
    expect((await screen.findByRole("alert")).textContent).toBe(
      "We couldn’t complete your request. Please try again shortly.",
    );
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Try again" }));
    expect(
      await screen.findByRole("heading", { name: "About you" }),
    ).toBeTruthy();
  });

  it("blocks a pending patient's assessment and lists the form shortcuts", () => {
    reply("GET", {
      "/forms/{kind}/definition": ok(definition),
      "/patients/forms/{kind}": ok(initial),
    });
    view(
      <>
        <PatientForm kind="BASELINE_SELF" account={pending(patient)} />
        <PatientFormsPanel />
      </>,
    );
    expect(screen.getByText("Your enrolment is awaiting review")).toBeTruthy();
    expect(
      screen
        .getAllByRole("link", { name: "Open form" })
        .map((link) => link.getAttribute("href")),
    ).toEqual(["/portal/registration", "/portal/baseline", "/portal/consent"]);
  });

  it("shows the submitted self-report on the clinician assessment and saves it by assigned visit ID", async () => {
    reply("GET", {
      "/forms/{kind}/definition": ok(definition),
      "/visits/{id}/baseline": ok({
        ...initial,
        selfReport: {
          ...initial,
          revision: 1,
          answers: { "first-name": "Patient answer" },
          submittedAt: timestamp,
        },
      }),
    });
    const patch = reply("PATCH", {
      "/visits/{id}/baseline": ok({ ...initial, revision: 1 }),
    });
    view(
      <ClinicianBaseline id="visit-1" />,
      "/portal/assigned/visit-1/baseline",
    );
    await screen.findByText("Submitted patient self-report");
    await userEvent
      .setup()
      .click(screen.getByText("Submitted patient self-report"));
    expect(screen.getByText("Patient answer")).toBeTruthy();
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Save and exit" }));
    expect(patch).toHaveBeenCalledWith("/visits/{id}/baseline", {
      params: { path: { id: "visit-1" } },
      body: formBody({}),
    });
    await waitFor(() =>
      expect(screen.getByLabelText("Current route").textContent).toBe(
        "/portal/assigned",
      ),
    );
  });
});

describe("care permissions, consultation and official review", () => {
  it("adds and removes recipients and sends the selected sharing choices with the template version", async () => {
    reply("GET", { "/patients/care-permissions": ok(permissions) });
    const post = reply("POST", {
      "/patients/care-permissions": ok(
        { ...permissions, recordedAt: timestamp },
        201,
      ),
    });
    view(<CarePermissions />);
    const sharing = await screen.findByRole("group", {
      name: "Sharing with named contacts",
    });
    fireEvent.click(within(sharing).getByRole("radio", { name: "Yes" }));
    const person = screen.getByRole("group", { name: "Named person 1" });
    fireEvent.change(within(person).getByLabelText("Name"), {
      target: { value: "Sample Contact" },
    });
    fireEvent.change(within(person).getByLabelText("Relationship"), {
      target: { value: "Sibling" },
    });
    fireEvent.change(within(person).getByLabelText("Phone number"), {
      target: { value: "+234 1234567" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Add another contact" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Remove second contact" }),
    );
    expect(screen.queryByRole("group", { name: "Named person 2" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Save care choices" }));
    expect(post).toHaveBeenCalledWith("/patients/care-permissions", {
      body: {
        version: permissions.version,
        choices: { ...permissions.choices, sharing: true },
        recipients: [
          {
            name: "Sample Contact",
            relationship: "Sibling",
            phone: "+234 1234567",
          },
        ],
      },
    });
    expect(
      await screen.findByText("Your updated choices are saved."),
    ).toBeTruthy();
  });

  it("requires a complete choice set and reports the API error when saving fails", async () => {
    reply("GET", {
      "/patients/care-permissions": ok({
        ...permissions,
        choices: { ...permissions.choices, sharing: undefined },
      }),
    });
    const post = reply("POST", {
      "/patients/care-permissions": fail(409, "Reload care permissions."),
    });
    view(<CarePermissions />);
    const group = await screen.findByRole("group", {
      name: "Sharing with named contacts",
    });
    const button = screen.getByRole("button", { name: "Save care choices" });
    fireEvent.submit(button.closest("form")!);
    expect((await screen.findByRole("alert")).textContent).toBe(
      "Choose yes or no for each activity.",
    );
    expect(post).not.toHaveBeenCalled();
    await userEvent
      .setup()
      .click(within(group).getByRole("radio", { name: "No" }));
    await userEvent.setup().click(button);
    expect((await screen.findByRole("alert")).textContent).toBe(
      "Reload care permissions.",
    );
  });

  it("loads controlled consultation fields and writes the selected value through the parent", async () => {
    const consultation: Definition = {
      version,
      sections: [
        {
          title: "Clinical notes",
          description: "Recorded by the assigned doctor",
          fields: [
            {
              id: "client-concerns",
              label: "Client concerns",
              type: "textarea",
            },
          ],
        },
      ],
    };
    reply("GET", { "/forms/{kind}/definition": ok(consultation) });
    function Host() {
      const [value, set] = useState<Answers>({});
      return (
        <>
          <ConsultationFields value={value} update={set} />
          <output>{JSON.stringify(value)}</output>
        </>
      );
    }
    view(<Host />);
    const user = userEvent.setup();
    await user.click(screen.getByText("Consultation note sections"));
    await user.type(
      await screen.findByLabelText("Client concerns"),
      "Synthetic",
    );
    expect(
      screen.getByText(JSON.stringify({ "client-concerns": "Synthetic" })),
    ).toBeTruthy();
  });

  it("requires confirmation for a signed addendum and appends the saved correction", async () => {
    reply("GET", {
      "/forms/{kind}/definition": ok(definition),
      "/visits/{id}/addenda": ok([]),
    });
    const post = reply("POST", {
      "/visits/{id}/addenda": ok(
        {
          id: "addendum",
          correction: "Updated detail",
          reason: "Clarification",
          signedAt: timestamp,
        },
        201,
      ),
    });
    view(<SignedNoteDetails id="visit-1" structured={{ notes: "Internal" }} />);
    const user = userEvent.setup();
    await user.click(screen.getByText("Signed addenda"));
    await user.type(screen.getByLabelText("Correction"), "Updated detail");
    await user.type(screen.getByLabelText("Reason"), "Clarification");
    await user.click(screen.getByRole("button", { name: "Review addendum" }));
    expect(post).not.toHaveBeenCalled();
    await user.click(
      screen.getByRole("button", { name: "Confirm addendum signature" }),
    );
    expect(post).toHaveBeenCalledWith("/visits/{id}/addenda", {
      params: { path: { id: "visit-1" } },
      body: { correction: "Updated detail", reason: "Clarification" },
    });
    expect(
      await screen.findByText("Updated detail", { selector: "p" }),
    ).toBeTruthy();
  });

  it("loads a submitted registration and records client number and requested package separately", async () => {
    reply("GET", {
      "/forms/{kind}/definition": ok(definition),
      "/admin/registrations/{id}": ok({
        ...initial,
        answers: { "first-name": "Ada" },
        submittedAt: timestamp,
      }),
    });
    const patch = reply("PATCH", { "/admin/registrations/{id}": ok(true) });
    view(<RegistrationReview id={patient.id} />);
    expect(await screen.findByText("Ada")).toBeTruthy();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Client number"), "FEC-100");
    await user.selectOptions(
      screen.getByLabelText("Requested package"),
      "Gold",
    );
    await user.click(screen.getByRole("button", { name: "Save review" }));
    expect(patch).toHaveBeenCalledWith("/admin/registrations/{id}", {
      params: { path: { id: patient.id } },
      body: { clientNumber: "FEC-100", requestedPackage: "Gold" },
    });
    expect(await screen.findByText("Review recorded.")).toBeTruthy();
  });
});

describe("quote and agreement pages", () => {
  it("shows all packages, updates the quote interval and performs no checkout call", async () => {
    view(<Billing />);
    for (const name of ["Silver", "Gold", "Platinum"])
      expect(screen.getByRole("heading", { name })).toBeTruthy();
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Every six months" }));
    expect(
      screen
        .getByRole("button", { name: "Every six months" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
    expect(
      screen
        .getByRole("link", { name: "Request a quote" })
        .getAttribute("href"),
    ).toMatch(/Every%20six%20months/);
    expect(
      screen.queryByRole("button", { name: /checkout|pay now/i }),
    ).toBeNull();
    expect(api.POST).not.toHaveBeenCalled();
  });

  it("shows agreement terms as information and keeps permissions separate", async () => {
    view(<ServiceAgreement />);
    await userEvent.setup().click(screen.getByText("Fees and payment"));
    expect(
      screen.getByText(/care team will provide your agreed fee/),
    ).toBeTruthy();
    expect(screen.getByText("Online signing is not available.")).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "Review care permissions" })
        .getAttribute("href"),
    ).toBe("/portal/consent");
  });
});
