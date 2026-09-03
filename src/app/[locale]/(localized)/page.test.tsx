import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FoundationView } from "@/components/shared/foundation-view";
import frMessages from "@/i18n/messages/fr.json";

describe("French foundation page", () => {
  it("renders its visible copy from the French message catalog", () => {
    render(<FoundationView messages={frMessages.Foundation} />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: frMessages.Foundation.productName,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(frMessages.Foundation.tagline)).toBeVisible();
    expect(screen.getByText(frMessages.Foundation.status)).toBeVisible();
    expect(
      screen.getByText(new RegExp(frMessages.Foundation.milestoneName)),
    ).toBeVisible();
  });
});
