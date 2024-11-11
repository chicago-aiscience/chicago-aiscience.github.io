import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { expect, test } from "vitest";
import Sidebar from "@/components/Sidebar.astro";

test("Sidebar renders navigation structure", async () => {
  const container = await AstroContainer.create();
  const result = await container.renderToString(Sidebar);

  expect(result).includes('href="/research"');
  expect(result).includes('href="/fellows"');
  expect(result).includes('href="/about"');
});
