import type { components } from "../../shared/api/schema";

export type Schemas = components["schemas"];

export type Answers = Record<string, string | string[]>;

export type Field = Schemas["FormField"];

export type RecordView = Schemas["FormView"];

export type Definition = Schemas["FormDefinition"];

export type DraftInput = Schemas["FormInput"];

export type Registration = Schemas["RegistrationView"];

export type ConsentView = Schemas["ConsentView"];

export type Choices = Schemas["ConsentChoices"];

export type Recipient = Schemas["Recipient"];

export type Kind =
  "REGISTRATION" | "BASELINE_SELF" | "BASELINE_CLINICIAN" | "CONSULTATION";

export type Load<T> = (signal: AbortSignal) => Promise<T>;
