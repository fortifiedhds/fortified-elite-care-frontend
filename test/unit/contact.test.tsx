import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ContactForm } from "../../src/features/public/components/ContactForm";
import { PublicPage } from "../../src/features/public/PublicPage";
import {
  careAddress,
  careEmail,
  carePhone,
  careWhatsApp,
} from "../../src/shared/lib/contact";
import { fail, ok, reply, view } from "../fixtures";

function fill(topic = "CARE_ENQUIRY") {
  fireEvent.change(screen.getByLabelText("Full name *"), {
    target: { value: "Ada Adebayo" },
  });
  fireEvent.change(screen.getByLabelText("Email address *"), {
    target: { value: "ada@example.test" },
  });
  fireEvent.change(screen.getByLabelText("What’s your message about? *"), {
    target: { value: topic },
  });
  fireEvent.change(screen.getByLabelText("Your message *"), {
    target: { value: "Please tell me about the care packages." },
  });
  fireEvent.click(screen.getByRole("checkbox", { name: /I agree that FEC/ }));
}

describe("public contact form", () => {
  it("adapts the company contact layout with office, email, phone, WhatsApp and a message form", () => {
    view(<PublicPage page="contact" signedIn={false} />, "/contact");
    expect(
      screen.getByRole("heading", { name: "How can we help?" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("form", { name: "Contact the FEC team" }),
    ).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "Send us a message" })
        .getAttribute("href"),
    ).toBe("#contact-form");
    expect(
      screen.getByRole("link", { name: careEmail }).getAttribute("href"),
    ).toBe("mailto:" + careEmail);
    expect(
      screen.getByRole("link", { name: carePhone }).getAttribute("href"),
    ).toBe("tel:" + carePhone.replaceAll(" ", ""));
    expect(
      screen.getByRole("link", { name: careWhatsApp }).getAttribute("href"),
    ).toBe("https://wa.me/" + careWhatsApp.replace("+", ""));
    expect(screen.getByText(careAddress)).toBeTruthy();
    expect(
      screen.getByTitle("Fortified HDS office in Ibadan").getAttribute("src"),
    ).toContain(encodeURIComponent(careAddress));
    expect(
      screen.getByText(/For emergencies, seek immediate medical care/, {
        selector: "p",
      }),
    ).toBeTruthy();
  });
  it("submits a trimmed enquiry and optional contact details, then shows confirmation and clears the form", async () => {
    const post = reply("POST", { "/contact": ok({ sent: true }) });
    view(<ContactForm />);
    fill();
    fireEvent.change(screen.getByLabelText("Full name *"), {
      target: { value: " Ada Adebayo " },
    });
    fireEvent.change(screen.getByLabelText("Organisation (optional)"), {
      target: { value: " Example Ltd " },
    });
    fireEvent.change(screen.getByLabelText("Phone number (optional)"), {
      target: { value: "+234 (800) 000-0000" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));
    expect(
      await screen.findByRole("heading", {
        name: /Thank you for getting in touch/,
      }),
    ).toBeTruthy();
    expect(post).toHaveBeenCalledWith("/contact", {
      body: {
        name: "Ada Adebayo",
        email: "ada@example.test",
        topic: "CARE_ENQUIRY",
        message: "Please tell me about the care packages.",
        organisation: "Example Ltd",
        phone: "+234 (800) 000-0000",
        privacyAccepted: true,
        website: undefined,
      },
    });
    expect(screen.getByRole("status").textContent).toContain(
      "ada@example.test",
    );
    expect(document.activeElement).toBe(screen.getByRole("status"));
    fireEvent.click(
      screen.getByRole("button", { name: "Send another message" }),
    );
    expect(
      (screen.getByLabelText("Full name *") as HTMLInputElement).value,
    ).toBe("");
    expect(document.activeElement).toBe(screen.getByLabelText("Full name *"));
    expect(screen.getByText("0 / 5,000")).toBeTruthy();
  });
  it.each(["CARE_ENQUIRY", "FEEDBACK", "CAREERS", "GENERAL"])(
    "sends the %s topic without requiring optional organisation or phone",
    async (topic) => {
      const post = reply("POST", { "/contact": ok({ sent: true }) });
      view(<ContactForm />);
      fill(topic);
      fireEvent.click(screen.getByRole("button", { name: "Send message" }));
      await screen.findByRole("status");
      expect(post).toHaveBeenCalledWith("/contact", {
        body: expect.objectContaining({
          topic,
          organisation: undefined,
          phone: undefined,
          privacyAccepted: true,
        }),
      });
    },
  );
  it("requires contact details, a topic and permission to respond before making a request", async () => {
    const post = reply("POST", { "/contact": ok({ sent: true }) });
    view(<ContactForm />);
    fireEvent.submit(screen.getByRole("form"));
    expect(post).not.toHaveBeenCalled();
    fill();
    fireEvent.click(screen.getByRole("checkbox", { name: /I agree that FEC/ }));
    fireEvent.submit(screen.getByRole("form"));
    expect(post).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("checkbox", { name: /I agree that FEC/ }));
    fireEvent.change(screen.getByLabelText("Email address *"), {
      target: { value: "not-an-email" },
    });
    fireEvent.submit(screen.getByRole("form"));
    expect(post).not.toHaveBeenCalled();
  });
  it("keeps the form and message intact after failure, offers direct email and retries successfully", async () => {
    const post = reply("POST", {
      "/contact": fail(503, "SMTP server credentials detail"),
    });
    view(<ContactForm />);
    fill("FEEDBACK");
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));
    expect((await screen.findByRole("alert")).textContent).toBe(
      "We couldn’t complete your request. Please try again shortly.",
    );
    expect(
      screen.getByRole("link", { name: careEmail }).getAttribute("href"),
    ).toBe("mailto:" + careEmail);
    expect(
      (screen.getByLabelText("Your message *") as HTMLTextAreaElement).value,
    ).toBe("Please tell me about the care packages.");
    expect(
      (screen.getByLabelText("Email address *") as HTMLInputElement).value,
    ).toBe("ada@example.test");
    post.mockResolvedValue(ok({ sent: true }) as never);
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));
    await screen.findByRole("status");
    expect(post).toHaveBeenCalledTimes(2);
  });
  it("disables the form and duplicate submission while delivery is pending", async () => {
    let complete: (result: ReturnType<typeof ok>) => void = () => {};
    const post = reply("POST", {
      "/contact": () =>
        new Promise((resolve) => {
          complete = resolve;
        }),
    });
    view(<ContactForm />);
    fill();
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));
    expect(
      (
        screen.getByRole("button", {
          name: "Sending your message…",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    expect(
      (
        screen
          .getByLabelText("Full name *")
          .closest("fieldset") as HTMLFieldSetElement
      ).disabled,
    ).toBe(true);
    fireEvent.submit(screen.getByRole("form"));
    expect(post).toHaveBeenCalledTimes(1);
    complete(ok({ sent: true }));
    await screen.findByRole("status");
  });
  it("shows useful validation and rate-limit feedback without exposing implementation errors", async () => {
    const post = reply("POST", {
      "/contact": fail(400, "Write a message between 10 and 5,000 characters."),
    });
    view(<ContactForm />);
    fill();
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));
    expect((await screen.findByRole("alert")).textContent).toContain(
      "Write a message",
    );
    post.mockResolvedValue(fail(429, "ThrottlerException") as never);
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));
    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toContain(
        "Please wait a moment",
      ),
    );
  });
  it("updates the counter as someone writes and includes the privacy policy", async () => {
    view(<ContactForm />);
    await userEvent
      .setup()
      .type(screen.getByLabelText("Your message *"), "Hello FEC team");
    expect(screen.getByText("14 / 5,000")).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "Privacy and confidentiality" })
        .getAttribute("href"),
    ).toBe("/privacy");
  });
});
